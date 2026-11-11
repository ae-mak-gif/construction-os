import { useEffect, useState } from 'react';
import { AIAssistant } from '@/pages/AIAssistant';
import { useAuth } from '@/context/AuthContext';
import { projects, tasks, risks, purchaseRequests } from '@/data/mockData';
import {
  ArrowUpRight,
  Bot,
  FolderKanban,
  ListChecks,
  CalendarDays,
  FileText,
  LockKeyhole,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Users,
} from 'lucide-react';

const specialistAgents = [
  { name: 'Executive Orchestrator', detail: 'Routes requests and coordinates specialist work', icon: Bot, status: 'Core layer' },
  { name: 'Executive Admin', detail: 'Inbox, calendar, meeting preparation and executive support', icon: CalendarDays, status: 'Planned' },
  { name: 'Business & Finance', detail: 'Cash flow, invoices, budgets and commercial signals', icon: ShieldCheck, status: 'Planned' },
  { name: 'Project Intelligence', detail: 'Progress, programme, delays and project exposure', icon: FolderKanban, status: 'Planned' },
  { name: 'Procurement', detail: 'Purchase requests, supplier and materials visibility', icon: ShoppingCart, status: 'Planned' },
  { name: 'People & Workforce', detail: 'Capacity, assignments and workforce coordination', icon: Users, status: 'Planned' },
  { name: 'Research & Documents', detail: 'Research, document intelligence and executive briefings', icon: FileText, status: 'Planned' },
  { name: 'Delegation & Accountability', detail: 'Follow-ups, commitments and ownership', icon: ListChecks, status: 'Planned' },
  { name: 'Risk & Compliance', detail: 'HSE, contractual, regulatory and business exposure', icon: ShieldCheck, status: 'Planned' },
];

export function VEA() {
  const { profile, membership } = useAuth();
  const firstName = profile?.full_name?.trim().split(/\s+/)[0] || 'there';
  const activeProjects = projects.filter((project) => project.status === 'Active').length;
  const watchProjects = projects.filter((project) => project.health === 'at-risk' || project.health === 'delayed');
  const overdueTasks = tasks.filter((task) => task.status === 'Overdue').length;
  const pendingPurchases = purchaseRequests.filter((request) => request.status === 'Requested').length;
  const openRisks = risks.filter((risk) => risk.status === 'Open').length;

  const metrics = [
    { label: 'Active projects', value: activeProjects, note: 'Across the sample portfolio', icon: FolderKanban },
    { label: 'Projects to watch', value: watchProjects.length, note: 'At-risk or delayed in sample data', icon: ShieldCheck },
    { label: 'Overdue tasks', value: overdueTasks, note: 'Require owner follow-up', icon: ListChecks },
    { label: 'Pending procurement', value: pendingPurchases, note: 'Requests awaiting a decision', icon: ShoppingCart },
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-900 via-navy-800 to-brand-900 p-6 lg:p-8 text-white">
        <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full border border-white/10" />
        <div className="absolute -right-2 -top-6 h-36 w-36 rounded-full border border-white/10" />
        <div className="relative max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-blue-100">
            <Sparkles size={14} /> BuildFlow Executive Office
          </div>
          <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Good to see you, {firstName}.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/80">
            One executive workspace for business intelligence, project oversight, decisions and the people helping you move work forward.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-blue-100/80">
            <span className="inline-flex items-center gap-1.5"><LockKeyhole size={13} /> Organisation-scoped workspace</span>
            {membership?.organization?.name && <span>· {membership.organization.name}</span>}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Business pulse</h2>
          <p className="mt-1 text-sm text-gray-500">A consolidated view of the signals an executive should not miss.</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${liveContext ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{liveContext ? 'Live BuildFlow data' : contextLoading ? 'Connecting · sample preview' : 'Sample preview · live data unavailable'}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{metric.label}</span>
                <span className="rounded-lg bg-blue-50 p-2 text-brand-700"><Icon size={17} /></span>
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-gray-900">{metric.value}</p>
              <p className="mt-1 text-xs text-gray-400">{metric.note}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-gray-900">Executive attention</h2>
              <p className="mt-1 text-sm text-gray-500">{liveContext ? 'Live project health signals from your organisation.' : 'Sample items illustrating what the VEA orchestrator will consolidate.'}</p>
            </div>
            <ArrowUpRight size={18} className="text-gray-400" />
          </div>
          {contextError && !liveContext && <p role="status" className="mb-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Live portfolio connection: {contextError}. The figures shown remain clearly marked sample data.</p>}
          <div className="mt-4 space-y-3">
            {watchProjects.slice(0, 3).map((project) => (
              <div key={project.id} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-800">{project.name}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{project.progress}% complete · {project.manager}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${project.health === 'delayed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {project.health === 'delayed' ? 'Delayed' : 'At risk'}
                </span>
              </div>
            ))}
            {watchProjects.length === 0 && <p className="text-sm text-gray-500">No watchlist items in the sample portfolio.</p>}
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-gray-200 px-3 py-3 text-sm text-gray-500">
              <ShieldCheck size={16} className="text-amber-600" />
              {openRisks} open risk records {liveContext ? 'in the live workspace' : 'in the sample workspace'}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900">Decisions & follow-through</h2>
          <p className="mt-1 text-sm text-gray-500">A future shared queue for AI recommendations and human hand-offs.</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
              <span className="rounded-lg bg-amber-100 p-2 text-amber-700"><ShoppingCart size={16} /></span>
              <div><p className="text-sm font-medium text-gray-800">{pendingPurchases} purchase requests awaiting review</p><p className="mt-0.5 text-xs text-gray-500">Procurement decision queue · {liveContext ? 'live records' : 'sample data'}</p></div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
              <span className="rounded-lg bg-red-100 p-2 text-red-700"><ListChecks size={16} /></span>
              <div><p className="text-sm font-medium text-gray-800">{overdueTasks} overdue tasks need follow-up</p><p className="mt-0.5 text-xs text-gray-500">Delegation and accountability · {liveContext ? 'live records' : 'sample data'}</p></div>
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-3 text-xs leading-5 text-blue-800">
              <strong>Approval boundary:</strong> payments, contracts, employment decisions and material commitments remain with an authorised human decision-maker.
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900">Your specialist team</h2>
            <p className="mt-1 text-sm text-gray-500">One orchestrator will coordinate these construction-focused agents.</p>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">Architecture in progress</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {specialistAgents.map((agent) => {
            const Icon = agent.icon;
            return (
              <div key={agent.name} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3">
                <span className="rounded-lg bg-gray-100 p-2 text-gray-700"><Icon size={17} /></span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800">{agent.name}</p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">{agent.detail}</p>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">{agent.status}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Ask your executive assistant</h2>
          <p className="mt-1 text-sm text-gray-500">The existing BuildFlow AI demo is retained here while the live VEA service is connected.</p>
        </div>
        <AIAssistant />
      </section>
    </div>
  );
}
