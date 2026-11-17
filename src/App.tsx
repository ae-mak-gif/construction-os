import { lazy, Suspense, useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { BuildFlowDataProvider, useBuildFlowData } from '@/context/BuildFlowDataContext';
import { LoginPage } from '@/pages/Login';
import { ResetPasswordPage } from '@/pages/ResetPassword';
import { Sidebar, type PageKey } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';

















import type { Project } from '@/data/mockData';
import { Loader2, Building2 } from 'lucide-react';

const Dashboard = lazy(() => import('@/pages/Dashboard').then((module) => ({ default: module.Dashboard })));
const Enquiries = lazy(() => import('@/pages/CRM').then((module) => ({ default: module.Enquiries })));
const Clients = lazy(() => import('@/pages/CRM').then((module) => ({ default: module.Clients })));
const Projects = lazy(() => import('@/pages/Projects').then((module) => ({ default: module.Projects })));
const ProjectDetail = lazy(() => import('@/pages/Projects').then((module) => ({ default: module.ProjectDetail })));
const TasksCalendar = lazy(() => import('@/pages/Operations').then((module) => ({ default: module.TasksCalendar })));
const BOQEstimates = lazy(() => import('@/pages/Operations').then((module) => ({ default: module.BOQEstimates })));
const Suppliers = lazy(() => import('@/pages/Operations').then((module) => ({ default: module.Suppliers })));
const Inventory = lazy(() => import('@/pages/Operations').then((module) => ({ default: module.Inventory })));
const Procurement = lazy(() => import('@/pages/ProcurementWorkspace').then((module) => ({ default: module.ProcurementWorkspace })));
const Finance = lazy(() => import('@/pages/Finance').then((module) => ({ default: module.Finance })));
const HR = lazy(() => import('@/pages/Management').then((module) => ({ default: module.HR })));
const Workshop = lazy(() => import('@/pages/Management').then((module) => ({ default: module.Workshop })));
const EquipmentPage = lazy(() => import('@/pages/Management').then((module) => ({ default: module.EquipmentPage })));
const RiskQuality = lazy(() => import('@/pages/Management').then((module) => ({ default: module.RiskQuality })));
const Reports = lazy(() => import('@/pages/Management').then((module) => ({ default: module.Reports })));
const Communications = lazy(() => import('@/pages/Communications').then((module) => ({ default: module.Communications })));
const ClientPortal = lazy(() => import('@/pages/ClientPortal').then((module) => ({ default: module.ClientPortal })));
const AIAssistant = lazy(() => import('@/pages/AIAssistant').then((module) => ({ default: module.AIAssistant })));
const Settings = lazy(() => import('@/pages/Settings').then((module) => ({ default: module.Settings })));
const ConstructionModules = lazy(() => import('@/pages/ConstructionModules').then((module) => ({ default: module.ConstructionModules })));
const SiteDiaries = lazy(() => import('@/pages/SiteDiaries').then((module) => ({ default: module.SiteDiaries })));
const ProjectSchedule = lazy(() => import('@/pages/ProjectSchedule').then((module) => ({ default: module.ProjectSchedule })));
const CostControl = lazy(() => import('@/pages/CostControl').then((module) => ({ default: module.CostControl })));
const ConstructionRegisters = lazy(() => import('@/pages/ConstructionRegisters').then((module) => ({ default: module.ConstructionRegisters })));
const ProjectDocuments = lazy(() => import('@/pages/ProjectDocuments').then((module) => ({ default: module.ProjectDocuments })));


const pageTitles: Record<PageKey, string> = {
  dashboard: 'Dashboard',
  'construction-modules': 'Construction Modules',
  'crm-enquiries': 'CRM — Enquiries',
  'crm-clients': 'CRM — Clients',
  projects: 'Projects',
  'project-detail': 'Project Overview',
  'ops-tasks': 'Tasks & Calendar',
  'site-diaries': 'Daily Site Diaries',
  'project-schedule': 'Project Programme',
  'cost-control': 'Project Cost Control',
  'project-registers': 'Project Registers',
  'project-documents': 'Document Register',
  'ops-boq': 'BOQ & Estimates',
  'ops-procurement': 'Procurement',
  'ops-suppliers': 'Suppliers',
  'ops-inventory': 'Inventory',
  finance: 'Finance',
  'mgmt-hr': 'HR & Staff',
  'mgmt-workshop': 'Workshop',
  'mgmt-equipment': 'Equipment',
  'mgmt-risk': 'Risk & Quality',
  'mgmt-reports': 'Reports',
  communications: 'Communications',
  'client-portal': 'Client Portal',
  'ai-assistant': 'AI Assistant',
  settings: 'Settings',
};

function AppContent() {
  const { session, loading, error, accountType, membership, clientAccess, signOut } = useAuth();
  const { loading: dataLoading, records, errors: dataErrors, refresh } = useBuildFlowData();
  const dataErrorCount = Object.keys(dataErrors).length;
  const [page, setPage] = useState<PageKey>('dashboard');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (window.location.pathname === '/reset-password') return <ResetPasswordPage />;

  if (loading || (session && accountType === 'internal' && dataLoading)) {
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

  if (!session) return <LoginPage />;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-900 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-amber-600 text-xl">!</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Account access issue</h2>
          <p className="text-sm text-gray-500 mb-1">{error}</p>
          <button onClick={() => void signOut()} className="mt-5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // External client identities never enter the internal organisation data shell.
  if (accountType === 'client' && clientAccess) {
    return <ClientPortal clientAccess={clientAccess} onSignOut={() => void signOut()} />;
  }

  if (accountType !== 'internal' || !membership) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-900 px-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
          <h2 className="text-lg font-semibold text-gray-800">Account access could not be resolved</h2>
          <p className="mt-2 text-sm text-gray-500">Your account has no recognised BuildFlow access assignment.</p>
          <button onClick={() => void signOut()} className="mt-5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white">Sign out</button>
        </div>
      </div>
    );
  }

  const handleNavigate = (nextPage: PageKey) => {
    setPage(nextPage);
    if (nextPage !== 'project-detail') setProjectId(null);
  };
  const openProject = (id: string) => {
    setProjectId(id);
    setPage('project-detail');
  };

  const currentProject: Project | null = projectId ? (() => {
    const row = (records.projects ?? []).find((project) => project.id === projectId);
    if (!row) return null;
    const client = (records.clients ?? []).find((item) => item.id === row.client_id);
    const manager = (records.staff ?? []).find((item) => item.id === row.project_manager_id);
    return {
      id: row.id, name: String(row.name ?? ''), client: String(client?.name ?? 'Client'), clientCompany: String(client?.name ?? 'Client'),
      manager: manager ? [manager.first_name, manager.last_name].filter(Boolean).join(' ') : 'Unassigned', progress: Number(row.progress_percent ?? 0), budget: Number(row.contract_value ?? 0),
      actualCost: (records.project_budgets ?? []).filter((budget) => budget.project_id === row.id).reduce((sum, budget) => sum + Number(budget.actual_amount ?? 0), 0),
      deadline: String(row.expected_completion_date ?? ''), startDate: String(row.start_date ?? ''),
      health: row.health_status === 'at_risk' ? 'at-risk' : row.health_status === 'critical' ? 'delayed' : row.health_status === 'completed' ? 'completed' : 'on-track',
      status: row.status === 'completed' ? 'Completed' : row.status === 'planning' ? 'Planning' : 'Active', location: String(row.location ?? ''), description: String(row.description ?? ''), contractValue: Number(row.contract_value ?? 0),
    } as Project;
  })() : null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar current={page} onNavigate={handleNavigate} mobileOpen={mobileSidebarOpen} onCloseMobile={() => setMobileSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title={pageTitles[page]} onMenuClick={() => setMobileSidebarOpen(true)} onNavigate={(nextPage) => handleNavigate(nextPage as PageKey)} />
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          <Suspense fallback={<div className="flex min-h-64 items-center justify-center text-sm text-gray-500">Loading workspace...</div>}>
          {dataErrorCount > 0 && (
            <div role="alert" aria-live="polite" className="mb-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">Some live data could not be loaded</p>
                <p className="mt-1 text-sm text-amber-800">{dataErrorCount} data area(s) reported a loading error. Affected sections may be incomplete until the live data connection is restored.</p>
              </div>
              <button type="button" onClick={() => { void refresh(); }} className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100">Retry data loading</button>
            </div>
          )}
          {page === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
          {page === 'construction-modules' && <ConstructionModules onNavigate={handleNavigate} />}
          {page === 'crm-enquiries' && <Enquiries />}
          {page === 'crm-clients' && <Clients />}
          {page === 'projects' && <Projects onOpenProject={openProject} />}
          {page === 'project-detail' && currentProject && <ProjectDetail project={currentProject} onBack={() => handleNavigate('projects')} />}
          {page === 'ops-tasks' && <TasksCalendar />}
          {page === 'site-diaries' && <SiteDiaries />}
          {page === 'project-schedule' && <ProjectSchedule />}
          {page === 'cost-control' && <CostControl />}
          {page === 'project-registers' && <ConstructionRegisters />}
          {page === 'project-documents' && <ProjectDocuments />}
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
          </Suspense>
        </main>
      </div>
    </div>
  );
}

function App() {
  return <AuthProvider><BuildFlowDataProvider><AppContent /></BuildFlowDataProvider></AuthProvider>;
}

export default App;
