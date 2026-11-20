# BuildFlow — Eight-Checkpoint Roadmap and Parallel Execution Register

**Status date:** 20 November 2026  
**Working product name:** BuildFlow (internal name; do not rename project assets without approval)  
**Repository:** `ae-mak-gif/construction-os`  
**Development branch:** `buildflow/eight-checkpoint-parallel-workstreams`  
**Starting commit:** `2780813e7826d22434c7a40f0df89ffb2205ce85`  
**Environment policy:** Development and Preview only. Production remains protected.

This document is the canonical engineering execution register for the eight mandatory BuildFlow checkpoints. Supporting release checklists and UAT documents provide evidence and detailed test cases; they do not replace or reorder these checkpoints.

## Governing execution rules

1. Exactly eight mandatory checkpoints exist, in the order below.
2. Checkpoint acceptance is sequential. A checkpoint cannot be signed off until every preceding checkpoint has been accepted with evidence.
3. Development work may run concurrently across isolated workstreams. Parallel implementation does not imply parallel acceptance or permission to bypass dependencies.
4. No Production deployment, Production database/schema/data change, Production environment-variable change, migration replay, or PR merge is authorised by this plan.
5. GitHub is the source of truth for code and migration files; Supabase is the source of truth for live database state.
6. No schema change is made until its migration history, dependency order, RLS, rollback implications and Development target are verified.
7. n8n is an optional internal orchestration layer, not a second database, identity provider, permission engine, or substitute for BuildFlow product functionality.
8. Every work item must have an owner/workstream, a test, evidence, and a recorded status. Unknown or untested behaviour is not marked complete.

## Current verified position

- GitHub PR #3 is open, Draft and unmerged. Its head is `2780813`; PR #1 is also Draft and unmerged.
- The latest Preview deployment for that commit is READY. Production remains on its existing `main` deployment.
- Supabase Development project `BuildFlow Main` (`amqknbijdjpcapwkeyyh`) is `ACTIVE_HEALTHY`.
- The Development database has 57 public tables with RLS enabled and five active Edge Functions (see the latest environment audit for the exact function versions).
- The latest Security Advisor reports leaked-password protection disabled and two private-schema RLS-without-policy informational findings. The private tables have separately been assessed for grants/access; do not add broad policies merely to silence the notice.
- The latest Performance Advisor reports 35 unindexed foreign keys and unused-index findings. Review query plans and actual workload before changing indexes.
- Development migration reconciliation remains unresolved: the recorded migration ledger and repository files are not a one-to-one match, with version/name ambiguities. Do not replay, rename or apply migrations until a checksum- and history-based reconciliation is complete.
- The latest PR description records that six pilot accounts can sign in and that several backend rollback-only workflow tests passed. Browser UAT for procurement, finance, variations, role boundaries and external client portal remains outstanding; backend tests do not replace browser evidence.
- VEA version 13 is active in Development with JWT verification. A fresh six-project test proving all specialists and executive synthesis complete without provider rate-limit failures remains outstanding.
- Subscription/entitlement lifecycle and backup/restore evidence remain incomplete.

## Eight mandatory checkpoints

### 1. Application foundation, architecture and security
**Status: IN PROGRESS — acceptance blocked by outstanding evidence.**

Scope:
- Authentication, profiles, organisation membership, RBAC, RLS and tenant isolation.
- Strict Development / Preview / Production separation.
- Schema integrity, migration reconciliation, reproducible migrations and safe release process.
- Git branches, pull requests, CI/CD, review gates and dependency/security checks.
- Audit trails, secure error handling, secret management and least privilege.

Acceptance evidence:
- Prove the effective Supabase endpoint used by Preview is Development and that Production uses only its separately approved endpoint.
- Reconcile the Development migration ledger to repository migrations, including exact SQL/checksum, version, dependencies and execution history.
- Demonstrate tenant isolation and role permissions with authenticated tests and browser evidence.
- Resolve or formally accept the leaked-password protection limitation before broader external pilot access.
- Confirm Production isolation and rollback/backup controls.

### 2. Functional completion of every business module
**Status: IN PROGRESS — broad implementation exists; module-level browser acceptance is incomplete.**

Modules:
- Dashboard; CRM; Projects; Tasks/Programme; BOQ/Estimates; Procurement/Suppliers; Inventory; Finance; Risk & Quality; Equipment; HR & Staff; Workshop; Documents; Communications; Client Portal; Reports.

