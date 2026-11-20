-- Native, transaction-bound audit trail for high-value BuildFlow business records.
-- Only the authenticated actor ID, organisation, target, changed column names,
-- status transition, and a non-sensitive reference are recorded. No full row
-- snapshots, message bodies, payment details, or document contents are stored.

create or replace function private.capture_business_audit_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_row jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else '{}'::jsonb end;
  new_row jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else '{}'::jsonb end;
  actor uuid := auth.uid();
  org_id uuid := nullif(coalesce(new_row ->> 'organization_id', old_row ->> 'organization_id'), '')::uuid;
  target_id_value uuid := nullif(coalesce(new_row ->> 'id', old_row ->> 'id'), '')::uuid;
  changed_columns jsonb := '[]'::jsonb;
  reference_value text;
begin
  -- Service-role/background writes without a verified user actor are not
  -- attributed to a human. VEA has its own dedicated audit events.
  if actor is null or org_id is null then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;

  if tg_op = 'UPDATE' then
    select coalesce(jsonb_agg(n.key order by n.key), '[]'::jsonb)
      into changed_columns
      from jsonb_each(new_row) as n
      join jsonb_each(old_row) as o using (key)
     where n.value is distinct from o.value
       and n.key not in ('updated_at');
  end if;

  reference_value := coalesce(
    new_row ->> 'invoice_number', old_row ->> 'invoice_number',
    new_row ->> 'request_number', old_row ->> 'request_number',
    new_row ->> 'variation_number', old_row ->> 'variation_number',
    new_row ->> 'project_code', old_row ->> 'project_code',
    new_row ->> 'name', old_row ->> 'name',
    new_row ->> 'title', old_row ->> 'title'
  );

  insert into public.security_audit_events (
    organization_id, actor_id, action, target_type, target_id, metadata
  ) values (
    org_id,
    actor,
    'record.' || lower(tg_op),
    tg_table_name,
    target_id_value,
    jsonb_build_object(
      'operation', tg_op,
      'project_id', coalesce(new_row ->> 'project_id', old_row ->> 'project_id'),
      'changed_columns', changed_columns,
      'status_before', old_row ->> 'status',
      'status_after', new_row ->> 'status',
      'reference', left(reference_value, 120)
    )
  );

  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

revoke all on function private.capture_business_audit_event() from public, anon, authenticated;

do $$
declare
  table_name text;
  audited_tables text[] := array[
    'organization_members',
    'roles',
    'clients',
    'contacts',
    'enquiries',
    'projects',
    'project_members',
    'tasks',
    'calendar_events',
    'schedule_activities',
    'schedule_activity_dependencies',
    'schedule_baselines',
    'site_diaries',
    'project_updates',
    'project_documents',
    'project_approvals',
    'project_rfis',
    'risks',
    'quality_issues',
    'safety_incidents',
    'inspections',
    'estimates',
    'estimate_items',
    'boq_items',
    'suppliers',
    'purchase_requests',
    'purchase_orders',
    'purchase_order_items',
    'inventory_items',
    'inventory_transactions',
    'project_budgets',
    'project_costs',
    'invoices',
    'payments',
    'expenses',
    'contract_variations',
    'equipment_assignments',
    'work_orders',
    'client_project_shares',
    'client_portal_access'
  ];
begin
  foreach table_name in array audited_tables loop
    execute format('drop trigger if exists buildflow_business_audit on public.%I', table_name);
    execute format(
      'create trigger buildflow_business_audit after insert or update or delete on public.%I for each row execute function private.capture_business_audit_event()',
      table_name
    );
  end loop;
end;
$$;

create index if not exists security_audit_events_org_target_created_idx
  on public.security_audit_events (organization_id, target_type, target_id, created_at desc);
