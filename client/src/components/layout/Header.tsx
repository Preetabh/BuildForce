import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  RefreshCw,
  Plus,
  Search,
  Building2,
  Bell,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  History,
  X,
  ExternalLink,
  Sparkles,
  Command,
} from 'lucide-react';
import { Button } from '../common/Button';
import { BreadcrumbItem, Breadcrumb } from './Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { UserProfileMenu } from '../profile/UserProfileMenu';

export interface HeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  onToggleSidebar: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onNewProject?: () => void;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'security' | 'project' | 'vendor' | 'system';
  unread: boolean;
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
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [activeProjectName, setActiveProjectName] = useState('All Projects');

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'Role Permissions Modified',
      description: 'Admin updated authorities for Site Engineer',
      time: 'Just now',
      type: 'security',
      unread: true,
    },
    {
      id: '2',
      title: 'Vendor Onboarded',
      description: 'Apex Steel & Cement Corp added with GSTIN',
      time: '12m ago',
      type: 'vendor',
      unread: true,
    },
    {
      id: '3',
      title: 'BOQ Measurement Locked',
      description: 'Tower A Foundation item verified by Manager',
      time: '1h ago',
      type: 'project',
      unread: true,
    },
    {
      id: '4',
      title: 'Immutable Audit Snapshot',
      description: 'System-wide audit backup completed successfully',
      time: '3h ago',
      type: 'system',
      unread: false,
    },
  ]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const projectRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (projectRef.current && !projectRef.current.contains(e.target as Node)) {
        setIsProjectDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const dummyProjects = [
    { id: 'all', name: 'All Projects', code: 'GLOBAL', status: 'ACTIVE' },
    { id: '1', name: 'Skyline Commercial Towers', code: 'SCT-01', status: 'IN_PROGRESS' },
    { id: '2', name: 'Green Valley Villas Ph-2', code: 'GVV-02', status: 'ON_TRACK' },
    { id: '3', name: 'Metro Flyover Expansion', code: 'MFE-09', status: 'REVIEW' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#070A12]/90 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-6 py-2.5 transition-all shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Mobile Trigger & Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-colors"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <Breadcrumb items={breadcrumbs} />
          </div>
        </div>

        {/* Middle: Project Selector & Command Search */}
        <div className="flex-1 max-w-xl mx-2 hidden md:flex items-center gap-2.5">
          {/* Project Switcher Pill Dropdown */}
          <div className="relative" ref={projectRef}>
            <button
              type="button"
              onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/[0.08] bg-[#0E1524]/90 hover:bg-[#141E33] text-xs font-semibold text-slate-200 shadow-sm shrink-0 cursor-pointer hover:border-amber-500/30 transition-all select-none group"
            >
              <div className="w-5 h-5 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Building2 className="w-3 h-3 text-amber-400" />
              </div>
              <span className="truncate max-w-[130px]">{activeProjectName}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-transform ${
                  isProjectDropdownOpen ? 'rotate-180 text-amber-400' : ''
                }`}
              />
            </button>

            {isProjectDropdownOpen && (
              <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-[#0D1424] border border-white/10 shadow-2xl shadow-black/90 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-2xl">
                <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/[0.06]">
                  Active Workspace Scope
                </div>
                <div className="mt-1 space-y-1">
                  {dummyProjects.map((proj) => {
                    const isSelected = activeProjectName === proj.name;
                    return (
                      <button
                        key={proj.id}
                        type="button"
                        onClick={() => {
                          setActiveProjectName(proj.name);
                          setIsProjectDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30'
                            : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <p className="truncate leading-tight">{proj.name}</p>
                          <span className="text-[10px] font-mono text-slate-500 font-normal">
                            {proj.code}
                          </span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Command Search Bar */}
          <div className="relative flex-1 group">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-400 transition-colors pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchValue ?? ''}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search projects, tasks, vendors, audit logs..."
              className="w-full pl-9 pr-14 py-1.5 rounded-xl text-xs bg-[#0E1524]/90 border border-white/[0.08] text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/60 shadow-inner transition-all"
            />
            {searchValue ? (
              <button
                type="button"
                onClick={() => onSearchChange?.('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-0.5 pointer-events-none">
                <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-semibold text-slate-400 bg-white/[0.06] border border-white/[0.1] rounded-md shadow-xs">
                  ⌘K
                </kbd>
              </div>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Live System Security / Audit Badge */}
          <button
            type="button"
            onClick={() => navigate('/settings/audit-logs')}
            title="System Security & Immutable Audit Stream Active - Click to inspect"
            className="hidden xl:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 hover:border-emerald-400/50 text-[11px] font-semibold text-emerald-300 shadow-sm shadow-emerald-950/50 cursor-pointer transition-all active:scale-95 group"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="tracking-wide">AUDIT SECURE</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
          </button>

          {/* Refresh Action Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh live workspace data"
              className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/20 rounded-xl transition-all disabled:opacity-50 active:scale-95 cursor-pointer shadow-sm"
            >
              <RefreshCw
                className={`w-4 h-4 transition-transform duration-300 ${
                  isRefreshing ? 'animate-spin text-amber-400' : 'group-hover:rotate-45'
                }`}
              />
            </button>
          )}

          {/* Interactive Notifications Bell Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              title="Alerts & Audit Notifications"
              className="relative p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/20 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 group"
            >
              <Bell className="w-4 h-4 group-hover:text-amber-400 transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center text-[9px] font-black text-slate-950 bg-amber-400 rounded-full shadow-md shadow-amber-500/40 border border-[#070A12] animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Popover Card */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#0D1424] border border-white/10 shadow-2xl shadow-black/90 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-2xl">
                <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white tracking-tight">
                      Security & Activity Alerts
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                        {unreadCount} New
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div className="py-2 space-y-1.5 max-h-72 overflow-y-auto scrollbar-none">
                  {notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-xl border transition-all ${
                        item.unread
                          ? 'bg-[#121B2F] border-amber-500/30'
                          : 'bg-white/[0.02] border-white/[0.04] opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {item.type === 'security' && (
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          )}
                          {item.type === 'vendor' && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          {item.type === 'project' && (
                            <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          )}
                          {item.type === 'system' && (
                            <History className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          )}
                          <p className="text-xs font-bold text-white truncate">{item.title}</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {item.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Footer Link to Audit Logs */}
                <div className="pt-2 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNotificationsOpen(false);
                      navigate('/settings/audit-logs');
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold text-amber-400 hover:text-slate-950 hover:bg-amber-400 border border-amber-400/30 transition-all cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>View Full Audit & Security Trail</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu with Authoritative Role Badge & Capsule */}
          <UserProfileMenu showRoleBadge={true} />

          {/* Luxury New Project CTA Button */}
          {onNewProject && (
            <button
              type="button"
              onClick={onNewProject}
              className="relative group overflow-hidden px-4 py-2 rounded-xl text-xs font-extrabold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 shadow-lg shadow-amber-500/25 border border-amber-300/40 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-700 ease-out" />
              <Plus className="w-4 h-4 stroke-[3] text-slate-950" />
              <span className="hidden sm:inline tracking-tight">New Project</span>
              <span className="sm:hidden">New</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