For every applicable module verify:
- Create, read, update and delete/archive behaviour; forms and validation; persistence; search/filter; loading, empty and error states; permissions; auditability; responsive behaviour.
- No misleading controls, dead buttons, fake data fallbacks, non-existent workflows or unsupported status claims.
- Business calculations and status transitions are consistent across Dashboard, Projects, Finance and Reports.

Acceptance evidence:
- A module-by-module control inventory and test matrix.
- Successful authorised actions and denied unauthorised actions.
- Persisted records verified after refresh and through the relevant related module.
- No critical or high-severity functional defects.

### 3. Integrated end-to-end construction workflows
**Status: IN PROGRESS — several backend flows tested; complete browser journeys remain outstanding.**

Required connected flow:
- CRM/enquiry → client → project → BOQ/budget → programme → procurement request/approval/PO → supplier delivery/receiving → inventory/material issue → labour/equipment allocation → site execution → quality/safety → variations/invoices/actual costs → forecasting/reporting/client updates.

Include collaboration between contractors, project managers, site teams, clients, architects, engineers, quantity surveyors, suppliers and subcontractors through explicit role-controlled access.

Acceptance evidence:
- End-to-end journeys with persisted records and traceability across modules.
- Correct project, organisation, user, quantity and financial relationships.
- Correct approval boundaries, audit events, stock/cost reconciliation and client visibility.

### 4. Digital construction, BIM and connected project information
**Status: NOT STARTED — capability discovery and architecture are required before implementation.**

Scope:
- Drawing/document registers, revisions, versioning and traceability.
- IFC import/interoperability and 3D model viewing.
- BIM model issues and design coordination.
- Model-linked quantities and BOQ.
- Foundations for 4D (model-to-schedule) and 5D (model/quantities/cost) BIM.
- Integrate with established BIM authoring platforms rather than building a full BIM authoring engine.

Acceptance evidence:
- A supported IFC sample imported and viewed.
- Model elements/issues linked to BuildFlow project records.
- Demonstrated traceability from model quantities to BOQ and, where feasible, schedule/cost records.
- Documented interoperability limits and supported formats.

### 5. Integrations, automation, VEA and construction intelligence
**Status: IN PROGRESS — integration registry and VEA foundations exist; full workflow and intelligence acceptance remains open.**

Scope:
- Secure Supabase integrations, n8n workflows, notifications and external supplier/client integrations.
- VEA executive orchestration and specialist agents.
- Grounded project risk, cost variance, procurement, schedule/progress and financial/cash-flow insights.
- Validated forecasting for delay, cost overrun, material shortage, cash flow and anomalies.
- Accounting integration only after core operational flows are stable.

n8n boundary:
- Start with self-hosted Community Edition for internal Development experimentation only.
- n8n must not become a competing data store, auth provider or tenant permission authority.
- Use authenticated, narrowly scoped BuildFlow endpoints/Edge Functions; do not expose Supabase service-role credentials to the browser or put unrestricted database keys into n8n.
- Keep Development credentials separate; Production credentials and Production activation remain disconnected until separately reviewed and approved.
- Export workflow definitions to version control with secrets excluded; document manual backup/import because Community Edition does not include the paid Git version-control feature.
- Do not expose the n8n editor, workflow configuration, API or MCP to BuildFlow customers. Do not white-label or resell n8n. Seek written licensing clarification before any customer-configurable or customer-credential-dependent n8n-backed feature.
- BuildFlow-native customer-facing automation should use BuildFlow-owned services and permission checks.

Initial internal workflow candidates:
1. New project created → internal notification.
2. Purchase request awaiting approval → authorised approver notification and reminder.
3. Overdue task or milestone → project escalation.
4. Daily project briefing → read-only, organisation-scoped summary.
5. GitHub/Vercel Preview deployment result → development-team notification.

Acceptance evidence:
- Each workflow has an owner, trigger, input/output schema, least-privilege credential, idempotency strategy, retry/error path and audit trail.
- Demonstrate successful and failed executions in Development.
- VEA answers are grounded in current permitted data, disclose incomplete coverage, and cannot perform unauthorised writes or approvals.
- Forecasts are evaluated against historical/observed outcomes before being represented as predictive capability.

### 6. Advanced field operations and connected resources
**Status: NOT STARTED — define mobile/offline and data-sync architecture before building.**

Scope:
- Mobile-first/offline site reporting and reliable synchronisation.
- Geotagged photos/evidence, digital inspections/sign-offs and progress measurement.
- Drone/site-image integration where feasible.
- GPS/telematics, equipment utilisation/downtime and predictive maintenance.
- Digital labour timesheets and productivity.
- Supplier performance, delivery/logistics tracking, material price intelligence, automated reorder and demand planning.

