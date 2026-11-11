create table if not exists public.site_diaries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  diary_date date not null default current_date,
  weather_conditions text,
  site_conditions text,
  work_performed text not null,
  labour_count integer not null default 0 check (labour_count >= 0),
  plant_equipment text,
  materials_delivered text,
  delays_disruptions text,
  instructions_received text,
  safety_observations text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists site_diaries_org_project_date_idx
  on public.site_diaries (organization_id, project_id, diary_date desc);

create table if not exists public.schedule_activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  parent_activity_id uuid references public.schedule_activities(id) on delete set null,
  activity_code text,
  name text not null,
  description text,
  planned_start date,
  planned_finish date,
  actual_start date,
  actual_finish date,
  duration_days integer check (duration_days is null or duration_days >= 0),
  progress_percent numeric(5,2) not null default 0 check (progress_percent between 0 and 100),
  status text not null default 'not_started' check (status in ('not_started','in_progress','completed','on_hold','delayed')),
  sequence_order integer not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists schedule_activities_org_project_order_idx
  on public.schedule_activities (organization_id, project_id, sequence_order);

create table if not exists public.project_budgets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  cost_code text not null,
  description text not null,
  budget_amount numeric(14,2) not null default 0 check (budget_amount >= 0),
  committed_amount numeric(14,2) not null default 0 check (committed_amount >= 0),
  actual_amount numeric(14,2) not null default 0 check (actual_amount >= 0),
  forecast_amount numeric(14,2) not null default 0 check (forecast_amount >= 0),
  currency_code text not null default 'USD',
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, project_id, cost_code)
);
create index if not exists project_budgets_org_project_idx
  on public.project_budgets (organization_id, project_id);

create table if not exists public.contract_variations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  variation_number text not null,
  title text not null,
  description text,
  reason text,
  submitted_amount numeric(14,2) not null default 0,
  approved_amount numeric(14,2),
  time_extension_days integer check (time_extension_days is null or time_extension_days >= 0),
  status text not null default 'draft' check (status in ('draft','submitted','under_review','approved','rejected','withdrawn')),
  submitted_at timestamptz,
  decided_at timestamptz,
  decision_notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, project_id, variation_number)
);
create index if not exists contract_variations_org_project_status_idx
  on public.contract_variations (organization_id, project_id, status);

create table if not exists public.subcontractors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  business_name text not null,
  trade_category text not null,
  contact_name text,
  email text,
  phone text,
  compliance_status text not null default 'pending' check (compliance_status in ('pending','compliant','expired','non_compliant')),
  insurance_expiry date,
  licence_expiry date,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists subcontractors_org_trade_idx
  on public.subcontractors (organization_id, trade_category);

create table if not exists public.safety_incidents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  incident_number text,
  incident_type text not null check (incident_type in ('incident','near_miss','hazard','environmental_event')),
  title text not null,
  description text not null,
  incident_date timestamptz not null,
  location text,
  severity text not null default 'low' check (severity in ('low','moderate','high','critical')),
  persons_affected integer not null default 0 check (persons_affected >= 0),
  immediate_action text,
  corrective_action text,
  assigned_to uuid references auth.users(id),
  status text not null default 'open' check (status in ('open','investigating','action_required','closed')),
  closed_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists safety_incidents_org_project_date_idx
  on public.safety_incidents (organization_id, project_id, incident_date desc);

create table if not exists public.project_rfis (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  rfi_number text not null,
  subject text not null,
  question text not null,
  discipline text,
  raised_by uuid references auth.users(id),
  assigned_to uuid references auth.users(id),
  due_date date,
  response text,
  status text not null default 'open' check (status in ('open','under_review','answered','closed','void')),
  responded_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, project_id, rfi_number)
);
create index if not exists project_rfis_org_project_status_idx
  on public.project_rfis (organization_id, project_id, status);

do $$
declare t text;
begin
  foreach t in array array['site_diaries','schedule_activities','project_budgets','contract_variations','subcontractors','safety_incidents','project_rfis']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('create policy %I on public.%I for select to authenticated using ((select private.is_active_org_member(organization_id)))', t || '_active_member_select', t);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select private.is_active_org_member(organization_id)))', t || '_active_member_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using ((select private.is_active_org_member(organization_id))) with check ((select private.is_active_org_member(organization_id)))', t || '_active_member_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using ((select private.is_active_org_member(organization_id)))', t || '_active_member_delete', t);
  end loop;
end $$;
