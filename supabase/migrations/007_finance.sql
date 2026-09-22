-- ============================================================
-- BuildFlow / Tishande Core
-- Migration: 007_finance.sql
-- Purpose: Finance, invoicing, payments and project costs
-- ============================================================


-- ------------------------------------------------------------
-- INVOICES
-- ------------------------------------------------------------

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  project_id uuid null
    references public.projects(id)
    on delete set null,

  client_id uuid null
    references public.clients(id)
    on delete set null,

  invoice_number text not null,

  status text not null default 'draft'
    check (
      status in (
        'draft',
        'sent',
        'partially_paid',
        'paid',
        'overdue',
        'cancelled'
      )
    ),

  issue_date date not null default current_date,
  due_date date,

  subtotal numeric(14,2) not null default 0,
  tax_amount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,

  notes text,

  created_by uuid null
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint invoices_subtotal_nonnegative
    check (subtotal >= 0),

  constraint invoices_tax_nonnegative
    check (tax_amount >= 0),

  constraint invoices_total_nonnegative
    check (total_amount >= 0),

  constraint invoices_unique_number
    unique (organization_id, invoice_number)
);

create index if not exists idx_invoices_org
  on public.invoices(organization_id);

create index if not exists idx_invoices_project
  on public.invoices(project_id);

create index if not exists idx_invoices_client
  on public.invoices(client_id);

create index if not exists idx_invoices_status
  on public.invoices(organization_id, status);

create index if not exists idx_invoices_due_date
  on public.invoices(organization_id, due_date);


-- ------------------------------------------------------------
-- PAYMENTS
-- ------------------------------------------------------------

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  invoice_id uuid null
    references public.invoices(id)
    on delete set null,

  project_id uuid null
    references public.projects(id)
    on delete set null,

  client_id uuid null
    references public.clients(id)
    on delete set null,

  payment_reference text,

  amount numeric(14,2) not null,

  payment_date date not null default current_date,

  payment_method text,

  status text not null default 'received'
    check (
      status in (
        'pending',
        'received',
        'reversed'
      )
    ),

  notes text,

  received_by uuid null
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now(),

  constraint payments_amount_positive
    check (amount > 0)
);

create index if not exists idx_payments_org
  on public.payments(organization_id);

create index if not exists idx_payments_invoice
  on public.payments(invoice_id);

create index if not exists idx_payments_project
  on public.payments(project_id);

create index if not exists idx_payments_client
  on public.payments(client_id);

create index if not exists idx_payments_date
  on public.payments(organization_id, payment_date);


-- ------------------------------------------------------------
-- EXPENSES
-- ------------------------------------------------------------

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  project_id uuid null
    references public.projects(id)
    on delete set null,

  expense_number text,

  category text not null,

  description text,

  amount numeric(14,2) not null,

  expense_date date not null default current_date,

  supplier_id uuid null
    references public.suppliers(id)
    on delete set null,

  payment_status text not null default 'unpaid'
    check (
      payment_status in (
        'unpaid',
        'paid',
        'partially_paid'
      )
    ),

  notes text,

  created_by uuid null
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint expenses_amount_positive
    check (amount > 0)
);

create index if not exists idx_expenses_org
  on public.expenses(organization_id);

create index if not exists idx_expenses_project
  on public.expenses(project_id);

create index if not exists idx_expenses_supplier
  on public.expenses(supplier_id);

create index if not exists idx_expenses_category
  on public.expenses(organization_id, category);

create index if not exists idx_expenses_date
  on public.expenses(organization_id, expense_date);


-- ------------------------------------------------------------
-- PROJECT COSTS
-- ------------------------------------------------------------

create table if not exists public.project_costs (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  project_id uuid not null
    references public.projects(id)
    on delete cascade,

  cost_type text not null,

  description text,

  amount numeric(14,2) not null,

  cost_date date not null default current_date,

  reference_type text,
  reference_id uuid,

  notes text,

  created_by uuid null
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now(),

  constraint project_costs_amount_positive
    check (amount > 0)
);

create index if not exists idx_project_costs_org
  on public.project_costs(organization_id);

create index if not exists idx_project_costs_project
  on public.project_costs(project_id);

create index if not exists idx_project_costs_type
  on public.project_costs(organization_id, cost_type);

create index if not exists idx_project_costs_date
  on public.project_costs(organization_id, cost_date);


-- ------------------------------------------------------------
-- FINANCE TRANSACTIONS
-- ------------------------------------------------------------

create table if not exists public.finance_transactions (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  project_id uuid null
    references public.projects(id)
    on delete set null,

  transaction_type text not null
    check (
      transaction_type in (
        'income',
        'expense',
        'adjustment'
      )
    ),

  amount numeric(14,2) not null,

  transaction_date date not null default current_date,

  reference_type text,
  reference_id uuid,

  description text,

  created_by uuid null
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now(),

  constraint finance_transactions_amount_positive
    check (amount > 0)
);

create index if not exists idx_finance_transactions_org
  on public.finance_transactions(organization_id);

create index if not exists idx_finance_transactions_project
  on public.finance_transactions(project_id);

create index if not exists idx_finance_transactions_type
  on public.finance_transactions(
    organization_id,
    transaction_type
  );

create index if not exists idx_finance_transactions_date
  on public.finance_transactions(
    organization_id,
    transaction_date
  );


-- ------------------------------------------------------------
-- UPDATED_AT TRIGGERS
-- ------------------------------------------------------------

drop trigger if exists set_invoices_updated_at
  on public.invoices;

create trigger set_invoices_updated_at
before update on public.invoices
for each row
execute function public.set_updated_at();


drop trigger if exists set_expenses_updated_at
  on public.expenses;

create trigger set_expenses_updated_at
before update on public.expenses
for each row
execute function public.set_updated_at();


-- ------------------------------------------------------------
-- END 007
-- ------------------------------------------------------------
