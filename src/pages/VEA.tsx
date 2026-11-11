import { useEffect, useMemo, useState } from 'react';
import { AIAssistant } from '@/pages/AIAssistant';
import { useAuth } from '@/context/AuthContext';
import { loadVEAContext, type VEAContext } from '@/lib/vea';
import {
  AlertTriangle,
  ArrowUpRight,
  Bot,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  FolderKanban,
  ListChecks,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Users,
} from 'lucide-react';

const specialistAgents = [
  { name: 'Executive Orchestrator', detail: 'Routes requests and coordinates specialist work', icon: Bot, status: 'Foundation' },
  { name: 'Project Intelligence', detail: 'Progress, programme, delays and project exposure', icon: FolderKanban, status: 'Next' },
  { name: 'Finance Intelligence', detail: 'Cash flow, invoices, budgets and cost signals', icon: CircleDollarSign, status: 'Next' },
  { name: 'Procurement', detail: 'Purchase requests, supplier and materials visibility', icon: ShoppingCart, status: 'Next' },
  { name: 'People & Workforce', detail: 'Capacity, assignments and workforce coordination', icon: Users, status: 'Planned' },
  { name: 'Delegation & Accountability', detail: 'Follow-ups, commitments and ownership', icon: ListChecks, status: 'Planned' },
];

function isClosedStatus(status: string | null | undefined) {
  return ['done', 'completed', 'closed', 'cancelled', 'paid'].includes((status || '').toLowerCase());
}

function isWatchHealth(health: string | null | undefined) {
  return ['at-risk', 'at_risk', 'delayed', 'critical', 'red'].includes((health || '').toLowerCase());
}

export function VEA() {
  const { profile, membership } = useAuth();
  const [context, setContext] = useState<VEAContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshContext = async () => {
    setLoading(true);
    setError(null);
    try {
      const nextContext = await loadVEAContext();
      setContext(nextContext);
    } catch (err) {
      setContext(null);
      setError(err instanceof Error ? err.message : 'Unable to load live BuildFlow data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshContext();
  }, []);

  const firstName = profile?.full_name?.trim().split(/\s+/)[0] || 'there';
  const watchProjects = useMemo(
    () => (context?.projects || []).filter((project) => isWatchHealth(project.health_status)),
    [context],
  );
  const overdueTasks = useMemo(
    () => (context?.tasks || []).filter((task) =>
      task.due_date &&
      task.due_date < new Date().toISOString().slice(0, 10) &&
      !isClosedStatus(task.status),
    ),
    [context],
  );
  const pendingPurchases = useMemo(
    () => (context?.purchase_requests || []).filter((request) =>
      ['requested', 'pending', 'submitted', 'under review', 'awaiting approval'].includes((request.status || '').toLowerCase()),
    ),
    [context],
  );

  const metrics = context ? [
    { label: 'Projects', value: context.summary.projects, note: 'Live organisation records', icon: FolderKanban },
    { label: 'Open risk records', value: context.summary.risks, note: 'Risk register records', icon: ShieldCheck },
    { label: 'Tasks', value: context.summary.tasks, note: 'Live task records', icon: ListChecks },
    { label: 'Purchase requests', value: context.summary.purchase_requests, note: 'Procurement records', icon: ShoppingCart },
  ] : [];

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
          <p className="mt-1 text-sm text-gray-500">A consolidated view of the information currently recorded in BuildFlow.</p>
        </div>
        <div className="flex items-center gap-3">
          {context && <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">Live BuildFlow data · read-only</span>}
          <button onClick={() => void refreshContext()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          Loading your organisation's BuildFlow information…
        </div>
      )}

      {error && !loading && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-700" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-900">Live VEA context is not available yet</p>
            <p className="mt-1 text-sm text-amber-800">{error}</p>
            <p className="mt-2 text-xs text-amber-700">No mock figures are being presented as live company information. You can retry after checking your BuildFlow development login.</p>
          </div>
        </div>
      )}

      {context && (
        <>
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
                  <p className="mt-1 text-sm text-gray-500">A first live view of project health and risk records.</p>
                </div>
                <ArrowUpRight size={18} className="text-gray-400" />
              </div>
              <div className="mt-4 space-y-3">
                {watchProjects.slice(0, 4).map((project) => (
                  <div key={project.id} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-800">{project.name}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{project.progress_percent ?? 0}% complete · Due {project.expected_completion_date || 'not set'}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-800">{project.health_status || 'Watch'}</span>
                  </div>
                ))}
                {watchProjects.length === 0 && <p className="text-sm text-gray-500">No watch-status projects found in the latest records returned.</p>}
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-gray-200 px-3 py-3 text-sm text-gray-500">
                  <ShieldCheck size={16} className="text-amber-600" />
                  {context.summary.risks} risk records · {context.risks.filter((risk) => !isClosedStatus(risk.status)).length} open in the latest records
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900">Decisions & follow-through</h2>
              <p className="mt-1 text-sm text-gray-500">Read-only indicators from your current records.</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
                  <span className="rounded-lg bg-amber-100 p-2 text-amber-700"><ShoppingCart size={16} /></span>
                  <div><p className="text-sm font-medium text-gray-800">{pendingPurchases.length} pending purchase requests in the latest records</p><p className="mt-0.5 text-xs text-gray-500">No purchase or supplier action is enabled.</p></div>
                </div>
                <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
                  <span className="rounded-lg bg-red-100 p-2 text-red-700"><ListChecks size={16} /></span>
                  <div><p className="text-sm font-medium text-gray-800">{overdueTasks.length} overdue tasks in the latest records</p><p className="mt-0.5 text-xs text-gray-500">Task records are being read, not changed.</p></div>
                </div>
                <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
                  <span className="rounded-lg bg-blue-100 p-2 text-blue-700"><CalendarClock size={16} /></span>
                  <div><p className="text-sm font-medium text-gray-800">{context.calendar_events.length} upcoming calendar records returned</p><p className="mt-0.5 text-xs text-gray-500">Calendar editing remains disabled.</p></div>
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
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">Agent execution not yet enabled</span>
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
          <p className="text-xs text-gray-400">Context refreshed {new Date(context.generated_at).toLocaleString()} · Read-only access · No agent writes enabled</p>
        </>
      )}

      <section>
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Ask your executive assistant</h2>
          <p className="mt-1 text-sm text-gray-500">The original assistant remains available in clearly labelled demo mode while the live conversational model is built.</p>
        </div>
        <AIAssistant />
      </section>
    </div>
  );
}
