-- Ensure document and approval records cannot point at another tenant's project.
alter table public.project_documents
  drop constraint if exists project_documents_project_id_fkey;
alter table public.project_documents
  add constraint project_documents_project_org_fkey
  foreign key (project_id, organization_id)
  references public.projects(id, organization_id)
  on delete cascade;

create unique index if not exists idx_project_documents_id_org
  on public.project_documents(id, organization_id);

alter table public.project_documents
  drop constraint if exists project_documents_supersedes_org_fkey;
alter table public.project_documents
  add constraint project_documents_supersedes_org_fkey
  foreign key (supersedes_document_id, organization_id)
  references public.project_documents(id, organization_id)
  on delete restrict;

alter table public.project_approvals
  drop constraint if exists project_approvals_project_id_fkey;
alter table public.project_approvals
  add constraint project_approvals_project_org_fkey
  foreign key (project_id, organization_id)
  references public.projects(id, organization_id)
  on delete cascade;
