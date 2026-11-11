import { useMemo, useState, type FormEvent } from 'react';
import { CalendarDays, ClipboardList, CloudSun, Plus, Users, AlertTriangle } from 'lucide-react';
import { Card, CardBody, CardHeader, StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useBuildFlowData } from '@/context/BuildFlowDataContext';

function todayLocal() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function SiteDiaries() {
  const { records, create } = useBuildFlowData();
  const projects = useMemo(() => records.projects ?? [], [records.projects]);
  const diaries = records.site_diaries ?? [];
  const [projectId, setProjectId] = useState('');
  const [diaryDate, setDiaryDate] = useState(todayLocal());
  const [weather, setWeather] = useState('');
  const [siteConditions, setSiteConditions] = useState('');
  const [workPerformed, setWorkPerformed] = useState('');
  const [labourCount, setLabourCount] = useState('0');
  const [plantEquipment, setPlantEquipment] = useState('');
  const [materials, setMaterials] = useState('');
  const [delays, setDelays] = useState('');
  const [instructions, setInstructions] = useState('');
  const [safety, setSafety] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const projectNames = useMemo(() => new Map(projects.map((project) => [project.id, String(project.name ?? 'Project')])), [projects]);
  const orderedDiaries = [...diaries].sort((a, b) => String(b.diary_date ?? '').localeCompare(String(a.diary_date ?? '')));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!projectId || !workPerformed.trim()) return;
    setSaving(true);
    setError('');
    try {
      await create('site_diaries', {
        project_id: projectId,
        diary_date: diaryDate,
        weather_conditions: weather.trim() || null,
        site_conditions: siteConditions.trim() || null,
        work_performed: workPerformed.trim(),
        labour_count: Number(labourCount) || 0,
        plant_equipment: plantEquipment.trim() || null,
        materials_delivered: materials.trim() || null,
        delays_disruptions: delays.trim() || null,
        instructions_received: instructions.trim() || null,
        safety_observations: safety.trim() || null,
        created_by: null,
      });
      setWorkPerformed('');
      setLabourCount('0');
      setPlantEquipment('');
      setMaterials('');
      setDelays('');
      setInstructions('');
      setSafety('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'The site diary could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return <div className="space-y-6">
    <div className="rounded-2xl bg-gradient-to-r from-navy-900 to-navy-800 p-6 text-white">
      <div className="flex items-center gap-2 text-brand-300 text-xs font-semibold uppercase tracking-wider"><ClipboardList size={15} /> Site operations</div>
      <h2 className="mt-3 text-2xl font-bold tracking-tight">Daily site diaries</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-navy-200">Capture a consistent daily record of work completed, labour, site conditions, deliveries, instructions, delays and safety observations.</p>
    </div>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard label="Diary entries" value={String(diaries.length)} icon={<CalendarDays size={20} />} accent="blue" />
      <StatCard label="Projects covered" value={String(new Set(diaries.map((entry) => entry.project_id)).size)} icon={<ClipboardList size={20} />} accent="green" />
      <StatCard label="Recorded labour" value={String(diaries.reduce((sum, entry) => sum + Number(entry.labour_count ?? 0), 0))} icon={<Users size={20} />} accent="orange" />
    </div>

    <Card>
      <CardHeader title="Create daily record" subtitle="A saved record is visible to authorised members of this organisation." />
      <CardBody>
        {projects.length === 0 ? <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Create or load a live project before recording a site diary. This form does not create sample projects.</div> : <form onSubmit={submit} className="space-y-4">
          {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm font-medium text-gray-700">Project
              <select required value={projectId} onChange={(event) => setProjectId(event.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                <option value="">Select project</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{String(project.name ?? 'Project')}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700">Diary date
              <input required type="date" value={diaryDate} onChange={(event) => setDiaryDate(event.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm font-medium text-gray-700">Weather
              <span className="relative mt-1.5 block"><CloudSun size={16} className="absolute left-3 top-2.5 text-gray-400" /><input value={weather} onChange={(event) => setWeather(event.target.value)} placeholder="e.g. Clear, light rain" className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm" /></span>
            </label>
          </div>
          <label className="block text-sm font-medium text-gray-700">Work performed <span className="text-red-500">*</span>
            <textarea required rows={3} value={workPerformed} onChange={(event) => setWorkPerformed(event.target.value)} placeholder="Describe activities completed, work fronts and progress..." className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-gray-700">Site conditions
              <textarea rows={2} value={siteConditions} onChange={(event) => setSiteConditions(event.target.value)} placeholder="Access, ground conditions, site constraints..." className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm font-medium text-gray-700">Plant and equipment
              <textarea rows={2} value={plantEquipment} onChange={(event) => setPlantEquipment(event.target.value)} placeholder="Equipment deployed and operating status..." className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm font-medium text-gray-700">Materials delivered
              <textarea rows={2} value={materials} onChange={(event) => setMaterials(event.target.value)} placeholder="Materials, quantities and delivery references..." className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm font-medium text-gray-700">Delays and disruptions
              <textarea rows={2} value={delays} onChange={(event) => setDelays(event.target.value)} placeholder="Cause, affected activity and time lost..." className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm font-medium text-gray-700">Instructions received
              <textarea rows={2} value={instructions} onChange={(event) => setInstructions(event.target.value)} placeholder="Instructions, source and date..." className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm font-medium text-gray-700">Safety observations
              <textarea rows={2} value={safety} onChange={(event) => setSafety(event.target.value)} placeholder="Hazards, near misses and actions taken..." className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </label>
          </div>
          <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-end sm:justify-between">
            <label className="text-sm font-medium text-gray-700">Number of workers on site
              <input type="number" min="0" step="1" value={labourCount} onChange={(event) => setLabourCount(event.target.value)} className="mt-1.5 block w-36 rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </label>
            <button type="submit" disabled={saving || !projectId || !workPerformed.trim()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"><Plus size={16} />{saving ? 'Saving...' : 'Save site diary'}</button>
          </div>
        </form>}
      </CardBody>
    </Card>

    <Card>
      <CardHeader title="Recent site diaries" subtitle={`${orderedDiaries.length} saved records`} />
      <CardBody>
        {orderedDiaries.length === 0 ? <div className="py-8 text-center"><ClipboardList size={28} className="mx-auto text-gray-300" /><p className="mt-3 text-sm font-medium text-gray-600">No site diaries recorded yet</p><p className="mt-1 text-xs text-gray-400">New records will appear here after they are saved.</p></div> : <div className="space-y-3">
          {orderedDiaries.map((entry) => <article key={entry.id} className="rounded-xl border border-gray-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><h3 className="text-sm font-semibold text-gray-800">{projectNames.get(String(entry.project_id)) ?? 'Project'}</h3><p className="mt-1 text-xs text-gray-500">{String(entry.diary_date ?? '')}</p></div>
              <Badge variant="blue">{Number(entry.labour_count ?? 0)} workers</Badge>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">{String(entry.work_performed ?? '')}</p>
            {(Boolean(entry.delays_disruptions) || Boolean(entry.safety_observations)) && <div className="mt-3 grid gap-2 md:grid-cols-2">
              {Boolean(entry.delays_disruptions) && <div className="rounded-lg bg-amber-50 p-3"><p className="flex items-center gap-1 text-xs font-semibold text-amber-800"><AlertTriangle size={13} /> Delays / disruptions</p><p className="mt-1 text-xs leading-5 text-amber-900">{String(entry.delays_disruptions)}</p></div>}
              {Boolean(entry.safety_observations) && <div className="rounded-lg bg-gray-50 p-3"><p className="text-xs font-semibold text-gray-700">Safety observations</p><p className="mt-1 text-xs leading-5 text-gray-600">{String(entry.safety_observations)}</p></div>}
            </div>}
          </article>)}
        </div>}
      </CardBody>
    </Card>
  </div>;
}
