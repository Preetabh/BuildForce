import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Calendar,
  User,
  ArrowLeft,
  Building2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import api from '../services/api';
import { Project } from '../types';
import { Header } from '../components/layout/Header';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { formatDate, formatCurrency } from '../utils/formatters';

interface OutletContextType {
  setSidebarOpen: (open: boolean) => void;
}

export const RecycleBin: React.FC = () => {
  const { setSidebarOpen } = useOutletContext<OutletContextType>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<Project | null>(null);
  const [isDeletingPermanently, setIsDeletingPermanently] = useState(false);

  // Fetch soft-deleted projects from MongoDB
  const {
    data: deletedProjects = [],
    isLoading,
    refetch,
  } = useQuery<Project[]>({
    queryKey: ['recycleBinProjects'],
    queryFn: async () => {
      const res = await api.get('/projects/recycle-bin');
      return res.data?.data || [];
    },
  });

  // Restore project mutation
  const restoreMutation = useMutation({
    mutationFn: async (projectId: string) => {
      return api.patch(`/projects/${projectId}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recycleBinProjects'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projectStats'] });
      queryClient.invalidateQueries({ queryKey: ['recycleBinCount'] });
    },
  });

  // Permanent delete mutation
  const permanentDeleteMutation = useMutation({
    mutationFn: async (projectId: string) => {
      return api.delete(`/projects/${projectId}/permanent`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recycleBinProjects'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projectStats'] });
      queryClient.invalidateQueries({ queryKey: ['recycleBinCount'] });
      setPermanentDeleteTarget(null);
    },
  });

  const handleRestore = (project: Project) => {
    restoreMutation.mutate(project._id);
  };

  const handleConfirmPermanentDelete = async () => {
    if (!permanentDeleteTarget) return;
    setIsDeletingPermanently(true);
    try {
      await permanentDeleteMutation.mutateAsync(permanentDeleteTarget._id);
    } finally {
      setIsDeletingPermanently(false);
    }
  };

  return (
    <div>
      <Header
        breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Recycle Bin' }]}
        onToggleSidebar={() => setSidebarOpen(true)}
      />

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Top Info Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-erp-text tracking-tight">
                Recycle Bin
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                {deletedProjects.length} Deleted Items
              </span>
            </div>
            <p className="text-xs sm:text-sm text-erp-text-muted mt-1">
              Soft-deleted projects are safely archived here. You can restore them anytime or
              permanently purge them.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Dashboard
          </Button>
        </div>

        {/* Project List / Empty State */}
        {isLoading ? (
          <div className="py-20 text-center text-sm text-erp-text-muted">
            Loading recycle bin items...
          </div>
        ) : deletedProjects.length === 0 ? (
          <EmptyState
            icon={Trash2}
            title="Recycle Bin is Empty"
            description="No deleted projects found. When you delete projects from the dashboard, they will appear here safely."
            actionLabel="Return to Dashboard"
            onAction={() => navigate('/')}
          />
        ) : (
          <div className="glass-panel rounded-xl border border-erp-border overflow-hidden">
            <div className="divide-y divide-erp-border/80">
              {deletedProjects.map((project) => (
                <div
                  key={project._id}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors"
                >
                  {/* Left: Project Details */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-erp-text text-base truncate">
                          {project.name}
                        </h4>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {project.code}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mt-1.5 flex-wrap text-xs text-erp-text-muted">
                        {project.clientName && <span>Client: {project.clientName}</span>}
                        <span>
                          Value:{' '}
                          {formatCurrency(
                            project.contractValue || project.estimatedValue,
                            project.currency
                          )}
                        </span>
                        <span className="flex items-center gap-1 text-amber-300/90">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Deleted on: {formatDate(project.deletedAt)}</span>
                        </span>
                        {project.deletedBy && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <User className="w-3.5 h-3.5" />
                            <span>By: {project.deletedBy.name}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: Restore & Permanent Delete */}
                  <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(project)}
                      isLoading={restoreMutation.isPending}
                      leftIcon={<RotateCcw className="w-4 h-4 text-emerald-400" />}
                    >
                      Restore Project
                    </Button>

                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setPermanentDeleteTarget(project)}
                      leftIcon={<Trash2 className="w-4 h-4" />}
                    >
                      Purge
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Permanent Delete */}
      <Modal
        isOpen={!!permanentDeleteTarget}
        onClose={() => setPermanentDeleteTarget(null)}
        title="Permanently Delete Project"
        subtitle="This action is irreversible."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Warning: Irrevocable Action</p>
              <p className="mt-0.5 text-erp-text-muted">
                You are about to permanently delete{' '}
                <strong className="text-erp-text">{permanentDeleteTarget?.name}</strong> (
                {permanentDeleteTarget?.code}). All records will be removed from MongoDB.
              </p>
            </div>
          </div>

          <p className="text-xs text-erp-text-subtle">
            To proceed, confirm that you wish to destroy this project record completely.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-erp-border">
            <Button
              variant="outline"
              onClick={() => setPermanentDeleteTarget(null)}
              disabled={isDeletingPermanently}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmPermanentDelete}
              isLoading={isDeletingPermanently}
            >
              Permanently Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
