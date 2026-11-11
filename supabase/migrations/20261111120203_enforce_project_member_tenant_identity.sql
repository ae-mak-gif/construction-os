create unique index if not exists project_members_project_user_unique
  on public.project_members(project_id,user_id) where user_id is not null;
create unique index if not exists project_members_project_staff_unique
  on public.project_members(project_id,staff_id) where staff_id is not null;

create or replace function private.enforce_project_member_tenant_identity()
returns trigger language plpgsql security definer set search_path = ''
as $function$
declare project_org uuid;
begin
  select p.organization_id into project_org from public.projects p where p.id=new.project_id;
  if project_org is null then
    raise exception 'Project does not exist' using errcode='23503';
  end if;
  if new.user_id is not null and not exists (
    select 1 from public.organization_members om
    where om.organization_id=project_org and om.user_id=new.user_id and om.status='active'
  ) then
    raise exception 'Project users must be active members of the same organisation' using errcode='23514';
  end if;
  if new.staff_id is not null and not exists (
    select 1 from public.staff st
    where st.id=new.staff_id and st.organization_id=project_org
      and st.employment_status='active'
      and (new.user_id is null or st.user_id is null or st.user_id=new.user_id)
  ) then
    raise exception 'Project staff must belong to the same organisation and be active' using errcode='23514';
  end if;
  return new;
end;
$function$;

revoke all on function private.enforce_project_member_tenant_identity() from public, anon, authenticated;
drop trigger if exists enforce_project_member_tenant_identity on public.project_members;
create trigger enforce_project_member_tenant_identity
before insert or update of project_id,user_id,staff_id on public.project_members
for each row execute function private.enforce_project_member_tenant_identity();
