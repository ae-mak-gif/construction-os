import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  MessageSquare,
  Smartphone,
  Mail,
  Calendar,
  HardDrive,
  Calculator,
  Landmark,
  CreditCard,
  ListChecks,
  Brain,
  Clock,
  Plug,
  ShieldCheck,
  Plus,
  LockKeyhole,
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface Integration {
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'ready' | 'coming';
  category: string;
  color: string;
}

const integrations: Integration[] = [
  { name: 'WhatsApp', description: 'Send and receive WhatsApp messages to clients and team members', icon: <MessageSquare size={22} />, status: 'ready', category: 'Communication', color: 'bg-emerald-50 text-emerald-600' },
  { name: 'SMS', description: 'Send SMS notifications and alerts', icon: <Smartphone size={22} />, status: 'ready', category: 'Communication', color: 'bg-blue-50 text-blue-600' },
  { name: 'Email', description: 'Send emails and manage email campaigns', icon: <Mail size={22} />, status: 'ready', category: 'Communication', color: 'bg-orange-50 text-orange-600' },
  { name: 'Google Calendar', description: 'Sync project meetings, inspections, and deadlines', icon: <Calendar size={22} />, status: 'ready', category: 'Productivity', color: 'bg-purple-50 text-purple-600' },
  { name: 'Google Drive', description: 'Connect Google Drive to store, organise, preview and share project documents and drawings', icon: <HardDrive size={22} />, status: 'ready', category: 'Storage', color: 'bg-blue-50 text-blue-600' },
  { name: 'Accounting', description: 'Connect accounting platforms such as Sage / Pastel and QuickBooks for invoices, expenses and reconciliation', icon: <Calculator size={22} />, status: 'ready', category: 'Finance', color: 'bg-indigo-50 text-indigo-600' },
  { name: 'Banking', description: 'Connect bank accounts for transaction tracking', icon: <Landmark size={22} />, status: 'coming', category: 'Finance', color: 'bg-gray-50 text-gray-500' },
  { name: 'Online Payments', description: 'Connect payment providers to accept client payments online and reconcile transactions', icon: <CreditCard size={22} />, status: 'ready', category: 'Finance', color: 'bg-emerald-50 text-emerald-600' },
  { name: 'ClickUp', description: 'Sync tasks and project management with ClickUp', icon: <ListChecks size={22} />, status: 'coming', category: 'Productivity', color: 'bg-gray-50 text-gray-500' },
  { name: 'Advanced AI', description: 'Connect an AI API for intelligent insights and automation', icon: <Brain size={22} />, status: 'coming', category: 'AI', color: 'bg-gray-50 text-gray-500' },
  { name: 'Virtual Executive Assistant', description: 'AI executive support for email triage, scheduling, task coordination, follow-ups and workflow execution', icon: <Brain size={22} />, status: 'ready', category: 'AI & Productivity', color: 'bg-violet-50 text-violet-600' },
];


type PermissionItem = { key: string; module: string; description: string };
type OrganisationRole = { id: string; name: string; description: string | null; is_system: boolean; permissions: Record<string, boolean> };

function RoleManagement() {
  const { session, membership } = useAuth();
  const [roles, setRoles] = useState<OrganisationRole[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');

  async function send(payload: Record<string, unknown>) {
    if (!session?.access_token || !membership?.organization_id) throw new Error('Your active organisation session is unavailable.');
    const response = await fetch('/api/organization/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token },
      body: JSON.stringify({ ...payload, organization_id: membership.organization_id }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Role management request failed.');
    return result.data;
  }

  async function loadRoles() {
    setLoading(true);
    setError('');
    try {
      const data = await send({ action: 'list' });
      setRoles(data.roles || []);
      setPermissions(data.permissions || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Role permissions could not be loaded.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session?.access_token && membership?.organization_id) void loadRoles();
    else setLoading(false);
  }, [session?.access_token, membership?.organization_id]);

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
                                    <span className="block font-medium text-gray-700">{permission.key.split('.')[1].replaceAll('_', ' ')}</span>
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

export function Settings() {
  const ready = integrations.filter((i) => i.status === 'ready');
  const coming = integrations.filter((i) => i.status === 'coming');

  return (
    <div className="space-y-6">
      <RoleManagement />
      {/* Ready to connect */}
      <Card>
        <CardHeader title="Ready to Connect" subtitle={`${ready.length} integrations available`} />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ready.map((i) => (
              <div key={i.name} className="border border-gray-200 rounded-xl p-4 hover:shadow-card-hover transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${i.color}`}>
                    {i.icon}
                  </div>
                  <Badge variant="green">Ready</Badge>
                </div>
                <h3 className="text-sm font-semibold text-gray-800">{i.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{i.description}</p>
                <button className="mt-3 w-full flex items-center justify-center gap-1.5 text-sm font-medium text-brand-600 border border-brand-200 rounded-lg py-2 hover:bg-brand-50 transition-colors">
                  <Plug size={14} /> Connect
                </button>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Coming soon */}
      <Card>
        <CardHeader title="Coming Soon" subtitle={`${coming.length} integrations in development`} />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coming.map((i) => (
              <div key={i.name} className="border border-gray-200 rounded-xl p-4 opacity-70">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${i.color}`}>
                    {i.icon}
                  </div>
                  <Badge variant="gray">Coming Soon</Badge>
                </div>
                <h3 className="text-sm font-semibold text-gray-800">{i.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{i.description}</p>
                <div className="mt-3 w-full flex items-center justify-center gap-1.5 text-sm text-gray-400 border border-gray-200 rounded-lg py-2">
                  <Clock size={14} /> In Development
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Platform info */}
      <Card>
        <CardHeader title="Platform" subtitle="Construction OS configuration" />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-400 font-medium">Platform Name</p>
              <p className="text-sm text-gray-700 font-semibold mt-1">Construction OS</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-400 font-medium">Version</p>
              <p className="text-sm text-gray-700 font-semibold mt-1">1.0.0 (Demo)</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-400 font-medium">Powered By</p>
              <p className="text-sm text-gray-700 font-semibold mt-1">Tishande</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
