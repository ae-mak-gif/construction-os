import { supabase } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

export const ORGANIZATION_TABLES = [
  'activities','boq_items','calendar_events','clients','communication_logs','contacts',
  'enquiries','equipment','equipment_assignments','estimate_items','estimates','expenses',
  'finance_transactions','inspections','inventory_items','inventory_transactions','invoices',
  'messages','notifications','organization_members','payments','projects','purchase_order_items',
  'purchase_orders','purchase_requests','project_approvals','project_costs','project_documents',
  'project_updates','quality_issues','risks','staff','suppliers','tasks','work_orders',
] as const;

export type BuildFlowTable = typeof ORGANIZATION_TABLES[number];
export type BuildFlowRow = Record<string, unknown> & { id: string; organization_id: string };
export type DataSnapshot = Partial<Record<BuildFlowTable, BuildFlowRow[]>>;

export async function loadOrganizationSnapshot(
  organizationId: string,
  client: SupabaseClient = supabase,
): Promise<{ data: DataSnapshot; errors: Partial<Record<BuildFlowTable, string>> }> {
  const entries = await Promise.all(ORGANIZATION_TABLES.map(async (table) => {
    const { data, error } = await client.from(table).select('*').eq('organization_id', organizationId);
    return [table, data ?? [], error?.message] as const;
  }));
  const data: DataSnapshot = {};
  const errors: Partial<Record<BuildFlowTable, string>> = {};
  for (const [table, rows, error] of entries) {
    data[table] = rows as BuildFlowRow[];
    if (error) errors[table] = error;
  }
  return { data, errors };
}

export async function createOrganizationRecord<T extends Record<string, unknown>>(
  table: BuildFlowTable,
  organizationId: string,
  userId: string,
  values: T,
): Promise<BuildFlowRow> {
  const payload: Record<string, unknown> = { ...values, organization_id: organizationId };
  if ('created_by' in payload && !payload.created_by) payload.created_by = userId;
  if ('actor_user_id' in payload && !payload.actor_user_id) payload.actor_user_id = userId;
  const { data, error } = await supabase.from(table).insert(payload).select('*').single();
  if (error) throw new Error(error.message);
  return data as BuildFlowRow;
}

export async function updateOrganizationRecord(
  table: BuildFlowTable,
  organizationId: string,
  id: string,
  values: Record<string, unknown>,
): Promise<BuildFlowRow> {
  const safeValues = { ...values };
  delete safeValues.id;
  delete safeValues.organization_id;
  const { data, error } = await supabase.from(table).update(safeValues)
    .eq('id', id).eq('organization_id', organizationId).select('*').single();
  if (error) throw new Error(error.message);
  return data as BuildFlowRow;
}

export async function deleteOrganizationRecord(
  table: BuildFlowTable,
  organizationId: string,
  id: string,
): Promise<void> {
  const { error } = await supabase.from(table).delete()
    .eq('id', id).eq('organization_id', organizationId);
  if (error) throw new Error(error.message);
}
