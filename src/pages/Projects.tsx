import { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  ArrowLeft,
  MapPin,
  User,
  DollarSign,
  FileText,
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  CheckCircle2,
  ClipboardList,
  ShoppingCart,
  Boxes,
  FolderOpen,
  ShieldAlert,
  Upload,
  Download,
} from 'lucide-react';
import { Card, CardHeader, CardBody, StatCard } from '@/components/ui/Card';
import { Table, Th, Td, Tr } from '@/components/ui/Table';
import { HealthBadge, StatusBadge, Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { DonutChart } from '@/components/ui/DonutChart';
import type {
  Project,
  Task,
  BOQItem,
  PurchaseRequest,
  Risk,
  QualityIssue,
  ProjectUpdate,
  ProjectDocument,
  InventoryItem,
} from '@/data/mockData';
import {
  formatCurrency,
  formatFullCurrency,
  formatDate,
  formatDateShort,
} from '@/utils/format';
import { useBuildFlowData } from '@/context/BuildFlowDataContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export function Projects({
  onOpenProject,
}: {
  onOpenProject: (id: string) => void;
}) {
  const { records, refresh } = useBuildFlowData();
  const { membership } = useAuth();
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [canCreateProject, setCanCreateProject] = useState(false);
  const [canManageProjectMembers, setCanManageProjectMembers] = useState(false);
  const [memberDirectory, setMemberDirectory] = useState<Array<{ user_id: string; display_name: string; status: string }>>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', clientId: '', projectCode: '', description: '', location: '',
    startDate: '', expectedCompletionDate: '', contractValue: '', projectManagerUserId: '',
  });

  useEffect(() => {
    let cancelled = false;
    async function loadProjectPermissions() {
      if (!membership?.organization_id) return;
      const [createPermission, memberPermission] = await Promise.all([
        supabase.rpc('has_org_permission', {
          target_organization_id: membership.organization_id,
          target_permission_key: 'projects.create',
        }),
        supabase.rpc('has_org_permission', {
          target_organization_id: membership.organization_id,
          target_permission_key: 'project_members.manage',
        }),
      ]);
      if (cancelled) return;
      setCanCreateProject(Boolean(createPermission.data));
      setCanManageProjectMembers(Boolean(memberPermission.data));
      if (memberPermission.data) {
        const { data } = await supabase.rpc('get_project_access_admin_data', {
          target_organization_id: membership.organization_id,
        });
        if (!cancelled) {
          const members = Array.isArray(data?.members) ? data.members : [];
          setMemberDirectory(members.filter((member: { status?: string }) => member.status === 'active'));
        }
      } else {
        setMemberDirectory([]);
      }
    }
    void loadProjectPermissions();
    return () => { cancelled = true; };
  }, [membership?.organization_id]);

  const clientById = new Map((records.clients ?? []).map((row) => [row.id, row]));
  const managerNameById = new Map(memberDirectory.map((member) => [member.user_id, member.display_name]));
  const projectRows: Project[] = (records.projects ?? []).map((row) => ({
    id: row.id,
    name: String(row.name ?? ''),
    client: String(clientById.get(String(row.client_id))?.name ?? 'Client'),
    clientCompany: String(clientById.get(String(row.client_id))?.name ?? 'Client'),
    manager: managerNameById.get(String(row.project_manager_id ?? '')) ?? (row.project_manager_id ? 'Assigned' : 'Unassigned'),
    progress: Number(row.progress_percent ?? 0),
    budget: Number(row.contract_value ?? 0),
    actualCost: (records.project_budgets ?? []).filter((budget) => budget.project_id === row.id).reduce((sum, budget) => sum + Number(budget.actual_amount ?? 0), 0),
    deadline: String(row.expected_completion_date ?? ''),
    startDate: String(row.start_date ?? ''),
    health: row.health_status === 'at_risk' ? 'at-risk' : row.health_status === 'critical' ? 'delayed' : row.health_status === 'completed' ? 'completed' : 'on-track',
    status: row.status === 'completed' ? 'Completed' : row.status === 'planning' ? 'Planning' : 'Active',
    location: String(row.location ?? ''),
    description: String(row.description ?? ''),
    contractValue: Number(row.contract_value ?? 0),
  } as Project));

  async function createProject() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc('create_buildflow_project', {
        p_name: form.name.trim(),
        p_client_id: form.clientId || null,
        p_project_code: form.projectCode.trim() || null,
        p_description: form.description.trim() || null,
        p_location: form.location.trim() || null,
        p_start_date: form.startDate || null,
        p_expected_completion_date: form.expectedCompletionDate || null,
        p_contract_value: form.contractValue.trim() ? Number(form.contractValue) : null,
        p_project_manager_user_id: form.projectManagerUserId || null,
      });
      if (error) throw error;
      await refresh();
      setShowCreate(false);
      setForm({ name: '', clientId: '', projectCode: '', description: '', location: '', startDate: '', expectedCompletionDate: '', contractValue: '', projectManagerUserId: '' });
      if (data?.project_id) onOpenProject(data.project_id);
    } catch (error) {
      console.error('Unable to create project:', error);
      window.alert(error instanceof Error ? error.message : 'Unable to create this project.');
    } finally {
      setSaving(false);
    }
  }

  const filtered = projectRows.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase()) ||
      p.manager.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Projects"
          subtitle={`${filtered.length} projects`}
          action={
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                <Search size={14} className="text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search projects..."
                  className="bg-transparent text-sm outline-none w-32 md:w-48"
                />
              </div>

              {canCreateProject && (
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors"
                >
                  <Plus size={15} /> New Project
                </button>
              )}
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setView('grid')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    view === 'grid'
                      ? 'bg-white text-gray-700 shadow-sm'
                      : 'text-gray-400'
                  }`}
                >
                  Cards
                </button>

                <button
                  onClick={() => setView('table')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    view === 'table'
                      ? 'bg-white text-gray-700 shadow-sm'
                      : 'text-gray-400'
                  }`}
                >
                  Table
                </button>
              </div>
            </div>
          }
        />

        {view === 'grid' ? (
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onOpenProject(p.id)}
                  className="border border-gray-200 rounded-xl p-4 hover:shadow-card-hover hover:border-gray-300 cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">
                        {p.name}
                      </h3>

                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <MapPin size={11} /> {p.location}
                      </p>
                    </div>

                    <HealthBadge health={p.health} />
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Progress</span>
                      <span className="font-semibold text-gray-700">
                        {p.progress}%
                      </span>
                    </div>

                    <ProgressBar
                      value={p.progress}
                      color={
                        p.health === 'on-track'
                          ? 'green'
                          : p.health === 'at-risk'
                          ? 'amber'
                          : 'red'
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-400">Client</p>
                      <p className="text-gray-700 font-medium truncate">
                        {p.client}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-400">Manager</p>
                      <p className="text-gray-700 font-medium">
                        {p.manager}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-400">Budget</p>
                      <p className="text-gray-700 font-medium">
                        {formatCurrency(p.budget)}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-400">Deadline</p>
                      <p className="text-gray-700 font-medium">
                        {formatDateShort(p.deadline)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        ) : (
          <CardBody className="p-0">
            <Table>
              <thead>
                <tr>
                  <Th>Project</Th>
                  <Th>Client</Th>
                  <Th>Manager</Th>
                  <Th>Progress</Th>
                  <Th>Budget</Th>
                  <Th>Cost</Th>
                  <Th>Deadline</Th>
                  <Th>Health</Th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((p) => (
                  <Tr
                    key={p.id}
                    onClick={() => onOpenProject(p.id)}
                  >
                    <Td className="font-medium text-gray-700">
                      {p.name}
                    </Td>

                    <Td className="text-gray-500">
                      {p.client}
                    </Td>

                    <Td className="text-gray-500">
                      {p.manager}
                    </Td>

                    <Td>
                      <div className="flex items-center gap-2 w-28">
                        <ProgressBar
                          value={p.progress}
                          color={
                            p.health === 'on-track'
                              ? 'green'
                              : p.health === 'at-risk'
                              ? 'amber'
                              : 'red'
                          }
                        />
                        <span className="text-xs text-gray-500">
                          {p.progress}%
                        </span>
                      </div>
                    </Td>

                    <Td className="font-medium text-gray-700">
                      {formatCurrency(p.budget)}
                    </Td>

                    <Td className="text-gray-600">
                      {formatCurrency(p.actualCost)}
                    </Td>

                    <Td className="text-gray-500 text-xs">
                      {formatDateShort(p.deadline)}
                    </Td>

                    <Td>
                      <HealthBadge health={p.health} />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </CardBody>
        )}
      </Card>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Project">
        <form
          className="space-y-4"
          onSubmit={(event) => { event.preventDefault(); void createProject(); }}
        >
          <div>
            <label className="text-xs font-medium text-gray-500">Project name *</label>
            <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400" placeholder="e.g. Riverside Office Development" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Client</label>
              <select value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                <option value="">No client selected</option>
                {(records.clients ?? []).filter((client) => client.status !== 'inactive').map((client) => <option key={client.id} value={client.id}>{String(client.name ?? 'Client')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Project code</label>
              <input value={form.projectCode} onChange={(event) => setForm({ ...form, projectCode: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="e.g. BF-2026-001" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Location</label>
            <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Project location" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Start date</label>
              <input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Expected completion</label>
              <input type="date" value={form.expectedCompletionDate} onChange={(event) => setForm({ ...form, expectedCompletionDate: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Contract value</label>
            <input type="number" min="0" step="0.01" value={form.contractValue} onChange={(event) => setForm({ ...form, contractValue: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="0.00" />
          </div>
          {canManageProjectMembers && (
            <div>
              <label className="text-xs font-medium text-gray-500">Project manager</label>
              <select value={form.projectManagerUserId} onChange={(event) => setForm({ ...form, projectManagerUserId: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                <option value="">Assign later</option>
                {memberDirectory.map((member) => <option key={member.user_id} value={member.user_id}>{member.display_name}</option>)}
              </select>
              <p className="mt-1 text-xs text-gray-400">The selected user is added to the project team in the same transaction.</p>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-gray-500">Description</label>
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400" placeholder="Project scope and key objectives" />
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
            <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">{saving ? 'Creating…' : 'Create Project'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

type ProjectTab =
  | 'overview'
  | 'tasks'
  | 'boq'
  | 'procurement'
  | 'costs'
  | 'materials'
  | 'documents'
  | 'risks'
  | 'updates';

const tabConfig: {
  key: ProjectTab;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    key: 'overview',
    label: 'Overview',
    icon: <FolderOpen size={16} />,
  },
  {
    key: 'tasks',
    label: 'Tasks',
    icon: <CheckCircle2 size={16} />,
  },
  {
    key: 'boq',
    label: 'BOQ',
    icon: <ClipboardList size={16} />,
  },
  {
    key: 'procurement',
    label: 'Procurement',
    icon: <ShoppingCart size={16} />,
  },
  {
    key: 'costs',
    label: 'Costs',
    icon: <DollarSign size={16} />,
  },
  {
    key: 'materials',
    label: 'Materials',
    icon: <Boxes size={16} />,
  },
  {
    key: 'documents',
    label: 'Documents',
    icon: <FileText size={16} />,
  },
  {
    key: 'risks',
    label: 'Risks',
    icon: <ShieldAlert size={16} />,
  },
  {
    key: 'updates',
    label: 'Updates',
    icon: <MessageSquare size={16} />,
  },
];

export function ProjectDetail({
  project,
  onBack,
}: {
  project: Project;
  onBack: () => void;
}) {
  const { update } = useBuildFlowData();
  const [tab, setTab] = useState<ProjectTab>('overview');
  const [projectProgress, setProjectProgress] = useState(project.progress);
  const handleProgressChange = (progress: number) => {
    setProjectProgress(progress);
    if (/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(project.id)) {
      void update('projects', project.id, { progress_percent: progress }).catch((error) => window.alert(error.message));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-800">
            {project.name}
          </h2>

          <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
            <MapPin size={12} /> {project.location} ·{' '}
            <User size={12} /> {project.client} (
            {project.clientCompany})
          </p>
        </div>

        <HealthBadge health={project.health} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-200 pb-px">
        {tabConfig.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.key
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <ProjectTabContent
        tab={tab}
        project={{
          ...project,
          progress: projectProgress,
        }}
        onProgressChange={handleProgressChange}
      />
    </div>
  );
}

function ProjectTabContent({
  tab,
  project,
  onProgressChange,
}: {
  tab: ProjectTab;
  project: Project;
  onProgressChange?: (progress: number) => void;
}) {
  const { records } = useBuildFlowData();
  const staffById = new Map((records.staff ?? []).map((row) => [row.id, row]));
  const projectTasks = (records.tasks ?? []).filter((row) => row.project_id === project.id).map((row) => ({ id: row.id, title: String(row.title ?? ''), project: project.name, assignee: String(staffById.get(String(row.assigned_to))?.first_name ?? 'Unassigned'), dueDate: String(row.due_date ?? ''), priority: row.priority === 'high' || row.priority === 'urgent' ? 'High' : row.priority === 'low' ? 'Low' : 'Medium', status: row.status === 'completed' ? 'Done' : row.status === 'in_progress' ? 'In Progress' : row.status === 'blocked' ? 'Review' : 'To Do' } as Task))
    ;
  const projectBOQ = (records.boq_items ?? []).filter((row) => row.project_id === project.id).map((row) => ({ id: row.id, item: String(row.item_code ?? row.description ?? ''), description: String(row.description ?? ''), qty: Number(row.quantity ?? 1), unit: String(row.unit ?? ''), unitCost: Number(row.unit_rate ?? 0), category: String(row.category ?? 'Materials'), project: project.name } as BOQItem))
    ;
  const projectProc = (records.purchase_requests ?? []).filter((row) => row.project_id === project.id).map((row) => ({ id: String(row.request_number ?? row.id), item: String(row.description ?? ''), project: project.name, qty: 1, unit: 'item', estCost: Number(row.estimated_amount ?? 0), requestedBy: 'Team member', date: String(row.created_at ?? '').slice(0, 10), status: row.status === 'approved' ? 'Approved' : row.status === 'ordered' ? 'PO Issued' : row.status === 'delivered' ? 'Delivered' : row.status === 'rejected' ? 'Rejected' : 'Requested', supplier: 'Pending' } as PurchaseRequest))
    ;
  const projectRisks = (records.risks ?? []).filter((row) => row.project_id === project.id).map((row) => ({ id: row.id, risk: String(row.title ?? ''), project: project.name, probability: row.likelihood === 'high' ? 'High' : row.likelihood === 'low' ? 'Low' : 'Medium', impact: row.impact === 'high' ? 'High' : row.impact === 'low' ? 'Low' : 'Medium', owner: String(staffById.get(String(row.owner_id))?.first_name ?? 'Unassigned'), status: row.status === 'closed' ? 'Closed' : row.status === 'mitigated' ? 'Mitigated' : 'Open', mitigation: String(row.mitigation_plan ?? '') } as Risk))
    ;
  const projectUpdateItems = (records.project_updates ?? []).filter((row) => row.project_id === project.id).map((row) => ({ id: row.id, projectId: project.id, date: String(row.created_at ?? ''), author: 'Team member', message: String(row.content ?? row.title ?? ''), type: 'progress' } as ProjectUpdate))
    ;
  const projectDocs = (records.project_documents ?? []).filter((row) => row.project_id === project.id).map((row) => ({ id: row.id, projectId: project.id, name: String(row.name ?? ''), type: String(row.file_type ?? 'Report'), date: String(row.created_at ?? ''), size: '—' } as ProjectDocument))
    ;
  const projectQualityIssues = (records.quality_issues ?? []).filter((row) => row.project_id === project.id).map((row) => ({ id: row.id, type: String(row.category ?? '').toLowerCase().includes('safety') ? 'Safety Observation' : String(row.category ?? '').toLowerCase().includes('snag') ? 'Snag' : String(row.category ?? '').toLowerCase().includes('defect') ? 'Defect' : 'Issue', description: String(row.description ?? row.title ?? ''), project: project.name, location: '', reportedBy: 'Team member', date: String(row.created_at ?? ''), status: row.status === 'resolved' ? 'Resolved' : row.status === 'in_progress' ? 'In Progress' : 'Open', action: String(row.corrective_action ?? '') } as QualityIssue))
    ;
  const projectInventory = (records.inventory_items ?? []).map((row) => {
    const allocated = (records.inventory_transactions ?? []).filter((tx) => tx.inventory_item_id === row.id && tx.project_id === project.id).reduce((sum, tx) => sum + Number(tx.quantity ?? 0), 0);
    return { id: row.id, material: String(row.name ?? ''), category: String(row.category ?? ''), stock: Number(row.quantity_on_hand ?? 0), allocated, reorderLevel: Number(row.reorder_level ?? 0), unit: String(row.unit ?? ''), unitCost: Number(row.unit_cost ?? 0) } as InventoryItem;
  }).filter((row) => row.allocated > 0);

  switch (tab) {
    case 'overview':
      return (
        <OverviewTab
          project={project}
          onProgressChange={onProgressChange}
        />
      );

    case 'tasks':
      return (
        <Card>
          <CardHeader
            title="Project Tasks"
            subtitle={`${projectTasks.length} tasks`}
          />

          <CardBody className="p-0">
            <Table>
              <thead>
                <tr>
                  <Th>Task</Th>
                  <Th>Assignee</Th>
                  <Th>Due Date</Th>
                  <Th>Priority</Th>
                  <Th>Status</Th>
                </tr>
              </thead>

              <tbody>
                {projectTasks.map((t) => (
                  <Tr key={t.id}>
                    <Td className="font-medium text-gray-700">
                      {t.title}
                    </Td>

                    <Td className="text-gray-500">
                      {t.assignee}
                    </Td>

                    <Td className="text-gray-500 text-xs">
                      {formatDateShort(t.dueDate)}
                    </Td>

                    <Td>
                      <StatusBadge status={t.priority} />
                    </Td>

                    <Td>
                      <StatusBadge status={t.status} />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      );

    case 'boq':
      return <BOQTab items={projectBOQ} />;

    case 'procurement':
      return (
        <Card>
          <CardHeader
            title="Procurement Requests"
            subtitle={`${projectProc.length} requests`}
          />

          <CardBody className="p-0">
            <Table>
              <thead>
                <tr>
                  <Th>ID</Th>
                  <Th>Item</Th>
                  <Th>Qty</Th>
                  <Th>Est. Cost</Th>
                  <Th>Supplier</Th>
                  <Th>Requested By</Th>
                  <Th>Status</Th>
                </tr>
              </thead>

              <tbody>
                {projectProc.map((p) => (
                  <Tr key={p.id}>
                    <Td className="font-mono text-xs text-gray-400">
                      {p.id}
                    </Td>

                    <Td className="font-medium text-gray-700">
                      {p.item}
                    </Td>

                    <Td className="text-gray-500">
                      {p.qty} {p.unit}
                    </Td>

                    <Td className="font-medium text-gray-700">
                      {formatFullCurrency(p.estCost)}
                    </Td>

                    <Td className="text-gray-500">
                      {p.supplier}
                    </Td>

                    <Td className="text-gray-500">
                      {p.requestedBy}
                    </Td>

                    <Td>
                      <StatusBadge status={p.status} />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      );

    case 'costs':
      return <CostsTab project={project} />;

    case 'materials':
      return (
        <Card>
          <CardHeader
            title="Materials Allocation"
            subtitle="Inventory allocated to this project"
          />

          <CardBody className="p-0">
            <Table>
              <thead>
                <tr>
                  <Th>Material</Th>
                  <Th>Category</Th>
                  <Th>In Stock</Th>
                  <Th>Allocated</Th>
                  <Th>Available</Th>
                  <Th>Unit Cost</Th>
                </tr>
              </thead>

              <tbody>
                {projectInventory.slice(0, 6).map((i) => (
                  <Tr key={i.id}>
                    <Td className="font-medium text-gray-700">
                      {i.material}
                    </Td>

                    <Td className="text-gray-500">
                      {i.category}
                    </Td>

                    <Td className="text-gray-600">
                      {i.stock} {i.unit}
                    </Td>

                    <Td className="text-orange-600 font-medium">
                      {i.allocated} {i.unit}
                    </Td>

                    <Td className="text-emerald-600 font-medium">
                      {i.stock - i.allocated} {i.unit}
                    </Td>

                    <Td className="text-gray-600">
                      {formatFullCurrency(i.unitCost)}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      );

    case 'documents':
      return (
        <Card>
          <CardHeader
            title="Documents"
            subtitle={`${projectDocs.length} documents`}
            action={
              <button className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700">
                <Upload size={14} /> Upload
              </button>
            }
          />

          <CardBody className="p-0">
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Type</Th>
                  <Th>Date</Th>
                  <Th>Size</Th>
                  <Th></Th>
                </tr>
              </thead>

              <tbody>
                {projectDocs.map((d) => (
                  <Tr key={d.id}>
                    <Td className="font-medium text-gray-700 flex items-center gap-2">
                      <FileText
                        size={14}
                        className="text-gray-400"
                      />
                      {d.name}
                    </Td>

                    <Td>
                      <Badge variant="blue">{d.type}</Badge>
                    </Td>

                    <Td className="text-gray-500 text-xs">
                      {formatDate(d.date)}
                    </Td>

                    <Td className="text-gray-500">
                      {d.size}
                    </Td>

                    <Td>
                      <button className="text-gray-400 hover:text-gray-600">
                        <Download size={14} />
                      </button>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      );

    case 'risks':
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Risk Register"
              subtitle={`${projectRisks.length} risks`}
            />

            <CardBody className="p-0">
              <Table>
                <thead>
                  <tr>
                    <Th>Risk</Th>
                    <Th>Probability</Th>
                    <Th>Impact</Th>
                    <Th>Owner</Th>
                    <Th>Status</Th>
                    <Th>Mitigation</Th>
                  </tr>
                </thead>

                <tbody>
                  {projectRisks.map((r) => (
                    <Tr key={r.id}>
                      <Td className="font-medium text-gray-700">
                        {r.risk}
                      </Td>

                      <Td>
                        <StatusBadge status={r.probability} />
                      </Td>

                      <Td>
                        <StatusBadge status={r.impact} />
                      </Td>

                      <Td className="text-gray-500">
                        {r.owner}
                      </Td>

                      <Td>
                        <StatusBadge status={r.status} />
                      </Td>

                      <Td className="text-gray-500 text-xs">
                        {r.mitigation}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Quality Issues" />

            <CardBody className="p-0">
              <Table>
                <thead>
                  <tr>
                    <Th>Type</Th>
                    <Th>Description</Th>
                    <Th>Location</Th>
                    <Th>Reported By</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>

                <tbody>
                  {projectQualityIssues.map((q) => (
                      <Tr key={q.id}>
                        <Td>
                          <Badge
                            variant={
                              q.type === 'Safety Observation'
                                ? 'red'
                                : q.type === 'Defect'
                                ? 'amber'
                                : 'orange'
                            }
                          >
                            {q.type}
                          </Badge>
                        </Td>

                        <Td className="font-medium text-gray-700">
                          {q.description}
                        </Td>

                        <Td className="text-gray-500">
                          {q.location}
                        </Td>

                        <Td className="text-gray-500">
                          {q.reportedBy}
                        </Td>

                        <Td>
                          <StatusBadge status={q.status} />
                        </Td>
                      </Tr>
                    ))}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </div>
      );

    case 'updates':
      return (
        <Card>
          <CardHeader
            title="Project Updates"
            subtitle="Timeline of project activity"
          />

          <CardBody>
            <div className="space-y-4">
              {projectUpdateItems.map((u, i) => (
                <div key={u.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        u.type === 'milestone'
                          ? 'bg-emerald-50 text-emerald-600'
                          : u.type === 'issue'
                          ? 'bg-red-50 text-red-600'
                          : u.type === 'client'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {u.type === 'milestone' ? (
                        <TrendingUp size={14} />
                      ) : u.type === 'issue' ? (
                        <AlertTriangle size={14} />
                      ) : u.type === 'client' ? (
                        <User size={14} />
                      ) : (
                        <CheckCircle2 size={14} />
                      )}
                    </div>

                    {i < projectUpdateItems.length - 1 && (
                      <div className="w-px h-12 bg-gray-200 mt-1" />
                    )}
                  </div>

                  <div className="pb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        {u.author}
                      </span>

                      <Badge variant="gray">{u.type}</Badge>

                      <span className="text-xs text-gray-400">
                        {formatDateShort(u.date)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mt-1">
                      {u.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      );
  }
}

function OverviewTab({
  project,
  onProgressChange,
}: {
  project: Project;
  onProgressChange?: (progress: number) => void;
}) {
  const costSegments = [
    {
      label: 'Spent',
      value: project.actualCost,
      color: '#f97316',
    },
    {
      label: 'Remaining',
      value: project.budget - project.actualCost,
      color: '#3b82f6',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Contract Value"
          value={formatCurrency(project.contractValue)}
          icon={<DollarSign size={20} />}
          accent="blue"
        />

        <StatCard
          label="Budget"
          value={formatCurrency(project.budget)}
          icon={<ClipboardList size={20} />}
          accent="green"
        />

        <StatCard
          label="Actual Cost"
          value={formatCurrency(project.actualCost)}
          icon={<TrendingUp size={20} />}
          accent="orange"
        />

        <StatCard
          label="Progress"
          value={`${project.progress}%`}
          icon={<FolderOpen size={20} />}
          accent="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader title="Project Details" />

          <CardBody>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow
                label="Project Manager"
                value={project.manager}
              />

              <InfoRow
                label="Client"
                value={`${project.client} (${project.clientCompany})`}
              />

              <InfoRow
                label="Start Date"
                value={formatDate(project.startDate)}
              />

              <InfoRow
                label="Deadline"
                value={formatDate(project.deadline)}
              />

              <InfoRow
                label="Location"
                value={project.location}
              />

              <InfoRow
                label="Status"
                value={project.status}
              />
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 font-medium mb-1">
                Description
              </p>

              <p className="text-sm text-gray-600">
                {project.description}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Budget Utilisation" />

          <CardBody className="flex items-center justify-center">
            <DonutChart
              segments={costSegments}
              centerLabel="Spent"
              centerValue={`${Math.round(
                (project.actualCost / project.budget) * 100
              )}%`}
            />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Progress Timeline" />

        <CardBody>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-700">
                Update Project Progress
              </p>

              <p className="text-xs text-gray-400">
                Demo control — changes are reflected immediately
              </p>
            </div>

            <div className="flex items-center gap-2">
              {[5, 10, 25].map((step) => (
                <button
                  key={step}
                  onClick={() =>
                    onProgressChange?.(
                      Math.min(100, project.progress + step)
                    )
                  }
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  +{step}%
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Overall Progress
              </span>

              <span className="font-semibold text-gray-700">
                {project.progress}%
              </span>
            </div>

            <ProgressBar
              value={project.progress}
              color={
                project.health === 'on-track'
                  ? 'green'
                  : project.health === 'at-risk'
                  ? 'amber'
                  : 'red'
              }
            />

            <div className="grid grid-cols-4 gap-2 mt-4">
              {[
                {
                  label: 'Planning',
                  pct: 100,
                },
                {
                  label: 'Foundation',
                  pct: 100,
                },
                {
                  label: 'Structure',
                  pct:
                    project.progress > 50
                      ? 100
                      : project.progress * 2,
                },
                {
                  label: 'Finishing',
                  pct: project.progress > 80 ? 100 : 0,
                },
              ].map((phase) => (
                <div key={phase.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500">
                      {phase.label}
                    </span>

                    <span className="text-gray-400">
                      {Math.round(phase.pct)}%
                    </span>
                  </div>

                  <ProgressBar
                    value={phase.pct}
                    color={
                      phase.pct === 100
                        ? 'green'
                        : 'blue'
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function BOQTab({
  items,
}: {
  items: BOQItem[];
}) {
  const subtotal = items.reduce(
    (s, i) => s + i.qty * i.unitCost,
    0
  );

  const contingency = subtotal * 0.05;
  const markup = subtotal * 0.15;
  const total = subtotal + contingency + markup;

  const categoryColors: Record<string, React.ComponentProps<typeof Badge>['variant']> = {
    Materials: 'blue',
    Labour: 'green',
    Equipment: 'orange',
    Subcontractors: 'purple',
  };

  return (
    <Card>
      <CardHeader
        title="Bill of Quantities"
        subtitle={`${items.length} line items`}
      />

      <CardBody className="p-0">
        <Table>
          <thead>
            <tr>
              <Th>Item</Th>
              <Th>Description</Th>
              <Th>Category</Th>
              <Th>Qty</Th>
              <Th>Unit</Th>
              <Th>Unit Cost</Th>
              <Th>Total</Th>
            </tr>
          </thead>

          <tbody>
            {items.map((i) => (
              <Tr key={i.id}>
                <Td className="font-medium text-gray-700">
                  {i.item}
                </Td>

                <Td className="text-gray-500 text-xs">
                  {i.description}
                </Td>

                <Td>
                  <Badge
                    variant={categoryColors[i.category] ?? 'gray'}
                  >
                    {i.category}
                  </Badge>
                </Td>

                <Td className="text-gray-600">
                  {i.qty.toLocaleString()}
                </Td>

                <Td className="text-gray-500">
                  {i.unit}
                </Td>

                <Td className="text-gray-600">
                  {formatFullCurrency(i.unitCost)}
                </Td>

                <Td className="font-semibold text-gray-700">
                  {formatFullCurrency(i.qty * i.unitCost)}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </CardBody>

      <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50">
        <div className="ml-auto max-w-xs space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>

            <span className="font-semibold text-gray-700">
              {formatFullCurrency(subtotal)}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-500">
              Contingency (5%)
            </span>

            <span className="font-semibold text-gray-700">
              {formatFullCurrency(contingency)}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Markup (15%)</span>

            <span className="font-semibold text-gray-700">
              {formatFullCurrency(markup)}
            </span>
          </div>

          <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
            <span className="font-bold text-gray-800">
              Estimated Project Value
            </span>

            <span className="font-bold text-brand-600">
              {formatFullCurrency(total)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function CostsTab({ project }: { project: Project }) {
  const { records } = useBuildFlowData();
  const liveCosts = (records.project_costs ?? []).filter((row) => row.project_id === project.id);
  const liveCostTotal = liveCosts.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  const costBreakdown = liveCostTotal > 0
    ? Array.from(liveCosts.reduce((map, row) => { const label = String(row.cost_type ?? 'Other').replace(/_/g, ' '); map.set(label, (map.get(label) ?? 0) + Number(row.amount ?? 0)); return map; }, new Map<string, number>()).entries()).map(([label, amount]) => ({ label, amount, pct: Math.round((amount / liveCostTotal) * 100) }))
    : [ { label: 'Materials', amount: project.actualCost * 0.45, pct: 45 }, { label: 'Labour', amount: project.actualCost * 0.25, pct: 25 }, { label: 'Subcontractors', amount: project.actualCost * 0.18, pct: 18 }, { label: 'Equipment', amount: project.actualCost * 0.08, pct: 8 }, { label: 'Overheads', amount: project.actualCost * 0.04, pct: 4 } ];
  const remaining = project.budget - project.actualCost;

  const variance =
    ((project.actualCost - project.budget) /
      project.budget) *
    100;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Contract Value"
          value={formatCurrency(project.contractValue)}
          icon={<DollarSign size={20} />}
          accent="blue"
        />

        <StatCard
          label="Budget"
          value={formatCurrency(project.budget)}
          icon={<ClipboardList size={20} />}
          accent="green"
        />

        <StatCard
          label="Actual Cost"
          value={formatCurrency(project.actualCost)}
          icon={<TrendingUp size={20} />}
          accent="orange"
        />

        <StatCard
          label="Remaining"
          value={formatCurrency(remaining)}
          icon={<DollarSign size={20} />}
          accent={remaining > 0 ? 'green' : 'red'}
        />
      </div>

      <Card>
        <CardHeader title="Cost Breakdown" />

        <CardBody>
          <div className="space-y-3">
            {costBreakdown.map((c) => (
              <div key={c.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">
                    {c.label}
                  </span>

                  <span className="text-gray-700 font-medium">
                    {formatFullCurrency(c.amount)} ({c.pct}%)
                  </span>
                </div>

                <ProgressBar
                  value={c.pct}
                  color="blue"
                />
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">
              Budget Variance
            </span>

            <span
              className={`text-sm font-bold ${
                variance > 0
                  ? 'text-red-600'
                  : 'text-emerald-600'
              }`}
            >
              {variance > 0 ? '+' : ''}
              {variance.toFixed(1)}%
            </span>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-medium">
        {label}
      </p>

      <p className="text-sm text-gray-700 mt-0.5">
        {value}
      </p>
    </div>
  );
}