import { useState } from 'react';
import { Search, Plus, ArrowRight, Phone, Mail, Building2 } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Table, Th, Td, Tr } from '@/components/ui/Table';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { enquiries, clients, type Enquiry, type EnquiryStage } from '@/data/mockData';
import { formatCurrency, formatDate } from '@/utils/format';

const stages: EnquiryStage[] = ['New', 'Contacted', 'Qualified', 'Quoted', 'Won', 'Lost'];

export function Enquiries() {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<EnquiryStage | 'All'>('All');
  const [selected, setSelected] = useState<Enquiry | null>(null);

  const filtered = enquiries.filter(
    (e) =>
      (stageFilter === 'All' || e.stage === stageFilter) &&
      (e.client.toLowerCase().includes(search.toLowerCase()) ||
        e.project.toLowerCase().includes(search.toLowerCase()) ||
        e.company.toLowerCase().includes(search.toLowerCase()))
  );

  const stageCounts = stages.map((s) => ({ stage: s, count: enquiries.filter((e) => e.stage === s).length }));

  return (
    <div className="space-y-6">
      {/* Pipeline summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stageCounts.map((s) => (
          <Card
            key={s.stage}
            className={`p-4 cursor-pointer transition-all ${stageFilter === s.stage ? 'ring-2 ring-brand-400' : 'hover:shadow-card-hover'}`}
          >
            <div onClick={() => setStageFilter(stageFilter === s.stage ? 'All' : s.stage)}>
              <p className="text-xs text-gray-400 font-medium">{s.stage}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{s.count}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Search + table */}
      <Card>
        <CardHeader
          title="Enquiries Pipeline"
          subtitle={`${filtered.length} enquiries`}
          action={
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                <Search size={14} className="text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="bg-transparent text-sm outline-none w-32 md:w-48"
                />
              </div>
              <button className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors">
                <Plus size={16} /> New
              </button>
            </div>
          }
        />
        <CardBody className="p-0">
          <Table>
            <thead>
              <tr>
                <Th>Enquiry ID</Th>
                <Th>Client</Th>
                <Th>Project</Th>
                <Th>Value</Th>
                <Th>Stage</Th>
                <Th>Source</Th>
                <Th>Date</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <Tr key={e.id} onClick={() => setSelected(e)}>
                  <Td className="font-mono text-xs text-gray-400">{e.id}</Td>
                  <Td>
                    <p className="font-medium text-gray-700">{e.client}</p>
                    <p className="text-xs text-gray-400">{e.company}</p>
                  </Td>
                  <Td className="text-gray-600">{e.project}</Td>
                  <Td className="font-semibold text-gray-700">{formatCurrency(e.value)}</Td>
                  <Td><StatusBadge status={e.stage} /></Td>
                  <Td><Badge variant="gray">{e.source}</Badge></Td>
                  <Td className="text-gray-500 text-xs">{formatDate(e.date)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </CardBody>
      </Card>

      {/* Detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Enquiry ${selected?.id || ''}`}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{selected.project}</h3>
                <p className="text-sm text-gray-400">{selected.company}</p>
              </div>
              <StatusBadge status={selected.stage} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Client" value={selected.client} />
              <InfoRow label="Value" value={formatCurrency(selected.value)} />
              <InfoRow label="Source" value={selected.source} />
              <InfoRow label="Date" value={formatDate(selected.date)} />
            </div>
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone size={14} className="text-gray-400" /> {selected.phone}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail size={14} className="text-gray-400" /> {selected.email}
              </div>
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              <button className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors">
                Convert to Client <ArrowRight size={14} />
              </button>
              <button className="text-sm font-medium text-gray-500 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                Move Stage
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export function Clients() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<typeof clients[0] | null>(null);

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Clients"
          subtitle={`${filtered.length} clients`}
          action={
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                <Search size={14} className="text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search clients..."
                  className="bg-transparent text-sm outline-none w-32 md:w-48"
                />
              </div>
              <button className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors">
                <Plus size={16} /> Add Client
              </button>
            </div>
          }
        />
        <CardBody className="p-0">
          <Table>
            <thead>
              <tr>
                <Th>Client</Th>
                <Th>Company</Th>
                <Th>Contact</Th>
                <Th>Active Projects</Th>
                <Th>Account Balance</Th>
                <Th>Status</Th>
                <Th>Since</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <Tr key={c.id} onClick={() => setSelected(c)}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-navy-100 text-navy-700 flex items-center justify-center text-xs font-bold">
                        {c.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <span className="font-medium text-gray-700">{c.name}</span>
                    </div>
                  </Td>
                  <Td className="text-gray-600">{c.company}</Td>
                  <Td>
                    <p className="text-xs text-gray-500">{c.phone}</p>
                    <p className="text-xs text-gray-400">{c.email}</p>
                  </Td>
                  <Td>
                    <span className="font-semibold text-gray-700">{c.activeProjects}</span>
                  </Td>
                  <Td>
                    <span className={c.accountBalance > 0 ? 'text-red-600 font-semibold' : c.accountBalance < 0 ? 'text-emerald-600 font-semibold' : 'text-gray-500'}>
                      {c.accountBalance > 0 ? formatCurrency(c.accountBalance) : c.accountBalance < 0 ? `-${formatCurrency(Math.abs(c.accountBalance))}` : '$0'}
                    </span>
                  </Td>
                  <Td><StatusBadge status={c.status} /></Td>
                  <Td className="text-gray-500 text-xs">{c.since}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </CardBody>
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Client Details">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-navy-100 text-navy-700 flex items-center justify-center text-lg font-bold">
                {selected.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{selected.name}</h3>
                <p className="text-sm text-gray-400 flex items-center gap-1">
                  <Building2 size={12} /> {selected.company}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
              <InfoRow label="Phone" value={selected.phone} />
              <InfoRow label="Email" value={selected.email} />
              <InfoRow label="Active Projects" value={String(selected.activeProjects)} />
              <InfoRow label="Account Balance" value={selected.accountBalance > 0 ? formatCurrency(selected.accountBalance) : '$0'} />
              <InfoRow label="Client Since" value={selected.since} />
              <InfoRow label="Status" value={selected.status} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-sm text-gray-700 mt-0.5">{value}</p>
    </div>
  );
}
