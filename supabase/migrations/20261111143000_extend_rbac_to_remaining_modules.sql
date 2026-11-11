-- Extend the permission catalogue and remove remaining broad CRUD policies from operational tables.
insert into private.permission_catalog(permission_key,module_key,description) values
('crm.view','crm','View clients, contacts, enquiries and CRM activity'),('crm.create','crm','Create CRM records'),('crm.update','crm','Update CRM records'),('crm.delete','crm','Delete CRM records'),
('communications.view','communications','View communication logs'),('communications.create','communications','Create communication logs'),('communications.update','communications','Update communication logs'),
('boq.view','boq','View BOQ and estimates'),('boq.create','boq','Create BOQ and estimate records'),('boq.update','boq','Update BOQ and estimate records'),
('calendar.view','calendar','View calendar events'),('calendar.create','calendar','Create calendar events'),('calendar.update','calendar','Update calendar events'),
('equipment.view','equipment','View equipment and assignments'),('equipment.create','equipment','Create equipment records'),('equipment.update','equipment','Update equipment and assignments'),
('inventory.view','inventory','View inventory and stock transactions'),('inventory.create','inventory','Create inventory and stock transactions'),('inventory.update','inventory','Update inventory and stock transactions'),
('approvals.view','approvals','View approval requests'),('approvals.create','approvals','Create approval requests'),('approvals.update','approvals','Update approval requests'),('approvals.approve','approvals','Approve or reject approval requests'),
('project_members.view','project_members','View project membership'),('project_members.manage','project_members','Manage project membership'),
('quality.view','quality','View quality issues and inspections'),('quality.create','quality','Create quality issues and inspections'),('quality.update','quality','Update quality issues and inspections'),
('site_diaries.view','site_diaries','View daily site diaries'),('site_diaries.create','site_diaries','Create daily site diaries'),('site_diaries.update','site_diaries','Update daily site diaries'),
('work_orders.view','work_orders','View maintenance and work orders'),('work_orders.create','work_orders','Create maintenance and work orders'),('work_orders.update','work_orders','Update maintenance and work orders'),
('workforce.create','workforce','Create staff and workforce records'),('workforce.update','workforce','Update staff and workforce records')
on conflict(permission_key) do update set module_key=excluded.module_key,description=excluded.description;

insert into private.role_permissions(organization_id,role_id,permission_key,allowed)
select r.organization_id,r.id,p.permission_key,true from public.roles r cross join private.permission_catalog p
where lower(r.name) in ('admin','administrator','owner')
on conflict(role_id,permission_key) do update set allowed=true,updated_at=now();

create or replace function private.has_project_permission(target_project_id uuid,target_permission_key text)
returns boolean language sql stable security definer set search_path=''
as $$
  select exists(select 1 from public.projects p where p.id=target_project_id and private.has_org_permission(p.organization_id,target_permission_key));
$$;
revoke all on function private.has_project_permission(uuid,text) from public,anon;
grant execute on function private.has_project_permission(uuid,text) to authenticated;

