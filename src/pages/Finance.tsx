import { useEffect, useMemo, useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, FileText, Receipt, Plus, Wallet, CheckCircle2, Undo2 } from 'lucide-react';
import { Card, CardHeader, CardBody, StatCard } from '@/components/ui/Card';
import { Table, Th, Td, Tr } from '@/components/ui/Table';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { BarChart } from '@/components/ui/BarChart';
import { DonutChart } from '@/components/ui/DonutChart';
import { Modal } from '@/components/ui/Modal';
import { useBuildFlowData } from '@/context/BuildFlowDataContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatFullCurrency, formatDate } from '@/utils/format';

type FinanceForm = 'invoice' | 'payment' | 'expense' | null;

const todayValue = () => new Date().toISOString().slice(0, 10);
const dueDateValue = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

export function Finance() {
  const { records, create, update, refresh } = useBuildFlowData();
  const { membership } = useAuth();
  const [canCreateFinance, setCanCreateFinance] = useState(false);
  const [canApproveFinance, setCanApproveFinance] = useState(false);
  const [activeForm, setActiveForm] = useState<FinanceForm>(null);
  const [saving, setSaving] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: '',
    clientId: '',
    projectId: '',
    issueDate: todayValue(),
    dueDate: dueDateValue(),
    subtotal: '',
    taxAmount: '0',
  });
  const [paymentForm, setPaymentForm] = useState({
    invoiceId: '',
    amount: '',
    paymentDate: todayValue(),
    paymentMethod: 'Bank transfer',
    paymentReference: '',
  });
  const [expenseForm, setExpenseForm] = useState({
    projectId: '',
    supplierId: '',
    category: 'Materials',
    description: '',
    amount: '',
    expenseDate: todayValue(),
  });

  useEffect(() => {
    let cancelled = false;
    async function loadFinancePermissions() {
      if (!membership?.organization_id) return;
      const [createPermission, approvePermission] = await Promise.all([
        supabase.rpc('has_org_permission', {
          target_organization_id: membership.organization_id,
          target_permission_key: 'finance.create',
        }),
        supabase.rpc('has_org_permission', {
          target_organization_id: membership.organization_id,
          target_permission_key: 'finance.approve',
        }),
      ]);
      if (cancelled) return;
      setCanCreateFinance(Boolean(createPermission.data));
      setCanApproveFinance(Boolean(approvePermission.data));
    }
    void loadFinancePermissions();
    return () => { cancelled = true; };
  }, [membership?.organization_id]);

  const clientsById = new Map((records.clients ?? []).map((row) => [row.id, row]));
  const projectsById = new Map((records.projects ?? []).map((row) => [row.id, row]));
  const suppliersById = new Map((records.suppliers ?? []).map((row) => [row.id, row]));

  const projectRows = (records.projects ?? []).map((row) => {
    const projectBudgets = (records.project_budgets ?? []).filter((budget) => budget.project_id === row.id);
    const budget = projectBudgets.reduce((sum, item) => sum + Number(item.budget_amount ?? 0), 0);
    const actualCost = (records.project_costs ?? []).filter((cost) => cost.project_id === row.id).reduce((sum, cost) => sum + Number(cost.amount ?? 0), 0);
    const contractValue = Number(row.contract_value ?? 0);
    return {
      id: row.id,
      name: String(row.name ?? 'Untitled project'),
      client: String(clientsById.get(String(row.client_id))?.name ?? 'Client'),
      contractValue,
      budget,
      actualCost,
      margin: contractValue - actualCost,
      marginPct: contractValue > 0 ? ((contractValue - actualCost) / contractValue) * 100 : 0,
      progress: Number(row.progress_percent ?? 0),
      health: row.health_status === 'at_risk' ? 'at-risk' : row.health_status === 'critical' ? 'delayed' : row.health_status === 'completed' ? 'completed' : 'on-track',
    };
  });

  const invoiceRows = (records.invoices ?? []).map((row) => {
    const paidAmount = (records.payments ?? [])
      .filter((payment) => payment.invoice_id === row.id && payment.status === 'received')
      .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
    const amount = Number(row.total_amount ?? 0);
    const balance = Math.max(0, amount - paidAmount);
    const status = row.status === 'cancelled' ? 'Cancelled'
      : row.status === 'draft' ? 'Draft'
      : balance <= 0 || row.status === 'paid' ? 'Paid'
      : row.status === 'overdue' ? 'Overdue'
      : row.status === 'partially_paid' || paidAmount > 0 ? 'Partial'
      : 'Sent';
    return {
      id: row.id,
      invoiceNumber: String(row.invoice_number ?? row.id),
      clientId: String(row.client_id ?? ''),
      client: String(clientsById.get(String(row.client_id))?.name ?? 'Client'),
      projectId: String(row.project_id ?? ''),
      project: String(projectsById.get(String(row.project_id))?.name ?? 'Unassigned'),
      amount,
      paidAmount,
      balance,
      issueDate: String(row.issue_date ?? ''),
      dueDate: String(row.due_date ?? ''),
      status,
    };
  });

  const expenseRows = (records.expenses ?? []).map((row) => ({
    id: row.id,
    expenseNumber: String(row.expense_number ?? row.id),
    description: String(row.description ?? ''),
    project: String(projectsById.get(String(row.project_id))?.name ?? 'Unassigned'),
    category: String(row.category ?? 'Other'),
    amount: Number(row.amount ?? 0),
    date: String(row.expense_date ?? ''),
    paymentStatus: String(row.payment_status ?? 'unpaid'),
    supplier: String(suppliersById.get(String(row.supplier_id))?.name ?? ''),
  }));

  const paymentRows = (records.payments ?? []).map((row) => ({
    id: row.id,
    invoiceId: String(row.invoice_id ?? ''),
    invoiceNumber: String(invoiceRows.find((invoice) => invoice.id === row.invoice_id)?.invoiceNumber ?? 'Unlinked'),
    reference: String(row.payment_reference ?? ''),
    date: String(row.payment_date ?? ''),
    amount: Number(row.amount ?? 0),
    method: String(row.payment_method ?? ''),
    status: String(row.status ?? 'pending'),
  }));

  const totalContract = projectRows.reduce((sum, project) => sum + project.contractValue, 0);
  const totalBudget = projectRows.reduce((sum, project) => sum + project.budget, 0);
  const totalCost = projectRows.reduce((sum, project) => sum + project.actualCost, 0);
  const totalPaid = paymentRows.filter((payment) => payment.status === 'received').reduce((sum, payment) => sum + payment.amount, 0);
  const totalOutstanding = invoiceRows.filter((invoice) => !['Paid', 'Draft', 'Cancelled'].includes(invoice.status)).reduce((sum, invoice) => sum + invoice.balance, 0);
  const estimatedMargin = totalContract - totalCost;
  const marginPct = totalContract > 0 ? (estimatedMargin / totalContract) * 100 : 0;

  const expenseByCategory = expenseRows.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const donutSegments = Object.entries(expenseByCategory).map(([label, value], index) => ({
    label,
    value,
    color: ['#3b82f6', '#f97316', '#10b981', '#8b5cf6', '#f59e0b'][index % 5],
  }));

  const monthlyFinancialData = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const monthDate = new Date();
    monthDate.setDate(1);
    monthDate.setMonth(monthDate.getMonth() - (6 - index));
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
    const revenue = paymentRows.filter((payment) => payment.status === 'received' && payment.date).filter((payment) => {
      const date = new Date(`${payment.date}T00:00:00`);
      return date >= monthStart && date < monthEnd;
    }).reduce((sum, payment) => sum + payment.amount, 0);
    const cost = expenseRows.filter((expense) => expense.date).filter((expense) => {
      const date = new Date(`${expense.date}T00:00:00`);
      return date >= monthStart && date < monthEnd;
    }).reduce((sum, expense) => sum + expense.amount, 0);
    return { month: monthDate.toLocaleDateString('en-ZW', { month: 'short' }), revenue, cost };
  }), [paymentRows, expenseRows]);

  const selectedPaymentInvoice = invoiceRows.find((invoice) => invoice.id === paymentForm.invoiceId);
  const computedInvoiceTotal = Number(invoiceForm.subtotal || 0) + Number(invoiceForm.taxAmount || 0);

  async function createInvoice() {
    const selectedProject = invoiceForm.projectId ? projectsById.get(invoiceForm.projectId) : null;
    const clientId = invoiceForm.clientId || String(selectedProject?.client_id ?? '');
    const subtotal = Number(invoiceForm.subtotal);
    const taxAmount = Number(invoiceForm.taxAmount || 0);
    if (!invoiceForm.invoiceNumber.trim() || !clientId || !invoiceForm.issueDate || !invoiceForm.dueDate || !Number.isFinite(subtotal) || subtotal <= 0 || !Number.isFinite(taxAmount) || taxAmount < 0) {
      window.alert('Enter an invoice number, client, valid dates and a positive subtotal.');
      return;
    }
    if (invoiceForm.dueDate < invoiceForm.issueDate) {
      window.alert('The due date cannot be earlier than the issue date.');
      return;
    }
    setSaving(true);
    try {
      await create('invoices', {
        invoice_number: invoiceForm.invoiceNumber.trim(),
        client_id: clientId,
        project_id: invoiceForm.projectId || null,
        issue_date: invoiceForm.issueDate,
        due_date: invoiceForm.dueDate,
        subtotal,
        tax_amount: taxAmount,
        total_amount: subtotal + taxAmount,
        status: 'draft',
      });
      setInvoiceForm({ invoiceNumber: '', clientId: '', projectId: '', issueDate: todayValue(), dueDate: dueDateValue(), subtotal: '', taxAmount: '0' });
      setActiveForm(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to create the invoice.');
    } finally {
      setSaving(false);
    }
  }

  async function createPayment() {
    const invoice = invoiceRows.find((row) => row.id === paymentForm.invoiceId);
    const amount = Number(paymentForm.amount);
    if (!invoice || ['Draft', 'Cancelled', 'Paid'].includes(invoice.status) || amount <= 0 || amount > invoice.balance) {
      window.alert('Select an issued invoice and enter a payment not greater than its outstanding balance.');
      return;
    }
    setSaving(true);
    try {
      await create('payments', {
        invoice_id: invoice.id,
        project_id: invoice.projectId || null,
        client_id: invoice.clientId || null,
        amount,
        payment_date: paymentForm.paymentDate,
        payment_method: paymentForm.paymentMethod,
        payment_reference: paymentForm.paymentReference.trim() || null,
        status: 'pending',
      });
      setPaymentForm({ invoiceId: '', amount: '', paymentDate: todayValue(), paymentMethod: 'Bank transfer', paymentReference: '' });
      setActiveForm(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to record the payment.');
    } finally {
      setSaving(false);
    }
  }

  async function createExpense() {
    const amount = Number(expenseForm.amount);
    if (!expenseForm.description.trim() || !expenseForm.category.trim() || !Number.isFinite(amount) || amount <= 0 || !expenseForm.expenseDate) {
      window.alert('Enter an expense description, category, positive amount and date.');
      return;
    }
    setSaving(true);
    try {
      await create('expenses', {
        project_id: expenseForm.projectId || null,
        supplier_id: expenseForm.supplierId || null,
        category: expenseForm.category.trim(),
        description: expenseForm.description.trim(),
        amount,
        expense_date: expenseForm.expenseDate,
        payment_status: 'unpaid',
      });
      setExpenseForm({ projectId: '', supplierId: '', category: 'Materials', description: '', amount: '', expenseDate: todayValue() });
      setActiveForm(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to record the expense.');
    } finally {
      setSaving(false);
    }
  }

  async function issueInvoice(invoiceId: string) {
    try {
      await update('invoices', invoiceId, { status: 'sent' });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to issue this invoice.');
    }
  }

  async function confirmPayment(paymentId: string) {
    try {
      const { error } = await supabase.rpc('confirm_invoice_payment', { p_payment_id: paymentId });
      if (error) throw error;
      await refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to confirm this payment.');
    }
  }

  async function reversePayment(paymentId: string) {
    if (!window.confirm('Reverse this received payment? The reversal will remain in the payment history.')) return;
    try {
      const { error } = await supabase.rpc('reverse_invoice_payment', { p_payment_id: paymentId });
      if (error) throw error;
      await refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to reverse this payment.');
    }
  }

  async function markExpensePaid(expenseId: string) {
    try {
      await update('expenses', expenseId, { payment_status: 'paid' });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to update the expense payment status.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Finance & Cost Control</h2>
          <p className="text-sm text-gray-500">Live invoices, receipts, expenses and project cost performance.</p>
        </div>
        {canCreateFinance && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setActiveForm('invoice')} className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"><Plus size={15} /> New Invoice</button>
            <button onClick={() => setActiveForm('payment')} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"><Wallet size={15} /> Record Payment</button>
            <button onClick={() => setActiveForm('expense')} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"><Receipt size={15} /> Add Expense</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Contract Value" value={formatCurrency(totalContract)} icon={<FileText size={20} />} accent="blue" />
        <StatCard label="Approved Budget" value={formatCurrency(totalBudget)} icon={<DollarSign size={20} />} accent="green" />
        <StatCard label="Posted Project Cost" value={formatCurrency(totalCost)} icon={<TrendingDown size={20} />} accent="orange" />
        <StatCard label="Cash Received" value={formatCurrency(totalPaid)} icon={<DollarSign size={20} />} accent="green" />
        <StatCard label="Outstanding" value={formatCurrency(totalOutstanding)} icon={<Receipt size={20} />} accent="red" />
        <StatCard label="Est. Margin" value={`${marginPct.toFixed(1)}%`} icon={<TrendingUp size={20} />} accent="blue" trend={formatCurrency(estimatedMargin)} trendUp={estimatedMargin >= 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader title="Cash Received vs Expenses" subtitle="Monthly totals — last seven months" />
          <CardBody>
            {monthlyFinancialData.some((item) => item.revenue > 0 || item.cost > 0)
              ? <BarChart data={monthlyFinancialData.map(({ month, revenue, cost }) => ({ label: month, value1: revenue, value2: cost }))} label1="Cash received" label2="Expenses" />
              : <p className="py-10 text-center text-sm text-gray-400">Monthly cash flow will appear when payments and expenses are recorded.</p>}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Expense Breakdown" subtitle="Recorded expenses by category" />
          <CardBody className="flex items-center justify-center">
            {donutSegments.length
              ? <DonutChart segments={donutSegments} centerLabel="Expenses" centerValue={formatCurrency(expenseRows.reduce((sum, expense) => sum + expense.amount, 0))} />
              : <p className="py-10 text-center text-sm text-gray-400">No expense categories recorded yet.</p>}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Project Profitability" subtitle="Contract value, approved budgets and posted project costs" />
        <CardBody className="p-0">
          <Table>
            <thead><tr><Th>Project</Th><Th>Contract Value</Th><Th>Budget</Th><Th>Actual Cost</Th><Th>Est. Margin</Th><Th>Margin %</Th><Th>Progress</Th></tr></thead>
            <tbody>
              {projectRows.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-sm text-gray-400">No project financials are available yet.</td></tr>}
              {projectRows.map((project) => (
                <Tr key={project.id}>
                  <Td className="font-medium text-gray-700">{project.name}</Td>
                  <Td className="text-gray-600">{formatFullCurrency(project.contractValue)}</Td>
                  <Td className="text-gray-600">{formatFullCurrency(project.budget)}</Td>
                  <Td className="text-orange-600 font-medium">{formatFullCurrency(project.actualCost)}</Td>
                  <Td className={project.margin >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>{formatFullCurrency(project.margin)}</Td>
                  <Td><span className={`font-semibold ${project.marginPct > 20 ? 'text-emerald-600' : project.marginPct > 0 ? 'text-amber-600' : 'text-red-600'}`}>{project.marginPct.toFixed(1)}%</span></Td>
                  <Td><div className="flex items-center gap-2 w-24"><ProgressBar value={project.progress} color={project.health === 'on-track' ? 'green' : project.health === 'at-risk' ? 'amber' : 'red'} /><span className="text-xs text-gray-400">{project.progress}%</span></div></Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Invoices" subtitle={`${invoiceRows.length} invoices`} />
          <CardBody className="p-0">
            <Table>
              <thead><tr><Th>Invoice</Th><Th>Client</Th><Th>Amount</Th><Th>Balance</Th><Th>Due</Th><Th>Status</Th><Th>Action</Th></tr></thead>
              <tbody>
                {invoiceRows.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-sm text-gray-400">No invoices recorded yet.</td></tr>}
                {invoiceRows.map((invoice) => (
                  <Tr key={invoice.id}>
                    <Td className="font-mono text-xs text-gray-500">{invoice.invoiceNumber}</Td>
                    <Td className="text-gray-600 text-xs">{invoice.client}</Td>
                    <Td className="font-medium text-gray-700">{formatFullCurrency(invoice.amount)}</Td>
                    <Td className="font-medium text-gray-700">{formatFullCurrency(invoice.balance)}</Td>
                    <Td className="text-gray-500 text-xs">{formatDate(invoice.dueDate)}</Td>
                    <Td><StatusBadge status={invoice.status} /></Td>
                    <Td>
                      {canApproveFinance && invoice.status === 'Draft' && <button onClick={() => void issueInvoice(invoice.id)} className="text-xs font-medium text-brand-600 hover:text-brand-800">Issue</button>}
                      {canCreateFinance && !['Draft', 'Cancelled', 'Paid'].includes(invoice.status) && <button onClick={() => { setPaymentForm({ ...paymentForm, invoiceId: invoice.id, amount: invoice.balance.toFixed(2) }); setActiveForm('payment'); }} className="text-xs font-medium text-brand-600 hover:text-brand-800">Record payment</button>}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Expenses" subtitle={`${expenseRows.length} expenses`} />
          <CardBody className="p-0">
            <Table>
              <thead><tr><Th>Description</Th><Th>Project</Th><Th>Category</Th><Th>Date</Th><Th>Amount</Th><Th>Status</Th><Th>Action</Th></tr></thead>
              <tbody>
                {expenseRows.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-sm text-gray-400">No expenses recorded yet.</td></tr>}
                {expenseRows.map((expense) => (
                  <Tr key={expense.id}>
                    <Td className="font-medium text-gray-700">{expense.description}</Td>
                    <Td className="text-gray-500 text-xs">{expense.project}</Td>
                    <Td><Badge variant="gray">{expense.category}</Badge></Td>
                    <Td className="text-gray-500 text-xs">{formatDate(expense.date)}</Td>
                    <Td className="font-medium text-gray-700">{formatFullCurrency(expense.amount)}</Td>
                    <Td><StatusBadge status={expense.paymentStatus} /></Td>
                    <Td>{canApproveFinance && expense.paymentStatus !== 'paid' && <button onClick={() => void markExpensePaid(expense.id)} className="text-xs font-medium text-brand-600 hover:text-brand-800">Mark paid</button>}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Payment Register" subtitle="Pending receipts, confirmed payments and reversals" />
        <CardBody className="p-0">
          <Table>
            <thead><tr><Th>Invoice</Th><Th>Reference</Th><Th>Date</Th><Th>Method</Th><Th>Amount</Th><Th>Status</Th><Th>Action</Th></tr></thead>
            <tbody>
              {paymentRows.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-sm text-gray-400">No payment records yet.</td></tr>}
              {paymentRows.map((payment) => (
                <Tr key={payment.id}>
                  <Td className="font-mono text-xs text-gray-500">{payment.invoiceNumber}</Td>
                  <Td className="text-gray-600 text-xs">{payment.reference || '—'}</Td>
                  <Td className="text-gray-500 text-xs">{formatDate(payment.date)}</Td>
                  <Td className="text-gray-500 text-xs">{payment.method || '—'}</Td>
                  <Td className="font-medium text-gray-700">{formatFullCurrency(payment.amount)}</Td>
                  <Td><StatusBadge status={payment.status} /></Td>
                  <Td>
                    {canApproveFinance && payment.status === 'pending' && <button onClick={() => void confirmPayment(payment.id)} className="text-xs font-medium text-emerald-600 hover:text-emerald-800 inline-flex items-center gap-1"><CheckCircle2 size={13} /> Confirm</button>}
                    {canApproveFinance && payment.status === 'received' && <button onClick={() => void reversePayment(payment.id)} className="text-xs font-medium text-red-600 hover:text-red-800 inline-flex items-center gap-1"><Undo2 size={13} /> Reverse</button>}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </CardBody>
      </Card>

      <Modal open={activeForm === 'invoice'} onClose={() => setActiveForm(null)} title="Create Invoice">
        <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void createInvoice(); }}>
          <div><label className="text-xs font-medium text-gray-500">Invoice number *</label><input required value={invoiceForm.invoiceNumber} onChange={(event) => setInvoiceForm({ ...invoiceForm, invoiceNumber: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="INV-2026-001" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-gray-500">Client *</label><select required value={invoiceForm.clientId} onChange={(event) => setInvoiceForm({ ...invoiceForm, clientId: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"><option value="">Select client</option>{(records.clients ?? []).filter((client) => client.status !== 'inactive').map((client) => <option key={client.id} value={client.id}>{String(client.name ?? 'Client')}</option>)}</select></div>
            <div><label className="text-xs font-medium text-gray-500">Project</label><select value={invoiceForm.projectId} onChange={(event) => setInvoiceForm({ ...invoiceForm, projectId: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"><option value="">No project linked</option>{(records.projects ?? []).map((project) => <option key={project.id} value={project.id}>{String(project.name ?? 'Project')}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-gray-500">Issue date *</label><input required type="date" value={invoiceForm.issueDate} onChange={(event) => setInvoiceForm({ ...invoiceForm, issueDate: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-gray-500">Due date *</label><input required type="date" value={invoiceForm.dueDate} onChange={(event) => setInvoiceForm({ ...invoiceForm, dueDate: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-gray-500">Subtotal *</label><input required type="number" min="0.01" step="0.01" value={invoiceForm.subtotal} onChange={(event) => setInvoiceForm({ ...invoiceForm, subtotal: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-gray-500">Tax amount</label><input type="number" min="0" step="0.01" value={invoiceForm.taxAmount} onChange={(event) => setInvoiceForm({ ...invoiceForm, taxAmount: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
          </div>
          <p className="text-sm text-gray-500 text-right">Invoice total: <strong>{formatCurrency(computedInvoiceTotal)}</strong></p>
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3"><button type="button" onClick={() => setActiveForm(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600">Cancel</button><button type="submit" disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{saving ? 'Saving…' : 'Save Draft'}</button></div>
        </form>
      </Modal>

      <Modal open={activeForm === 'payment'} onClose={() => setActiveForm(null)} title="Record Payment">
        <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void createPayment(); }}>
          <div><label className="text-xs font-medium text-gray-500">Invoice *</label><select required value={paymentForm.invoiceId} onChange={(event) => setPaymentForm({ ...paymentForm, invoiceId: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"><option value="">Select issued invoice</option>{invoiceRows.filter((invoice) => !['Draft', 'Cancelled', 'Paid'].includes(invoice.status) && invoice.balance > 0).map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.invoiceNumber} — {invoice.client} — Balance {formatCurrency(invoice.balance)}</option>)}</select></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-gray-500">Amount *</label><input required type="number" min="0.01" max={selectedPaymentInvoice?.balance ?? undefined} step="0.01" value={paymentForm.amount} onChange={(event) => setPaymentForm({ ...paymentForm, amount: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-gray-500">Payment date *</label><input required type="date" value={paymentForm.paymentDate} onChange={(event) => setPaymentForm({ ...paymentForm, paymentDate: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-gray-500">Method</label><select value={paymentForm.paymentMethod} onChange={(event) => setPaymentForm({ ...paymentForm, paymentMethod: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"><option>Bank transfer</option><option>Cash</option><option>Mobile money</option><option>Cheque</option><option>Card</option><option>Other</option></select></div>
            <div><label className="text-xs font-medium text-gray-500">Reference</label><input value={paymentForm.paymentReference} onChange={(event) => setPaymentForm({ ...paymentForm, paymentReference: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
          </div>
          <p className="text-xs text-gray-400">Payments are recorded as pending until an authorised Finance user confirms receipt.</p>
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3"><button type="button" onClick={() => setActiveForm(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600">Cancel</button><button type="submit" disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{saving ? 'Saving…' : 'Record Pending Payment'}</button></div>
        </form>
      </Modal>

      <Modal open={activeForm === 'expense'} onClose={() => setActiveForm(null)} title="Add Expense">
        <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void createExpense(); }}>
          <div><label className="text-xs font-medium text-gray-500">Description *</label><input required value={expenseForm.description} onChange={(event) => setExpenseForm({ ...expenseForm, description: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="What was purchased or paid for?" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-gray-500">Category *</label><select value={expenseForm.category} onChange={(event) => setExpenseForm({ ...expenseForm, category: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"><option>Materials</option><option>Labour</option><option>Equipment</option><option>Transport</option><option>Professional fees</option><option>Utilities</option><option>Other</option></select></div>
            <div><label className="text-xs font-medium text-gray-500">Amount *</label><input required type="number" min="0.01" step="0.01" value={expenseForm.amount} onChange={(event) => setExpenseForm({ ...expenseForm, amount: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-gray-500">Project</label><select value={expenseForm.projectId} onChange={(event) => setExpenseForm({ ...expenseForm, projectId: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"><option value="">No project linked</option>{(records.projects ?? []).map((project) => <option key={project.id} value={project.id}>{String(project.name ?? 'Project')}</option>)}</select></div>
            <div><label className="text-xs font-medium text-gray-500">Supplier</label><select value={expenseForm.supplierId} onChange={(event) => setExpenseForm({ ...expenseForm, supplierId: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"><option value="">No supplier selected</option>{(records.suppliers ?? []).map((supplier) => <option key={supplier.id} value={supplier.id}>{String(supplier.name ?? 'Supplier')}</option>)}</select></div>
          </div>
          <div><label className="text-xs font-medium text-gray-500">Expense date *</label><input required type="date" value={expenseForm.expenseDate} onChange={(event) => setExpenseForm({ ...expenseForm, expenseDate: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
          <p className="text-xs text-gray-400">New expenses are recorded as unpaid. An authorised Finance user can mark them paid.</p>
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3"><button type="button" onClick={() => setActiveForm(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600">Cancel</button><button type="submit" disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{saving ? 'Saving…' : 'Save Expense'}</button></div>
        </form>
      </Modal>
    </div>
  );
}
