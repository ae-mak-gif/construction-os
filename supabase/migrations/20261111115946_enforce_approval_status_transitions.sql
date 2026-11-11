create or replace function private.enforce_approval_transitions()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if tg_table_name = 'contract_variations' then
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
    if old.status in ('approved','rejected','withdrawn')
       and (new.status is distinct from old.status
         or new.approved_amount is distinct from old.approved_amount
         or new.decided_at is distinct from old.decided_at
         or new.decision_notes is distinct from old.decision_notes) then
      raise exception 'A finalised variation decision cannot be edited' using errcode = '42501';
    end if;
  elsif tg_table_name = 'purchase_orders' then
    if new.status is distinct from old.status and new.status = 'approved'
       and not private.has_org_permission(new.organization_id, 'procurement.approve') then
      raise exception 'Approval permission required to approve a purchase order' using errcode = '42501';
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
    elsif old.status in ('approved','rejected') and (
      new.approved_by is distinct from old.approved_by
      or new.responded_at is distinct from old.responded_at
      or new.status is distinct from old.status
    ) then
      raise exception 'A completed approval decision cannot be altered' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$function$;

revoke all on function private.enforce_approval_transitions() from public, anon, authenticated;

drop trigger if exists enforce_variation_approval_transition on public.contract_variations;
create trigger enforce_variation_approval_transition before update on public.contract_variations
for each row execute function private.enforce_approval_transitions();

drop trigger if exists enforce_purchase_order_approval_transition on public.purchase_orders;
create trigger enforce_purchase_order_approval_transition before update on public.purchase_orders
for each row execute function private.enforce_approval_transitions();

drop trigger if exists enforce_project_approval_transition on public.project_approvals;
create trigger enforce_project_approval_transition before update on public.project_approvals
for each row execute function private.enforce_approval_transitions();
