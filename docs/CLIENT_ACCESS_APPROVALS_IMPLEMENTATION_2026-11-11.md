# BuildFlow Client Access, Project Membership and Approval Controls
Date: 11 November 2026
Target: Development only
Branch: fix/auth-profile-schema-alignment

## Implemented

### Project membership
- Existing project_members.user_id and staff_id fields are used; no duplicate membership table was introduced.
- private.can_access_project(uuid) restricts assigned projects to assigned users and users with project_members.manage.
- Restrictive project_scope_guard policies cover projects and all existing project_id-linked operational tables.
- Project membership assignments are unique per project/user and per project/staff.
- A private trigger validates that assigned users are active members of the same organisation and assigned staff belong to the same organisation and are active.
- Settings now includes a Project Access management interface, permission-gated by project_members.manage.
- The interface uses public.get_project_access_admin_data(uuid), a SECURITY INVOKER wrapper over a private SECURITY DEFINER function. The private function checks project_members.manage and returns only same-tenant project names, active member display names and assignments.

### External client identity and project sharing
- public.client_portal_access maps auth.users identities to a client record. It does not create organization_members records.
- public.client_project_shares grants explicit per-project access and stores visibility flags for progress, updates, documents and financials.
- RLS allows organisation-authorised staff to manage access/shares and clients to read only their own active access record.
- Direct client SELECT on public.projects is not allowed. A safe projection is exposed through public.get_client_portal_projects(), returning only share-authorised fields and redacting progress/contract value when those flags are false.
- The projection requires active client access, active client status, active share and a project whose client_id matches the share.
- Client access does not yet include underlying document, invoice, update, message or approval records. Those require separately scoped projections and Storage policies.

### Approval safeguards
- Trigger guards require variations.approve to approve/reject variations or change decision fields.
- Trigger guards require procurement.approve to approve purchase orders and restrict post-approval status changes.
- Trigger guards require approvals.approve for approval decisions; approver identity and response timestamp are server-set.
- Completed approval decisions and finalised variation decision fields cannot be edited.

## Development migrations applied
- 20261111115130_project_level_access_scope
- 20261111115802_client_portal_identity_and_shares
- 20261111115851_client_project_scope_guard_alignment
- 20261111115946_enforce_approval_status_transitions
- 20261111120054_client_portal_safe_project_projection
- 20261111120203_enforce_project_member_tenant_identity
- 20261111120426_project_access_admin_directory

Migration files are committed to this branch. No Production database migration was applied.

## Tests run
- Project assigned-user allow / unassigned-user deny / unassigned-project compatibility: passed.
- Approval transition rejects unauthorised project approval and variation approval: passed.
- Authorised approver identity and timestamp are enforced: passed.
- Client safe projection returns explicitly shared project and redacts progress and contract value when disabled: passed.
- Active same-organisation user project assignment succeeds; duplicate assignment rejected: passed.
- Project access directory allows a permissioned project manager and rejects an unauthorised user: passed.
- Test records were created in transactions and rolled back.

## Outstanding
- Multi-user authenticated browser testing with separate internal and client accounts.
- Client invitation/onboarding flow (requires a secure server-side Auth Admin invitation path; no service-role key in browser).
- Client document, update and invoice projections and Storage object policies.
- Additional purchase order and finance workflow tests, including payment reversal/receipt approvals.
- Build and browser verification of the Settings Project Access UI.
- Vercel preview redeployment currently blocked by the Vercel API free-per-day deployment limit (402; retry after 24 hours). Existing preview deployment is older and does not include the latest Settings UI commit.
- Supabase Security Advisor continues to report leaked-password protection disabled.

## Safety boundary
All work is on the Development Supabase project and the BuildFlow development branch. No Production schema, data, environment variables, deployments, or application source were intentionally changed. PRs remain draft and unmerged.
