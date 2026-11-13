import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2, PackageCheck, Plus, ShoppingCart, Truck } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { useBuildFlowData } from '@/context/BuildFlowDataContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDateShort } from '@/utils/format';

type RequestRow = {
  id: string; requestNumber: string; description: string; projectId: string; project: string;
  amount: number; status: string; requiredDate: string; notes: string;
};
type PurchaseOrderRow = {
  id: string; poNumber: string; projectId: string; project: string; supplierId: string;
  supplier: string; status: string; total: number; expectedDate: string; requestId: string;
};

const today = () => new Date().toISOString().slice(0, 10);
const parseQuantity = (notes: string) => {
  const match = notes.match(/Quantity:\s*([0-9.]+)/i);
  return match ? Number(match[1]) : 1;
};

export function ProcurementWorkspace() {
  const { records, create, update, refresh } = useBuildFlowData();
  const { membership } = useAuth();
  const [canCreate, setCanCreate] = useState(false);
  const [canApprove, setCanApprove] = useState(false);
  const [canReceive, setCanReceive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showRequest, setShowRequest] = useState(false);
  const [requestForm, setRequestForm] = useState({ description: '', projectId: '', quantity: '1', unit: 'pcs', amount: '', requiredDate: today() });
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [poForm, setPoForm] = useState({ supplierId: '', poNumber: '', quantity: '1', unit: 'pcs', unitPrice: '', expectedDate: '' });
  const [receiptForm, setReceiptForm] = useState<Record<string, { inventoryItemId: string; quantity: string; notes: string }>>({});

  useEffect(() => {
    let cancelled = false;
    async function loadPermissions() {
      if (!membership?.organization_id) return;
      const keys = ['procurement.create', 'procurement.approve', 'inventory.update'];
      const results = await Promise.all(keys.map((key) => supabase.rpc('has_org_permission', {
        target_organization_id: membership.organization_id,
        target_permission_key: key,
      })));
      if (cancelled) return;
      setCanCreate(Boolean(results[0].data));
      setCanApprove(Boolean(results[1].data));
      setCanReceive(Boolean(results[1].data && results[2].data));
    }
    void loadPermissions();
    return () => { cancelled = true; };
  }, [membership?.organization_id]);

  const projects = records.projects ?? [];
  const suppliers = (records.suppliers ?? []).filter((row) => row.status !== 'inactive');
  const inventory = (records.inventory_items ?? []).filter((row) => row.status === 'active');
  const projectById = useMemo(() => new Map(projects.map((row) => [row.id, row])), [projects]);
  const supplierById = useMemo(() => new Map(suppliers.map((row) => [row.id, row])), [suppliers]);

  const requests: RequestRow[] = (records.purchase_requests ?? []).map((row) => ({
    id: row.id,
    requestNumber: String(row.request_number ?? row.id.slice(0, 8).toUpperCase()),
    description: String(row.description ?? ''),
    projectId: String(row.project_id ?? ''),
    project: String(projectById.get(String(row.project_id))?.name ?? 'Unassigned project'),
    amount: Number(row.estimated_amount ?? 0),
    status: String(row.status ?? 'pending'),
    requiredDate: String(row.required_date ?? ''),
    notes: String(row.notes ?? ''),
  }));

  const purchaseOrders: PurchaseOrderRow[] = (records.purchase_orders ?? []).map((row) => ({
    id: row.id,
    poNumber: String(row.po_number ?? row.id),
    projectId: String(row.project_id ?? ''),
    project: String(projectById.get(String(row.project_id))?.name ?? 'Unassigned project'),
    supplierId: String(row.supplier_id ?? ''),
    supplier: String(supplierById.get(String(row.supplier_id))?.name ?? 'Supplier'),
    status: String(row.status ?? 'draft'),
    total: Number(row.total_amount ?? 0),
    expectedDate: String(row.expected_delivery_date ?? ''),
    requestId: String(row.purchase_request_id ?? ''),
  }));

  const lineItems = records.purchase_order_items ?? [];
  const receiptTransactions = records.inventory_transactions ?? [];
  const selectedRequestRow = requests.find((row) => row.id === selectedRequest);

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const quantity = Number(requestForm.quantity);
    const amount = Number(requestForm.amount);
    if (!requestForm.description.trim() || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(amount) || amount < 0) {
      setError('Enter a description, positive quantity and valid estimated amount.');
      return;
    }
    setBusy(true); setError(''); setNotice('');
    try {
      await create('purchase_requests', {
        project_id: requestForm.projectId || null,
        description: requestForm.description.trim(),
        status: 'pending',
        estimated_amount: amount,
        required_date: requestForm.requiredDate || null,
        notes: `Quantity: ${quantity} ${requestForm.unit.trim() || 'units'}`,
      });
      await refresh();
      setShowRequest(false);
      setRequestForm({ description: '', projectId: '', quantity: '1', unit: 'pcs', amount: '', requiredDate: today() });
      setNotice('Purchase request saved to the live register.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to create purchase request.');
    } finally { setBusy(false); }
  }

  async function createPurchaseOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedRequestRow) return;
    const quantity = Number(poForm.quantity);
    const unitPrice = Number(poForm.unitPrice);
    if (!poForm.supplierId || !poForm.poNumber.trim() || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) {
      setError('Select a supplier and enter a PO number, positive quantity and valid unit price.');
      return;
    }
    setBusy(true); setError(''); setNotice('');
    try {
      const subtotal = quantity * unitPrice;
      const order = await create('purchase_orders', {
        project_id: selectedRequestRow.projectId || null,
        supplier_id: poForm.supplierId,
        purchase_request_id: selectedRequestRow.id,
        po_number: poForm.poNumber.trim(),
        status: 'draft',
        order_date: today(),
        expected_delivery_date: poForm.expectedDate || null,
        subtotal,
        tax_amount: 0,
        total_amount: subtotal,
        notes: `Created from request ${selectedRequestRow.requestNumber}`,
      });
      await create('purchase_order_items', {
        purchase_order_id: order.id,
        description: selectedRequestRow.description,
        quantity,
        unit: poForm.unit.trim() || 'pcs',
        unit_price: unitPrice,
        total_price: subtotal,
      });
      await update('purchase_orders', order.id, { status: 'ordered' });
      await update('purchase_requests', selectedRequestRow.id, { status: 'ordered' });
      await refresh();
      setSelectedRequest(null);
      setPoForm({ supplierId: '', poNumber: '', quantity: '1', unit: 'pcs', unitPrice: '', expectedDate: '' });
      setNotice('Purchase order created and marked as ordered.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to create the purchase order. Check procurement permissions.');
      await refresh();
    } finally { setBusy(false); }
  }

  async function receiveGoods(lineId: string) {
    const form = receiptForm[lineId];
    if (!form?.inventoryItemId || Number(form.quantity) <= 0) {
      setError('Select an inventory item and enter a positive receipt quantity.');
      return;
    }
    setBusy(true); setError(''); setNotice('');
    try {
      const { error: receiveError } = await supabase.rpc('receive_purchase_order_item', {
        p_purchase_order_item_id: lineId,
        p_inventory_item_id: form.inventoryItemId,
        p_quantity: Number(form.quantity),
        p_notes: form.notes.trim() || null,
      });
      if (receiveError) throw receiveError;
      await refresh();
      setNotice(`Goods receipt posted for ${Number(form.quantity)} units. Stock and purchase order status have been updated.`);
      setReceiptForm((current) => ({ ...current, [lineId]: { ...current[lineId], quantity: '', notes: '' } }));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to record goods receipt.');
    } finally { setBusy(false); }
  }

  const statusLabel = (status: string) => status === 'pending' ? 'Requested' : status === 'ordered' ? 'PO Issued' : status === 'delivered' ? 'Delivered' : status === 'approved' ? 'Approved' : status;
  const receivedForLine = (lineId: string) => receiptTransactions.filter((tx) => tx.reference_type === 'purchase_order_item' && tx.reference_id === lineId && tx.transaction_type === 'receipt').reduce((sum, tx) => sum + Number(tx.quantity ?? 0), 0);

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-lg font-semibold text-gray-900">Procurement & Goods Receipt</h2><p className="text-sm text-gray-500">Live purchase requests, purchase orders and stock receipts.</p></div>
      {canCreate && <button type="button" onClick={() => setShowRequest(true)} className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white"><Plus size={15} /> New request</button>}
    </div>
    {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {notice && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}
    <Card><CardHeader title="Procurement sequence" subtitle="Each stage is recorded against the live organisation workspace." /><CardBody><div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-600">{['Request','Approval & PO','Supplier delivery','Goods receipt','Inventory update'].map((step,index)=><div key={step} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-brand-700">{index+1}</span>{step}{index<4&&<ArrowRight size={13} className="text-gray-300" />}</div>)}</div></CardBody></Card>
    <Card><CardHeader title="Purchase requests" subtitle={`${requests.length} live requests`} /><CardBody><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500"><th className="px-3 py-3">Request</th><th className="px-3 py-3">Description</th><th className="px-3 py-3">Project</th><th className="px-3 py-3">Estimated</th><th className="px-3 py-3">Required</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Action</th></tr></thead><tbody>
      {requests.map((row)=><tr key={row.id} className="border-b border-gray-100"><td className="px-3 py-3 font-mono text-xs text-gray-500">{row.requestNumber}</td><td className="px-3 py-3 font-medium text-gray-800">{row.description}<p className="mt-1 text-xs text-gray-400">{row.notes}</p></td><td className="px-3 py-3 text-gray-500">{row.project}</td><td className="px-3 py-3">{formatCurrency(row.amount)}</td><td className="px-3 py-3 text-gray-500">{formatDateShort(row.requiredDate)}</td><td className="px-3 py-3"><StatusBadge status={statusLabel(row.status)} /></td><td className="px-3 py-3">{canApprove && row.status === 'pending' && <button type="button" onClick={()=>{setSelectedRequest(row.id);setPoForm({supplierId:'',poNumber:`PO-${new Date().getFullYear()}-${String(purchaseOrders.length+1).padStart(3,'0')}`,quantity:String(parseQuantity(row.notes)),unit:row.notes.split(' ').slice(2).join(' ')||'pcs',unitPrice:row.amount>0?(row.amount/Math.max(1,parseQuantity(row.notes))).toFixed(2):'',expectedDate:row.requiredDate});setError('');}} className="text-xs font-semibold text-brand-700 hover:text-brand-900">Approve & create PO</button>}</td></tr>)}
      {requests.length===0&&<tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-gray-400">No purchase requests have been recorded.</td></tr>}
    </tbody></table></div></CardBody></Card>
    <Card><CardHeader title="Purchase orders" subtitle={`${purchaseOrders.length} live purchase orders`} /><CardBody><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead><tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500"><th className="px-3 py-3">PO number</th><th className="px-3 py-3">Project</th><th className="px-3 py-3">Supplier</th><th className="px-3 py-3">Total</th><th className="px-3 py-3">Expected</th><th className="px-3 py-3">Status</th></tr></thead><tbody>{purchaseOrders.map((po)=><tr key={po.id} className="border-b border-gray-100"><td className="px-3 py-3 font-mono text-xs">{po.poNumber}</td><td className="px-3 py-3">{po.project}</td><td className="px-3 py-3">{po.supplier}</td><td className="px-3 py-3 font-semibold">{formatCurrency(po.total)}</td><td className="px-3 py-3">{formatDateShort(po.expectedDate)}</td><td className="px-3 py-3"><StatusBadge status={po.status.replace('_',' ')} /></td></tr>)}{purchaseOrders.length===0&&<tr><td colSpan={6} className="px-3 py-8 text-center text-sm text-gray-400">No purchase orders have been issued.</td></tr>}</tbody></table></div></CardBody></Card>
    <Card><CardHeader title="Outstanding goods receipts" subtitle="Post deliveries to update inventory and close purchase orders." /><CardBody><div className="space-y-4">{purchaseOrders.filter((po)=>['ordered','partially_received'].includes(po.status)).map((po)=><div key={po.id} className="rounded-xl border border-gray-200 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold text-gray-800">{po.poNumber} · {po.supplier}</p><p className="mt-1 text-xs text-gray-500">{po.project}</p></div><StatusBadge status={po.status.replace('_',' ')} /></div><div className="mt-3 space-y-3">{lineItems.filter((line)=>line.purchase_order_id===po.id).map((line)=>{const received=receivedForLine(line.id);const outstanding=Math.max(0,Number(line.quantity??0)-received);const form=receiptForm[line.id]??{inventoryItemId:'',quantity:String(outstanding),notes:''};return <div key={line.id} className="grid gap-3 rounded-lg bg-gray-50 p-3 md:grid-cols-4 md:items-end"><div className="md:col-span-2"><p className="text-sm font-medium text-gray-800">{String(line.description)}</p><p className="mt-1 text-xs text-gray-500">Ordered {Number(line.quantity)} {String(line.unit??'')} · Received {received} · Outstanding {outstanding}</p></div><label className="text-xs font-medium text-gray-600">Inventory item<select disabled={!canReceive||busy} value={form.inventoryItemId} onChange={(event)=>setReceiptForm((current)=>({...current,[line.id]:{...form,inventoryItemId:event.target.value}}))} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm"><option value="">Select stock item</option>{inventory.map((item)=><option key={item.id} value={item.id}>{String(item.name)} ({String(item.unit)})</option>)}</select></label><label className="text-xs font-medium text-gray-600">Received quantity<input disabled={!canReceive||busy} type="number" min="0.01" max={outstanding} step="0.01" value={form.quantity} onChange={(event)=>setReceiptForm((current)=>({...current,[line.id]:{...form,quantity:event.target.value}}))} className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-2 text-sm" /></label><div className="md:col-span-3"><input disabled={!canReceive||busy} value={form.notes} onChange={(event)=>setReceiptForm((current)=>({...current,[line.id]:{...form,notes:event.target.value}}))} placeholder="Delivery note / waybill / condition notes" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div><button type="button" disabled={!canReceive||busy||outstanding<=0} onClick={()=>void receiveGoods(line.id)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"><PackageCheck size={15} /> Post receipt</button></div>;})}</div></div>)}{purchaseOrders.filter((po)=>['ordered','partially_received'].includes(po.status)).length===0&&<p className="py-6 text-center text-sm text-gray-400">No outstanding purchase order deliveries.</p>}</div></CardBody></Card>

    {showRequest && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form onSubmit={(event)=>void submitRequest(event)} className="w-full max-w-xl space-y-4 rounded-2xl bg-white p-6 shadow-xl"><div className="flex items-center justify-between"><h3 className="text-lg font-semibold">New purchase request</h3><button type="button" onClick={()=>setShowRequest(false)} className="text-sm text-gray-500">Close</button></div><label className="block text-sm font-medium text-gray-700">Item / description<input required value={requestForm.description} onChange={(event)=>setRequestForm({...requestForm,description:event.target.value})} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" /></label><label className="block text-sm font-medium text-gray-700">Project<select value={requestForm.projectId} onChange={(event)=>setRequestForm({...requestForm,projectId:event.target.value})} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2"><option value="">General / not project linked</option>{projects.map((project)=><option key={project.id} value={project.id}>{String(project.name)}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium text-gray-700">Quantity<input required type="number" min="0.01" step="0.01" value={requestForm.quantity} onChange={(event)=>setRequestForm({...requestForm,quantity:event.target.value})} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" /></label><label className="text-sm font-medium text-gray-700">Unit<input value={requestForm.unit} onChange={(event)=>setRequestForm({...requestForm,unit:event.target.value})} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" /></label></div><div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium text-gray-700">Estimated amount<input type="number" min="0" step="0.01" value={requestForm.amount} onChange={(event)=>setRequestForm({...requestForm,amount:event.target.value})} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" /></label><label className="text-sm font-medium text-gray-700">Required by<input type="date" value={requestForm.requiredDate} onChange={(event)=>setRequestForm({...requestForm,requiredDate:event.target.value})} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" /></label></div><div className="flex justify-end gap-2 border-t border-gray-100 pt-3"><button type="button" onClick={()=>setShowRequest(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm">Cancel</button><button type="submit" disabled={busy} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy?'Saving…':'Save request'}</button></div></form></div>}

    {selectedRequestRow && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form onSubmit={(event)=>void createPurchaseOrder(event)} className="w-full max-w-xl space-y-4 rounded-2xl bg-white p-6 shadow-xl"><div className="flex items-center justify-between"><h3 className="text-lg font-semibold">Approve request & issue purchase order</h3><button type="button" onClick={()=>setSelectedRequest(null)} className="text-sm text-gray-500">Close</button></div><p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{selectedRequestRow.requestNumber} · {selectedRequestRow.description}</p><label className="block text-sm font-medium text-gray-700">Supplier<select required value={poForm.supplierId} onChange={(event)=>setPoForm({...poForm,supplierId:event.target.value})} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2"><option value="">Select supplier</option>{suppliers.map((supplier)=><option key={supplier.id} value={supplier.id}>{String(supplier.name)}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium text-gray-700">PO number<input required value={poForm.poNumber} onChange={(event)=>setPoForm({...poForm,poNumber:event.target.value})} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" /></label><label className="text-sm font-medium text-gray-700">Quantity<input required type="number" min="0.01" step="0.01" value={poForm.quantity} onChange={(event)=>setPoForm({...poForm,quantity:event.target.value})} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" /></label><label className="text-sm font-medium text-gray-700">Unit<input value={poForm.unit} onChange={(event)=>setPoForm({...poForm,unit:event.target.value})} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" /></label><label className="text-sm font-medium text-gray-700">Unit price<input required type="number" min="0" step="0.01" value={poForm.unitPrice} onChange={(event)=>setPoForm({...poForm,unitPrice:event.target.value})} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" /></label></div><label className="block text-sm font-medium text-gray-700">Expected delivery<input type="date" value={poForm.expectedDate} onChange={(event)=>setPoForm({...poForm,expectedDate:event.target.value})} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" /></label><p className="text-xs text-gray-500">The PO is created as a draft, receives its line item, then transitions to ordered. The approval transition is enforced by database permissions.</p><div className="flex justify-end gap-2 border-t border-gray-100 pt-3"><button type="button" onClick={()=>setSelectedRequest(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm">Cancel</button><button type="submit" disabled={busy||!canApprove||suppliers.length===0} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy?'Issuing…':'Approve & issue PO'}</button></div></form></div>}
  </div>;
}
