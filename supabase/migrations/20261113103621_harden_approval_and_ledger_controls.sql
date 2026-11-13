-- Preserve approval history and financial / stock ledgers.
drop policy if exists rbac_project_approvals_delete on public.project_approvals;
drop policy if exists rbac_payments_delete on public.payments;
drop policy if exists finance_expenses_delete on public.expenses;
drop policy if exists finance_transactions_delete on public.finance_transactions;
drop policy if exists finance_transactions_update on public.finance_transactions;
drop policy if exists finance_project_costs_delete on public.project_costs;
drop policy if exists finance_project_costs_update on public.project_costs;
drop policy if exists rbac_inventory_transactions_delete on public.inventory_transactions;
drop policy if exists rbac_inventory_transactions_update on public.inventory_transactions;
drop policy if exists procurement_requests_delete on public.purchase_requests;

drop policy if exists finance_invoices_delete on public.invoices;
create policy finance_invoices_delete_draft
on public.invoices for delete to authenticated
using (status = 'draft' and private.has_org_permission(organization_id, 'finance.update'));

drop policy if exists procurement_orders_delete on public.purchase_orders;
create policy procurement_orders_delete_draft
on public.purchase_orders for delete to authenticated
using (status = 'draft' and private.has_org_permission(organization_id, 'procurement.update'));

drop policy if exists variations_permission_delete on public.contract_variations;
create policy variations_delete_draft
on public.contract_variations for delete to authenticated
using (status = 'draft' and private.has_org_permission(organization_id, 'variations.update'));

drop policy if exists project_budgets_permission_delete on public.project_budgets;
create policy project_budgets_delete_unused
on public.project_budgets for delete to authenticated
using (
  budget_amount = 0 and committed_amount = 0 and actual_amount = 0 and forecast_amount = 0
  and private.has_org_permission(organization_id, 'finance.update')
);

create or replace function private.enforce_approval_transitions()
returns trigger language plpgsql set search_path = ''
as $function$
begin
  if tg_table_name = 'contract_variations' then
    if old.status in ('submitted','under_review','approved','rejected','withdrawn') and (
      new.organization_id is distinct from old.organization_id
      or new.project_id is distinct from old.project_id
      or new.variation_number is distinct from old.variation_number
      or new.title is distinct from old.title
      or new.description is distinct from old.description
      or new.reason is distinct from old.reason
      or new.submitted_amount is distinct from old.submitted_amount
      or new.time_extension_days is distinct from old.time_extension_days
    ) then
      raise exception 'Submitted variation terms are locked; withdraw and create a new revision' using errcode = '42501';
    end if;
    if new.status is distinct from old.status and new.status in ('approved','rejected')
       and not private.has_org_permission(new.organization_id, 'variations.approve') then
      raise exception 'Approval permission required to approve or reject a contract variation' using errcode = '42501';
    end if;
    if new.approved_amount is distinct from old.approved_amount
       or new.decided_at is distinct from old.decided_at
       or new.decision_notes is distinct from old.decision_notes then
      if not private.has_org_permission(new.organization_id, 'variations.approve') then
        raise exception 'Approval permission required to change variation decision fields' using errcode = '42501';
      end if;
    end if;
    if old.status in ('approved','rejected','withdrawn') and (
      new.status is distinct from old.status
      or new.approved_amount is distinct from old.approved_amount
      or new.decided_at is distinct from old.decided_at
      or new.decision_notes is distinct from old.decision_notes
    ) then
      raise exception 'A finalised variation decision cannot be edited' using errcode = '42501';
    end if;

  elsif tg_table_name = 'purchase_orders' then
    if new.status is distinct from old.status
       and new.status in ('approved','ordered','partially_received','received','cancelled')
       and not private.has_org_permission(new.organization_id, 'procurement.approve') then
      raise exception 'Approval permission required for this purchase order status transition' using errcode = '42501';
    end if;
    if old.status in ('submitted','approved','ordered','partially_received','received','cancelled') and (
      new.organization_id is distinct from old.organization_id
      or new.project_id is distinct from old.project_id
      or new.supplier_id is distinct from old.supplier_id
      or new.purchase_request_id is distinct from old.purchase_request_id
      or new.po_number is distinct from old.po_number
      or new.subtotal is distinct from old.subtotal
      or new.tax_amount is distinct from old.tax_amount
      or new.total_amount is distinct from old.total_amount
    ) then
      raise exception 'Purchase order commercial terms are locked after submission' using errcode = '42501';
    end if;
    if old.status in ('approved','ordered','partially_received','received','cancelled')
       and new.status is distinct from old.status
       and not private.has_org_permission(new.organization_id, 'procurement.approve') then
      raise exception 'Approval permission required to change a finalised purchase order status' using errcode = '42501';
    end if;

  elsif tg_table_name = 'project_approvals' then
    if new.status is distinct from old.status and new.status in ('approved','rejected') then
      if old.status <> 'pending' then
        raise exception 'Only pending approvals can receive a decision' using errcode = '42501';
      end if;
      if not private.has_org_permission(new.organization_id, 'approvals.approve') then
        raise exception 'Approval permission required to decide this request' using errcode = '42501';
      end if;
      new.approved_by := (select auth.uid());
      new.responded_at := now();
    elsif old.status in ('approved','rejected','cancelled') and (
      new.organization_id is distinct from old.organization_id
      or new.project_id is distinct from old.project_id
      or new.title is distinct from old.title
      or new.description is distinct from old.description
      or new.requested_by is distinct from old.requested_by
      or new.requested_at is distinct from old.requested_at
      or new.approved_by is distinct from old.approved_by
      or new.responded_at is distinct from old.responded_at
      or new.status is distinct from old.status
    ) then
      raise exception 'A completed approval record cannot be altered' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$function$;

