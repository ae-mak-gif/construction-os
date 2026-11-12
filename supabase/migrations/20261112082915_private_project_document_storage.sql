insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-documents',
  'project-documents',
  false,
  26214400,
  array[
    'application/pdf','image/png','image/jpeg','image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists project_documents_storage_select on storage.objects;
create policy project_documents_storage_select on storage.objects
for select to authenticated
using (
  bucket_id = 'project-documents'
  and array_length(storage.foldername(name), 1) >= 3
  and private.has_org_permission((storage.foldername(name))[1]::uuid, 'documents.view')
  and exists (
    select 1 from public.projects p
    where p.id = (storage.foldername(name))[2]::uuid
      and p.organization_id = (storage.foldername(name))[1]::uuid
      and private.can_access_project(p.id)
  )
);

drop policy if exists project_documents_storage_insert on storage.objects;
create policy project_documents_storage_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'project-documents'
  and array_length(storage.foldername(name), 1) >= 3
  and private.has_org_permission((storage.foldername(name))[1]::uuid, 'documents.upload')
  and exists (
    select 1 from public.projects p
    where p.id = (storage.foldername(name))[2]::uuid
      and p.organization_id = (storage.foldername(name))[1]::uuid
      and private.can_access_project(p.id)
  )
);

drop policy if exists project_documents_storage_update on storage.objects;
create policy project_documents_storage_update on storage.objects
for update to authenticated
using (
  bucket_id = 'project-documents'
  and array_length(storage.foldername(name), 1) >= 3
  and private.has_org_permission((storage.foldername(name))[1]::uuid, 'documents.upload')
  and exists (
    select 1 from public.projects p
    where p.id = (storage.foldername(name))[2]::uuid
      and p.organization_id = (storage.foldername(name))[1]::uuid
      and private.can_access_project(p.id)
  )
)
with check (
  bucket_id = 'project-documents'
  and array_length(storage.foldername(name), 1) >= 3
  and private.has_org_permission((storage.foldername(name))[1]::uuid, 'documents.upload')
  and exists (
    select 1 from public.projects p
    where p.id = (storage.foldername(name))[2]::uuid
      and p.organization_id = (storage.foldername(name))[1]::uuid
      and private.can_access_project(p.id)
  )
);

drop policy if exists project_documents_storage_delete on storage.objects;
create policy project_documents_storage_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'project-documents'
  and array_length(storage.foldername(name), 1) >= 3
  and private.has_org_permission((storage.foldername(name))[1]::uuid, 'documents.delete')
  and exists (
    select 1 from public.projects p
    where p.id = (storage.foldername(name))[2]::uuid
      and p.organization_id = (storage.foldername(name))[1]::uuid
      and private.can_access_project(p.id)
  )
);
