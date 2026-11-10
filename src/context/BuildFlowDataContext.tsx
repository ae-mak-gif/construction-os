import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  ORGANIZATION_TABLES, loadOrganizationSnapshot, createOrganizationRecord,
  updateOrganizationRecord, deleteOrganizationRecord,
  type BuildFlowTable, type BuildFlowRow, type DataSnapshot,
} from '@/lib/buildflowData';

interface DataContextValue {
  records: DataSnapshot;
  loading: boolean;
  errors: Partial<Record<BuildFlowTable, string>>;
  refresh: () => Promise<void>;
  create: (table: BuildFlowTable, values: Record<string, unknown>) => Promise<BuildFlowRow>;
  update: (table: BuildFlowTable, id: string, values: Record<string, unknown>) => Promise<BuildFlowRow>;
  remove: (table: BuildFlowTable, id: string) => Promise<void>;
  isLive: boolean;
}
const DataContext = createContext<DataContextValue | null>(null);

export function BuildFlowDataProvider({ children }: { children: ReactNode }) {
  const { membership, user } = useAuth();
  const [records, setRecords] = useState<DataSnapshot>({});
  const [errors, setErrors] = useState<Partial<Record<BuildFlowTable, string>>>({});
  const [loading, setLoading] = useState(true);
  const organizationId = membership?.organization_id;

  const refresh = useCallback(async () => {
    if (!organizationId) { setRecords({}); setLoading(false); return; }
    setLoading(true);
    try {
      const result = await loadOrganizationSnapshot(organizationId);
      setRecords(result.data);
      setErrors(result.errors);
    } finally { setLoading(false); }
  }, [organizationId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const create = useCallback(async (table: BuildFlowTable, values: Record<string, unknown>) => {
    if (!organizationId || !user?.id) throw new Error('An active organisation session is required.');
    const row = await createOrganizationRecord(table, organizationId, user.id, values);
    setRecords((current) => ({ ...current, [table]: [...(current[table] ?? []), row] }));
    return row;
  }, [organizationId, user?.id]);

  const update = useCallback(async (table: BuildFlowTable, id: string, values: Record<string, unknown>) => {
    if (!organizationId) throw new Error('An active organisation session is required.');
    const row = await updateOrganizationRecord(table, organizationId, id, values);
    setRecords((current) => ({ ...current, [table]: (current[table] ?? []).map((item) => item.id === id ? row : item) }));
    return row;
  }, [organizationId]);

  const remove = useCallback(async (table: BuildFlowTable, id: string) => {
    if (!organizationId) throw new Error('An active organisation session is required.');
    await deleteOrganizationRecord(table, organizationId, id);
    setRecords((current) => ({ ...current, [table]: (current[table] ?? []).filter((item) => item.id !== id) }));
  }, [organizationId]);

  const value = useMemo(() => ({
    records, loading, errors, refresh, create, update, remove,
    isLive: ORGANIZATION_TABLES.some((table) => (records[table]?.length ?? 0) > 0),
  }), [records, loading, errors, refresh, create, update, remove]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useBuildFlowData() {
  const value = useContext(DataContext);
  if (!value) throw new Error('useBuildFlowData must be used within BuildFlowDataProvider');
  return value;
}
