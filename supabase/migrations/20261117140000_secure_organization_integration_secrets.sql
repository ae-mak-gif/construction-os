-- BuildFlow Main: protect the private integration-secret reference table.
-- Access remains through the existing SECURITY DEFINER RPCs owned by postgres.
-- Those RPCs explicitly require request.jwt.claim.role = service_role.
-- Do not FORCE ROW LEVEL SECURITY: the functions rely on the postgres owner context.
ALTER TABLE private.organization_integration_secrets
  ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE private.organization_integration_secrets IS
  'Private references to Vault-managed organisation integration credentials. Access only through service-role-guarded SECURITY DEFINER RPCs.';
