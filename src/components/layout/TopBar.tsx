import { useMemo, useState } from 'react';
import { Menu, Search, Bell, ChevronDown, LogOut, Check } from 'lucide-react';
import { useAuth, getInitials } from '@/context/AuthContext';
import { useBuildFlowData } from '@/context/BuildFlowDataContext';

type SearchResult = { id: string; title: string; detail: string; page: string };
const searchable: { table: string; page: string; title: string; detail: (row: Record<string, unknown>) => string }[] = [
  { table: 'projects', page: 'projects', title: 'name', detail: r => String(r.project_code ?? r.location ?? '') },
  { table: 'clients', page: 'crm-clients', title: 'name', detail: r => String(r.email ?? r.phone ?? '') },
  { table: 'enquiries', page: 'crm-enquiries', title: 'title', detail: r => String(r.status ?? '') },
  { table: 'tasks', page: 'ops-tasks', title: 'title', detail: r => String(r.status ?? '') },
  { table: 'risks', page: 'mgmt-risk', title: 'title', detail: r => String(r.status ?? '') },
  { table: 'quality_issues', page: 'mgmt-risk', title: 'title', detail: r => String(r.status ?? '') },
  { table: 'safety_incidents', page: 'mgmt-risk', title: 'title', detail: r => String(r.status ?? '') },
  { table: 'staff', page: 'mgmt-hr', title: 'first_name', detail: r => [r.last_name, r.job_title].filter(Boolean).join(' · ') },
  { table: 'equipment', page: 'mgmt-equipment', title: 'name', detail: r => String(r.asset_number ?? r.status ?? '') },
  { table: 'work_orders', page: 'mgmt-workshop', title: 'title', detail: r => String(r.status ?? '') },
  { table: 'suppliers', page: 'ops-suppliers', title: 'name', detail: r => String(r.email ?? r.phone ?? '') },
  { table: 'invoices', page: 'finance', title: 'invoice_number', detail: r => String(r.status ?? '') },
  { table: 'purchase_orders', page: 'ops-procurement', title: 'po_number', detail: r => String(r.status ?? '') },
  { table: 'project_documents', page: 'project-documents', title: 'name', detail: r => String(r.file_type ?? '') },
];

