insert into private.permission_catalog(permission_key,module_key,description) values
('risks.view','risks','View project risk records'),
('workforce.view','workforce','View workforce and resource records')
on conflict(permission_key) do update set module_key=excluded.module_key,description=excluded.description;

insert into private.role_permissions(organization_id,role_id,permission_key,allowed)
select r.organization_id,r.id,p.permission_key,true
from public.roles r
cross join private.permission_catalog p
where lower(r.name) in ('admin','administrator','owner')
  and p.permission_key in ('risks.view','workforce.view')
on conflict(role_id,permission_key) do update set allowed=true,updated_at=now();

create or replace function public.has_org_permission(target_organization_id uuid,target_permission_key text)
returns boolean language sql stable security invoker set search_path=''
as $$ select private.has_org_permission(target_organization_id,target_permission_key); $$;
revoke all on function public.has_org_permission(uuid,text) from public,anon;
grant execute on function public.has_org_permission(uuid,text) to authenticated;
