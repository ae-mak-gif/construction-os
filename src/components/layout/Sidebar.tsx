import {
  LayoutDashboard,
  Users,
  UserCheck,
  FolderKanban,
  ListTodo,
  ClipboardList,
  ShoppingCart,
  Truck,
  Boxes,
  DollarSign,
  UserCog,
  Wrench,
  HardHat,
  ShieldAlert,
  FileBarChart,
  MessageSquare,
  ExternalLink,
  Bot,
  Settings,
  Building2,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';

export type PageKey =
  | 'dashboard'
  | 'crm-enquiries'
  | 'crm-clients'
  | 'projects'
  | 'project-detail'
  | 'ops-tasks'
  | 'ops-boq'
  | 'ops-procurement'
  | 'ops-suppliers'
  | 'ops-inventory'
  | 'finance'
  | 'mgmt-hr'
  | 'mgmt-workshop'
  | 'mgmt-equipment'
  | 'mgmt-risk'
  | 'mgmt-reports'
  | 'communications'
  | 'client-portal'
  | 'ai-assistant'
  | 'settings';

interface NavItem {
  key: PageKey;
  label: string;
  icon: React.ReactNode;
}

interface NavGroup {
  label: string;
  icon: React.ReactNode;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: '',
    icon: null,
    items: [{ key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> }],
  },
  {
    label: 'CRM',
    icon: <Users size={18} />,
    items: [
      { key: 'crm-enquiries', label: 'Enquiries', icon: <UserCheck size={18} /> },
      { key: 'crm-clients', label: 'Clients', icon: <Users size={18} /> },
    ],
  },
  {
    label: 'Projects',
    icon: <FolderKanban size={18} />,
    items: [{ key: 'projects', label: 'All Projects', icon: <FolderKanban size={18} /> }],
  },
  {
    label: 'Operations',
    icon: <ListTodo size={18} />,
    items: [
      { key: 'ops-tasks', label: 'Tasks & Calendar', icon: <ListTodo size={18} /> },
      { key: 'ops-boq', label: 'BOQ & Estimates', icon: <ClipboardList size={18} /> },
      { key: 'ops-procurement', label: 'Procurement', icon: <ShoppingCart size={18} /> },
      { key: 'ops-suppliers', label: 'Suppliers', icon: <Truck size={18} /> },
      { key: 'ops-inventory', label: 'Inventory', icon: <Boxes size={18} /> },
    ],
  },
  {
    label: 'Finance',
    icon: <DollarSign size={18} />,
    items: [{ key: 'finance', label: 'Finance', icon: <DollarSign size={18} /> }],
  },
  {
    label: 'Management',
    icon: <UserCog size={18} />,
    items: [
      { key: 'mgmt-hr', label: 'HR & Staff', icon: <UserCog size={18} /> },
      { key: 'mgmt-workshop', label: 'Workshop', icon: <Wrench size={18} /> },
      { key: 'mgmt-equipment', label: 'Equipment', icon: <HardHat size={18} /> },
      { key: 'mgmt-risk', label: 'Risk & Quality', icon: <ShieldAlert size={18} /> },
      { key: 'mgmt-reports', label: 'Reports', icon: <FileBarChart size={18} /> },
    ],
  },
  {
    label: 'Communications',
    icon: <MessageSquare size={18} />,
    items: [{ key: 'communications', label: 'Communications', icon: <MessageSquare size={18} /> }],
  },
  {
    label: 'Client Portal',
    icon: <ExternalLink size={18} />,
    items: [{ key: 'client-portal', label: 'Client Portal', icon: <ExternalLink size={18} /> }],
  },
  {
    label: 'AI Assistant',
    icon: <Bot size={18} />,
    items: [{ key: 'ai-assistant', label: 'AI Assistant', icon: <Bot size={18} /> }],
  },
  {
    label: 'Settings',
    icon: <Settings size={18} />,
    items: [{ key: 'settings', label: 'Settings', icon: <Settings size={18} /> }],
  },
];

export function Sidebar({
  current,
  onNavigate,
  mobileOpen,
  onCloseMobile,
}: {
  current: PageKey;
  onNavigate: (page: PageKey) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['CRM', 'Operations', 'Management']));

  const toggleGroup = (label: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onCloseMobile} />}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-navy-900 text-gray-300 flex flex-col transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-navy-700 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <Building2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm tracking-tight">Construction OS</h1>
            <p className="text-navy-300 text-[10px]">Enterprise Platform</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto sidebar-scroll py-3 px-2">
          {navGroups.map((group, gi) => {
            if (group.label === '') {
              return (
                <div key={gi} className="mb-1">
                  {group.items.map((item) => (
                    <NavButton
                      key={item.key}
                      item={item}
                      active={current === item.key}
                      onClick={() => {
                        onNavigate(item.key);
                        onCloseMobile();
                      }}
                    />
                  ))}
                </div>
              );
            }
            const isExpanded = expanded.has(group.label);
            return (
              <div key={gi} className="mb-1">
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-navy-300 uppercase tracking-wide hover:text-gray-200 transition-colors"
                >
                  {group.icon}
                  <span className="flex-1 text-left">{group.label}</span>
                  <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
                {isExpanded && (
                  <div className="ml-2 pl-3 border-l border-navy-700">
                    {group.items.map((item) => (
                      <NavButton
                        key={item.key}
                        item={item}
                        active={current === item.key}
                        onClick={() => {
                          onNavigate(item.key);
                          onCloseMobile();
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-navy-700 shrink-0">
          <p className="text-[10px] text-navy-400 text-center">
            Construction OS <span className="text-navy-300">|</span> Powered by Tishande
          </p>
        </div>
      </aside>
    </>
  );
}

function NavButton({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
        active
          ? 'bg-brand-600 text-white font-medium'
          : 'text-gray-400 hover:bg-navy-800 hover:text-gray-200'
      }`}
    >
      {item.icon}
      <span>{item.label}</span>
    </button>
  );
}
