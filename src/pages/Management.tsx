import { useState } from 'react';
import { Search, Plus, Wrench, HardHat, Users, ShieldAlert, FileBarChart, Star, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardBody, StatCard } from '@/components/ui/Card';
import { Table, Th, Td, Tr } from '@/components/ui/Table';
import { StatusBadge, Badge, HealthBadge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { staff, workOrders, equipment, risks, qualityIssues } from '@/data/mockData';
import { formatFullCurrency, formatDate, formatDateShort } from '@/utils/format';

// ── HR & Staff ───────────────────────────────────────────────
export function HR() {
  const [search, setSearch] = useState('');
  const filtered = staff.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.role.toLowerCase().includes(search.toLowerCase()) || s.department.toLowerCase().includes(search.toLowerCase())
  );
  const departments = Array.from(new Set(staff.map((s) => s.department)));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Staff" value={String(staff.length)} icon={<Users size={20} />} accent="blue" />
        <StatCard label="Departments" value={String(departments.length)} icon={<HardHat size={20} />} accent="green" />
        <StatCard label="Active" value={String(staff.filter((s) => s.status === 'Active').length)} icon={<CheckCircle2 size={20} />} accent="green" />
        <StatCard label="On Leave" value={String(staff.filter((s) => s.status === 'On Leave').length)} icon={<AlertTriangle size={20} />} accent="amber" />
      </div>

      <Card>
        <CardHeader title="Staff Directory" subtitle={`${filtered.length} staff members`} action={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
              <Search size={14} className="text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff..." className="bg-transparent text-sm outline-none w-32 md:w-48" />
            </div>
            <button className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors">
              <Plus size={16} /> Add Staff
            </button>
          </div>
        } />
        <CardBody className="p-0">
          <Table>
            <thead>
              <tr>
                <Th>Employee</Th>
                <Th>Role</Th>
                <Th>Department</Th>
                <Th>Contact</Th>
                <Th>Assigned Project</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <Tr key={s.id}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-navy-100 text-navy-700 flex items-center justify-center text-xs font-bold">
                        {s.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.id}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-gray-600">{s.role}</Td>
                  <Td><Badge variant="blue">{s.department}</Badge></Td>
                  <Td>
                    <p className="text-xs text-gray-500">{s.phone}</p>
                    <p className="text-xs text-gray-400">{s.email}</p>
                  </Td>
                  <Td className="text-gray-500 text-xs">{s.assignedProject}</Td>
                  <Td><StatusBadge status={s.status} /></Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}

