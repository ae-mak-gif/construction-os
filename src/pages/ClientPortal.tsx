import { useCallback, useEffect, useState } from 'react';
import { Building2, LogOut, Loader2, MapPin, CalendarDays, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { ClientAccess } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface SharedProject {
  project_id: string;
  project_name: string;
  project_code: string | null;
  description: string | null;
  location: string | null;
  project_status: string | null;
  health_status: string | null;
  start_date: string | null;
  expected_completion_date: string | null;
  progress_percent: number | null;
  can_view_progress: boolean;
  can_view_updates: boolean;
  can_view_documents: boolean;
  can_view_financials: boolean;
}

interface SharedUpdate {
  update_id: string;
  title: string | null;
  content: string | null;
  progress_percent: number | null;
  created_at: string;
}

function formatDate(value: string | null) {
  if (!value) return 'Not specified';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? 'Not specified'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(parsed);
}

export function ClientPortal({ clientAccess, onSignOut }: {
  clientAccess: ClientAccess;
  onSignOut: () => void;
}) {
  const [projects, setProjects] = useState<SharedProject[]>([]);
  const [updates, setUpdates] = useState<SharedUpdate[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingUpdates, setLoadingUpdates] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatesError, setUpdatesError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    setError(null);
    const { data, error: queryError } = await supabase.rpc('get_client_portal_projects');
    if (queryError) {
      setProjects([]);
      setSelectedProjectId(null);
      setError('We could not load your shared projects. Please try again or contact the project administrator.');
    } else {
      const rows = (data ?? []) as SharedProject[];
      setProjects(rows);
      setSelectedProjectId((current) =>
        current && rows.some((project) => project.project_id === current)
          ? current
          : rows[0]?.project_id ?? null
      );
    }
    setLoadingProjects(false);
  }, []);

  const loadUpdates = useCallback(async (projectId: string) => {
    setLoadingUpdates(true);
    setUpdatesError(null);
    const { data, error: queryError } = await supabase.rpc('get_client_portal_updates', {
      target_project_id: projectId,
    });
    if (queryError) {
      setUpdates([]);
      setUpdatesError('Project updates are temporarily unavailable.');
    } else {
      setUpdates((data ?? []) as SharedUpdate[]);
    }
    setLoadingUpdates(false);
  }, []);

  useEffect(() => { void loadProjects(); }, [loadProjects]);

  const selectedProject = projects.find((project) => project.project_id === selectedProjectId) ?? null;

  useEffect(() => {
    if (selectedProject?.can_view_updates) void loadUpdates(selectedProject.project_id);
    else setUpdates([]);
  }, [selectedProject?.project_id, selectedProject?.can_view_updates, loadUpdates]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-950 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
              <Building2 size={23} />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">BuildFlow</p>
              <p className="text-xs text-slate-300">Client project portal</p>
            </div>
          </div>
          <button onClick={onSignOut} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 lg:px-6">
        <section>
          <p className="text-sm font-medium text-blue-700">Welcome</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{clientAccess.client_name}</h1>
          <p className="mt-1 text-sm text-slate-500">Projects and updates that have been explicitly shared with your account.</p>
        </section>

        {loadingProjects ? (
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-slate-500">
            <Loader2 className="mr-2 animate-spin" size={20} /> Loading your shared projects...
          </div>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-rose-200 bg-white p-6">
            <div className="flex items-start gap-3 text-rose-700">
              <AlertCircle className="mt-0.5 shrink-0" size={19} />
              <p className="text-sm">{error}</p>
            </div>
            <button onClick={() => void loadProjects()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
            <Building2 className="mx-auto text-slate-300" size={34} />
            <h2 className="mt-4 text-lg font-semibold text-slate-900">No projects shared yet</h2>
            <p className="mt-1 text-sm text-slate-500">Your project administrator has not shared a project with this account.</p>
          </div>
        ) : (
          <>
            {projects.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {projects.map((project) => (
                  <button key={project.project_id} onClick={() => setSelectedProjectId(project.project_id)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium ${selectedProjectId === project.project_id ? 'bg-blue-700 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'}`}>
                    {project.project_name}
                  </button>
                ))}
              </div>
            )}

            {selectedProject && (
              <section className="space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{selectedProject.project_code || 'Shared project'}</p>
                      <h2 className="mt-1 text-xl font-bold text-slate-900">{selectedProject.project_name}</h2>
                      {selectedProject.description && <p className="mt-2 max-w-3xl text-sm text-slate-600">{selectedProject.description}</p>}
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 size={14} /> Shared with you
                    </span>
                  </div>

                  {selectedProject.location && (
                    <p className="mt-5 flex items-center gap-2 text-sm text-slate-500"><MapPin size={15} /> {selectedProject.location}</p>
                  )}

                  {selectedProject.can_view_progress && (
                    <div className="mt-6 border-t border-slate-100 pt-5">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-slate-800">Project progress</h3>
                        <span className="text-lg font-bold tabular-nums text-slate-900">{Number(selectedProject.progress_percent ?? 0)}%</span>
                      </div>
                      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(0, Math.min(100, Number(selectedProject.progress_percent ?? 0)))}%` }} />
                      </div>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div className="flex items-start gap-2 text-sm text-slate-600">
                          <CalendarDays size={16} className="mt-0.5 text-slate-400" />
                          <span>Start date<br /><strong className="font-medium text-slate-800">{formatDate(selectedProject.start_date)}</strong></span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-slate-600">
                          <CalendarDays size={16} className="mt-0.5 text-slate-400" />
                          <span>Expected completion<br /><strong className="font-medium text-slate-800">{formatDate(selectedProject.expected_completion_date)}</strong></span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {selectedProject.can_view_updates && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="font-semibold text-slate-900">Project updates</h3>
                    {loadingUpdates ? (
                      <p className="mt-4 flex items-center gap-2 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" /> Loading updates...</p>
                    ) : updatesError ? (
                      <p role="alert" className="mt-4 text-sm text-rose-700">{updatesError}</p>
                    ) : updates.length === 0 ? (
                      <p className="mt-3 text-sm text-slate-500">No project updates have been published yet.</p>
                    ) : (
                      <ul className="mt-4 divide-y divide-slate-100">
                        {updates.map((update) => (
                          <li key={update.update_id} className="py-4 first:pt-0 last:pb-0">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-800">{update.title || 'Project update'}</p>
                              <time className="text-xs text-slate-400">{formatDate(update.created_at)}</time>
                            </div>
                            {update.content && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{update.content}</p>}
                            {update.progress_percent !== null && <p className="mt-2 text-xs font-medium text-blue-700">Reported progress: {update.progress_percent}%</p>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {(selectedProject.can_view_documents || selectedProject.can_view_financials) && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Additional document or financial sharing is recorded for this project, but those portal sections are not enabled in this pilot interface yet. No document or financial records are displayed here.
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
