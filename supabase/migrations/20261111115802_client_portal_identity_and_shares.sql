-- Separate client identities from internal organisation memberships.
-- Client users are auth.users accounts with explicit client access and project shares.
-- They are never inserted into organization_members.

alter table public.clients
  add constraint clients_id_organization_id_key unique (id, organization_id);

create table public.client_portal_access (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active','revoked','pending')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_portal_access_client_org_fk foreign key (client_id, organization_id)
    references public.clients(id, organization_id) on delete cascade,
  constraint client_portal_access_unique unique (organization_id, client_id, user_id),
  constraint client_portal_access_id_org_unique unique (id, organization_id)
);

create table public.client_project_shares (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  client_id uuid not null,
  project_id uuid not null,
  can_view_progress boolean not null default true,
  can_view_updates boolean not null default true,
  can_view_documents boolean not null default false,
  can_view_financials boolean not null default false,
  status text not null default 'active' check (status in ('active','revoked')),
  shared_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_project_shares_client_fk foreign key (client_id, organization_id)
    references public.clients(id, organization_id) on delete cascade,
  constraint client_project_shares_project_fk foreign key (project_id, organization_id)
    references public.projects(id, organization_id) on delete cascade,
  constraint client_project_shares_unique unique (organization_id, client_id, project_id)
);

create index client_portal_access_user_idx on public.client_portal_access(user_id, organization_id, status);
create index client_project_shares_project_idx on public.client_project_shares(project_id, client_id, status);
alter table public.client_portal_access enable row level security;
alter table public.client_project_shares enable row level security;

create or replace function private.is_client_user_for_client(target_client_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $function$
  select exists (select 1 from public.client_portal_access a
    where a.client_id = target_client_id and a.user_id = (select auth.uid()) and a.status = 'active');
$function$;

create or replace function private.is_client_project_user(target_project_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $function$
  select exists (
    select 1 from public.client_project_shares s
    join public.client_portal_access a on a.organization_id = s.organization_id and a.client_id = s.client_id
    join public.projects p on p.id = s.project_id and p.organization_id = s.organization_id
    where s.project_id = target_project_id and s.status = 'active' and a.status = 'active'
      and a.user_id = (select auth.uid()) and p.client_id = s.client_id
  );
$function$;

revoke all on function private.is_client_user_for_client(uuid) from public, anon;
revoke all on function private.is_client_project_user(uuid) from public, anon;
grant execute on function private.is_client_user_for_client(uuid) to authenticated;
grant execute on function private.is_client_project_user(uuid) to authenticated;

create policy client_portal_access_org_select on public.client_portal_access for select to authenticated
using (private.has_org_permission(organization_id, 'crm.view'));
create policy client_portal_access_org_insert on public.client_portal_access for insert to authenticated
with check (private.has_org_permission(organization_id, 'crm.update'));
create policy client_portal_access_org_update on public.client_portal_access for update to authenticated
using (private.has_org_permission(organization_id, 'crm.update'))
with check (private.has_org_permission(organization_id, 'crm.update'));
create policy client_portal_access_org_delete on public.client_portal_access for delete to authenticated
using (private.has_org_permission(organization_id, 'crm.update'));
create policy client_portal_access_self_select on public.client_portal_access for select to authenticated
using (user_id = (select auth.uid()) and status = 'active');

create policy client_project_shares_org_select on public.client_project_shares for select to authenticated
using (private.has_org_permission(organization_id, 'projects.view'));
create policy client_project_shares_org_insert on public.client_project_shares for insert to authenticated
with check (private.has_org_permission(organization_id, 'crm.update') and private.has_org_permission(organization_id, 'projects.update'));
create policy client_project_shares_org_update on public.client_project_shares for update to authenticated
using (private.has_org_permission(organization_id, 'crm.update') and private.has_org_permission(organization_id, 'projects.update'))
with check (private.has_org_permission(organization_id, 'crm.update') and private.has_org_permission(organization_id, 'projects.update'));
create policy client_project_shares_org_delete on public.client_project_shares for delete to authenticated
using (private.has_org_permission(organization_id, 'crm.update') and private.has_org_permission(organization_id, 'projects.update'));

create policy clients_client_portal_select on public.clients for select to authenticated
using (private.is_client_user_for_client(id));
create policy projects_client_portal_select on public.projects for select to authenticated
using (private.is_client_project_user(id));

-- A shared project row is still governed by the internal project membership boundary.
create policy project_scope_guard on public.client_project_shares as restrictive for all to authenticated
using (private.can_access_project(project_id))
with check (private.can_access_project(project_id));

comment on table public.client_portal_access is
  'External client identity links. Client users are not internal organisation members.';
comment on table public.client_project_shares is
  'Explicit per-project client portal shares and field-family visibility controls.';
