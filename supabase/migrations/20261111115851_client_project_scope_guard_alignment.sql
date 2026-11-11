-- Permit explicitly shared external client identities to read the project
-- overview row while retaining internal project scope for every write.
drop policy if exists project_scope_guard on public.projects;
create policy project_scope_guard on public.projects
as restrictive for all to authenticated
using (private.can_access_project(id) or private.is_client_project_user(id))
with check (private.can_access_project(id));

create policy project_scope_guard on public.client_project_shares
as restrictive for all to authenticated
using (private.can_access_project(project_id))
with check (private.can_access_project(project_id));
