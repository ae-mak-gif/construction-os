-- Keep revision lineage constrained to the same organisation.
alter table public.project_documents
  drop constraint if exists project_documents_supersedes_document_id_fkey;
