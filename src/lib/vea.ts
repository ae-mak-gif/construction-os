import { supabase } from '@/lib/supabase';

export interface VEAProject {
  id: string;
  name: string;
  status: string | null;
  health_status: string | null;
  progress_percent: number | null;
  expected_completion_date: string | null;
  contract_value: number | null;
}

export interface VEATask {
  id: string;
  title: string;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  project_id: string | null;
}

export interface VEARisk {
  id: string;
  title: string;
  status: string | null;
  likelihood: string | null;
  impact: string | null;
  due_date: string | null;
  project_id: string | null;
}

export interface VEAPurchaseRequest {
  id: string;
  request_number: string | null;
  description: string | null;
  status: string | null;
  required_date: string | null;
  estimated_amount: number | null;
  project_id: string | null;
}

export interface VEAInvoice {
  id: string;
  invoice_number: string | null;
  status: string | null;
  due_date: string | null;
  total_amount: number | null;
}

export interface VEAContext {
  source: 'buildflow_live';
  generated_at: string;
  organization_id: string;
  user_id: string;
  summary: {
    projects: number;
    tasks: number;
    risks: number;
    purchase_requests: number;
    invoices: number;
  };
  projects: VEAProject[];
  tasks: VEATask[];
  risks: VEARisk[];
  purchase_requests: VEAPurchaseRequest[];
  invoices: VEAInvoice[];
  calendar_events: Array<{
    id: string;
    title: string;
    start_at: string;
    end_at: string | null;
    event_type: string | null;
    project_id: string | null;
  }>;
  permissions: {
    mode: 'read_only';
    writes_enabled: false;
    approval_actions_enabled: false;
  };
}

export async function loadVEAContext(): Promise<VEAContext> {
  const { data, error } = await supabase.functions.invoke('vea-context', {
    method: 'POST',
    body: {},
  });

  if (error) {
    throw new Error(error.message || 'Unable to connect to the VEA data service.');
  }
  if (!data || data.source !== 'buildflow_live') {
    throw new Error(data?.error || 'The VEA data service returned an unexpected response.');
  }

  return data as VEAContext;
}
