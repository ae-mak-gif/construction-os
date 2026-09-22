-- BuildFlow V1
-- Migration: 002_crm.sql
-- Purpose: CRM foundation
-- Tables: clients, contacts, enquiries

-- =========================================================
-- 1. CLIENTS
-- =========================================================

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  name text not null,
  client_type text not null default 'individual'
    check (client_type in ('individual', 'company', 'organization')),

  email text,
  phone text,
  address text,

  status text not null default 'active'
    check (status in ('active', 'inactive', 'prospect')),

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- =========================================================
-- 2. CONTACTS
-- People associated with a client
-- =========================================================

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  client_id uuid not null
    references public.clients(id) on delete cascade,

  first_name text not null,
  last_name text,

  job_title text,
  email text,
  phone text,

  is_primary boolean not null default false,

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- =========================================================
-- 3. ENQUIRIES
-- Potential construction work before it becomes a project
-- =========================================================

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  client_id uuid
    references public.clients(id) on delete set null,

  contact_id uuid
    references public.contacts(id) on delete set null,

  title text not null,
  description text,

  source text,

  status text not null default 'new'
    check (
      status in (
        'new',
        'contacted',
        'qualified',
        'proposal',
        'won',
        'lost',
        'on_hold'
      )
    ),

  estimated_value numeric(14,2),

  expected_start_date date,

  assigned_to uuid
    references auth.users(id) on delete set null,

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- =========================================================
-- 4. INDEXES
-- =========================================================

create index if not exists idx_clients_organization_id
  on public.clients(organization_id);

create index if not exists idx_clients_status
  on public.clients(status);

create index if not exists idx_contacts_organization_id
  on public.contacts(organization_id);

create index if not exists idx_contacts_client_id
  on public.contacts(client_id);

create index if not exists idx_enquiries_organization_id
  on public.enquiries(organization_id);

create index if not exists idx_enquiries_client_id
  on public.enquiries(client_id);

create index if not exists idx_enquiries_contact_id
  on public.enquiries(contact_id);

create index if not exists idx_enquiries_status
  on public.enquiries(status);

create index if not exists idx_enquiries_assigned_to
  on public.enquiries(assigned_to);


-- =========================================================
-- 5. UPDATED_AT TRIGGERS
-- =========================================================

drop trigger if exists clients_set_updated_at
  on public.clients;

create trigger clients_set_updated_at
before update on public.clients
for each row
execute function public.set_updated_at();


drop trigger if exists contacts_set_updated_at
  on public.contacts;

create trigger contacts_set_updated_at
before update on public.contacts
for each row
execute function public.set_updated_at();


drop trigger if exists enquiries_set_updated_at
  on public.enquiries;

create trigger enquiries_set_updated_at
before update on public.enquiries
for each row
execute function public.set_updated_at();
