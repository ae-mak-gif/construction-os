drop policy if exists rbac_project_documents_update on public.project_documents;
create policy rbac_project_documents_update
on public.project_documents
for update to authenticated
using (
  private.has_org_permission(organization_id, 'documents.share')
  or private.has_org_permission(organization_id, 'documents.upload')
)
with check (
  private.has_org_permission(organization_id, 'documents.share')
  or private.has_org_permission(organization_id, 'documents.upload')
);
