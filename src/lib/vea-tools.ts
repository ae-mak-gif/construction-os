import { veaAgents } from '@/lib/vea-agents';

export type VEAToolKey =
  | 'buildflow.executive_context.read'
  | 'buildflow.projects.read'
  | 'buildflow.tasks.read'
  | 'buildflow.risks.read'
  | 'buildflow.finance_invoices.read'
  | 'buildflow.procurement_requests.read'
  | 'buildflow.calendar_upcoming.read';

export interface VEAToolDefinition {
  key: VEAToolKey;
  label: string;
  description: string;
  allowedAgents: string[];
  access: 'read_only';
  execution: 'not_connected';
}

/**
 * Allow-list contract for the first VEA runtime.
 * These entries describe the only tools that may be wired into the initial
 * orchestrator. They are not callable tools until a server-side implementation
 * is added and tenant/role checks are tested.
 */
export const veaReadOnlyTools: VEAToolDefinition[] = [
  {
    key: 'buildflow.executive_context.read',
    label: 'Read executive context',
    description: 'Read a bounded organisation-scoped business pulse.',
    allowedAgents: ['executive'],
    access: 'read_only',
    execution: 'not_connected',
  },
  {
    key: 'buildflow.projects.read',
    label: 'Read projects',
    description: 'Read permitted project summaries, status and delivery dates.',
    allowedAgents: ['executive', 'project', 'risk'],
    access: 'read_only',
    execution: 'not_connected',
  },
  {
    key: 'buildflow.tasks.read',
    label: 'Read tasks',
    description: 'Read permitted task status, owners and due dates.',
    allowedAgents: ['executive', 'project', 'accountability'],
    access: 'read_only',
    execution: 'not_connected',
  },
  {
    key: 'buildflow.risks.read',
    label: 'Read risks',
    description: 'Read permitted risk-register and compliance summaries.',
    allowedAgents: ['executive', 'project', 'risk'],
    access: 'read_only',
    execution: 'not_connected',
  },
  {
    key: 'buildflow.finance_invoices.read',
    label: 'Read finance invoices',
    description: 'Read invoice status and due-date summaries without initiating payments.',
    allowedAgents: ['executive', 'finance'],
    access: 'read_only',
    execution: 'not_connected',
  },
  {
    key: 'buildflow.procurement_requests.read',
    label: 'Read procurement requests',
    description: 'Read purchase-request status and approved visibility fields.',
    allowedAgents: ['executive', 'procurement'],
    access: 'read_only',
    execution: 'not_connected',
  },
  {
    key: 'buildflow.calendar_upcoming.read',
    label: 'Read upcoming calendar',
    description: 'Read upcoming organisation calendar events.',
    allowedAgents: ['executive', 'project', 'accountability'],
    access: 'read_only',
    execution: 'not_connected',
  },
];

export function getVEAAgent(agentKey: string) {
  return veaAgents.find((agent) => agent.key === agentKey) ?? null;
}

export function getVEAToolsForAgent(agentKey: string) {
  const agent = getVEAAgent(agentKey);
  if (!agent) return [];
  return veaReadOnlyTools.filter((tool) => tool.allowedAgents.includes(agentKey));
}
