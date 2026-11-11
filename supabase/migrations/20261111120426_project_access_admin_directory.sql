create or replace function private.get_project_access_admin_data(target_organization_id uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $function$
declare result jsonb;
begin
  if not private.has_org_permission(target_organization_id,'project_members.manage') then
    raise exception 'Not authorised to manage project access' using errcode='42501';
  end if;
  select jsonb_build_object(
    'projects',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.name) order by lower(p.name))
      from public.projects p where p.organization_id=target_organization_id),'[]'::jsonb),
    'members',coalesce((select jsonb_agg(jsonb_build_object(
      'user_id',om.user_id,
      'display_name',coalesce(nullif(pr.display_name,''),nullif(concat_ws(' ',pr.first_name,pr.last_name),''),'Team member'),
      'status',om.status
    ) order by lower(coalesce(pr.display_name,concat_ws(' ',pr.first_name,pr.last_name))))
      from public.organization_members om left join public.profiles pr on pr.id=om.user_id
      where om.organization_id=target_organization_id and om.status='active'),'[]'::jsonb),
    'assignments',coalesce((select jsonb_agg(jsonb_build_object(
      'id',pm.id,'project_id',pm.project_id,'user_id',pm.user_id,'staff_id',pm.staff_id,'role',pm.role
    ) order by pm.created_at)
      from public.project_members pm join public.projects p on p.id=pm.project_id
      where p.organization_id=target_organization_id),'[]'::jsonb)
  ) into result;
  return result;
end;
$function$;
revoke all on function private.get_project_access_admin_data(uuid) from public, anon;
grant execute on function private.get_project_access_admin_data(uuid) to authenticated;

create or replace function public.get_project_access_admin_data(target_organization_id uuid)
returns jsonb language sql stable security invoker set search_path = ''
as $function$
  select private.get_project_access_admin_data(target_organization_id);
$function$;
revoke all on function public.get_project_access_admin_data(uuid) from public, anon;
grant execute on function public.get_project_access_admin_data(uuid) to authenticated;
