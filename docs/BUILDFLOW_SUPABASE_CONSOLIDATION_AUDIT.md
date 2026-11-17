# BuildFlow Supabase Consolidation Audit

**Audit date:** 17 November 2026  
**Repository:** `ae-mak-gif/construction-os`  
**Branch:** `fix/auth-client-access-stabilisation`  
**Decision under implementation:** Promote the existing Development Supabase project to the authoritative BuildFlow backend, displayed as **BuildFlow Main**. The Supabase project reference, API URL, database host, application code identifiers and Vercel project name are not to be changed as part of a display-name change.

> **Status: PARTIAL — Production comparison blocked by database connection timeouts.** The Development project has been renamed in the Dashboard to **BuildFlow Main** (display name only). Two Development-only security migrations have been applied and verified. The latest CI run passed dependency security, lint, type-check and production build. No Production cutover, data transfer, pause or deletion has been performed.

## 1. Project identity

| Role | Supabase project name | Project ref | Region | Project-list status |
|---|---|---|---|---|
| BuildFlow Main | `BuildFlow Main` | `amqknbijdjpcapwkeyyh` | `eu-west-2` | ACTIVE_HEALTHY |
| Existing BuildFlow Production candidate | `BuildFlow` | `mlvafrbwaybuehlzcniy` | `eu-west-2` | ACTIVE_HEALTHY |

The Development project is the stronger candidate based on the available schema, migration, integration and VEA evidence. The older project must not be retired until its database can be inspected and its unique data/configuration reconciled.

## 2. Development project inventory

Read-only inspection of `amqknbijdjpcapwkeyyh` returned:

- 57 public base tables; all 57 have RLS enabled.
- 221 public RLS policies.
- 30 public-schema functions.
- 6 Supabase Auth users.
- 1 organisation, 5 organisation memberships and 6 profiles.
- 7 projects in the database (these include the synthetic pilot/UAT records).
- One private Storage bucket named `project-documents`, with a 25 MiB file-size limit and document-oriented MIME allowlist.
- 0 Storage objects and 0 project-document register rows at the time of inspection.
- 0 rows in `organization_integrations` at the time of inspection.
- 4 active Edge Functions: `vea-context` v4, `vea-chat` v13, `integration-manager` v1 and `google-oauth` v2.
- 60 recorded database migrations, latest `20261117105154_make_integration_permission_wrapper_invoker` (Development-only security-definer reduction).

The project contains the CRM, project delivery, programme, BOQ, procurement, inventory, finance, HR, equipment, workshop, risk, quality, safety, communications, client-portal and VEA foundations. Table existence and seed counts are not proof of complete browser workflows or release acceptance.

## 3. Development security and performance findings

Supabase Security Advisor returned these findings:

1. **Resolved: RLS disabled on `private.organization_integration_secrets`.** Reviewed the table grants and all three dependent RPCs (`integration_secret_store`, `integration_secret_read`, `integration_secret_delete`). The table has no direct grants to `anon`, `authenticated` or `service_role`; the three `SECURITY DEFINER` RPCs are owned by `postgres` and explicitly require `request.jwt.claim.role = service_role`. Applied `ENABLE ROW LEVEL SECURITY` without `FORCE ROW LEVEL SECURITY`, preserving the owner-context access used by those RPCs. Post-change SQL verified `rls_enabled=true`, `force_rls=false`, and zero direct application-role grants. Supabase Advisor now reports this as an informational RLS-enabled/no-policy finding, not an RLS-disabled exposure. Migration: `supabase/migrations/20261117104131_secure_organization_integration_secrets.sql`. Enabling RLS without the intended policies could break integration secret access.
2. **Resolved: `public.user_can_manage_integrations(uuid)` was unnecessarily SECURITY DEFINER.** It is now SECURITY INVOKER; it still delegates to the private SECURITY DEFINER permission-check helper, which checks the caller's `auth.uid()`, active organisation membership and assigned role permission. `authenticated` retains EXECUTE; `anon` does not. Its permission key remains `organization.manage_members` pending confirmation that this is the intended integration-administration capability.
3. **Info: `private.google_oauth_states` has RLS enabled but no policies.** Its grants are restricted to `postgres` and `service_role`, with no direct `anon` or `authenticated` grants. This is consistent with a service-role-only state store; retain no client-facing policies unless a documented access requirement emerges.
4. **Warning: leaked-password protection is disabled.** Enable through Auth settings after confirming the intended password policy and then verify.

Performance Advisor reported 35 unindexed foreign keys and numerous unused indexes. These require workload/query-plan review; do not bulk-create or delete indexes based only on advisor counts.

## 4. Existing Production project inspection

