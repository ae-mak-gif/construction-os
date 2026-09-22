-- ============================================================
-- BuildFlow / Tishande Core
-- Migration: 006_inventory.sql
-- Purpose: Inventory items and transaction history
-- ============================================================

-- ------------------------------------------------------------
-- INVENTORY ITEMS
-- ------------------------------------------------------------

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  supplier_id uuid null
    references public.suppliers(id)
    on delete set null,

  item_code text,
  name text not null,
  category text,
  description text,

  unit text not null,

  quantity_on_hand numeric(14,3) not null default 0,
  reorder_level numeric(14,3) not null default 0,

  unit_cost numeric(14,2) not null default 0,

  status text not null default 'active'
    check (status in ('active', 'inactive')),

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint inventory_items_quantity_nonnegative
    check (quantity_on_hand >= 0),

  constraint inventory_items_reorder_nonnegative
    check (reorder_level >= 0),

  constraint inventory_items_unit_cost_nonnegative
    check (unit_cost >= 0),

  constraint inventory_items_unique_code
    unique (organization_id, item_code)
);

create index if not exists idx_inventory_items_org
  on public.inventory_items(organization_id);

create index if not exists idx_inventory_items_supplier
  on public.inventory_items(supplier_id);

create index if not exists idx_inventory_items_status
  on public.inventory_items(organization_id, status);

create index if not exists idx_inventory_items_category
  on public.inventory_items(organization_id, category);


-- ------------------------------------------------------------
-- INVENTORY TRANSACTIONS
-- ------------------------------------------------------------

create table if not exists public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  inventory_item_id uuid not null
    references public.inventory_items(id)
    on delete cascade,

  project_id uuid null
    references public.projects(id)
    on delete set null,

  transaction_type text not null
    check (
      transaction_type in (
        'receipt',
        'issue',
        'return',
        'adjustment'
      )
    ),

  quantity numeric(14,3) not null
    check (quantity > 0),

  unit_cost numeric(14,2) not null default 0
    check (unit_cost >= 0),

  reference_type text,
  reference_id uuid,

  notes text,

  performed_by uuid null
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now()
);

create index if not exists idx_inventory_transactions_org
  on public.inventory_transactions(organization_id);

create index if not exists idx_inventory_transactions_item
  on public.inventory_transactions(inventory_item_id);

create index if not exists idx_inventory_transactions_project
  on public.inventory_transactions(project_id);

create index if not exists idx_inventory_transactions_type
  on public.inventory_transactions(
    organization_id,
    transaction_type
  );

create index if not exists idx_inventory_transactions_created
  on public.inventory_transactions(
    organization_id,
    created_at
);


-- ------------------------------------------------------------
-- UPDATED_AT TRIGGER
-- ------------------------------------------------------------

drop trigger if exists set_inventory_items_updated_at
  on public.inventory_items;

create trigger set_inventory_items_updated_at
before update on public.inventory_items
for each row
execute function public.set_updated_at();


-- ------------------------------------------------------------
-- END 006
-- ------------------------------------------------------------
