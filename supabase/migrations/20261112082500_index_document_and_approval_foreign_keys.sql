create index if not exists idx_project_documents_project_org_fk on public.project_documents(project_id, organization_id);
create index if not exists idx_project_documents_supersedes_org_fk on public.project_documents(supersedes_document_id, organization_id);
create index if not exists idx_project_documents_uploaded_by_fk on public.project_documents(uploaded_by);
create index if not exists idx_project_approvals_project_org_fk on public.project_approvals(project_id, organization_id);
create index if not exists idx_project_approvals_requested_by_fk on public.project_approvals(requested_by);
create index if not exists idx_project_approvals_approved_by_fk on public.project_approvals(approved_by);
