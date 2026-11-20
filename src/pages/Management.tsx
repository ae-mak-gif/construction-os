import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Wrench, HardHat, Users, ShieldAlert, FileBarChart, AlertTriangle, CheckCircle2, Pencil, X } from 'lucide-react';
import { Card, CardHeader, CardBody, StatCard } from '@/components/ui/Card';
import { Table, Th, Td, Tr } from '@/components/ui/Table';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { useBuildFlowData } from '@/context/BuildFlowDataContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { BuildFlowTable } from '@/lib/buildflowData';
import { formatDate, formatDateShort } from '@/utils/format';

type Row = Record<string, string | number | boolean | null | undefined> & { id: string };
type Field = { name: string; label: string; type?: 'text'|'email'|'tel'|'date'|'datetime-local'|'number'|'textarea'|'select'; required?: boolean; defaultValue?: string; options?: { value: string; label: string }[]; placeholder?: string };
const inputClass = 'mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100';
const buttonClass = 'inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50';
const secondaryClass = 'inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50';
function RecordEditor({ title, fields, initial, saving, onSave, onCancel }: { title: string; fields: Field[]; initial?: Record<string, string | number | boolean | null | undefined> | null; saving: boolean; onSave: (values: Record<string,string>) => void; onCancel: () => void }) {
  const [values, setValues] = useState<Record<string,string>>(() => Object.fromEntries(fields.map(f => [f.name, initial?.[f.name] == null ? (f.defaultValue ?? '') : String(initial[f.name]).slice(0, f.type === 'datetime-local' ? 16 : undefined)])));
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSave(values); };
  return <Card><CardHeader title={title} subtitle="Changes are saved to the live organisation workspace." action={<button type="button" onClick={onCancel} className={secondaryClass}><X size={15}/> Close</button>}/><CardBody><form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
    {fields.map(field => <label key={field.name} className={`block text-sm font-medium text-gray-700 ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}>{field.label}
      {field.type === 'textarea' ? <textarea required={field.required} rows={3} value={values[field.name] ?? ''} onChange={e=>setValues(v=>({...v,[field.name]:e.target.value}))} className={inputClass} placeholder={field.placeholder}/> :
       field.type === 'select' ? <select required={field.required} value={values[field.name] ?? ''} onChange={e=>setValues(v=>({...v,[field.name]:e.target.value}))} className={inputClass}><option value="">Select…</option>{field.options?.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select> :
       <input required={field.required} type={field.type ?? 'text'} min={field.type==='number'?'0':undefined} step={field.type==='number'?'any':undefined} value={values[field.name] ?? ''} onChange={e=>setValues(v=>({...v,[field.name]:e.target.value}))} className={inputClass} placeholder={field.placeholder}/>}
    </label>)}
    <div className="flex gap-2 md:col-span-2"><button disabled={saving} className={buttonClass} type="submit">{saving?'Saving…':'Save record'}</button><button type="button" onClick={onCancel} className={secondaryClass}>Cancel</button></div>
  </form></CardBody></Card>;
}

function useOrgPermission(permissionKey: string) {
  const { membership } = useAuth();
  const organizationId = membership?.organization_id ?? null;
  const [permissionState, setPermissionState] = useState<{
    organizationId: string | null;
    permissionKey: string;
    allowed: boolean;
  }>({ organizationId: null, permissionKey, allowed: false });

  useEffect(() => {
    let active = true;
    // Fail closed immediately when the organisation or requested permission changes.
    setPermissionState({ organizationId, permissionKey, allowed: false });

    if (!organizationId) {
      return () => { active = false; };
    }

    void supabase.rpc('has_org_permission', {
      target_organization_id: organizationId,
      target_permission_key: permissionKey,
    }).then(({ data, error }) => {
      if (active) {
        setPermissionState({
          organizationId,
          permissionKey,
          allowed: !error && data === true,
        });
      }
    }, () => {
      if (active) setPermissionState({ organizationId, permissionKey, allowed: false });
    });

    return () => { active = false; };
  }, [organizationId, permissionKey]);

  // Never expose a previous tenant's permission while a new lookup is pending.
  return permissionState.organizationId === organizationId
    && permissionState.permissionKey === permissionKey
    && permissionState.allowed;
}
function NoAccess({ message = 'You do not have permission to view this register.' }: { message?: string }) {
  return <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{message}</div>;
}

function Feedback({ error, notice }: { error: string; notice: string }) { return <>{error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}{notice && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}</>; }
function useRecordActions() {
  const { records, create, update } = useBuildFlowData();
  const [saving,setSaving]=useState(false); const [error,setError]=useState(''); const [notice,setNotice]=useState('');
  const save = async (table: BuildFlowTable, id: string|undefined, values: Record<string,unknown>) => {
    setSaving(true);setError('');setNotice('');
    try { if(id) await update(table,id,values); else await create(table,values); setNotice(id?'Record updated successfully.':'Record created successfully.'); return true; }
    catch(e) { setError(e instanceof Error?e.message:'The record could not be saved. Check your permissions and try again.'); return false; }
    finally { setSaving(false); }
  };
  return {records,save,saving,error,notice,setError,setNotice};
}
const projectFields = (projects: Row[]): Field => ({name:'project_id',label:'Project',type:'select',options:projects.map(p=>({value:p.id,label:String(p.name ?? 'Project')}))});
const staffFields = (staff: Row[]): Field => ({name:'assigned_to',label:'Assigned staff member',type:'select',options:staff.map(s=>({value:s.id,label:[s.first_name,s.last_name].filter(Boolean).join(' ')}))});
// ── HR & Staff ───────────────────────────────────────────────
export function HR() {
  const {records,save,saving,error,notice}=useRecordActions(); const {membership}=useAuth();
  const [members,setMembers]=useState<{user_id:string;display_name:string}[]>([]);
  useEffect(()=>{let active=true;if(!membership?.organization_id)return;void supabase.rpc('get_org_members',{target_organization_id:membership.organization_id}).then(({data,error:loadError})=>{if(active&&!loadError)setMembers((data??[]).filter((m:{status?:string})=>m.status==='active').map((m:{user_id:string;display_name:string})=>({user_id:m.user_id,display_name:m.display_name})));});return()=>{active=false;};},[membership?.organization_id]);
  const canView = useOrgPermission('workforce.view'); const canCreate = useOrgPermission('workforce.create'); const canUpdate = useOrgPermission('workforce.update');
  const [search,setSearch]=useState(''); const [editing,setEditing]=useState<Row|null>(null); const [form,setForm]=useState(false);
  const staff=(records.staff??[]) as unknown as Row[];
  const fields:Field[]=[{name:'first_name',label:'First name',required:true},{name:'last_name',label:'Last name',required:true},{name:'employee_number',label:'Employee number'},{name:'job_title',label:'Job title'},{name:'department',label:'Department'},{name:'email',label:'Email',type:'email'},{name:'phone',label:'Phone',type:'tel'},{name:'hire_date',label:'Hire date',type:'date'},{name:'employment_status',label:'Employment status',type:'select',defaultValue:'active',options:[{value:'active',label:'Active'},{value:'inactive',label:'Inactive'},{value:'on_leave',label:'On leave'},{value:'terminated',label:'Terminated'}]},{name:'user_id',label:'Linked BuildFlow account (active organisation member)',type:'select',options:members.map(m=>({value:m.user_id,label:m.display_name}))},{name:'notes',label:'Notes',type:'textarea'}];
  const filtered=staff.filter(s=>[s.first_name,s.last_name,s.job_title,s.department].join(' ').toLowerCase().includes(search.toLowerCase()));
  const submit=async(v:Record<string,string>)=>{const ok=await save('staff',editing?.id,{...v,hire_date:v.hire_date||null,employee_number:v.employee_number||null,user_id:v.user_id||null});if(ok){setForm(false);setEditing(null);}};
  if (!canView) return <NoAccess/>;
  return <div className="space-y-6">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4"><StatCard label="Total Staff" value={String(staff.length)} icon={<Users size={20}/>} accent="blue"/><StatCard label="Departments" value={String(new Set(staff.map(s=>s.department).filter(Boolean)).size)} icon={<HardHat size={20}/>} accent="green"/><StatCard label="Active" value={String(staff.filter(s=>s.employment_status==='active').length)} icon={<CheckCircle2 size={20}/>} accent="green"/><StatCard label="On Leave" value={String(staff.filter(s=>s.employment_status==='on_leave').length)} icon={<AlertTriangle size={20}/>} accent="amber"/></div>
    <Feedback error={error} notice={notice}/>
    {form&&<RecordEditor key={editing?.id??'new-staff'} title={editing?'Edit staff record':'Add staff member'} fields={fields} initial={editing} saving={saving} onSave={submit} onCancel={()=>{setForm(false);setEditing(null);}}/>}
    <Card><CardHeader title="Staff Directory" subtitle={`${filtered.length} staff members`} action={<div className="flex items-center gap-2"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search staff…" className="w-36 rounded-lg border border-gray-200 px-3 py-2 text-sm"/>{canCreate && <button onClick={()=>{setEditing(null);setForm(true);}} className={buttonClass}><Plus size={15}/> Add Staff</button>}</div>}/><CardBody className="p-0"><Table><thead><tr><Th>Employee</Th><Th>Role</Th><Th>Department</Th><Th>Contact</Th><Th>Hire date</Th><Th>Status</Th><Th>Action</Th></tr></thead><tbody>{filtered.map(s=><Tr key={s.id}><Td><p className="font-medium text-gray-700">{[s.first_name,s.last_name].filter(Boolean).join(' ')}</p><p className="text-xs text-gray-400">{s.employee_number||s.id.slice(0,8)}</p></Td><Td>{s.job_title||'—'}</Td><Td><Badge variant="blue">{s.department||'General'}</Badge></Td><Td><p className="text-xs">{s.phone||'—'}</p><p className="text-xs text-gray-400">{s.email||''}</p></Td><Td>{formatDateShort(String(s.hire_date ?? ''))}</Td><Td><StatusBadge status={String(s.employment_status||'active')}/></Td><Td>{canUpdate && <button className={secondaryClass} onClick={()=>{setEditing(s);setForm(true);}}><Pencil size={14}/> Edit</button>}</Td></Tr>)}</tbody></Table>{!filtered.length&&<p className="p-6 text-sm text-gray-500">No staff records found. Add a staff member to begin.</p>}</CardBody></Card>
  </div>;
}

// ── Workshop ─────────────────────────────────────────────────
export function Workshop() {
  const {records,save,saving,error,notice}=useRecordActions(); const canView=useOrgPermission('work_orders.view'); const canCreate=useOrgPermission('work_orders.create'); const canUpdate=useOrgPermission('work_orders.update'); const [editing,setEditing]=useState<Row|null>(null);const [form,setForm]=useState(false);
  const orders=(records.work_orders??[]) as Row[];const projects=(records.projects??[]) as Row[];const equipment=(records.equipment??[]) as Row[];const staff=(records.staff??[]) as Row[];
  const fields:Field[]=[{name:'work_order_number',label:'Work order number'},{name:'title',label:'Work order title',required:true},{name:'description',label:'Description',type:'textarea'},{name:'project_id',label:'Project',type:'select',options:projects.map(p=>({value:p.id,label:String(p.name)}))},{name:'equipment_id',label:'Equipment',type:'select',options:equipment.map(e=>({value:e.id,label:String(e.name)}))},{name:'assigned_to',label:'Assigned staff',type:'select',options:staff.map(s=>({value:s.id,label:[s.first_name,s.last_name].filter(Boolean).join(' ')}))},{name:'priority',label:'Priority',type:'select',defaultValue:'medium',options:['low','medium','high','urgent'].map(v=>({value:v,label:v.toUpperCase()}))},{name:'status',label:'Status',type:'select',defaultValue:'open',options:['open','in_progress','completed','cancelled'].map(v=>({value:v,label:v.replace('_',' ')}))},{name:'scheduled_date',label:'Scheduled date',type:'date'},{name:'estimated_cost',label:'Estimated cost',type:'number'},{name:'actual_cost',label:'Actual cost',type:'number'},{name:'notes',label:'Notes',type:'textarea'}];
  const submit=async(v:Record<string,string>)=>{const ok=await save('work_orders',editing?.id,{...v,project_id:v.project_id||null,equipment_id:v.equipment_id||null,assigned_to:v.assigned_to||null,scheduled_date:v.scheduled_date||null,estimated_cost:v.estimated_cost?Number(v.estimated_cost):null,actual_cost:v.actual_cost?Number(v.actual_cost):null});if(ok){setForm(false);setEditing(null);}};
  if (!canView) return <NoAccess/>;
  return <div className="space-y-6"><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><StatCard label="Total orders" value={String(orders.length)} icon={<Wrench size={20}/>} accent="blue"/><StatCard label="Open" value={String(orders.filter(o=>o.status==='open').length)} icon={<AlertTriangle size={20}/>} accent="amber"/><StatCard label="In progress" value={String(orders.filter(o=>o.status==='in_progress').length)} icon={<HardHat size={20}/>} accent="blue"/><StatCard label="Completed" value={String(orders.filter(o=>o.status==='completed').length)} icon={<CheckCircle2 size={20}/>} accent="green"/></div><Feedback error={error} notice={notice}/>
    {form&&<RecordEditor key={editing?.id??'new-order'} title={editing?'Edit work order':'Create work order'} fields={fields} initial={editing} saving={saving} onSave={submit} onCancel={()=>{setForm(false);setEditing(null);}}/>}
    <Card><CardHeader title="Workshop Work Orders" subtitle={`${orders.length} live orders`} action={canCreate ? <button className={buttonClass} onClick={()=>{setEditing(null);setForm(true);}}><Plus size={15}/> New Order</button> : null}/><CardBody className="p-0"><Table><thead><tr><Th>Number</Th><Th>Title</Th><Th>Project</Th><Th>Assigned to</Th><Th>Due date</Th><Th>Priority</Th><Th>Status</Th><Th>Action</Th></tr></thead><tbody>{orders.map(o=><Tr key={o.id}><Td className="font-mono text-xs">{o.work_order_number||o.id.slice(0,8)}</Td><Td className="font-medium">{o.title}</Td><Td>{projects.find(p=>p.id===o.project_id)?.name||'—'}</Td><Td>{staff.find(s=>s.id===o.assigned_to)?[staff.find(s=>s.id===o.assigned_to)?.first_name,staff.find(s=>s.id===o.assigned_to)?.last_name].join(' '):'—'}</Td><Td>{formatDateShort(String(o.scheduled_date ?? ''))}</Td><Td><StatusBadge status={String(o.priority)}/></Td><Td><StatusBadge status={String(o.status)}/></Td><Td>{canUpdate && <button className={secondaryClass} onClick={()=>{setEditing(o);setForm(true);}}><Pencil size={14}/> Edit</button>}</Td></Tr>)}</tbody></Table>{!orders.length&&<p className="p-6 text-sm text-gray-500">No work orders yet. Create the first workshop order.</p>}</CardBody></Card>
  </div>;
}

// ── Equipment ────────────────────────────────────────────────
export function EquipmentPage() {
  const {records,save,saving,error,notice}=useRecordActions(); const {refresh}=useBuildFlowData();const canView=useOrgPermission('equipment.view');const canCreate=useOrgPermission('equipment.create');const canUpdate=useOrgPermission('equipment.update');const [editing,setEditing]=useState<Row|null>(null);const [form,setForm]=useState(false);const [assigning,setAssigning]=useState<Row|null>(null);const [assignProject,setAssignProject]=useState('');const [assignStaff,setAssignStaff]=useState('');const [assignError,setAssignError]=useState('');const [assignBusy,setAssignBusy]=useState(false);
  const equipment=(records.equipment??[]) as Row[];const projects=(records.projects??[]) as Row[];const staff=(records.staff??[]) as Row[];const assignments=(records.equipment_assignments??[]) as Row[];
  const assignEquipment=async()=>{if(!assigning||!assignProject)return;setAssignBusy(true);setAssignError('');try{const {error}=await supabase.rpc('assign_equipment',{p_equipment_id:assigning.id,p_project_id:assignProject,p_staff_id:assignStaff||null,p_notes:null});if(error)throw new Error(error.message);setAssigning(null);setAssignProject('');setAssignStaff('');await refresh();}catch(e){setAssignError(e instanceof Error?e.message:'Equipment could not be assigned.');}finally{setAssignBusy(false);}};
  const returnEquipment=async(assignmentId:string)=>{setAssignBusy(true);setAssignError('');try{const {error}=await supabase.rpc('return_equipment',{p_assignment_id:assignmentId,p_notes:null});if(error)throw new Error(error.message);await refresh();}catch(e){setAssignError(e instanceof Error?e.message:'Equipment could not be returned.');}finally{setAssignBusy(false);}};
  const fields:Field[]=[{name:'equipment_code',label:'Asset / equipment code',required:true},{name:'name',label:'Equipment name',required:true},{name:'category',label:'Category'},{name:'serial_number',label:'Serial number'},{name:'description',label:'Description',type:'textarea'},{name:'purchase_date',label:'Purchase date',type:'date'},{name:'purchase_cost',label:'Purchase cost',type:'number'},{name:'status',label:'Status',type:'select',defaultValue:'available',options:['available','assigned','maintenance','retired'].map(v=>({value:v,label:v.replace('_',' ')}))},{name:'notes',label:'Notes',type:'textarea'}];
  const submit=async(v:Record<string,string>)=>{const ok=await save('equipment',editing?.id,{...v,purchase_date:v.purchase_date||null,purchase_cost:v.purchase_cost?Number(v.purchase_cost):null});if(ok){setForm(false);setEditing(null);}};
  const activeAssignment=(id:string)=>assignments.find(a=>a.equipment_id===id&&!a.returned_at);const assignedProject=(id:string)=>projects.find(p=>p.id===activeAssignment(id)?.project_id)?.name;
  if (!canView) return <NoAccess/>;
  return <div className="space-y-6"><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><StatCard label="Total Equipment" value={String(equipment.length)} icon={<HardHat size={20}/>} accent="blue"/><StatCard label="In Use" value={String(equipment.filter(e=>e.status==='assigned').length)} icon={<HardHat size={20}/>} accent="green"/><StatCard label="Available" value={String(equipment.filter(e=>e.status==='available').length)} icon={<CheckCircle2 size={20}/>} accent="blue"/><StatCard label="Under Maintenance" value={String(equipment.filter(e=>e.status==='maintenance').length)} icon={<Wrench size={20}/>} accent="amber"/></div><Feedback error={error} notice={notice}/>
    {assignError&&<div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{assignError}</div>}
    {assigning&&<Card><CardHeader title={"Assign equipment: "+String(assigning.name)}/><CardBody><div className="grid gap-3 md:grid-cols-2"><label className="text-sm">Project<select value={assignProject} onChange={e=>setAssignProject(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2"><option value="">Select project</option>{projects.map(p=><option key={p.id} value={p.id}>{String(p.name)}</option>)}</select></label><label className="text-sm">Staff member (optional)<select value={assignStaff} onChange={e=>setAssignStaff(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2"><option value="">Not assigned to a named staff member</option>{staff.map(s=><option key={s.id} value={s.id}>{[s.first_name,s.last_name].filter(Boolean).join(' ')}</option>)}</select></label></div><div className="mt-3 flex gap-2"><button type="button" disabled={assignBusy||!assignProject} onClick={()=>void assignEquipment()} className={buttonClass}>{assignBusy?'Saving…':'Confirm assignment'}</button><button type="button" onClick={()=>setAssigning(null)} className={secondaryClass}>Cancel</button></div></CardBody></Card>}
    {form&&<RecordEditor key={editing?.id??'new-equipment'} title={editing?'Edit equipment':'Register equipment'} fields={fields} initial={editing} saving={saving} onSave={submit} onCancel={()=>{setForm(false);setEditing(null);}}/>}
    <Card><CardHeader title="Equipment Register" subtitle={`${equipment.length} live assets`} action={canCreate ? <button className={buttonClass} onClick={()=>{setEditing(null);setForm(true);}}><Plus size={15}/> Add Equipment</button> : null}/><CardBody className="p-0"><Table><thead><tr><Th>Asset</Th><Th>Type</Th><Th>Project</Th><Th>Serial no.</Th><Th>Purchase date</Th><Th>Status</Th><Th>Action</Th></tr></thead><tbody>{equipment.map(e=><Tr key={e.id}><Td><p className="font-medium">{e.name}</p><p className="text-xs text-gray-400">{e.equipment_code}</p></Td><Td>{e.category||'—'}</Td><Td>{assignedProject(e.id)||'—'}</Td><Td>{e.serial_number||'—'}</Td><Td>{formatDateShort(String(e.purchase_date ?? ''))}</Td><Td><StatusBadge status={String(e.status)}/></Td><Td><div className="flex flex-wrap gap-1">{canUpdate && <button className={secondaryClass} onClick={()=>{setEditing(e);setForm(true);}}><Pencil size={14}/> Edit</button>}{canUpdate && (activeAssignment(e.id) ? <button type="button" disabled={assignBusy} onClick={()=>void returnEquipment(activeAssignment(e.id)!.id)} className={secondaryClass}>Return</button> : e.status==='available' ? <button type="button" onClick={()=>{setAssigning(e);setAssignProject('');setAssignStaff('');}} className={secondaryClass}>Assign</button> : null)}</div></Td></Tr>)}</tbody></Table>{!equipment.length&&<p className="p-6 text-sm text-gray-500">No equipment registered. Add an asset to start the equipment register.</p>}</CardBody></Card>
  </div>;
}

// ── Risk & Quality ───────────────────────────────────────────
export function RiskQuality() {
  const {records,save,saving,error,notice}=useRecordActions();const canViewRisks=useOrgPermission('risks.view');const canCreateRisks=useOrgPermission('risks.create');const canUpdateRisks=useOrgPermission('risks.update');const canViewQuality=useOrgPermission('quality.view');const canCreateQuality=useOrgPermission('quality.create');const canUpdateQuality=useOrgPermission('quality.update');const canViewSafety=useOrgPermission('safety.view');const canCreateSafety=useOrgPermission('safety.create');const canUpdateSafety=useOrgPermission('safety.update');const [tab,setTab]=useState<'risks'|'issues'|'inspections'|'safety'>('risks');const [editing,setEditing]=useState<Row|null>(null);const [form,setForm]=useState(false);
  const projects=(records.projects??[]) as Row[];const staff=(records.staff??[]) as Row[];const risks=(records.risks??[]) as Row[];const issues=(records.quality_issues??[]) as Row[];const safety=(records.safety_incidents??[]) as Row[];const inspections=(records.inspections??[]) as Row[];
  const fields:Field[]=tab==='risks'?[{name:'title',label:'Risk title',required:true},{name:'description',label:'Description',type:'textarea'},projectFields(projects),{name:'category',label:'Category'},{name:'likelihood',label:'Likelihood',type:'select',defaultValue:'medium',options:['low','medium','high'].map(v=>({value:v,label:v}))},{name:'impact',label:'Impact',type:'select',defaultValue:'medium',options:['low','medium','high'].map(v=>({value:v,label:v}))},{name:'status',label:'Status',type:'select',defaultValue:'open',options:['open','mitigating','accepted','closed'].map(v=>({value:v,label:v}))},{name:'owner_id',label:'Risk owner',type:'select',options:staff.map(s=>({value:s.id,label:[s.first_name,s.last_name].join(' ')}))},{name:'due_date',label:'Due date',type:'date'},{name:'mitigation_plan',label:'Mitigation plan',type:'textarea'}]:
    tab==='issues'?[{name:'title',label:'Issue / snag title',required:true},{name:'description',label:'Description',type:'textarea'},projectFields(projects),{name:'category',label:'Category',type:'select',options:['issue','snag','defect','non_conformance'].map(v=>({value:v,label:v.replace('_',' ')}))},{name:'severity',label:'Severity',type:'select',defaultValue:'medium',options:['low','medium','high','critical'].map(v=>({value:v,label:v}))},{name:'status',label:'Status',type:'select',defaultValue:'open',options:['open','under_review','resolved','closed'].map(v=>({value:v,label:v.replace('_',' ')}))},staffFields(staff),{name:'due_date',label:'Due date',type:'date'},{name:'corrective_action',label:'Corrective action',type:'textarea'}]:
    tab==='inspections'?[{name:'inspection_type',label:'Inspection type',required:true},{name:'project_id',label:'Project',type:'select',required:true,options:projects.map(p=>({value:p.id,label:String(p.name)}))},{name:'inspection_number',label:'Inspection reference'},{name:'scheduled_date',label:'Scheduled date',type:'date'},{name:'inspection_date',label:'Actual inspection date',type:'date'},{name:'status',label:'Status',type:'select',defaultValue:'scheduled',options:['scheduled','completed','failed','cancelled'].map(v=>({value:v,label:v}))},{name:'inspector_name',label:'Inspector'},{name:'findings',label:'Findings',type:'textarea'},{name:'corrective_actions',label:'Corrective actions',type:'textarea'}]:
    [{name:'title',label:'Observation / event title',required:true},{name:'incident_type',label:'Event type',type:'select',defaultValue:'hazard',options:['hazard','near_miss','incident','environmental_event'].map(v=>({value:v,label:v.replace('_',' ')}))},{name:'description',label:'Description',type:'textarea',required:true}, {name:'project_id',label:'Project',type:'select',required:true,options:projects.map(p=>({value:p.id,label:String(p.name)}))},{name:'incident_date',label:'Date and time',type:'datetime-local',required:true,defaultValue:new Date().toISOString().slice(0,16)},{name:'location',label:'Location on site'},{name:'severity',label:'Severity',type:'select',defaultValue:'low',options:['low','moderate','high','critical'].map(v=>({value:v,label:v}))},{name:'persons_affected',label:'Persons affected',type:'number'},{name:'immediate_action',label:'Immediate action',type:'textarea'},staffFields(staff),{name:'status',label:'Status',type:'select',defaultValue:'open',options:['open','investigating','action_required','closed'].map(v=>({value:v,label:v.replace('_',' ')}))},{name:'corrective_action',label:'Corrective action',type:'textarea'}];
  const submit=async(v:Record<string,string>)=>{const table=tab==='risks'?'risks':tab==='issues'?'quality_issues':tab==='inspections'?'inspections':'safety_incidents';let payload:Record<string,unknown>;if(tab==='inspections'){payload={...v,scheduled_date:v.scheduled_date||null,inspection_date:v.inspection_date||null};}else{payload={...v,project_id:v.project_id||null,assigned_to:v.assigned_to||null,owner_id:v.owner_id||null,due_date:v.due_date||null};if(tab==='safety'){payload.incident_date=new Date(v.incident_date).toISOString();payload.persons_affected=Number(v.persons_affected||0);payload.closed_at=v.status==='closed'?new Date().toISOString():null;}if(tab==='issues')payload.resolved_at=v.status==='resolved'?new Date().toISOString():null;}const ok=await save(table,editing?.id,payload);if(ok){setForm(false);setEditing(null);}};
  const changeTab=(next:'risks'|'issues'|'inspections'|'safety')=>{setTab(next);setEditing(null);setForm(false);};
  const canView=tab==='risks'?canViewRisks:tab==='issues'||tab==='inspections'?canViewQuality:canViewSafety; const canCreate=tab==='risks'?canCreateRisks:tab==='issues'||tab==='inspections'?canCreateQuality:canCreateSafety; const canUpdate=tab==='risks'?canUpdateRisks:tab==='issues'||tab==='inspections'?canUpdateQuality:canUpdateSafety;
  if (!canView) return <NoAccess/>;
  return <div className="space-y-6"><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><StatCard label="Total Risks" value={String(risks.length)} icon={<ShieldAlert size={20}/>} accent="blue"/><StatCard label="Open Risks" value={String(risks.filter(r=>r.status==='open'||r.status==='mitigating').length)} icon={<AlertTriangle size={20}/>} accent="red"/><StatCard label="Quality Issues" value={String(issues.length)} icon={<Wrench size={20}/>} accent="amber"/><StatCard label="Safety Events" value={String(safety.length)} icon={<ShieldAlert size={20}/>} accent="orange"/></div><Feedback error={error} notice={notice}/>
    <div className="flex items-center gap-1 border-b border-gray-200">{([{key:'risks',label:'Risk Register'},{key:'issues',label:'Issues & Snags'},{key:'inspections',label:'Inspections'},{key:'safety',label:'Safety Observations'}] as const).map(t=><button key={t.key} onClick={()=>changeTab(t.key)} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab===t.key?'border-brand-500 text-brand-600':'border-transparent text-gray-400'}`}>{t.label}</button>)}</div>
    <div className="flex justify-end">{canCreate && <button className={buttonClass} onClick={()=>{setEditing(null);setForm(true);}}><Plus size={15}/>{tab==='risks'?'Add Risk':tab==='issues'?'Add Issue / Snag':tab==='inspections'?'Schedule Inspection':'Report Safety Observation'}</button>}</div>
    {form&&<RecordEditor key={tab+(editing?.id??'new')} title={editing?'Edit record':tab==='risks'?'Create risk':tab==='issues'?'Create issue or snag':'Report safety event'} fields={fields} initial={editing} saving={saving} onSave={submit} onCancel={()=>{setForm(false);setEditing(null);}}/>}
    {tab==='risks'&&<Card><CardHeader title="Risk Register" subtitle={`${risks.length} live risks`}/><CardBody className="p-0"><Table><thead><tr><Th>Risk</Th><Th>Project</Th><Th>Likelihood</Th><Th>Impact</Th><Th>Owner</Th><Th>Status</Th><Th>Mitigation</Th><Th>Action</Th></tr></thead><tbody>{risks.map(r=><Tr key={r.id}><Td className="font-medium">{r.title}</Td><Td>{projects.find(p=>p.id===r.project_id)?.name||'General'}</Td><Td><StatusBadge status={String(r.likelihood)}/></Td><Td><StatusBadge status={String(r.impact)}/></Td><Td>{staff.find(s=>s.id===r.owner_id)?[staff.find(s=>s.id===r.owner_id)?.first_name,staff.find(s=>s.id===r.owner_id)?.last_name].join(' '):'Unassigned'}</Td><Td><StatusBadge status={String(r.status)}/></Td><Td className="max-w-xs text-xs">{r.mitigation_plan||'—'}</Td><Td>{canUpdate && <button className={secondaryClass} onClick={()=>{setEditing(r);setForm(true);}}><Pencil size={14}/> Edit</button>}</Td></Tr>)}</tbody></Table>{!risks.length&&<p className="p-6 text-sm text-gray-500">No risks recorded.</p>}</CardBody></Card>}
    {tab==='issues'&&<Card><CardHeader title="Issues, Snags & Defects" subtitle={`${issues.length} live records`}/><CardBody className="p-0"><Table><thead><tr><Th>Issue</Th><Th>Type</Th><Th>Project</Th><Th>Severity</Th><Th>Assignee</Th><Th>Due</Th><Th>Status</Th><Th>Action</Th></tr></thead><tbody>{issues.map(i=><Tr key={i.id}><Td><p className="font-medium">{i.title}</p><p className="text-xs text-gray-400">{i.description}</p></Td><Td>{i.category||'Issue'}</Td><Td>{projects.find(p=>p.id===i.project_id)?.name||'General'}</Td><Td><StatusBadge status={String(i.severity)}/></Td><Td>{staff.find(s=>s.id===i.assigned_to)?[staff.find(s=>s.id===i.assigned_to)?.first_name,staff.find(s=>s.id===i.assigned_to)?.last_name].join(' '):'Unassigned'}</Td><Td>{formatDateShort(String(i.due_date ?? ''))}</Td><Td><StatusBadge status={String(i.status)}/></Td><Td>{canUpdate && <button className={secondaryClass} onClick={()=>{setEditing(i);setForm(true);}}><Pencil size={14}/> Edit</button>}</Td></Tr>)}</tbody></Table>{!issues.length&&<p className="p-6 text-sm text-gray-500">No quality issues or snags recorded.</p>}</CardBody></Card>}
    {tab==='inspections'&&<Card><CardHeader title="Inspection register" subtitle={inspections.length+' live inspections'}/><CardBody className="p-0"><Table><thead><tr><Th>Reference</Th><Th>Type</Th><Th>Project</Th><Th>Scheduled</Th><Th>Inspected</Th><Th>Inspector</Th><Th>Status</Th><Th>Action</Th></tr></thead><tbody>{inspections.map(i=><Tr key={i.id}><Td>{i.inspection_number||'—'}</Td><Td className="font-medium">{i.inspection_type}</Td><Td>{projects.find(p=>p.id===i.project_id)?.name||'Project'}</Td><Td>{formatDateShort(String(i.scheduled_date??''))}</Td><Td>{formatDateShort(String(i.inspection_date??''))}</Td><Td>{i.inspector_name||'—'}</Td><Td><StatusBadge status={String(i.status)}/></Td><Td>{canUpdate&&<button className={secondaryClass} onClick={()=>{setEditing(i);setForm(true);}}>Edit</button>}</Td></Tr>)}</tbody></Table>{!inspections.length&&<p className="p-6 text-sm text-gray-500">No inspections scheduled. Schedule the first project inspection.</p>}</CardBody></Card>}
    {tab==='safety'&&<div className="space-y-3">{safety.map(s=><Card key={s.id} className="p-4"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><ShieldAlert size={18} className="text-red-600"/><p className="font-semibold">{s.title}</p><StatusBadge status={String(s.status)}/></div><p className="mt-1 text-xs text-gray-500">{projects.find(p=>p.id===s.project_id)?.name||'Project'} · {s.location||'Location not recorded'} · {formatDate(String(s.incident_date ?? ''))}</p><p className="mt-2 text-sm">{s.description}</p><p className="mt-2 text-sm text-gray-600">Immediate action: {s.immediate_action||'Not recorded'}</p><p className="text-sm text-gray-600">Corrective action: {s.corrective_action||'Not recorded'}</p></div>{canUpdate && <button className={secondaryClass} onClick={()=>{setEditing(s);setForm(true);}}><Pencil size={14}/> Edit</button>}</div></Card>)}{!safety.length&&<Card className="p-6 text-sm text-gray-500">No safety observations or incidents recorded.</Card>}</div>}
  </div>;
}

