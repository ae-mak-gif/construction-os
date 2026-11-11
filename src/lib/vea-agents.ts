/**
 * BuildFlow VEA agent catalogue.
 *
 * This is a capability and routing contract, not an enabled autonomous runtime.
 * All agents remain read-only until server-side tool permissions, approvals,
 * audit coverage and tenant-isolation tests are complete.
 */
export type VEAAgentStatus = 'foundation' | 'next' | 'planned';

export interface VEAAgentDefinition {
  key: string;
  name: string;
  description: string;
  remit: string[];
  routeHints: string[];
  status: VEAAgentStatus;
  autonomy: 'read_only';
  icon: 'executive' | 'project' | 'finance' | 'procurement' | 'workforce' | 'documents' | 'accountability' | 'risk';
}

export const veaAgents: VEAAgentDefinition[] = [
  {
    key: 'executive',
    name: 'Executive Orchestrator',
    description: 'Understands the request, selects the right specialist and combines findings.',
    remit: ['cross-functional briefings', 'business pulse', 'decision preparation', 'delegation coordination'],
    routeHints: ['executive', 'overview', 'business', 'briefing', 'priority', 'what needs attention'],
    status: 'foundation',
    autonomy: 'read_only',
    icon: 'executive',
  },
  {
    key: 'project',
    name: 'Project Intelligence',
    description: 'Analyses delivery progress, schedules, dependencies, delays and project exposure.',
    remit: ['project health', 'programme and milestones', 'task status', 'delivery risks'],
    routeHints: ['project', 'schedule', 'milestone', 'delay', 'progress', 'task', 'site'],
    status: 'next',
    autonomy: 'read_only',
    icon: 'project',
  },
  {
    key: 'finance',
    name: 'Finance Intelligence',
    description: 'Surfaces budget, invoice, cash-flow and cost information for human review.',
    remit: ['budgets', 'invoices', 'cash flow', 'cost variance'],
    routeHints: ['finance', 'budget', 'invoice', 'cash flow', 'cost', 'payment', 'expense'],
    status: 'next',
    autonomy: 'read_only',
    icon: 'finance',
  },
  {
    key: 'procurement',
    name: 'Procurement Intelligence',
    description: 'Reviews purchase requests, orders, supplier records and materials visibility.',
    remit: ['purchase requests', 'purchase orders', 'supplier records', 'materials visibility'],
    routeHints: ['procurement', 'purchase', 'supplier', 'materials', 'order', 'stock'],
    status: 'next',
    autonomy: 'read_only',
    icon: 'procurement',
  },
  {
    key: 'workforce',
    name: 'People & Workforce',
    description: 'Provides workforce capacity and resource-allocation visibility without making HR decisions.',
    remit: ['workforce capacity', 'resource allocation', 'staffing visibility', 'equipment allocation'],
    routeHints: ['people', 'workforce', 'staff', 'team', 'capacity', 'resource', 'equipment'],
    status: 'planned',
    autonomy: 'read_only',
    icon: 'workforce',
  },
  {
    key: 'documents',
    name: 'Research & Documents',
    description: 'Finds, extracts and summarises authorised project documents and reference material.',
    remit: ['document search', 'contract and report summaries', 'research', 'evidence extraction'],
    routeHints: ['document', 'contract', 'report', 'drawing', 'research', 'file', 'evidence'],
    status: 'planned',
    autonomy: 'read_only',
    icon: 'documents',
  },
  {
    key: 'accountability',
    name: 'Delegation & Accountability',
    description: 'Tracks owners, commitments, due dates and follow-up needs for human action.',
    remit: ['commitment tracking', 'ownership visibility', 'follow-up queues', 'delegation status'],
    routeHints: ['delegation', 'follow up', 'commitment', 'accountability', 'owner', 'responsibility'],
    status: 'planned',
    autonomy: 'read_only',
    icon: 'accountability',
  },
  {
    key: 'risk',
    name: 'Risk & Compliance',
    description: 'Surfaces project, operational, safety and compliance risks for authorised review.',
    remit: ['risk register', 'safety issues', 'quality exposure', 'compliance monitoring'],
    routeHints: ['risk', 'compliance', 'safety', 'quality', 'incident', 'exposure'],
    status: 'planned',
    autonomy: 'read_only',
    icon: 'risk',
  },
];

export const veaAgentActionPolicy = {
  defaultMode: 'read_only' as const,
  writesEnabled: false,
  approvalActionsEnabled: false,
  prohibitedWithoutHumanDecision: [
    'payments and transfers',
    'contract execution or amendments',
    'purchase commitments',
    'employment and disciplinary decisions',
    'legal or commercial commitments',
    'changes to financial records',
  ],
};

/**
 * Conservative keyword routing for previews and deterministic tests.
 * The future model orchestrator may propose a route, but the server must
 * validate the selected key against this registry before any tool is exposed.
 */
export function suggestVEAAgentKeys(message: string): string[] {
  const normalized = message.toLowerCase();
  const matches = veaAgents
    .filter((agent) => agent.key !== 'executive')
    .map((agent) => ({
      key: agent.key,
      score: agent.routeHints.reduce(
        (score, hint) => score + (normalized.includes(hint) ? 1 : 0),
        0,
      ),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (matches.length === 0) return ['executive'];
  const topScore = matches[0].score;
  return matches.filter((item) => item.score === topScore).map((item) => item.key);
}
