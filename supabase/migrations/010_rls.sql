-- ============================================================
-- BuildFlow / Tishande Core
-- Migration: 010_rls.sql
-- Purpose: Multi-tenant Row Level Security
-- ============================================================


-- ------------------------------------------------------------
-- PRIVATE SECURITY SCHEMA
-- ------------------------------------------------------------

create schema if not exists private;


-- ------------------------------------------------------------
-- ACTIVE ORGANIZATION MEMBERSHIP HELPER
--
-- SECURITY DEFINER is intentionally used here because the
-- function must inspect organization_members while RLS policies
-- are being evaluated. This prevents recursive RLS evaluation.
-- ------------------------------------------------------------

create or replace function private.is_active_org_member(
  target_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_organization_id
      and om.user_id = (select auth.uid())
      and om.status = 'active'
  );
$$;


revoke execute on function private.is_active_org_member(uuid)
from public;

revoke execute on function private.is_active_org_member(uuid)
from anon;

grant usage on schema private to authenticated;

grant execute on function private.is_active_org_member(uuid)
to authenticated;


-- ------------------------------------------------------------
-- ENABLE RLS ON ALL BUILDFlow V1 TABLES
-- ------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.organization_members enable row level security;
alter table public.notifications enable row level security;
alter table public.activities enable row level security;

alter table public.clients enable row level security;
alter table public.contacts enable row level security;
alter table public.enquiries enable row level security;

alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.tasks enable row level security;
alter table public.calendar_events enable row level security;
alter table public.project_updates enable row level security;
alter table public.project_documents enable row level security;
alter table public.project_approvals enable row level security;

alter table public.estimates enable row level security;
alter table public.estimate_items enable row level security;
alter table public.boq_items enable row level security;

alter table public.suppliers enable row level security;
alter table public.purchase_requests enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;

alter table public.inventory_items enable row level security;
alter table public.inventory_transactions enable row level security;

alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.project_costs enable row level security;
alter table public.finance_transactions enable row level security;

alter table public.staff enable row level security;
alter table public.equipment enable row level security;
alter table public.equipment_assignments enable row level security;
alter table public.work_orders enable row level security;
alter table public.risks enable row level security;
alter table public.quality_issues enable row level security;
alter table public.inspections enable row level security;

alter table public.messages enable row level security;
alter table public.communication_logs enable row level security;


-- ------------------------------------------------------------
-- GRANTS
--
-- RLS controls WHICH rows are accessible.
-- Grants control WHICH operations the authenticated role may
-- attempt. Policies below provide the row-level authorization.
-- ------------------------------------------------------------

grant select, insert, update, delete
on all tables in schema public
to authenticated;


-- ------------------------------------------------------------
-- ORGANIZATIONS
-- ------------------------------------------------------------

drop policy if exists "org_members_can_select_organizations"
on public.organizations;

create policy "org_members_can_select_organizations"
on public.organizations
for select
to authenticated
using (
  (select private.is_active_org_member(id))
);


-- ------------------------------------------------------------
-- PROFILES
-- ------------------------------------------------------------

drop policy if exists "users_can_select_own_profile"
on public.profiles;

create policy "users_can_select_own_profile"
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
);


drop policy if exists "users_can_insert_own_profile"
on public.profiles;

create policy "users_can_insert_own_profile"
on public.profiles
for insert
to authenticated
with check (
  id = (select auth.uid())
);


drop policy if exists "users_can_update_own_profile"
on public.profiles;

create policy "users_can_update_own_profile"
on public.profiles
for update
to authenticated
using (
  id = (select auth.uid())
)
with check (
  id = (select auth.uid())
);


-- ------------------------------------------------------------
-- ORGANIZATION MEMBERS
--
-- Client applications may read memberships for organizations
-- they already belong to.
--
-- Membership creation/role changes are deliberately NOT exposed
-- through normal client-side CRUD at this stage.
-- ------------------------------------------------------------

drop policy if exists "members_can_select_org_members"
on public.organization_members;

create policy "members_can_select_org_members"
on public.organization_members
for select
to authenticated
using (
  (select private.is_active_org_member(organization_id))
);


-- ------------------------------------------------------------
-- ROLES
-- ------------------------------------------------------------

drop policy if exists "members_can_select_roles"
on public.roles;

create policy "members_can_select_roles"
on public.roles
for select
to authenticated
using (
  (select private.is_active_org_member(organization_id))
);


-- ------------------------------------------------------------
-- GENERIC ORGANIZATION-OWNED TABLE POLICIES
--
-- Every table below contains organization_id.
--
-- Active members may CRUD rows belonging to their own
-- organization.
-- ------------------------------------------------------------

do $$
declare
  table_name text;
  tables text[] := array[
    'notifications',
    'activities',

    'clients',
    'contacts',
    'enquiries',

    'projects',
    'project_members',
    'tasks',
    'calendar_events',
    'project_updates',
    'project_documents',
    'project_approvals',

    'estimates',
    'estimate_items',
    'boq_items',

    'suppliers',
    'purchase_requests',
    'purchase_orders',
    'purchase_order_items',

    'inventory_items',
    'inventory_transactions',

    'invoices',
    'payments',
    'expenses',
    'project_costs',
    'finance_transactions',

    'staff',
    'equipment',
    'equipment_assignments',
    'work_orders',
    'risks',
    'quality_issues',
    'inspections',

    'messages',
    'communication_logs'
  ];
begin

  foreach table_name in array tables
  loop

    execute format(
      'drop policy if exists "active_members_select_%s" on public.%I',
      table_name,
      table_name
    );

    execute format(
      'create policy "active_members_select_%s"
       on public.%I
       for select
       to authenticated
       using (
         (select private.is_active_org_member(organization_id))
       )',
      table_name,
      table_name
    );


    execute format(
      'drop policy if exists "active_members_insert_%s" on public.%I',
      table_name,
      table_name
    );

    execute format(
      'create policy "active_members_insert_%s"
       on public.%I
       for insert
       to authenticated
       with check (
         (select private.is_active_org_member(organization_id))
       )',
      table_name,
      table_name
    );


    execute format(
      'drop policy if exists "active_members_update_%s" on public.%I',
      table_name,
      table_name
    );

    execute format(
      'create policy "active_members_update_%s"
       on public.%I
       for update
       to authenticated
       using (
         (select private.is_active_org_member(organization_id))
       )
       with check (
         (select private.is_active_org_member(organization_id))
       )',
      table_name,
      table_name
    );


    execute format(
      'drop policy if exists "active_members_delete_%s" on public.%I',
      table_name,
      table_name
    );

    execute format(
      'create policy "active_members_delete_%s"
       on public.%I
       for delete
       to authenticated
       using (
         (select private.is_active_org_member(organization_id))
       )',
      table_name,
      table_name
    );

  end loop;

end $$;


-- ------------------------------------------------------------
-- END 010
-- ------------------------------------------------------------