export function TopBar({ title, onMenuClick, onNavigate }: { title: string; onMenuClick: () => void; onNavigate: (page: string) => void }) {
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const { profile, membership, signOut } = useAuth();
  const { records, update } = useBuildFlowData();
  const notifications = records.notifications ?? [];
  const unread = notifications.filter(n => n.is_read !== true && (!n.user_id || n.user_id === profile?.id)).length;
  const results = useMemo<SearchResult[]>(() => {
    const query = search.trim().toLowerCase();
    if (query.length < 2) return [];
    return searchable.flatMap(source => ((records as unknown as Record<string, unknown[]>)[source.table] ?? [])
      .filter((raw): raw is Record<string, unknown> => Boolean(raw && typeof raw === 'object'))
      .filter(row => [row[source.title], row.name, row.title, row.description, row.project_code, row.invoice_number, row.po_number, row.first_name, row.last_name].some(v => String(v ?? '').toLowerCase().includes(query)))
      .slice(0, 5)
      .map(row => ({ id: String(row.id), title: [row.first_name, row.last_name].filter(Boolean).join(' ') || String(row[source.title] ?? row.name ?? 'Untitled record'), detail: source.detail(row), page: source.page })))
      .slice(0, 12);
  }, [records, search]);
  const displayName = profile?.full_name || profile?.display_name || profile?.email || 'User';
  const displayRole = membership?.role_name || 'Member';
  const displayOrg = membership?.organization?.name || '';
  const initials = getInitials(profile?.full_name || profile?.display_name, profile?.email);

  async function markRead(id: string) {
    try { await update('notifications', id, { is_read: true, read_at: new Date().toISOString() }); }
    catch (error) { console.error('Unable to mark notification as read', error); }
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden text-gray-500 hover:text-gray-700"><Menu size={22} /></button>
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-64">
            <Search size={16} className="text-gray-400" />
            <input value={search} onFocus={() => setShowSearch(true)} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') { setSearch(''); setShowSearch(false); } if (e.key === 'Enter' && results[0]) { onNavigate(results[0].page); setSearch(''); setShowSearch(false); } }} type="search" placeholder="Search projects, tasks, people…" className="bg-transparent text-sm outline-none flex-1 text-gray-600 placeholder-gray-400" />
          </div>
          {showSearch && search.trim().length >= 2 && <div className="absolute right-0 mt-2 w-96 max-h-96 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl z-50">
            {results.length ? results.map(r => <button key={r.page + r.id} onClick={() => { onNavigate(r.page); setSearch(''); setShowSearch(false); }} className="block w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0"><span className="block text-sm font-medium text-gray-800">{r.title}</span><span className="block text-xs text-gray-500">{r.detail}</span></button>) : <p className="px-4 py-3 text-sm text-gray-500">No matching records in the data currently available to your role.</p>}
          </div>}
        </div>
        {showSearch && <button aria-label="Close search" className="fixed inset-0 z-10 cursor-default" onClick={() => setShowSearch(false)} />}
        <div className="relative">
          <button onClick={() => setShowNotifs(!showNotifs)} className="relative w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors" aria-label="Notifications">
            <Bell size={20} />{unread > 0 && <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unread > 99 ? '99+' : unread}</span>}
          </button>
          {showNotifs && <>
            <div className="fixed inset-0 z-30" onClick={() => setShowNotifs(false)} />
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-40 max-h-96 overflow-y-auto">
              <div className="px-4 py-3 border-b border-gray-100 flex justify-between"><h3 className="text-sm font-semibold text-gray-800">Notifications</h3><span className="text-xs text-gray-400">{unread} unread</span></div>
              {notifications.length ? notifications.filter(n => !n.user_id || n.user_id === profile?.id).slice(0, 30).map(n => <div key={n.id} className={`px-4 py-3 border-b border-gray-50 last:border-0 ${n.is_read !== true ? 'bg-blue-50/40' : ''}`}>
                <div className="flex items-start gap-2"><div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.type === 'alert' ? 'bg-red-500' : n.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                  <div className="flex-1"><p className="text-xs font-semibold text-gray-700">{String(n.title ?? 'Notification')}</p><p className="text-xs text-gray-500 mt-0.5">{String(n.message ?? '')}</p><p className="text-[10px] text-gray-400 mt-1">{new Date(String(n.created_at)).toLocaleString()}</p></div>
                  {n.is_read !== true && <button title="Mark as read" onClick={() => void markRead(n.id)} className="text-gray-400 hover:text-brand-600"><Check size={15}/></button>}
                </div></div>) : <p className="px-4 py-6 text-sm text-gray-500 text-center">You're all caught up. New organisation notifications will appear here.</p>}
            </div>
          </>}
        </div>
        <div className="relative">
          <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy-600 to-navy-800 flex items-center justify-center text-white text-xs font-bold">{initials}</div>
            <div className="hidden sm:block text-left"><p className="text-xs font-semibold text-gray-700">{displayName}</p><p className="text-[10px] text-gray-400">{displayRole}{displayOrg ? ` · ${displayOrg}` : ''}</p></div>
            <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
          </button>
          {showUserMenu && <><div className="fixed inset-0 z-30" onClick={() => setShowUserMenu(false)} /><div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 z-40">
            <div className="px-4 py-3 border-b border-gray-100"><p className="text-sm font-semibold text-gray-800">{displayName}</p><p className="text-xs text-gray-500 mt-0.5">{profile?.email}</p>{displayOrg && <p className="text-[10px] text-gray-400 mt-1">{displayOrg} · {displayRole}</p>}</div>
            <button onClick={() => { setShowUserMenu(false); void signOut(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors rounded-b-xl"><LogOut size={16} className="text-gray-400" />Sign out</button>
          </div></>}
        </div>
      </div>
    </header>
  );
}
