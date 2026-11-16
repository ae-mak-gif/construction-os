import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Bot, LockKeyhole, Send, Sparkles, User, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type AgentKey = 'executive_orchestrator' | 'project_intelligence' | 'business_finance' | 'procurement';
type Message = { role: 'user' | 'assistant'; content: string };

const agents: Array<{ key: AgentKey; name: string; description: string }> = [
  { key: 'executive_orchestrator', name: 'Executive Orchestrator', description: 'Cross-functional priorities and executive briefings' },
  { key: 'project_intelligence', name: 'Project Intelligence', description: 'Project health, delivery, tasks and risks' },
  { key: 'business_finance', name: 'Business & Finance', description: 'Invoices, budgets and project cost signals' },
  { key: 'procurement', name: 'Procurement', description: 'Purchase requests, orders and supplier exposure' }
];

const greeting = 'I am ready to analyse the BuildFlow records your role is permitted to see. I can provide read-only insights and recommendations; I cannot change records or approve transactions.';

export function VEAChat() {
  const { session, membership } = useAuth();
  const [agentKey, setAgentKey] = useState<AgentKey>('executive_orchestrator');
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: greeting }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedAgent = useMemo(() => agents.find((agent) => agent.key === agentKey)!, [agentKey]);

  const changeAgent = (next: AgentKey) => {
    setAgentKey(next);
    setMessages([{ role: 'assistant', content: greeting }]);
    setError('');
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt || loading) return;
    if (!session?.access_token || !membership?.organization_id) {
      setError('Sign in to an active BuildFlow organisation before using VEA.');
      return;
    }

    const previous = messages.filter((item) => item.role === 'user' || item.content !== greeting).slice(-8);
    const nextMessages: Message[] = [...messages, { role: 'user', content: prompt }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/vea/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          organization_id: membership.organization_id,
          agent_key: agentKey,
          message: prompt,
          history: previous
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'The VEA agent could not complete this request.');
      setMessages((current) => [...current, { role: 'assistant', content: result.response }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The VEA agent could not complete this request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">VEA Agent Workspace</h3>
            <p className="text-xs text-gray-500">Authenticated · organisation-scoped · read-only</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
          <LockKeyhole size={12} /> No write actions
        </span>
      </div>

      <div className="border-b border-gray-100 bg-gray-50/70 px-5 py-4">
        <label htmlFor="vea-agent-select" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Choose your specialist</label>
        <select
          id="vea-agent-select"
          value={agentKey}
          onChange={(event) => changeAgent(event.target.value as AgentKey)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:max-w-md"
        >
          {agents.map((agent) => <option key={agent.key} value={agent.key}>{agent.name}</option>)}
        </select>
        <p className="mt-1.5 text-xs text-gray-500">{selectedAgent.description}</p>
      </div>

      <div className="max-h-[420px] min-h-[230px] space-y-4 overflow-y-auto p-5">
        {messages.map((message, index) => (
          <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${message.role === 'assistant' ? 'bg-blue-100 text-blue-700' : 'bg-slate-800 text-white'}`}>
              {message.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
            </div>
            <div className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-4 py-3 text-sm leading-6 ${message.role === 'assistant' ? 'bg-gray-50 text-gray-700' : 'bg-blue-600 text-white'}`}>
              {message.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" /> {selectedAgent.name} is analysing permitted records…
          </div>
        )}
      </div>

      {error && <p role="alert" className="mx-5 mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{error}</p>}

      <form onSubmit={submit} className="border-t border-gray-100 p-4">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            rows={2}
            maxLength={3000}
            placeholder={`Ask ${selectedAgent.name} about your organisation…`}
            className="min-h-[48px] flex-1 resize-y rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={15} /> Send
          </button>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-400">
          <Sparkles size={12} /> Responses use only data your organisation role permits. No actions are executed.
        </p>
      </form>
    </section>
  );
}
