-- Document attachments are immutable per revision; new versions use a new document revision.
drop policy if exists project_documents_storage_update on storage.objects;
