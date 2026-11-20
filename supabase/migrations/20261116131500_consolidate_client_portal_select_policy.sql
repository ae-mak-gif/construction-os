drop policy if exists client_portal_access_org_select on public.client_portal_access;
drop policy if exists client_portal_access_self_select on public.client_portal_access;
create policy client_portal_access_select_scoped on public.client_portal_access
for select to authenticated
using (
  private.has_org_permission(organization_id, 'crm.view')
  or (user_id = (select auth.uid()) and status = 'active')
);