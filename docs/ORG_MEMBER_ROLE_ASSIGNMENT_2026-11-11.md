# Organisation member role assignment — 11 November 2026

Development-only implementation.

- Added `private.get_org_members(uuid)` and `private.assign_org_member_role(uuid,uuid,uuid)` as SECURITY DEFINER implementations in the non-exposed private schema.
- Added public SECURITY INVOKER wrappers callable by authenticated users.
- Member listing requires `organization.manage_members`.
- Role assignment requires `organization.manage_members`; assigning a system Admin/Administrator/Owner role additionally requires `organization.manage_roles`.
- The caller cannot change their own role.
- A final active Admin/Administrator/Owner cannot be demoted.
- The selected role must belong to the same organisation as the target member.
- Every role assignment writes a `security_audit_events` record with old and new role names.
- Settings now includes a team role assignment list and selector. The current user's own role is disabled in the interface.
- Development-only test confirmed member listing works for Admin and self-role assignment is rejected. The test transaction was rolled back.
- Last-admin demotion needs an authenticated multi-admin test before release.
