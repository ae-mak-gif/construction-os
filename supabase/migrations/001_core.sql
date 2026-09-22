-- BuildFlow V1
-- Migration: 001_core.sql
-- Purpose: Core multi-tenant foundation
-- Tables: organizations, profiles, roles, organization_members,
--         notifications, activities

-- =========================================================
-- 1. EXTENSIONS
-- =========================================================

create extension if not exists pgcrypto;


-- =========================================================
-- 2. ORGANIZATIONS
-- =========================================================

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  legal_name text,
  slug text not null unique,

  industry text,
  country text,
  currency text default 'USD',
  timezone text default 'Africa/Harare',

  logo_url text,

  status text not null default 'active'
    check (status in ('active', 'inactive', 'suspended')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- =========================================================
-- 3. PROFILES
-- Linked to Supabase Auth users
-- =========================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  first_name text,
  last_name text,

  display_name text,
  phone text,
  avatar_url text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- =========================================================
-- 4. ROLES
-- Organization-specific application roles
-- =========================================================

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  name text not null,
  description text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (id, organization_id),
  unique (organization_id, name)
);


-- =========================================================
-- 5. ORGANIZATION MEMBERS
-- Connects authenticated users to organizations
-- =========================================================

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  user_id uuid not null
    references auth.users(id) on delete cascade,

  role_id uuid not null,

  status text not null default 'active'
    check (status in ('invited', 'active', 'inactive', 'suspended')),

  joined_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (organization_id, user_id),

  foreign key (role_id, organization_id)
    references public.roles(id, organization_id)
    on delete restrict
);


-- =========================================================
-- 6. NOTIFICATIONS
-- User-specific notifications
-- =========================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  user_id uuid not null
    references auth.users(id) on delete cascade,

  type text,
  title text not null,
  message text,

  is_read boolean not null default false,
  read_at timestamptz,

  link text,

  created_at timestamptz not null default now()
);


-- =========================================================
-- 7. ACTIVITIES
-- General organization activity/audit feed
-- =========================================================

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  actor_user_id uuid
    references auth.users(id) on delete set null,

  activity_type text not null,
  title text not null,
  description text,

  entity_type text,
  entity_id uuid,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);


-- =========================================================
-- 8. INDEXES
-- =========================================================

create index if not exists idx_roles_organization_id
  on public.roles(organization_id);

create index if not exists idx_organization_members_organization_id
  on public.organization_members(organization_id);

create index if not exists idx_organization_members_user_id
  on public.organization_members(user_id);

create index if not exists idx_notifications_organization_id
  on public.notifications(organization_id);

create index if not exists idx_notifications_user_id
  on public.notifications(user_id);

create index if not exists idx_notifications_is_read
  on public.notifications(is_read);

create index if not exists idx_activities_organization_id
  on public.activities(organization_id);

create index if not exists idx_activities_actor_user_id
  on public.activities(actor_user_id);

create index if not exists idx_activities_created_at
  on public.activities(created_at desc);


-- =========================================================
-- 9. UPDATED_AT FUNCTION
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- =========================================================
-- 10. UPDATED_AT TRIGGERS
-- =========================================================

drop trigger if exists organizations_set_updated_at
  on public.organizations;

create trigger organizations_set_updated_at
before update on public.organizations
for each row
execute function public.set_updated_at();


drop trigger if exists profiles_set_updated_at
  on public.profiles;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();


drop trigger if exists roles_set_updated_at
  on public.roles;

create trigger roles_set_updated_at
before update on public.roles
for each row
execute function public.set_updated_at();


drop trigger if exists organization_members_set_updated_at
  on public.organization_members;

create trigger organization_members_set_updated_at
before update on public.organization_members
for each row
execute function public.set_updated_at();
