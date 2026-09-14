import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, User } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { projects, tasks, invoices, risks } from '@/data/mockData';
import { formatCurrency, formatFullCurrency } from '@/utils/format';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

const suggestions = [
  'Which projects are at risk?',
  'Summarise Riverside Project',
  'What payments are overdue?',
  'What should I focus on today?',
  'Prepare my CEO briefing',
];

function generateResponse(query: string): string {
  const q = query.toLowerCase();

  if (q.includes('at risk') || q.includes('risk')) {
    const atRisk = projects.filter((p) => p.health === 'at-risk' || p.health === 'delayed');
    return atRisk.length > 0
      ? `There are ${atRisk.length} projects requiring attention:\n\n${atRisk.map((p) => `• ${p.name} — ${p.health === 'at-risk' ? 'At Risk' : 'Delayed'} (${p.progress}% complete, ${formatCurrency(p.budget - p.actualCost)} budget remaining)`).join('\n')}\n\nKey concerns: Steel price increases on Harare Residential Complex, and client scope changes on Borrowdale Villa Project.`
      : 'All projects are currently on track with no significant risks identified.';
  }

  if (q.includes('riverside')) {
    const p = projects.find((p) => p.name.includes('Riverside'));
    if (p) {
      return `Riverside Office Development Summary:\n\n• Client: ${p.client} (${p.clientCompany})\n• Manager: ${p.manager}\n• Progress: ${p.progress}%\n• Budget: ${formatFullCurrency(p.budget)}\n• Actual Cost: ${formatFullCurrency(p.actualCost)} (${Math.round((p.actualCost / p.budget) * 100)}% utilised)\n• Contract Value: ${formatFullCurrency(p.contractValue)}\n• Deadline: ${p.deadline}\n• Health: On Track\n\nThe project is progressing well. Foundation pour for Section B is 80% complete. Next milestone: column erection phase.\n\nNote: 1 safety observation raised regarding edge protection at Level 2 stairwell — action assigned.`;
    }
  }

  if (q.includes('overdue') || q.includes('payment')) {
    const overdue = invoices.filter((i) => i.status === 'Overdue' || i.status === 'Outstanding' || i.status === 'Partial');
    const total = overdue.reduce((s, i) => s + (i.amount - i.paidAmount), 0);
    return `Outstanding Payments:\n\n${overdue.map((i) => `• ${i.id} — ${i.client} — ${formatFullCurrency(i.amount - i.paidAmount)} (${i.status})`).join('\n')}\n\nTotal Outstanding: ${formatFullCurrency(total)}\n\nRecommendation: Follow up with Nyathi Investments and Chigumba Properties urgently. Both invoices are past their due dates.`;
  }

  if (q.includes('focus') || q.includes('today') || q.includes('should i')) {
    const overdueTasks = tasks.filter((t) => t.status === 'Overdue');
    const openRisks = risks.filter((r) => r.status === 'Open');
    return `Today's Focus Areas:\n\n1. Overdue Tasks (${overdueTasks.length}):\n${overdueTasks.map((t) => `   • ${t.title} — ${t.project}`).join('\n')}\n\n2. Open Risks (${openRisks.length}):\n${openRisks.map((r) => `   • ${r.risk} — ${r.project}`).join('\n')}\n\n3. Follow up on overdue invoices — $697,500 outstanding\n4. Approve pending procurement: PR004 (Ready-Mix Concrete)\n5. Safety observation: Install edge protection at Riverside Level 2`;
  }

  if (q.includes('ceo') || q.includes('briefing') || q.includes('summary') || q.includes('overview')) {
    const activeProjects = projects.filter((p) => p.status === 'Active').length;
    const atRisk = projects.filter((p) => p.health === 'at-risk' || p.health === 'delayed').length;
    const totalContract = projects.reduce((s, p) => s + p.contractValue, 0);
    const totalCost = projects.reduce((s, p) => s + p.actualCost, 0);
    const outstanding = invoices.filter((i) => i.status !== 'Paid').reduce((s, i) => s + (i.amount - i.paidAmount), 0);
    return `CEO BRIEFING — 11 September 2026\n\nPORTFOLIO OVERVIEW\n• Active Projects: ${activeProjects}\n• Projects at Risk: ${atRisk}\n• Total Contract Value: ${formatCurrency(totalContract)}\n• Total Actual Cost: ${formatCurrency(totalCost)}\n• Estimated Margin: ${formatCurrency(totalContract - totalCost)} (${((totalContract - totalCost) / totalContract * 100).toFixed(0)}%)\n\nFINANCIAL STATUS\n• Outstanding Payments: ${formatCurrency(outstanding)}\n• 2 invoices overdue — urgent follow-up needed\n\nKEY PRIORITIES\n1. Resolve steel delivery delay — Harare Residential Complex\n2. Follow up overdue invoices — Nyathi & Chigumba\n3. Address safety observation — Riverside Level 2\n4. Review Borrowdale Villa scope changes\n\nAll projects are within budget. No critical escalations required at this time.`;
  }

  if (q.includes('budget') || q.includes('cost')) {
    return `Budget Overview:\n\n${projects.map((p) => `• ${p.name}: ${formatCurrency(p.actualCost)} / ${formatCurrency(p.budget)} (${Math.round((p.actualCost / p.budget) * 100)}% used)`).join('\n')}\n\nAll projects are within budget. Riverside Office Development has the highest remaining budget at ${formatCurrency(projects[0].budget - projects[0].actualCost)}.`;
  }

  if (q.includes('task')) {
    const overdue = tasks.filter((t) => t.status === 'Overdue');
    const inProgress = tasks.filter((t) => t.status === 'In Progress');
    return `Task Summary:\n\n• Total Tasks: ${tasks.length}\n• In Progress: ${inProgress.length}\n• Overdue: ${overdue.length}\n• Completed: ${tasks.filter((t) => t.status === 'Done').length}\n\nOverdue tasks require immediate attention:\n${overdue.map((t) => `• ${t.title} — ${t.project} (due ${t.dueDate})`).join('\n')}`;
  }

  return `I can help you with:\n\n• Project status and health\n• Financial summaries and overdue payments\n• Task and deadline tracking\n• Risk assessment\n• CEO briefings\n\nTry asking: "Which projects are at risk?" or "Prepare my CEO briefing."`;
}

