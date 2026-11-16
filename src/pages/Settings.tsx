import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { IntegrationConnections } from '@/components/settings/IntegrationConnections';
import { Plus } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

type PermissionItem = { key: string; module: string; description: string };
type OrganisationRole = { id: string; name: string; description: string | null; is_system: boolean; permissions: Record<string, boolean> };
type OrganisationMember = { id: string; user_id: string; role_id: string; role_name: string; status: string; display_name: string };

function RoleManagement() {
  const { session, membership } = useAuth();
  const [roles, setRoles] = useState<OrganisationRole[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [members, setMembers] = useState<OrganisationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');

  const send = useCallback(async (payload: Record<string, unknown>) => {
    if (!session?.user?.id || !membership?.organization_id) throw new Error('Your active organisation session is unavailable.');
    const organizationId = membership.organization_id;

    if (payload.action === 'list') {
      const { data, error: rpcError } = await supabase.rpc('get_org_roles_permissions', {
        target_organization_id: organizationId,
      });
      if (rpcError) throw new Error(rpcError.message || 'Role permissions could not be loaded.');
      return data;
    }

    if (payload.action === 'list_members') {
      const { data, error: rpcError } = await supabase.rpc('get_org_members', {
        target_organization_id: organizationId,
      });
      if (rpcError) throw new Error(rpcError.message || 'Organisation members could not be loaded.');
      return data;
    }

    if (payload.action === 'assign_member_role') {
      const { data, error: rpcError } = await supabase.rpc('assign_org_member_role', {
        target_organization_id: organizationId,
        target_member_id: String(payload.member_id ?? ''),
        target_role_id: String(payload.role_id ?? ''),
      });
      if (rpcError) throw new Error(rpcError.message || 'Member role could not be updated.');
      return { updated: data === true };
    }

    if (payload.action === 'create') {
      const { data, error: rpcError } = await supabase.rpc('create_org_role', {
        target_organization_id: organizationId,
        target_name: String(payload.name ?? ''),
        target_description: String(payload.description ?? '') || null,
      });
      if (rpcError) throw new Error(rpcError.message || 'Role could not be created.');
      return { role_id: data };
    }

    if (payload.action === 'set_permission') {
      const { data, error: rpcError } = await supabase.rpc('set_org_role_permission', {
        target_organization_id: organizationId,
        target_role_id: String(payload.role_id ?? ''),
        target_permission_key: String(payload.permission_key ?? ''),
        target_allowed: payload.allowed === true,
      });
      if (rpcError) throw new Error(rpcError.message || 'Permission could not be updated.');
      return { updated: data === true };
    }

    throw new Error('Unknown role management action.');
  }, [session?.user?.id, membership?.organization_id]);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await send({ action: 'list' });
      setRoles(data.roles || []);
      setPermissions(data.permissions || []);
      const memberData = await send({ action: 'list_members' });
      setMembers(memberData || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Role permissions could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [send]);

  useEffect(() => {
    if (session?.access_token && membership?.organization_id) void loadRoles();
    else setLoading(false);
  }, [loadRoles, session?.access_token, membership?.organization_id]);

  async function changeMemberRole(member: OrganisationMember, roleId: string) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await send({ action: 'assign_member_role', member_id: member.id, role_id: roleId });
      const nextRole = roles.find((role) => role.id === roleId);
      setMembers((current) => current.map((item) => item.id === member.id
        ? { ...item, role_id: roleId, role_name: nextRole?.name || item.role_name }
        : item));
      setNotice('Updated organisation role for ' + member.display_name + '.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Member role could not be updated.');
      await loadRoles();
    } finally {
      setBusy(false);
    }
  }

  async function createRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await send({ action: 'create', name: roleName, description: roleDescription });
      setRoleName('');
      setRoleDescription('');
      setNotice('Role created. Assign its permissions below.');
      await loadRoles();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Role could not be created.');
    } finally {
      setBusy(false);
    }
  }

  async function changePermission(role: OrganisationRole, permission: PermissionItem, allowed: boolean) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await send({ action: 'set_permission', role_id: role.id, permission_key: permission.key, allowed });
      setRoles((current) => current.map((item) => item.id === role.id
        ? { ...item, permissions: { ...item.permissions, [permission.key]: allowed } }
        : item));
      setNotice('Updated ' + permission.key + ' for ' + role.name + '.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Permission could not be updated.');
      await loadRoles();
    } finally {
      setBusy(false);
    }
  }

  const grouped = permissions.reduce<Record<string, PermissionItem[]>>((groups, permission) => {
    if (!groups[permission.module]) groups[permission.module] = [];
    groups[permission.module].push(permission);
    return groups;
  }, {});

  return (
    <Card>
      <CardHeader title="Organisation Roles & Permissions" subtitle="Control what each organisation role can view, create, update and approve." />
      <CardBody>
        {loading ? <p className="text-sm text-gray-500">Loading organisation permissions…</p> : (
          <div className="space-y-5">
            {error && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">{error}</p>}
            {notice && <p role="status" className="text-xs text-emerald-700">{notice}</p>}
            {roles.length === 0 && error && <p className="text-xs text-gray-500">This area is available to organisation administrators with role-management permission.</p>}
            {roles.length > 0 && <>
              <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-800">
                <LockKeyhole size={16} className="mt-0.5 shrink-0" />
                System roles and your own current role are protected. Changes are enforced by database permissions and recorded in the security audit log.
              </div>
              <form onSubmit={createRole} className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 p-4 md:grid-cols-[1fr_1.4fr_auto] md:items-end">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-gray-600">New role name</span>
                  <input value={roleName} onChange={(event) => setRoleName(event.target.value)} minLength={2} maxLength={60} required placeholder="e.g. Project Manager" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-gray-600">Description</span>
                  <input value={roleDescription} onChange={(event) => setRoleDescription(event.target.value)} maxLength={180} placeholder="Responsibilities for this role" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </label>
                <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                  <Plus size={15} /> Create role
                </button>
              </form>
              <section className="rounded-xl border border-gray-200">
                <div className="border-b border-gray-100 px-4 py-3">
                  <h3 className="text-sm font-semibold text-gray-800">Team role assignments</h3>
                  <p className="mt-0.5 text-xs text-gray-500">Assign existing organisation members to a role. You cannot change your own role or demote the last active administrator.</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {members.map((member) => (
                    <div key={member.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{member.display_name}</p>
                        <p className="mt-0.5 text-xs text-gray-400">{member.status}</p>
                      </div>
                      <select
                        value={member.role_id}
                        disabled={busy || member.user_id === session?.user?.id}
                        onChange={(event) => void changeMemberRole(member, event.target.value)}
                        className="min-w-44 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {roles.map((role) => (
                          <option key={role.id} value={role.id} disabled={role.is_system}>{role.name}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  {members.length === 0 && <p className="px-4 py-3 text-xs text-gray-500">No organisation members were returned.</p>}
                </div>
              </section>
              <div className="space-y-3">
                {roles.map((role) => {
                  const locked = role.is_system || role.id === membership?.role_id;
                  const enabledCount = Object.values(role.permissions).filter(Boolean).length;
                  return (
                    <details key={role.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{role.name}</p>
                          <p className="mt-0.5 text-xs text-gray-500">{role.description || 'No description'} · {enabledCount} permissions enabled</p>
                        </div>
                        <span className={locked ? 'rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600' : 'rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700'}>{locked ? 'Protected' : 'Editable'}</span>
                      </summary>
                      <div className="border-t border-gray-100 p-4">
                        {Object.entries(grouped).map(([module, items]) => (
                          <div key={module} className="mb-4 last:mb-0">
                            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{module}</h4>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                              {items.map((permission) => (
                                <label key={permission.key} className={locked ? 'flex items-start gap-2 rounded-lg border border-gray-100 p-2.5 text-xs opacity-60' : 'flex items-start gap-2 rounded-lg border border-gray-100 p-2.5 text-xs hover:bg-gray-50'}>
                                  <input type="checkbox" checked={role.permissions[permission.key] === true} disabled={locked || busy} onChange={(event) => void changePermission(role, permission, event.target.checked)} className="mt-0.5 accent-brand-600" />
                                  <span className="min-w-0">
                                    <span className="block font-medium text-gray-700">{permission.key.split('.')[1].replace(/_/g, ' ')}</span>
                                    <span className="mt-0.5 block text-gray-400">{permission.description}</span>
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400"><ShieldCheck size={14} /> Permissions are enforced by Supabase Row Level Security, not only interface visibility.</div>
            </>}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function ProjectAccessManagement() {
  const { membership } = useAuth();
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [members, setMembers] = useState<Array<{ user_id: string; display_name: string; status: string }>>([]);
  const [assignments, setAssignments] = useState<Array<{ id: string; project_id: string; user_id: string | null; staff_id: string | null; role: string | null }>>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [projectRole, setProjectRole] = useState('Project member');
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    if (!membership?.organization_id) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const { data: canManage, error: permissionError } = await supabase.rpc('has_org_permission', {
        target_organization_id: membership.organization_id,
        target_permission_key: 'project_members.manage',
      });
      if (permissionError) throw permissionError;
      setAllowed(canManage === true);
      if (canManage !== true) return;

      const { data: directory, error: directoryError } = await supabase.rpc('get_project_access_admin_data', {
        target_organization_id: membership.organization_id,
      });
      if (directoryError) throw directoryError;
      const projectRows = directory?.projects || [];
      const memberRows: Array<{ user_id: string; display_name: string; status: string }> = directory?.members || [];
      const assignmentRows = directory?.assignments || [];
      setProjects(projectRows);
      setMembers(memberRows);
      setAssignments(assignmentRows);
      setSelectedProject((current) => current || projectRows?.[0]?.id || '');
      setSelectedUser((current) => current || (memberRows || []).find((member) => member.status === 'active')?.user_id || '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Project access settings could not be loaded.');
    } finally { setLoading(false); }
  }, [membership?.organization_id]);

  useEffect(() => { void load(); }, [load]);

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProject || !selectedUser) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const { error: insertError } = await supabase.from('project_members').insert({
        project_id: selectedProject, user_id: selectedUser, role: projectRole,
      });
      if (insertError) throw insertError;
      setNotice('Project access assigned successfully.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Project access could not be assigned.');
    } finally { setBusy(false); }
  }

  async function removeMember(assignmentId: string) {
    if (!window.confirm('Remove this user from the project?')) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const { error: deleteError } = await supabase.from('project_members').delete().eq('id', assignmentId);
      if (deleteError) throw deleteError;
      setNotice('Project access removed.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Project access could not be removed.');
    } finally { setBusy(false); }
  }

  if (!loading && !allowed) return null;
  const projectAssignments = assignments.filter((assignment) => assignment.project_id === selectedProject);
  const memberName = (userId: string | null) => members.find((member) => member.user_id === userId)?.display_name || 'Unlinked staff record';

  return (
    <Card>
      <CardHeader title="Project Access" subtitle="Assign active organisation users to individual projects. Project membership is enforced by database policies." />
      <CardBody>
        {loading ? <p className="text-sm text-gray-500">Loading project access…</p> : (
          <div className="space-y-4">
            {error && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">{error}</p>}
            {notice && <p role="status" className="text-xs text-emerald-700">{notice}</p>}
            {projects.length === 0 ? <p className="text-xs text-gray-500">Create a project before assigning project access.</p> : <>
              <form onSubmit={addMember} className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 p-4 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-end">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-gray-600">Project</span>
                  <select value={selectedProject} onChange={(event) => setSelectedProject(event.target.value)} required className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
                    {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-gray-600">Team member</span>
                  <select value={selectedUser} onChange={(event) => setSelectedUser(event.target.value)} required className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
                    {members.map((member) => <option key={member.user_id} value={member.user_id}>{member.display_name}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-gray-600">Project role</span>
                  <input value={projectRole} onChange={(event) => setProjectRole(event.target.value)} maxLength={60} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </label>
                <button type="submit" disabled={busy || !selectedUser} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"><Plus size={14} className="mr-1 inline" /> Assign</button>
              </form>
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <div className="border-b border-gray-100 px-4 py-3">
                  <h3 className="text-sm font-semibold text-gray-800">Assigned project users</h3>
                  <p className="mt-0.5 text-xs text-gray-500">{projects.find((project) => project.id === selectedProject)?.name}</p>
                </div>
                {projectAssignments.length === 0 ? <p className="px-4 py-4 text-xs text-gray-500">No explicit user assignments. Existing organisation permissions currently govern access to this project.</p> : (
                  <div className="divide-y divide-gray-100">
                    {projectAssignments.map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div><p className="text-sm font-medium text-gray-800">{memberName(assignment.user_id)}</p><p className="text-xs text-gray-500">{assignment.role || 'Project member'}</p></div>
                        <button type="button" disabled={busy} onClick={() => void removeMember(assignment.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">Remove</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400">When a project has explicit user assignments, other organisation users lose access to its project-linked records unless they hold project membership management permission.</p>
            </>}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

type SecurityAuditRow = {
  id: string;
  actor_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function SecurityAuditLog() {
  const { membership } = useAuth();
  const [events, setEvents] = useState<SecurityAuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      if (!membership?.organization_id) {
        setEvents([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      const { data, error: queryError } = await supabase
        .from('security_audit_events')
        .select('id, actor_id, action, target_type, target_id, metadata, created_at')
        .eq('organization_id', membership.organization_id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (!active) return;
      if (queryError) {
        setError('Audit history is restricted to users with audit-view permission, or could not be loaded.');
        setEvents([]);
      } else {
        setEvents((data ?? []) as SecurityAuditRow[]);
      }
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, [membership?.organization_id]);

  return (
    <Card>
      <CardHeader title="Security & Activity Audit" subtitle="Recent organisation changes and business-record activity. Access is controlled by the audit.view permission." />
      <CardBody>
        {loading ? <p className="text-sm text-gray-500">Loading audit history…</p> : error ? (
          <p role="alert" className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">{error}</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-gray-500">No audit events are available for this organisation.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {events.map((event) => {
              const metadata = event.metadata ?? {};
              const before = metadata.status_before;
              const after = metadata.status_after;
              const changed = Array.isArray(metadata.changed_columns) ? metadata.changed_columns.map(String).join(', ') : '';
              const reference = typeof metadata.reference === 'string' ? metadata.reference : '';
              return (
                <div key={event.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{event.action} <span className="font-normal text-gray-500">· {event.target_type}</span></p>
                      <p className="mt-0.5 text-xs text-gray-500">{reference || event.target_id || 'Record'} · Actor {event.actor_id.slice(0, 8)}</p>
                    </div>
                    <time className="text-xs text-gray-400">{new Date(event.created_at).toLocaleString()}</time>
                  </div>
                  {(before || after || changed) && (
                    <p className="mt-1 text-xs text-gray-500">
                      {before || after ? 'Status: ' + String(before ?? '—') + ' → ' + String(after ?? '—') : ''}
                      {before || after ? (changed ? ' · ' : '') : ''}
                      {changed ? 'Changed: ' + changed : ''}
                    </p>
                  )}
                  {typeof metadata.project_id === 'string' && <p className="mt-1 text-[11px] text-gray-400">Project ID: {metadata.project_id}</p>}
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export function Settings() {
  return (
    <div className="space-y-6">
      <RoleManagement />
      <ProjectAccessManagement />
      <SecurityAuditLog />
      <IntegrationConnections />
      <Card>
        <CardHeader title="Platform" subtitle="Construction OS configuration" />
        <CardBody>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-gray-200 p-4"><p className="text-xs font-medium text-gray-400">Platform Name</p><p className="mt-1 text-sm font-semibold text-gray-700">Construction OS</p></div>
            <div className="rounded-lg border border-gray-200 p-4"><p className="text-xs font-medium text-gray-400">Version</p><p className="mt-1 text-sm font-semibold text-gray-700">1.0.0 (Pilot)</p></div>
            <div className="rounded-lg border border-gray-200 p-4"><p className="text-xs font-medium text-gray-400">Powered By</p><p className="mt-1 text-sm font-semibold text-gray-700">Tishande</p></div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
