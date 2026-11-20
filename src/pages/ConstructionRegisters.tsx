import { useMemo, useState, type FormEvent } from 'react';
import { ClipboardCheck, FileText, HardHat, Plus, ShieldCheck, Truck } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { useBuildFlowData } from '@/context/BuildFlowDataContext';
import { supabase } from '@/lib/supabase';

type Tab = 'safety' | 'rfis' | 'variations' | 'subcontractors';
const tabs: { id: Tab; label: string; icon: typeof ShieldCheck }[] = [
  { id: 'safety', label: 'Safety & incidents', icon: ShieldCheck },
  { id: 'rfis', label: 'Technical queries', icon: FileText },
  { id: 'variations', label: 'Contract variations', icon: ClipboardCheck },
  { id: 'subcontractors', label: 'Subcontractors', icon: Truck },
];

export function ConstructionRegisters() {
  const [tab, setTab] = useState<Tab>('safety');
  const [projectId, setProjectId] = useState('');
  const { records, create, update, refresh } = useBuildFlowData();
  const projects = useMemo(() => records.projects ?? [], [records.projects]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [safetyTitle, setSafetyTitle] = useState('');
  const [safetyType, setSafetyType] = useState('hazard');
  const [safetyDescription, setSafetyDescription] = useState('');
  const [safetyDate, setSafetyDate] = useState(new Date().toISOString().slice(0, 16));
  const [severity, setSeverity] = useState('low');
  const [immediateAction, setImmediateAction] = useState('');
  const [rfiNumber, setRfiNumber] = useState('');
  const [rfiSubject, setRfiSubject] = useState('');
  const [rfiQuestion, setRfiQuestion] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [variationNumber, setVariationNumber] = useState('');
  const [variationTitle, setVariationTitle] = useState('');
  const [variationDescription, setVariationDescription] = useState('');
  const [variationReason, setVariationReason] = useState('');
  const [variationAmount, setVariationAmount] = useState('0');
  const [extensionDays, setExtensionDays] = useState('0');
  const [businessName, setBusinessName] = useState('');
  const [trade, setTrade] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [licenceExpiry, setLicenceExpiry] = useState('');
  const [rfiResponses, setRfiResponses] = useState<Record<string, string>>({});
  const [correctiveActions, setCorrectiveActions] = useState<Record<string, string>>({});
  const [approvedAmounts, setApprovedAmounts] = useState<Record<string, string>>({});

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try {
      if (tab === 'safety') {
        if (!projectId) throw new Error('Select a project first.');
        await create('safety_incidents', {
          project_id: projectId, incident_type: safetyType, title: safetyTitle.trim(),
          description: safetyDescription.trim(), incident_date: new Date(safetyDate).toISOString(),
          severity, immediate_action: immediateAction.trim() || null, persons_affected: 0, status: 'open', created_by: null,
        });
        setSafetyTitle(''); setSafetyDescription(''); setImmediateAction('');
      } else if (tab === 'rfis') {
        if (!projectId) throw new Error('Select a project first.');
        await create('project_rfis', {
          project_id: projectId, rfi_number: rfiNumber.trim(), subject: rfiSubject.trim(),
          question: rfiQuestion.trim(), discipline: discipline.trim() || null, due_date: dueDate || null,
          status: 'open', created_by: null,
        });
        setRfiNumber(''); setRfiSubject(''); setRfiQuestion(''); setDiscipline(''); setDueDate('');
      } else if (tab === 'variations') {
        if (!projectId) throw new Error('Select a project first.');
        await create('contract_variations', {
          project_id: projectId, variation_number: variationNumber.trim(), title: variationTitle.trim(),
          description: variationDescription.trim() || null, reason: variationReason.trim() || null,
          submitted_amount: Number(variationAmount) || 0, time_extension_days: Number(extensionDays) || 0,
          status: 'draft', created_by: null,
        });
        setVariationNumber(''); setVariationTitle(''); setVariationDescription(''); setVariationReason(''); setVariationAmount('0'); setExtensionDays('0');
      } else {
        await create('subcontractors', {
          business_name: businessName.trim(), trade_category: trade.trim(), contact_name: contactName.trim() || null,
          email: email.trim() || null, phone: phone.trim() || null, insurance_expiry: insuranceExpiry || null,
          licence_expiry: licenceExpiry || null, compliance_status: 'pending', created_by: null,
        });
        setBusinessName(''); setTrade(''); setContactName(''); setEmail(''); setPhone(''); setInsuranceExpiry(''); setLicenceExpiry('');
      }
      setNotice('Record saved successfully.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'The record could not be saved.');
    } finally { setSaving(false); }
  };

  const updateStatus = async (table: 'safety_incidents' | 'project_rfis' | 'contract_variations' | 'subcontractors', id: string, field: string, value: string) => {
    setError(''); setNotice('');
    try { await update(table, id, { [field]: value }); setNotice('Record updated.'); }
    catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'The update could not be saved.'); }
  };

  const saveRfiResponse = async (id: string) => {
    const response = (rfiResponses[id] ?? '').trim();
    if (!response) { setError('Enter a response before saving.'); return; }
    setError(''); setNotice('');
    try {
      await update('project_rfis', id, { response, status: 'answered', responded_at: new Date().toISOString() });
      setNotice('RFI response saved.');
      setRfiResponses((current) => ({ ...current, [id]: '' }));
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Could not save the RFI response.'); }
  };

  const saveCorrectiveAction = async (id: string) => {
    const corrective_action = (correctiveActions[id] ?? '').trim();
    if (!corrective_action) { setError('Enter a corrective action before saving.'); return; }
    setError(''); setNotice('');
    try {
      await update('safety_incidents', id, { corrective_action, status: 'action_required' });
      setNotice('Corrective action recorded.');
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Could not save the corrective action.'); }
  };

  const approveVariation = async (id: string) => {
    const amount = Number(approvedAmounts[id]);
    if (!Number.isFinite(amount) || amount < 0) { setError('Enter a valid approved amount.'); return; }
    setError(''); setNotice('');
    try {
      const { error: decisionError } = await supabase.rpc('decide_contract_variation', {
        p_variation_id: id,
        p_decision: 'approved',
        p_approved_amount: amount,
        p_decision_notes: null,
      });
      if (decisionError) throw decisionError;
      await refresh();
      setNotice('Variation approved. The project contract value has been revised atomically.');
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Could not approve the variation.'); }
  };

  const rejectVariation = async (id: string) => {
    if (!window.confirm('Reject this contract variation? The decision will be recorded and cannot be edited.')) return;
    setError(''); setNotice('');
    try {
      const { error: decisionError } = await supabase.rpc('decide_contract_variation', {
        p_variation_id: id,
        p_decision: 'rejected',
        p_approved_amount: null,
        p_decision_notes: null,
      });
      if (decisionError) throw decisionError;
      await refresh();
      setNotice('Variation rejected and decision recorded.');
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Could not reject the variation.'); }
  };

  const projectName = (id: string) => String(projects.find((p) => p.id === id)?.name ?? 'Project');
  const selectProject = <select required aria-label="Project" value={projectId} onChange={(event) => setProjectId(event.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"><option value="">Select project</option>{projects.map((p) => <option key={p.id} value={p.id}>{String(p.name ?? 'Project')}</option>)}</select>;

  return <div className="space-y-6">
    <div className="rounded-2xl bg-gradient-to-r from-navy-900 to-navy-800 p-6 text-white">
      <div className="flex items-center gap-2 text-brand-300 text-xs font-semibold uppercase tracking-wider"><HardHat size={15} /> Project delivery registers</div>
      <h2 className="mt-3 text-2xl font-bold tracking-tight">Site assurance & project coordination</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-navy-200">Keep safety events, technical queries, contract changes and subcontractor records in one traceable workspace.</p>
    </div>
    <div className="flex flex-wrap gap-2">{tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => { setTab(id); setError(''); setNotice(''); }} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${tab === id ? 'bg-navy-900 text-white' : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}><Icon size={15} />{label}</button>)}</div>
    {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {notice && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}
    <Card>
      <CardHeader title={tab === 'safety' ? 'Report safety event' : tab === 'rfis' ? 'Raise technical query' : tab === 'variations' ? 'Create contract variation' : 'Register subcontractor'} subtitle="New records are saved to your organisation's live workspace." />
      <CardBody>
        <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
          {tab !== 'subcontractors' && <label className="text-sm font-medium text-gray-700 md:col-span-2">Project{selectProject}</label>}
          {tab === 'safety' && <>
            <label className="text-sm font-medium text-gray-700">Event title<input required value={safetyTitle} onChange={(e) => setSafetyTitle(e.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="e.g. Unprotected floor opening" /></label>
            <label className="text-sm font-medium text-gray-700">Event type<select value={safetyType} onChange={(e) => setSafetyType(e.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"><option value="hazard">Hazard</option><option value="near_miss">Near miss</option><option value="incident">Incident</option><option value="environmental_event">Environmental event</option></select></label>
            <label className="text-sm font-medium text-gray-700">Date and time<input required type="datetime-local" value={safetyDate} onChange={(e) => setSafetyDate(e.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
            <label className="text-sm font-medium text-gray-700">Severity<select value={severity} onChange={(e) => setSeverity(e.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"><option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option><option value="critical">Critical</option></select></label>
            <label className="text-sm font-medium text-gray-700 md:col-span-2">Description<textarea required rows={3} value={safetyDescription} onChange={(e) => setSafetyDescription(e.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
            <label className="text-sm font-medium text-gray-700 md:col-span-2">Immediate action<textarea rows={2} value={immediateAction} onChange={(e) => setImmediateAction(e.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
          </>}
          {tab === 'rfis' && <>
            <label className="text-sm font-medium text-gray-700">RFI number<input required value={rfiNumber} onChange={(e) => setRfiNumber(e.target.value)} placeholder="e.g. RFI-001" className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
            <label className="text-sm font-medium text-gray-700">Discipline<input value={discipline} onChange={(e) => setDiscipline(e.target.value)} placeholder="Structural, electrical..." className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
            <label className="text-sm font-medium text-gray-700 md:col-span-2">Subject<input required value={rfiSubject} onChange={(e) => setRfiSubject(e.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
            <label className="text-sm font-medium text-gray-700 md:col-span-2">Question / clarification required<textarea required rows={3} value={rfiQuestion} onChange={(e) => setRfiQuestion(e.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
            <label className="text-sm font-medium text-gray-700">Response due date<input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
          </>}
          {tab === 'variations' && <>
            <label className="text-sm font-medium text-gray-700">Variation number<input required value={variationNumber} onChange={(e) => setVariationNumber(e.target.value)} placeholder="e.g. VO-001" className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
            <label className="text-sm font-medium text-gray-700">Variation title<input required value={variationTitle} onChange={(e) => setVariationTitle(e.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
            <label className="text-sm font-medium text-gray-700">Submitted amount<input type="number" min="0" step="0.01" value={variationAmount} onChange={(e) => setVariationAmount(e.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
            <label className="text-sm font-medium text-gray-700">Extension of time (days)<input type="number" min="0" step="1" value={extensionDays} onChange={(e) => setExtensionDays(e.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
            <label className="text-sm font-medium text-gray-700 md:col-span-2">Description<textarea rows={2} value={variationDescription} onChange={(e) => setVariationDescription(e.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
            <label className="text-sm font-medium text-gray-700 md:col-span-2">Reason for change<textarea rows={2} value={variationReason} onChange={(e) => setVariationReason(e.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
          </>}
          {tab === 'subcontractors' && <>
            <label className="text-sm font-medium text-gray-700">Business name<input required value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
            <label className="text-sm font-medium text-gray-700">Trade category<input required value={trade} onChange={(e) => setTrade(e.target.value)} placeholder="Electrical, plumbing, roofing..." className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
            <label className="text-sm font-medium text-gray-700">Contact person<input value={contactName} onChange={(e) => setContactName(e.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
            <label className="text-sm font-medium text-gray-700">Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
            <label className="text-sm font-medium text-gray-700">Phone<input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
            <label className="text-sm font-medium text-gray-700">Insurance expiry<input type="date" value={insuranceExpiry} onChange={(e) => setInsuranceExpiry(e.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
            <label className="text-sm font-medium text-gray-700">Licence expiry<input type="date" value={licenceExpiry} onChange={(e) => setLicenceExpiry(e.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
          </>}
          <div className="md:col-span-2 flex justify-end"><button type="submit" disabled={saving || (tab !== 'subcontractors' && !projectId)} className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"><Plus size={16} />{saving ? 'Saving...' : 'Save record'}</button></div>
        </form>
      </CardBody>
    </Card>
    <Card>
      <CardHeader title={tab === 'safety' ? 'Safety event register' : tab === 'rfis' ? 'RFI register' : tab === 'variations' ? 'Variation register' : 'Subcontractor directory'} subtitle="Records are loaded from the live organisation dataset." />
      <CardBody>
        {tab === 'safety' && <div className="space-y-3">{(records.safety_incidents ?? []).filter((r) => !projectId || r.project_id === projectId).map((r) => <article key={r.id} className="rounded-lg border border-gray-200 p-3"><div className="flex flex-wrap justify-between gap-2"><div><p className="font-semibold text-sm text-gray-800">{String(r.title)}</p><p className="mt-1 text-xs text-gray-500">{projectName(String(r.project_id))} · {String(r.incident_type)} · {String(r.incident_date)}</p></div><select aria-label="Safety event status" value={String(r.status)} onChange={(e) => void updateStatus('safety_incidents',r.id,'status',e.target.value)} className="rounded-md border border-gray-200 px-2 py-1 text-xs"><option value="open">Open</option><option value="investigating">Investigating</option><option value="action_required">Action required</option><option value="closed">Closed</option></select></div><p className="mt-2 text-sm text-gray-600">{String(r.description)}</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row"><input aria-label="Corrective action" value={correctiveActions[r.id] ?? String(r.corrective_action ?? '')} onChange={(e) => setCorrectiveActions((current) => ({ ...current, [r.id]: e.target.value }))} placeholder="Corrective / preventive action..." className="min-w-0 flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm" /><button type="button" onClick={() => void saveCorrectiveAction(r.id)} className="rounded-md bg-brand-600 px-3 py-2 text-xs font-semibold text-white">Save action</button></div>
          </article>)}{(records.safety_incidents ?? []).length === 0 && <p className="py-6 text-center text-sm text-gray-500">No safety events recorded.</p>}</div>}
        {tab === 'rfis' && <div className="space-y-3">{(records.project_rfis ?? []).filter((r) => !projectId || r.project_id === projectId).map((r) => <article key={r.id} className="rounded-lg border border-gray-200 p-3"><div className="flex flex-wrap justify-between gap-2"><div><p className="font-semibold text-sm text-gray-800">{String(r.rfi_number)} · {String(r.subject)}</p><p className="mt-1 text-xs text-gray-500">{projectName(String(r.project_id))} · {String(r.discipline ?? 'General')} · Due {String(r.due_date ?? '—')}</p></div><select aria-label="RFI status" value={String(r.status)} onChange={(e) => void updateStatus('project_rfis',r.id,'status',e.target.value)} className="rounded-md border border-gray-200 px-2 py-1 text-xs"><option value="open">Open</option><option value="under_review">Under review</option><option value="answered">Answered</option><option value="closed">Closed</option><option value="void">Void</option></select></div><p className="mt-2 text-sm text-gray-600">{String(r.question)}</p>{Boolean(r.response) && <p className="mt-2 rounded bg-emerald-50 p-2 text-sm text-emerald-800">{String(r.response)}</p>}
          <div className="mt-3 space-y-2"><textarea aria-label="RFI response" rows={2} value={rfiResponses[r.id] ?? ''} onChange={(e) => setRfiResponses((current) => ({ ...current, [r.id]: e.target.value }))} placeholder="Record the technical response or clarification..." className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm" /><div className="flex justify-end"><button type="button" onClick={() => void saveRfiResponse(r.id)} className="rounded-md bg-brand-600 px-3 py-2 text-xs font-semibold text-white">Save response</button></div></div>
          </article>)}{(records.project_rfis ?? []).length === 0 && <p className="py-6 text-center text-sm text-gray-500">No RFIs raised.</p>}</div>}
        {tab === 'variations' && <div className="space-y-3">{(records.contract_variations ?? []).filter((r) => !projectId || r.project_id === projectId).map((r) => <article key={r.id} className="rounded-lg border border-gray-200 p-3"><div className="flex flex-wrap justify-between gap-2"><div><p className="font-semibold text-sm text-gray-800">{String(r.variation_number)} · {String(r.title)}</p><p className="mt-1 text-xs text-gray-500">{projectName(String(r.project_id))} · Submitted {String(r.submitted_amount ?? 0)} · EOT {String(r.time_extension_days ?? 0)} days</p></div><select aria-label="Variation status" value={String(r.status)} onChange={(e) => void updateStatus('contract_variations',r.id,'status',e.target.value)} className="rounded-md border border-gray-200 px-2 py-1 text-xs"><option value="draft">Draft</option><option value="submitted">Submitted</option><option value="under_review">Under review</option><option value="withdrawn">Withdrawn</option></select></div><p className="mt-2 text-sm text-gray-600">{String(r.reason ?? r.description ?? '')}</p>
          {['submitted','under_review'].includes(String(r.status)) && <div className="mt-3 flex flex-col gap-2 sm:flex-row"><input aria-label="Approved variation amount" type="number" min="0" step="0.01" value={approvedAmounts[r.id] ?? String(r.approved_amount ?? r.submitted_amount ?? 0)} onChange={(e) => setApprovedAmounts((current) => ({ ...current, [r.id]: e.target.value }))} className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm sm:w-48" /><button type="button" onClick={() => void approveVariation(r.id)} className="rounded-md bg-brand-600 px-3 py-2 text-xs font-semibold text-white">Approve & revise contract</button><button type="button" onClick={() => void rejectVariation(r.id)} className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">Reject variation</button></div>}
          {r.approved_amount !== null && r.approved_amount !== undefined && <p className="mt-2 text-xs font-medium text-emerald-700">Approved amount: {String(r.approved_amount)}</p>}
          </article>)}{(records.contract_variations ?? []).length === 0 && <p className="py-6 text-center text-sm text-gray-500">No contract variations recorded.</p>}</div>}
        {tab === 'subcontractors' && <div className="space-y-3">{(records.subcontractors ?? []).map((r) => <article key={r.id} className="rounded-lg border border-gray-200 p-3"><div className="flex flex-wrap justify-between gap-2"><div><p className="font-semibold text-sm text-gray-800">{String(r.business_name)}</p><p className="mt-1 text-xs text-gray-500">{String(r.trade_category)} · {String(r.contact_name ?? 'No contact')} · {String(r.email ?? 'No email')}</p></div><select aria-label="Subcontractor compliance status" value={String(r.compliance_status)} onChange={(e) => void updateStatus('subcontractors',r.id,'compliance_status',e.target.value)} className="rounded-md border border-gray-200 px-2 py-1 text-xs"><option value="pending">Pending</option><option value="compliant">Compliant</option><option value="expired">Expired</option><option value="non_compliant">Non-compliant</option></select></div><p className="mt-2 text-xs text-gray-500">Insurance expiry: {String(r.insurance_expiry ?? 'Not recorded')} · Licence expiry: {String(r.licence_expiry ?? 'Not recorded')}</p></article>)}{(records.subcontractors ?? []).length === 0 && <p className="py-6 text-center text-sm text-gray-500">No subcontractors registered.</p>}</div>}
      </CardBody>
    </Card>
  </div>;
}
