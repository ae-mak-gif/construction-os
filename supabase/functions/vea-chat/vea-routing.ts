export type SpecialistKey = "project" | "finance" | "procurement";
export type AgentKey = "executive" | SpecialistKey;

export interface SpecialistDefinition {
  key: SpecialistKey;
  dbKey: string;
  name: string;
  hints: string[];
  toolKeys: string[];
  contextKeys: string[];
  instruction: string;
}

export const specialistDefinitions: Record<SpecialistKey, SpecialistDefinition> = {
  project: {
    key: "project",
    dbKey: "project_intelligence",
    name: "Project Intelligence",
    hints: ["project", "schedule", "programme", "program", "milestone", "delay", "progress", "task", "site", "risk register", "construction"],
    toolKeys: ["buildflow.projects.read", "buildflow.tasks.read", "buildflow.risks.read", "buildflow.calendar_upcoming.read"],
    contextKeys: ["projects", "tasks", "risks", "calendar_events"],
    instruction: "Assess delivery performance, programme and milestone slippage, overdue work, dependencies, project risks and near-term events. Separate recorded facts from interpretation. Prioritise issues by impact and urgency.",
  },
  finance: {
    key: "finance",
    dbKey: "business_finance",
    name: "Finance Intelligence",
    hints: ["finance", "budget", "invoice", "invoices", "cash flow", "cashflow", "cost", "payment", "expense", "receivable", "payable", "margin"],
    toolKeys: ["buildflow.finance_invoices.read"],
    contextKeys: ["invoices"],
    instruction: "Assess invoice status, due dates, outstanding amounts and cash-flow implications only where the supplied records support them. Do not infer bank balances, actual cash position, profit or payment completion from invoice records alone.",
  },
  procurement: {
    key: "procurement",
    dbKey: "procurement",
    name: "Procurement Intelligence",
    hints: ["procurement", "purchase", "supplier", "materials", "material", "order", "stock", "inventory", "delivery", "lead time"],
    toolKeys: ["buildflow.procurement_requests.read"],
    contextKeys: ["purchase_requests"],
    instruction: "Assess purchase-request status, material availability signals and procurement bottlenecks from the supplied records. Do not imply that a supplier has been contacted, an order placed or a commitment made.",
  },
};

const broadHints = [
  "executive briefing", "business briefing", "business pulse", "overall",
  "across the business", "all areas", "top priorities", "what needs attention",
  "prepare my briefing", "prepare an executive briefing", "company-wide",
];

const plannedCapabilities = [
  { key: "workforce", hints: ["workforce", "staffing", "employee", "employees", "people", "team capacity", "leave"] },
  { key: "documents", hints: ["document", "documents", "contract", "drawing", "file", "research", "report", "attachment"] },
  { key: "accountability", hints: ["delegation", "follow up", "follow-up", "commitment", "responsibility", "action owner"] },
  { key: "risk_compliance", hints: ["compliance", "safety", "incident", "quality assurance", "regulatory"] },
];

export interface VEARoute {
  specialistKeys: SpecialistKey[];
  isExecutiveBriefing: boolean;
  plannedCapabilities: string[];
}

export function routeVEARequest(message: string): VEARoute {
  const normalized = message.toLowerCase().replace(/[^a-z0-9\s-]/g, " ");
  const isExecutiveBriefing = broadHints.some((hint) => normalized.includes(hint));
  const matched = (Object.keys(specialistDefinitions) as SpecialistKey[]).filter((key) =>
    specialistDefinitions[key].hints.some((hint) => normalized.includes(hint)),
  );
  const specialistKeys = isExecutiveBriefing
    ? (Object.keys(specialistDefinitions) as SpecialistKey[])
    : matched;

  return {
    specialistKeys,
    isExecutiveBriefing,
    plannedCapabilities: plannedCapabilities
      .filter((capability) => capability.hints.some((hint) => normalized.includes(hint)))
      .map((capability) => capability.key),
  };
}

export function contextForVEAAgent(
  context: Record<string, unknown>,
  agentKey: AgentKey,
): Record<string, unknown> {
  if (agentKey === "executive") {
    return {
      summary: context.summary,
      projects: context.projects,
      tasks: context.tasks,
      risks: context.risks,
      invoices: context.invoices,
      purchase_requests: context.purchase_requests,
      calendar_events: context.calendar_events,
    };
  }

  const definition = specialistDefinitions[agentKey];
  return {
    summary: context.summary,
    ...Object.fromEntries(definition.contextKeys.map((key) => [key, context[key]])),
  };
}

export function toolsForVEAAgent(agentKey: AgentKey): string[] {
  if (agentKey === "executive") {
    return [
      "buildflow.executive_context.read",
      ...Object.values(specialistDefinitions).flatMap((definition) => definition.toolKeys),
    ];
  }
  return specialistDefinitions[agentKey].toolKeys;
}

export function plannedCapabilityNotice(keys: string[]): string {
  if (keys.length === 0) return "";
  return "The following requested capabilities are not yet connected as dedicated VEA specialists: " +
    keys.join(", ") +
    ". Do not claim to have searched or accessed documents, workforce records, compliance records or other unavailable data. State this limitation clearly.";
}
