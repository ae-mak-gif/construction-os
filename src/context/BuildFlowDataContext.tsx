import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  ORGANIZATION_TABLES, loadOrganizationSnapshot, createOrganizationRecord,
  updateOrganizationRecord, deleteOrganizationRecord,
  type BuildFlowTable, type BuildFlowRow, type DataSnapshot,
} from '@/lib/buildflowData';

/* eslint-disable react-refresh/only-export-components -- Context modules intentionally export their provider and hook. */

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
  const refreshSequence = useRef(0);
  const activeOrganizationId = useRef(organizationId);
  activeOrganizationId.current = organizationId;

  const refresh = useCallback(async () => {
    const requestId = ++refreshSequence.current;

    if (!organizationId) {
      setRecords({});
      setErrors({});
      setLoading(false);
      return;
    }

    // Clear the previous tenant's snapshot before loading a new one.
    setRecords({});
    setErrors({});
    setLoading(true);

    try {
      const result = await loadOrganizationSnapshot(organizationId);
      if (requestId !== refreshSequence.current) return;
      setRecords(result.data);
      setErrors(result.errors);
    } catch (loadError) {
      if (requestId !== refreshSequence.current) return;
      const message = loadError instanceof Error
        ? loadError.message
        : 'Unable to load live organisation data.';
      setRecords({});
      setErrors(
        Object.fromEntries(ORGANIZATION_TABLES.map((table) => [table, message])) as
          Partial<Record<BuildFlowTable, string>>
      );
    } finally {
      if (requestId === refreshSequence.current) setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    void refresh();
    return () => {
      refreshSequence.current += 1;
    };
  }, [refresh]);

  const create = useCallback(async (table: BuildFlowTable, values: Record<string, unknown>) => {
    if (!organizationId || !user?.id) throw new Error('An active organisation session is required.');
    const requestOrganizationId = organizationId;
    const row = await createOrganizationRecord(table, requestOrganizationId, user.id, values);
    if (activeOrganizationId.current === requestOrganizationId) {
      setRecords((current) => ({ ...current, [table]: [...(current[table] ?? []), row] }));
    }
    return row;
  }, [organizationId, user?.id]);

  const update = useCallback(async (table: BuildFlowTable, id: string, values: Record<string, unknown>) => {
    if (!organizationId) throw new Error('An active organisation session is required.');
    const requestOrganizationId = organizationId;
    const row = await updateOrganizationRecord(table, requestOrganizationId, id, values);
    if (activeOrganizationId.current === requestOrganizationId) {
      setRecords((current) => ({ ...current, [table]: (current[table] ?? []).map((item) => item.id === id ? row : item) }));
    }
    return row;
  }, [organizationId]);

  const remove = useCallback(async (table: BuildFlowTable, id: string) => {
    if (!organizationId) throw new Error('An active organisation session is required.');
    const requestOrganizationId = organizationId;
    await deleteOrganizationRecord(table, requestOrganizationId, id);
    if (activeOrganizationId.current === requestOrganizationId) {
      setRecords((current) => ({ ...current, [table]: (current[table] ?? []).filter((item) => item.id !== id) }));
    }
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
