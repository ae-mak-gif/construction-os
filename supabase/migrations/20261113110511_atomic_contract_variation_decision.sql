create or replace function private.decide_contract_variation(
  p_variation_id uuid,p_decision text,p_approved_amount numeric default null,p_decision_notes text default null
)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare
  membership_count integer;
  target_org uuid;
  variation_row public.contract_variations%rowtype;
  project_row public.projects%rowtype;
  revised_contract_value numeric;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select count(*),(array_agg(om.organization_id))[1] into membership_count,target_org
  from public.organization_members om where om.user_id=(select auth.uid()) and om.status='active';
  if membership_count<>1 or not private.has_org_permission(target_org,'variations.approve') then
    raise exception 'Variation approval permission required' using errcode='42501';
  end if;
  if p_decision not in ('approved','rejected') then raise exception 'Decision must be approved or rejected' using errcode='22023'; end if;
  if p_decision='approved' and (p_approved_amount is null or p_approved_amount<0) then
    raise exception 'A non-negative approved amount is required' using errcode='22023';
  end if;
  select v.* into variation_row from public.contract_variations v
  where v.id=p_variation_id and v.organization_id=target_org for update;
  if not found then raise exception 'Contract variation not found' using errcode='P0002'; end if;
  if variation_row.status not in ('submitted','under_review') then
    raise exception 'Only submitted or under-review variations can be decided' using errcode='22023';
  end if;
  select p.* into project_row from public.projects p
  where p.id=variation_row.project_id and p.organization_id=target_org for update;
  if not found then raise exception 'Related project not found' using errcode='P0002'; end if;
  if p_decision='approved' then
    revised_contract_value:=coalesce(project_row.contract_value,0)+p_approved_amount;
    update public.projects set contract_value=revised_contract_value,updated_at=now()
    where id=project_row.id and organization_id=target_org;
  else
    revised_contract_value:=coalesce(project_row.contract_value,0);
  end if;
  update public.contract_variations
    set status=p_decision,approved_amount=case when p_decision='approved' then p_approved_amount else null end,
        decided_at=now(),decision_notes=nullif(trim(coalesce(p_decision_notes,'')),'')
  where id=variation_row.id and organization_id=target_org;
  return jsonb_build_object('variation_id',variation_row.id,'decision',p_decision,
    'approved_amount',case when p_decision='approved' then p_approved_amount else null end,
    'project_id',project_row.id,'previous_contract_value',coalesce(project_row.contract_value,0),
    'revised_contract_value',revised_contract_value);
end;
$function$;

create or replace function public.decide_contract_variation(
  p_variation_id uuid,p_decision text,p_approved_amount numeric default null,p_decision_notes text default null
)
returns jsonb language sql security invoker set search_path = ''
as $function$
  select private.decide_contract_variation(p_variation_id,p_decision,p_approved_amount,p_decision_notes);
$function$;
revoke all on function private.decide_contract_variation(uuid,text,numeric,text) from public,anon;
grant execute on function private.decide_contract_variation(uuid,text,numeric,text) to authenticated;
revoke all on function public.decide_contract_variation(uuid,text,numeric,text) from public,anon;
grant execute on function public.decide_contract_variation(uuid,text,numeric,text) to authenticated;