export function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'ai',
      content: "Hello! I'm your Construction OS AI Assistant. I can help you with project summaries, risk analysis, financial overviews, and CEO briefings.\n\nTry one of the suggestions below to get started.",
    },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: `u${Date.now()}`, role: 'user', content: text };
    const aiMsg: ChatMessage = { id: `a${Date.now()}`, role: 'ai', content: generateResponse(text) };
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInput('');
  };

  return (
    <div className="space-y-6">
      {/* Demo mode banner */}
      <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg px-4 py-2.5">
        <Sparkles size={16} className="text-purple-600" />
        <p className="text-sm text-purple-700 font-medium">AI Demo Mode</p>
        <p className="text-xs text-purple-600">— Responses are predefined. No AI API is connected.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat */}
        <div className="lg:col-span-3">
          <Card className="flex flex-col h-[600px]">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Construction OS AI</h3>
                <p className="text-xs text-gray-400">AI Demo Mode · Always online</p>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    m.role === 'ai' ? 'bg-gradient-to-br from-purple-500 to-purple-700' : 'bg-navy-700'
                  }`}>
                    {m.role === 'ai' ? <Bot size={16} className="text-white" /> : <User size={16} className="text-white" />}
                  </div>
                  <div className={`max-w-[75%] rounded-xl px-4 py-3 ${
                    m.role === 'ai' ? 'bg-gray-50 text-gray-700' : 'bg-brand-600 text-white'
                  }`}>
                    <p className="text-sm whitespace-pre-line">{m.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="border-t border-gray-100 p-4">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                  placeholder="Ask about projects, finances, risks..."
                  className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-400"
                />
                <button
                  onClick={() => sendMessage(input)}
                  className="w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Suggestions */}
        <div>
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-purple-600" /> Quick Questions
            </h3>
            <div className="space-y-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="w-full text-left text-sm text-gray-600 px-3 py-2.5 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
