import {
  FolderKanban,
  AlertTriangle,
  DollarSign,
  TrendingDown,
  ShoppingCart,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Package,
  FileText,
  UserPlus,
  ShieldAlert,
} from 'lucide-react';
import { Card, CardHeader, CardBody, StatCard } from '@/components/ui/Card';
import { Table, Th, Td, Tr } from '@/components/ui/Table';
import { HealthBadge, StatusBadge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { BarChart } from '@/components/ui/BarChart';
import { DonutChart } from '@/components/ui/DonutChart';
import {
  projects as mockProjects,
  tasks as mockTasks,
  recentActivity as mockRecentActivity,
  revenueCostData,
  purchaseRequests as mockPurchaseRequests,
  invoices as mockInvoices,
} from '@/data/mockData';
import { formatCurrency, formatDateShort } from '@/utils/format';
import type { PageKey } from '@/components/layout/Sidebar';
import { useBuildFlowData } from '@/context/BuildFlowDataContext';
import type { Project, Task, Invoice, PurchaseRequest, Activity } from '@/data/mockData';

const activityIcons: Record<string, React.ReactNode> = {
  project: <FolderKanban size={14} />,
  task: <CheckCircle2 size={14} />,
  finance: <DollarSign size={14} />,
  procurement: <ShoppingCart size={14} />,
  client: <UserPlus size={14} />,
  risk: <ShieldAlert size={14} />,
};

const activityColors: Record<string, string> = {
  project: 'bg-blue-50 text-blue-600',
  task: 'bg-emerald-50 text-emerald-600',
  finance: 'bg-orange-50 text-orange-600',
  procurement: 'bg-purple-50 text-purple-600',
  client: 'bg-teal-50 text-teal-600',
  risk: 'bg-red-50 text-red-600',
};

export function Dashboard({ onNavigate }: { onNavigate: (page: PageKey) => void }) {
  const { records } = useBuildFlowData();
  const clientsById = new Map((records.clients ?? []).map((row) => [row.id, row]));
  const staffById = new Map((records.staff ?? []).map((row) => [row.id, row]));
  const projects: Project[] = records.projects?.length ? records.projects.map((row) => ({
    id: row.id, name: String(row.name ?? 'Untitled project'), client: String(clientsById.get(String(row.client_id))?.name ?? 'Client'),
    clientCompany: String(clientsById.get(String(row.client_id))?.name ?? 'Client'), manager: String(staffById.get(String(row.project_manager_id))?.first_name ?? 'Unassigned'),
    progress: Number(row.progress_percent ?? 0), budget: Number(row.contract_value ?? 0), actualCost: (records.project_costs ?? []).filter((cost) => cost.project_id === row.id).reduce((sum, cost) => sum + Number(cost.amount ?? 0), 0),
    deadline: String(row.expected_completion_date ?? ''), startDate: String(row.start_date ?? ''), health: row.health_status === 'at_risk' ? 'at-risk' : row.health_status === 'critical' ? 'delayed' : row.health_status === 'completed' ? 'completed' : 'on-track',
    status: row.status === 'completed' ? 'Completed' : row.status === 'planning' ? 'Planning' : 'Active', location: String(row.location ?? ''), description: String(row.description ?? ''), contractValue: Number(row.contract_value ?? 0),
  } as Project)) : mockProjects;
  const projectById = new Map(projects.map((row) => [row.id, row]));
  const tasks: Task[] = records.tasks?.length ? records.tasks.map((row) => ({ id: row.id, title: String(row.title ?? ''), project: projectById.get(String(row.project_id))?.name ?? 'Unassigned project', assignee: String(staffById.get(String(row.assigned_to))?.first_name ?? 'Unassigned'), dueDate: String(row.due_date ?? ''), priority: String(row.priority ?? 'medium').toLowerCase() === 'high' || String(row.priority).toLowerCase() === 'urgent' ? 'High' : String(row.priority).toLowerCase() === 'low' ? 'Low' : 'Medium', status: row.status === 'completed' ? 'Done' : row.status === 'in_progress' ? 'In Progress' : row.status === 'blocked' ? 'Review' : 'To Do' } as Task)) : mockTasks;
  const invoices: Invoice[] = records.invoices?.length ? records.invoices.map((row) => ({ id: String(row.invoice_number ?? row.id), client: String(clientsById.get(String(row.client_id))?.name ?? 'Client'), project: projectById.get(String(row.project_id))?.name ?? 'Unassigned project', amount: Number(row.total_amount ?? 0), issuedDate: String(row.issue_date ?? ''), dueDate: String(row.due_date ?? ''), status: row.status === 'paid' ? 'Paid' : row.status === 'overdue' ? 'Overdue' : row.status === 'partially_paid' ? 'Partial' : 'Outstanding', paidAmount: (records.payments ?? []).filter((payment) => payment.invoice_id === row.id).reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0) } as Invoice)) : mockInvoices;
  const purchaseRequests: PurchaseRequest[] = records.purchase_requests?.length ? records.purchase_requests.map((row) => ({ id: String(row.request_number ?? row.id), item: String(row.description ?? ''), project: projectById.get(String(row.project_id))?.name ?? 'Unassigned project', qty: 1, unit: 'item', estCost: Number(row.estimated_amount ?? 0), requestedBy: 'Team member', date: String(row.created_at ?? '').slice(0, 10), status: row.status === 'approved' ? 'Approved' : row.status === 'ordered' ? 'PO Issued' : row.status === 'delivered' ? 'Delivered' : row.status === 'rejected' ? 'Rejected' : 'Requested', supplier: 'Pending' } as PurchaseRequest)) : mockPurchaseRequests;
  const recentActivity: Activity[] = records.activities?.length ? records.activities.slice(0, 8).map((row) => ({ id: row.id, type: 'project', message: String(row.title ?? row.description ?? ''), time: String(row.created_at ?? ''), user: 'Team member' } as Activity)) : mockRecentActivity;
  const activeProjects = projects.filter((p) => p.status === 'Active').length;
  const atRiskProjects = projects.filter((p) => p.health === 'at-risk' || p.health === 'delayed').length;
  const outstandingPayments = invoices
    .filter((i) => i.status === 'Outstanding' || i.status === 'Overdue' || i.status === 'Partial')
    .reduce((sum, i) => sum + (i.amount - i.paidAmount), 0);
  const totalCosts = projects.reduce((sum, p) => sum + p.actualCost, 0);
  const pendingProcurement = purchaseRequests.filter((p) => p.status === 'Requested' || p.status === 'Approved').length;
  const overdueTasks = tasks.filter((t) => t.status === 'Overdue').length;

  const healthSegments = [
    { label: 'On Track', value: projects.filter((p) => p.health === 'on-track').length, color: '#10b981' },
    { label: 'At Risk', value: projects.filter((p) => p.health === 'at-risk').length, color: '#f59e0b' },
    { label: 'Delayed', value: projects.filter((p) => p.health === 'delayed').length, color: '#ef4444' },
  ];

  const upcomingDeadlines = tasks
    .filter((t) => t.status !== 'Done' && t.status !== 'Overdue')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Active Projects" value={String(activeProjects)} icon={<FolderKanban size={20} />} accent="blue" />
        <StatCard label="At Risk" value={String(atRiskProjects)} icon={<AlertTriangle size={20} />} accent="amber" />
        <StatCard label="Outstanding" value={formatCurrency(outstandingPayments)} icon={<DollarSign size={20} />} accent="red" trend="2 invoices overdue" trendUp={false} />
        <StatCard label="Project Costs" value={formatCurrency(totalCosts)} icon={<TrendingDown size={20} />} accent="orange" />
        <StatCard label="Pending Procurement" value={String(pendingProcurement)} icon={<ShoppingCart size={20} />} accent="blue" />
        <StatCard label="Overdue Tasks" value={String(overdueTasks)} icon={<Clock size={20} />} accent="red" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader title="Revenue vs Cost" subtitle="Last 7 months" />
          <CardBody>
            <BarChart data={revenueCostData.map(({ month, revenue, cost }) => ({ label: month, value1: revenue, value2: cost }))} label1="Revenue" label2="Cost" />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Project Health" subtitle={`${projects.length} total projects`} />
          <CardBody className="flex items-center justify-center">
            <DonutChart segments={healthSegments} centerLabel="Projects" centerValue={String(projects.length)} />
          </CardBody>
        </Card>
      </div>

      {/* Project health + priority actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            title="Project Health Overview"
            action={
              <button onClick={() => onNavigate('projects')} className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                View all <ArrowRight size={12} />
              </button>
            }
          />
          <CardBody>
            <div className="space-y-4">
              {projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onNavigate('projects')}
                  className="cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700 truncate">{p.name}</span>
                    <HealthBadge health={p.health} />
                  </div>
                  <div className="flex items-center gap-3">
                    <ProgressBar
                      value={p.progress}
                      color={p.health === 'on-track' ? 'green' : p.health === 'at-risk' ? 'amber' : 'red'}
                    />
                    <span className="text-xs text-gray-400 w-9 text-right">{p.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Priority Actions" subtitle="Items requiring immediate attention" />
          <CardBody>
            <div className="space-y-3">
              {overdueTasks > 0 && (
                <PriorityItem
                  icon={<AlertCircle size={16} />}
                  color="bg-red-50 text-red-600"
                  title={`${overdueTasks} overdue tasks`}
                  detail="Steel ordering and Block C plastering behind schedule"
                  onClick={() => onNavigate('ops-tasks')}
                />
              )}
              <PriorityItem
                icon={<DollarSign size={16} />}
                color="bg-orange-50 text-orange-600"
                title="2 overdue invoices"
                detail="Nyathi Investments & Chigumba Properties — $697,500 outstanding"
                onClick={() => onNavigate('finance')}
              />
              <PriorityItem
                icon={<ShieldAlert size={16} />}
                color="bg-red-50 text-red-600"
                title="1 open safety observation"
                detail="Missing edge protection — Riverside Office, Level 2"
                onClick={() => onNavigate('mgmt-risk')}
              />
              <PriorityItem
                icon={<Package size={16} />}
                color="bg-amber-50 text-amber-600"
                title="1 item below reorder level"
                detail={'Aggregate 3/4" — only 12m³ in stock'}
                onClick={() => onNavigate('ops-inventory')}
              />
              <PriorityItem
                icon={<FileText size={16} />}
                  color="bg-blue-50 text-blue-600"
                  title="1 new enquiry"
                  detail="Patricia Sibanda — Highfield Apartments Complex ($850k)"
                  onClick={() => onNavigate('crm-enquiries')}
              />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent activity + upcoming deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Recent Activity" subtitle="Latest updates across all projects" />
          <CardBody>
            <div className="space-y-3">
              {recentActivity.slice(0, 6).map((a) => (
                <div key={a.id} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${activityColors[a.type]}`}>
                    {activityIcons[a.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">{a.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{a.user} · {a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Upcoming Deadlines" subtitle="Tasks due soon" />
          <CardBody className="p-0">
            <Table>
              <thead>
                <tr>
                  <Th>Task</Th>
                  <Th>Project</Th>
                  <Th>Due</Th>
                  <Th>Priority</Th>
                </tr>
              </thead>
              <tbody>
                {upcomingDeadlines.map((t) => (
                  <Tr key={t.id}>
                    <Td className="font-medium text-gray-700">{t.title}</Td>
                    <Td className="text-gray-500 text-xs">{t.project}</Td>
                    <Td className="text-gray-500 text-xs">{formatDateShort(t.dueDate)}</Td>
                    <Td><StatusBadge status={t.priority} /></Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function PriorityItem({
  icon,
  color,
  title,
  detail,
  onClick,
}: {
  icon: React.ReactNode;
  color: string;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 cursor-pointer transition-all"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
      <div>
        <p className="text-sm font-medium text-gray-700">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{detail}</p>
      </div>
    </div>
  );
}
