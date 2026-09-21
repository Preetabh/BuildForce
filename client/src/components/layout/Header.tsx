import React from 'react';
import { Menu, RefreshCw, Plus, Search, Building } from 'lucide-react';
import { Button } from '../common/Button';
import { BreadcrumbItem, Breadcrumb } from './Breadcrumb';
import { useAuth } from '../../context/AuthContext';

export interface HeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  onToggleSidebar: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onNewProject?: () => void;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  breadcrumbs = [{ label: 'Home' }],
  onToggleSidebar,
  onRefresh,
  isRefreshing = false,
  onNewProject,
  searchValue,
  onSearchChange,
}) => {
  const { company, user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-[#0B0F17]/90 backdrop-blur-md border-b border-erp-border px-4 sm:px-6 py-3.5 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Menu Trigger & Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-erp-text-muted hover:text-erp-text rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <Breadcrumb items={breadcrumbs} />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh project data"
              className="p-2 text-erp-text-muted hover:text-erp-text hover:bg-slate-800 border border-erp-border rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`}
              />
            </button>
          )}

          {/* New Project CTA */}
          {onNewProject && (
            <Button
              onClick={onNewProject}
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              <span className="hidden sm:inline">New Project</span>
              <span className="sm:hidden">New</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
