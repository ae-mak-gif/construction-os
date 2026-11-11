# BuildFlow RBAC expansion — 11 November 2026

This phase extends the first RBAC foundation across the rest of the operational schema. All changes are Development-only.

## Current state
- 81 permission keys in the private permission catalogue.
- 81 allowed permission assignments seeded for the Development Admin role.
- 100 permission-specific RLS policies using `private.has_org_permission` or project-scoped `private.has_project_permission`.
- Zero broad `is_active_org_member` CRUD policies remain on operational tables.
- Special participant-scoped policies remain for messages, notifications and VEA conversations/runs/approvals/audit. Organisation, membership and role tables retain limited membership-scoped read policies.

## Modules covered by permission-aware RLS
CRM and communications; projects and tasks; BOQ and estimates; calendar; programme activities, dependencies and baselines; cost control and finance; procurement, suppliers and purchase-order items; inventory; workforce, equipment and assignments; risks; safety; RFIs; variations; quality and inspections; daily site diaries; work orders; documents; project updates; project membership; approvals; security audit records.

## Tests and advisor results
- Simulated unprivileged role resolved `projects.view`, `finance.view`, `crm.view` and `boq.view` as false.
- Earlier negative test confirmed RLS rejected a project insert without `projects.create`.
- Earlier negative test confirmed role-management RPC rejected callers without `organization.manage_roles`.
- Admin role management RPC test created a temporary role, assigned a permission and verified an audit event; transaction rolled back.
- Supabase Security Advisor reports only the leaked-password protection warning. The public SECURITY DEFINER warnings have been resolved by keeping privileged implementations in the private schema and exposing SECURITY INVOKER wrappers.
- Performance Advisor reports remaining unindexed foreign keys and unused indexes. Do not blindly add or drop indexes; review with workload evidence and query plans.

## Remaining security work
- Project-level access must be enforced consistently across all project-linked tables, not just the project-members table.
- Client portal identities and access must be separated from internal organisation membership.
- Approval-specific field transitions and payment/contract actions need explicit database-side safeguards.
- Add authenticated browser tests with at least two roles, inactive memberships, separate organisations and project-specific membership combinations.
- Test role assignment and last-admin lockout protections before release.
- Keep Production untouched until the release gates are met.
