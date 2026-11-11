create or replace function private.get_org_members(target_organization_id uuid)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare result jsonb;
begin
  if not private.has_org_permission(target_organization_id,'organization.manage_members') then
    raise exception 'Not authorised to manage organisation members' using errcode='42501';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',om.id,
    'user_id',om.user_id,
    'role_id',om.role_id,
    'role_name',r.name,
    'status',om.status,
    'display_name',coalesce(nullif(p.display_name,''),nullif(concat_ws(' ',p.first_name,p.last_name),''),'Team member')
  ) order by lower(coalesce(p.display_name,concat_ws(' ',p.first_name,p.last_name))),om.created_at), '[]'::jsonb)
  into result
  from public.organization_members om
  left join public.roles r on r.id=om.role_id and r.organization_id=om.organization_id
  left join public.profiles p on p.id=om.user_id
  where om.organization_id=target_organization_id;
  return result;
end;
$$;

create or replace function private.assign_org_member_role(target_organization_id uuid,target_member_id uuid,target_role_id uuid)
returns boolean language plpgsql security definer set search_path=''
as $$
declare
  caller_user_id uuid := (select auth.uid());
  member_user_id uuid;
  old_role_id uuid;
  old_role_name text;
  new_role_name text;
  active_admin_count integer;
begin
  if not private.has_org_permission(target_organization_id,'organization.manage_members') then
    raise exception 'Not authorised to manage organisation members' using errcode='42501';
  end if;

  select om.user_id,om.role_id,r.name
    into member_user_id,old_role_id,old_role_name
  from public.organization_members om
  left join public.roles r on r.id=om.role_id and r.organization_id=om.organization_id
  where om.id=target_member_id and om.organization_id=target_organization_id;

  if member_user_id is null then
    raise exception 'Organisation member not found' using errcode='22023';
  end if;
  if member_user_id=caller_user_id then
    raise exception 'You cannot change your own organisation role' using errcode='42501';
  end if;

  select r.name into new_role_name from public.roles r
  where r.id=target_role_id and r.organization_id=target_organization_id;
  if new_role_name is null then
    raise exception 'The selected role does not belong to this organisation' using errcode='22023';
  end if;

  if lower(new_role_name) in ('admin','administrator','owner')
     and not private.has_org_permission(target_organization_id,'organization.manage_roles') then
    raise exception 'Only an organisation role administrator can assign a system role' using errcode='42501';
  end if;

  if lower(coalesce(old_role_name,'')) in ('admin','administrator','owner')
     and lower(new_role_name) not in ('admin','administrator','owner') then
    select count(*) into active_admin_count
    from public.organization_members om
    join public.roles r on r.id=om.role_id and r.organization_id=om.organization_id
    where om.organization_id=target_organization_id and om.status='active'
      and lower(r.name) in ('admin','administrator','owner');
    if active_admin_count<=1 then
      raise exception 'The last active organisation administrator cannot be demoted' using errcode='42501';
    end if;
  end if;

  if old_role_id=target_role_id then return true; end if;

  update public.organization_members
  set role_id=target_role_id,updated_at=now()
  where id=target_member_id and organization_id=target_organization_id;

  insert into public.security_audit_events(organization_id,actor_id,action,target_type,target_id,metadata)
  values(target_organization_id,caller_user_id,'member.role_changed','organization_member',target_member_id,
    jsonb_build_object('user_id',member_user_id,'previous_role',old_role_name,'new_role',new_role_name));
  return true;
end;
$$;

revoke all on function private.get_org_members(uuid) from public,anon;
revoke all on function private.assign_org_member_role(uuid,uuid,uuid) from public,anon;
grant execute on function private.get_org_members(uuid) to authenticated;
grant execute on function private.assign_org_member_role(uuid,uuid,uuid) to authenticated;

create or replace function public.get_org_members(target_organization_id uuid)
returns jsonb language sql stable security invoker set search_path=''
as $$ select private.get_org_members(target_organization_id); $$;
create or replace function public.assign_org_member_role(target_organization_id uuid,target_member_id uuid,target_role_id uuid)
returns boolean language sql security invoker set search_path=''
as $$ select private.assign_org_member_role(target_organization_id,target_member_id,target_role_id); $$;

revoke all on function public.get_org_members(uuid) from public,anon;
revoke all on function public.assign_org_member_role(uuid,uuid,uuid) from public,anon;
grant execute on function public.get_org_members(uuid) to authenticated;
grant execute on function public.assign_org_member_role(uuid,uuid,uuid) to authenticated;
