import { ArrowUpRight, CalendarDays, ClipboardCheck, FileText, Layers3, ShieldCheck, TrendingUp, Truck, HardHat, CheckCircle2 } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { constructionModules } from '@/config/constructionModules';
import type { PageKey } from '@/components/layout/Sidebar';

const icons = { programme: CalendarDays, 'site-operations': ClipboardCheck, contracts: FileText, 'cost-control': TrendingUp, subcontractors: Truck, hse: ShieldCheck };

export function ConstructionModules({ onNavigate }: { onNavigate: (page: PageKey) => void }) {
  return <div className="space-y-6">
    <div className="rounded-2xl bg-gradient-to-r from-navy-900 to-navy-800 p-6 text-white">
      <div className="flex items-center gap-2 text-brand-300 text-xs font-semibold uppercase tracking-wider"><Layers3 size={15} /> Construction capability framework</div>
      <div className="mt-3 max-w-3xl"><h2 className="text-2xl font-bold tracking-tight">Construction modules</h2>
        <p className="mt-2 text-sm leading-6 text-navy-200">An expanded capability map for BuildFlow. Existing records and workflows are reused where they already exist; new registers and controls are added only where the current platform has a genuine gap.</p></div>
      <div className="mt-5 flex flex-wrap gap-2"><span className="rounded-full bg-white/10 px-3 py-1 text-xs">6 capability areas</span><span className="rounded-full bg-white/10 px-3 py-1 text-xs">4 proposed SaaS tiers</span><span className="rounded-full bg-white/10 px-3 py-1 text-xs">Existing data preserved</span></div>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {constructionModules.map((module) => { const Icon = icons[module.id as keyof typeof icons] ?? HardHat; return <Card key={module.id} className="flex h-full flex-col">
        <CardHeader title={module.name} subtitle={module.category} action={<Badge variant="blue">{module.proposedTier} candidate</Badge>} />
        <CardBody className="flex flex-1 flex-col">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Icon size={20} /></div>
          <p className="text-sm leading-6 text-gray-600">{module.summary}</p>
          <div className="mt-4"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Capabilities</p><ul className="space-y-2">
            {module.capabilities.map((item) => <li key={item} className="flex items-start gap-2 text-xs leading-5 text-gray-600"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" />{item}</li>)}
          </ul></div>
          <div className="mt-4 rounded-lg bg-gray-50 p-3"><p className="mb-1 text-xs font-semibold text-gray-700">Already in BuildFlow</p><p className="text-xs leading-5 text-gray-500">{module.currentFoundation.join(' · ')}</p>
            <p className="mb-1 mt-3 text-xs font-semibold text-gray-700">New capabilities to implement</p><ul className="space-y-1">{module.remainingBuild.map((item) => <li key={item} className="text-xs leading-5 text-gray-500">• {item}</li>)}</ul></div>
          <button type="button" onClick={() => onNavigate(module.openPage as PageKey)} className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700">Open related workspace <ArrowUpRight size={15} /></button>
        </CardBody></Card>; })}
    </div>
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-start gap-3"><HardHat size={18} className="mt-0.5 text-amber-700" /><div>
      <h3 className="text-sm font-semibold text-amber-900">Tier placement is provisional</h3><p className="mt-1 text-xs leading-5 text-amber-800">The tier labels are product-planning candidates, not active subscription restrictions. Final entitlements, pricing and feature gates will be configured centrally after the module data model and workflows are agreed.</p>
    </div></div></div>
  </div>;
}