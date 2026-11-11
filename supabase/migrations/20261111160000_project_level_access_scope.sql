-- Project-level row scoping for organisation-authorised users.
-- Backward-compatible rollout: projects with explicit user assignments are
-- restricted to those users (or users with project_members.manage); projects
-- without assignments continue to use the existing organisation permissions.
-- Staff-based assignments resolve through staff.user_id; direct user_id
-- assignments do not require a staff record.

create or replace function private.can_access_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select case
    when target_project_id is null then true
    else exists (
      select 1
      from public.projects p
      where p.id = target_project_id
        and (
          not exists (
            select 1
            from public.project_members pm
            left join public.staff s on s.id = pm.staff_id
            where pm.project_id = p.id
              and (pm.user_id is not null or s.user_id is not null)
          )
          or private.has_org_permission(p.organization_id, 'project_members.manage')
          or exists (
            select 1
            from public.project_members pm
            left join public.staff s on s.id = pm.staff_id
            where pm.project_id = p.id
              and (pm.user_id = (select auth.uid()) or s.user_id = (select auth.uid()))
          )
        )
    )
  end;
$function$;

revoke all on function private.can_access_project(uuid) from public, anon;
grant execute on function private.can_access_project(uuid) to authenticated;

do $block$
declare
  t record;
begin
  for t in
    select distinct c.table_name
    from information_schema.columns c
    join pg_class pc on pc.relname = c.table_name
    join pg_namespace pn on pn.oid = pc.relnamespace and pn.nspname = 'public'
    where c.table_schema = 'public'
      and c.column_name = 'project_id'
      and c.table_name <> 'projects'
      and pc.relkind = 'r'
  loop
    execute format('drop policy if exists project_scope_guard on public.%I', t.table_name);
    execute format(
      'create policy project_scope_guard on public.%I as restrictive for all to authenticated using (private.can_access_project(project_id)) with check (private.can_access_project(project_id))',
      t.table_name
    );
  end loop;
end;
$block$;

drop policy if exists project_scope_guard on public.projects;
create policy project_scope_guard on public.projects
as restrictive for all to authenticated
using (private.can_access_project(id))
with check (private.can_access_project(id));
