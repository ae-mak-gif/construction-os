-- BuildFlow role-based permission foundation (Development-first rollout)
create schema if not exists private;

create table if not exists private.permission_catalog (
  permission_key text primary key,
  module_key text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists private.role_permissions (
  organization_id uuid not null,
  role_id uuid not null,
  permission_key text not null references private.permission_catalog(permission_key) on delete cascade,
  allowed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (role_id, permission_key),
  constraint role_permissions_role_org_fkey
    foreign key (role_id, organization_id)
    references public.roles(id, organization_id) on delete cascade
);

alter table private.permission_catalog enable row level security;
alter table private.role_permissions enable row level security;
drop policy if exists permission_catalog_deny_client_access on private.permission_catalog;
create policy permission_catalog_deny_client_access on private.permission_catalog
for all to authenticated using (false) with check (false);
drop policy if exists role_permissions_deny_client_access on private.role_permissions;
create policy role_permissions_deny_client_access on private.role_permissions
for all to authenticated using (false) with check (false);
revoke all on private.permission_catalog from anon, authenticated;
revoke all on private.role_permissions from anon, authenticated;
create index if not exists role_permissions_role_org_idx on private.role_permissions(role_id,organization_id);
create index if not exists role_permissions_permission_key_idx on private.role_permissions(permission_key);

insert into private.permission_catalog(permission_key,module_key,description) values
('projects.view','projects','View projects'),('projects.create','projects','Create projects'),('projects.update','projects','Update projects'),('projects.delete','projects','Delete projects'),
('tasks.view','tasks','View tasks'),('tasks.create','tasks','Create tasks'),('tasks.update','tasks','Update tasks'),('tasks.delete','tasks','Delete tasks'),
('schedule.view','schedule','View programme activities and dependencies'),('schedule.create','schedule','Create programme activities'),('schedule.update','schedule','Update programme activities'),('schedule.delete','schedule','Delete programme activities'),
('finance.view','finance','View budgets and financial records'),('finance.create','finance','Create budgets and cost records'),('finance.update','finance','Update budgets and cost records'),('finance.approve','finance','Approve financial commitments'),
('procurement.view','procurement','View procurement records'),('procurement.create','procurement','Create procurement records'),('procurement.update','procurement','Update procurement records'),('procurement.approve','procurement','Approve procurement records'),
('safety.view','safety','View safety and incident records'),('safety.create','safety','Create safety and incident records'),('safety.update','safety','Update safety and incident records'),
('rfis.view','rfis','View technical queries and RFIs'),('rfis.create','rfis','Create technical queries and RFIs'),('rfis.update','rfis','Update technical queries and RFIs'),('rfis.respond','rfis','Respond to technical queries and RFIs'),
('variations.view','variations','View contract variations'),('variations.create','variations','Create contract variations'),('variations.update','variations','Update contract variations'),('variations.approve','variations','Approve contract variations'),
('documents.view','documents','View project documents'),('documents.upload','documents','Upload project documents'),('documents.delete','documents','Delete project documents'),('documents.share','documents','Share project documents'),
('agents.view','agents','View VEA and agent workspace'),('agents.run','agents','Run read-only specialist agents'),('agents.approve_actions','agents','Approve consequential agent-proposed actions'),
('audit.view','audit','View audit history'),('organization.manage_members','organization','Manage organisation members'),('organization.manage_roles','organization','Manage organisation roles')
on conflict (permission_key) do update set module_key=excluded.module_key,description=excluded.description;

create or replace function private.has_org_permission(target_organization_id uuid,target_permission_key text)
returns boolean language sql stable security definer set search_path=''
as $$
  select exists (
    select 1 from public.organization_members om
    join public.roles r on r.id=om.role_id and r.organization_id=om.organization_id
    join private.role_permissions rp on rp.role_id=r.id and rp.organization_id=r.organization_id
    where om.organization_id=target_organization_id
      and om.user_id=(select auth.uid()) and om.status='active'
      and rp.permission_key=target_permission_key and rp.allowed=true
  );
$$;
revoke all on function private.has_org_permission(uuid,text) from public,anon;
grant usage on schema private to authenticated;
grant execute on function private.has_org_permission(uuid,text) to authenticated;

insert into private.role_permissions(organization_id,role_id,permission_key,allowed)
select r.organization_id,r.id,p.permission_key,true
from public.roles r cross join private.permission_catalog p
where lower(r.name) in ('admin','administrator','owner')
on conflict (role_id,permission_key) do update set allowed=true,updated_at=now();

drop policy if exists active_members_select_projects on public.projects;
drop policy if exists active_members_insert_projects on public.projects;
drop policy if exists active_members_update_projects on public.projects;
drop policy if exists active_members_delete_projects on public.projects;
create policy projects_permission_select on public.projects for select to authenticated using(private.has_org_permission(organization_id,'projects.view'));
create policy projects_permission_insert on public.projects for insert to authenticated with check(private.has_org_permission(organization_id,'projects.create'));
create policy projects_permission_update on public.projects for update to authenticated using(private.has_org_permission(organization_id,'projects.update')) with check(private.has_org_permission(organization_id,'projects.update'));
create policy projects_permission_delete on public.projects for delete to authenticated using(private.has_org_permission(organization_id,'projects.delete'));

drop policy if exists active_members_select_tasks on public.tasks;
drop policy if exists active_members_insert_tasks on public.tasks;
drop policy if exists active_members_update_tasks on public.tasks;
drop policy if exists active_members_delete_tasks on public.tasks;
create policy tasks_permission_select on public.tasks for select to authenticated using(private.has_org_permission(organization_id,'tasks.view'));
create policy tasks_permission_insert on public.tasks for insert to authenticated with check(private.has_org_permission(organization_id,'tasks.create'));
create policy tasks_permission_update on public.tasks for update to authenticated using(private.has_org_permission(organization_id,'tasks.update')) with check(private.has_org_permission(organization_id,'tasks.update'));
create policy tasks_permission_delete on public.tasks for delete to authenticated using(private.has_org_permission(organization_id,'tasks.delete'));

drop policy if exists schedule_activities_active_member_select on public.schedule_activities;
drop policy if exists schedule_activities_active_member_insert on public.schedule_activities;
drop policy if exists schedule_activities_active_member_update on public.schedule_activities;
drop policy if exists schedule_activities_active_member_delete on public.schedule_activities;
create policy schedule_permission_select on public.schedule_activities for select to authenticated using(private.has_org_permission(organization_id,'schedule.view'));
create policy schedule_permission_insert on public.schedule_activities for insert to authenticated with check(private.has_org_permission(organization_id,'schedule.create'));
create policy schedule_permission_update on public.schedule_activities for update to authenticated using(private.has_org_permission(organization_id,'schedule.update')) with check(private.has_org_permission(organization_id,'schedule.update'));
create policy schedule_permission_delete on public.schedule_activities for delete to authenticated using(private.has_org_permission(organization_id,'schedule.delete'));

drop policy if exists project_budgets_active_member_select on public.project_budgets;
drop policy if exists project_budgets_active_member_insert on public.project_budgets;
drop policy if exists project_budgets_active_member_update on public.project_budgets;
drop policy if exists project_budgets_active_member_delete on public.project_budgets;
create policy project_budgets_permission_select on public.project_budgets for select to authenticated using(private.has_org_permission(organization_id,'finance.view'));
create policy project_budgets_permission_insert on public.project_budgets for insert to authenticated with check(private.has_org_permission(organization_id,'finance.create'));
create policy project_budgets_permission_update on public.project_budgets for update to authenticated using(private.has_org_permission(organization_id,'finance.update')) with check(private.has_org_permission(organization_id,'finance.update'));
create policy project_budgets_permission_delete on public.project_budgets for delete to authenticated using(private.has_org_permission(organization_id,'finance.update'));