create or replace function private.enforce_purchase_order_item_draft_only()
returns trigger language plpgsql security definer set search_path = ''
as $function$
declare parent_status text; parent_organization_id uuid;
begin
  if tg_op in ('UPDATE','DELETE') then
    select po.status, po.organization_id into parent_status, parent_organization_id
    from public.purchase_orders po where po.id = old.purchase_order_id;
    if not found or parent_organization_id is distinct from old.organization_id or parent_status <> 'draft' then
      raise exception 'Purchase order items are locked after the purchase order is submitted' using errcode = '42501';
    end if;
  end if;
  if tg_op in ('INSERT','UPDATE') then
    select po.status, po.organization_id into parent_status, parent_organization_id
    from public.purchase_orders po where po.id = new.purchase_order_id;
    if not found or parent_organization_id is distinct from new.organization_id or parent_status <> 'draft' then
      raise exception 'Purchase order items can only be changed while the parent order is a draft' using errcode = '42501';
    end if;
    return new;
  end if;
  return old;
end;
$function$;

revoke all on function private.enforce_purchase_order_item_draft_only() from public, anon, authenticated;
drop trigger if exists enforce_purchase_order_item_draft_only on public.purchase_order_items;
create trigger enforce_purchase_order_item_draft_only
before insert or update or delete on public.purchase_order_items
for each row execute function private.enforce_purchase_order_item_draft_only();

