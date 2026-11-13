import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, User, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";

interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  agentName?: string;
}

const suggestions = [
  "Prepare my executive briefing",
  "Which projects need attention?",
  "Compare project delays with unpaid invoices",
  "What procurement requests are pending?",
];

export function VEAChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "agent",
      agentName: "Executive Orchestrator",
      content: "Hello. I coordinate BuildFlow's Project, Finance and Procurement specialists when your question needs them. I can analyse your organisation's current records and prepare recommendations. My access is read-only: I cannot change business records or approve actions.",
    },
  ]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadLatestConversation() {
      setLoadingHistory(true);
      const { data: conversation, error: conversationError } = await supabase
        .from("vea_conversations")
        .select("id")
        .eq("status", "open")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;
      if (conversationError) {
        setError("Your previous VEA conversation could not be loaded. You can still start a new request.");
        setLoadingHistory(false);
        return;
      }
      if (!conversation) {
        setLoadingHistory(false);
        return;
      }

      const { data: rows, error: messagesError } = await supabase
        .from("vea_messages")
        .select("id, sender_type, agent_key, content")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true })
        .limit(40);

      if (!cancelled) {
        setConversationId(conversation.id);
        if (messagesError) {
          setError("Your previous messages could not be loaded. You can continue with a new message.");
        } else if (rows?.length) {
          setMessages(rows.map((row) => ({
            id: row.id,
            role: row.sender_type === "user" || row.sender_type === "human" ? "user" : "agent",
            content: row.content,
            agentName: row.agent_key === "executive_orchestrator" ? "Executive Orchestrator" : row.agent_key || "Executive Orchestrator",
          })));
        }
        setLoadingHistory(false);
      }
    }
    void loadLatestConversation();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  async function sendMessage(value: string) {
    const message = value.trim();
    if (!message || sending) return;
    setError(null);
    setInput("");
    setSending(true);
    const localId = "local-" + Date.now();
    setMessages((current) => [...current, { id: localId, role: "user", content: message }]);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (sessionError || !accessToken) throw new Error("Your BuildFlow session has expired. Sign in again.");

      const response = await fetch("/api/vea-chat", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, conversation_id: conversationId }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.reply) {
        throw new Error(result?.error || "The Executive Assistant is not available yet.");
      }

      setConversationId(result.conversation_id);
      setMessages((current) => [
        ...current,
        {
          id: result.run_id || "agent-" + Date.now(),
          role: "agent",
          agentName: result.agent_name || "Executive Orchestrator",
          content: result.reply,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reach the Executive Assistant.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-emerald-700" />
          <div>
            <p className="text-sm font-semibold text-emerald-900">VEA coordinated runtime</p>
            <p className="text-xs text-emerald-800">Groq model · Organisation-scoped · Read-only</p>
          </div>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-emerald-800">No write actions enabled</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Card className="flex h-[600px] flex-col">
            <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-navy-700 to-brand-700">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">BuildFlow Executive Assistant</h3>
                <p className="text-xs text-gray-400">Executive Orchestrator · Project, Finance & Procurement specialists</p>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
              {loadingHistory && <p className="text-xs text-gray-400">Loading your latest conversation…</p>}
              {messages.map((message) => (
                <div key={message.id} className={"flex gap-3 " + (message.role === "user" ? "flex-row-reverse" : "")}>
                  <div className={"flex h-8 w-8 shrink-0 items-center justify-center rounded-lg " + (message.role === "agent" ? "bg-gradient-to-br from-navy-700 to-brand-700" : "bg-gray-700")}>
                    {message.role === "agent" ? <Bot size={16} className="text-white" /> : <User size={16} className="text-white" />}
                  </div>
                  <div className={"max-w-[82%] rounded-xl px-4 py-3 " + (message.role === "agent" ? "bg-gray-50 text-gray-700" : "bg-brand-600 text-white")}>
                    {message.role === "agent" && <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">{message.agentName}</p>}
                    <p className="whitespace-pre-line text-sm leading-6">{message.content}</p>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Loader2 size={14} className="animate-spin" /> Executive Orchestrator is coordinating specialist analysis…
                </div>
              )}
            </div>

            {error && <p className="border-t border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-800">{error}</p>}
            <div className="border-t border-gray-100 p-4">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) void sendMessage(input); }}
                  placeholder="Ask about projects, invoices, risks or procurement…"
                  maxLength={4000}
                  disabled={sending}
                  className="min-w-0 flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 disabled:bg-gray-50"
                />
                <button
                  onClick={() => void sendMessage(input)}
                  disabled={sending || !input.trim()}
                  aria-label="Send message"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-gray-400">VEA can analyse and recommend. It cannot approve, purchase, pay, assign or modify records.</p>
            </div>
          </Card>
        </div>

        <div>
          <Card className="p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
              <Sparkles size={16} className="text-brand-600" /> Quick questions
            </h3>
            <div className="space-y-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => void sendMessage(suggestion)}
                  disabled={sending}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-left text-sm text-gray-600 transition-colors hover:border-brand-300 hover:bg-brand-50 disabled:opacity-50"
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
