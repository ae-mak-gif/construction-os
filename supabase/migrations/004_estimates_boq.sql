-- BuildFlow V1
-- Migration: 004_estimates_boq.sql
-- Purpose: Estimates and Bill of Quantities

-- =========================================================
-- 1. ESTIMATES
-- =========================================================

create table if not exists public.estimates (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  project_id uuid not null
    references public.projects(id) on delete cascade,

  name text not null,

  estimate_number text,

  status text not null default 'draft'
    check (
      status in (
        'draft',
        'submitted',
        'approved',
        'rejected',
        'superseded'
      )
    ),

  subtotal numeric(14,2) not null default 0,
  tax_amount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,

  valid_until date,

  notes text,

  created_by uuid
    references auth.users(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (organization_id, estimate_number)
);


-- =========================================================
-- 2. ESTIMATE ITEMS
-- Individual priced items belonging to an estimate
-- =========================================================

create table if not exists public.estimate_items (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  estimate_id uuid not null
    references public.estimates(id) on delete cascade,

  item_code text,
  description text not null,

  quantity numeric(14,3) not null default 1
    check (quantity >= 0),

  unit text,

  unit_price numeric(14,2) not null default 0
    check (unit_price >= 0),

  total_price numeric(14,2) not null default 0
    check (total_price >= 0),

  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- =========================================================
-- 3. BOQ ITEMS
-- Operational Bill of Quantities items
-- =========================================================

create table if not exists public.boq_items (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  project_id uuid not null
    references public.projects(id) on delete cascade,

  estimate_id uuid
    references public.estimates(id) on delete set null,

  item_code text,
  category text,

  description text not null,

  quantity numeric(14,3) not null default 1
    check (quantity >= 0),

  unit text,

  unit_rate numeric(14,2) not null default 0
    check (unit_rate >= 0),

  total_amount numeric(14,2) not null default 0
    check (total_amount >= 0),

  status text not null default 'planned'
    check (
      status in (
        'planned',
        'approved',
        'procured',
        'completed',
        'cancelled'
      )
    ),

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- =========================================================
-- 4. INDEXES
-- =========================================================

create index if not exists idx_estimates_organization_id
  on public.estimates(organization_id);

create index if not exists idx_estimates_project_id
  on public.estimates(project_id);

create index if not exists idx_estimates_status
  on public.estimates(status);

create index if not exists idx_estimate_items_organization_id
  on public.estimate_items(organization_id);

create index if not exists idx_estimate_items_estimate_id
  on public.estimate_items(estimate_id);

create index if not exists idx_boq_items_organization_id
  on public.boq_items(organization_id);

create index if not exists idx_boq_items_project_id
  on public.boq_items(project_id);

create index if not exists idx_boq_items_estimate_id
  on public.boq_items(estimate_id);

create index if not exists idx_boq_items_status
  on public.boq_items(status);


-- =========================================================
-- 5. UPDATED_AT TRIGGERS
-- =========================================================

drop trigger if exists estimates_set_updated_at
  on public.estimates;

create trigger estimates_set_updated_at
before update on public.estimates
for each row
execute function public.set_updated_at();


drop trigger if exists estimate_items_set_updated_at
  on public.estimate_items;

create trigger estimate_items_set_updated_at
before update on public.estimate_items
for each row
execute function public.set_updated_at();


drop trigger if exists boq_items_set_updated_at
  on public.boq_items;

create trigger boq_items_set_updated_at
before update on public.boq_items
for each row
execute function public.set_updated_at();
