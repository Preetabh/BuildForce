import React from 'react';
import { Filter, ArrowUpDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ProjectFiltersProps {
  status: string;
  onStatusChange: (status: string) => void;
  projectType: string;
  onProjectTypeChange: (type: string) => void;
  sort: string;
  order: 'asc' | 'desc';
  onSortChange: (sort: string, order: 'asc' | 'desc') => void;
}

export const ProjectFilters: React.FC<ProjectFiltersProps> = ({
  status,
  onStatusChange,
  projectType,
  onProjectTypeChange,
  sort,
  order,
  onSortChange,
}) => {
  const statusTabs = [
    { key: 'all', label: 'All Projects' },
    { key: 'active', label: 'Active' },
    { key: 'draft', label: 'Draft' },
    { key: 'on_hold', label: 'On Hold' },
    { key: 'completed', label: 'Completed' },
    { key: 'archived', label: 'Archived' },
  ];

  const projectTypes = [
    { key: 'all', label: 'All Types' },
    { key: 'Commercial', label: 'Commercial' },
    { key: 'Infrastructure', label: 'Infrastructure' },
    { key: 'Residential', label: 'Residential' },
    { key: 'Industrial', label: 'Industrial' },
    { key: 'Institutional', label: 'Institutional' },
  ];

  const sortOptions = [
    { label: 'Newest First', sort: 'createdAt', order: 'desc' as const },
    { label: 'Oldest First', sort: 'createdAt', order: 'asc' as const },
    { label: 'Project Name (A-Z)', sort: 'name', order: 'asc' as const },
    { label: 'Contract Value (High to Low)', sort: 'contractValue', order: 'desc' as const },
    { label: 'Progress (High to Low)', sort: 'progress', order: 'desc' as const },
  ];

  const currentSortKey = `${sort}-${order}`;

  return (
    <div className="space-y-3">
      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onStatusChange(tab.key)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150',
              status === tab.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-erp-text-muted hover:text-erp-text hover:bg-slate-800 bg-slate-900/60 border border-erp-border/60'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Second Row: Type Filter & Sorting */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Project Type Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-erp-text-subtle" />
          <select
            value={projectType}
            onChange={(e) => onProjectTypeChange(e.target.value)}
            className="bg-slate-900 border border-erp-border rounded-lg text-xs text-erp-text px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
          >
            {projectTypes.map((type) => (
              <option key={type.key} value={type.key}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-erp-text-subtle" />
          <select
            value={currentSortKey}
            onChange={(e) => {
              const [s, o] = e.target.value.split('-');
              onSortChange(s, o as 'asc' | 'desc');
            }}
            className="bg-slate-900 border border-erp-border rounded-lg text-xs text-erp-text px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
          >
            {sortOptions.map((opt, i) => (
              <option key={i} value={`${opt.sort}-${opt.order}`}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
