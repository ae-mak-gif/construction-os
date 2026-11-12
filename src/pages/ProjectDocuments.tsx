import { useMemo, useState, type FormEvent } from 'react';
import { FileCheck2, FilePlus2, GitBranch, ShieldCheck } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { useBuildFlowData } from '@/context/BuildFlowDataContext';

const statuses = ['draft', 'for_review', 'approved', 'superseded', 'archived'] as const;
const categories = ['general', 'drawing', 'specification', 'method_statement', 'shop_drawing', 'technical_submission', 'contract', 'report', 'other'];

export function ProjectDocuments() {
  const { records, create, update } = useBuildFlowData();
  const projects = useMemo(() => records.projects ?? [], [records.projects]);
  const documents = records.project_documents ?? [];
  const [projectId, setProjectId] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [name, setName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [category, setCategory] = useState('drawing');
  const [revision, setRevision] = useState('A');
  const [description, setDescription] = useState('');
  const [issuedAt, setIssuedAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const visibleDocuments = documents.filter((doc) => !filterProject || doc.project_id === filterProject);
  const projectName = (id: string) => String(projects.find((project) => project.id === id)?.name ?? 'Project');
  const latestRevisions = visibleDocuments.filter((doc) => doc.document_status !== 'superseded');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!projectId) { setError('Select a project.'); return; }
    setSaving(true); setError(''); setNotice('');
    try {
      await create('project_documents', {
        project_id: projectId,
        name: name.trim(),
        document_number: documentNumber.trim() || null,
        document_category: category,
        revision: revision.trim().toUpperCase(),
        description: description.trim() || null,
        issued_at: issuedAt || null,
        document_status: 'draft',
        is_client_shared: false,
        file_url: null,
        file_path: null,
        file_type: null,
      });
      setName(''); setDocumentNumber(''); setRevision('A'); setDescription(''); setIssuedAt('');
      setNotice('Document register entry created. No file has been uploaded.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not create the document record.');
    } finally { setSaving(false); }
  };

  const changeStatus = async (id: string, document_status: string) => {
    setError(''); setNotice('');
    try {
      await update('project_documents', id, { document_status });
      setNotice('Document status updated.');
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Could not update document status.'); }
  };

  const toggleClientShare = async (id: string, is_client_shared: boolean) => {
    setError(''); setNotice('');
    try {
      await update('project_documents', id, { is_client_shared });
      setNotice(is_client_shared ? 'Document marked for client sharing.' : 'Client sharing disabled for this document.');
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Could not update sharing status.'); }
  };

  const createRevision = async (doc: Record<string, unknown>) => {
    const currentRevision = String(doc.revision ?? 'A');
    const nextRevision = currentRevision.length === 1 && currentRevision >= 'A' && currentRevision < 'Z'
      ? String.fromCharCode(currentRevision.charCodeAt(0) + 1)
      : `${currentRevision}-1`;
    setError(''); setNotice('');
    try {
      const next = await create('project_documents', {
        project_id: String(doc.project_id),
        name: String(doc.name),
        document_number: doc.document_number ?? null,
        document_category: String(doc.document_category ?? 'general'),
        revision: nextRevision,
        description: doc.description ?? null,
        issued_at: null,
        document_status: 'draft',
        is_client_shared: false,
        file_url: null,
        file_path: null,
        file_type: null,
        supersedes_document_id: String(doc.id),
      });
      await update('project_documents', String(doc.id), { document_status: 'superseded' });
      setNotice(`Revision ${next.revision} created as a new draft. Attachments are not copied.`);
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Could not create the new revision.'); }
  };

  const requestReview = async (doc: Record<string, unknown>) => {
    setError(''); setNotice('');
    try {
      await create('project_approvals', {
        project_id: String(doc.project_id),
        title: `Review: ${String(doc.name)} · Rev ${String(doc.revision ?? 'A')}`,
        description: `Document register review for ${String(doc.document_number ?? doc.id)}. Open the document register entry to inspect its metadata.`,
        status: 'pending',
      });
      await update('project_documents', String(doc.id), { document_status: 'for_review' });
      setNotice('Review request created in the project approvals register.');
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Could not request document review.'); }
  };

  return <div className="space-y-6">
    <div className="rounded-2xl bg-gradient-to-r from-navy-900 to-navy-800 p-6 text-white">
      <div className="flex items-center gap-2 text-brand-300 text-xs font-semibold uppercase tracking-wider"><FileCheck2 size={15} /> Project information control</div>
      <h2 className="mt-3 text-2xl font-bold tracking-tight">Document register & revisions</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-navy-200">Register drawings, specifications, submissions and project records. Track revisions, review status and client-sharing intent.</p>
    </div>
    <div role="note" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      File uploads and downloads are not enabled yet. This register stores document metadata only; it does not create public file links or expose private attachments.
    </div>
    {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {notice && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}
    <Card>
      <CardHeader title="Register a document" subtitle="Create a controlled document record for a project." />
      <CardBody>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="text-sm font-medium text-gray-700">Project<select required value={projectId} onChange={(event) => setProjectId(event.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"><option value="">Select project</option>{projects.map((project) => <option key={project.id} value={project.id}>{String(project.name ?? 'Project')}</option>)}</select></label>
          <label className="text-sm font-medium text-gray-700">Document title<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Ground floor structural plan" /></label>
          <label className="text-sm font-medium text-gray-700">Document number<input value={documentNumber} onChange={(event) => setDocumentNumber(event.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="e.g. STR-DRG-001" /></label>
          <label className="text-sm font-medium text-gray-700">Category<select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">{categories.map((item) => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}</select></label>
          <label className="text-sm font-medium text-gray-700">Revision<input required value={revision} onChange={(event) => setRevision(event.target.value)} maxLength={12} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
          <label className="text-sm font-medium text-gray-700">Issue date<input type="date" value={issuedAt} onChange={(event) => setIssuedAt(event.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
          <label className="text-sm font-medium text-gray-700 md:col-span-2 xl:col-span-3">Description / purpose<textarea rows={2} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
          <div className="md:col-span-2 xl:col-span-3"><button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><FilePlus2 size={16} />{saving ? 'Saving…' : 'Add document record'}</button></div>
        </form>
      </CardBody>
    </Card>
    <Card>
      <CardHeader title="Document register" subtitle={`${latestRevisions.length} current document record(s)`} action={<select aria-label="Filter documents by project" value={filterProject} onChange={(event) => setFilterProject(event.target.value)} className="max-w-56 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"><option value="">All projects</option>{projects.map((project) => <option key={project.id} value={project.id}>{String(project.name ?? 'Project')}</option>)}</select>} />
      <CardBody>
        {visibleDocuments.length === 0 ? <p className="py-8 text-center text-sm text-gray-500">No documents registered for this selection.</p> : <div className="space-y-3">
          {visibleDocuments.map((doc) => <div key={doc.id} className="rounded-xl border border-gray-200 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-gray-900">{String(doc.name)}</h3><span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">Rev {String(doc.revision ?? 'A')}</span><span className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">{String(doc.document_status ?? 'draft').replaceAll('_', ' ')}</span></div>
                <p className="mt-1 text-xs text-gray-500">{projectName(String(doc.project_id))} · {String(doc.document_number ?? 'No document number')} · {String(doc.document_category ?? 'general').replaceAll('_', ' ')}</p>
                {doc.description && <p className="mt-2 text-sm text-gray-600">{String(doc.description)}</p>}
                <p className="mt-2 text-xs text-gray-400">{doc.issued_at ? `Issue date: ${String(doc.issued_at)} · ` : ''}{doc.is_client_shared ? 'Marked for client sharing' : 'Internal only'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <select aria-label={`Status for ${String(doc.name)}`} value={String(doc.document_status ?? 'draft')} onChange={(event) => void changeStatus(doc.id, event.target.value)} className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs">{statuses.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}</select>
                <button type="button" onClick={() => void requestReview(doc)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"><ShieldCheck size={14} /> Request review</button>
                <button type="button" onClick={() => void createRevision(doc)} disabled={doc.document_status === 'superseded' || doc.document_status === 'archived'} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"><GitBranch size={14} /> New revision</button>
                <button type="button" onClick={() => void toggleClientShare(doc.id, !doc.is_client_shared)} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">{doc.is_client_shared ? 'Unmark client share' : 'Mark client share'}</button>
              </div>
            </div>
          </div>)}
        </div>}
      </CardBody>
    </Card>
  </div>;
}
