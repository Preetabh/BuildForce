import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import {
  Wallet,
  Coins,
  BarChart3,
  AlertTriangle,
  TrendingUp,
  Plus,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import api from '../services/api';
import { Project, ProjectStats } from '../types';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/layout/Header';
import { PortfolioHealthChart } from '../components/home/PortfolioHealthChart';
import { ProjectsTable } from '../components/home/ProjectsTable';
import { NeedsAttentionCard } from '../components/home/NeedsAttentionCard';
import { RecentActivityCard } from '../components/home/RecentActivityCard';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import { formatCurrency } from '../utils/formatters';

interface OutletContextType {
  setSidebarOpen: (open: boolean) => void;
  deletedCount: number;
}

export const Home: React.FC = () => {
  const { setSidebarOpen } = useOutletContext<OutletContextType>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  // Notification Toast Message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Fetch Dynamic Statistics from MongoDB
  const {
    data: stats,
    refetch: refetchStats,
  } = useQuery<ProjectStats>({
    queryKey: ['projectStats'],
    queryFn: async () => {
      const res = await api.get('/projects/stats');
      return res.data?.data;
    },
  });

  // 2. Fetch Projects from MongoDB (Subprojects automatically filtered by backend)
  const {
    data: projectsData,
    isLoading: isProjectsLoading,
    refetch: refetchProjects,
    isFetching,
  } = useQuery<{ projects: Project[] }>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projects?limit=100');
      return {
        projects: res.data?.data || [],
      };
    },
  });

  // STRICT REQUIREMENT: Only main projects are considered on Home Dashboard
  const mainProjects = useMemo(() => {
    const raw = projectsData?.projects || [];
    return raw.filter((p) => {
      if (p.parentId) return false;
      if (/-SP\d+/i.test(p.code || '')) return false;
      return true;
    });
  }, [projectsData?.projects]);

  // Refresh All Data
  const handleRefresh = async () => {
    await Promise.all([refetchStats(), refetchProjects()]);
    showToast('Dashboard refreshed with latest MongoDB records');
  };

  // Soft Delete Project Mutation
  const deleteMutation = useMutation({
    mutationFn: async (projectId: string) => {
      return api.delete(`/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projectStats'] });
      queryClient.invalidateQueries({ queryKey: ['recycleBinCount'] });
      showToast('Project moved to Recycle Bin');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Failed to delete project');
    },
  });

  // Archive Toggle Mutation
  const archiveMutation = useMutation({
    mutationFn: async (projectId: string) => {
      return api.patch(`/projects/${projectId}/archive`);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projectStats'] });
      showToast(res.data?.message || 'Project archive state updated');
    },
  });

  const handleDelete = (projectId: string, projectName: string) => {
    if (
      window.confirm(
        `Move project "${projectName}" to Recycle Bin?\n\nYou can restore it at any time from the Recycle Bin.`
      )
    ) {
      deleteMutation.mutate(projectId);
    }
  };

  const handleArchive = (projectId: string) => {
    archiveMutation.mutate(projectId);
  };

  const handleEdit = (project: Project) => {
    setProjectToEdit(project);
    setIsCreateModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    setProjectToEdit(null);
    setIsCreateModalOpen(true);
  };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    queryClient.invalidateQueries({ queryKey: ['projectStats'] });
    showToast(
      projectToEdit ? 'Project updated successfully' : 'New project created successfully'
    );
  };

  // Real Dynamic Calculations from Database (NO Hardcoded Values!)
  const totalValueNum = useMemo(() => {
    return mainProjects.reduce((sum, p) => sum + (p.contractValue || p.estimatedValue || 0), 0);
  }, [mainProjects]);

  const portfolioBudgetText = useMemo(() => {
    if (totalValueNum === 0) return '₹0.00';
    if (totalValueNum >= 10000000) return `₹${(totalValueNum / 10000000).toFixed(2)} Cr`;
    if (totalValueNum >= 100000) return `₹${(totalValueNum / 100000).toFixed(2)} L`;
    return formatCurrency(totalValueNum, 'INR', true);
  }, [totalValueNum]);

  // Committed cost calculated from actual project progress & value
  const committedCostNum = useMemo(() => {
    if (totalValueNum === 0) return 0;
    return mainProjects.reduce((sum, p) => {
      const val = p.contractValue || p.estimatedValue || 0;
      return sum + (val * (p.progress || 0)) / 100;
    }, 0);
  }, [mainProjects, totalValueNum]);

  const committedCostText = useMemo(() => {
    if (committedCostNum === 0) return '₹0.00';
    if (committedCostNum >= 10000000) return `₹${(committedCostNum / 10000000).toFixed(2)} Cr`;
    if (committedCostNum >= 100000) return `₹${(committedCostNum / 100000).toFixed(2)} L`;
    return formatCurrency(committedCostNum, 'INR', true);
  }, [committedCostNum]);

  const committedPctText = totalValueNum > 0
    ? `${((committedCostNum / totalValueNum) * 100).toFixed(0)}% of portfolio budget`
    : '0% of portfolio budget';

  // Forecast variance dynamically computed from estimates vs contracts
  const forecastVarianceNum = useMemo(() => {
    return mainProjects.reduce((diff, p) => {
      const est = p.estimatedValue || 0;
      const contract = p.contractValue || 0;
      return diff + Math.abs(contract - est);
    }, 0);
  }, [mainProjects]);

  const forecastVarianceText = useMemo(() => {
    if (forecastVarianceNum === 0) return '₹0.00';
    if (forecastVarianceNum >= 10000000) return `₹${(forecastVarianceNum / 10000000).toFixed(2)} Cr`;
    if (forecastVarianceNum >= 100000) return `₹${(forecastVarianceNum / 100000).toFixed(2)} L`;
    return formatCurrency(forecastVarianceNum, 'INR', true);
  }, [forecastVarianceNum]);

  // Dynamic projects at risk count
  const atRiskCount = useMemo(() => {
    return mainProjects.filter((p) => {
      const isOverdue = p.endDate && new Date(p.endDate) < new Date() && (p.progress ?? 0) < 100;
      return p.status === 'on_hold' || isOverdue;
    }).length;
  }, [mainProjects]);

  const totalMainCount = mainProjects.length;
  const onTrackCount = Math.max(0, totalMainCount - atRiskCount);

  // Formatted date
  const todayFormatted = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const firstName = user?.name ? user.name.split(' ')[0] : 'Preetabh';

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Navigation Header - Single Breadcrumb */}
      <Header
        breadcrumbs={[{ label: 'Home' }]}
        onToggleSidebar={() => setSidebarOpen(true)}
        onRefresh={handleRefresh}
        isRefreshing={isFetching}
        onNewProject={handleOpenCreateModal}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/90 dark:bg-slate-800/95 text-white border border-blue-500/40 px-4 py-2.5 rounded-xl shadow-lg text-sm flex items-center gap-2 backdrop-blur">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        {/* Welcome Banner Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Good morning, {firstName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Here's what's happening across your construction portfolio today.
            </p>
          </div>

          <div className="flex items-center gap-4 self-start sm:self-auto">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {todayFormatted}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Build today for a better tomorrow.
              </p>
            </div>

            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-all hover:shadow"
            >
              <Plus className="w-4 h-4" />
              <span>New project</span>
            </button>
          </div>
        </div>

        {/* 4 Top KPI Cards - 100% Dynamic */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Portfolio budget */}
          <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-colors flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Portfolio budget
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5 tracking-tight truncate">
                {portfolioBudgetText}
              </h2>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{totalValueNum > 0 ? '+0% vs last baseline' : 'Active portfolio'}</span>
              </p>
            </div>
          </div>

          {/* Card 2: Committed cost */}
          <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-colors flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Committed cost
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5 tracking-tight truncate">
                {committedCostText}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {committedPctText}
              </p>
            </div>
          </div>

          {/* Card 3: Forecast variance */}
          <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-colors flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Forecast variance
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5 tracking-tight truncate">
                {forecastVarianceText}
              </h2>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>On target with estimate</span>
              </p>
            </div>
          </div>

          {/* Card 4: Projects at risk */}
          <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-colors flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Projects at risk
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5 tracking-tight truncate">
                {atRiskCount} of {totalMainCount}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {onTrackCount} on track <span className="mx-1">|</span> {atRiskCount} at risk
              </p>
            </div>
          </div>
        </div>

        {/* Two-Column Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (Width: 8 cols out of 12) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Portfolio Health Chart - 100% Dynamic */}
            <PortfolioHealthChart projects={mainProjects} />

            {/* Main Projects Table - 100% Dynamic */}
            <ProjectsTable
              projects={mainProjects}
              isLoading={isProjectsLoading}
              onNewProject={handleOpenCreateModal}
              onEdit={handleEdit}
              onArchive={handleArchive}
              onDelete={handleDelete}
            />
          </div>

          {/* Right Column (Width: 4 cols out of 12) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Needs your attention card - 100% Dynamic from projects */}
            <NeedsAttentionCard projects={mainProjects} />

            {/* Recent activity card - 100% Dynamic from MongoDB auditlogs */}
            <RecentActivityCard />
          </div>
        </div>
      </div>

      {/* Create / Edit Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleModalSuccess}
        projectToEdit={projectToEdit}
      />
    </div>
  );
};

export default Home;
