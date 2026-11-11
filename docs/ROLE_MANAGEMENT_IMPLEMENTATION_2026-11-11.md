# BuildFlow role administration implementation — 11 November 2026

This note supplements `docs/RBAC_IMPLEMENTATION_PROGRESS_2026-11-11.md`.

## Added after the initial RBAC foundation

- Added `public.security_audit_events`, with tenant-scoped SELECT access for users with `audit.view`; authenticated clients cannot insert, update or delete audit events.
- Added role-management RPCs. Privileged implementation functions live in the non-exposed `private` schema as SECURITY DEFINER functions with an empty search_path. Public API wrappers are SECURITY INVOKER and only callable by authenticated users.
- Role creation and permission changes require `organization.manage_roles`.
- System Admin/Administrator/Owner roles and the current user's own role are protected from modification through the management interface.
- Role creation and permission changes write security audit events.
- The Settings workspace calls the public SECURITY INVOKER Supabase RPC wrappers directly with the authenticated Supabase client. Database functions enforce active membership and `organization.manage_roles`; no extra Vercel proxy or service-role credential is needed.
- Added an Organisation Roles & Permissions workspace within Settings. It can list permissions, create custom roles and toggle permissions for eligible roles. The interface disables changes to protected roles.
- No service-role key is used in the browser; privileged implementation functions remain in the private schema.

## Verification

- Simulated authenticated Admin session successfully loaded the 81-permission catalogue.
- Transactional RPC test created a temporary role, granted a permission and verified the corresponding audit event; transaction rolled back.
- Transactional unprivileged-role test confirmed the role-management RPC rejects access without `organization.manage_roles`; transaction rolled back.
- Supabase Security Advisor no longer reports the role-management SECURITY DEFINER functions in the exposed public schema. The remaining warning is leaked-password protection disabled.
- Vercel Development Preview for the current feature branch has reached READY and its Vercel status check passed.

## Still required

- Authenticated browser test of the Settings role-management UI and RPCs.
- Add membership-role assignment with safeguards against self-escalation and last-admin lockout.
- Complete project-level scope and separate client identities from internal organisation membership.
- Complete field-level approval protections, cross-tenant tests and end-to-end tests.
- Keep Production untouched until all release gates pass.
