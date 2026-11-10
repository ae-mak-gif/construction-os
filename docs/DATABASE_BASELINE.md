# Live Supabase baseline and reconciliation notes

Assessment date: 10 November 2026
Project: BuildFlow (Supabase project ref mlvafrbwaybuehlzcniy, London region)
Method: read-only metadata and catalog queries; no DDL or data mutations were performed.

## Current live foundation
- 39 base tables in the public schema.
- Row-level security is enabled across all 39 public tables.
- 146 public-schema RLS policies are present.
- Migration ledger is empty (Supabase migration listing returned no applied migrations).
- The 39 table names declared across migrations 001-010 match the 39 live public base-table names. This confirms table-name parity only; it does not yet prove column, constraint, index, trigger, function or policy equivalence.
- Storage buckets: 0; Edge Functions: 0.
- Current operational data is effectively empty: one organisation, one organisation membership, one profile and one auth user; zero projects and zero clients.

## Existing migration files in GitHub
1. supabase/migrations/001_core.sql
2. supabase/migrations/002_crm.sql
3. supabase/migrations/003_projects.sql
4. supabase/migrations/004_estimates_boq.sql
5. supabase/migrations/005_procurement.sql
6. supabase/migrations/006_inventory.sql
7. supabase/migrations/007_finance.sql
8. supabase/migrations/008_managament.sql (filename spelling retained as committed)
9. supabase/migrations/009_communications.sql
10. supabase/migrations/010_rls.sql

The development notes refer to 011_seed_demo.sql, but that file is not present in the repository. The live schema and checked-in SQL must be compared statement-by-statement before any attempt to reconcile migration history.

## Authentication and tenant findings
- The live profiles table uses id, first_name, last_name, display_name, phone and avatar_url; it has no full_name column. The UI query mismatch is corrected on the feature branch.
- organization_members has a non-null status field; the only current membership is active.
- The frontend now filters to active memberships and fails closed if there are none or more than one. The database supports multiple membership rows per user; explicit organisation selection is required before enabling multi-organisation accounts. Do not select an arbitrary first membership.
- private.is_active_org_member(uuid) checks auth.uid() and status='active'. It is SECURITY DEFINER with an empty search_path and an explicit auth.uid() predicate; retain careful review of ownership and EXECUTE grants because it bypasses ordinary RLS execution context.
- Operational RLS policies largely apply the same active-organisation-member predicate for SELECT/INSERT/UPDATE/DELETE. This is tenant isolation, not role-based authorisation.
- The roles table currently contains only id, organization_id, name, description and timestamps. There is no permission matrix or permission column, and role-specific CRUD enforcement is not present.
- organizations, organization_members and roles are select-only for ordinary authenticated members; onboarding and membership administration need a deliberate trusted provisioning/admin path.

## Sensitive-data policy gaps to resolve before production
- notifications policies are organisation-membership scoped, although each notification has a user_id recipient. A member of the organisation can therefore potentially read or mutate another member's notifications. Policies should be recipient-scoped, with a separately controlled insert path.
- messages and project_documents are currently protected at broad organisation-member scope. Before client portal access, add explicit sender/recipient, client identity, project membership and document visibility rules as appropriate.
- The client portal is currently mock-data UI; it must not be exposed as a real client surface until client identities and project-level permissions are designed and tested.
- Vercel currently has VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY configured for both Production and Preview in the same environment-variable entries. This means Preview is not independently isolated from Production. Keep preview login/data testing blocked until a separate Development Supabase project is provisioned and Preview variables are split.

## Advisor findings (10 November 2026)
- Security: public.set_updated_at has a mutable search_path warning. Set an explicit safe search_path in a reviewed migration.
- Security: Supabase leaked-password protection is disabled. Enable it in Auth settings before production onboarding.
- Performance: 31 foreign keys lack covering indexes. Review based on expected query patterns and add only justified indexes.
- Performance: 127 indexes are currently reported unused. This database has almost no business workload, so usage counters are not a sound basis for deleting them. Do not drop them as cleanup.

## Reconciliation plan
1. Take a fresh schema snapshot from the live project, including columns, defaults, constraints, indexes, triggers, functions, grants and RLS policies.
2. Compare that snapshot to migrations 001-010, including object definitions and order of dependencies.
3. Identify any live-only objects, missing migration objects and drift in definitions.
4. Provision a disposable non-production Supabase project and replay a corrected, versioned migration chain there.
5. Validate schema equivalence and RLS tests in the disposable project.
6. Only then establish an accurate baseline for the existing live project. Do not replay the current SQL files against production and do not fake migration history.

## Production gate
Do not connect live operational screens, client portal users, document storage or external automation to the current production Supabase project until the sensitive-data policy gaps, environment isolation and migration baseline are resolved.