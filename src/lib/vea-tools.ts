import { veaAgents } from "@/lib/vea-agents";

export type VEAToolKey =
  | "buildflow.executive_context.read"
  | "buildflow.projects.read"
  | "buildflow.tasks.read"
  | "buildflow.risks.read"
  | "buildflow.finance_invoices.read"
  | "buildflow.procurement_requests.read"
  | "buildflow.calendar_upcoming.read";

export interface VEAToolDefinition {
  key: VEAToolKey;
  label: string;
  description: string;
  allowedAgents: string[];
  access: "read_only";
  execution: "connected";
}

/**
 * Server-enforced read-only tool catalogue. The Edge Function executes these
 * bounded context reads through the caller's JWT and existing RLS policies.
 * The model cannot add tools or alter their permissions.
 */
export const veaReadOnlyTools: VEAToolDefinition[] = [
  {
    key: "buildflow.executive_context.read",
    label: "Read executive context",
    description: "Read a bounded organisation-scoped business pulse.",
    allowedAgents: ["executive"],
    access: "read_only",
    execution: "connected",
  },
  {
    key: "buildflow.projects.read",
    label: "Read projects",
    description: "Read permitted project summaries, status and delivery dates.",
    allowedAgents: ["executive", "project"],
    access: "read_only",
    execution: "connected",
  },
  {
    key: "buildflow.tasks.read",
    label: "Read tasks",
    description: "Read permitted task status and due dates.",
    allowedAgents: ["executive", "project"],
    access: "read_only",
    execution: "connected",
  },
  {
    key: "buildflow.risks.read",
    label: "Read risks",
    description: "Read permitted risk-register summaries.",
    allowedAgents: ["executive", "project"],
    access: "read_only",
    execution: "connected",
  },
  {
    key: "buildflow.finance_invoices.read",
    label: "Read finance invoices",
    description: "Read invoice status and due-date summaries without initiating payments.",
    allowedAgents: ["executive", "finance"],
    access: "read_only",
    execution: "connected",
  },
  {
    key: "buildflow.procurement_requests.read",
    label: "Read procurement requests",
    description: "Read purchase-request status without supplier commitments.",
    allowedAgents: ["executive", "procurement"],
    access: "read_only",
    execution: "connected",
  },
  {
    key: "buildflow.calendar_upcoming.read",
    label: "Read upcoming calendar",
    description: "Read upcoming organisation calendar events.",
    allowedAgents: ["executive", "project"],
    access: "read_only",
    execution: "connected",
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
