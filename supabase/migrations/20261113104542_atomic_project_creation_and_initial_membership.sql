create or replace function private.create_buildflow_project(
  p_name text,p_client_id uuid,p_project_code text,p_description text,p_location text,
  p_start_date date,p_expected_completion_date date,p_contract_value numeric,p_project_manager_user_id uuid
)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare
  active_membership_count integer;
  target_organization_id uuid;
  target_project_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select count(*),(array_agg(om.organization_id))[1] into active_membership_count,target_organization_id
  from public.organization_members om where om.user_id=(select auth.uid()) and om.status='active';
  if active_membership_count<>1 then raise exception 'A single active organisation membership is required' using errcode='42501'; end if;
  if not private.has_org_permission(target_organization_id,'projects.create') then raise exception 'Project creation permission required' using errcode='42501'; end if;
  if nullif(btrim(p_name),'') is null then raise exception 'Project name is required' using errcode='22023'; end if;
  if p_contract_value is not null and p_contract_value<0 then raise exception 'Contract value cannot be negative' using errcode='22023'; end if;
  if p_start_date is not null and p_expected_completion_date is not null and p_expected_completion_date<p_start_date then
    raise exception 'Expected completion date cannot be earlier than the start date' using errcode='22023';
  end if;
  if p_client_id is not null and not exists(select 1 from public.clients c where c.id=p_client_id and c.organization_id=target_organization_id and c.status<>'inactive') then
    raise exception 'Selected client is not active in this organisation' using errcode='23503';
  end if;
  if p_project_manager_user_id is not null then
    if not exists(select 1 from public.organization_members om where om.organization_id=target_organization_id and om.user_id=p_project_manager_user_id and om.status='active') then
      raise exception 'Selected project manager is not an active organisation member' using errcode='23503';
    end if;
    if p_project_manager_user_id<>(select auth.uid()) and not private.has_org_permission(target_organization_id,'project_members.manage') then
      raise exception 'Project-member management permission is required to assign another user' using errcode='42501';
    end if;
  end if;
  insert into public.projects(organization_id,client_id,name,project_code,description,location,start_date,expected_completion_date,contract_value,project_manager_id,status,health_status,progress_percent)
  values(target_organization_id,p_client_id,btrim(p_name),nullif(btrim(coalesce(p_project_code,'')),''),
    nullif(btrim(coalesce(p_description,'')),''),nullif(btrim(coalesce(p_location,'')),''),p_start_date,
    p_expected_completion_date,p_contract_value,p_project_manager_user_id,'planning','on_track',0)
  returning id into target_project_id;
  if p_project_manager_user_id is null then
    insert into public.project_members(project_id,user_id,role) values(target_project_id,(select auth.uid()),'Project Owner');
  elsif p_project_manager_user_id=(select auth.uid()) then
    insert into public.project_members(project_id,user_id,role) values(target_project_id,(select auth.uid()),'Project Manager');
  else
    insert into public.project_members(project_id,user_id,role) values(target_project_id,(select auth.uid()),'Project Owner');
    insert into public.project_members(project_id,user_id,role) values(target_project_id,p_project_manager_user_id,'Project Manager');
  end if;
  return jsonb_build_object('project_id',target_project_id,'organization_id',target_organization_id,'project_manager_user_id',p_project_manager_user_id,'status','planning');
end;
$function$;

create or replace function public.create_buildflow_project(
  p_name text,p_client_id uuid,p_project_code text,p_description text,p_location text,
  p_start_date date,p_expected_completion_date date,p_contract_value numeric,p_project_manager_user_id uuid
)
returns jsonb language sql security invoker set search_path = ''
as $function$
  select private.create_buildflow_project(p_name,p_client_id,p_project_code,p_description,p_location,p_start_date,p_expected_completion_date,p_contract_value,p_project_manager_user_id);
$function$;

revoke all on function private.create_buildflow_project(text,uuid,text,text,text,date,date,numeric,uuid) from public,anon;
grant execute on function private.create_buildflow_project(text,uuid,text,text,text,date,date,numeric,uuid) to authenticated;
revoke all on function public.create_buildflow_project(text,uuid,text,text,text,date,date,numeric,uuid) from public,anon;
grant execute on function public.create_buildflow_project(text,uuid,text,text,text,date,date,numeric,uuid) to authenticated;
