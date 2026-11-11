# BuildFlow Construction Module Expansion

**Status:** Initial module catalogue added; detailed schemas and operational workflows remain to be implemented.
**Environment boundary:** Development branch only. No Production changes.

## Design principles
- Extend existing BuildFlow modules instead of duplicating them.
- Preserve existing customer records and demo fixtures.
- Treat the database as the source of truth; never present sample rows as persisted records.
- Every new record must be tenant-scoped and project-scoped where applicable.
- New tables must be RLS-enabled and remain inaccessible until their permission-aware policies are implemented and tested.
- SaaS tier labels are provisional product candidates, not active entitlements.

## Additional construction-industry modules

| Module | Existing foundations | New capabilities |
|---|---|---|
| Project Planning & Scheduling | Projects, tasks, calendar events | Work breakdown, schedule activities, dependencies, baselines, critical path, resource loading |
| Site Operations & Daily Reporting | Projects, project updates, tasks, equipment | Daily diaries, labour/plant/material capture, weather, photos, instructions, delay records |
| Contract & Variation Management | Projects, contract values, project approvals, documents | Contract register, obligations, variations, EOT notices, valuations, audit trail |
| Cost Control & Project Profitability | Project costs, expenses, purchase orders, finance | Cost codes, budgets, commitments, forecasts, cost-to-complete, margins |
| Supplier & Subcontractor Management | Suppliers, purchase requests/orders, documents | Separate subcontractor records, trade packages, compliance, valuations, performance |
| Health, Safety & Environment | Risks, inspections, quality issues | Incidents, near misses, permits, corrective actions, environmental events |

## Proposed SaaS tier candidates
- **Starter:** site diary and essential HSE reporting.
- **Professional:** advanced scheduling, cost control and supply-chain management.
- **Business:** contract administration, variations and commercial controls.
- **Enterprise:** advanced portfolio controls, configurable workflows, multi-branch governance and extended reporting.

This is a starting hypothesis only. The eventual entitlement model should be feature-based, centrally configured, and capable of overriding individual features for pilots or negotiated enterprise contracts.

## Data model additions to design
1. schedule_activities and schedule_dependencies
2. site_diaries and site_diary_resources
3. project_contracts, contract_obligations, contract_variations, extension_of_time_notices
4. project_budgets, project_budget_lines, cost_commitments, cost_forecasts
5. subcontractors, subcontract_packages, subcontract_valuations
6. safety_incidents, safety_permits, corrective_actions, environmental_events

Before applying migrations, reconcile naming, foreign keys, constraints, indexes and existing migration history. All new tables must include organization_id, project linkage where relevant, audit timestamps, RLS and permission-aware policies. Do not add broad all-active-member CRUD policies as a shortcut.

## Implementation sequence
1. Module catalogue and navigation.
2. Schema design and migration review.
3. Permission-aware RLS and tenant/project isolation tests.
4. Data access and CRUD workflows.
5. Cross-module links and approvals.
6. Feature-entitlement mapping for Starter, Professional, Business and Enterprise.
7. Regression testing and preview acceptance.