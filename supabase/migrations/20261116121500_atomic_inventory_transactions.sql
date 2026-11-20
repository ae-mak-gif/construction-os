create or replace function public.record_inventory_transaction(
  p_inventory_item_id uuid,
  p_quantity_delta numeric,
  p_unit_cost numeric default 0,
  p_notes text default null,
  p_project_id uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_item public.inventory_items%rowtype;
  v_transaction_id uuid;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_quantity_delta = 0 then raise exception 'Quantity change must not be zero'; end if;
  if p_unit_cost < 0 then raise exception 'Unit cost cannot be negative'; end if;

  select * into v_item
  from public.inventory_items
  where id = p_inventory_item_id
  for update;

  if not found then raise exception 'Inventory item not found or access denied'; end if;
  if not public.has_org_permission(v_item.organization_id, 'inventory.update') then
    raise exception 'You do not have permission to update inventory';
  end if;
  if v_item.quantity_on_hand + p_quantity_delta < 0 then
    raise exception 'Insufficient stock for this transaction';
  end if;

  update public.inventory_items
  set quantity_on_hand = quantity_on_hand + p_quantity_delta,
      updated_at = now()
  where id = p_inventory_item_id;

  insert into public.inventory_transactions (
    organization_id, inventory_item_id, project_id, transaction_type,
    quantity, unit_cost, notes, performed_by
  ) values (
    v_item.organization_id, p_inventory_item_id, p_project_id,
    case when p_quantity_delta > 0 then 'receipt' else 'issue' end,
    abs(p_quantity_delta), p_unit_cost, p_notes, v_user_id
  ) returning id into v_transaction_id;

  return v_transaction_id;
end;
$$;
revoke all on function public.record_inventory_transaction(uuid,numeric,numeric,text,uuid) from public, anon;
grant execute on function public.record_inventory_transaction(uuid,numeric,numeric,text,uuid) to authenticated;