The project listing and project metadata endpoint identify `mlvafrbwaybuehlzcniy` as ACTIVE_HEALTHY. A separate advisor call reported that the project was hibernated and would wake on a supported request; subsequent database requests continued to time out.

- Migration inventory: unavailable due to connection timeout.
- Table inventory: unavailable due to connection timeout.
- Read-only SQL inventory: unavailable due to connection timeout.
- Edge Function listing returned an empty list. This is not sufficient evidence that the project has no deployed functions because database/service inspection was not fully available.

**This is the principal audit blocker.** Do not infer that the older Production project is empty, obsolete or safe to pause/delete. Retry database inspection after the Supabase project is responsive, or inspect it directly in the Supabase Dashboard.

## 5. Vercel environment separation

Read-only inspection of Vercel project `construction-os` (project ID `prj_hxJCO7ol6qZAb0ibVcaYg7lOCB86`) found:

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` have branch-scoped Preview entries for `fix/auth-client-access-stabilisation`, `fix/auth-profile-schema-alignment` and `feature/buildflow-vea-integration`.
- Separate Production-target entries exist for both variables.
- Environment values were not decrypted or displayed.
- The current Preview configuration is documented as Development-only; Production entries are separately scoped.

Before cutover, verify the effective deployment values without exposing secrets and confirm that the Production deployment continues to target the intended project until the approved cutover.

## 6. Git and migration source of truth

The active implementation branch is `fix/auth-client-access-stabilisation`. The consolidation audit and the RLS remediation migration have been committed to this branch; see its current head for the latest SHA.

The repository contains the initial numbered SQL migrations and timestamped follow-up migrations. The Development project has 60 migration ledger entries. Both new security migration filenames match the versions recorded by Supabase: `20261117104131_secure_organization_integration_secrets.sql` and `20261117105154_make_integration_permission_wrapper_invoker.sql`. A migration-by-migration filename, checksum, dependency and execution-state reconciliation is still required before any migration is replayed or applied elsewhere.

The existing roadmap explicitly warns against blindly replaying historical migrations against a live database. Preserve that rule.

## 7. Transition checklist (eight work areas)

| # | Work area | Status | Acceptance evidence required |
|---|---|---|---|
| 1 | Database schema and migration reconciliation | In progress | Full side-by-side schema, migration ledger and drift report |
| 2 | Authentication and multi-tenancy | Partial | User/identity comparison, organisation membership and role mapping; tenant-isolation tests |
| 3 | RLS, grants, functions and security | In progress | Integration-secret RLS remediated; permission wrapper changed to invoker; confirm permission semantics and enable leaked-password protection |
| 4 | Storage and documents | Partial | Bucket/policy comparison, object inventory and verified transfer if needed |
| 5 | Edge Functions and secrets | Partial | Function source/version comparison, environment secret inventory and redeployment plan |
| 6 | External integrations and OAuth | Partial | Provider configuration, OAuth redirect URIs, webhook destinations and credential re-provisioning |
| 7 | Vercel/application cutover and acceptance | Not started | Effective environment verification, Preview/UAT, approved Production cutover and rollback |
| 8 | Legacy project retirement and InsurAssist capacity | Not started | Verified backup/export, data reconciliation, pause legacy project, confirm capacity before deletion |

## 8. Naming and compatibility

The Supabase Dashboard display name has been changed to **BuildFlow Main**. This is distinct from the project ref and API endpoint. Keep `amqknbijdjpcapwkeyyh` and `https://amqknbijdjpcapwkeyyh.supabase.co` unchanged; do not rename code folders, environment variable keys, Vercel project identifiers, OAuth callback paths or GitHub repository identifiers for this display-name distinction.

The user completed the display-name change directly in Supabase Dashboard; a fresh project metadata read confirms the name is `BuildFlow Main`.

## 9. Safety gates

- Keep both Supabase projects intact until the comparison and backup/recovery checks pass.
- Do not pause or delete the existing Production project during this audit.
- Do not alter Production schema, data, Auth, Storage, Edge Functions or environment variables until a separate cutover approval is recorded.
- Keep integration-secret access restricted to the existing service-role-guarded RPCs; do not grant direct table access to application roles.
- Do not copy synthetic UAT data into a live customer dataset.
- Keep BuildFlow Main's project ref stable so the display-name change does not alter application connectivity.

**Next action:** Resolve the older Production project's database connection timeout and complete the side-by-side database, Auth, Storage and function inventory. Confirm whether `organization.manage_members` is the intended permission for integration administration, and enable leaked-password protection in BuildFlow Main Auth settings. Then produce the exact data/configuration transfer manifest and cutover plan.