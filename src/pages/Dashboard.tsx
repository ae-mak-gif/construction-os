import {
  FolderKanban,
  AlertTriangle,
  DollarSign,
  TrendingDown,
  ShoppingCart,
  Clock,
  ArrowRight,
  CheckCircle2,
  Package,
  UserPlus,
  ShieldAlert,
} from 'lucide-react';
import { Card, CardHeader, CardBody, StatCard } from '@/components/ui/Card';
import { Table, Th, Td, Tr } from '@/components/ui/Table';
import { HealthBadge, StatusBadge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { BarChart } from '@/components/ui/BarChart';
import { DonutChart } from '@/components/ui/DonutChart';
import type { Project, Task, Invoice, PurchaseRequest, Activity } from '@/data/mockData';
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
  const projects: Project[] = (records.projects ?? []).map((row) => ({
    id: row.id,
    name: String(row.name ?? 'Untitled project'),
    client: String(clientsById.get(String(row.client_id))?.name ?? 'Client'),
    clientCompany: String(clientsById.get(String(row.client_id))?.name ?? 'Client'),
    manager: row.project_manager_id ? 'Assigned' : 'Unassigned',
    progress: Number(row.progress_percent ?? 0),
    budget: Number(row.contract_value ?? 0),
    actualCost: (records.project_costs ?? []).filter((cost) => cost.project_id === row.id).reduce((sum, cost) => sum + Number(cost.amount ?? 0), 0),
    deadline: String(row.expected_completion_date ?? ''),
    startDate: String(row.start_date ?? ''),
    health: row.health_status === 'at_risk' ? 'at-risk' : row.health_status === 'critical' ? 'delayed' : row.health_status === 'completed' ? 'completed' : 'on-track',
    status: row.status === 'completed' ? 'Completed' : row.status === 'planning' ? 'Planning' : 'Active',
    location: String(row.location ?? ''),
    description: String(row.description ?? ''),
    contractValue: Number(row.contract_value ?? 0),
  } as Project));
  const projectById = new Map(projects.map((row) => [row.id, row]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tasks: Task[] = (records.tasks ?? []).map((row) => {
    const dueDate = row.due_date ? new Date(`${row.due_date}T00:00:00`) : null;
    const isOverdue = Boolean(dueDate && dueDate < today && row.status !== 'completed');
    return {
      id: row.id,
      title: String(row.title ?? ''),
      project: projectById.get(String(row.project_id))?.name ?? 'Unassigned project',
      assignee: 'Team member',
      dueDate: String(row.due_date ?? ''),
      priority: String(row.priority ?? 'medium').toLowerCase() === 'high' || String(row.priority).toLowerCase() === 'urgent' ? 'High' : String(row.priority).toLowerCase() === 'low' ? 'Low' : 'Medium',
      status: row.status === 'completed' ? 'Done' : isOverdue ? 'Overdue' : row.status === 'in_progress' ? 'In Progress' : row.status === 'blocked' ? 'Review' : 'To Do',
    } as Task;
  });
  const invoices: Invoice[] = (records.invoices ?? []).map((row) => {
    const paidAmount = (records.payments ?? []).filter((payment) => payment.invoice_id === row.id && payment.status === 'received').reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
    const balance = Math.max(0, Number(row.total_amount ?? 0) - paidAmount);
    const dueDate = row.due_date ? new Date(`${row.due_date}T00:00:00`) : null;
    const isOverdue = balance > 0 && Boolean(dueDate && dueDate < today);
    return {
      id: String(row.invoice_number ?? row.id),
      client: String(clientsById.get(String(row.client_id))?.name ?? 'Client'),
      project: projectById.get(String(row.project_id))?.name ?? 'Unassigned project',
      amount: Number(row.total_amount ?? 0),
      issuedDate: String(row.issue_date ?? ''),
      dueDate: String(row.due_date ?? ''),
      status: balance <= 0 || row.status === 'paid' ? 'Paid' : isOverdue || row.status === 'overdue' ? 'Overdue' : row.status === 'partially_paid' || paidAmount > 0 ? 'Partial' : 'Outstanding',
      paidAmount,
    } as Invoice;
  });
  const purchaseRequests: PurchaseRequest[] = (records.purchase_requests ?? []).map((row) => ({
    id: String(row.request_number ?? row.id),
    item: String(row.description ?? ''),
    project: projectById.get(String(row.project_id))?.name ?? 'Unassigned project',
    qty: 1,
    unit: 'item',
    estCost: Number(row.estimated_amount ?? 0),
    requestedBy: 'Team member',
    date: String(row.created_at ?? '').slice(0, 10),
    status: row.status === 'approved' ? 'Approved' : row.status === 'ordered' ? 'PO Issued' : row.status === 'delivered' ? 'Delivered' : row.status === 'rejected' ? 'Rejected' : 'Requested',
    supplier: 'Pending',
  } as PurchaseRequest));
  const recentActivity: Activity[] = (records.activities ?? []).slice(0, 8).map((row) => ({
    id: row.id,
    type: row.entity_type === 'task' ? 'task' : row.entity_type === 'invoice' || row.entity_type === 'payment' ? 'finance' : row.entity_type === 'purchase_order' ? 'procurement' : row.entity_type === 'client' ? 'client' : row.entity_type === 'risk' ? 'risk' : 'project',
    message: String(row.title ?? row.description ?? ''),
    time: String(row.created_at ?? ''),
    user: 'Team member',
  } as Activity));
  const monthlyFinancialData = Array.from({ length: 7 }, (_, index) => {
    const monthDate = new Date();
    monthDate.setDate(1);
    monthDate.setMonth(monthDate.getMonth() - (6 - index));
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
    const revenue = (records.payments ?? []).filter((payment) => {
      if (payment.status !== 'received' || !payment.payment_date) return false;
      const date = new Date(`${payment.payment_date}T00:00:00`);
      return date >= monthStart && date < monthEnd;
    }).reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
    const cost = (records.expenses ?? []).filter((expense) => {
      if (!expense.expense_date) return false;
      const date = new Date(`${expense.expense_date}T00:00:00`);
      return date >= monthStart && date < monthEnd;
    }).reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0);
    return { month: monthDate.toLocaleDateString('en-ZW', { month: 'short' }), revenue, cost };
  });
  const activeProjects = projects.filter((p) => p.status === 'Active').length;
  const atRiskProjects = projects.filter((p) => p.health === 'at-risk' || p.health === 'delayed').length;
  const outstandingPayments = invoices
    .filter((i) => i.status === 'Outstanding' || i.status === 'Overdue' || i.status === 'Partial')
    .reduce((sum, i) => sum + (i.amount - i.paidAmount), 0);
  const totalCosts = projects.reduce((sum, p) => sum + p.actualCost, 0);
  const pendingProcurement = purchaseRequests.filter((p) => p.status === 'Requested' || p.status === 'Approved').length;
  const overdueTasks = tasks.filter((t) => t.status === 'Overdue').length;
  const overdueInvoices = invoices.filter((invoice) => invoice.status === 'Overdue');
  const openSafetyIncidents = (records.safety_incidents ?? []).filter((incident) => !['closed', 'resolved'].includes(String(incident.status ?? '').toLowerCase()));
  const lowStockItems = (records.inventory_items ?? []).filter((item) => item.status !== 'inactive' && Number(item.quantity_on_hand ?? 0) <= Number(item.reorder_level ?? 0));
  const newEnquiries = (records.enquiries ?? []).filter((enquiry) => enquiry.status === 'new');
  const priorityItems = [
    ...(overdueTasks ? [{ icon: <Clock size={16} />, color: 'bg-red-50 text-red-600', title: `${overdueTasks} overdue task${overdueTasks === 1 ? '' : 's'}`, detail: 'Review overdue project work and update the schedule', page: 'ops-tasks' as PageKey }] : []),
    ...(overdueInvoices.length ? [{ icon: <DollarSign size={16} />, color: 'bg-orange-50 text-orange-600', title: `${overdueInvoices.length} overdue invoice${overdueInvoices.length === 1 ? '' : 's'}`, detail: `${formatCurrency(overdueInvoices.reduce((sum, invoice) => sum + Math.max(0, invoice.amount - invoice.paidAmount), 0))} outstanding past due date`, page: 'finance' as PageKey }] : []),
    ...(openSafetyIncidents.length ? [{ icon: <ShieldAlert size={16} />, color: 'bg-red-50 text-red-600', title: `${openSafetyIncidents.length} open safety incident${openSafetyIncidents.length === 1 ? '' : 's'}`, detail: 'Review corrective actions and close-out evidence', page: 'mgmt-risk' as PageKey }] : []),
    ...(lowStockItems.length ? [{ icon: <Package size={16} />, color: 'bg-amber-50 text-amber-600', title: `${lowStockItems.length} low-stock item${lowStockItems.length === 1 ? '' : 's'}`, detail: 'Check quantities against reorder levels', page: 'ops-inventory' as PageKey }] : []),
    ...(newEnquiries.length ? [{ icon: <UserPlus size={16} />, color: 'bg-teal-50 text-teal-600', title: `${newEnquiries.length} new enquiry${newEnquiries.length === 1 ? '' : 'ies'}`, detail: 'Review and assign new client enquiries', page: 'crm-enquiries' as PageKey }] : []),
  ];

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
        <StatCard label="Outstanding" value={formatCurrency(outstandingPayments)} icon={<DollarSign size={20} />} accent="red" />
        <StatCard label="Project Costs" value={formatCurrency(totalCosts)} icon={<TrendingDown size={20} />} accent="orange" />
        <StatCard label="Pending Procurement" value={String(pendingProcurement)} icon={<ShoppingCart size={20} />} accent="blue" />
        <StatCard label="Overdue Tasks" value={String(overdueTasks)} icon={<Clock size={20} />} accent="red" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader title="Revenue vs Cost" subtitle="Last 7 months" />
          <CardBody>
            {monthlyFinancialData.some((item) => item.revenue > 0 || item.cost > 0) ? (
              <BarChart data={monthlyFinancialData.map(({ month, revenue, cost }) => ({ label: month, value1: revenue, value2: cost }))} label1="Cash received" label2="Expenses" />
            ) : (
              <p className="py-10 text-center text-sm text-gray-400">Recorded payments and expenses will appear here.</p>
            )}
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
              {projects.length === 0 && <p className="py-6 text-center text-sm text-gray-400">No projects have been created yet.</p>}
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
              {priorityItems.length === 0 && <p className="py-6 text-center text-sm text-gray-400">No immediate priority actions from the live records.</p>}
              {priorityItems.map((item, index) => (
                <PriorityItem key={index} icon={item.icon} color={item.color} title={item.title} detail={item.detail} onClick={() => onNavigate(item.page)} />
              ))}
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
              {recentActivity.length === 0 && <p className="py-6 text-center text-sm text-gray-400">No activity has been recorded yet.</p>}
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
                {upcomingDeadlines.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-sm text-gray-400">No upcoming task deadlines.</td></tr>}
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
