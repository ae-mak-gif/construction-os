import { useState } from 'react';
import { MessageSquare, Mail, Smartphone, Send, Search } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { messages } from '@/data/mockData';

export function Communications() {
  const [channel, setChannel] = useState<'All' | 'WhatsApp' | 'SMS' | 'Email'>('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(messages[0]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeChannel, setComposeChannel] = useState<'WhatsApp' | 'SMS' | 'Email'>('WhatsApp');

  const filtered = messages.filter(
    (m) =>
      (channel === 'All' || m.channel === channel) &&
      (m.from.toLowerCase().includes(search.toLowerCase()) ||
        m.subject.toLowerCase().includes(search.toLowerCase()) ||
        m.preview.toLowerCase().includes(search.toLowerCase()))
  );

  const channelIcons: Record<string, React.ReactNode> = {
    WhatsApp: <MessageSquare size={14} />,
    SMS: <Smartphone size={14} />,
    Email: <Mail size={14} />,
  };

  const channelColors: Record<string, string> = {
    WhatsApp: 'green',
    SMS: 'blue',
    Email: 'orange',
  };

  return (
    <div className="space-y-6">
      {/* Demo mode banner */}
      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <p className="text-sm text-amber-700 font-medium">Demo Mode</p>
        <p className="text-xs text-amber-600">— Messaging is simulated. No real messages are sent.</p>
      </div>

      {/* Channel filter + compose buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {['All', 'WhatsApp', 'SMS', 'Email'].map((c) => (
            <button
              key={c}
              onClick={() => setChannel(c as any)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                channel === c ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setComposeChannel('WhatsApp'); setComposeOpen(true); }}
            className="flex items-center gap-1.5 bg-emerald-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <MessageSquare size={14} /> Send WhatsApp
          </button>
          <button
            onClick={() => { setComposeChannel('SMS'); setComposeOpen(true); }}
            className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Smartphone size={14} /> Send SMS
          </button>
          <button
            onClick={() => { setComposeChannel('Email'); setComposeOpen(true); }}
            className="flex items-center gap-1.5 bg-orange-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Mail size={14} /> Send Email
          </button>
        </div>
      </div>

      {/* Messages: list + detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <Card className="lg:col-span-1">
          <CardHeader title="Inbox" subtitle={`${filtered.length} messages`} action={
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
              <Search size={12} className="text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="bg-transparent text-xs outline-none w-24" />
            </div>
          } />
          <CardBody className="p-0 max-h-96 overflow-y-auto">
            {filtered.map((m) => (
              <div
                key={m.id}
                onClick={() => setSelected(m)}
                className={`px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors ${
                  selected?.id === m.id ? 'bg-blue-50/40' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    m.channel === 'WhatsApp' ? 'bg-emerald-50 text-emerald-600' :
                    m.channel === 'SMS' ? 'bg-blue-50 text-blue-600' :
                    'bg-orange-50 text-orange-600'
                  }`}>
                    {channelIcons[m.channel]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700 truncate">{m.from}</p>
                      <span className="text-[10px] text-gray-400 shrink-0 ml-2">{m.time}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{m.subject}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{m.preview}</p>
                  </div>
                  {m.unread && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" />}
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Detail */}
        <Card className="lg:col-span-2">
          {selected && (
            <>
              <CardHeader title={selected.subject} subtitle={`From ${selected.from} via ${selected.channel}`} action={
                <Badge variant={channelColors[selected.channel] as any}>{selected.channel}</Badge>
              } />
              <CardBody>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="font-medium text-gray-700">{selected.from}</span>
                    <span>→</span>
                    <span>{selected.to}</span>
                    <span className="text-gray-400 ml-auto">{selected.time}</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">{selected.preview}</p>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                      <input placeholder="Type a reply..." className="bg-transparent text-sm outline-none flex-1 text-gray-600" />
                      <Send size={16} className="text-gray-400" />
                    </div>
                    <button className="bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors">
                      Reply
                    </button>
                  </div>
                </div>
              </CardBody>
            </>
          )}
        </Card>
      </div>

      {/* Compose modal */}
      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setComposeOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">Compose {composeChannel}</h3>
              <button onClick={() => setComposeOpen(false)} className="text-gray-400 hover:text-gray-600 text-sm">Cancel</button>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <p className="text-xs text-amber-700 font-medium">Demo Mode — This message will not actually be sent.</p>
              </div>
              <input placeholder="To: recipient name or number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-400" />
              <input placeholder="Subject" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-400" />
              <textarea placeholder="Type your message..." rows={4} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-400 resize-none" />
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => setComposeOpen(false)} className="text-sm font-medium text-gray-500 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">Cancel</button>
                <button onClick={() => setComposeOpen(false)} className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-700">
                  <Send size={14} /> Send {composeChannel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
