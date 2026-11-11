alter table public.schedule_activities
  add column if not exists is_milestone boolean not null default false;

create unique index if not exists schedule_activities_id_org_project_uidx
  on public.schedule_activities (id, organization_id, project_id);

create table if not exists public.schedule_activity_dependencies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null,
  predecessor_activity_id uuid not null,
  successor_activity_id uuid not null,
  dependency_type text not null default 'finish_to_start'
    check (dependency_type in ('finish_to_start','start_to_start','finish_to_finish','start_to_finish')),
  lag_days integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint schedule_dependency_not_self check (predecessor_activity_id <> successor_activity_id),
  constraint schedule_dependency_unique unique (organization_id, predecessor_activity_id, successor_activity_id),
  constraint schedule_dependency_project_fk foreign key (project_id, organization_id)
    references public.projects(id, organization_id) on delete cascade,
  constraint schedule_dependency_predecessor_fk foreign key (predecessor_activity_id, organization_id, project_id)
    references public.schedule_activities(id, organization_id, project_id) on delete cascade,
  constraint schedule_dependency_successor_fk foreign key (successor_activity_id, organization_id, project_id)
    references public.schedule_activities(id, organization_id, project_id) on delete cascade
);

create index if not exists schedule_dependency_project_idx
  on public.schedule_activity_dependencies (organization_id, project_id);
create index if not exists schedule_dependency_successor_idx
  on public.schedule_activity_dependencies (successor_activity_id, organization_id, project_id);

create or replace function private.prevent_schedule_dependency_cycle()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    with recursive reachable(activity_id) as (
      select new.successor_activity_id
      union
      select d.successor_activity_id
      from public.schedule_activity_dependencies d
      join reachable r on d.predecessor_activity_id = r.activity_id
      where d.organization_id = new.organization_id
        and d.project_id = new.project_id
        and (tg_op = 'INSERT' or d.id <> new.id)
    )
    select 1 from reachable where activity_id = new.predecessor_activity_id
  ) then
    raise exception 'This dependency would create a circular schedule relationship.';
  end if;
  return new;
end;
$$;

drop trigger if exists schedule_dependency_cycle_guard on public.schedule_activity_dependencies;
create trigger schedule_dependency_cycle_guard
before insert or update of predecessor_activity_id, successor_activity_id, organization_id, project_id
on public.schedule_activity_dependencies
for each row execute function private.prevent_schedule_dependency_cycle();

create table if not exists public.schedule_baselines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null,
  baseline_name text not null,
  baseline_date date not null default current_date,
  snapshot jsonb not null default '[]'::jsonb,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint schedule_baseline_project_fk foreign key (project_id, organization_id)
    references public.projects(id, organization_id) on delete cascade,
  constraint schedule_baseline_snapshot_array check (jsonb_typeof(snapshot) = 'array')
);

create index if not exists schedule_baselines_project_idx
  on public.schedule_baselines (organization_id, project_id, baseline_date desc);

alter table public.schedule_activity_dependencies enable row level security;
alter table public.schedule_baselines enable row level security;

drop policy if exists schedule_dependencies_active_member_select on public.schedule_activity_dependencies;
create policy schedule_dependencies_active_member_select on public.schedule_activity_dependencies
  for select to authenticated
  using ((select private.is_active_org_member(organization_id)));
drop policy if exists schedule_dependencies_active_member_insert on public.schedule_activity_dependencies;
create policy schedule_dependencies_active_member_insert on public.schedule_activity_dependencies
  for insert to authenticated
  with check ((select private.is_active_org_member(organization_id)));
drop policy if exists schedule_dependencies_active_member_update on public.schedule_activity_dependencies;
create policy schedule_dependencies_active_member_update on public.schedule_activity_dependencies
  for update to authenticated
  using ((select private.is_active_org_member(organization_id)))
  with check ((select private.is_active_org_member(organization_id)));
drop policy if exists schedule_dependencies_active_member_delete on public.schedule_activity_dependencies;
create policy schedule_dependencies_active_member_delete on public.schedule_activity_dependencies
  for delete to authenticated
  using ((select private.is_active_org_member(organization_id)));

drop policy if exists schedule_baselines_active_member_select on public.schedule_baselines;
create policy schedule_baselines_active_member_select on public.schedule_baselines
  for select to authenticated
  using ((select private.is_active_org_member(organization_id)));
drop policy if exists schedule_baselines_active_member_insert on public.schedule_baselines;
create policy schedule_baselines_active_member_insert on public.schedule_baselines
  for insert to authenticated
  with check ((select private.is_active_org_member(organization_id)));
