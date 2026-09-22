-- BuildFlow V1
-- Migration: 005_procurement.sql
-- Purpose: Suppliers, purchase requests and purchase orders

-- =========================================================
-- 1. SUPPLIERS
-- =========================================================

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  name text not null,

  supplier_code text,

  contact_name text,
  email text,
  phone text,

  address text,

  status text not null default 'active'
    check (
      status in (
        'active',
        'inactive',
        'blocked'
      )
    ),

  payment_terms text,

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (organization_id, supplier_code)
);


-- =========================================================
-- 2. PURCHASE REQUESTS
-- Internal request for materials/services
-- =========================================================

create table if not exists public.purchase_requests (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  project_id uuid
    references public.projects(id) on delete set null,

  requested_by uuid
    references auth.users(id) on delete set null,

  request_number text,

  description text,

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'approved',
        'rejected',
        'ordered',
        'fulfilled',
        'cancelled'
      )
    ),

  required_date date,

  estimated_amount numeric(14,2),

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (organization_id, request_number)
);


-- =========================================================
-- 3. PURCHASE ORDERS
-- =========================================================

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  project_id uuid
    references public.projects(id) on delete set null,

  supplier_id uuid not null
    references public.suppliers(id) on delete restrict,

  purchase_request_id uuid
    references public.purchase_requests(id) on delete set null,

  po_number text not null,

  status text not null default 'draft'
    check (
      status in (
        'draft',
        'submitted',
        'approved',
        'ordered',
        'partially_received',
        'received',
        'cancelled'
      )
    ),

  order_date date,

  expected_delivery_date date,

  subtotal numeric(14,2) not null default 0,
  tax_amount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,

  notes text,

  created_by uuid
    references auth.users(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (organization_id, po_number)
);


-- =========================================================
-- 4. PURCHASE ORDER ITEMS
-- =========================================================

create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  purchase_order_id uuid not null
    references public.purchase_orders(id) on delete cascade,

  boq_item_id uuid
    references public.boq_items(id) on delete set null,

  description text not null,

  quantity numeric(14,3) not null default 1
    check (quantity >= 0),

  unit text,

  unit_price numeric(14,2) not null default 0
    check (unit_price >= 0),

  total_price numeric(14,2) not null default 0
    check (total_price >= 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- =========================================================
-- 5. INDEXES
-- =========================================================

create index if not exists idx_suppliers_organization_id
  on public.suppliers(organization_id);

create index if not exists idx_suppliers_status
  on public.suppliers(status);

create index if not exists idx_purchase_requests_organization_id
  on public.purchase_requests(organization_id);

create index if not exists idx_purchase_requests_project_id
  on public.purchase_requests(project_id);

create index if not exists idx_purchase_requests_status
  on public.purchase_requests(status);

create index if not exists idx_purchase_orders_organization_id
  on public.purchase_orders(organization_id);

create index if not exists idx_purchase_orders_project_id
  on public.purchase_orders(project_id);

create index if not exists idx_purchase_orders_supplier_id
  on public.purchase_orders(supplier_id);

create index if not exists idx_purchase_orders_status
  on public.purchase_orders(status);

create index if not exists idx_purchase_order_items_organization_id
  on public.purchase_order_items(organization_id);

create index if not exists idx_purchase_order_items_purchase_order_id
  on public.purchase_order_items(purchase_order_id);

create index if not exists idx_purchase_order_items_boq_item_id
  on public.purchase_order_items(boq_item_id);


-- =========================================================
-- 6. UPDATED_AT TRIGGERS
-- =========================================================

drop trigger if exists suppliers_set_updated_at
  on public.suppliers;

create trigger suppliers_set_updated_at
before update on public.suppliers
for each row
execute function public.set_updated_at();


drop trigger if exists purchase_requests_set_updated_at
  on public.purchase_requests;

create trigger purchase_requests_set_updated_at
before update on public.purchase_requests
for each row
execute function public.set_updated_at();


drop trigger if exists purchase_orders_set_updated_at
  on public.purchase_orders;

create trigger purchase_orders_set_updated_at
before update on public.purchase_orders
for each row
execute function public.set_updated_at();


drop trigger if exists purchase_order_items_set_updated_at
  on public.purchase_order_items;

create trigger purchase_order_items_set_updated_at
before update on public.purchase_order_items
for each row
execute function public.set_updated_at();
