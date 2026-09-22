import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import {
  FolderKanban,
  Activity,
  CheckCircle,
  FileEdit,
  IndianRupee,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';
import { Project, ProjectStats, PaginationMeta } from '../types';
import { Header } from '../components/layout/Header';
import { StatCard } from '../components/common/StatCard';
import { ProjectGrid } from '../components/projects/ProjectGrid';
import { ProjectSearch } from '../components/projects/ProjectSearch';
import { ProjectFilters } from '../components/projects/ProjectFilters';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import { formatCurrency } from '../utils/formatters';
import { useDebounce } from '../hooks/useDebounce';

interface OutletContextType {
  setSidebarOpen: (open: boolean) => void;
  deletedCount: number;
}

export const Home: React.FC = () => {
  const { setSidebarOpen } = useOutletContext<OutletContextType>();
  const queryClient = useQueryClient();

  // Search, Filter & Pagination State
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [status, setStatus] = useState('all');
  const [projectType, setProjectType] = useState('all');
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const limit = 9;

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  // Notification / Toast Message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Fetch Dynamic Statistics from MongoDB
  const {
    data: stats,
    isLoading: isStatsLoading,
    refetch: refetchStats,
  } = useQuery<ProjectStats>({
    queryKey: ['projectStats'],
    queryFn: async () => {
      const res = await api.get('/projects/stats');
      return res.data?.data;
    },
  });

  // 2. Fetch Filtered, Paginated Projects from MongoDB
  const {
    data: projectsData,
    isLoading: isProjectsLoading,
    isError,
    error,
    refetch: refetchProjects,
    isFetching,
  } = useQuery<{ projects: Project[]; pagination: PaginationMeta }>({
    queryKey: [
      'projects',
      { search: debouncedSearch, status, projectType, sort, order, page, limit },
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (status && status !== 'all') params.append('status', status);
      if (projectType && projectType !== 'all') params.append('projectType', projectType);
      params.append('sort', sort);
      params.append('order', order);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const res = await api.get(`/projects?${params.toString()}`);
      return {
        projects: res.data?.data || [],
        pagination: res.data?.pagination || {
          total: 0,
          page: 1,
          limit,
          totalPages: 1,
          hasMore: false,
        },
      };
    },
  });

  // Refresh All Data
  const handleRefresh = async () => {
    await Promise.all([refetchStats(), refetchProjects()]);
    showToast('Dashboard refreshed with latest MongoDB records');
  };

  // 3. Soft Delete Project Mutation
  const deleteMutation = useMutation({
    mutationFn: async (projectId: string) => {
      return api.delete(`/projects/${projectId}`);
    },
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projectStats'] });
      queryClient.invalidateQueries({ queryKey: ['recycleBinCount'] });
      showToast('Project moved to Recycle Bin (soft deleted)');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Failed to delete project');
    },
  });

  // 4. Archive Toggle Mutation
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

  const projects = projectsData?.projects || [];
  const pagination = projectsData?.pagination;
  const isFiltered = debouncedSearch !== '' || status !== 'all' || projectType !== 'all';

  return (
    <div>
      {/* Header */}
      <Header
        breadcrumbs={[{ label: 'Home Dashboard' }]}
        onToggleSidebar={() => setSidebarOpen(true)}
        onRefresh={handleRefresh}
        isRefreshing={isFetching}
        onNewProject={handleOpenCreateModal}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-blue-500/40 text-blue-300 px-4 py-2.5 rounded-xl shadow-glow text-sm flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8">
        {/* Section: Overview Statistics */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-erp-text tracking-tight flex items-center gap-2">
                <span>Overview</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60">
                  Live MongoDB Aggregation
                </span>
              </h2>
              <p className="text-xs text-erp-text-muted">
                Real-time portfolio metrics and valuation
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
            <StatCard
              label="Total Projects"
              value={isStatsLoading ? '...' : stats?.totalProjects || 0}
              icon={FolderKanban}
              colorVariant="blue"
              subtext="Portfolio Total"
            />
            <StatCard
              label="Active Projects"
              value={isStatsLoading ? '...' : stats?.activeProjects || 0}
              icon={Activity}
              colorVariant="emerald"
              subtext="Under Construction"
            />
            <StatCard
              label="Completed"
              value={isStatsLoading ? '...' : stats?.completedProjects || 0}
              icon={CheckCircle}
              colorVariant="cyan"
              subtext="Handed Over"
            />
            <StatCard
              label="Draft Projects"
              value={isStatsLoading ? '...' : stats?.draftProjects || 0}
              icon={FileEdit}
              colorVariant="amber"
              subtext="Planning Stage"
            />
            <div className="col-span-2 sm:col-span-1">
              <StatCard
                label="Portfolio Value"
                value={
                  isStatsLoading
                    ? '...'
                    : formatCurrency(stats?.totalProjectValue || 0, 'INR', true)
                }
                icon={IndianRupee}
                colorVariant="purple"
                subtext={formatCurrency(stats?.totalProjectValue || 0, 'INR', false)}
              />
            </div>
          </div>
        </section>

        {/* Section: My Projects */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-erp-text tracking-tight">My Projects</h2>
              <p className="text-xs text-erp-text-muted">
                Manage construction sites, estimates, and schedules
              </p>
            </div>

            <div className="flex items-center gap-3">
              <ProjectSearch
                value={search}
                onChange={(val) => {
                  setSearch(val);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {/* Filters & Sorting */}
          <div className="p-3.5 rounded-xl bg-slate-900/40 border border-erp-border">
            <ProjectFilters
              status={status}
              onStatusChange={(newStatus) => {
                setStatus(newStatus);
                setPage(1);
              }}
              projectType={projectType}
              onProjectTypeChange={(newType) => {
                setProjectType(newType);
                setPage(1);
              }}
              sort={sort}
              order={order}
              onSortChange={(newSort, newOrder) => {
                setSort(newSort);
                setOrder(newOrder);
                setPage(1);
              }}
            />
          </div>

          {/* Projects Grid */}
          <ProjectGrid
            projects={projects}
            isLoading={isProjectsLoading}
            isError={isError}
            errorMessage={(error as Error)?.message}
            onRetry={refetchProjects}
            onNewProject={handleOpenCreateModal}
            onEdit={handleEdit}
            onArchive={handleArchive}
            onDelete={handleDelete}
            isFiltered={isFiltered}
          />

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="pt-4 flex items-center justify-between border-t border-erp-border text-xs text-erp-text-muted">
              <span>
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} projects
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                  className="px-2.5 py-1.5 rounded-lg border border-erp-border bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-erp-text transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <span className="px-3 py-1 rounded bg-slate-800 text-erp-text font-medium">
                  {pagination.page} / {pagination.totalPages}
                </span>

                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasMore}
                  className="px-2.5 py-1.5 rounded-lg border border-erp-border bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-erp-text transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </section>
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
