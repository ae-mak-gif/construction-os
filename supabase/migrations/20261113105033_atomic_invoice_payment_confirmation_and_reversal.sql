create or replace function private.confirm_invoice_payment(p_payment_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare
  active_membership_count integer;
  target_organization_id uuid;
  payment_row public.payments%rowtype;
  invoice_row public.invoices%rowtype;
  received_total numeric;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select count(*),(array_agg(om.organization_id))[1] into active_membership_count,target_organization_id
  from public.organization_members om where om.user_id=(select auth.uid()) and om.status='active';
  if active_membership_count<>1 or not private.has_org_permission(target_organization_id,'finance.approve') then
    raise exception 'Finance approval permission required' using errcode='42501';
  end if;
  select * into payment_row from public.payments p
  where p.id=p_payment_id and p.organization_id=target_organization_id for update;
  if not found then raise exception 'Payment not found' using errcode='P0002'; end if;
  if payment_row.status<>'pending' then raise exception 'Only pending payments can be confirmed' using errcode='22023'; end if;
  if payment_row.invoice_id is null then raise exception 'Payment must be linked to an invoice before confirmation' using errcode='22023'; end if;
  select * into invoice_row from public.invoices i
  where i.id=payment_row.invoice_id and i.organization_id=target_organization_id for update;
  if not found or invoice_row.status in ('draft','cancelled') then
    raise exception 'The linked invoice is not available for payment' using errcode='22023';
  end if;
  select coalesce(sum(p.amount),0) into received_total
  from public.payments p
  where p.invoice_id=payment_row.invoice_id and p.organization_id=target_organization_id and p.status='received';
  if received_total+payment_row.amount>invoice_row.total_amount then
    raise exception 'Payment exceeds the outstanding invoice balance' using errcode='22023';
  end if;
  update public.payments set status='received',received_by=(select auth.uid())
  where id=p_payment_id and organization_id=target_organization_id;
  received_total:=received_total+payment_row.amount;
  update public.invoices set status=case when received_total>=invoice_row.total_amount then 'paid' else 'partially_paid' end
  where id=invoice_row.id and organization_id=target_organization_id;
  return jsonb_build_object('payment_id',p_payment_id,'invoice_id',invoice_row.id,'payment_status','received',
    'invoice_status',case when received_total>=invoice_row.total_amount then 'paid' else 'partially_paid' end,'received_total',received_total);
end;
$function$;
create or replace function public.confirm_invoice_payment(p_payment_id uuid)
returns jsonb language sql security invoker set search_path = ''
as $function$
  select private.confirm_invoice_payment(p_payment_id);
$function$;
revoke all on function private.confirm_invoice_payment(uuid) from public,anon;
grant execute on function private.confirm_invoice_payment(uuid) to authenticated;
revoke all on function public.confirm_invoice_payment(uuid) from public,anon;
grant execute on function public.confirm_invoice_payment(uuid) to authenticated;

create or replace function private.reverse_invoice_payment(p_payment_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare
  active_membership_count integer;
  target_organization_id uuid;
  payment_row public.payments%rowtype;
  invoice_row public.invoices%rowtype;
  received_total numeric;
  next_invoice_status text;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select count(*),(array_agg(om.organization_id))[1] into active_membership_count,target_organization_id
  from public.organization_members om where om.user_id=(select auth.uid()) and om.status='active';
  if active_membership_count<>1 or not private.has_org_permission(target_organization_id,'finance.approve') then
    raise exception 'Finance approval permission required' using errcode='42501';
  end if;
  select * into payment_row from public.payments p
  where p.id=p_payment_id and p.organization_id=target_organization_id for update;
  if not found then raise exception 'Payment not found' using errcode='P0002'; end if;
  if payment_row.status<>'received' then raise exception 'Only received payments can be reversed' using errcode='22023'; end if;
  if payment_row.invoice_id is not null then
    select * into invoice_row from public.invoices i
    where i.id=payment_row.invoice_id and i.organization_id=target_organization_id for update;
    if not found then raise exception 'Linked invoice not found' using errcode='P0002'; end if;
  end if;
  update public.payments set status='reversed' where id=p_payment_id and organization_id=target_organization_id;
  if payment_row.invoice_id is not null then
    select coalesce(sum(p.amount),0) into received_total
    from public.payments p
    where p.invoice_id=payment_row.invoice_id and p.organization_id=target_organization_id
      and p.status='received' and p.id<>p_payment_id;
    next_invoice_status:=case
      when received_total>=invoice_row.total_amount then 'paid'
      when received_total>0 then 'partially_paid'
      when invoice_row.due_date<current_date then 'overdue'
      else 'sent'
    end;
    update public.invoices set status=next_invoice_status where id=invoice_row.id and organization_id=target_organization_id;
  else
    next_invoice_status:=null;
    received_total:=null;
  end if;
  return jsonb_build_object('payment_id',p_payment_id,'invoice_id',payment_row.invoice_id,'payment_status','reversed',
    'invoice_status',next_invoice_status,'received_total',received_total);
end;
$function$;
create or replace function public.reverse_invoice_payment(p_payment_id uuid)
returns jsonb language sql security invoker set search_path = ''
as $function$
  select private.reverse_invoice_payment(p_payment_id);
$function$;
revoke all on function private.reverse_invoice_payment(uuid) from public,anon;
grant execute on function private.reverse_invoice_payment(uuid) to authenticated;
revoke all on function public.reverse_invoice_payment(uuid) from public,anon;
grant execute on function public.reverse_invoice_payment(uuid) to authenticated;
