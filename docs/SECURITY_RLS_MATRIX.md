# BuildFlow RLS and authorisation matrix

Status: design and audit baseline, 10 November 2026  
Scope: current Supabase project `mlvafrbwaybuehlzcniy`

This document records the access-control model that must be implemented and tested before BuildFlow is treated as production-ready. It is not a migration and makes no database changes.

## Authorisation layers

1. **Authentication:** a valid Supabase Auth identity.
2. **Tenant membership:** an active `organization_members` row for the organisation owning the resource.
3. **Role permissions:** an explicit permission set attached to the member's role. Organisation membership alone must not imply full CRUD.
4. **Resource scope:** project membership, client ownership, document visibility, recipient identity or other resource-specific constraints.
5. **Trusted operations:** onboarding, role assignment and organisation administration must use a narrowly scoped trusted path, not a client-side bypass.

Never use user-editable `user_metadata` as an authorisation source. If permissions are placed in JWT claims, use trusted `app_metadata` and account for token refresh. Prefer database-backed membership and permission checks for immediate revocation.

## Target policy matrix

| Resource | Read | Create | Update | Delete |
|---|---|---|---|---|
| organisations | active members of same tenant | trusted provisioning only | organisation admins / trusted path | trusted platform operation only |
| organization_members | self and authorised tenant admins | trusted invitation/acceptance flow | self-limited profile/status or tenant admin | tenant admin / trusted path |
| roles and role_permissions | tenant members; permission details as appropriate | tenant admins | tenant admins | tenant admins; prevent deleting assigned/system roles |
| profiles | self; limited public profile fields for authorised collaborators | self-provisioned or trusted | self for safe fields; admins for managed fields | trusted lifecycle only |
| clients and enquiries | authorised tenant CRM users | CRM create permission | CRM update permission | privileged archive/delete permission |
| projects | project members and authorised tenant roles | project-create permission | project managers and permitted roles | privileged archive/delete permission |
| project_members | self and project managers/admins | project managers/admins | project managers/admins | project managers/admins |
| tasks, BOQ, estimates | project members with relevant module permission | relevant create permission | relevant edit/approve permission | privileged permission; retain audit trail |
| suppliers, procurement, inventory | authorised tenant users; project scope where applicable | module-specific permission | module-specific permission | privileged permission; preserve stock/audit history |
| invoices, payments, expenses | finance roles and explicitly authorised managers | finance create permission | finance edit/approve permission | no hard delete for posted financial records; reversal workflow |
| notifications | recipient only; trusted sender may insert | trusted server path or sender identity validation | recipient read-state fields only | recipient dismissal or trusted retention process |
| messages | sender, recipient and authorised conversation participants | sender identity must equal auth identity | sender before delivery; recipient limited read-state | retention/moderation workflow |
| project_documents | project members allowed by document visibility; client access only when explicitly shared | authorised uploader | uploader/project manager with version history | privileged archive; no silent deletion |
| risks, quality, inspections | project members with relevant permission | relevant module permission | assigned owner / quality manager | privileged archive |
| client portal | verified client identity and only explicitly linked projects | client submissions within allowed workflow | own submissions and allowed approvals | no unrestricted delete |
| audit/activity records | tenant admins/auditors and permitted subject users | server-generated | immutable | retention policy only |

## Immediate high-priority policy fixes

### 1. Notifications
Current finding: notifications are organisation-membership scoped even though each row carries a recipient `user_id`.

Required:
- SELECT must require `user_id = (select auth.uid())` (plus tenant check if needed).
- UPDATE must restrict both `USING` and `WITH CHECK` to the recipient, and only permit recipient-controlled fields such as read/dismissed state.
- INSERT must validate the sender or be performed by a trusted server-side function. Do not let any tenant member create notifications as another user.
- DELETE should be disabled for normal users unless a recipient-specific soft-delete model is designed.

### 2. Messages
Required:
- SELECT only for sender, recipient or explicit conversation participants.
- INSERT must enforce `sender_id = auth.uid()`.
- UPDATE cannot change sender, recipient, organisation or message content after delivery except through a controlled edit policy.
- Read receipts must be recipient-specific.
- Never expose every organisation message to every tenant member by default.

### 3. Documents and client portal
Required:
- Private Storage bucket(s), not public buckets, for project documents.
- Storage object paths must encode tenant/project scope and be validated against database membership.
- Document metadata SELECT must match the same scope as object download.
- Client access requires an explicit client-user ↔ client ↔ project relationship and a document visibility/share state.
- Use short-lived signed URLs after authorisation; test URL expiry and revocation expectations.
- A client must never inherit internal organisation-member privileges.

### 4. Role permissions
The current `roles` table only stores role names/descriptions and does not itself enforce permissions.
Implement an explicit permission catalogue and role-permission mapping. Suggested permission keys:
- `crm.read/create/update/archive`
- `projects.read/create/update/archive/manage_members`
- `tasks.read/create/update/assign/complete`
- `boq.read/create/update/approve`
- `procurement.read/create/approve`
- `inventory.read/receive/issue/adjust`
- `finance.read/create/update/approve/reconcile`
- `quality.read/create/update/close`
- `documents.read/upload/share/archive`
- `reports.read/export`
- `users.read/invite/manage_roles`
- `settings.manage`

Define default roles only after the user-visible business rules are agreed. Enforce permission checks in RLS or narrowly scoped database functions, not only by hiding UI controls.

## Security test plan

Run tests as at least two users in two different organisations, plus an internal user and a client identity.

1. Tenant A cannot SELECT, INSERT, UPDATE or DELETE Tenant B records.
2. Inactive or revoked members immediately lose access on the next authorised request.
3. A read-only role cannot write even if it calls the Supabase API directly.
4. A project member cannot access an unrelated project in the same organisation unless a tenant-wide permission explicitly grants it.
5. User A cannot read or mutate User B notifications.
6. A message participant can read the conversation; unrelated tenant members cannot.
7. A client can access only explicitly shared documents and projects.
8. A client cannot query internal CRM, finance, staff or procurement tables.
9. Users cannot assign themselves elevated roles or change their organisation_id.
10. UPDATE policies include both `USING` and `WITH CHECK` where row ownership/scope can change.
11. No browser bundle contains a service-role key or privileged integration secret.
12. Storage object access is denied even when a user guesses another tenant's object path.
13. Financial records cannot be hard-deleted after posting; reversals remain auditable.
14. A security-definer function has a fixed safe search_path, explicit caller checks and restricted EXECUTE grants.

## Implementation sequence

1. Complete live schema/policy export and compare definitions against migrations 001-010.
2. Agree the permission catalogue and role model.
3. Implement and test notification and message scoping.
4. Implement project/document/client portal scoping and private Storage.
5. Implement role permission enforcement.
6. Run cross-tenant and privilege-escalation tests against isolated Development only.
7. Review Supabase security advisor; fix mutable search_path and enable leaked-password protection.
8. Promote via reviewed migrations only after Development acceptance.

## Explicit non-actions

- No policies were changed in Production.
- No migration was applied to Production.
- No role was granted new privileges.
- No client portal was enabled for real clients.
