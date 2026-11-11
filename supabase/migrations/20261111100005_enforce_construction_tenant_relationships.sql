alter table public.projects add constraint projects_id_organization_id_key unique (id, organization_id);
alter table public.suppliers add constraint suppliers_id_organization_id_key unique (id, organization_id);
alter table public.schedule_activities add constraint schedule_activities_id_organization_id_key unique (id, organization_id);

alter table public.site_diaries drop constraint if exists site_diaries_project_id_fkey;
alter table public.site_diaries add constraint site_diaries_project_org_fkey foreign key (project_id, organization_id) references public.projects(id, organization_id) on delete cascade;
create index if not exists site_diaries_project_org_fk_idx on public.site_diaries(project_id, organization_id);

alter table public.schedule_activities drop constraint if exists schedule_activities_project_id_fkey;
alter table public.schedule_activities add constraint schedule_activities_project_org_fkey foreign key (project_id, organization_id) references public.projects(id, organization_id) on delete cascade;
alter table public.schedule_activities drop constraint if exists schedule_activities_parent_activity_id_fkey;
alter table public.schedule_activities add constraint schedule_activities_parent_org_fkey foreign key (parent_activity_id, organization_id) references public.schedule_activities(id, organization_id) on delete restrict;
create index if not exists schedule_activities_project_org_fk_idx on public.schedule_activities(project_id, organization_id);

alter table public.project_budgets drop constraint if exists project_budgets_project_id_fkey;
alter table public.project_budgets add constraint project_budgets_project_org_fkey foreign key (project_id, organization_id) references public.projects(id, organization_id) on delete cascade;
create index if not exists project_budgets_project_org_fk_idx on public.project_budgets(project_id, organization_id);

alter table public.contract_variations drop constraint if exists contract_variations_project_id_fkey;
alter table public.contract_variations add constraint contract_variations_project_org_fkey foreign key (project_id, organization_id) references public.projects(id, organization_id) on delete cascade;
create index if not exists contract_variations_project_org_fk_idx on public.contract_variations(project_id, organization_id);

alter table public.safety_incidents drop constraint if exists safety_incidents_project_id_fkey;
alter table public.safety_incidents add constraint safety_incidents_project_org_fkey foreign key (project_id, organization_id) references public.projects(id, organization_id) on delete cascade;
create index if not exists safety_incidents_project_org_fk_idx on public.safety_incidents(project_id, organization_id);

alter table public.project_rfis drop constraint if exists project_rfis_project_id_fkey;
alter table public.project_rfis add constraint project_rfis_project_org_fkey foreign key (project_id, organization_id) references public.projects(id, organization_id) on delete cascade;
create index if not exists project_rfis_project_org_fk_idx on public.project_rfis(project_id, organization_id);

alter table public.subcontractors drop constraint if exists subcontractors_supplier_id_fkey;
alter table public.subcontractors add constraint subcontractors_supplier_org_fkey foreign key (supplier_id, organization_id) references public.suppliers(id, organization_id) on delete restrict;
create index if not exists subcontractors_supplier_org_fk_idx on public.subcontractors(supplier_id, organization_id);
