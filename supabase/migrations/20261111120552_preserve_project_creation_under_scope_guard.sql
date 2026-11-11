-- Project creation must be governed by the existing projects.create
-- permissive policy; project membership scope applies only after a row exists.
drop policy if exists project_scope_guard on public.projects;
create policy project_scope_select_guard on public.projects
as restrictive for select to authenticated
using (private.can_access_project(id));
create policy project_scope_update_guard on public.projects
as restrictive for update to authenticated
using (private.can_access_project(id))
with check (private.can_access_project(id));
create policy project_scope_delete_guard on public.projects
as restrictive for delete to authenticated
using (private.can_access_project(id));
