# BuildFlow RBAC implementation progress — 11 November 2026

## Development-only changes

The following work was applied to the dedicated Development Supabase project `buildflow-dev` (project ref `amqknbijdjpcapwkeyyh`). Production was not modified.

### Permission model
- Added a private permission catalogue with 45 module/action permission keys.
- Added organisation-scoped role-to-permission assignments.
- Added `private.has_org_permission(uuid,text)`, which checks the authenticated user, active organisation membership, role assignment, and allowed permission.
- Added a public invoker wrapper `public.has_org_permission(uuid,text)` for authenticated application calls. It delegates to the private checker and returns only a boolean.
- Private permission tables have RLS enabled, explicit deny-all authenticated policies, and no client table grants.
- Seeded all current permissions to the existing Admin role in the Development tenant.

### Tables now using permission-aware RLS policies
- projects
- tasks
- schedule_activities
- schedule_activity_dependencies
- schedule_baselines
- project_budgets
- risks
- safety_incidents
- project_rfis
- contract_variations
- purchase_requests
- purchase_orders
- subcontractors
- invoices
- expenses
- project_costs
- finance_transactions

The above tables no longer retain the previous broad active-organisation-member CRUD policies. Their policies now check module/action permissions.

### Verification
- 45 permission catalogue entries.
- 45 allowed assignments for the Development Admin role.
- 42 permission-specific RLS policies across the 17 listed tables.
- Zero previous `active_member` policies remain on those 17 tables.
- Simulated authenticated-session check: Admin resolves `projects.view` and `agents.view` as allowed.
- Temporary unprivileged-role test: a project insert without `projects.create` was rejected by RLS; the transaction was rolled back.
- Supabase Security Advisor no longer reports the private permission tables as RLS-enabled with no policies.
- Remaining security advisor warning: leaked-password protection is disabled (plan/configuration item).
- Performance Advisor still reports other unindexed foreign keys; do not add/drop indexes blindly without workload and query-plan review.

### Remaining work
- Apply permission-aware policies to the remaining operational tables.
- Add role and permission administration UI and secure server-side management functions.
- Add project-level membership restrictions and separate client identities from internal organisation members.
- Add cross-tenant, inactive-member, privilege-escalation and multi-role tests with dedicated Development identities.
- Implement field-level approval protections for payments, purchase orders, contract variations and agent-proposed actions.
- Ensure all permission changes and consequential actions have an immutable audit trail.
- Validate the VEA context endpoint against the new permission checks in an authenticated browser session.

## VEA integration
The VEA read-only context endpoint now checks `agents.view` and only requests project, task, risk, procurement and finance data when the caller has the corresponding module permission. This change is on the separate VEA feature branch and uses the Development permission-check function. The live model and agent actions remain disabled.

## Environment boundary
All changes above are restricted to Development. Do not merge either feature PR or change Production until the remaining security and workflow release gates pass.
