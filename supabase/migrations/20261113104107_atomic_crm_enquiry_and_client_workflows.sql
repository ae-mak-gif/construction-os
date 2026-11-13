-- Atomic CRM writes: company, contact and enquiry creation commit together.
-- The organisation is derived from the caller's single active membership.

create or replace function private.create_crm_client_record(
  p_company_name text,p_client_type text,p_contact_first_name text,p_contact_last_name text,
  p_email text,p_phone text,p_client_status text
)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare
  active_membership_count integer;
  target_organization_id uuid;
  target_client_id uuid;
  target_contact_id uuid;
  has_primary_contact boolean;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  select count(*),(array_agg(om.organization_id))[1]
    into active_membership_count,target_organization_id
  from public.organization_members om
  where om.user_id=(select auth.uid()) and om.status='active';
  if active_membership_count<>1 then
    raise exception 'A single active organisation membership is required' using errcode = '42501';
  end if;
  if not private.has_org_permission(target_organization_id,'crm.create') then
    raise exception 'CRM create permission required' using errcode = '42501';
  end if;
  if nullif(btrim(p_company_name),'') is null or nullif(btrim(p_contact_first_name),'') is null then
    raise exception 'Company and contact names are required' using errcode = '22023';
  end if;
  if p_client_type not in ('individual','company','organization') or p_client_status not in ('active','inactive','prospect') then
    raise exception 'Invalid client type or status' using errcode = '22023';
  end if;
  select c.id into target_client_id
  from public.clients c
  where c.organization_id=target_organization_id
    and lower(btrim(c.name))=lower(btrim(p_company_name))
    and c.status<>'inactive'
  order by c.created_at limit 1;
  if target_client_id is null then
    insert into public.clients(organization_id,name,client_type,email,phone,status)
    values(target_organization_id,btrim(p_company_name),p_client_type,nullif(btrim(p_email),''),nullif(btrim(p_phone),''),p_client_status)
    returning id into target_client_id;
  elsif p_client_status='active' then
    update public.clients set status='active',
      email=coalesce(email,nullif(btrim(p_email),'')),
      phone=coalesce(phone,nullif(btrim(p_phone),''))
    where id=target_client_id and organization_id=target_organization_id;
  end if;
  if nullif(btrim(p_email),'') is not null then
    select c.id into target_contact_id
    from public.contacts c
    where c.organization_id=target_organization_id and c.client_id=target_client_id
      and lower(c.email)=lower(btrim(p_email))
    order by c.is_primary desc,c.created_at limit 1;
  end if;
  if target_contact_id is null then
    select exists(select 1 from public.contacts c
      where c.organization_id=target_organization_id and c.client_id=target_client_id and c.is_primary)
      into has_primary_contact;
    insert into public.contacts(organization_id,client_id,first_name,last_name,email,phone,is_primary)
    values(target_organization_id,target_client_id,btrim(p_contact_first_name),
      nullif(btrim(coalesce(p_contact_last_name,'')),''),nullif(btrim(p_email),''),nullif(btrim(p_phone),''),not has_primary_contact)
    returning id into target_contact_id;
  end if;
  return jsonb_build_object('client_id',target_client_id,'contact_id',target_contact_id,'organization_id',target_organization_id);
end;
$function$;
revoke all on function private.create_crm_client_record(text,text,text,text,text,text,text) from public,anon,authenticated;

create or replace function private.create_crm_client(p_company_name text,p_contact_first_name text,p_contact_last_name text,p_email text,p_phone text)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
begin
  return private.create_crm_client_record(p_company_name,'company',p_contact_first_name,p_contact_last_name,p_email,p_phone,'active');
end;
$function$;
create or replace function public.create_crm_client(p_company_name text,p_contact_first_name text,p_contact_last_name text,p_email text,p_phone text)
returns jsonb language sql security invoker set search_path = ''
as $function$
  select private.create_crm_client(p_company_name,p_contact_first_name,p_contact_last_name,p_email,p_phone);
$function$;
revoke all on function private.create_crm_client(text,text,text,text,text) from public,anon;
grant execute on function private.create_crm_client(text,text,text,text,text) to authenticated;
revoke all on function public.create_crm_client(text,text,text,text,text) from public,anon;
grant execute on function public.create_crm_client(text,text,text,text,text) to authenticated;