do $$
declare item record; old_policy record;
begin
  for item in
    select * from (values
      ('activities','crm.view','crm.create','crm.update','crm.delete'),
      ('boq_items','boq.view','boq.create','boq.update','boq.update'),
      ('calendar_events','calendar.view','calendar.create','calendar.update','calendar.update'),
      ('clients','crm.view','crm.create','crm.update','crm.delete'),
      ('communication_logs','communications.view','communications.create','communications.update','communications.update'),
      ('contacts','crm.view','crm.create','crm.update','crm.delete'),
      ('enquiries','crm.view','crm.create','crm.update','crm.delete'),
      ('equipment','equipment.view','equipment.create','equipment.update','equipment.update'),
      ('equipment_assignments','equipment.view','equipment.create','equipment.update','equipment.update'),
      ('estimate_items','boq.view','boq.create','boq.update','boq.update'),
      ('estimates','boq.view','boq.create','boq.update','boq.update'),
      ('inspections','quality.view','quality.create','quality.update','quality.update'),
      ('inventory_items','inventory.view','inventory.create','inventory.update','inventory.update'),
      ('inventory_transactions','inventory.view','inventory.create','inventory.update','inventory.update'),
      ('payments','finance.view','finance.create','finance.update','finance.update'),
      ('project_approvals','approvals.view','approvals.create','approvals.approve','approvals.update'),
      ('project_documents','documents.view','documents.upload','documents.share','documents.delete'),
      ('project_updates','projects.view','projects.update','projects.update','projects.update'),
      ('purchase_order_items','procurement.view','procurement.create','procurement.update','procurement.update'),
      ('quality_issues','quality.view','quality.create','quality.update','quality.update'),
      ('site_diaries','site_diaries.view','site_diaries.create','site_diaries.update','site_diaries.update'),
      ('staff','workforce.view','workforce.create','workforce.update','workforce.update'),
      ('suppliers','procurement.view','procurement.create','procurement.update','procurement.update'),
      ('work_orders','work_orders.view','work_orders.create','work_orders.update','work_orders.update')
    ) as x(table_name,select_permission,insert_permission,update_permission,delete_permission)
  loop
    for old_policy in select policyname from pg_policies
      where schemaname='public' and tablename=item.table_name
      and (coalesce(qual,'') like '%is_active_org_member%' or coalesce(with_check,'') like '%is_active_org_member%')
    loop
      execute format('drop policy if exists %I on public.%I',old_policy.policyname,item.table_name);
    end loop;
    execute format('drop policy if exists %I on public.%I','rbac_'||item.table_name||'_select',item.table_name);
    execute format('drop policy if exists %I on public.%I','rbac_'||item.table_name||'_insert',item.table_name);
    execute format('drop policy if exists %I on public.%I','rbac_'||item.table_name||'_update',item.table_name);
    execute format('drop policy if exists %I on public.%I','rbac_'||item.table_name||'_delete',item.table_name);
    execute format('create policy %I on public.%I for select to authenticated using (private.has_org_permission(organization_id,%L))','rbac_'||item.table_name||'_select',item.table_name,item.select_permission);
    execute format('create policy %I on public.%I for insert to authenticated with check (private.has_org_permission(organization_id,%L))','rbac_'||item.table_name||'_insert',item.table_name,item.insert_permission);
    execute format('create policy %I on public.%I for update to authenticated using (private.has_org_permission(organization_id,%L)) with check (private.has_org_permission(organization_id,%L))','rbac_'||item.table_name||'_update',item.table_name,item.update_permission,item.update_permission);
    execute format('create policy %I on public.%I for delete to authenticated using (private.has_org_permission(organization_id,%L))','rbac_'||item.table_name||'_delete',item.table_name,item.delete_permission);
  end loop;

  for old_policy in select policyname from pg_policies where schemaname='public' and tablename='project_members'
    and (coalesce(qual,'') like '%is_active_org_member%' or coalesce(with_check,'') like '%is_active_org_member%')
  loop
    execute format('drop policy if exists %I on public.project_members',old_policy.policyname);
  end loop;
  drop policy if exists rbac_project_members_select on public.project_members;
  drop policy if exists rbac_project_members_insert on public.project_members;
  drop policy if exists rbac_project_members_update on public.project_members;
  drop policy if exists rbac_project_members_delete on public.project_members;
  create policy rbac_project_members_select on public.project_members for select to authenticated using(private.has_project_permission(project_id,'project_members.view'));
  create policy rbac_project_members_insert on public.project_members for insert to authenticated with check(private.has_project_permission(project_id,'project_members.manage'));
  create policy rbac_project_members_update on public.project_members for update to authenticated using(private.has_project_permission(project_id,'project_members.manage')) with check(private.has_project_permission(project_id,'project_members.manage'));
  create policy rbac_project_members_delete on public.project_members for delete to authenticated using(private.has_project_permission(project_id,'project_members.manage'));
end $$;