Acceptance evidence:
- Field-to-office data survives intermittent connectivity and sync conflicts are handled safely.
- Evidence metadata, actor, time and project relationships are auditable.
- Resource and material updates reconcile with operational records and permissions.

### 7. Comprehensive QA, product polish and commercial readiness
**Status: IN PROGRESS — CI and release documentation exist; UAT, resilience and commercial gates remain open.**

Scope:
- UAT for Primary Admin, Organisation Admin, Project Manager, Finance User, Site Manager and External Client.
- Tenant isolation, permission boundaries, audit, backup/restore and end-to-end regression tests.
- Responsive UX, accessibility, reports/PDFs, onboarding/help and activity history.
- Pricing/subscription lifecycle, support, legal/privacy, data governance and documentation.

Acceptance evidence:
- Signed UAT matrix with screenshots/log references and defects resolved or explicitly waived.
- Verified backup/restore exercise.
- No unresolved critical security, tenant-isolation, financial-integrity or data-loss defects.
- Server-enforced plan/feature entitlements and complete plan lifecycle before paid launch.
- User/admin guides, known-limitations register, support and incident procedures.

### 8. Controlled pilot and market launch
**Status: NOT STARTED — dependent on acceptance of checkpoints 1–7.**

Scope:
- Controlled pilot with 3–5 construction companies.
- Validate real construction workflows and ConTech capabilities.
- Capture structured feedback, outcomes, defects and product usage.
- Refine onboarding, pricing and support before paid launch.

Acceptance evidence:
- Pilot scope, participating organisations, data boundaries and success measures documented.
- Real workflows validated with no unresolved critical security/data-integrity defects.
- Feedback and release-critical fixes completed.
- Explicit pilot exit decision and separate approval for commercial launch.

## Parallel workstream operating model

Workstreams may proceed concurrently with isolated branches, clear ownership and agreed interfaces:

| Workstream | Primary checkpoint(s) | Current priority / dependency |
|---|---|---|
| A. Foundation, auth, tenant security and migrations | 1 | Critical path; migration reconciliation and endpoint proof first |
| B. Business module completeness | 2 | Continue module/control inventory and targeted fixes against existing schema |
| C. Construction workflow integration | 3 | Complete procurement, finance, variation and project/site browser journeys |
| D. BIM and connected information | 4 | Discovery, sample formats and architecture; no speculative schema yet |
| E. Integrations, n8n, VEA and intelligence | 5 | Internal Development-only n8n design; VEA rate-limit retest |
| F. Field operations and connected resources | 6 | Mobile/offline, evidence, labour/equipment and supply-chain discovery |
| G. QA, release readiness and commercial preparation | 7 | UAT evidence, restore drill, security and entitlements |
| H. Pilot and market validation | 8 | Prepare pilot framework only; no pilot launch before gates pass |

### Coordination rules

- Use short-lived feature branches based on the approved development baseline; isolate changes by module/workstream.
- Shared database contracts, permissions, event names and API payloads must be documented before parallel implementations depend on them.
- Only Workstream A coordinates schema/migration changes until the migration ledger is reconciled. Other workstreams may prepare proposed migrations but must not apply them.
- Avoid simultaneous edits to the same files or tables. Integrate through reviewed pull requests and run regression tests after each merge.
- Later-checkpoint research and isolated implementation may proceed, but later work cannot weaken earlier security or acceptance requirements.
- Merge and release decisions remain explicit; no automatic merge, Production deploy or Production migration.

## Immediate execution queue

1. Finish Checkpoint 1 evidence: Preview/Production endpoint proof, migration reconciliation, security decision and authenticated browser role/tenant tests.
2. In parallel, complete Checkpoint 2 module inventory and fix the highest-impact broken/inactive controls without changing shared schema.
3. Complete Checkpoint 3 browser journeys for procurement, finance, variations, project delivery and external client scope.
4. Re-run the six-project VEA test on Development and record each specialist, synthesis, rate-limit and audit outcome.
5. Start Checkpoint 4 and 6 discovery work without introducing speculative tables or paid dependencies.
6. Prepare the internal n8n Community Edition workflow specifications; do not connect Production or customer credentials.
7. Build the Checkpoint 7 UAT, backup/restore and commercial-readiness evidence pack.
8. Keep Checkpoint 8 at preparation only until the previous checkpoints have passed sequential acceptance.

**Next status update must report all eight checkpoints, completed/verified evidence, blockers, active parallel workstreams, changed commit/Preview and Production safety status.**
