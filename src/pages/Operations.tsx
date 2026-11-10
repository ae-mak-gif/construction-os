import { useState } from 'react';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Check,
  X,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardBody, StatCard } from '@/components/ui/Card';
import { Table, Th, Td, Tr } from '@/components/ui/Table';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import {
  tasks as mockTasks,
  calendarEvents,
  boqItems as mockBoqItems,
  purchaseRequests as mockPurchaseRequests,
  suppliers as mockSuppliers,
  inventory as mockInventory,
  type Task,
  type PurchaseRequest,
} from '@/data/mockData';
import { formatFullCurrency, formatDateShort } from '@/utils/format';
import { useBuildFlowData } from '@/context/BuildFlowDataContext';

// ── Tasks & Calendar ──────────────────────────────────────────
export function TasksCalendar() {
  const { create, update, records } = useBuildFlowData();
  const projectById = new Map((records.projects ?? []).map((row) => [row.id, row]));
  const liveTasks: Task[] = records.tasks?.length ? records.tasks.map((row) => ({ id: row.id, title: String(row.title ?? ''), project: String(projectById.get(String(row.project_id))?.name ?? 'Unassigned project'), assignee: 'Unassigned', dueDate: String(row.due_date ?? ''), priority: row.priority === 'high' || row.priority === 'urgent' ? 'High' : row.priority === 'low' ? 'Low' : 'Medium', status: row.status === 'completed' ? 'Done' : row.status === 'in_progress' ? 'In Progress' : row.status === 'blocked' ? 'Review' : 'To Do' } as Task)) : mockTasks;
  const liveCalendarEvents = records.calendar_events?.length ? records.calendar_events.map((row) => ({ id: row.id, title: String(row.title ?? ''), date: String(row.start_at ?? '').slice(0, 10), time: String(row.start_at ?? '').slice(11, 16), type: row.event_type === 'inspection' ? 'inspection' : row.event_type === 'deadline' ? 'deadline' : row.event_type === 'client-meeting' ? 'client-meeting' : row.event_type === 'site-meeting' ? 'site-meeting' : 'project-meeting', project: String(projectById.get(String(row.project_id))?.name ?? 'General') } as (typeof calendarEvents)[number])) : calendarEvents;
  const [tab, setTab] = useState<'tasks' | 'calendar'>('tasks');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [taskItems, setTaskItems] = useState(liveTasks);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskProject, setTaskProject] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState<Task['priority']>('Medium');
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 8, 1));

  const filteredTasks =
    statusFilter === 'All'
      ? taskItems
      : taskItems.filter((t) => t.status === statusFilter);

  const taskStatuses = ['All', 'To Do', 'In Progress', 'Review', 'Done', 'Overdue'];

  const overdueCount = taskItems.filter((t) => t.status === 'Overdue').length;
  const inProgressCount = taskItems.filter((t) => t.status === 'In Progress').length;
  const doneCount = taskItems.filter((t) => t.status === 'Done').length;

  const createTask = async () => {
    if (!taskTitle.trim()) return;

    const newTask: Task = {
      id: `T${String(taskItems.length + 1).padStart(3, '0')}`,
      title: taskTitle.trim(),
      project: taskProject || 'Riverside Office Development',
      assignee: taskAssignee || 'Unassigned',
      dueDate: taskDueDate || '2026-09-30',
      priority: taskPriority,
      status: 'To Do',
    };

    try {
      const linkedProject = (records.projects ?? []).find((p) => String(p.name) === newTask.project);
      const saved = await create('tasks', { title: newTask.title, project_id: linkedProject?.id ?? null, status: 'todo', priority: newTask.priority.toLowerCase(), due_date: newTask.dueDate });
      newTask.id = saved.id;
    } catch (error) {
      console.error('Unable to save task:', error);
      window.alert(error instanceof Error ? error.message : 'Unable to save this task.');
      return;
    }
    setTaskItems([newTask, ...taskItems]);
    setTaskTitle('');
    setTaskProject('');
    setTaskAssignee('');
    setTaskDueDate('');
    setTaskPriority('Medium');
    setShowTaskModal(false);
  };

  const advanceTask = async (id: string) => {
    const stages: Task['status'][] = ['To Do', 'In Progress', 'Review', 'Done'];
    const selectedTask = taskItems.find((task) => task.id === id);
    if (selectedTask && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(selectedTask.id)) {
      const next = stages[stages.indexOf(selectedTask.status) + 1];
      if (next) void update('tasks', id, { status: next === 'Done' ? 'completed' : next === 'Review' ? 'blocked' : next.toLowerCase().replace(' ', '_') }).catch((error) => window.alert(error.message));
    }
    setTaskItems(
      taskItems.map((task) => {
        if (task.id !== id) return task;

        const currentIndex = stages.indexOf(task.status);
        if (currentIndex === -1 || currentIndex === stages.length - 1) return task;

        return {
          ...task,
          status: stages[currentIndex + 1],
        };
      })
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Tasks"
          value={String(taskItems.length)}
          icon={<Check size={20} />}
          accent="blue"
        />
        <StatCard
          label="In Progress"
          value={String(inProgressCount)}
          icon={<ArrowRight size={20} />}
          accent="orange"
        />
        <StatCard
          label="Overdue"
          value={String(overdueCount)}
          icon={<AlertTriangle size={20} />}
          accent="red"
        />
        <StatCard
          label="Completed"
          value={String(doneCount)}
          icon={<Check size={20} />}
          accent="green"
        />
      </div>

      <div className="flex items-center gap-1 border-b border-gray-200">
        {['tasks', 'calendar'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as 'tasks' | 'calendar')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t === 'tasks' ? 'Tasks' : 'Calendar'}
          </button>
        ))}
      </div>

      {tab === 'tasks' ? (
        <Card>
          <CardHeader
            title="All Tasks"
            subtitle={`${filteredTasks.length} tasks`}
            action={
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600 outline-none"
                >
                  {taskStatuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setShowTaskModal(true)}
                  className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors"
                >
                  <Plus size={16} /> New Task
                </button>
              </div>
            }
          />

          <CardBody className="p-0">
            <Table>
              <thead>
                <tr>
                  <Th>Task</Th>
                  <Th>Project</Th>
                  <Th>Assignee</Th>
                  <Th>Due Date</Th>
                  <Th>Priority</Th>
                  <Th>Status</Th>
                  <Th>Action</Th>
                </tr>
              </thead>

              <tbody>
                {filteredTasks.map((t) => (
                  <Tr key={t.id}>
                    <Td className="font-medium text-gray-700">{t.title}</Td>
                    <Td className="text-gray-500 text-xs">{t.project}</Td>
                    <Td className="text-gray-500">{t.assignee}</Td>
                    <Td className="text-gray-500 text-xs">
                      {formatDateShort(t.dueDate)}
                    </Td>
                    <Td>
                      <StatusBadge status={t.priority} />
                    </Td>
                    <Td>
                      <StatusBadge status={t.status} />
                    </Td>
                    <Td>
                      {t.status !== 'Done' && t.status !== 'Overdue' ? (
                        <button
                          onClick={() => advanceTask(t.id)}
                          className="text-xs font-medium text-brand-600 hover:text-brand-700"
                        >
                          Advance
                        </button>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      ) : (
        <CalendarView
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
        />
      )}

      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-800">Create New Task</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Add a task to the project workflow
                </p>
              </div>

              <button
                onClick={() => setShowTaskModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Task title"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-400"
              />

              <input
                value={taskProject}
                onChange={(e) => setTaskProject(e.target.value)}
                placeholder="Project"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-400"
              />

              <input
                value={taskAssignee}
                onChange={(e) => setTaskAssignee(e.target.value)}
                placeholder="Assignee"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-400"
              />

              <input
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-400"
              />

              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as Task['priority'])}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowTaskModal(false)}
                className="px-4 py-2 text-sm text-gray-500"
              >
                Cancel
              </button>

              <button
                onClick={createTask}
                disabled={!taskTitle.trim()}
                className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg disabled:opacity-40"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarView({
  currentMonth,
  setCurrentMonth,
  events,
}: {
  currentMonth: Date;
  setCurrentMonth: (d: Date) => void;
  events: (typeof calendarEvents);
}) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const days: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const dateStr = (d: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const eventsForDay = (d: number) =>
    events.filter((e) => e.date === dateStr(d));

  const eventTypeColors: Record<string, string> = {
    'project-meeting': 'bg-blue-50 text-blue-700 border-blue-200',
    'site-meeting': 'bg-teal-50 text-teal-700 border-teal-200',
    inspection: 'bg-amber-50 text-amber-700 border-amber-200',
    deadline: 'bg-red-50 text-red-700 border-red-200',
    'client-meeting': 'bg-purple-50 text-purple-700 border-purple-200',
  };

  return (
    <Card>
      <CardHeader
        title={monthName}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              onClick={() => setCurrentMonth(new Date(2026, 8, 1))}
              className="text-sm font-medium text-brand-600 px-3 py-1"
            >
              Today
            </button>

            <button
              onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        }
      />

      <CardBody>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div
              key={d}
              className="text-center text-xs font-semibold text-gray-400 py-2"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => {
            if (d === null)
              return <div key={i} className="min-h-20 rounded-lg" />;

            const dayEvents = eventsForDay(d);
            const isToday = d === 11 && month === 8 && year === 2026;

            return (
              <div
                key={i}
                className={`min-h-20 rounded-lg border p-1.5 ${
                  isToday
                    ? 'border-brand-300 bg-brand-50/30'
                    : 'border-gray-100'
                }`}
              >
                <p
                  className={`text-xs font-medium mb-1 ${
                    isToday ? 'text-brand-600' : 'text-gray-500'
                  }`}
                >
                  {d}
                </p>

                <div className="space-y-0.5">
                  {dayEvents.slice(0, 2).map((e) => (
                    <div
                      key={e.id}
                      className={`text-[10px] px-1.5 py-0.5 rounded border truncate ${
                        eventTypeColors[e.type] ||
                        'bg-gray-50 text-gray-600 border-gray-200'
                      }`}
                    >
                      {e.time} {e.title}
                    </div>
                  ))}

                  {dayEvents.length > 2 && (
                    <p className="text-[10px] text-gray-400 px-1">
                      +{dayEvents.length - 2} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100">
          {Object.entries(eventTypeColors).map(([type, cls]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded border ${cls}`} />
              <span className="text-xs text-gray-500 capitalize">
                {type.replace('-', ' ')}
              </span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

// ── BOQ & Estimates ───────────────────────────────────────────
export function BOQEstimates() {
  const { records, create, remove } = useBuildFlowData();
  const projectById = new Map((records.projects ?? []).map((row) => [row.id, row]));
  const liveBoqItems = records.boq_items?.length ? records.boq_items.map((row) => ({ id: row.id, item: String(row.item_code ?? row.description ?? ''), description: String(row.description ?? ''), qty: Number(row.quantity ?? 1), unit: String(row.unit ?? ''), unitCost: Number(row.unit_rate ?? 0), category: String(row.category ?? 'Materials'), project: String(projectById.get(String(row.project_id))?.name ?? 'Unassigned project') } as (typeof mockBoqItems)[number])) : mockBoqItems;
  const [projectFilter, setProjectFilter] = useState('All');
  const [items, setItems] = useState(liveBoqItems);

  const projects = [
    'All',
    ...Array.from(new Set(items.map((b) => b.project))),
  ];

  const filtered =
    projectFilter === 'All'
      ? items
      : items.filter((i) => i.project === projectFilter);

  const subtotal = filtered.reduce((s, i) => s + i.qty * i.unitCost, 0);
  const contingency = subtotal * 0.05;
  const markup = subtotal * 0.15;
  const total = subtotal + contingency + markup;

  const categoryColors: Record<string, React.ComponentProps<typeof Badge>['variant']> = {
    Materials: 'blue',
    Labour: 'green',
    Equipment: 'orange',
    Subcontractors: 'purple',
  };

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
    if (/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id)) void remove('boq_items', id).catch((error) => window.alert(error.message));
  };

  const addItem = async () => {
    const newId = `B${String(items.length + 1).padStart(3, '0')}`;

    const projectName = projectFilter === 'All' ? 'Riverside Office Development' : projectFilter;
    const linkedProject = (records.projects ?? []).find((row) => row.name === projectName);
    const item = { id: newId, item: 'New Item', description: 'Enter description', qty: 1, unit: 'pcs', unitCost: 0, category: 'Materials' as const, project: projectName };
    if (linkedProject) {
      try {
        const saved = await create('boq_items', { project_id: linkedProject.id, item_code: newId, description: item.description, quantity: 1, unit: 'pcs', unit_rate: 0, total_amount: 0, category: 'Materials', status: 'planned' });
        item.id = saved.id;
      } catch (error) { window.alert(error instanceof Error ? error.message : 'Unable to save BOQ item.'); return; }
    }
    setItems((current) => [...current, item]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Bill of Quantities"
          subtitle={`${filtered.length} line items`}
          action={
            <div className="flex items-center gap-2">
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600 outline-none"
              >
                {projects.map((p) => (
                  <option key={p} value={p}>
                    {p === 'All' ? 'All Projects' : p}
                  </option>
                ))}
              </select>

              <button
                onClick={addItem}
                className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors"
              >
                <Plus size={16} /> Add Item
              </button>
            </div>
          }
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
                <Th></Th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((i) => (
                <Tr key={i.id}>
                  <Td className="font-medium text-gray-700">{i.item}</Td>
                  <Td className="text-gray-500 text-xs">{i.description}</Td>
                  <Td>
                    <Badge variant={categoryColors[i.category] ?? 'gray'}>
                      {i.category}
                    </Badge>
                  </Td>
                  <Td className="text-gray-600">
                    {i.qty.toLocaleString()}
                  </Td>
                  <Td className="text-gray-500">{i.unit}</Td>
                  <Td className="text-gray-600">
                    {formatFullCurrency(i.unitCost)}
                  </Td>
                  <Td className="font-semibold text-gray-700">
                    {formatFullCurrency(i.qty * i.unitCost)}
                  </Td>
                  <Td>
                    <button
                      onClick={() => removeItem(i.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
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
              <span className="text-gray-500">Contingency (5%)</span>
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
    </div>
  );
}

// ── Procurement ──────────────────────────────────────────────
export function Procurement() {
  const { create, records } = useBuildFlowData();
  const projectById = new Map((records.projects ?? []).map((row) => [row.id, row]));
  const liveRequests = records.purchase_requests?.length ? records.purchase_requests.map((row) => ({ id: String(row.request_number ?? row.id), item: String(row.description ?? ''), project: String(projectById.get(String(row.project_id))?.name ?? 'Unassigned project'), qty: 1, unit: 'item', estCost: Number(row.estimated_amount ?? 0), requestedBy: 'Team member', date: String(row.created_at ?? '').slice(0, 10), status: row.status === 'approved' ? 'Approved' : row.status === 'ordered' ? 'PO Issued' : row.status === 'delivered' ? 'Delivered' : row.status === 'rejected' ? 'Rejected' : 'Requested', supplier: 'Pending' } as PurchaseRequest)) : mockPurchaseRequests;
  const [statusFilter, setStatusFilter] = useState('All');
  const [requests, setRequests] = useState(liveRequests);
  const [showModal, setShowModal] = useState(false);

  const [item, setItem] = useState('');
  const [project, setProject] = useState('');
  const [qty, setQty] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [estCost, setEstCost] = useState('');

  const statuses = [
    'All',
    'Requested',
    'Approved',
    'PO Issued',
    'Delivered',
    'Rejected',
  ];

  const filtered =
    statusFilter === 'All'
      ? requests
      : requests.filter((p) => p.status === statusFilter);

  const workflowSteps = [
    'Request',
    'Approval',
    'Purchase Order',
    'Supplier',
    'Delivery',
    'Inventory',
    'Project',
  ];

  const createRequest = async () => {
    if (!item.trim()) return;

    const newRequest: PurchaseRequest = {
      id: `PR${String(requests.length + 1).padStart(3, '0')}`,
      item: item.trim(),
      project: project || 'Riverside Office Development',
      qty: Number(qty) || 1,
      unit,
      estCost: Number(estCost) || 0,
      supplier: 'Pending',
      requestedBy: 'Admin',
      date: '2026-09-18',
      status: 'Requested',
    };

    try {
      const linkedProject = (records.projects ?? []).find((p) => String(p.name) === newRequest.project);
      const saved = await create('purchase_requests', { project_id: linkedProject?.id ?? null, description: newRequest.item, status: 'pending', estimated_amount: newRequest.estCost, required_date: new Date().toISOString().slice(0, 10), notes: `Quantity: ${newRequest.qty} ${newRequest.unit}` });
      newRequest.id = saved.id;
    } catch (error) {
      console.error('Unable to save purchase request:', error);
      window.alert(error instanceof Error ? error.message : 'Unable to save this purchase request.');
      return;
    }
    setRequests([newRequest, ...requests]);

    setItem('');
    setProject('');
    setQty('1');
    setUnit('pcs');
    setEstCost('');
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Procurement Workflow"
          subtitle="From request to project delivery"
        />

        <CardBody>
          <div className="flex items-center gap-1 overflow-x-auto">
            {workflowSteps.map((step, i) => (
              <div
                key={step}
                className="flex items-center gap-1 shrink-0"
              >
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </div>

                  <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
                    {step}
                  </span>
                </div>

                {i < workflowSteps.length - 1 && (
                  <ArrowRight size={14} className="text-gray-300" />
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Purchase Requests"
          subtitle={`${filtered.length} requests`}
          action={
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600 outline-none"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors"
              >
                <Plus size={16} /> New Request
              </button>
            </div>
          }
        />

        <CardBody className="p-0">
          <Table>
            <thead>
              <tr>
                <Th>ID</Th>
                <Th>Item</Th>
                <Th>Project</Th>
                <Th>Qty</Th>
                <Th>Est. Cost</Th>
                <Th>Supplier</Th>
                <Th>Requested By</Th>
                <Th>Date</Th>
                <Th>Status</Th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((p) => (
                <Tr key={p.id}>
                  <Td className="font-mono text-xs text-gray-400">
                    {p.id}
                  </Td>
                  <Td className="font-medium text-gray-700">
                    {p.item}
                  </Td>
                  <Td className="text-gray-500 text-xs">
                    {p.project}
                  </Td>
                  <Td className="text-gray-600">
                    {p.qty} {p.unit}
                  </Td>
                  <Td className="font-medium text-gray-700">
                    {formatFullCurrency(p.estCost)}
                  </Td>
                  <Td className="text-gray-500">{p.supplier}</Td>
                  <Td className="text-gray-500">{p.requestedBy}</Td>
                  <Td className="text-gray-500 text-xs">
                    {formatDateShort(p.date)}
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-800">
                  New Purchase Request
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Start a procurement workflow
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <input
                value={item}
                onChange={(e) => setItem(e.target.value)}
                placeholder="Item"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
              />

              <input
                value={project}
                onChange={(e) => setProject(e.target.value)}
                placeholder="Project"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder="Quantity"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                />

                <input
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="Unit"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                />
              </div>

              <input
                type="number"
                value={estCost}
                onChange={(e) => setEstCost(e.target.value)}
                placeholder="Estimated Cost"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-500"
              >
                Cancel
              </button>

              <button
                onClick={createRequest}
                disabled={!item.trim()}
                className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg disabled:opacity-40"
              >
                Create Request
              </button>
            </div>
          </div>
        </div>
            )}
    </div>
  );
}
export function Suppliers() {
  const { records } = useBuildFlowData();
  const supplierRows = records.suppliers?.length ? records.suppliers.map((row) => ({ id: row.id, name: String(row.name ?? ''), category: 'Supplier', contact: String(row.contact_name ?? ''), phone: String(row.phone ?? ''), email: String(row.email ?? ''), rating: 0, totalOrders: 0, outstandingBalance: 0, status: row.status === 'inactive' ? 'Inactive' : 'Active' } as (typeof mockSuppliers)[number])) : mockSuppliers;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Suppliers</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage suppliers and procurement contacts.
        </p>
      </div>

      <Card>
        <CardHeader title="Supplier Directory" />
        <CardBody>
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <Th>Supplier</Th>
                  <Th>Contact</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {supplierRows.map((supplier) => (
                  <Tr key={supplier.id}>
                    <Td>
                      <div className="font-medium text-gray-900">
                        {supplier.name}
                      </div>
                    </Td>
                    <Td>
                      {supplier.email || supplier.phone || supplier.contact || '—'}
                    </Td>
                    <Td>
                      <Badge>
                        {supplier.status || 'Active'}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export function Inventory() {
  const { records } = useBuildFlowData();
  const inventoryRows = records.inventory_items?.length ? records.inventory_items.map((row) => ({ id: row.id, material: String(row.name ?? ''), category: String(row.category ?? ''), stock: Number(row.quantity_on_hand ?? 0), allocated: 0, reorderLevel: Number(row.reorder_level ?? 0), unit: String(row.unit ?? ''), unitCost: Number(row.unit_cost ?? 0) } as (typeof mockInventory)[number])) : mockInventory;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Inventory</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track materials, stock levels and inventory movements.
        </p>
      </div>

      <Card>
        <CardHeader title="Inventory" />
        <CardBody>
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <Th>Item</Th>
                  <Th>Quantity</Th>
                  <Th>Unit</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {inventoryRows.map((item) => (
                  <Tr key={item.id}>
                    <Td>
                      <div className="font-medium text-gray-900">
                        {item.material}
                      </div>
                    </Td>
                    <Td>
                      {item.stock}
                    </Td>
                    <Td>
                      {item.unit}
                    </Td>
                    <Td>
                      <Badge>
                        {item.stock > 0 ? 'In Stock' : 'Out of Stock'}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
