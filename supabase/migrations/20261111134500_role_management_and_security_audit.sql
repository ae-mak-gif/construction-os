create table if not exists public.security_audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete restrict,
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.security_audit_events enable row level security;
drop policy if exists security_audit_events_permission_select on public.security_audit_events;
create policy security_audit_events_permission_select on public.security_audit_events
for select to authenticated using (private.has_org_permission(organization_id,'audit.view'));
revoke all on public.security_audit_events from anon;
revoke insert, update, delete on public.security_audit_events from authenticated;
grant select on public.security_audit_events to authenticated;
create index if not exists security_audit_events_org_created_idx on public.security_audit_events(organization_id,created_at desc);

create or replace function public.get_org_roles_permissions(target_organization_id uuid)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare result jsonb;
begin
  if not private.has_org_permission(target_organization_id,'organization.manage_roles') then
    raise exception 'Not authorised to manage organisation roles' using errcode='42501';
  end if;
  select jsonb_build_object(
    'permissions', coalesce((
      select jsonb_agg(jsonb_build_object('key',p.permission_key,'module',p.module_key,'description',p.description) order by p.module_key,p.permission_key)
      from private.permission_catalog p
    ),'[]'::jsonb),
    'roles', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',r.id,'name',r.name,'description',r.description,
        'is_system',lower(r.name) in ('admin','administrator','owner'),
        'permissions',coalesce((
          select jsonb_object_agg(p.permission_key,coalesce(rp.allowed,false))
          from private.permission_catalog p
          left join private.role_permissions rp
            on rp.permission_key=p.permission_key and rp.role_id=r.id and rp.organization_id=r.organization_id
        ),'{}'::jsonb)
      ) order by r.name)
      from public.roles r where r.organization_id=target_organization_id
    ),'[]'::jsonb)
  ) into result;
  return result;
end;
$$;

create or replace function public.create_org_role(target_organization_id uuid,target_name text,target_description text default null)
returns uuid language plpgsql security definer set search_path=''
as $$
declare
  new_role_id uuid;
  clean_name text := btrim(target_name);
begin
  if not private.has_org_permission(target_organization_id,'organization.manage_roles') then
    raise exception 'Not authorised to manage organisation roles' using errcode='42501';
  end if;
  if clean_name is null or length(clean_name)<2 or length(clean_name)>60 then
    raise exception 'Role name must be between 2 and 60 characters' using errcode='22023';
  end if;
  if lower(clean_name) in ('admin','administrator','owner','client','superadmin','super administrator') then
    raise exception 'This role name is reserved' using errcode='22023';
  end if;
  insert into public.roles(organization_id,name,description)
  values(target_organization_id,clean_name,nullif(btrim(target_description),''))
  returning id into new_role_id;
  insert into public.security_audit_events(organization_id,actor_id,action,target_type,target_id,metadata)
  values(target_organization_id,(select auth.uid()),'role.created','role',new_role_id,jsonb_build_object('name',clean_name));
  return new_role_id;
end;
$$;

create or replace function public.set_org_role_permission(target_organization_id uuid,target_role_id uuid,target_permission_key text,target_allowed boolean)
returns boolean language plpgsql security definer set search_path=''
as $$
declare
  role_name text;
  current_role_id uuid;
begin
  if not private.has_org_permission(target_organization_id,'organization.manage_roles') then
    raise exception 'Not authorised to manage organisation roles' using errcode='42501';
  end if;
  select om.role_id into current_role_id from public.organization_members om
  where om.organization_id=target_organization_id and om.user_id=(select auth.uid()) and om.status='active';
  select r.name into role_name from public.roles r
  where r.id=target_role_id and r.organization_id=target_organization_id;
  if role_name is null then raise exception 'Role not found in this organisation' using errcode='22023'; end if;
  if target_role_id=current_role_id or lower(role_name) in ('admin','administrator','owner') then
    raise exception 'System and current-user roles cannot be modified here' using errcode='42501';
  end if;
  if not exists(select 1 from private.permission_catalog p where p.permission_key=target_permission_key) then
    raise exception 'Unknown permission key' using errcode='22023';
  end if;
  insert into private.role_permissions(organization_id,role_id,permission_key,allowed)
  values(target_organization_id,target_role_id,target_permission_key,target_allowed)
  on conflict(role_id,permission_key) do update set allowed=excluded.allowed,updated_at=now();
  insert into public.security_audit_events(organization_id,actor_id,action,target_type,target_id,metadata)
  values(target_organization_id,(select auth.uid()),'role.permission_changed','role',target_role_id,
    jsonb_build_object('role_name',role_name,'permission_key',target_permission_key,'allowed',target_allowed));
  return true;
end;
$$;

revoke all on function public.get_org_roles_permissions(uuid) from public,anon;
revoke all on function public.create_org_role(uuid,text,text) from public,anon;
revoke all on function public.set_org_role_permission(uuid,uuid,text,boolean) from public,anon;
grant execute on function public.get_org_roles_permissions(uuid) to authenticated;
grant execute on function public.create_org_role(uuid,text,text) to authenticated;
grant execute on function public.set_org_role_permission(uuid,uuid,text,boolean) to authenticated;
