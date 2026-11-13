/**
 * BuildFlow VEA agent catalogue.
 *
 * The first four agents use the authenticated read-only runtime. Specialist
 * coordination is performed by the Executive Orchestrator when a request
 * spans multiple first-wave domains.
 */
export type VEAAgentStatus = "foundation" | "next" | "planned";

export interface VEAAgentDefinition {
  key: string;
  name: string;
  description: string;
  remit: string[];
  routeHints: string[];
  status: VEAAgentStatus;
  autonomy: "read_only";
  icon: "executive" | "project" | "finance" | "procurement" | "workforce" | "documents" | "accountability" | "risk";
}

export const veaAgents: VEAAgentDefinition[] = [
  {
    key: "executive",
    name: "Executive Orchestrator",
    description: "Coordinates the relevant specialists, reconciles their findings and prepares a cross-functional executive response.",
    remit: ["cross-functional briefings", "business pulse", "decision preparation", "specialist coordination"],
    routeHints: ["executive", "overview", "business", "briefing", "priority", "what needs attention"],
    status: "foundation",
    autonomy: "read_only",
    icon: "executive",
  },
  {
    key: "project",
    name: "Project Intelligence",
    description: "Analyses delivery progress, schedules, dependencies, delays and project exposure.",
    remit: ["project health", "programme and milestones", "task status", "delivery risks"],
    routeHints: ["project", "schedule", "milestone", "delay", "progress", "task", "site"],
    status: "foundation",
    autonomy: "read_only",
    icon: "project",
  },
  {
    key: "finance",
    name: "Finance Intelligence",
    description: "Surfaces invoice, cash-flow and cost information for human review.",
    remit: ["invoices", "cash flow", "cost visibility"],
    routeHints: ["finance", "budget", "invoice", "cash flow", "cost", "payment", "expense"],
    status: "foundation",
    autonomy: "read_only",
    icon: "finance",
  },
  {
    key: "procurement",
    name: "Procurement Intelligence",
    description: "Reviews purchase requests and materials visibility without making commitments.",
    remit: ["purchase requests", "materials visibility"],
    routeHints: ["procurement", "purchase", "supplier", "materials", "order", "stock"],
    status: "foundation",
    autonomy: "read_only",
    icon: "procurement",
  },
  {
    key: "workforce",
    name: "People & Workforce",
    description: "Workforce capacity and resource-allocation visibility; no HR decisions.",
    remit: ["workforce capacity", "resource allocation", "staffing visibility"],
    routeHints: ["people", "workforce", "staff", "team", "capacity", "resource"],
    status: "planned",
    autonomy: "read_only",
    icon: "workforce",
  },
  {
    key: "documents",
    name: "Research & Documents",
    description: "Authorised document retrieval, evidence extraction and summaries.",
    remit: ["document search", "contract and report summaries", "research"],
    routeHints: ["document", "contract", "report", "drawing", "research", "file", "evidence"],
    status: "planned",
    autonomy: "read_only",
    icon: "documents",
  },
  {
    key: "accountability",
    name: "Delegation & Accountability",
    description: "Tracks owners, commitments, due dates and follow-up needs for human action.",
    remit: ["commitment tracking", "ownership visibility", "follow-up queues"],
    routeHints: ["delegation", "follow up", "commitment", "accountability", "owner", "responsibility"],
    status: "planned",
    autonomy: "read_only",
    icon: "accountability",
  },
  {
    key: "risk",
    name: "Risk & Compliance",
    description: "Surfaces project, operational, safety and compliance risks for authorised review.",
    remit: ["risk register", "safety issues", "quality exposure", "compliance monitoring"],
    routeHints: ["risk", "compliance", "safety", "quality", "incident", "exposure"],
    status: "planned",
    autonomy: "read_only",
    icon: "risk",
  },
];

export const veaAgentActionPolicy = {
  defaultMode: "read_only" as const,
  writesEnabled: false,
  approvalActionsEnabled: false,
  prohibitedWithoutHumanDecision: [
    "payments and transfers",
    "contract execution or amendments",
    "purchase commitments",
    "employment and disciplinary decisions",
    "legal or commercial commitments",
    "changes to financial records",
  ],
};

export function suggestVEAAgentKeys(message: string): string[] {
  const normalized = message.toLowerCase();
  const matched = veaAgents
    .filter((agent) => ["project", "finance", "procurement"].includes(agent.key))
    .filter((agent) => agent.routeHints.some((hint) => normalized.includes(hint)))
    .map((agent) => agent.key);

  const broadRequest = ["briefing", "business pulse", "overall", "what needs attention", "top priorities", "across the business"]
    .some((hint) => normalized.includes(hint));
  if (broadRequest) return ["executive", "project", "finance", "procurement"];
  if (matched.length === 0) return ["executive"];
  return matched;
}
