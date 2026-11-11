insert into private.permission_catalog(permission_key,module_key,description) values
('risks.create','risks','Create project risk records'),('risks.update','risks','Update project risk records')
on conflict(permission_key) do update set module_key=excluded.module_key,description=excluded.description;
insert into private.role_permissions(organization_id,role_id,permission_key,allowed)
select r.organization_id,r.id,p.permission_key,true from public.roles r cross join private.permission_catalog p
where lower(r.name) in ('admin','administrator','owner')
on conflict(role_id,permission_key) do update set allowed=true,updated_at=now();

-- Project risk register
drop policy if exists active_members_select_risks on public.risks;
drop policy if exists active_members_insert_risks on public.risks;
drop policy if exists active_members_update_risks on public.risks;
drop policy if exists active_members_delete_risks on public.risks;
drop policy if exists risks_permission_select on public.risks;
drop policy if exists risks_permission_insert on public.risks;
drop policy if exists risks_permission_update on public.risks;
drop policy if exists risks_permission_delete on public.risks;
create policy risks_permission_select on public.risks for select to authenticated using(private.has_org_permission(organization_id,'risks.view'));
create policy risks_permission_insert on public.risks for insert to authenticated with check(private.has_org_permission(organization_id,'risks.create'));
create policy risks_permission_update on public.risks for update to authenticated using(private.has_org_permission(organization_id,'risks.update')) with check(private.has_org_permission(organization_id,'risks.update'));
create policy risks_permission_delete on public.risks for delete to authenticated using(private.has_org_permission(organization_id,'risks.update'));

-- Safety incidents
drop policy if exists safety_incidents_active_member_select on public.safety_incidents;
drop policy if exists safety_incidents_active_member_insert on public.safety_incidents;
drop policy if exists safety_incidents_active_member_update on public.safety_incidents;
drop policy if exists safety_incidents_active_member_delete on public.safety_incidents;
create policy safety_permission_select on public.safety_incidents for select to authenticated using(private.has_org_permission(organization_id,'safety.view'));
create policy safety_permission_insert on public.safety_incidents for insert to authenticated with check(private.has_org_permission(organization_id,'safety.create'));
create policy safety_permission_update on public.safety_incidents for update to authenticated using(private.has_org_permission(organization_id,'safety.update')) with check(private.has_org_permission(organization_id,'safety.update'));
create policy safety_permission_delete on public.safety_incidents for delete to authenticated using(private.has_org_permission(organization_id,'safety.update'));

-- RFIs / technical queries
drop policy if exists project_rfis_active_member_select on public.project_rfis;
drop policy if exists project_rfis_active_member_insert on public.project_rfis;
drop policy if exists project_rfis_active_member_update on public.project_rfis;
drop policy if exists project_rfis_active_member_delete on public.project_rfis;
create policy rfis_permission_select on public.project_rfis for select to authenticated using(private.has_org_permission(organization_id,'rfis.view'));
create policy rfis_permission_insert on public.project_rfis for insert to authenticated with check(private.has_org_permission(organization_id,'rfis.create'));
create policy rfis_permission_update on public.project_rfis for update to authenticated using(private.has_org_permission(organization_id,'rfis.update')) with check(private.has_org_permission(organization_id,'rfis.update'));
create policy rfis_permission_delete on public.project_rfis for delete to authenticated using(private.has_org_permission(organization_id,'rfis.update'));

-- Contract variations
drop policy if exists contract_variations_active_member_select on public.contract_variations;
drop policy if exists contract_variations_active_member_insert on public.contract_variations;
drop policy if exists contract_variations_active_member_update on public.contract_variations;
drop policy if exists contract_variations_active_member_delete on public.contract_variations;
create policy variations_permission_select on public.contract_variations for select to authenticated using(private.has_org_permission(organization_id,'variations.view'));
create policy variations_permission_insert on public.contract_variations for insert to authenticated with check(private.has_org_permission(organization_id,'variations.create'));
create policy variations_permission_update on public.contract_variations for update to authenticated using(private.has_org_permission(organization_id,'variations.update') or private.has_org_permission(organization_id,'variations.approve')) with check(private.has_org_permission(organization_id,'variations.update') or private.has_org_permission(organization_id,'variations.approve'));
create policy variations_permission_delete on public.contract_variations for delete to authenticated using(private.has_org_permission(organization_id,'variations.update'));