// ── Reports ───────────────────────────────────────────────────
export function Reports() {
  const { records, errors } = useBuildFlowData();
  const [active, setActive] = useState('');
  const reportDefinitions = [
    { key: 'projects', name: 'Monthly Project Summary', desc: 'Live project status, progress and contract values', type: 'Projects' },
    { key: 'finance', name: 'Financial Performance', desc: 'Live invoices, expenses, payments and budget actuals', type: 'Financial' },
    { key: 'risk', name: 'Risk & Safety Report', desc: 'Open risks, quality issues and safety incidents', type: 'Safety' },
    { key: 'procurement', name: 'Procurement Summary', desc: 'Purchase requests, purchase orders and suppliers', type: 'Procurement' },
    { key: 'resources', name: 'Resource Utilisation', desc: 'Staff, equipment and current assignments', type: 'Resources' },
    { key: 'clients', name: 'Client Status Report', desc: 'Live client directory and linked project counts', type: 'Client' },
  ];
  const rowsFor = (key: string): Record<string, unknown>[] => {
    if (key === 'projects') return (records.projects ?? []).map(r => ({ Project: r.name, Code: r.project_code, Status: r.status, Progress: r.progress_percent, Contract_Value: r.contract_value, Location: r.location }));
    if (key === 'finance') return [...(records.invoices ?? []).map(r => ({ Record: 'Invoice', Reference: r.invoice_number, Status: r.status, Amount: r.total_amount, Project_ID: r.project_id })), ...(records.expenses ?? []).map(r => ({ Record: 'Expense', Reference: r.description, Status: r.status, Amount: r.amount, Project_ID: r.project_id })), ...(records.payments ?? []).map(r => ({ Record: 'Payment', Reference: r.reference, Status: r.status, Amount: r.amount, Project_ID: r.project_id }))];
    if (key === 'risk') return [...(records.risks ?? []).map(r => ({ Record: 'Risk', Title: r.title, Status: r.status, Severity: r.impact, Project_ID: r.project_id })), ...(records.quality_issues ?? []).map(r => ({ Record: 'Quality issue', Title: r.title, Status: r.status, Severity: r.severity, Project_ID: r.project_id })), ...(records.safety_incidents ?? []).map(r => ({ Record: 'Safety incident', Title: r.title, Status: r.status, Severity: r.severity, Project_ID: r.project_id }))];
    if (key === 'procurement') return [...(records.purchase_requests ?? []).map(r => ({ Record: 'Request', Reference: r.request_number, Status: r.status, Amount: r.estimated_amount, Project_ID: r.project_id })), ...(records.purchase_orders ?? []).map(r => ({ Record: 'Purchase order', Reference: r.po_number, Status: r.status, Amount: r.total_amount, Project_ID: r.project_id })), ...(records.suppliers ?? []).map(r => ({ Record: 'Supplier', Name: r.name, Status: r.status, Contact: r.contact_name }))];
    if (key === 'resources') return [...(records.staff ?? []).map(r => ({ Record: 'Staff', Name: [r.first_name, r.last_name].filter(Boolean).join(' '), Role: r.job_title, Status: r.employment_status })), ...(records.equipment ?? []).map(r => ({ Record: 'Equipment', Name: r.name, Asset: r.asset_number, Status: r.status })), ...(records.equipment_assignments ?? []).map(r => ({ Record: 'Equipment assignment', Equipment_ID: r.equipment_id, Staff_ID: r.staff_id, Project_ID: r.project_id, Returned: r.returned_at }))];
    if (key === 'clients') return (records.clients ?? []).map(r => ({ Client: r.name, Status: r.status, Email: r.email, Phone: r.phone, Linked_Projects: (records.projects ?? []).filter(p => p.client_id === r.id).length }));
    return [];
  };
  const download = (key: string) => {
    const rows = rowsFor(key);
    if (!rows.length) return;
    const headers = [...new Set(rows.flatMap(row => Object.keys(row)))];
    const csv = [headers.join(','), ...rows.map(row => headers.map(header => '"' + String(row[header] ?? '').replace(/"/g, '""') + '"').join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'buildflow-' + key + '-report.csv'; anchor.click(); URL.revokeObjectURL(url);
  };
  const selected = reportDefinitions.find(r => r.key === active);
  const reportRows = active ? rowsFor(active) : [];
  return <div className="space-y-6">
    <Card><CardHeader title="Reports" subtitle="Live, permission-filtered organisation reports" />
      <CardBody><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportDefinitions.map(r => <button type="button" key={r.key} onClick={() => setActive(r.key)} className={`border rounded-xl p-4 text-left transition-all hover:shadow-card-hover ${active === r.key ? 'border-brand-400 bg-brand-50/40' : 'border-gray-200 hover:border-gray-300'}`}>
          <div className="flex items-start justify-between mb-2"><div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><FileBarChart size={20}/></div><Badge variant="gray">{r.type}</Badge></div>
          <h3 className="text-sm font-semibold text-gray-800">{r.name}</h3><p className="text-xs text-gray-500 mt-1">{r.desc}</p><p className="text-xs text-brand-600 mt-3">Open report →</p>
        </button>)}
      </div></CardBody></Card>
    {selected && <Card><CardHeader title={selected.name} subtitle={`${reportRows.length} live record(s) available to your role`} action={<div className="flex gap-2"><button type="button" onClick={() => download(active)} disabled={!reportRows.length} className={buttonClass}>Export CSV</button><button type="button" onClick={() => setActive('')} className={secondaryClass}>Close</button></div>}/>
      <CardBody>{errors.projects && active === 'projects' ? <p className="text-sm text-amber-700">Project data could not be loaded: {errors.projects}</p> : reportRows.length ? <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead><tr>{Object.keys(reportRows[0]).map(k=><th key={k} className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500 border-b">{k.replace(/_/g,' ')}</th>)}</tr></thead><tbody>{reportRows.map((row,i)=><tr key={i} className="border-b border-gray-50">{Object.values(row).map((v,j)=><td key={j} className="px-3 py-2 text-gray-700">{String(v ?? '—')}</td>)}</tr>)}</tbody></table></div> : <p className="py-8 text-center text-sm text-gray-500">No live records are available for this report under your current access. The report will populate as authorised records are added.</p>}</CardBody>
    </Card>}
  </div>;
}
