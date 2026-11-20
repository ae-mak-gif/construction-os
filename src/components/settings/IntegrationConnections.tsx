import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Cloud, LockKeyhole, PlugZap, RefreshCw, Unplug } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type Provider = 'resend_email' | 'meta_whatsapp' | 'paynow_sms' | 'google_calendar' | 'google_drive' | 'paynow_payments';
type IntegrationRow = { id: string; provider: Provider; status: 'disconnected' | 'pending_setup' | 'connected' | 'error'; account_label: string | null; last_tested_at: string | null; last_error: string | null };
type Field = { key: string; label: string; placeholder: string; type?: string };
const definitions: { provider: Provider; name: string; description: string; fields: Field[]; note?: string }[] = [
  { provider: 'resend_email', name: 'Email · Resend', description: 'Transactional email, invitations, alerts and project correspondence.', fields: [{ key: 'apiKey', label: 'Resend API key', placeholder: 're_…', type: 'password' }, { key: 'fromEmail', label: 'Verified sender email', placeholder: 'notifications@yourdomain.com' }] },
  { provider: 'meta_whatsapp', name: 'WhatsApp · Meta Cloud API', description: 'WhatsApp messages, delivery updates and client communications.', fields: [{ key: 'accessToken', label: 'Meta access token', placeholder: 'System user access token', type: 'password' }, { key: 'phoneNumberId', label: 'WhatsApp phone number ID', placeholder: 'Meta phone number ID' }] },
  { provider: 'paynow_sms', name: 'SMS · Paynow TXT API', description: 'SMS notifications using an authorised Paynow TXT remote account.', fields: [{ key: 'username', label: 'TXT API remote username', placeholder: 'Remote account username' }, { key: 'password', label: 'TXT API password', placeholder: 'Remote account password', type: 'password' }, { key: 'host', label: 'Currency endpoint', placeholder: 'Select endpoint' }] },
  { provider: 'google_calendar', name: 'Google Calendar', description: 'Synchronise project meetings, inspections, deadlines and milestones.', fields: [], note: 'Requires a Google Cloud OAuth web application. BuildFlow will request limited calendar permissions and each organisation authorises its own Google account.' },
  { provider: 'google_drive', name: 'Google Drive', description: 'Store and organise project documents and drawings in an organisation-owned Drive.', fields: [], note: 'Requires a Google Cloud OAuth web application. Each organisation authorises its own Drive account; BuildFlow will not request access to unrelated Drive content.' },
  { provider: 'paynow_payments', name: 'Online payments · Paynow', description: 'Accept client payments and reconcile verified payment callbacks.', fields: [{ key: 'integrationId', label: 'Paynow integration ID', placeholder: 'Integration ID' }, { key: 'integrationKey', label: 'Paynow integration key', placeholder: 'Integration key', type: 'password' }], note: 'Credentials can be stored securely, but no non-transactional verification endpoint is available. Keep this connection pending until the sandbox payment and callback workflow is implemented.' },
];

