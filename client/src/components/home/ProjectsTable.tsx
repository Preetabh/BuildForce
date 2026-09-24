import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  MoreVertical,
  ExternalLink,
  Edit,
  Archive,
  Trash2,
  Search,
  Plus,
} from 'lucide-react';
import { Project } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface ProjectsTableProps {
  projects: Project[];
  isLoading: boolean;
  onNewProject: () => void;
  onEdit: (project: Project) => void;
  onArchive: (projectId: string) => void;
  onDelete: (projectId: string, projectName: string) => void;
}

export const ProjectsTable: React.FC<ProjectsTableProps> = ({
  projects,
  isLoading,
  onNewProject,
  onEdit,
  onArchive,
  onDelete,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'draft' | 'on_hold' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);

  // STRICT FILTER: Subprojects must NEVER be shown here, ONLY main projects!
  const mainProjects = projects.filter((p) => {
    if (p.parentId) return false;
    if (/-SP\d+/i.test(p.code || '')) return false;
    return true;
  });

  // Calculate counts for tabs exclusively from main projects
  const counts = {
    all: mainProjects.length,
    active: mainProjects.filter((p) => p.status === 'active').length,
    draft: mainProjects.filter((p) => p.status === 'draft').length,
    on_hold: mainProjects.filter((p) => p.status === 'on_hold').length,
    completed: mainProjects.filter((p) => p.status === 'completed').length,
  };

  // Filter main projects by tab and search
  const filteredProjects = mainProjects.filter((p) => {
    if (activeTab !== 'all' && p.status !== activeTab) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = p.name?.toLowerCase().includes(q);
      const matchCode = p.code?.toLowerCase().includes(q);
      const matchLoc = p.location?.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchLoc) return false;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Completed
          </span>
        );
      case 'on_hold':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            On Hold
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Draft
          </span>
        );
    }
  };

  const getHealthBadge = (project: Project) => {
    // Only mark at risk if explicitly on hold or past deadline without completion
    const isOverdue = project.endDate && new Date(project.endDate) < new Date() && (project.progress ?? 0) < 100;
    const isAtRisk = project.status === 'on_hold' || isOverdue;
    if (!isAtRisk) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          On Track
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        At Risk
      </span>
    );
  };

  const formatCrValue = (val?: number) => {
    if (!val || val === 0) return '₹0.00';
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} L`;
    }
    return formatCurrency(val, 'INR', true);
  };

  return (
    <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm transition-colors overflow-hidden">
      {/* Top Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Projects</h3>
          <button
            onClick={() => {
              setActiveTab('all');
              setSearchQuery('');
            }}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            View all
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Tabs Row */}
      <div className="px-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 sm:gap-6 overflow-x-auto custom-scrollbar text-xs">
        {[
          { id: 'all', label: `All Projects (${counts.all})` },
          { id: 'active', label: `Active (${counts.active})` },
          { id: 'draft', label: `Draft (${counts.draft})` },
          { id: 'on_hold', label: `On Hold (${counts.on_hold})` },
          { id: 'completed', label: `Completed (${counts.completed})` },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-3 font-semibold border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 text-slate-500 dark:text-slate-400 font-semibold">
              <th className="py-3 px-5">Project</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Progress</th>
              <th className="py-3 px-4">Budget</th>
              <th className="py-3 px-4">Forecast</th>
              <th className="py-3 px-4">Health</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                  <p>Loading projects...</p>
                </td>
              </tr>
            ) : filteredProjects.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    No main projects found
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {searchQuery ? 'Try adjusting your search criteria' : 'Create a new project to get started'}
                  </p>
                  <button
                    onClick={onNewProject}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Project</span>
                  </button>
                </td>
              </tr>
            ) : (
              filteredProjects.map((p) => {
                const isMenuOpen = actionMenuOpenId === p._id;
                const progressPct = p.progress ?? 0;

                return (
                  <tr
                    key={p._id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/projects/${p._id}`)}
                  >
                    {/* Project Name & Code */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-sm">
                          <Building2 className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {p.name}
                          </p>
                          <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                            {p.code}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                            {p.location || 'Location not set'}
                          </p>
                          {p.department && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">
                              {p.department}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {getStatusBadge(p.status)}
                    </td>

                    {/* Progress */}
                    <td className="py-3.5 px-4">
                      <div className="w-28">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          <span>{progressPct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Budget */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {formatCrValue(p.contractValue || p.estimatedValue)}
                    </td>

                    {/* Forecast */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {formatCrValue(p.contractValue || p.estimatedValue)}
                    </td>

                    {/* Health */}
                    <td className="py-3.5 px-4">
                      {getHealthBadge(p)}
                    </td>

                    {/* Actions Menu */}
                    <td
                      className="py-3.5 px-4 text-right relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setActionMenuOpenId(isMenuOpen ? null : p._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Popover */}
                      {isMenuOpen && (
                        <div className="absolute right-4 top-10 w-44 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-30 text-left">
                          <button
                            onClick={() => {
                              setActionMenuOpenId(null);
                              navigate(`/projects/${p._id}`);
                            }}
                            className="w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                            <span>Open Workspace</span>
                          </button>
                          <button
                            onClick={() => {
                              setActionMenuOpenId(null);
                              onEdit(p);
                            }}
                            className="w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                          >
                            <Edit className="w-3.5 h-3.5 text-slate-400" />
                            <span>Edit Details</span>
                          </button>
                          <button
                            onClick={() => {
                              setActionMenuOpenId(null);
                              onArchive(p._id);
                            }}
                            className="w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                          >
                            <Archive className="w-3.5 h-3.5 text-amber-500" />
                            <span>{p.isArchived ? 'Unarchive' : 'Archive'}</span>
                          </button>
                          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                          <button
                            onClick={() => {
                              setActionMenuOpenId(null);
                              onDelete(p._id, p.name);
                            }}
                            className="w-full px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Move to Trash</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
