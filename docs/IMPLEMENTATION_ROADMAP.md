# BuildFlow implementation roadmap

This roadmap advances the existing Construction OS / BuildFlow repository. It is an implementation plan, not a rebuild. Preserve the current React + Vite application, Supabase project, GitHub repository and Vercel project unless a later decision explicitly changes them.

## Operating principles
- GitHub is the canonical source of truth; use feature branches and pull requests.
- Vercel is the primary hosting and deployment platform.
- Supabase is the system of record for application data, identity and file storage.
- Keep Demo, Development and Production data/services isolated. Never point a public demo at production data.
- Treat the existing UI as a product prototype until each module is backed by tested persistence and authorization.
- Do not reapply the existing SQL migration files to the live database blindly. The live schema exists but migration history is empty; first establish a verified baseline.
- Do not connect paid n8n hosting until the core data model, events and environment boundaries are stable.

## Delivery sequence and exit criteria

### 0. Stabilisation and source control — completed on feature branch
- Align frontend queries with the live Supabase schema.
- Add prebuild lint and typecheck gates; add a GitHub Actions workflow for pull requests and main-branch pushes.
- Record the current live schema and migration-history discrepancy.
- Fix the initial lint findings and TypeScript errors revealed by the new gates.
- Exit achieved: the feature-branch Vercel preview passes lint (0 errors, 2 non-blocking Fast Refresh warnings), typecheck and Vite production build. No production schema or deployment change was made.

### 1. Authentication, organisation context and tenancy
- Complete sign-in, sign-out, session restoration, loading/error handling and profile fallback.
- Filter memberships to active rows; fail closed for no active membership or multiple memberships until an organisation selector is implemented.
- Define the supported membership lifecycle and organisation selection for users belonging to more than one organisation.
- Enforce active membership and tenant scoping consistently in application queries and RLS.
- Separate platform administration, organisation administration, project roles and client-portal access.
- Exit: tests prove cross-organisation reads/writes are denied and each role has only its intended permissions.

### 2. Database baseline and migration discipline
- Introspect every public table, column, constraint, index, trigger, function and policy from the live project.
- Compare that snapshot with supabase/migrations/001_core.sql through 010_rls.sql.
- Determine which SQL was applied manually and why the migration ledger is empty.
- Create a reviewed baseline/reconciliation plan; do not mark old migrations as applied or replay them until equivalence is demonstrated.
- Exit: schema is reproducible in a clean non-production Supabase project and the migration ledger accurately reflects the baseline.

### 3. Security and operational readiness
- Review every RLS policy against tenant and role requirements, including notifications, documents, messages and client access.
- Publish the security/RLS target matrix and adversarial test plan in `docs/SECURITY_RLS_MATRIX.md`.
- Fix function search paths; enable leaked-password protection; review indexes based on query plans and workload rather than deleting unused indexes blindly.
- Verify secrets and environment variables independently in Demo, Preview/Development and Production.
- Exit: security review passes, no service-role secret is exposed to the browser, and tenant-isolation tests pass.

### 4. Environment separation
- Define isolated Supabase projects or equivalent isolated data resources for Demo, Development and Production.
- Configure Vercel Production, Preview and Demo/custom environments with distinct credentials and data.
- Seed synthetic demo records only; prohibit real customer data in demo.
- Decide public demo access and Vercel protection/custom-domain rules.
- Exit: a demo login and preview deployment cannot read or write production data.

### 5. Core operational workflow (first live vertical slice)
Connect the end-to-end workflow in this order:
1. CRM enquiries and clients
2. Project creation and project membership
3. Tasks, milestones and updates
4. BOQ and estimates
5. Suppliers and procurement requests/orders
6. Inventory receipts/issues
7. Expenses, invoices and payments
8. Dashboard and project reporting

For each module: define data contracts, typed repository/service functions, loading/empty/error states, validation, audit trail, RLS and integration tests. Remove mock data only after the live path is verified.
- Exit: one complete project can move from enquiry through procurement and finance with persisted, tenant-scoped records.

### 6. Remaining operational modules
- HR/staff and resource allocation
- Workshop/work orders
- Equipment and maintenance
- Risk, quality, inspections and corrective actions
- Communications, notifications and activity feed
- Reports and exports
- Client portal with explicit client identity, project-level permissions and approval/document scopes
- Exit: every production-facing screen is backed by a documented, permission-tested workflow.

### 7. Documents and AI
- Configure Supabase Storage buckets, private access policies, signed URLs, metadata, versioning and retention.
- Connect AI through a server-side function or controlled backend; never expose provider secrets in Vite/browser variables.
- Add tenant-scoped retrieval, citations to source documents, human approval for consequential actions and usage/cost controls.
- Exit: uploads, downloads and AI answers respect tenant and project permissions and are auditable.

### 8. Automation and integrations
- Introduce a transactional outbox/event model before workflow automation.
- Then connect n8n for notifications, reminders, document workflows and integrations (email, calendar, WhatsApp/SMS) using idempotent, retryable workflows.
- Keep credentials server-side and log delivery status.
- Exit: automations can safely retry without duplicate invoices, orders, messages or other business actions.

### 9. Release validation
- Automated unit, integration, RLS and end-to-end tests.
- Backup/restore rehearsal, monitoring, error reporting, audit logs and operational runbooks.
- Performance testing with realistic multi-organisation data.
- Controlled pilot, acceptance sign-off and rollback plan.
- Exit: production release checklist signed off; demo, development and production boundaries verified.

## Immediate next work
1. Complete the authentication profile and active-membership guard; feature-branch lint, typecheck and build now pass.
2. Create an isolated Development Supabase environment and configure Vercel Preview to use it; current Preview and Production variables are shared across both targets.
3. Review auth/membership state transitions and implement an explicit organisation selector before enabling multi-organisation users.
4. Complete column/constraint/index/function/policy-level comparison of the live schema with migrations 001-010; table-name parity is confirmed but full equivalence is not.
5. Security/RLS matrix and test plan are now documented; implementation and adversarial tests remain blocked on isolated Development.