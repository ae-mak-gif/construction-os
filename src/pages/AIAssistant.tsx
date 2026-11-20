import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Sparkles, User } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentName?: string;
}

interface VeaResponse {
  conversation_id?: string;
  run_id?: string;
  agent_name?: string;
  reply?: string;
  error?: string;
}

const suggestions = [
  'Which projects need management attention?',
  'Summarise the BuildFlow Pilot Project',
  'What payments are overdue?',
  'What procurement requests need action?',
  'Prepare an executive briefing',
];

export function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'init',
    role: 'assistant',
    content: "Hello. I'm BuildFlow VEA, your read-only virtual executive assistant. I can analyse the live organisation context available to your account across projects, tasks, risks, invoices, procurement requests and upcoming calendar events. I cannot approve or change records.\n\nWhat would you like to understand?",
  }]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isSending]);

  const sendMessage = async (rawText: string) => {
    const message = rawText.trim();
    if (!message || isSending) return;
    setError('');
    setInput('');
    setMessages((current) => [...current, {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
    }]);
    setIsSending(true);

    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const accessToken = data.session?.access_token;
      if (!accessToken) throw new Error('Your BuildFlow session has expired. Sign in again.');

      const response = await fetch('/api/vea-chat', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          ...(conversationId ? { conversation_id: conversationId } : {}),
        }),
      });
      const payload = await response.json().catch(() => ({})) as VeaResponse;
      if (!response.ok || !payload.reply) {
        throw new Error(payload.error || 'VEA could not complete this request.');
      }

      if (payload.conversation_id) setConversationId(payload.conversation_id);
      setMessages((current) => [...current, {
        id: payload.run_id || `assistant-${Date.now()}`,
        role: 'assistant',
        content: payload.reply || '',
        agentName: payload.agent_name,
      }]);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'VEA could not complete this request. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
        <Sparkles size={16} className="text-emerald-700" />
        <p className="text-sm font-semibold text-emerald-800">VEA connected · Live organisation context</p>
        <span className="text-xs text-emerald-700">Read-only · Human approval required for all actions</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Card className="flex h-[650px] flex-col">
            <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-700">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">BuildFlow VEA</h3>
                <p className="text-xs text-gray-400">Executive Orchestrator · Project · Finance · Procurement</p>
              </div>
            </div>

            <div ref={scrollRef} aria-live="polite" className="flex-1 space-y-4 overflow-y-auto p-5">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${message.role === 'assistant' ? 'bg-gradient-to-br from-purple-500 to-purple-700' : 'bg-navy-700'}`}>
                    {message.role === 'assistant' ? <Bot size={16} className="text-white" /> : <User size={16} className="text-white" />}
                  </div>
                  <div className={`max-w-[82%] rounded-xl px-4 py-3 ${message.role === 'assistant' ? 'bg-gray-50 text-gray-700' : 'bg-brand-600 text-white'}`}>
                    {message.agentName && <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-purple-700">{message.agentName}</p>}
                    <p className="whitespace-pre-line text-sm leading-6">{message.content}</p>
                  </div>
                </div>
              ))}
              {isSending && <div className="flex items-center gap-3 text-sm text-gray-500"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100"><Bot size={16} className="text-purple-700" /></div>VEA is reviewing your organisation context…</div>}
            </div>

            {error && <div role="alert" className="mx-4 mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <div className="border-t border-gray-100 p-4">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendMessage(input); } }}
                  placeholder="Ask about projects, finances, risks or procurement…"
                  disabled={isSending}
                  className="min-w-0 flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 disabled:bg-gray-50"
                />
                <button
                  type="button"
                  onClick={() => void sendMessage(input)}
                  disabled={isSending || !input.trim()}
                  aria-label="Send message to VEA"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600 text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="mt-2 text-[11px] text-gray-400">VEA can analyse and prepare recommendations. It cannot write to BuildFlow records or execute approvals.</p>
            </div>
          </Card>
        </div>

        <div>
          <Card className="p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800"><Sparkles size={16} className="text-purple-600" /> Quick questions</h3>
            <div className="space-y-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void sendMessage(suggestion)}
                  disabled={isSending}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-left text-sm text-gray-600 transition-colors hover:border-purple-300 hover:bg-purple-50 disabled:opacity-40"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