create or replace function private.enforce_financial_approval_transitions()
returns trigger language plpgsql set search_path = ''
as $function$
begin
  if tg_table_name = 'invoices' then
    if tg_op = 'INSERT' then
      if new.status <> 'draft' and not private.has_org_permission(new.organization_id, 'finance.approve') then
        raise exception 'Finance approval permission is required to create a non-draft invoice' using errcode = '42501';
      end if;
    else
      if new.status is distinct from old.status and not private.has_org_permission(new.organization_id, 'finance.approve') then
        raise exception 'Finance approval permission is required to change invoice status' using errcode = '42501';
      end if;
      if old.status <> 'draft' and (
        new.organization_id is distinct from old.organization_id
        or new.project_id is distinct from old.project_id
        or new.client_id is distinct from old.client_id
        or new.invoice_number is distinct from old.invoice_number
        or new.issue_date is distinct from old.issue_date
        or new.subtotal is distinct from old.subtotal
        or new.tax_amount is distinct from old.tax_amount
        or new.total_amount is distinct from old.total_amount
      ) then
        raise exception 'Invoice terms are locked after the invoice leaves draft' using errcode = '42501';
      end if;
    end if;
  elsif tg_table_name = 'payments' then
    if tg_op = 'INSERT' then
      if new.status <> 'pending' and not private.has_org_permission(new.organization_id, 'finance.approve') then
        raise exception 'Finance approval permission is required to create a received or reversed payment' using errcode = '42501';
      end if;
    else
      if new.status is distinct from old.status and not private.has_org_permission(new.organization_id, 'finance.approve') then
        raise exception 'Finance approval permission is required to change payment status' using errcode = '42501';
      end if;
      if old.status = 'reversed' and (
        new.organization_id is distinct from old.organization_id
        or new.invoice_id is distinct from old.invoice_id
        or new.project_id is distinct from old.project_id
        or new.client_id is distinct from old.client_id
        or new.payment_reference is distinct from old.payment_reference
        or new.amount is distinct from old.amount
        or new.payment_date is distinct from old.payment_date
        or new.payment_method is distinct from old.payment_method
        or new.status is distinct from old.status
        or new.notes is distinct from old.notes
        or new.received_by is distinct from old.received_by
      ) then
        raise exception 'A reversed payment is immutable' using errcode = '42501';
      end if;
      if old.status = 'received' and (
        new.organization_id is distinct from old.organization_id
        or new.invoice_id is distinct from old.invoice_id
        or new.project_id is distinct from old.project_id
        or new.client_id is distinct from old.client_id
        or new.payment_reference is distinct from old.payment_reference
        or new.amount is distinct from old.amount
        or new.payment_date is distinct from old.payment_date
        or new.payment_method is distinct from old.payment_method
        or new.notes is distinct from old.notes
        or new.received_by is distinct from old.received_by
      ) then
        raise exception 'A received payment can only be reversed, not edited' using errcode = '42501';
      end if;
    end if;
  elsif tg_table_name = 'expenses' then
    if tg_op = 'INSERT' then
      if new.payment_status <> 'unpaid' and not private.has_org_permission(new.organization_id, 'finance.approve') then
        raise exception 'Finance approval permission is required to create a paid expense' using errcode = '42501';
      end if;
    else
      if new.payment_status is distinct from old.payment_status
         and not private.has_org_permission(new.organization_id, 'finance.approve') then
        raise exception 'Finance approval permission is required to change expense payment status' using errcode = '42501';
      end if;
      if old.payment_status in ('paid','partially_paid') and (
        new.organization_id is distinct from old.organization_id
        or new.project_id is distinct from old.project_id
        or new.category is distinct from old.category
        or new.description is distinct from old.description
        or new.amount is distinct from old.amount
        or new.expense_date is distinct from old.expense_date
        or new.supplier_id is distinct from old.supplier_id
        or new.payment_status = 'unpaid'
      ) then
        raise exception 'A paid or partially paid expense cannot be rewritten' using errcode = '42501';
      end if;
    end if;
  elsif tg_table_name = 'project_budgets' then
    if new.budget_amount is distinct from old.budget_amount
       or new.committed_amount is distinct from old.committed_amount
       or new.actual_amount is distinct from old.actual_amount
       or new.forecast_amount is distinct from old.forecast_amount then
      if not private.has_org_permission(new.organization_id, 'finance.approve') then
        raise exception 'Finance approval permission is required to change budget control amounts' using errcode = '42501';
      end if;
    end if;
  end if;
  return new;
end;
$function$;

drop trigger if exists enforce_invoice_financial_approval on public.invoices;
create trigger enforce_invoice_financial_approval before insert or update on public.invoices
for each row execute function private.enforce_financial_approval_transitions();
drop trigger if exists enforce_payment_financial_approval on public.payments;
create trigger enforce_payment_financial_approval before insert or update on public.payments
for each row execute function private.enforce_financial_approval_transitions();
drop trigger if exists enforce_expense_financial_approval on public.expenses;
create trigger enforce_expense_financial_approval before insert or update on public.expenses
for each row execute function private.enforce_financial_approval_transitions();
drop trigger if exists enforce_project_budget_financial_approval on public.project_budgets;
create trigger enforce_project_budget_financial_approval before update on public.project_budgets
for each row execute function private.enforce_financial_approval_transitions();