create or replace function private.create_crm_enquiry(
 p_company_name text,p_contact_first_name text,p_contact_last_name text,p_email text,p_phone text,
 p_title text,p_description text,p_source text,p_estimated_value numeric
)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare
  client_contact jsonb;
  target_organization_id uuid;
  target_client_id uuid;
  target_contact_id uuid;
  target_enquiry_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if nullif(btrim(p_title),'') is null then raise exception 'Enquiry title is required' using errcode='22023'; end if;
  if p_estimated_value is not null and p_estimated_value<0 then raise exception 'Estimated value cannot be negative' using errcode='22023'; end if;
  client_contact:=private.create_crm_client_record(p_company_name,'company',p_contact_first_name,p_contact_last_name,p_email,p_phone,'prospect');
  target_organization_id:=(client_contact->>'organization_id')::uuid;
  target_client_id:=(client_contact->>'client_id')::uuid;
  target_contact_id:=(client_contact->>'contact_id')::uuid;
  insert into public.enquiries(organization_id,client_id,contact_id,title,description,source,status,estimated_value,assigned_to)
  values(target_organization_id,target_client_id,target_contact_id,btrim(p_title),
    nullif(btrim(coalesce(p_description,'')),''),nullif(btrim(coalesce(p_source,'')),''),'new',p_estimated_value,(select auth.uid()))
  returning id into target_enquiry_id;
  return jsonb_build_object('enquiry_id',target_enquiry_id,'client_id',target_client_id,'contact_id',target_contact_id,'organization_id',target_organization_id);
end;
$function$;
create or replace function public.create_crm_enquiry(
 p_company_name text,p_contact_first_name text,p_contact_last_name text,p_email text,p_phone text,
 p_title text,p_description text,p_source text,p_estimated_value numeric
)
returns jsonb language sql security invoker set search_path = ''
as $function$
  select private.create_crm_enquiry(p_company_name,p_contact_first_name,p_contact_last_name,p_email,p_phone,p_title,p_description,p_source,p_estimated_value);
$function$;
revoke all on function private.create_crm_enquiry(text,text,text,text,text,text,text,text,numeric) from public,anon;
grant execute on function private.create_crm_enquiry(text,text,text,text,text,text,text,text,numeric) to authenticated;
revoke all on function public.create_crm_enquiry(text,text,text,text,text,text,text,text,numeric) from public,anon;
grant execute on function public.create_crm_enquiry(text,text,text,text,text,text,text,text,numeric) to authenticated;

create or replace function private.convert_crm_enquiry_to_client(p_enquiry_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare
  active_membership_count integer;
  target_organization_id uuid;
  target_client_id uuid;
  target_status text;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select count(*),(array_agg(om.organization_id))[1]
    into active_membership_count,target_organization_id
  from public.organization_members om where om.user_id=(select auth.uid()) and om.status='active';
  if active_membership_count<>1 or not private.has_org_permission(target_organization_id,'crm.update') then
    raise exception 'CRM update permission required' using errcode='42501';
  end if;
  select e.client_id,e.status into target_client_id,target_status
  from public.enquiries e where e.id=p_enquiry_id and e.organization_id=target_organization_id for update;
  if not found or target_client_id is null then raise exception 'Enquiry or linked client not found' using errcode='P0002'; end if;
  if target_status='lost' then raise exception 'A lost enquiry cannot be converted to a client' using errcode='22023'; end if;
  update public.clients set status='active' where id=target_client_id and organization_id=target_organization_id;
  update public.enquiries set status='won' where id=p_enquiry_id and organization_id=target_organization_id;
  return jsonb_build_object('enquiry_id',p_enquiry_id,'client_id',target_client_id,'status','won');
end;
$function$;
create or replace function public.convert_crm_enquiry_to_client(p_enquiry_id uuid)
returns jsonb language sql security invoker set search_path = ''
as $function$
  select private.convert_crm_enquiry_to_client(p_enquiry_id);
$function$;
revoke all on function private.convert_crm_enquiry_to_client(uuid) from public,anon;
grant execute on function private.convert_crm_enquiry_to_client(uuid) to authenticated;
revoke all on function public.convert_crm_enquiry_to_client(uuid) from public,anon;
grant execute on function public.convert_crm_enquiry_to_client(uuid) to authenticated;