// ── Workshop ─────────────────────────────────────────────────
export function Workshop() {
  const deptStatus = [
    { dept: 'Carpentry', orders: 2, status: 'Busy', color: 'amber' as const },
    { dept: 'Mechanical', orders: 3, status: 'Active', color: 'blue' as const },
    { dept: 'Welding', orders: 0, status: 'Idle', color: 'gray' as const },
    { dept: 'Painting', orders: 0, status: 'Idle', color: 'gray' as const },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {deptStatus.map((d) => (
          <Card key={d.dept} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500">
                <Wrench size={18} />
              </div>
              <Badge variant={d.color}>{d.status}</Badge>
            </div>
            <p className="text-xs text-gray-400 font-medium">{d.dept}</p>
            <p className="text-xl font-bold text-gray-800 mt-1">{d.orders} <span className="text-sm font-normal text-gray-400">orders</span></p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Work Orders" subtitle={`${workOrders.length} orders`} action={
          <button className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors">
            <Plus size={16} /> New Order
          </button>
        } />
        <CardBody className="p-0">
          <Table>
            <thead>
              <tr>
                <Th>ID</Th>
                <Th>Title</Th>
                <Th>Department</Th>
                <Th>Assigned To</Th>
                <Th>Due Date</Th>
                <Th>Priority</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {workOrders.map((w) => (
                <Tr key={w.id}>
                  <Td className="font-mono text-xs text-gray-400">{w.id}</Td>
                  <Td className="font-medium text-gray-700">{w.title}</Td>
                  <Td><Badge variant="blue">{w.department}</Badge></Td>
                  <Td className="text-gray-500">{w.assignedTo}</Td>
                  <Td className="text-gray-500 text-xs">{formatDateShort(w.dueDate)}</Td>
                  <Td><StatusBadge status={w.priority} /></Td>
                  <Td><StatusBadge status={w.status} /></Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}

// ── Equipment ────────────────────────────────────────────────
export function EquipmentPage() {
  const inUse = equipment.filter((e) => e.status === 'In Use').length;
  const available = equipment.filter((e) => e.status === 'Available').length;
  const maintenance = equipment.filter((e) => e.status === 'Under Maintenance').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Equipment" value={String(equipment.length)} icon={<HardHat size={20} />} accent="blue" />
        <StatCard label="In Use" value={String(inUse)} icon={<HardHat size={20} />} accent="green" />
        <StatCard label="Available" value={String(available)} icon={<CheckCircle2 size={20} />} accent="blue" />
        <StatCard label="Under Maintenance" value={String(maintenance)} icon={<Wrench size={20} />} accent="amber" />
      </div>

      <Card>
        <CardHeader title="Equipment Register" subtitle={`${equipment.length} items`} action={
          <button className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors">
            <Plus size={16} /> Add Equipment
          </button>
        } />
        <CardBody className="p-0">
          <Table>
            <thead>
              <tr>
                <Th>Equipment</Th>
                <Th>Type</Th>
                <Th>Project</Th>
                <Th>Condition</Th>
                <Th>Last Service</Th>
                <Th>Next Service</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {equipment.map((e) => (
                <Tr key={e.id}>
                  <Td className="font-medium text-gray-700">{e.name}</Td>
                  <Td className="text-gray-500">{e.type}</Td>
                  <Td className="text-gray-500 text-xs">{e.project}</Td>
                  <Td><StatusBadge status={e.condition} /></Td>
                  <Td className="text-gray-500 text-xs">{formatDateShort(e.lastService)}</Td>
                  <Td className="text-gray-500 text-xs">{formatDateShort(e.nextService)}</Td>
                  <Td><StatusBadge status={e.status} /></Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}

// ── Risk & Quality ───────────────────────────────────────────
export function RiskQuality() {
  const [tab, setTab] = useState<'risks' | 'issues' | 'safety'>('risks');

  const openRisks = risks.filter((r) => r.status === 'Open').length;
  const openIssues = qualityIssues.filter((q) => q.status === 'Open' || q.status === 'In Progress').length;
  const safetyItems = qualityIssues.filter((q) => q.type === 'Safety Observation');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Risks" value={String(risks.length)} icon={<ShieldAlert size={20} />} accent="blue" />
        <StatCard label="Open Risks" value={String(openRisks)} icon={<AlertTriangle size={20} />} accent="red" />
        <StatCard label="Quality Issues" value={String(qualityIssues.length)} icon={<Wrench size={20} />} accent="amber" />
        <StatCard label="Safety Obs." value={String(safetyItems.length)} icon={<ShieldAlert size={20} />} accent="orange" />
      </div>

      <div className="flex items-center gap-1 border-b border-gray-200">
        {[
          { key: 'risks', label: 'Risk Register' },
          { key: 'issues', label: 'Issues & Snags' },
          { key: 'safety', label: 'Safety Observations' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'risks' && (
        <Card>
          <CardHeader title="Risk Register" subtitle={`${risks.length} risks`} />
          <CardBody className="p-0">
            <Table>
              <thead>
                <tr>
                  <Th>ID</Th>
                  <Th>Risk</Th>
                  <Th>Project</Th>
                  <Th>Probability</Th>
                  <Th>Impact</Th>
                  <Th>Owner</Th>
                  <Th>Status</Th>
                  <Th>Mitigation</Th>
                </tr>
              </thead>
              <tbody>
                {risks.map((r) => (
                  <Tr key={r.id}>
                    <Td className="font-mono text-xs text-gray-400">{r.id}</Td>
                    <Td className="font-medium text-gray-700">{r.risk}</Td>
                    <Td className="text-gray-500 text-xs">{r.project}</Td>
                    <Td><StatusBadge status={r.probability} /></Td>
                    <Td><StatusBadge status={r.impact} /></Td>
                    <Td className="text-gray-500">{r.owner}</Td>
                    <Td><StatusBadge status={r.status} /></Td>
                    <Td className="text-gray-500 text-xs">{r.mitigation}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      )}

      {tab === 'issues' && (
        <Card>
          <CardHeader title="Issues, Snags & Defects" subtitle={`${qualityIssues.length} items`} />
          <CardBody className="p-0">
            <Table>
              <thead>
                <tr>
                  <Th>ID</Th>
                  <Th>Type</Th>
                  <Th>Description</Th>
                  <Th>Project</Th>
                  <Th>Location</Th>
                  <Th>Reported By</Th>
                  <Th>Date</Th>
                  <Th>Status</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody>
                {qualityIssues.map((q) => (
                  <Tr key={q.id}>
                    <Td className="font-mono text-xs text-gray-400">{q.id}</Td>
                    <Td><Badge variant={q.type === 'Safety Observation' ? 'red' : q.type === 'Defect' ? 'amber' : 'orange'}>{q.type}</Badge></Td>
                    <Td className="font-medium text-gray-700">{q.description}</Td>
                    <Td className="text-gray-500 text-xs">{q.project}</Td>
                    <Td className="text-gray-500 text-xs">{q.location}</Td>
                    <Td className="text-gray-500">{q.reportedBy}</Td>
                    <Td className="text-gray-500 text-xs">{formatDateShort(q.date)}</Td>
                    <Td><StatusBadge status={q.status} /></Td>
                    <Td className="text-gray-500 text-xs">{q.action}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      )}

      {tab === 'safety' && (
        <div className="space-y-4">
          {safetyItems.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <ShieldAlert size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-gray-700">{s.description}</p>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="text-xs text-gray-400">{s.project} · {s.location} · {s.reportedBy} · {formatDateShort(s.date)}</p>
                  <p className="text-sm text-gray-600 mt-2"><span className="font-medium">Corrective Action:</span> {s.action}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Reports ───────────────────────────────────────────────────
export function Reports() {
  const reports = [
    { name: 'Monthly Project Summary', desc: 'Overview of all active projects', date: '2026-09-01', type: 'Monthly' },
    { name: 'Financial Performance', desc: 'Revenue, cost, and margin analysis', date: '2026-09-01', type: 'Financial' },
    { name: 'Risk & Safety Report', desc: 'Open risks and safety observations', date: '2026-08-28', type: 'Safety' },
    { name: 'Procurement Summary', desc: 'Purchase orders and supplier performance', date: '2026-08-25', type: 'Procurement' },
    { name: 'Resource Utilisation', desc: 'Staff and equipment allocation', date: '2026-08-20', type: 'Resources' },
    { name: 'Client Status Report', desc: 'Client accounts and outstanding balances', date: '2026-08-15', type: 'Client' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Reports" subtitle="Generated reports and summaries" />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((r) => (
              <div key={r.name} className="border border-gray-200 rounded-xl p-4 hover:shadow-card-hover hover:border-gray-300 cursor-pointer transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <FileBarChart size={20} />
                  </div>
                  <Badge variant="gray">{r.type}</Badge>
                </div>
                <h3 className="text-sm font-semibold text-gray-800">{r.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{r.desc}</p>
                <p className="text-xs text-gray-400 mt-3">Generated: {formatDate(r.date)}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
