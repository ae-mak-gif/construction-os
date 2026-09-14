import { useState } from 'react';
import {
  Building2,
  Calendar,
  FileText,
  DollarSign,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  MessageSquare,
  Download,
  Eye,
  ArrowLeft,
  TrendingUp,
} from 'lucide-react';
import { Card, CardHeader, CardBody, StatCard } from '@/components/ui/Card';
import { Table, Th, Td, Tr } from '@/components/ui/Table';
import { Badge, StatusBadge, HealthBadge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { projects, projectUpdates, invoices, projectDocuments } from '@/data/mockData';
import { formatCurrency, formatFullCurrency, formatDate, formatDateShort } from '@/utils/format';

export function ClientPortal({ onExit }: { onExit: () => void }) {
  const [selectedProject, setSelectedProject] = useState(projects[0]);

  const projectInvoices = invoices.filter((i) => i.project === selectedProject.name);
  const projectDocs = projectDocuments.filter((d) => d.projectId === selectedProject.id);
  const projectUpdatesFiltered = projectUpdates.filter((u) => u.projectId === selectedProject.id);
  const paid = projectInvoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + i.paidAmount, 0);
  const outstanding = projectInvoices.filter((i) => i.status !== 'Paid').reduce((s, i) => s + (i.amount - i.paidAmount), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Client portal header */}
      <div className="bg-gradient-to-r from-navy-800 to-navy-900 text-white">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-white/10 flex items-center justify-center">
                <Building2 size={24} />
              </div>
              <div>
                <h1 className="text-lg font-bold">ABC Construction — Client Portal</h1>
                <p className="text-xs text-navy-300">Welcome back, {selectedProject.client}</p>
              </div>
            </div>
            <button
              onClick={onExit}
              className="flex items-center gap-1.5 text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              <ArrowLeft size={14} /> Back to Construction OS
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 space-y-6">
        {/* Project selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProject(p)}
              className={`px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedProject.id === p.id ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Project overview stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Progress" value={`${selectedProject.progress}%`} icon={<TrendingUp size={20} />} accent="blue" />
          <StatCard label="Contract Value" value={formatCurrency(selectedProject.contractValue)} icon={<DollarSign size={20} />} accent="green" />
          <StatCard label="Paid" value={formatCurrency(paid)} icon={<CheckCircle2 size={20} />} accent="green" />
          <StatCard label="Outstanding" value={formatCurrency(outstanding)} icon={<Clock size={20} />} accent="red" />
        </div>

        {/* Progress + timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader title="Project Progress" subtitle={selectedProject.name} />
            <CardBody>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-500">Overall Completion</span>
                    <span className="font-semibold text-gray-700">{selectedProject.progress}%</span>
                  </div>
                  <ProgressBar
                    value={selectedProject.progress}
                    color={selectedProject.health === 'on-track' ? 'green' : selectedProject.health === 'at-risk' ? 'amber' : 'red'}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-gray-400">Start Date</p>
                    <p className="text-sm text-gray-700 font-medium">{formatDate(selectedProject.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Expected Completion</p>
                    <p className="text-sm text-gray-700 font-medium">{formatDate(selectedProject.deadline)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Project Manager</p>
                    <p className="text-sm text-gray-700 font-medium">{selectedProject.manager}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Status</p>
                    <div className="mt-0.5"><HealthBadge health={selectedProject.health} /></div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Latest Updates" />
            <CardBody>
              <div className="space-y-3">
                {projectUpdatesFiltered.slice(0, 3).map((u) => (
                  <div key={u.id} className="flex items-start gap-2">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      u.type === 'milestone' ? 'bg-emerald-500' :
                      u.type === 'issue' ? 'bg-red-500' :
                      u.type === 'client' ? 'bg-blue-500' : 'bg-gray-400'
                    }`} />
                    <div>
                      <p className="text-xs text-gray-700">{u.message}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{u.author} · {formatDateShort(u.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Progress photos */}
        <Card>
          <CardHeader title="Progress Photos" subtitle="Recent site photographs" />
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Foundation Pour', date: 'Sep 1', color: 'from-blue-400 to-blue-600' },
                { label: 'Ground Floor', date: 'Aug 15', color: 'from-emerald-400 to-emerald-600' },
                { label: 'First Floor Slab', date: 'Aug 28', color: 'from-orange-400 to-orange-600' },
                { label: 'Site Overview', date: 'Sep 5', color: 'from-navy-400 to-navy-600' },
              ].map((p) => (
                <div key={p.label} className="relative group cursor-pointer">
                  <div className={`h-32 rounded-lg bg-gradient-to-br ${p.color} flex items-end p-3`}>
                    <div className="text-white">
                      <p className="text-sm font-semibold">{p.label}</p>
                      <p className="text-xs opacity-80">{p.date}</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Eye size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Invoices & Documents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="Invoices & Payments" subtitle={`${projectInvoices.length} invoices`} />
            <CardBody className="p-0">
              <Table>
                <thead>
                  <tr>
                    <Th>Invoice</Th>
                    <Th>Amount</Th>
                    <Th>Due Date</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {projectInvoices.map((inv) => (
                    <Tr key={inv.id}>
                      <Td className="font-mono text-xs text-gray-400">{inv.id}</Td>
                      <Td className="font-medium text-gray-700">{formatFullCurrency(inv.amount)}</Td>
                      <Td className="text-gray-500 text-xs">{formatDateShort(inv.dueDate)}</Td>
                      <Td><StatusBadge status={inv.status} /></Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
              <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm text-gray-500">Outstanding Balance</span>
                <span className="text-sm font-bold text-red-600">{formatFullCurrency(outstanding)}</span>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Documents" subtitle={`${projectDocs.length} documents`} />
            <CardBody className="p-0">
              <Table>
                <thead>
                  <tr>
                    <Th>Name</Th>
                    <Th>Type</Th>
                    <Th>Date</Th>
                    <Th></Th>
                  </tr>
                </thead>
                <tbody>
                  {projectDocs.map((d) => (
                    <Tr key={d.id}>
                      <Td className="font-medium text-gray-700 text-xs">{d.name}</Td>
                      <Td><Badge variant="blue">{d.type}</Badge></Td>
                      <Td className="text-gray-500 text-xs">{formatDateShort(d.date)}</Td>
                      <Td><button className="text-gray-400 hover:text-gray-600"><Download size={14} /></button></Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </div>

        {/* Approvals + Messages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="Pending Approvals" />
            <CardBody>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-700">BOQ Revision — Phase 2</p>
                    <p className="text-xs text-gray-400 mt-0.5">Submitted by Tafadzwa Moyo · 2 days ago</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="text-xs font-medium text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-50">Approve</button>
                    <button className="text-xs font-medium text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50">Reject</button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Variation Order — Pool Design Change</p>
                    <p className="text-xs text-gray-400 mt-0.5">Submitted by Tafadzwa Moyo · 5 days ago</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="text-xs font-medium text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-50">Approve</button>
                    <button className="text-xs font-medium text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50">Reject</button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Messages" subtitle="Communication with your project team" />
            <CardBody>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700">Hi, can we schedule a site visit next week? I want to see the progress on the 2nd floor.</p>
                  <p className="text-xs text-gray-400 mt-1">You · 10:42 AM</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700">Good morning! We can arrange a visit for Wednesday at 10 AM. Does that work for you?</p>
                  <p className="text-xs text-gray-400 mt-1">Tafadzwa Moyo · 11:05 AM</p>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <input placeholder="Type a message..." className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
                  <button className="bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-700">
                    <MessageSquare size={14} />
                  </button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
