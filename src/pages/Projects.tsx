import { useState } from 'react';
import {
  Search,
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
import { ProgressBar } from '@/components/ui/ProgressBar';
import { DonutChart } from '@/components/ui/DonutChart';
import {
  projects,
  tasks,
  boqItems,
  purchaseRequests,
  inventory,
  risks,
  qualityIssues,
  projectUpdates,
  projectDocuments,
  type Project,
} from '@/data/mockData';
import {
  formatCurrency,
  formatFullCurrency,
  formatDate,
  formatDateShort,
} from '@/utils/format';

export function Projects({
  onOpenProject,
}: {
  onOpenProject: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'table'>('grid');

  const filtered = projects.filter(
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
  const [tab, setTab] = useState<ProjectTab>('overview');
  const [projectProgress, setProjectProgress] = useState(project.progress);

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
        onProgressChange={setProjectProgress}
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
  const projectTasks = tasks.filter(
    (t) => t.project === project.name
  );

  const projectBOQ = boqItems.filter(
    (b) => b.project === project.name
  );

  const projectProc = purchaseRequests.filter(
    (p) => p.project === project.name
  );

  const projectRisks = risks.filter(
    (r) => r.project === project.name
  );

  const projectUpdateItems = projectUpdates.filter(
    (u) => u.projectId === project.id
  );

  const projectDocs = projectDocuments.filter(
    (d) => d.projectId === project.id
  );

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
                {inventory.slice(0, 6).map((i) => (
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
                  {qualityIssues
                    .filter((q) => q.project === project.name)
                    .map((q) => (
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
  items: typeof boqItems;
}) {
  const subtotal = items.reduce(
    (s, i) => s + i.qty * i.unitCost,
    0
  );

  const contingency = subtotal * 0.05;
  const markup = subtotal * 0.15;
  const total = subtotal + contingency + markup;

  const categoryColors: Record<string, string> = {
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
                    variant={categoryColors[i.category] as any}
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
            {[
              {
                label: 'Materials',
                amount: project.actualCost * 0.45,
                pct: 45,
              },
              {
                label: 'Labour',
                amount: project.actualCost * 0.25,
                pct: 25,
              },
              {
                label: 'Subcontractors',
                amount: project.actualCost * 0.18,
                pct: 18,
              },
              {
                label: 'Equipment',
                amount: project.actualCost * 0.08,
                pct: 8,
              },
              {
                label: 'Overheads',
                amount: project.actualCost * 0.04,
                pct: 4,
              },
            ].map((c) => (
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