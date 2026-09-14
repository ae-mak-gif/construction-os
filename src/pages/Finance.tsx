import { DollarSign, TrendingUp, TrendingDown, FileText, Receipt } from 'lucide-react';
import { Card, CardHeader, CardBody, StatCard } from '@/components/ui/Card';
import { Table, Th, Td, Tr } from '@/components/ui/Table';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { BarChart } from '@/components/ui/BarChart';
import { DonutChart } from '@/components/ui/DonutChart';
import { projects, invoices, expenses, revenueCostData } from '@/data/mockData';
import { formatCurrency, formatFullCurrency, formatDate } from '@/utils/format';

export function Finance() {
  const totalContract = projects.reduce((s, p) => s + p.contractValue, 0);
  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalCost = projects.reduce((s, p) => s + p.actualCost, 0);
  const totalPaid = invoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + i.paidAmount, 0);
  const totalOutstanding = invoices
    .filter((i) => i.status !== 'Paid')
    .reduce((s, i) => s + (i.amount - i.paidAmount), 0);
  const estimatedMargin = totalContract - totalCost;
  const marginPct = (estimatedMargin / totalContract) * 100;

  const profitability = projects.map((p) => ({
    name: p.name.split(' ').slice(0, 2).join(' '),
    contract: p.contractValue,
    cost: p.actualCost,
    margin: p.contractValue - p.actualCost,
  marginPct: ((p.contractValue - p.actualCost) / p.contractValue) * 100,
  progress: p.progress,
  health: p.health,
  budget: p.budget,
  actualCost: p.actualCost,
  contractValue: p.contractValue,
  client: p.client,
  clientCompany: p.clientCompany,
  name_full: p.name,
  manager: p.manager,
  deadline: p.deadline,
  startDate: p.startDate,
  location: p.location,
  description: p.description,
  health_full: p.health,
  status: p.status,
  id: p.id,
  progress_full: p.progress,
}));

  const expenseByCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const donutSegments = Object.entries(expenseByCategory).map(([label, value], i) => ({
    label,
    value,
    color: ['#3b82f6', '#f97316', '#10b981', '#8b5cf6', '#f59e0b'][i % 5],
  }));

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Contract Value" value={formatCurrency(totalContract)} icon={<FileText size={20} />} accent="blue" />
        <StatCard label="Budget" value={formatCurrency(totalBudget)} icon={<DollarSign size={20} />} accent="green" />
        <StatCard label="Actual Cost" value={formatCurrency(totalCost)} icon={<TrendingDown size={20} />} accent="orange" />
        <StatCard label="Paid" value={formatCurrency(totalPaid)} icon={<DollarSign size={20} />} accent="green" />
        <StatCard label="Outstanding" value={formatCurrency(totalOutstanding)} icon={<Receipt size={20} />} accent="red" />
        <StatCard label="Est. Margin" value={`${marginPct.toFixed(0)}%`} icon={<TrendingUp size={20} />} accent="blue" trend={formatCurrency(estimatedMargin)} trendUp />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader title="Revenue vs Cost" subtitle="Monthly comparison" />
          <CardBody>
            <BarChart data={revenueCostData} label1="Revenue" label2="Cost" />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Expense Breakdown" subtitle="By category" />
          <CardBody className="flex items-center justify-center">
            <DonutChart segments={donutSegments} centerLabel="Total" centerValue={formatCurrency(expenses.reduce((s, e) => s + e.amount, 0))} />
          </CardBody>
        </Card>
      </div>

      {/* Project profitability */}
      <Card>
        <CardHeader title="Project Profitability" subtitle="Contract value vs actual cost" />
        <CardBody className="p-0">
          <Table>
            <thead>
              <tr>
                <Th>Project</Th>
                <Th>Contract Value</Th>
                <Th>Budget</Th>
                <Th>Actual Cost</Th>
                <Th>Est. Margin</Th>
                <Th>Margin %</Th>
                <Th>Progress</Th>
              </tr>
            </thead>
            <tbody>
              {profitability.map((p) => (
                <Tr key={p.id}>
                  <Td className="font-medium text-gray-700">{p.name_full}</Td>
                  <Td className="text-gray-600">{formatFullCurrency(p.contractValue)}</Td>
                  <Td className="text-gray-600">{formatFullCurrency(p.budget)}</Td>
                  <Td className="text-orange-600 font-medium">{formatFullCurrency(p.actualCost)}</Td>
                  <Td className="text-emerald-600 font-semibold">{formatFullCurrency(p.margin)}</Td>
                  <Td>
                    <span className={`font-semibold ${p.marginPct > 20 ? 'text-emerald-600' : p.marginPct > 10 ? 'text-amber-600' : 'text-red-600'}`}>
                      {p.marginPct.toFixed(1)}%
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2 w-24">
                      <ProgressBar value={p.progress} color={p.health === 'on-track' ? 'green' : p.health === 'at-risk' ? 'amber' : 'red'} />
                      <span className="text-xs text-gray-400">{p.progress}%</span>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </CardBody>
      </Card>

      {/* Invoices + Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Invoices" subtitle={`${invoices.length} invoices`} />
          <CardBody className="p-0">
            <Table>
              <thead>
                <tr>
                  <Th>Invoice</Th>
                  <Th>Client</Th>
                  <Th>Amount</Th>
                  <Th>Due Date</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <Tr key={inv.id}>
                    <Td className="font-mono text-xs text-gray-400">{inv.id}</Td>
                    <Td className="text-gray-600 text-xs">{inv.client}</Td>
                    <Td className="font-medium text-gray-700">{formatFullCurrency(inv.amount)}</Td>
                    <Td className="text-gray-500 text-xs">{formatDate(inv.dueDate)}</Td>
                    <Td><StatusBadge status={inv.status} /></Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Recent Expenses" subtitle={`${expenses.length} expenses`} />
          <CardBody className="p-0">
            <Table>
              <thead>
                <tr>
                  <Th>Description</Th>
                  <Th>Project</Th>
                  <Th>Category</Th>
                  <Th>Amount</Th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <Tr key={e.id}>
                    <Td className="font-medium text-gray-700">{e.description}</Td>
                    <Td className="text-gray-500 text-xs">{e.project}</Td>
                    <Td><Badge variant="gray">{e.category}</Badge></Td>
                    <Td className="font-medium text-gray-700">{formatFullCurrency(e.amount)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
