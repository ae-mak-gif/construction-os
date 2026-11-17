# BuildFlow Supabase Consolidation Audit

**Audit date:** 17 November 2026  
**Repository:** `ae-mak-gif/construction-os`  
**Branch:** `fix/auth-client-access-stabilisation`  
**Decision under implementation:** Promote the existing Development Supabase project to the authoritative BuildFlow backend, displayed as **BuildFlow Main**. The Supabase project reference, API URL, database host, application code identifiers and Vercel project name are not to be changed as part of a display-name change.

> **Status: PARTIAL — Production comparison blocked by database connection timeouts.** No database, authentication, Storage, Edge Function, Vercel environment, project-name, pause, deletion or Production changes were made during this audit checkpoint.

## 1. Project identity

| Role | Supabase project name | Project ref | Region | Project-list status |
|---|---|---|---|---|
| Proposed BuildFlow Main | `buildflow-dev` | `amqknbijdjpcapwkeyyh` | `eu-west-2` | ACTIVE_HEALTHY |
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
- 58 recorded database migrations, latest `20261116110659_google_oauth_state_service_rpcs`.

The project contains the CRM, project delivery, programme, BOQ, procurement, inventory, finance, HR, equipment, workshop, risk, quality, safety, communications, client-portal and VEA foundations. Table existence and seed counts are not proof of complete browser workflows or release acceptance.

## 3. Development security and performance findings

Supabase Security Advisor returned these findings:

1. **Critical: RLS disabled on `private.organization_integration_secrets`.** The table currently has 0 rows, but the security configuration is not acceptable. The advisor supplied an `ENABLE ROW LEVEL SECURITY` remediation; it has deliberately not been applied because the correct service-only access model and required policies must be reviewed first. Enabling RLS without the intended policies could break integration secret access.
2. **Warning: `public.user_can_manage_integrations(uuid)` is SECURITY DEFINER and executable by authenticated users.** Inspect the function body, grants and caller requirements before changing it. Do not blindly revoke access.
3. **Info: `private.google_oauth_states` has RLS enabled but no policies.** Verify that it is intentionally service-role-only and that no client access is expected.
4. **Warning: leaked-password protection is disabled.** Enable through Auth settings after confirming the intended password policy and then verify.

Performance Advisor reported 35 unindexed foreign keys and numerous unused indexes. These require workload/query-plan review; do not bulk-create or delete indexes based only on advisor counts.

## 4. Existing Production project inspection

The project listing and project metadata endpoint identify `mlvafrbwaybuehlzcniy` as ACTIVE_HEALTHY. However, database operations repeatedly failed with connection timeouts and a hibernation response.

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

The active implementation branch is `fix/auth-client-access-stabilisation`, currently at commit `39ccfb6f3464a23fd53c6e3e367bebe4ce62144d`.

The repository contains the initial numbered SQL migrations and timestamped follow-up migrations. The Development project has 58 migration ledger entries. A migration-by-migration filename, checksum, dependency and execution-state reconciliation is still required before any migration is replayed or applied elsewhere.

The existing roadmap explicitly warns against blindly replaying historical migrations against a live database. Preserve that rule.

## 7. Transition checklist (eight work areas)

| # | Work area | Status | Acceptance evidence required |
|---|---|---|---|
| 1 | Database schema and migration reconciliation | In progress | Full side-by-side schema, migration ledger and drift report |
| 2 | Authentication and multi-tenancy | Partial | User/identity comparison, organisation membership and role mapping; tenant-isolation tests |
| 3 | RLS, grants, functions and security | Blocked on remediation review | RLS policy/grant matrix, SECURITY DEFINER review, leaked-password protection |
| 4 | Storage and documents | Partial | Bucket/policy comparison, object inventory and verified transfer if needed |
| 5 | Edge Functions and secrets | Partial | Function source/version comparison, environment secret inventory and redeployment plan |
| 6 | External integrations and OAuth | Partial | Provider configuration, OAuth redirect URIs, webhook destinations and credential re-provisioning |
| 7 | Vercel/application cutover and acceptance | Not started | Effective environment verification, Preview/UAT, approved Production cutover and rollback |
| 8 | Legacy project retirement and InsurAssist capacity | Not started | Verified backup/export, data reconciliation, pause legacy project, confirm capacity before deletion |

## 8. Naming and compatibility

The intended Supabase Dashboard display name is **BuildFlow Main**. A project display-name change is distinct from its project ref and API endpoint. Keep `amqknbijdjpcapwkeyyh` and `https://amqknbijdjpcapwkeyyh.supabase.co` unchanged; do not rename code folders, environment variable keys, Vercel project identifiers, OAuth callback paths or GitHub repository identifiers for this display-name distinction.

The connected Supabase operations available in this workspace expose project listing and metadata but do not expose a project-rename operation. Therefore the Dashboard display-name change remains pending and must be performed in Supabase Dashboard project settings. No rename was attempted through an unsupported operation.

## 9. Safety gates

- Keep both Supabase projects intact until the comparison and backup/recovery checks pass.
- Do not pause or delete the existing Production project during this audit.
- Do not alter Production schema, data, Auth, Storage, Edge Functions or environment variables until a separate cutover approval is recorded.
- Do not blindly enable RLS on the integration-secret table without reviewing its access model and adding correct policies/grants.
- Do not copy synthetic UAT data into a live customer dataset.
- Keep BuildFlow Main's project ref stable so the display-name change does not alter application connectivity.

**Next action:** Restore/read the older Production project's database access, complete the side-by-side inventory, then produce the exact data/configuration transfer manifest and cutover plan.