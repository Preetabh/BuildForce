import React from 'react';
import { Menu, RefreshCw, Plus, Search, Building2, Bell, Sun, Moon, ChevronDown } from 'lucide-react';
import { Button } from '../common/Button';
import { BreadcrumbItem, Breadcrumb } from './Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

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
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2.5 transition-colors">
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Mobile Menu Trigger & Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <Breadcrumb items={breadcrumbs} />
          </div>
        </div>

        {/* Middle: Project Selector & Global Search */}
        <div className="flex-1 max-w-xl mx-2 hidden md:flex items-center gap-2.5">
          {/* Project Switcher Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm shrink-0 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
            <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>All Projects</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchValue ?? ''}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search projects, tasks, RFIs..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh project data"
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`}
              />
            </button>
          )}

          {/* Notifications Bell */}
          <button
            title="Notifications"
            className="relative p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#0B0F19]" />
          </button>

          {/* Theme Toggle (Light / Dark) */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* User Avatar */}
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-blue-500/20">
            {user?.name?.charAt(0).toUpperCase() || 'P'}
          </div>

          {/* New Project CTA */}
          {onNewProject && (
            <Button
              onClick={onNewProject}
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              <span className="hidden sm:inline">New project</span>
              <span className="sm:hidden">New</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
