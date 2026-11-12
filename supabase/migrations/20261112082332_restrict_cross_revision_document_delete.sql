alter table public.project_documents
  drop constraint if exists project_documents_supersedes_org_fkey;
alter table public.project_documents
  add constraint project_documents_supersedes_org_fkey
  foreign key (supersedes_document_id, organization_id)
  references public.project_documents(id, organization_id)
  on delete restrict;
