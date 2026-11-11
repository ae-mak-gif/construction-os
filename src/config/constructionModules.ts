export type ConstructionModule = {
  id: string; name: string; category: string; summary: string;
  capabilities: string[]; currentFoundation: string[]; remainingBuild: string[];
  proposedTier: 'Starter' | 'Professional' | 'Business' | 'Enterprise'; openPage: string;
};

export const constructionModules: ConstructionModule[] = [
  { id: 'programme', name: 'Project Planning & Scheduling', category: 'Project controls',
    summary: 'Plan the work, sequence activities and understand whether delivery is on schedule.',
    capabilities: ['Work breakdown structures', 'Gantt-style programme and milestones', 'Task dependencies and critical path', 'Baseline versus actual progress', 'Labour and equipment resource planning'],
    currentFoundation: ['Projects', 'Tasks', 'Calendar events'],
    remainingBuild: ['Schedule activity register and progress tracking', 'Baselines and revisions', 'Dependencies, critical path and resource loading'],
    proposedTier: 'Professional', openPage: 'project-schedule' },
  { id: 'site-operations', name: 'Site Operations & Daily Reporting', category: 'Project delivery',
    summary: 'Give site teams a structured daily record of what happened, what changed and what needs attention.',
    capabilities: ['Daily site diaries', 'Labour, plant and material records', 'Weather and site conditions', 'Progress photographs and instructions', 'Delay and disruption records'],
    currentFoundation: ['Projects', 'Project updates', 'Tasks', 'Equipment'],
    remainingBuild: ['Dedicated site diary records', 'Daily resource and weather capture', 'Photo and document attachments', 'Delay and instruction registers'],
    proposedTier: 'Starter', openPage: 'site-diaries' },
  { id: 'contracts', name: 'Contract & Variation Management', category: 'Commercial controls',
    summary: 'Control the commercial relationship between the original contract and approved changes.',
    capabilities: ['Contract register and key dates', 'Contract obligations and deliverables', 'Variation and change requests', 'Extensions of time and delay notices', 'Approval history and valuation tracking'],
    currentFoundation: ['Projects and contract values', 'Project approvals', 'Project documents'],
    remainingBuild: ['Contract records and clauses register', 'Variation orders and valuation workflow', 'Extension-of-time notices', 'Contract event and approval audit trail'],
    proposedTier: 'Business', openPage: 'projects' },
  { id: 'cost-control', name: 'Cost Control & Project Profitability', category: 'Commercial controls',
    summary: 'See the financial position of each project before cost overruns become surprises.',
    capabilities: ['Approved project budgets', 'Committed, actual and forecast costs', 'Cost-to-complete and estimate-at-completion', 'Cash-flow forecasts', 'Margin and profitability analysis'],
    currentFoundation: ['Project costs', 'Expenses', 'Purchase orders', 'Finance'],
    remainingBuild: ['Cost-code and budget structure', 'Commitment reconciliation', 'Forecast and cost-to-complete engine', 'Budget variance and margin reporting'],
    proposedTier: 'Professional', openPage: 'cost-control' },
  { id: 'subcontractors', name: 'Supplier & Subcontractor Management', category: 'Supply chain',
    summary: 'Manage material suppliers and delivery partners with distinct records, compliance and commercial controls.',
    capabilities: ['Supplier and subcontractor registers', 'Trade packages and scopes of work', 'Qualification and compliance documents', 'Performance and delivery scorecards', 'Subcontract valuations and payment certificates'],
    currentFoundation: ['Supplier register', 'Purchase requests and orders', 'Project documents'],
    remainingBuild: ['Separate subcontractor profiles and trade packages', 'Compliance and insurance tracking', 'Progress valuations and payment certificates', 'Supplier and subcontractor performance metrics'],
    proposedTier: 'Professional', openPage: 'ops-suppliers' },
  { id: 'hse', name: 'Health, Safety & Environment', category: 'Site assurance',
    summary: 'Move beyond a risk list to a traceable system for safety, environmental and corrective-action management.',
    capabilities: ['Site risk assessments and method statements', 'Incident, near-miss and hazard reporting', 'Safety inspections and permits to work', 'Corrective and preventive actions', 'Environmental monitoring and compliance records'],
    currentFoundation: ['Risk register', 'Inspections', 'Quality and safety observations'],
    remainingBuild: ['Incident and near-miss register', 'Permit-to-work workflows', 'Corrective-action ownership and closure evidence', 'Environmental event and compliance registers'],
    proposedTier: 'Starter', openPage: 'mgmt-risk' },
];
