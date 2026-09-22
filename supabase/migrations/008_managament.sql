-- ============================================================
-- BuildFlow / Tishande Core
-- Migration: 008_management.sql
-- Purpose: Staff, equipment, work orders, risk and quality
-- ============================================================


-- ------------------------------------------------------------
-- STAFF
-- ------------------------------------------------------------

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  user_id uuid null
    references auth.users(id)
    on delete set null,

  employee_number text,
  first_name text not null,
  last_name text not null,

  job_title text,
  department text,

  email text,
  phone text,

  employment_status text not null default 'active'
    check (
      employment_status in (
        'active',
        'inactive',
        'on_leave',
        'terminated'
      )
    ),

  hire_date date,

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint staff_unique_employee_number
    unique (organization_id, employee_number)
);

create index if not exists idx_staff_org
  on public.staff(organization_id);

create index if not exists idx_staff_user
  on public.staff(user_id);

create index if not exists idx_staff_status
  on public.staff(
    organization_id,
    employment_status
  );

create index if not exists idx_staff_department
  on public.staff(
    organization_id,
    department
  );


-- ------------------------------------------------------------
-- EQUIPMENT
-- ------------------------------------------------------------

create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  equipment_code text not null,
  name text not null,

  category text,
  description text,

  serial_number text,

  status text not null default 'available'
    check (
      status in (
        'available',
        'assigned',
        'maintenance',
        'retired'
      )
    ),

  purchase_date date,
  purchase_cost numeric(14,2),

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint equipment_unique_code
    unique (organization_id, equipment_code),

  constraint equipment_purchase_cost_nonnegative
    check (
      purchase_cost is null
      or purchase_cost >= 0
    )
);

create index if not exists idx_equipment_org
  on public.equipment(organization_id);

create index if not exists idx_equipment_status
  on public.equipment(
    organization_id,
    status
  );

create index if not exists idx_equipment_category
  on public.equipment(
    organization_id,
    category
  );


-- ------------------------------------------------------------
-- EQUIPMENT ASSIGNMENTS
-- ------------------------------------------------------------

create table if not exists public.equipment_assignments (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  equipment_id uuid not null
    references public.equipment(id)
    on delete cascade,

  project_id uuid null
    references public.projects(id)
    on delete set null,

  staff_id uuid null
    references public.staff(id)
    on delete set null,

  assigned_by uuid null
    references auth.users(id)
    on delete set null,

  assigned_at timestamptz not null default now(),

  returned_at timestamptz,

  notes text
);

create index if not exists idx_equipment_assignments_org
  on public.equipment_assignments(organization_id);

create index if not exists idx_equipment_assignments_equipment
  on public.equipment_assignments(equipment_id);

create index if not exists idx_equipment_assignments_project
  on public.equipment_assignments(project_id);

create index if not exists idx_equipment_assignments_staff
  on public.equipment_assignments(staff_id);


-- ------------------------------------------------------------
-- WORK ORDERS
-- ------------------------------------------------------------

create table if not exists public.work_orders (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  project_id uuid null
    references public.projects(id)
    on delete set null,

  equipment_id uuid null
    references public.equipment(id)
    on delete set null,

  assigned_to uuid null
    references auth.users(id)
    on delete set null,

  title text not null,
  description text,

  work_order_number text,

  priority text not null default 'medium'
    check (
      priority in (
        'low',
        'medium',
        'high',
        'urgent'
      )
    ),

  status text not null default 'open'
    check (
      status in (
        'open',
        'in_progress',
        'completed',
        'cancelled'
      )
    ),

  scheduled_date date,
  completed_at timestamptz,

  estimated_cost numeric(14,2),
  actual_cost numeric(14,2),

  notes text,

  created_by uuid null
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint work_orders_estimated_cost_nonnegative
    check (
      estimated_cost is null
      or estimated_cost >= 0
    ),

  constraint work_orders_actual_cost_nonnegative
    check (
      actual_cost is null
      or actual_cost >= 0
    ),

  constraint work_orders_unique_number
    unique (organization_id, work_order_number)
);

create index if not exists idx_work_orders_org
  on public.work_orders(organization_id);

create index if not exists idx_work_orders_project
  on public.work_orders(project_id);

create index if not exists idx_work_orders_equipment
  on public.work_orders(equipment_id);

create index if not exists idx_work_orders_status
  on public.work_orders(
    organization_id,
    status
  );

create index if not exists idx_work_orders_priority
  on public.work_orders(
    organization_id,
    priority
  );


-- ------------------------------------------------------------
-- RISKS
-- ------------------------------------------------------------

create table if not exists public.risks (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  project_id uuid null
    references public.projects(id)
    on delete cascade,

  title text not null,
  description text,

  category text,

  likelihood text not null default 'medium'
    check (
      likelihood in (
        'low',
        'medium',
        'high'
      )
    ),

  impact text not null default 'medium'
    check (
      impact in (
        'low',
        'medium',
        'high'
      )
    ),

  status text not null default 'open'
    check (
      status in (
        'open',
        'mitigating',
        'closed',
        'accepted'
      )
    ),

  mitigation_plan text,

  owner_id uuid null
    references auth.users(id)
    on delete set null,

  due_date date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_risks_org
  on public.risks(organization_id);

create index if not exists idx_risks_project
  on public.risks(project_id);

create index if not exists idx_risks_status
  on public.risks(
    organization_id,
    status
  );

create index if not exists idx_risks_likelihood
  on public.risks(
    organization_id,
    likelihood
  );


-- ------------------------------------------------------------
-- QUALITY ISSUES
-- ------------------------------------------------------------

create table if not exists public.quality_issues (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  project_id uuid null
    references public.projects(id)
    on delete cascade,

  title text not null,
  description text,

  category text,

  severity text not null default 'medium'
    check (
      severity in (
        'low',
        'medium',
        'high',
        'critical'
      )
    ),

  status text not null default 'open'
    check (
      status in (
        'open',
        'under_review',
        'resolved',
        'closed'
      )
    ),

  corrective_action text,

  assigned_to uuid null
    references auth.users(id)
    on delete set null,

  due_date date,
  resolved_at timestamptz,

  created_by uuid null
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_quality_issues_org
  on public.quality_issues(organization_id);

create index if not exists idx_quality_issues_project
  on public.quality_issues(project_id);

create index if not exists idx_quality_issues_status
  on public.quality_issues(
    organization_id,
    status
  );

create index if not exists idx_quality_issues_severity
  on public.quality_issues(
    organization_id,
    severity
  );


-- ------------------------------------------------------------
-- INSPECTIONS
-- ------------------------------------------------------------

create table if not exists public.inspections (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  project_id uuid null
    references public.projects(id)
    on delete cascade,

  inspection
