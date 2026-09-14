import {
  MessageSquare,
  Smartphone,
  Mail,
  Calendar,
  HardDrive,
  Calculator,
  Landmark,
  CreditCard,
  ListChecks,
  Brain,
  CheckCircle2,
  Clock,
  Plug,
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface Integration {
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'ready' | 'coming';
  category: string;
  color: string;
}

const integrations: Integration[] = [
  { name: 'WhatsApp', description: 'Send and receive WhatsApp messages to clients and team members', icon: <MessageSquare size={22} />, status: 'ready', category: 'Communication', color: 'bg-emerald-50 text-emerald-600' },
  { name: 'SMS', description: 'Send SMS notifications and alerts', icon: <Smartphone size={22} />, status: 'ready', category: 'Communication', color: 'bg-blue-50 text-blue-600' },
  { name: 'Email', description: 'Send emails and manage email campaigns', icon: <Mail size={22} />, status: 'ready', category: 'Communication', color: 'bg-orange-50 text-orange-600' },
  { name: 'Google Calendar', description: 'Sync project meetings, inspections, and deadlines', icon: <Calendar size={22} />, status: 'ready', category: 'Productivity', color: 'bg-purple-50 text-purple-600' },
  { name: 'Google Drive', description: 'Cloud storage for project documents and drawings', icon: <HardDrive size={22} />, status: 'coming', category: 'Storage', color: 'bg-gray-50 text-gray-500' },
  { name: 'Accounting', description: 'Sync with accounting software (e.g. QuickBooks, Pastel)', icon: <Calculator size={22} />, status: 'coming', category: 'Finance', color: 'bg-gray-50 text-gray-500' },
  { name: 'Banking', description: 'Connect bank accounts for transaction tracking', icon: <Landmark size={22} />, status: 'coming', category: 'Finance', color: 'bg-gray-50 text-gray-500' },
  { name: 'Payment Gateway', description: 'Accept online payments from clients', icon: <CreditCard size={22} />, status: 'coming', category: 'Finance', color: 'bg-gray-50 text-gray-500' },
  { name: 'ClickUp', description: 'Sync tasks and project management with ClickUp', icon: <ListChecks size={22} />, status: 'coming', category: 'Productivity', color: 'bg-gray-50 text-gray-500' },
  { name: 'Advanced AI', description: 'Connect an AI API for intelligent insights and automation', icon: <Brain size={22} />, status: 'coming', category: 'AI', color: 'bg-gray-50 text-gray-500' },
];

export function Settings() {
  const ready = integrations.filter((i) => i.status === 'ready');
  const coming = integrations.filter((i) => i.status === 'coming');

  return (
    <div className="space-y-6">
      {/* Ready to connect */}
      <Card>
        <CardHeader title="Ready to Connect" subtitle={`${ready.length} integrations available`} />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ready.map((i) => (
              <div key={i.name} className="border border-gray-200 rounded-xl p-4 hover:shadow-card-hover transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${i.color}`}>
                    {i.icon}
                  </div>
                  <Badge variant="green">Ready</Badge>
                </div>
                <h3 className="text-sm font-semibold text-gray-800">{i.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{i.description}</p>
                <button className="mt-3 w-full flex items-center justify-center gap-1.5 text-sm font-medium text-brand-600 border border-brand-200 rounded-lg py-2 hover:bg-brand-50 transition-colors">
                  <Plug size={14} /> Connect
                </button>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Coming soon */}
      <Card>
        <CardHeader title="Coming Soon" subtitle={`${coming.length} integrations in development`} />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coming.map((i) => (
              <div key={i.name} className="border border-gray-200 rounded-xl p-4 opacity-70">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${i.color}`}>
                    {i.icon}
                  </div>
                  <Badge variant="gray">Coming Soon</Badge>
                </div>
                <h3 className="text-sm font-semibold text-gray-800">{i.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{i.description}</p>
                <div className="mt-3 w-full flex items-center justify-center gap-1.5 text-sm text-gray-400 border border-gray-200 rounded-lg py-2">
                  <Clock size={14} /> In Development
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Platform info */}
      <Card>
        <CardHeader title="Platform" subtitle="Construction OS configuration" />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-400 font-medium">Platform Name</p>
              <p className="text-sm text-gray-700 font-semibold mt-1">Construction OS</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-400 font-medium">Version</p>
              <p className="text-sm text-gray-700 font-semibold mt-1">1.0.0 (Demo)</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-400 font-medium">Powered By</p>
              <p className="text-sm text-gray-700 font-semibold mt-1">Tishande</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
