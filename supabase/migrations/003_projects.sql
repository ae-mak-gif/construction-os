-- BuildFlow V1
-- Migration: 003_projects.sql
-- Purpose: Projects and project operations

-- =========================================================
-- 1. PROJECTS
-- =========================================================

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  client_id uuid
    references public.clients(id) on delete set null,

  name text not null,
  project_code text,

  description text,
  location text,

  status text not null default 'planning'
    check (
      status in (
        'planning',
        'active',
        'on_hold',
        'completed',
        'cancelled'
      )
    ),

  health_status text not null default 'on_track'
    check (
      health_status in (
        'on_track',
        'at_risk',
        'critical',
        'completed'
      )
    ),

  start_date date,
  expected_completion_date date,
  actual_completion_date date,

  contract_value numeric(14,2),

  progress_percent numeric(5,2) not null default 0
    check (progress_percent >= 0 and progress_percent <= 100),

  project_manager_id uuid
    references auth.users(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (organization_id, project_code)
);


-- =========================================================
-- 2. PROJECT MEMBERS
-- =========================================================

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),

  project_id uuid not null
    references public.projects(id) on delete cascade,

  user_id uuid
    references auth.users(id) on delete cascade,

  staff_id uuid,

  role text,

  created_at timestamptz not null default now(),

  check (user_id is not null or staff_id is not null)
);


-- =========================================================
-- 3. TASKS
-- =========================================================

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  project_id uuid
    references public.projects(id) on delete cascade,

  title text not null,
  description text,

  status text not null default 'todo'
    check (
      status in (
        'todo',
        'in_progress',
        'blocked',
        'completed',
        'cancelled'
      )
    ),

  priority text not null default 'medium'
    check (
      priority in (
        'low',
        'medium',
        'high',
        'urgent'
      )
    ),

  assigned_to uuid
    references auth.users(id) on delete set null,

  due_date date,
  completed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- =========================================================
-- 4. CALENDAR EVENTS
-- =========================================================

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  project_id uuid
    references public.projects(id) on delete cascade,

  task_id uuid
    references public.tasks(id) on delete set null,

  title text not null,
  description text,

  start_at timestamptz not null,
  end_at timestamptz,

  location text,

  event_type text,

  created_by uuid
    references auth.users(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- =========================================================
-- 5. PROJECT UPDATES
-- =========================================================

create table if not exists public.project_updates (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  project_id uuid not null
    references public.projects(id) on delete cascade,

  title text not null,
  content text,

  progress_percent numeric(5,2)
    check (progress_percent >= 0 and progress_percent <= 100),

  created_by uuid
    references auth.users(id) on delete set null,

  created_at timestamptz not null default now()
);


-- =========================================================
-- 6. PROJECT DOCUMENTS
-- =========================================================

create table if not exists public.project_documents (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  project_id uuid not null
    references public.projects(id) on delete cascade,

  name text not null,
  description text,

  file_url text,
  file_path text,
  file_type text,

  uploaded_by uuid
    references auth.users(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- =========================================================
-- 7. PROJECT APPROVALS
-- =========================================================

create table if not exists public.project_approvals (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  project_id uuid not null
    references public.projects(id) on delete cascade,

  title text not null,
  description text,

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'approved',
        'rejected',
        'cancelled'
      )
    ),

  requested_by uuid
    references auth.users(id) on delete set null,

  approved_by uuid
    references auth.users(id) on delete set null,

  requested_at timestamptz not null default now(),
  responded_at timestamptz
);


-- =========================================================
-- 8. INDEXES
-- =========================================================

create index if not exists idx_projects_organization_id
  on public.projects(organization_id);

create index if not exists idx_projects_client_id
  on public.projects(client_id);

create index if not exists idx_projects_status
  on public.projects(status);

create index if not exists idx_projects_health_status
  on public.projects(health_status);

create index if not exists idx_projects_manager
  on public.projects(project_manager_id);

create index if not exists idx_project_members_project_id
  on public.project_members(project_id);

create index if not exists idx_project_members_user_id
  on public.project_members(user_id);

create index if not exists idx_tasks_organization_id
  on public.tasks(organization_id);

create index if not exists idx_tasks_project_id
  on public.tasks(project_id);

create index if not exists idx_tasks_status
  on public.tasks(status);

create index if not exists idx_tasks_due_date
  on public.tasks(due_date);

create index if not exists idx_calendar_events_project_id
  on public.calendar_events(project_id);

create index if not exists idx_calendar_events_start_at
  on public.calendar_events(start_at);

create index if not exists idx_project_updates_project_id
  on public.project_updates(project_id);

create index if not exists idx_project_documents_project_id
  on public.project_documents(project_id);

create index if not exists idx_project_approvals_project_id
  on public.project_approvals(project_id);


-- =========================================================
-- 9. UPDATED_AT TRIGGERS
-- =========================================================

drop trigger if exists projects_set_updated_at
  on public.projects;

create trigger projects_set_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();


drop trigger if exists tasks_set_updated_at
  on public.tasks;

create trigger tasks_set_updated_at
before update on public.tasks
for each row
execute function public.set_updated_at();


drop trigger if exists calendar_events_set_updated_at
  on public.calendar_events;

create trigger calendar_events_set_updated_at
before update on public.calendar_events
for each row
execute function public.set_updated_at();


drop trigger if exists project_documents_set_updated_at
  on public.project_documents;

create trigger project_documents_set_updated_at
before update on public.project_documents
for each row
execute function public.set_updated_at();
