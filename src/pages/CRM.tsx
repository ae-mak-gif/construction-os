import { useState } from 'react';
import { Search, Plus, ArrowRight, Phone, Mail, Building2 } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Table, Th, Td, Tr } from '@/components/ui/Table';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  enquiries as initialEnquiries,
  clients as initialClients,
  type Enquiry,
  type EnquiryStage,
  type Client,
} from '@/data/mockData';
import { formatCurrency, formatDate } from '@/utils/format';
import { useBuildFlowData } from '@/context/BuildFlowDataContext';

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

function preserveDemoRows<T extends { id: string }>(liveRows: T[], demoRows: T[]): T[] {
  const liveIds = new Set(liveRows.map((row) => row.id));
  return [...liveRows, ...demoRows.filter((row) => !liveIds.has(row.id))];
}

const stages: EnquiryStage[] = [
  'New',
  'Contacted',
  'Qualified',
  'Quoted',
  'Won',
  'Lost',
];

export function Enquiries() {
  const { create, update, remove, records } = useBuildFlowData();
  const clientRows = records.clients ?? [];
  const contactById = new Map((records.contacts ?? []).map((row) => [row.id, row]));
  const clientById = new Map(clientRows.map((row) => [row.id, row]));
  const liveClients: Client[] = clientRows.map((row) => {
    const contact = (records.contacts ?? []).find((item) => item.client_id === row.id && item.is_primary) ?? (records.contacts ?? []).find((item) => item.client_id === row.id);
    return { id: row.id, name: contact ? [contact.first_name, contact.last_name].filter(Boolean).join(' ') : String(row.name ?? ''), company: String(row.name ?? ''), email: String(contact?.email ?? row.email ?? ''), phone: String(contact?.phone ?? row.phone ?? ''), activeProjects: (records.projects ?? []).filter((project) => project.client_id === row.id && project.status === 'active').length, accountBalance: 0, status: row.status === 'prospect' ? 'Prospect' : row.status === 'inactive' ? 'Inactive' : 'Active', since: String(row.created_at ?? '').slice(0, 7) } as Client;
  });
  const liveEnquiries: Enquiry[] = (records.enquiries ?? []).map((row) => {
    const client = clientById.get(String(row.client_id)); const contact = contactById.get(String(row.contact_id));
    const stage = row.status === 'proposal' ? 'Quoted' : row.status === 'won' ? 'Won' : row.status === 'lost' ? 'Lost' : row.status === 'qualified' ? 'Qualified' : row.status === 'contacted' || row.status === 'on_hold' ? 'Contacted' : 'New';
    return { id: row.id, client: contact ? [contact.first_name, contact.last_name].filter(Boolean).join(' ') : String(client?.name ?? 'Prospect'), company: String(client?.name ?? ''), project: String(row.title ?? ''), value: Number(row.estimated_value ?? 0), stage, date: String(row.created_at ?? '').slice(0, 10), source: String(row.source ?? ''), phone: String(contact?.phone ?? ''), email: String(contact?.email ?? '') } as Enquiry;
  });
  const [enquiries, setEnquiries] = useState<Enquiry[]>(preserveDemoRows(liveEnquiries, initialEnquiries));
  // Derive the visible list from immutable demo fixtures plus the latest live snapshot.
  // This prevents an early state initialisation from hiding demo rows after hydration.
  const clients = preserveDemoRows(liveClients, initialClients);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] =
    useState<EnquiryStage | 'All'>('All');
  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [showNew, setShowNew] = useState(false);

  const [form, setForm] = useState({
    client: '',
    company: '',
    project: '',
    value: '',
    source: 'Website',
    phone: '',
    email: '',
  });

  const filtered = enquiries.filter(
    (e) =>
      (stageFilter === 'All' || e.stage === stageFilter) &&
      (e.client.toLowerCase().includes(search.toLowerCase()) ||
        e.project.toLowerCase().includes(search.toLowerCase()) ||
        e.company.toLowerCase().includes(search.toLowerCase()))
  );

  const stageCounts = stages.map((s) => ({
    stage: s,
    count: enquiries.filter((e) => e.stage === s).length,
  }));

  async function createEnquiry() {
    if (!form.client || !form.company || !form.project || !form.value) return;

    const newEnquiry: Enquiry = {
      id: `E${String(enquiries.length + 1).padStart(3, '0')}`,
      client: form.client,
      company: form.company,
      project: form.project,
      value: Number(form.value),
      stage: 'New',
      date: new Date().toISOString().split('T')[0],
      source: form.source,
      phone: form.phone,
      email: form.email,
    };

    let clientId: string | null = null;
    let contactId: string | null = null;
    try {
      const clientRow = await create('clients', { name: form.company, client_type: 'company', status: 'prospect' });
      clientId = clientRow.id;
      const nameParts = form.client.trim().split(/\s+/);
      const contactRow = await create('contacts', { client_id: clientRow.id, first_name: nameParts[0] || form.client, last_name: nameParts.slice(1).join(' ') || null, email: form.email || null, phone: form.phone || null, is_primary: true });
      contactId = contactRow.id;
      const enquiryRow = await create('enquiries', { client_id: clientRow.id, contact_id: contactRow.id, title: form.project, description: `Prospect: ${form.client} · ${form.company}`, source: form.source, status: 'new', estimated_value: Number(form.value) });
      newEnquiry.id = enquiryRow.id;
    } catch (error) {
      if (contactId) await remove('contacts', contactId).catch(() => undefined);
      if (clientId) await remove('clients', clientId).catch(() => undefined);
      console.error('Unable to save enquiry to BuildFlow:', error);
      window.alert(error instanceof Error ? error.message : 'Unable to save this enquiry. Please try again.');
      return;
    }
    setEnquiries((prev) => [newEnquiry, ...prev]);

    setForm({
      client: '',
      company: '',
      project: '',
      value: '',
      source: 'Website',
      phone: '',
      email: '',
    });

    setShowNew(false);
  }

  function moveStage() {
    if (!selected) return;

    const currentIndex = stages.indexOf(selected.stage);
    const nextStage = stages[currentIndex + 1];

    if (!nextStage || nextStage === 'Lost') return;

    const updated = {
      ...selected,
      stage: nextStage,
    };

    if (isUuid(selected.id)) {
      const status = nextStage === 'Quoted' ? 'proposal' : nextStage.toLowerCase();
      void update('enquiries', selected.id, { status }).catch((error) => window.alert(error.message));
    }
    setEnquiries((prev) =>
      prev.map((e) => (e.id === selected.id ? updated : e))
    );

    setSelected(updated);
  }

  async function convertToClient() {
    if (!selected) return;

    const persistedClient = (records.clients ?? []).find(
      (client) => String(client.name).toLowerCase() === selected.company.toLowerCase()
    );

    if (!persistedClient) {
      let clientId: string | null = null;
      let contactId: string | null = null;
      try {
        const clientRow = await create('clients', { name: selected.company, client_type: 'company', status: 'active' });
        clientId = clientRow.id;
        const parts = selected.client.trim().split(/\s+/);
        const contactRow = await create('contacts', { client_id: clientRow.id, first_name: parts[0] || selected.client, last_name: parts.slice(1).join(' ') || null, email: selected.email || null, phone: selected.phone || null, is_primary: true });
        contactId = contactRow.id;
        // The shared data context adds the saved row to records; the client list
        // derives from that live snapshot plus the immutable demo fixtures.
      } catch (error) {
        if (contactId) await remove('contacts', contactId).catch(() => undefined);
        if (clientId) await remove('clients', clientId).catch(() => undefined);
        console.error('Unable to convert enquiry:', error);
        window.alert(error instanceof Error ? error.message : 'Unable to convert this enquiry.');
        return;
      }
    }

    if (persistedClient && persistedClient.status !== 'active') {
      void update('clients', persistedClient.id, { status: 'active' }).catch((error) => window.alert(error.message));
    }
    if (isUuid(selected.id)) {
      void update('enquiries', selected.id, { status: 'won' }).catch((error) => window.alert(error.message));
    }

    const updated = {
      ...selected,
      stage: 'Won' as EnquiryStage,
    };

    setEnquiries((prev) =>
      prev.map((e) => (e.id === selected.id ? updated : e))
    );

    setSelected(updated);
  }

  return (
    <div className="space-y-6">
      {/* Pipeline summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stageCounts.map((s) => (
          <Card
            key={s.stage}
            className={`p-4 cursor-pointer transition-all ${
              stageFilter === s.stage
                ? 'ring-2 ring-brand-400'
                : 'hover:shadow-card-hover'
            }`}
          >
            <div
              onClick={() =>
                setStageFilter(
                  stageFilter === s.stage ? 'All' : s.stage
                )
              }
            >
              <p className="text-xs text-gray-400 font-medium">
                {s.stage}
              </p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {s.count}
              </p>
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

              <button
                onClick={() => setShowNew(true)}
                className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors"
              >
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
                  <Td className="font-mono text-xs text-gray-400">
                    {e.id}
                  </Td>

                  <Td>
                    <p className="font-medium text-gray-700">
                      {e.client}
                    </p>
                    <p className="text-xs text-gray-400">
                      {e.company}
                    </p>
                  </Td>

                  <Td className="text-gray-600">{e.project}</Td>

                  <Td className="font-semibold text-gray-700">
                    {formatCurrency(e.value)}
                  </Td>

                  <Td>
                    <StatusBadge status={e.stage} />
                  </Td>

                  <Td>
                    <Badge variant="gray">{e.source}</Badge>
                  </Td>

                  <Td className="text-gray-500 text-xs">
                    {formatDate(e.date)}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </CardBody>
      </Card>

      {/* Enquiry detail */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={`Enquiry ${selected?.id || ''}`}
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {selected.project}
                </h3>
                <p className="text-sm text-gray-400">
                  {selected.company}
                </p>
              </div>

              <StatusBadge status={selected.stage} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Client" value={selected.client} />
              <InfoRow
                label="Value"
                value={formatCurrency(selected.value)}
              />
              <InfoRow label="Source" value={selected.source} />
              <InfoRow
                label="Date"
                value={formatDate(selected.date)}
              />
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone size={14} className="text-gray-400" />
                {selected.phone}
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail size={14} className="text-gray-400" />
                {selected.email}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
              {selected.stage !== 'Won' &&
                selected.stage !== 'Lost' && (
                  <button
                    onClick={moveStage}
                    className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
                  >
                    Move Stage <ArrowRight size={14} />
                  </button>
                )}

              {selected.stage !== 'Won' && (
                <button
                  onClick={convertToClient}
                  className="text-sm font-medium text-gray-600 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Convert to Client
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* New enquiry modal */}
      <Modal
        open={showNew}
        onClose={() => setShowNew(false)}
        title="New Enquiry"
      >
        <div className="space-y-4">
          <Input
            label="Client Name"
            value={form.client}
            onChange={(value) =>
              setForm({ ...form, client: value })
            }
            placeholder="e.g. John Smith"
          />

          <Input
            label="Company"
            value={form.company}
            onChange={(value) =>
              setForm({ ...form, company: value })
            }
            placeholder="e.g. Smith Properties"
          />

          <Input
            label="Project"
            value={form.project}
            onChange={(value) =>
              setForm({ ...form, project: value })
            }
            placeholder="Project name"
          />

          <Input
            label="Estimated Value"
            type="number"
            value={form.value}
            onChange={(value) =>
              setForm({ ...form, value })
            }
            placeholder="e.g. 750000"
          />

          <Input
            label="Phone"
            value={form.phone}
            onChange={(value) =>
              setForm({ ...form, phone: value })
            }
            placeholder="+263..."
          />

          <Input
            label="Email"
            value={form.email}
            onChange={(value) =>
              setForm({ ...form, email: value })
            }
            placeholder="client@example.com"
          />

          <div>
            <label className="text-xs text-gray-500 font-medium">
              Source
            </label>

            <select
              value={form.source}
              onChange={(e) =>
                setForm({
                  ...form,
                  source: e.target.value,
                })
              }
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400"
            >
              <option>Website</option>
              <option>Referral</option>
              <option>LinkedIn</option>
              <option>Walk-in</option>
              <option>Direct</option>
              <option>WhatsApp</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              onClick={() => setShowNew(false)}
              className="px-4 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              onClick={createEnquiry}
              className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700"
            >
              Create Enquiry
            </button>
          </div>
        </div>
      </Modal>

      {/* Keep Clients data available for the CRM workflow */}
      <div className="hidden">{clients.length}</div>
    </div>
  );
}

export function Clients() {
  const { create, remove, records } = useBuildFlowData();
  const liveClients: Client[] = (records.clients ?? []).map((row) => {
    const contact = (records.contacts ?? []).find((item) => item.client_id === row.id && item.is_primary) ?? (records.contacts ?? []).find((item) => item.client_id === row.id);
    return { id: row.id, name: contact ? [contact.first_name, contact.last_name].filter(Boolean).join(' ') : String(row.name ?? ''), company: String(row.name ?? ''), email: String(contact?.email ?? row.email ?? ''), phone: String(contact?.phone ?? row.phone ?? ''), activeProjects: (records.projects ?? []).filter((project) => project.client_id === row.id && project.status === 'active').length, accountBalance: 0, status: row.status === 'prospect' ? 'Prospect' : row.status === 'inactive' ? 'Inactive' : 'Active', since: String(row.created_at ?? '').slice(0, 7) } as Client;
  });
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Client | null>(null);
  // Always derive from immutable demo fixtures and the latest live snapshot.
  const clients = preserveDemoRows(liveClients, initialClients);

  const [showNew, setShowNew] = useState(false);

  const [form, setForm] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
  });

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase())
  );

  async function createClient() {
    if (!form.name || !form.company) return;

    let clientId: string | null = null;
    let contactId: string | null = null;
    try {
      const clientRow = await create('clients', { name: form.company, client_type: 'company', email: form.email || null, phone: form.phone || null, status: 'active' });
      clientId = clientRow.id;
      const parts = form.name.trim().split(/\s+/);
      const contactRow = await create('contacts', { client_id: clientRow.id, first_name: parts[0] || form.name, last_name: parts.slice(1).join(' ') || null, email: form.email || null, phone: form.phone || null, is_primary: true });
      contactId = contactRow.id;
    } catch (error) {
      if (contactId) await remove('contacts', contactId).catch(() => undefined);
      if (clientId) await remove('clients', clientId).catch(() => undefined);
      console.error('Unable to save client to BuildFlow:', error);
      window.alert(error instanceof Error ? error.message : 'Unable to save this client. Please try again.');
      return;
    }
    setForm({
      name: '',
      company: '',
      phone: '',
      email: '',
    });

    setShowNew(false);
  }

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

              <button
                onClick={() => setShowNew(true)}
                className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors"
              >
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
                <Tr
                  key={c.id}
                  onClick={() => setSelected(c)}
                >
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-navy-100 text-navy-700 flex items-center justify-center text-xs font-bold">
                        {c.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>

                      <span className="font-medium text-gray-700">
                        {c.name}
                      </span>
                    </div>
                  </Td>

                  <Td className="text-gray-600">
                    {c.company}
                  </Td>

                  <Td>
                    <p className="text-xs text-gray-500">
                      {c.phone}
                    </p>
                    <p className="text-xs text-gray-400">
                      {c.email}
                    </p>
                  </Td>

                  <Td>
                    <span className="font-semibold text-gray-700">
                      {c.activeProjects}
                    </span>
                  </Td>

                  <Td>
                    <span
                      className={
                        c.accountBalance > 0
                          ? 'text-red-600 font-semibold'
                          : c.accountBalance < 0
                          ? 'text-emerald-600 font-semibold'
                          : 'text-gray-500'
                      }
                    >
                      {c.accountBalance > 0
                        ? formatCurrency(c.accountBalance)
                        : c.accountBalance < 0
                        ? `-${formatCurrency(
                            Math.abs(c.accountBalance)
                          )}`
                        : '$0'}
                    </span>
                  </Td>

                  <Td>
                    <StatusBadge status={c.status} />
                  </Td>

                  <Td className="text-gray-500 text-xs">
                    {c.since}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </CardBody>
      </Card>

      {/* Client details */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Client Details"
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-navy-100 text-navy-700 flex items-center justify-center text-lg font-bold">
                {selected.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {selected.name}
                </h3>

                <p className="text-sm text-gray-400 flex items-center gap-1">
                  <Building2 size={12} />
                  {selected.company}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
              <InfoRow
                label="Phone"
                value={selected.phone}
              />

              <InfoRow
                label="Email"
                value={selected.email}
              />

              <InfoRow
                label="Active Projects"
                value={String(selected.activeProjects)}
              />

              <InfoRow
                label="Account Balance"
                value={
                  selected.accountBalance > 0
                    ? formatCurrency(selected.accountBalance)
                    : '$0'
                }
              />

              <InfoRow
                label="Client Since"
                value={selected.since}
              />

              <InfoRow
                label="Status"
                value={selected.status}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Add Client modal */}
      <Modal
        open={showNew}
        onClose={() => setShowNew(false)}
        title="Add Client"
      >
        <div className="space-y-4">
          <Input
            label="Client Name"
            value={form.name}
            onChange={(value) =>
              setForm({ ...form, name: value })
            }
            placeholder="e.g. John Smith"
          />

          <Input
            label="Company"
            value={form.company}
            onChange={(value) =>
              setForm({ ...form, company: value })
            }
            placeholder="e.g. Smith Properties"
          />

          <Input
            label="Phone"
            value={form.phone}
            onChange={(value) =>
              setForm({ ...form, phone: value })
            }
            placeholder="+263..."
          />

          <Input
            label="Email"
            value={form.email}
            onChange={(value) =>
              setForm({ ...form, email: value })
            }
            placeholder="client@example.com"
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              onClick={() => setShowNew(false)}
              className="px-4 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              onClick={createClient}
              className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700"
            >
              Add Client
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs text-gray-500 font-medium">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400"
      />
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