-- Procurement requests, orders and subcontractors
drop policy if exists active_members_select_purchase_requests on public.purchase_requests;
drop policy if exists active_members_insert_purchase_requests on public.purchase_requests;
drop policy if exists active_members_update_purchase_requests on public.purchase_requests;
drop policy if exists active_members_delete_purchase_requests on public.purchase_requests;
create policy procurement_requests_select on public.purchase_requests for select to authenticated using(private.has_org_permission(organization_id,'procurement.view'));
create policy procurement_requests_insert on public.purchase_requests for insert to authenticated with check(private.has_org_permission(organization_id,'procurement.create'));
create policy procurement_requests_update on public.purchase_requests for update to authenticated using(private.has_org_permission(organization_id,'procurement.update') or private.has_org_permission(organization_id,'procurement.approve')) with check(private.has_org_permission(organization_id,'procurement.update') or private.has_org_permission(organization_id,'procurement.approve'));
create policy procurement_requests_delete on public.purchase_requests for delete to authenticated using(private.has_org_permission(organization_id,'procurement.update'));

drop policy if exists active_members_select_purchase_orders on public.purchase_orders;
drop policy if exists active_members_insert_purchase_orders on public.purchase_orders;
drop policy if exists active_members_update_purchase_orders on public.purchase_orders;
drop policy if exists active_members_delete_purchase_orders on public.purchase_orders;
create policy procurement_orders_select on public.purchase_orders for select to authenticated using(private.has_org_permission(organization_id,'procurement.view'));
create policy procurement_orders_insert on public.purchase_orders for insert to authenticated with check(private.has_org_permission(organization_id,'procurement.create'));
create policy procurement_orders_update on public.purchase_orders for update to authenticated using(private.has_org_permission(organization_id,'procurement.update') or private.has_org_permission(organization_id,'procurement.approve')) with check(private.has_org_permission(organization_id,'procurement.update') or private.has_org_permission(organization_id,'procurement.approve'));
create policy procurement_orders_delete on public.purchase_orders for delete to authenticated using(private.has_org_permission(organization_id,'procurement.update'));

drop policy if exists subcontractors_active_member_select on public.subcontractors;
drop policy if exists subcontractors_active_member_insert on public.subcontractors;
drop policy if exists subcontractors_active_member_update on public.subcontractors;
drop policy if exists subcontractors_active_member_delete on public.subcontractors;
create policy subcontractors_permission_select on public.subcontractors for select to authenticated using(private.has_org_permission(organization_id,'procurement.view'));
create policy subcontractors_permission_insert on public.subcontractors for insert to authenticated with check(private.has_org_permission(organization_id,'procurement.create'));
create policy subcontractors_permission_update on public.subcontractors for update to authenticated using(private.has_org_permission(organization_id,'procurement.update')) with check(private.has_org_permission(organization_id,'procurement.update'));
create policy subcontractors_permission_delete on public.subcontractors for delete to authenticated using(private.has_org_permission(organization_id,'procurement.update'));

-- Finance ledgers and invoices
drop policy if exists active_members_select_invoices on public.invoices;
drop policy if exists active_members_insert_invoices on public.invoices;
drop policy if exists active_members_update_invoices on public.invoices;
drop policy if exists active_members_delete_invoices on public.invoices;
create policy finance_invoices_select on public.invoices for select to authenticated using(private.has_org_permission(organization_id,'finance.view'));
create policy finance_invoices_insert on public.invoices for insert to authenticated with check(private.has_org_permission(organization_id,'finance.create'));
create policy finance_invoices_update on public.invoices for update to authenticated using(private.has_org_permission(organization_id,'finance.update') or private.has_org_permission(organization_id,'finance.approve')) with check(private.has_org_permission(organization_id,'finance.update') or private.has_org_permission(organization_id,'finance.approve'));
create policy finance_invoices_delete on public.invoices for delete to authenticated using(private.has_org_permission(organization_id,'finance.update'));

