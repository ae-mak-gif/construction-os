# BuildFlow security remediation log

Date: 11 November 2026  
Scope: feature branch `fix/auth-profile-schema-alignment`, isolated Supabase project `buildflow-dev`, and branch-scoped Vercel Preview configuration.

## Completed in this work session

- Confirmed the dedicated `buildflow-dev` Supabase project is `ACTIVE_HEALTHY`; Production project `BuildFlow` remains separate and untouched.
- Confirmed all 38 application tables in the Development `public` schema have RLS enabled.
- Applied Development migration `20261111072421_secure_message_notification_scope`.
- Notifications are now recipient-scoped. Authenticated users can insert only for themselves and update only `is_read` / `read_at`; client-side deletion is revoked.
- Messages are now readable only by sender or recipient. Inserts must identify the authenticated sender and any specified recipient must be an active member of the same organisation. Client-side update/delete is revoked until a safe draft/delivery lifecycle exists.
- Verified the Development `set_updated_at` trigger helper has a fixed `search_path`; its security advisor warning is absent in Development.
- Set the two branch-specific Vercel Preview Supabase variables to the Development project URL and its publishable key.
- Changed the shared Supabase URL and publishable-key entries to target Production only. Other Preview branches now fail closed until they receive their own dedicated backend configuration. Existing already-built Preview deployments must be rebuilt before testing.

## Outstanding security gates

1. Supabase Auth leaked-password protection is still disabled in Development and Production. Enable it in Supabase Auth password/security settings; no Auth configuration-management action is exposed in the connected tooling.
2. The current generic organisation-member policies still grant broad CRUD to active members for most business tables. A role/permission catalogue and permission-aware RLS are not yet implemented.
3. Project-level membership, document visibility, client identity/portal access, and storage object policies remain incomplete. Development currently has no Storage buckets.
4. Cross-tenant, cross-user, role-escalation and client-portal adversarial tests still need dedicated test identities. No production interactive tests were run.
5. Production's security advisor still reports a mutable search_path on `public.set_updated_at` and leaked-password protection disabled. These findings are recorded only; Production was not changed.
6. The full Development schema/constraint/index/function/policy baseline still needs comparison with the repository migrations. Migration history on Production remains untouched.

## Release rule

Do not merge the PR or promote a Production deployment until the outstanding gates above are resolved, Development tests pass, and the user accepts the role/permission model.
