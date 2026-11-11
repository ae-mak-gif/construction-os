import { useMemo, useState, type FormEvent } from 'react';
import { CalendarDays, Clock3, ListChecks, Plus, TrendingUp } from 'lucide-react';
import { Card, CardBody, CardHeader, StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useBuildFlowData } from '@/context/BuildFlowDataContext';

type ScheduleStatus = 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'delayed';
const statusLabels: Record<ScheduleStatus, string> = {
  not_started: 'Not started', in_progress: 'In progress', completed: 'Completed', on_hold: 'On hold', delayed: 'Delayed',
};
const statusStyles: Record<ScheduleStatus, string> = {
  not_started: 'bg-gray-100 text-gray-700', in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700', on_hold: 'bg-amber-100 text-amber-800', delayed: 'bg-red-100 text-red-700',
};

export function ProjectSchedule() {
  const { records, create, update } = useBuildFlowData();
  const projects = useMemo(() => records.projects ?? [], [records.projects]);
  const activities = records.schedule_activities ?? [];
  const [projectId, setProjectId] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [plannedStart, setPlannedStart] = useState('');
  const [plannedFinish, setPlannedFinish] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedActivities = activities
    .filter((activity) => !projectId || activity.project_id === projectId)
    .sort((a, b) => Number(a.sequence_order ?? 0) - Number(b.sequence_order ?? 0));
  const completed = selectedActivities.filter((activity) => activity.status === 'completed').length;
  const delayed = selectedActivities.filter((activity) => activity.status === 'delayed').length;
  const averageProgress = selectedActivities.length
    ? Math.round(selectedActivities.reduce((sum, activity) => sum + Number(activity.progress_percent ?? 0), 0) / selectedActivities.length)
    : 0;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!projectId || !name.trim()) return;
    setSaving(true);
    setError('');
    try {
      await create('schedule_activities', {
        project_id: projectId,
        name: name.trim(),
        activity_code: code.trim() || null,
        description: description.trim() || null,
        planned_start: plannedStart || null,
        planned_finish: plannedFinish || null,
        duration_days: plannedStart && plannedFinish
          ? Math.max(0, Math.ceil((new Date(plannedFinish).getTime() - new Date(plannedStart).getTime()) / 86400000))
          : null,
        sequence_order: selectedActivities.length + 1,
        status: 'not_started',
        progress_percent: 0,
        created_by: null,
      });
      setName(''); setCode(''); setDescription(''); setPlannedStart(''); setPlannedFinish('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save the schedule activity.');
    } finally {
      setSaving(false);
    }
  };

  const changeProgress = async (id: string, value: number) => {
    const progress = Math.min(100, Math.max(0, value));
    const status: ScheduleStatus = progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started';
    try {
      await update('schedule_activities', id, {
        progress_percent: progress,
        status,
        ...(progress === 100 ? { actual_finish: new Date().toISOString().slice(0, 10) } : {}),
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not update activity progress.');
    }
  };

  const changeStatus = async (id: string, status: ScheduleStatus) => {
    try {
      await update('schedule_activities', id, {
        status,
        ...(status === 'completed' ? { progress_percent: 100, actual_finish: new Date().toISOString().slice(0, 10) } : {}),
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not update activity status.');
    }
  };

  return <div className="space-y-6">
    <div className="rounded-2xl bg-gradient-to-r from-navy-900 to-navy-800 p-6 text-white">
      <div className="flex items-center gap-2 text-brand-300 text-xs font-semibold uppercase tracking-wider"><CalendarDays size={15} /> Project controls</div>
      <h2 className="mt-3 text-2xl font-bold tracking-tight">Project programme</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-navy-200">Build a practical activity schedule, track delivery progress and identify delayed work before it affects the wider project.</p>
    </div>
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <StatCard label="Scheduled activities" value={String(selectedActivities.length)} icon={<ListChecks size={20} />} accent="blue" />
      <StatCard label="Completed" value={String(completed)} icon={<TrendingUp size={20} />} accent="green" />
      <StatCard label="Delayed" value={String(delayed)} icon={<Clock3 size={20} />} accent="red" />
      <StatCard label="Average progress" value={`${averageProgress}%`} icon={<CalendarDays size={20} />} accent="orange" />
    </div>
    <Card>
      <CardHeader title="Programme workspace" subtitle="Choose a project to review its activities." action={<select aria-label="Filter by project" value={projectId} onChange={(event) => setProjectId(event.target.value)} className="max-w-48 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"><option value="">All projects</option>{projects.map((project) => <option key={project.id} value={project.id}>{String(project.name ?? 'Project')}</option>)}</select>} />
      <CardBody>
        {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {projects.length === 0 ? <p className="py-6 text-center text-sm text-gray-500">Create or load a live project before scheduling activities.</p> :
          selectedActivities.length === 0 ? <p className="py-6 text-center text-sm text-gray-500">No activities recorded for this selection yet.</p> :
          <div className="space-y-3">{selectedActivities.map((activity) => {
            const status = String(activity.status ?? 'not_started') as ScheduleStatus;
            const project = projects.find((item) => item.id === activity.project_id);
            const progress = Number(activity.progress_percent ?? 0);
            return <article key={activity.id} className="rounded-xl border border-gray-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0"><p className="text-xs text-gray-400">{String(project?.name ?? 'Project')} {activity.activity_code ? `· ${String(activity.activity_code)}` : ''}</p><h3 className="mt-1 text-sm font-semibold text-gray-800">{String(activity.name ?? '')}</h3>{activity.description && <p className="mt-1 text-xs leading-5 text-gray-500">{String(activity.description)}</p>}</div>
                <select aria-label={`Status for ${String(activity.name)}`} value={status} onChange={(event) => void changeStatus(activity.id, event.target.value as ScheduleStatus)} className={`rounded-full border-0 px-3 py-1.5 text-xs font-semibold ${statusStyles[status] ?? statusStyles.not_started}`}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div><div className="mb-1.5 flex items-center justify-between text-xs"><span className="text-gray-500">Progress</span><strong className="text-gray-700">{progress}%</strong></div><input aria-label={`Progress for ${String(activity.name)}`} type="range" min="0" max="100" step="5" value={progress} onChange={(event) => void changeProgress(activity.id, Number(event.target.value))} className="w-full accent-blue-600" /></div>
                <div className="text-right text-xs text-gray-500"><p>Planned start: {String(activity.planned_start ?? '—')}</p><p className="mt-1">Planned finish: {String(activity.planned_finish ?? '—')}</p></div>
              </div>
            </article>;
          })}</div>}
      </CardBody>
    </Card>
    <Card>
      <CardHeader title="Add programme activity" subtitle="Activities are stored against the selected live project." />
      <CardBody>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-gray-700">Project<select required value={projectId} onChange={(event) => setProjectId(event.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"><option value="">Select project</option>{projects.map((project) => <option key={project.id} value={project.id}>{String(project.name ?? 'Project')}</option>)}</select></label>
          <label className="text-sm font-medium text-gray-700">Activity name<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Ground floor slab" className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
          <label className="text-sm font-medium text-gray-700">Activity code<input value={code} onChange={(event) => setCode(event.target.value)} placeholder="e.g. STR-020" className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
          <label className="text-sm font-medium text-gray-700">Description<input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Scope or completion criteria" className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
          <label className="text-sm font-medium text-gray-700">Planned start<input type="date" value={plannedStart} onChange={(event) => setPlannedStart(event.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
          <label className="text-sm font-medium text-gray-700">Planned finish<input type="date" min={plannedStart || undefined} value={plannedFinish} onChange={(event) => setPlannedFinish(event.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
          <div className="md:col-span-2 flex justify-end"><button type="submit" disabled={saving || !projectId || !name.trim()} className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"><Plus size={16} />{saving ? 'Saving...' : 'Add activity'}</button></div>
        </form>
      </CardBody>
    </Card>
  </div>;
}
