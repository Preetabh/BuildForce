import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  FolderKanban,
  Users,
  HardHat,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { Header } from '../components/layout/Header';

// 100% Modular Dashboards separated by concern & permissions
import { ProjectPortfolioDashboard } from '../components/dashboards/ProjectPortfolioDashboard';
import { LeadManagementDashboard } from '../components/dashboards/LeadManagementDashboard';
import { SiteEngineerDashboard } from '../components/dashboards/SiteEngineerDashboard';

interface OutletContextType {
  setSidebarOpen: (open: boolean) => void;
  deletedCount: number;
}

export type DashboardTab = 'projects' | 'leads' | 'site';

export const Home: React.FC = () => {
  const { setSidebarOpen } = useOutletContext<OutletContextType>();
  const { user } = useAuth();
  const { canAccess, isModuleAllowed, isMasterAdmin } = usePermissions();

  const userRoleCode = (user?.role || '').trim().toUpperCase();

  // Active tab state - exclusively for Master Admin switching
  const [activeTab, setActiveTab] = useState<DashboardTab>('projects');

  // Master Admin Switcher Tabs
  const adminTabs = useMemo(() => [
    {
      id: 'projects' as DashboardTab,
      label: 'Projects Portfolio',
      icon: FolderKanban,
    },
    {
      id: 'leads' as DashboardTab,
      label: 'Leads & Client CRM',
      icon: Users,
    },
    {
      id: 'site' as DashboardTab,
      label: 'Site Operations & Field',
      icon: HardHat,
    },
  ], []);

  // Determine fixed dashboard for non-admin users (STRICT REQUIREMENT: Only admin gets multiple tabs)
  const currentDashboard = useMemo<DashboardTab>(() => {
    // 1. If Master Admin, return the selected tab from activeTab state
    if (isMasterAdmin) {
      return activeTab;
    }

    // 2. Check Lead Management Access
    const hasLeadAccess =
      isModuleAllowed('lead_management') ||
      canAccess('Admin/Management') ||
      canAccess('Admin/Enquiry') ||
      canAccess('Admin/Clients') ||
      canAccess('lead.view') ||
      canAccess('Admin/Dash_Inquiries') ||
      userRoleCode === 'COUNSELLOR' ||
      userRoleCode === 'BDM';

    // 3. Check Site Engineer Access
    const hasSiteAccess =
      isModuleAllowed('site_enginner') ||
      userRoleCode === 'SITE_ENGINEER' ||
      canAccess('Admin/SiteEngineersSection') ||
      canAccess('measurement.view');

    // 4. Check Project / Planning Access
    const hasProjectAccess =
      isModuleAllowed('plannings') ||
      isModuleAllowed('project_management') ||
      canAccess('Admin/LibraryMgmt') ||
      canAccess('Admin/ReportAnalytic') ||
      canAccess('project.view') ||
      userRoleCode === 'PROJECT_MANAGER' ||
      userRoleCode === 'ESTIMATE_ENGINEER' ||
      userRoleCode === 'ARCHITECT';

    // STRICT ROLE & PERMISSION MATCHING FOR NON-ADMINS:
    // If user has Lead access and does NOT have Plannings / Project Management:
    if (hasLeadAccess && !hasProjectAccess) {
      return 'leads';
    }

    // If user is a Site Engineer:
    if (hasSiteAccess && !hasProjectAccess) {
      return 'site';
    }

    // If user has Project / Planning access:
    if (hasProjectAccess) {
      return 'projects';
    }

    // Default fallbacks based on available module
    if (hasLeadAccess) return 'leads';
    if (hasSiteAccess) return 'site';
    return 'leads';
  }, [isMasterAdmin, activeTab, isModuleAllowed, canAccess, userRoleCode]);

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 transition-colors">
      {/* Top Navigation Header */}
      <Header
        breadcrumbs={[{ label: 'Home' }]}
        onToggleSidebar={() => setSidebarOpen(true)}
      />

      {/* Multiple Dashboard Tab Switcher - ONLY for Master Admin as requested */}
      {isMasterAdmin && (
        <div className="border-b border-slate-800 bg-[#0c121e]/90 px-4 sm:px-6 lg:px-8 py-2.5 sticky top-[57px] z-20 backdrop-blur-md">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl overflow-x-auto scrollbar-none">
              {adminTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Master Admin Multi-Dashboard Access</span>
            </div>
          </div>
        </div>
      )}

      {/* Render the authorized modular dashboard */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
        {currentDashboard === 'projects' && <ProjectPortfolioDashboard />}
        {currentDashboard === 'leads' && <LeadManagementDashboard />}
        {currentDashboard === 'site' && <SiteEngineerDashboard />}
      </div>
    </div>
  );
};

export default Home;
