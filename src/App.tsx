import { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LoginPage } from '@/pages/Login';
import { Sidebar, type PageKey } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Dashboard } from '@/pages/Dashboard';
import { Enquiries, Clients } from '@/pages/CRM';
import { Projects, ProjectDetail } from '@/pages/Projects';
import { TasksCalendar, BOQEstimates, Procurement, Suppliers, Inventory } from '@/pages/Operations';
import { Finance } from '@/pages/Finance';
import { HR, Workshop, EquipmentPage, RiskQuality, Reports } from '@/pages/Management';
import { Communications } from '@/pages/Communications';
import { ClientPortal } from '@/pages/ClientPortal';
import { AIAssistant } from '@/pages/AIAssistant';
import { Settings } from '@/pages/Settings';
import { projects } from '@/data/mockData';
import { Loader2, Building2 } from 'lucide-react';

const pageTitles: Record<PageKey, string> = {
  'dashboard': 'Dashboard',
  'crm-enquiries': 'CRM — Enquiries',
  'crm-clients': 'CRM — Clients',
  'projects': 'Projects',
  'project-detail': 'Project Overview',
  'ops-tasks': 'Tasks & Calendar',
  'ops-boq': 'BOQ & Estimates',
  'ops-procurement': 'Procurement',
  'ops-suppliers': 'Suppliers',
  'ops-inventory': 'Inventory',
  'finance': 'Finance',
  'mgmt-hr': 'HR & Staff',
  'mgmt-workshop': 'Workshop',
  'mgmt-equipment': 'Equipment',
  'mgmt-risk': 'Risk & Quality',
  'mgmt-reports': 'Reports',
  'communications': 'Communications',
  'client-portal': 'Client Portal',
  'ai-assistant': 'AI Assistant',
  'settings': 'Settings',
};

function AppContent() {
  const { session, loading, error } = useAuth();
  const [page, setPage] = useState<PageKey>('dashboard');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleNavigate = (p: PageKey) => {
    setPage(p);
    if (p !== 'project-detail') setProjectId(null);
  };

  const openProject = (id: string) => {
    setProjectId(id);
    setPage('project-detail');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-navy-900">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mb-4 shadow-lg">
          <Building2 size={28} className="text-white" />
        </div>
        <Loader2 size={24} className="text-brand-400 animate-spin mb-3" />
        <p className="text-navy-300 text-sm">Loading BuildFlow...</p>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-900 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-amber-600 text-xl">!</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Connection Issue</h2>
          <p className="text-sm text-gray-500 mb-1">{error}</p>
          <p className="text-xs text-gray-400 mt-4">Please contact your administrator if this persists.</p>
        </div>
      </div>
    );
  }

  // Client portal is full-screen
  if (page === 'client-portal') {
    return <ClientPortal onExit={() => handleNavigate('dashboard')} />;
  }

  const currentProject = projectId ? projects.find((p) => p.id === projectId) : null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        current={page}
        onNavigate={handleNavigate}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title={pageTitles[page]} onMenuClick={() => setMobileSidebarOpen(true)} />

        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          {page === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
          {page === 'crm-enquiries' && <Enquiries />}
          {page === 'crm-clients' && <Clients />}
          {page === 'projects' && <Projects onOpenProject={openProject} />}
          {page === 'project-detail' && currentProject && (
            <ProjectDetail project={currentProject} onBack={() => handleNavigate('projects')} />
          )}
          {page === 'ops-tasks' && <TasksCalendar />}
          {page === 'ops-boq' && <BOQEstimates />}
          {page === 'ops-procurement' && <Procurement />}
          {page === 'ops-suppliers' && <Suppliers />}
          {page === 'ops-inventory' && <Inventory />}
          {page === 'finance' && <Finance />}
          {page === 'mgmt-hr' && <HR />}
          {page === 'mgmt-workshop' && <Workshop />}
          {page === 'mgmt-equipment' && <EquipmentPage />}
          {page === 'mgmt-risk' && <RiskQuality />}
          {page === 'mgmt-reports' && <Reports />}
          {page === 'communications' && <Communications />}
          {page === 'ai-assistant' && <AIAssistant />}
          {page === 'settings' && <Settings />}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
