-- Clients must not SELECT public.projects directly: RLS is row-level and cannot
-- enforce the per-column visibility flags stored on each share. Expose a safe
-- projection through a narrowly scoped RPC instead.

drop policy if exists projects_client_portal_select on public.projects;
drop policy if exists project_scope_guard on public.projects;
create policy project_scope_guard on public.projects
as restrictive for all to authenticated
using (private.can_access_project(id))
with check (private.can_access_project(id));

create or replace function private.get_client_portal_projects()
returns table (
  project_id uuid, project_name text, project_code text, description text,
  location text, project_status text, health_status text, start_date date,
  expected_completion_date date, progress_percent numeric, contract_value numeric,
  can_view_progress boolean, can_view_updates boolean, can_view_documents boolean,
  can_view_financials boolean
)
language sql stable security definer set search_path = ''
as $function$
  select p.id, p.name, p.project_code, p.description, p.location,
    case when s.can_view_progress then p.status else null end,
    case when s.can_view_progress then p.health_status else null end,
    case when s.can_view_progress then p.start_date else null end,
    case when s.can_view_progress then p.expected_completion_date else null end,
    case when s.can_view_progress then p.progress_percent else null end,
    case when s.can_view_financials then p.contract_value else null end,
    s.can_view_progress, s.can_view_updates, s.can_view_documents, s.can_view_financials
  from public.client_project_shares s
  join public.client_portal_access a on a.organization_id=s.organization_id and a.client_id=s.client_id
  join public.clients c on c.id=s.client_id and c.organization_id=s.organization_id
  join public.projects p on p.id=s.project_id and p.organization_id=s.organization_id
  where a.user_id=(select auth.uid()) and a.status='active' and c.status='active'
    and s.status='active' and p.client_id=s.client_id;
$function$;

revoke all on function private.get_client_portal_projects() from public, anon;
grant execute on function private.get_client_portal_projects() to authenticated;

create or replace function public.get_client_portal_projects()
returns table (
  project_id uuid, project_name text, project_code text, description text,
  location text, project_status text, health_status text, start_date date,
  expected_completion_date date, progress_percent numeric, contract_value numeric,
  can_view_progress boolean, can_view_updates boolean, can_view_documents boolean,
  can_view_financials boolean
)
language sql stable security invoker set search_path = ''
as $function$
  select * from private.get_client_portal_projects();
$function$;

revoke all on function public.get_client_portal_projects() from public, anon;
grant execute on function public.get_client_portal_projects() to authenticated;

comment on function public.get_client_portal_projects() is
  'Returns only fields explicitly shared with the authenticated external client; direct project table access is not granted.';
