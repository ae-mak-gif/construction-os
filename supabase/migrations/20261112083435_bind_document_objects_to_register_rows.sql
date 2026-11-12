drop policy if exists project_documents_storage_select on storage.objects;
create policy project_documents_storage_select on storage.objects
for select to authenticated
using (
  bucket_id = 'project-documents'
  and array_length(storage.foldername(storage.objects.name), 1) >= 3
  and private.has_org_permission((storage.foldername(storage.objects.name))[1]::uuid, 'documents.view')
  and exists (
    select 1 from public.project_documents d
    join public.projects p on p.id = d.project_id and p.organization_id = d.organization_id
    where d.id = (storage.foldername(storage.objects.name))[3]::uuid
      and d.project_id = (storage.foldername(storage.objects.name))[2]::uuid
      and d.organization_id = (storage.foldername(storage.objects.name))[1]::uuid
      and private.can_access_project(p.id)
  )
);

drop policy if exists project_documents_storage_insert on storage.objects;
create policy project_documents_storage_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'project-documents'
  and array_length(storage.foldername(storage.objects.name), 1) >= 3
  and private.has_org_permission((storage.foldername(storage.objects.name))[1]::uuid, 'documents.upload')
  and exists (
    select 1 from public.project_documents d
    join public.projects p on p.id = d.project_id and p.organization_id = d.organization_id
    where d.id = (storage.foldername(storage.objects.name))[3]::uuid
      and d.project_id = (storage.foldername(storage.objects.name))[2]::uuid
      and d.organization_id = (storage.foldername(storage.objects.name))[1]::uuid
      and private.can_access_project(p.id)
  )
);

drop policy if exists project_documents_storage_delete on storage.objects;
create policy project_documents_storage_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'project-documents'
  and array_length(storage.foldername(storage.objects.name), 1) >= 3
  and private.has_org_permission((storage.foldername(storage.objects.name))[1]::uuid, 'documents.delete')
  and exists (
    select 1 from public.project_documents d
    join public.projects p on p.id = d.project_id and p.organization_id = d.organization_id
    where d.id = (storage.foldername(storage.objects.name))[3]::uuid
      and d.project_id = (storage.foldername(storage.objects.name))[2]::uuid
      and d.organization_id = (storage.foldername(storage.objects.name))[1]::uuid
      and private.can_access_project(p.id)
  )
);
