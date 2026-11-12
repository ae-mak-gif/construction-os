import { useMemo, useState, type FormEvent } from 'react';
import { BadgeDollarSign, Calculator, Plus, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardBody, CardHeader, StatCard } from '@/components/ui/Card';
import { useBuildFlowData } from '@/context/BuildFlowDataContext';

export function CostControl() {
  const { records, create, update } = useBuildFlowData();
  const projects = useMemo(() => records.projects ?? [], [records.projects]);
  const budgets = records.project_budgets ?? [];
  const [projectId, setProjectId] = useState('');
  const [costCode, setCostCode] = useState('');
  const [description, setDescription] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [committedAmount, setCommittedAmount] = useState('0');
  const [actualAmount, setActualAmount] = useState('0');
  const [forecastAmount, setForecastAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [reportCurrency, setReportCurrency] = useState('USD');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const projectBudgets = budgets.filter((row) => (!projectId || row.project_id === projectId) && String(row.currency_code ?? 'USD') === reportCurrency);
  const totalBudget = projectBudgets.reduce((sum, row) => sum + Number(row.budget_amount ?? 0), 0);
  const totalCommitted = projectBudgets.reduce((sum, row) => sum + Number(row.committed_amount ?? 0), 0);
  const totalActual = projectBudgets.reduce((sum, row) => sum + Number(row.actual_amount ?? 0), 0);
  const totalForecast = projectBudgets.reduce((sum, row) => sum + Number(row.forecast_amount ?? 0), 0);
  const variance = totalBudget - totalForecast;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!projectId || !costCode.trim() || !description.trim()) return;
    setSaving(true); setError('');
    try {
      await create('project_budgets', {
        project_id: projectId,
        cost_code: costCode.trim(),
        description: description.trim(),
        budget_amount: Number(budgetAmount) || 0,
        committed_amount: Number(committedAmount) || 0,
        actual_amount: Number(actualAmount) || 0,
        forecast_amount: Number(forecastAmount || actualAmount) || 0,
        currency_code: currency,
        notes: notes.trim() || null,
        created_by: null,
      });
      setReportCurrency(currency);
      setCostCode(''); setDescription(''); setBudgetAmount(''); setCommittedAmount('0'); setActualAmount('0'); setForecastAmount(''); setNotes('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save the cost code.');
    } finally { setSaving(false); }
  };

  const updateActual = async (id: string, value: string) => {
    const amount = Math.max(0, Number(value) || 0);
    const row = budgets.find((item) => item.id === id);
    if (!row) return;
    try {
      await update('project_budgets', id, {
        actual_amount: amount,
        forecast_amount: Math.max(amount, Number(row.forecast_amount ?? 0)),
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not update actual cost.');
    }
  };

  const projectName = (id: string) => String(projects.find((project) => project.id === id)?.name ?? 'Project');
  const formatMoney = (amount: number) => {
    try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: reportCurrency, maximumFractionDigits: 0 }).format(amount); }
    catch { return `${reportCurrency} ${amount.toLocaleString()}`; }
  };

  return <div className="space-y-6">
    <div className="rounded-2xl bg-gradient-to-r from-navy-900 to-navy-800 p-6 text-white">
      <div className="flex items-center gap-2 text-brand-300 text-xs font-semibold uppercase tracking-wider"><Calculator size={15} /> Commercial controls</div>
      <h2 className="mt-3 text-2xl font-bold tracking-tight">Project cost control</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-navy-200">Track each project's approved budget, committed spend, actual cost and forecast final cost by cost code.</p>
    </div>
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <StatCard label="Approved budget" value={formatMoney(totalBudget)} icon={<BadgeDollarSign size={20} />} accent="blue" />
      <StatCard label="Committed" value={formatMoney(totalCommitted)} icon={<TrendingUp size={20} />} accent="orange" />
      <StatCard label="Actual cost" value={formatMoney(totalActual)} icon={<Calculator size={20} />} accent="green" />
      <StatCard label="Forecast variance" value={formatMoney(variance)} icon={<TrendingDown size={20} />} accent={variance >= 0 ? 'green' : 'red'} trend={variance >= 0 ? 'Within budget' : 'Forecast overrun'} trendUp={variance >= 0} />
    </div>
    <Card>
      <CardHeader title="Cost plan" subtitle={`Budget and forecast by project and cost code · ${reportCurrency}`} action={<div className="flex flex-wrap gap-2"><select aria-label="Filter project budgets by currency" value={reportCurrency} onChange={(event) => setReportCurrency(event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"><option value="USD">USD</option><option value="ZWL">ZWL</option><option value="ZAR">ZAR</option><option value="BWP">BWP</option></select><select aria-label="Filter project budgets" value={projectId} onChange={(event) => setProjectId(event.target.value)} className="max-w-48 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"><option value="">All projects</option>{projects.map((project) => <option key={project.id} value={project.id}>{String(project.name ?? 'Project')}</option>)}</select></div>} />
      <CardBody>
        {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {projectBudgets.length === 0 ? <p className="py-6 text-center text-sm text-gray-500">No cost codes recorded for this selection. Add the first cost line below.</p> :
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500"><th className="px-3 py-3">Project / cost code</th><th className="px-3 py-3 text-right">Budget</th><th className="px-3 py-3 text-right">Committed</th><th className="px-3 py-3 text-right">Actual</th><th className="px-3 py-3 text-right">Forecast</th><th className="px-3 py-3 text-right">Variance</th></tr></thead><tbody>{projectBudgets.map((row) => {
            const budget = Number(row.budget_amount ?? 0), committed = Number(row.committed_amount ?? 0), actual = Number(row.actual_amount ?? 0), forecast = Number(row.forecast_amount ?? 0), delta = budget - forecast;
            return <tr key={row.id} className="border-b border-gray-100 last:border-0"><td className="px-3 py-3"><p className="font-semibold text-gray-800">{String(row.cost_code)} · {String(row.description)}</p><p className="mt-1 text-xs text-gray-400">{projectName(String(row.project_id))}</p></td><td className="px-3 py-3 text-right tabular-nums">{formatMoney(budget)}</td><td className="px-3 py-3 text-right tabular-nums">{formatMoney(committed)}</td><td className="px-3 py-3 text-right"><input aria-label={`Actual cost for ${String(row.cost_code)}`} type="number" min="0" step="0.01" key={row.id + "-" + actual} defaultValue={actual} onBlur={(event) => { if (Number(event.target.value) !== actual) void updateActual(row.id, event.target.value); }} className="w-28 rounded-md border border-gray-200 px-2 py-1 text-right tabular-nums" /></td><td className="px-3 py-3 text-right tabular-nums">{formatMoney(forecast)}</td><td className={`px-3 py-3 text-right font-semibold tabular-nums ${delta >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatMoney(delta)}</td></tr>;
          })}</tbody></table></div>}
      </CardBody>
    </Card>
    <Card>
      <CardHeader title="Add cost code" subtitle="Create a baseline cost line for a project." />
      <CardBody>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="text-sm font-medium text-gray-700">Project<select required value={projectId} onChange={(event) => setProjectId(event.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"><option value="">Select project</option>{projects.map((project) => <option key={project.id} value={project.id}>{String(project.name ?? 'Project')}</option>)}</select></label>
          <label className="text-sm font-medium text-gray-700">Cost code<input required value={costCode} onChange={(event) => setCostCode(event.target.value)} placeholder="e.g. 03-CONC" className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
          <label className="text-sm font-medium text-gray-700">Description<input required value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Concrete and reinforcement" className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
          <label className="text-sm font-medium text-gray-700">Budget amount<input required type="number" min="0" step="0.01" value={budgetAmount} onChange={(event) => setBudgetAmount(event.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
          <label className="text-sm font-medium text-gray-700">Committed amount<input type="number" min="0" step="0.01" value={committedAmount} onChange={(event) => setCommittedAmount(event.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
          <label className="text-sm font-medium text-gray-700">Actual amount<input type="number" min="0" step="0.01" value={actualAmount} onChange={(event) => setActualAmount(event.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
          <label className="text-sm font-medium text-gray-700">Forecast final cost<input type="number" min="0" step="0.01" value={forecastAmount} onChange={(event) => setForecastAmount(event.target.value)} placeholder="Defaults to actual cost" className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
          <label className="text-sm font-medium text-gray-700">Currency<select value={currency} onChange={(event) => setCurrency(event.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"><option value="USD">USD</option><option value="ZWL">ZWL</option><option value="ZAR">ZAR</option><option value="BWP">BWP</option></select></label>
          <label className="text-sm font-medium text-gray-700 xl:col-span-3">Notes<textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Assumptions, inclusions or exclusions..." className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
          <div className="xl:col-span-3 flex justify-end"><button type="submit" disabled={saving || !projectId || !costCode.trim() || !description.trim()} className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"><Plus size={16} />{saving ? 'Saving...' : 'Add cost code'}</button></div>
        </form>
      </CardBody>
    </Card>
  </div>;
}
