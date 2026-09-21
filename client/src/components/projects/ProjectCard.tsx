import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Calendar,
  Layers,
  MoreVertical,
  Edit2,
  Archive,
  Trash2,
  ArrowUpRight,
  ExternalLink,
  Briefcase,
} from 'lucide-react';
import { Project } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { cn } from '../../utils/cn';

export interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onArchive: (projectId: string) => void;
  onDelete: (projectId: string, projectName: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onEdit,
  onArchive,
  onDelete,
}) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close more menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const statusConfig = {
    active: {
      label: 'Active',
      class: 'badge-active',
      dotClass: 'bg-emerald-400',
    },
    draft: {
      label: 'Draft',
      class: 'badge-draft',
      dotClass: 'bg-slate-400',
    },
    completed: {
      label: 'Completed',
      class: 'badge-completed',
      dotClass: 'bg-blue-400',
    },
    on_hold: {
      label: 'On Hold',
      class: 'badge-on_hold',
      dotClass: 'bg-amber-400',
    },
    archived: {
      label: 'Archived',
      class: 'badge-archived',
      dotClass: 'bg-purple-400',
    },
  };

  const statusInfo = statusConfig[project.status] || statusConfig.draft;
  const displayValue = project.contractValue > 0 ? project.contractValue : project.estimatedValue;

  return (
    <div className="glass-panel glass-panel-hover rounded-xl p-5 transition-all duration-200 flex flex-col justify-between relative group">
      {/* Top Row: Icon + Name & Code + More Menu */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {/* Construction Icon */}
            <div
              onClick={() => navigate(`/projects/${project._id}`)}
              className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 cursor-pointer group-hover:bg-blue-600 group-hover:text-white transition-colors"
            >
              <Building2 className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  onClick={() => navigate(`/projects/${project._id}`)}
                  className="font-semibold text-erp-text text-base hover:text-blue-400 transition-colors cursor-pointer truncate max-w-[220px]"
                  title={project.name}
                >
                  {project.name}
                </h3>
              </div>

              {/* Code + Client Name */}
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60">
                  {project.code}
                </span>
                {project.clientName && (
                  <span className="text-xs text-erp-text-muted truncate max-w-[160px] flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{project.clientName}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* More Action Menu */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 text-erp-text-muted hover:text-erp-text rounded-md hover:bg-slate-800 transition-colors"
              aria-label="Project actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 rounded-lg bg-slate-900 border border-erp-border shadow-xl z-20 py-1 text-xs">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(`/projects/${project._id}`);
                  }}
                  className="w-full px-3 py-2 text-left text-erp-text hover:bg-slate-800 flex items-center gap-2"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
                  <span>Open Workspace</span>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(project);
                  }}
                  className="w-full px-3 py-2 text-left text-erp-text hover:bg-slate-800 flex items-center gap-2"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Edit Project</span>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onArchive(project._id);
                  }}
                  className="w-full px-3 py-2 text-left text-erp-text hover:bg-slate-800 flex items-center gap-2"
                >
                  <Archive className="w-3.5 h-3.5 text-purple-400" />
                  <span>{project.isArchived ? 'Unarchive' : 'Archive Project'}</span>
                </button>
                <div className="border-t border-slate-800 my-1" />
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(project._id, project.name);
                  }}
                  className="w-full px-3 py-2 text-left text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Move to Recycle Bin</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Location Row */}
        {project.location && (
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-erp-text-subtle">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{project.location}</span>
          </div>
        )}

        {/* Progress Bar Row */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-erp-text-muted font-medium">
              Progress: <span className="text-erp-text">{project.progress}%</span>
            </span>
            <span
              className={cn(
                'text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1',
                statusInfo.class
              )}
            >
              <span className={cn('w-1.5 h-1.5 rounded-full', statusInfo.dotClass)} />
              {statusInfo.label}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-300"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Row: Contract Value + Phases + Date */}
      <div className="mt-5 pt-3.5 border-t border-erp-border/80 flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] text-erp-text-subtle block uppercase font-mono">
            {project.contractValue > 0 ? 'Contract Value' : 'Estimated Value'}
          </span>
          <span className="text-sm sm:text-base font-bold text-erp-text tracking-tight">
            {formatCurrency(displayValue, project.currency || 'INR')}
          </span>
        </div>

        <div className="text-right">
          <div className="flex items-center justify-end gap-1.5 text-[11px] text-erp-text-subtle">
            <Layers className="w-3 h-3 text-purple-400" />
            <span>{project.phases || 1} Phases</span>
          </div>
          <div className="flex items-center justify-end gap-1 text-[11px] text-erp-text-muted mt-0.5">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>{formatDate(project.endDate || project.startDate)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
