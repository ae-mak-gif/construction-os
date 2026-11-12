-- Development-only document register metadata.
-- Binary uploads remain disabled until private Storage and signed-URL workflows are implemented.
alter table public.project_documents
  add column if not exists document_number text,
  add column if not exists document_category text not null default 'general',
  add column if not exists revision text not null default 'A',
  add column if not exists document_status text not null default 'draft',
  add column if not exists is_client_shared boolean not null default false,
  add column if not exists issued_at date,
  add column if not exists supersedes_document_id uuid references public.project_documents(id) on delete set null;

alter table public.project_documents
  drop constraint if exists project_documents_document_status_check;
alter table public.project_documents
  add constraint project_documents_document_status_check
  check (document_status in ('draft','for_review','approved','superseded','archived'));

create index if not exists idx_project_documents_org_project_status
  on public.project_documents(organization_id, project_id, document_status);

create unique index if not exists idx_project_documents_org_project_number_revision
  on public.project_documents(organization_id, project_id, document_number, revision)
  where document_number is not null;