export function IntegrationConnections() {
  const { membership } = useAuth();
  const [rows, setRows] = useState<IntegrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState<Provider | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState(false);
  const organizationId = membership?.organization_id;

  const load = useCallback(async () => {
    if (!organizationId) { setRows([]); setLoading(false); return; }
    setLoading(true); setError('');
    const { data, error: invokeError } = await supabase.functions.invoke('integration-manager', {
      body: { action: 'list', organization_id: organizationId },
    });
    if (invokeError) setError(invokeError.message || 'Integration status could not be loaded.');
    else setRows((data?.integrations ?? []) as IntegrationRow[]);
    setLoading(false);
  }, [organizationId]);

  useEffect(() => { void load(); }, [load]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected || !organizationId) return;
    setBusy(true); setError(''); setNotice('');
    const credentials = Object.fromEntries(Object.entries(values).filter(([, value]) => value.trim()));
    const { data, error: invokeError } = await supabase.functions.invoke('integration-manager', {
      body: { action: 'save_credentials', organization_id: organizationId, provider: selected, credentials },
    });
    if (invokeError || data?.error) setError(data?.error || invokeError?.message || 'Credentials could not be saved.');
    else {
      setNotice(data?.message || 'Credentials saved. Connection testing is still required.');
      setValues({}); setSelected(null); setShowSecrets(false); await load();
    }
    setBusy(false);
  };

  const connectGoogle = async (provider: 'google_calendar' | 'google_drive') => {
    if (!organizationId) return;
    setBusy(true); setError(''); setNotice('');
    const { data, error: invokeError } = await supabase.functions.invoke('google-oauth', {
      body: { organization_id: organizationId, provider },
    });
    if (invokeError || data?.error || !data?.authorization_url) {
      setError(data?.error || invokeError?.message || 'Google authorisation could not be started.');
      setBusy(false);
      return;
    }
    window.location.assign(data.authorization_url);
  };

  const testConnection = async (provider: Provider) => {
    if (!organizationId) return;
    setBusy(true); setError(''); setNotice('');
    const { data, error: invokeError } = await supabase.functions.invoke('integration-manager', {
      body: { action: 'test_connection', organization_id: organizationId, provider },
    });
    if (invokeError || data?.error) setError(data?.error || invokeError?.message || 'Connection test failed.');
    else setNotice(data?.message || 'Connection verified.');
    await load();
    setBusy(false);
  };

  const disconnect = async (provider: Provider) => {
    if (!organizationId || !window.confirm('Disconnect this provider and delete its stored credentials?')) return;
    setBusy(true); setError(''); setNotice('');
    const { data, error: invokeError } = await supabase.functions.invoke('integration-manager', {
      body: { action: 'disconnect', organization_id: organizationId, provider },
    });
    if (invokeError || data?.error) setError(data?.error || invokeError?.message || 'Provider could not be disconnected.');
    else { setNotice('Provider disconnected and stored credentials deleted.'); await load(); }
    setBusy(false);
  };

  const statusFor = (provider: Provider) => rows.find((row) => row.provider === provider);
  const statusLabel = (status?: IntegrationRow['status']) => status === 'connected' ? 'Connected' : status === 'pending_setup' ? 'Credentials saved · test pending' : status === 'error' ? 'Connection error' : 'Not connected';

  return <section className="space-y-4">
    <div className="flex items-start justify-between gap-3">
      <div><h2 className="text-base font-semibold text-gray-900">External connections</h2><p className="mt-1 text-xs text-gray-500">Connect organisation-owned accounts. Credentials are encrypted in Supabase Vault and never returned to the browser.</p></div>
      <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 disabled:opacity-50"><RefreshCw size={13}/> Refresh</button>
    </div>
    {error && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">{error}</p>}
    {notice && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">{notice}</p>}
    {loading ? <p className="text-sm text-gray-500">Loading organisation connections…</p> : <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {definitions.map((item) => {
        const row = statusFor(item.provider);
        const connected = row?.status === 'connected';
        const canTest = ['resend_email', 'meta_whatsapp', 'paynow_sms'].includes(item.provider);
        return <article key={item.provider} className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-start justify-between gap-2"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-700"><Cloud size={19}/></div>
            <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${connected ? 'bg-emerald-50 text-emerald-700' : row?.status === 'error' ? 'bg-red-50 text-red-700' : row?.status === 'pending_setup' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>{statusLabel(row?.status)}</span></div>
          <h3 className="mt-3 text-sm font-semibold text-gray-800">{item.name}</h3><p className="mt-1 min-h-9 text-xs text-gray-500">{item.description}</p>
          {row?.account_label && <p className="mt-2 truncate text-[11px] text-gray-400">{row.account_label}</p>}
          {row?.last_error && <p className="mt-2 text-[11px] text-red-600">{row.last_error}</p>}
          {row?.last_tested_at && <p className="mt-1 text-[10px] text-gray-400">Last tested {new Date(row.last_tested_at).toLocaleString()}</p>}
          {item.note && <p className="mt-2 rounded-lg bg-blue-50 p-2 text-[11px] text-blue-800">{item.note}</p>}
          <div className="mt-4 flex gap-2">
            {item.fields.length > 0 ? <button type="button" onClick={() => { setSelected(item.provider); setValues({}); setError(''); setNotice(''); }} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-xs font-medium text-white"><PlugZap size={13}/> {row?.status === 'pending_setup' ? 'Update credentials' : 'Configure'}</button> : (item.provider === 'google_calendar' || item.provider === 'google_drive') ? <button type="button" disabled={busy} onClick={() => void connectGoogle(item.provider as 'google_calendar' | 'google_drive')} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"><PlugZap size={13}/> {connected ? 'Reconnect Google' : 'Connect Google'}</button> : null}
            {row && row.status !== 'disconnected' && canTest && <button type="button" disabled={busy} onClick={() => void testConnection(item.provider)} className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 disabled:opacity-50">{connected ? 'Retest' : 'Test connection'}</button>}
            {row && row.status !== 'disconnected' && <button type="button" disabled={busy} onClick={() => void disconnect(item.provider)} title="Disconnect" className="rounded-lg border border-gray-200 px-3 py-2 text-gray-500 disabled:opacity-50"><Unplug size={14}/></button>}
          </div>
        </article>;
      })}
    </div>}
    {selected && (() => {
      const item = definitions.find((definition) => definition.provider === selected)!;
      return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={item.name + ' credentials'}>
        <form onSubmit={save} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between"><div><h3 className="text-lg font-semibold text-gray-900">Configure {item.name}</h3><p className="mt-1 text-xs text-gray-500">Credentials are sent directly to the BuildFlow server and encrypted before storage.</p></div><button type="button" onClick={() => setSelected(null)} className="text-sm text-gray-500">Close</button></div>
          {item.fields.map((field) => <label key={field.key} className="block"><span className="mb-1 block text-xs font-medium text-gray-700">{field.label}</span>
            {field.key === 'host' ? <select required value={values[field.key] ?? 'usd.txt.co.zw'} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="usd.txt.co.zw">USD endpoint</option><option value="www.txt.co.zw">ZWG endpoint</option></select> :
            <input required type={field.type === 'password' && !showSecrets ? 'password' : 'text'} autoComplete="off" value={values[field.key] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))} placeholder={field.placeholder} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"/>}
          </label>)}
          {item.fields.some((field) => field.type === 'password') && <label className="flex items-center gap-2 text-xs text-gray-500"><input type="checkbox" checked={showSecrets} onChange={(event) => setShowSecrets(event.target.checked)}/> Show secret fields while typing</label>}
          <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800"><LockKeyhole size={13} className="mr-1 inline"/>Saving credentials does not activate live delivery or payment collection. Provider verification and explicit activation are separate steps.</div>
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setSelected(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600">Cancel</button><button type="submit" disabled={busy} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{busy ? 'Saving…' : 'Save securely'}</button></div>
        </form>
      </div>;
    })()}
  </section>;
}
