create or replace function private.receive_purchase_order_item(
  p_purchase_order_item_id uuid,
  p_inventory_item_id uuid,
  p_quantity numeric,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  membership_count integer;
  target_org uuid;
  po_item public.purchase_order_items%rowtype;
  po public.purchase_orders%rowtype;
  inventory_row public.inventory_items%rowtype;
  already_received numeric;
  existing_inventory_count integer;
  total_ordered numeric;
  total_received numeric;
  next_po_status text;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;
  select count(*),(array_agg(om.organization_id))[1]
    into membership_count,target_org
  from public.organization_members om
  where om.user_id=(select auth.uid()) and om.status='active';
  if membership_count<>1
     or not private.has_org_permission(target_org,'procurement.approve')
     or not private.has_org_permission(target_org,'inventory.update') then
    raise exception 'Procurement approval and inventory update permissions are required' using errcode='42501';
  end if;
  select poi.* into po_item
  from public.purchase_order_items poi
  where poi.id=p_purchase_order_item_id and poi.organization_id=target_org
  for update;
  if not found then raise exception 'Purchase order line not found' using errcode='P0002'; end if;
  select p.* into po
  from public.purchase_orders p
  where p.id=po_item.purchase_order_id and p.organization_id=target_org
  for update;
  if not found or po.status not in ('ordered','partially_received') then
    raise exception 'Only ordered purchase orders can receive goods' using errcode='22023';
  end if;
  select i.* into inventory_row
  from public.inventory_items i
  where i.id=p_inventory_item_id and i.organization_id=target_org and i.status='active'
  for update;
  if not found then raise exception 'Active inventory item not found' using errcode='P0002'; end if;
  if p_quantity is null or p_quantity<=0 then
    raise exception 'Receipt quantity must be greater than zero' using errcode='22023';
  end if;
  select coalesce(sum(t.quantity),0),count(distinct t.inventory_item_id)
    into already_received,existing_inventory_count
  from public.inventory_transactions t
  where t.organization_id=target_org and t.reference_type='purchase_order_item'
    and t.reference_id=p_purchase_order_item_id and t.transaction_type='receipt';
  if existing_inventory_count>0 and not exists (
    select 1 from public.inventory_transactions t
    where t.organization_id=target_org and t.reference_type='purchase_order_item'
      and t.reference_id=p_purchase_order_item_id and t.inventory_item_id=p_inventory_item_id
  ) then
    raise exception 'All receipts for this purchase order line must use the same inventory item' using errcode='22023';
  end if;
  if already_received+p_quantity>po_item.quantity then
    raise exception 'Receipt quantity exceeds the outstanding purchase order quantity' using errcode='22023';
  end if;
  update public.inventory_items
    set quantity_on_hand=quantity_on_hand+p_quantity,unit_cost=po_item.unit_price
  where id=p_inventory_item_id and organization_id=target_org;
  insert into public.inventory_transactions(
    organization_id,inventory_item_id,project_id,transaction_type,quantity,unit_cost,
    reference_type,reference_id,notes,performed_by
  ) values (
    target_org,p_inventory_item_id,po.project_id,'receipt',p_quantity,po_item.unit_price,
    'purchase_order_item',p_purchase_order_item_id,nullif(trim(coalesce(p_notes,'')),''),(select auth.uid())
  );
  select coalesce(sum(poi.quantity),0) into total_ordered
  from public.purchase_order_items poi where poi.purchase_order_id=po.id and poi.organization_id=target_org;
  select coalesce(sum(t.quantity),0) into total_received
  from public.inventory_transactions t
  join public.purchase_order_items poi on poi.id=t.reference_id
  where t.organization_id=target_org and t.reference_type='purchase_order_item'
    and t.transaction_type='receipt' and poi.purchase_order_id=po.id;
  next_po_status:=case when total_received>=total_ordered then 'received' else 'partially_received' end;
  update public.purchase_orders set status=next_po_status where id=po.id and organization_id=target_org;
  if next_po_status='received' and po.purchase_request_id is not null then
    update public.purchase_requests set status='delivered'
    where id=po.purchase_request_id and organization_id=target_org;
  end if;
  return jsonb_build_object(
    'purchase_order_id',po.id,'purchase_order_item_id',po_item.id,'inventory_item_id',p_inventory_item_id,
    'quantity_received_now',p_quantity,'quantity_received_total',already_received+p_quantity,
    'quantity_ordered',po_item.quantity,'purchase_order_status',next_po_status
  );
end;
$function$;

create or replace function public.receive_purchase_order_item(
  p_purchase_order_item_id uuid,p_inventory_item_id uuid,p_quantity numeric,p_notes text default null
)
returns jsonb
language sql
security invoker
set search_path = ''
as $function$
  select private.receive_purchase_order_item(p_purchase_order_item_id,p_inventory_item_id,p_quantity,p_notes);
$function$;
revoke all on function private.receive_purchase_order_item(uuid,uuid,numeric,text) from public,anon;
grant execute on function private.receive_purchase_order_item(uuid,uuid,numeric,text) to authenticated;
revoke all on function public.receive_purchase_order_item(uuid,uuid,numeric,text) from public,anon;
grant execute on function public.receive_purchase_order_item(uuid,uuid,numeric,text) to authenticated;
