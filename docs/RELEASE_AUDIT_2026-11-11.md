# BuildFlow development release audit

Audit date: 11 November 2026  
Scope: feature branch `fix/auth-profile-schema-alignment` and dedicated Supabase Development project `buildflow-dev`.  
Production boundary: no Production database, secrets, deployment, or live user data was modified or tested.

## Verified baseline

- The open Draft pull request is #1: https://github.com/ae-mak-gif/construction-os/pull/1.
- Its recorded latest validation reports both CI jobs passing, lint with zero errors, TypeScript and Vite production build passing, and npm audit with zero critical/high findings. Nine moderate and two low advisories remain for triage.
- Development migration ledger contains the core migrations 001–010, the updated-at search-path hardening migration, and the message/notification scope migration.
- All 38 public application tables currently have row-level security enabled.
- The `private.is_active_org_member(uuid)` helper is SECURITY DEFINER with an empty search_path and checks the authenticated user against active organisation membership.
- The Development Supabase security advisor currently reports leaked-password protection disabled (warning).
- The Development performance advisor reports 31 unindexed foreign keys and 95 unused indexes. Do not drop unused indexes without workload/query-plan evidence.
- No Supabase Storage buckets currently exist in Development.
- The Development database now has a private permission catalogue (41 permissions), organisation-scoped role-permission mappings, and `private.has_org_permission(uuid,text)`; the existing Admin role was seeded with all 41 permissions.
- Permission-aware CRUD policies now replace broad active-member policies on `projects`, `tasks`, `schedule_activities`, and `project_budgets`. Other operational tables still require migration to permission-specific policies; role-aware authorisation is therefore partial, not complete.
- A simulated authenticated-session check confirmed the Admin role resolves `projects.view` and `agents.view` as allowed. The RBAC migration is recorded in the Development migration ledger; Production remains untouched.
- The client portal page is explicitly a sample-data preview, not an authenticated client portal.
- Settings lists Google Drive, Accounting, Online Payments and Virtual Executive Assistant as ready to connect, but the current Connect buttons are inert presentation controls; no OAuth/API integration is completed.
- Finance and several other pages fall back to mock records when their corresponding live table is empty. This can mix demo and live states and must be corrected consistently before release.

## Seven work packages and exit criteria

### 1. Role and permission model
Extend the database-backed permission catalogue and role-permission mapping to all operational modules. Proposed starting roles: Owner, Administrator, Project Manager, Finance Manager, Site Supervisor, Staff, and Client (client identities remain separate from internal organisation membership). Permissions must be module/action-specific and enforced by RLS, not only UI visibility. Preserve existing Admin access during migration. Test role mappings and denial behaviour with multiple Development identities before release.

### 2. Supabase and project-level access
Continue replacing broad active-member CRUD policies with permission-aware policies and project membership checks. Add cross-tenant, inactive-member, project-scope, role-escalation and client-isolation tests. Existing project_members table is not yet an adequate client-identity model.

### 3. Private document management
Create a private bucket only after the upload/download path and metadata contract are implemented. Require tenant/project-prefixed object paths, database-backed authorization, signed URLs, size/type validation, and explicit client-share state. No public bucket or public file URL.

### 4. Automated tests
Add unit, integration, RLS, cross-tenant, privilege-escalation and browser end-to-end tests using dedicated Development test identities. No interactive tests against Production.

### 5. Operational workflow completion
Finish persisted create/read/update/archive and approval flows for CRM, projects, tasks, BOQ/estimates, procurement, inventory, Finance, staff, equipment, work orders, risks, quality, inspections and reporting. Remove silent mock fallback from live mode; keep demo fixtures clearly isolated.

### 6. Integrations
Implement provider-specific server-side OAuth/API flows for Google Drive, accounting, online payments and Virtual Executive Assistant. Keep tokens/secrets server-side, validate OAuth state and webhook signatures, use least-privilege scopes, idempotency and audit logs. A Connect button or integration listing is not a completed integration. Provider credentials and account consent are required for live connection testing.

### 7. Security, dependencies and release
Triage the nine moderate and two low npm audit advisories; fix only compatible updates and re-run CI. Enable leaked-password protection if available on the current Supabase plan; otherwise record it as a plan-gated residual risk. Review foreign-key indexes with query plans and real workload evidence. Verify Preview/Development environment isolation, perform backup/restore rehearsal, and complete user acceptance before any Production release.

## Current disposition

The baseline build is green, but BuildFlow is not yet release-ready. The largest confirmed security gap is broad organisation-member CRUD without role permissions. Document Storage, client portal authentication, several operational workflows, and all four requested integrations are not complete. Keep PR #1 in Draft and do not merge or deploy Production until every applicable exit criterion is evidenced.