drop policy if exists active_members_select_expenses on public.expenses;
drop policy if exists active_members_insert_expenses on public.expenses;
drop policy if exists active_members_update_expenses on public.expenses;
drop policy if exists active_members_delete_expenses on public.expenses;
create policy finance_expenses_select on public.expenses for select to authenticated using(private.has_org_permission(organization_id,'finance.view'));
create policy finance_expenses_insert on public.expenses for insert to authenticated with check(private.has_org_permission(organization_id,'finance.create'));
create policy finance_expenses_update on public.expenses for update to authenticated using(private.has_org_permission(organization_id,'finance.update')) with check(private.has_org_permission(organization_id,'finance.update'));
create policy finance_expenses_delete on public.expenses for delete to authenticated using(private.has_org_permission(organization_id,'finance.update'));

drop policy if exists active_members_select_project_costs on public.project_costs;
drop policy if exists active_members_insert_project_costs on public.project_costs;
drop policy if exists active_members_update_project_costs on public.project_costs;
drop policy if exists active_members_delete_project_costs on public.project_costs;
create policy finance_project_costs_select on public.project_costs for select to authenticated using(private.has_org_permission(organization_id,'finance.view'));
create policy finance_project_costs_insert on public.project_costs for insert to authenticated with check(private.has_org_permission(organization_id,'finance.create'));
create policy finance_project_costs_update on public.project_costs for update to authenticated using(private.has_org_permission(organization_id,'finance.update')) with check(private.has_org_permission(organization_id,'finance.update'));
create policy finance_project_costs_delete on public.project_costs for delete to authenticated using(private.has_org_permission(organization_id,'finance.update'));

drop policy if exists active_members_select_finance_transactions on public.finance_transactions;
drop policy if exists active_members_insert_finance_transactions on public.finance_transactions;
drop policy if exists active_members_update_finance_transactions on public.finance_transactions;
drop policy if exists active_members_delete_finance_transactions on public.finance_transactions;
create policy finance_transactions_select on public.finance_transactions for select to authenticated using(private.has_org_permission(organization_id,'finance.view'));
create policy finance_transactions_insert on public.finance_transactions for insert to authenticated with check(private.has_org_permission(organization_id,'finance.create'));
create policy finance_transactions_update on public.finance_transactions for update to authenticated using(private.has_org_permission(organization_id,'finance.update')) with check(private.has_org_permission(organization_id,'finance.update'));
create policy finance_transactions_delete on public.finance_transactions for delete to authenticated using(private.has_org_permission(organization_id,'finance.update'));

-- Programme dependency and baseline records
drop policy if exists schedule_dependencies_active_member_select on public.schedule_activity_dependencies;
drop policy if exists schedule_dependencies_active_member_insert on public.schedule_activity_dependencies;
drop policy if exists schedule_dependencies_active_member_update on public.schedule_activity_dependencies;
drop policy if exists schedule_dependencies_active_member_delete on public.schedule_activity_dependencies;
create policy schedule_dependencies_permission_select on public.schedule_activity_dependencies for select to authenticated using(private.has_org_permission(organization_id,'schedule.view'));
create policy schedule_dependencies_permission_insert on public.schedule_activity_dependencies for insert to authenticated with check(private.has_org_permission(organization_id,'schedule.create'));
create policy schedule_dependencies_permission_update on public.schedule_activity_dependencies for update to authenticated using(private.has_org_permission(organization_id,'schedule.update')) with check(private.has_org_permission(organization_id,'schedule.update'));
create policy schedule_dependencies_permission_delete on public.schedule_activity_dependencies for delete to authenticated using(private.has_org_permission(organization_id,'schedule.delete'));

drop policy if exists schedule_baselines_active_member_select on public.schedule_baselines;
drop policy if exists schedule_baselines_active_member_insert on public.schedule_baselines;
create policy schedule_baselines_permission_select on public.schedule_baselines for select to authenticated using(private.has_org_permission(organization_id,'schedule.view'));
create policy schedule_baselines_permission_insert on public.schedule_baselines for insert to authenticated with check(private.has_org_permission(organization_id,'schedule.create'));
