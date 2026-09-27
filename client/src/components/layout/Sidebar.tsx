import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  CalendarRange,
  Target,
  Truck,
  FolderKanban,
  BookOpen,
  Calculator,
  ClipboardCheck,
  FileSpreadsheet,
  BadgePercent,
  Layers,
  Wrench,
  TrendingUp,
  Sun,
  Moon,
  LogOut,
  X,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Trash2,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/cn';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  deletedCount?: number;
  width?: number;
  onWidthChange?: (width: number) => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

interface NavSubItem {
  label: string;
  path: string;
  icon?: React.ElementType;
  isComingSoon?: boolean;
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  items: NavSubItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  deletedCount,
  width = 260,
  onWidthChange,
  isMinimized = false,
  onToggleMinimize,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  // Resize drag state
  const [isDragging, setIsDragging] = useState(false);

  // Group accordion state (only ONE section open at a time: "jab ek section open ho dusra close")
  const [openGroupId, setOpenGroupId] = useState<string | null>('plannings');

  // Popover state for minimized mode flyout menus
  const [activeFlyoutGroup, setActiveFlyoutGroup] = useState<string | null>(null);

  const toggleGroup = (groupId: string) => {
    // When clicking the currently open group, toggle it closed; otherwise open it and close any other
    setOpenGroupId((prev) => (prev === groupId ? null : groupId));
  };

  // 5 Dedicated Sections requested: Home, Plannings, Lead Management, Vendor Management, Project Management
  const navGroups: NavGroup[] = [
    {
      id: 'plannings',
      label: 'PLANNINGS',
      icon: CalendarRange,
      items: [
        { label: 'Schedule of Rates (SOR)', path: '/sor', icon: BookOpen, isComingSoon: false },
        { label: 'Quantity Master', path: '/planning/quantity-master', icon: Calculator, isComingSoon: false },
        { label: 'QC Master & Checklists', path: '/planning/qc-master', icon: ClipboardCheck, isComingSoon: true },
        { label: 'Project Schedule & WBS', path: '/planning', icon: Layers, isComingSoon: true },
      ],
    },
    {
      id: 'lead_management',
      label: 'LEAD MANAGEMENT',
      icon: Target,
      items: [
        { label: 'Lead Pipeline & Enquiries', path: '/leads', icon: Target, isComingSoon: true },
        { label: 'Client Quotations & Bids', path: '/sales/bids', icon: FileSpreadsheet, isComingSoon: true },
        { label: 'Tender Estimation', path: '/sales/tenders', icon: BadgePercent, isComingSoon: true },
        { label: 'Work Orders & Contracts', path: '/sales/work-orders', icon: ClipboardCheck, isComingSoon: true },
      ],
    },
    {
      id: 'vendor_management',
      label: 'VENDOR MANAGEMENT',
      icon: Truck,
      items: [
        { label: 'Vendor Directory & KYC', path: '/vendors', icon: Truck, isComingSoon: true },
        { label: 'Purchase Orders (PO)', path: '/materials/purchase-orders', icon: FileSpreadsheet, isComingSoon: true },
        { label: 'Material Requisitions (MRN)', path: '/materials/mrn', icon: Layers, isComingSoon: true },
        { label: 'Goods Receipt Notes (GRN)', path: '/materials/grn', icon: ClipboardCheck, isComingSoon: true },
        { label: 'Subcontractor Work Logs', path: '/execution/subcontractor-logs', icon: Wrench, isComingSoon: true },
      ],
    },
    {
      id: 'project_management',
      label: 'PROJECT MANAGEMENT',
      icon: FolderKanban,
      items: [
        { label: 'Projects Workspace', path: '/', icon: FolderKanban, isComingSoon: false },
        { label: 'Measurement Book (e-MB)', path: '/execution/measurement-book', icon: Layers, isComingSoon: true },
        { label: 'Daily Progress Report (DPR)', path: '/execution/dpr', icon: FileSpreadsheet, isComingSoon: true },
        { label: 'Cost Control & EVM', path: '/project-control/evm', icon: TrendingUp, isComingSoon: true },
        { label: 'Site Inspection Checklist', path: '/execution/inspections', icon: ClipboardCheck, isComingSoon: true },
      ],
    },
  ];

  // Auto-expand group that contains current path on initial mount or route change
  useEffect(() => {
    for (const group of navGroups) {
      if (
        group.items.some(
          (item) => location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
        )
      ) {
        setOpenGroupId(group.id);
        break;
      }
    }
  }, [location.pathname]);

  // Handle mouse drag to resize sidebar ("chota bada ho sake side bar mouse se")
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!onWidthChange) return;
      // Clamp between 210px and 480px
      const newWidth = Math.max(210, Math.min(480, e.clientX));
      onWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onWidthChange]);

  const handleResetWidth = (e: React.MouseEvent) => {
    e.preventDefault();
    onWidthChange?.(260);
  };

  const currentEffectiveWidth = isMinimized ? 68 : width;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        style={{
          width: `${currentEffectiveWidth}px`,
          maxWidth: 'calc(100vw - 2.5rem)',
          transition: isDragging ? 'none' : 'width 200ms cubic-bezier(0.4, 0, 0.2, 1), transform 300ms ease-in-out',
        }}
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 bg-[#0A0D14] border-r border-[#161D2E] flex flex-col md:translate-x-0 select-none shadow-2xl',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="p-3 border-b border-[#161D2E] flex items-center justify-between bg-[#0E1528] shrink-0 min-h-[58px]">
          {isMinimized ? (
            /* Minimized Brand Header */
            <div className="w-full flex items-center justify-center">
              <button
                onClick={onToggleMinimize}
                title="Expand Sidebar"
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-800/60 hover:bg-blue-600/20 text-slate-300 hover:text-cyan-300 transition-all border border-slate-700/60 group"
              >
                <PanelLeftOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          ) : (
            /* Full Brand Header */
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg shadow-blue-500/20 shrink-0 border border-cyan-500/40 bg-gradient-to-br from-[#0c1426] via-[#080d19] to-black p-1 flex items-center justify-center">
                  <img
                    src={isDark ? '/logo-dark.png' : '/logo.png'}
                    alt="BudgetPilot Logo"
                    className="w-full h-full object-contain filter drop-shadow-[0_0_6px_rgba(56,189,248,0.5)]"
                  />
                </div>
                <div className="min-w-0">
                  <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5 font-mono truncate">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-300">
                      BudgetPilot
                    </span>
                  </h1>
                  <p className="text-[10px] font-medium tracking-wider uppercase text-cyan-400/80 truncate">
                    Plan • Build • Control
                  </p>
                </div>
              </div>

              {/* Minimize & Mobile Close Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                {onToggleMinimize && (
                  <button
                    onClick={onToggleMinimize}
                    title="Minimize Sidebar"
                    className="hidden md:flex p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 px-2 py-3 overflow-y-auto space-y-2 custom-scrollbar text-xs">
          {/* 1. Home Direct Link */}
          <div>
            <NavLink
              to="/"
              end
              onClick={() => onClose()}
              title={isMinimized ? 'Home' : undefined}
              className={({ isActive }) =>
                cn(
                  'group flex items-center rounded-lg font-medium transition-all duration-150',
                  isMinimized ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2',
                  isActive
                    ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.35)]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Home
                    className={cn(
                      'w-4 h-4 shrink-0 transition-colors',
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                    )}
                  />
                  {!isMinimized && <span className="font-semibold truncate">Home</span>}
                </>
              )}
            </NavLink>
          </div>

          {/* 2 - 5: Collapsible Accordion Sections */}
          <div className="space-y-1.5">
            {navGroups.map((group) => {
              const isOpenGroup = openGroupId === group.id;
              const hasActiveChild = group.items.some(
                (item) => location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
              );
              const isFlyoutOpen = activeFlyoutGroup === group.id;

              return (
                <div
                  key={group.id}
                  className="relative rounded-lg"
                  onMouseEnter={() => isMinimized && setActiveFlyoutGroup(group.id)}
                  onMouseLeave={() => isMinimized && setActiveFlyoutGroup(null)}
                >
                  {/* Group Header Button */}
                  <button
                    onClick={() => {
                      if (isMinimized && onToggleMinimize) {
                        onToggleMinimize();
                        setOpenGroupId(group.id);
                      } else {
                        toggleGroup(group.id);
                      }
                    }}
                    title={isMinimized ? group.label : undefined}
                    className={cn(
                      'w-full flex items-center rounded-lg font-semibold tracking-wider text-[11px] transition-all duration-150',
                      isMinimized ? 'justify-center p-2.5' : 'justify-between px-3 py-2',
                      isOpenGroup && !isMinimized
                        ? 'text-blue-400 bg-blue-500/10'
                        : hasActiveChild
                        ? 'text-cyan-300 bg-slate-800/50'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                    )}
                  >
                    <div className={cn('flex items-center min-w-0', !isMinimized && 'gap-2.5')}>
                      <group.icon
                        className={cn(
                          'w-4 h-4 shrink-0 transition-colors',
                          isOpenGroup || hasActiveChild ? 'text-cyan-400' : 'text-slate-400'
                        )}
                      />
                      {!isMinimized && <span className="truncate">{group.label}</span>}
                    </div>
                    {!isMinimized && (
                      isOpenGroup ? (
                        <ChevronDown className="w-3.5 h-3.5 text-blue-400 transition-transform shrink-0 ml-1" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 transition-transform shrink-0 ml-1" />
                      )
                    )}
                  </button>

                  {/* Minimized Mode Floating Flyout Menu */}
                  {isMinimized && isFlyoutOpen && (
                    <div className="absolute left-full top-0 ml-2.5 z-[60] w-56 bg-[#0E1528] border border-slate-700/80 rounded-xl p-2 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-2.5 py-1.5 border-b border-slate-800/80 mb-1 flex items-center gap-2">
                        <group.icon className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="font-bold text-[11px] text-white tracking-wider">{group.label}</span>
                      </div>
                      <div className="space-y-0.5">
                        {group.items.map((subItem) => {
                          const SubIcon = subItem.icon || FileSpreadsheet;
                          return (
                            <NavLink
                              key={subItem.path}
                              to={subItem.path}
                              onClick={() => {
                                onClose();
                                setActiveFlyoutGroup(null);
                              }}
                              className={({ isActive }) =>
                                cn(
                                  'group flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11.5px] font-medium transition-all duration-150',
                                  isActive
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                                )
                              }
                            >
                              {({ isActive }) => (
                                <>
                                  <div className="flex items-center gap-2 min-w-0">
                                    <SubIcon
                                      className={cn(
                                        'w-3.5 h-3.5 shrink-0 transition-colors',
                                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                                      )}
                                    />
                                    <span className="truncate">{subItem.label}</span>
                                  </div>
                                  {subItem.isComingSoon && (
                                    <span className="text-[9px] px-1 py-0.2 rounded font-medium bg-slate-800 text-slate-400 border border-slate-700/50">
                                      Soon
                                    </span>
                                  )}
                                </>
                              )}
                            </NavLink>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Group Sub-Items in Full Mode (Single accordion active) */}
                  {!isMinimized && isOpenGroup && (
                    <div className="pl-4 pr-1 py-1 space-y-0.5 border-l border-blue-500/30 ml-4 my-1 animate-in fade-in slide-in-from-top-1 duration-150">
                      {group.items.map((subItem) => {
                        const SubIcon = subItem.icon || FileSpreadsheet;
                        return (
                          <NavLink
                            key={subItem.path}
                            to={subItem.path}
                            onClick={() => onClose()}
                            className={({ isActive }) =>
                              cn(
                                'group flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11.5px] font-medium transition-all duration-150',
                                isActive
                                  ? 'bg-blue-600/90 text-white shadow-sm'
                                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                              )
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <div className="flex items-center gap-2 min-w-0">
                                  <SubIcon
                                    className={cn(
                                      'w-3.5 h-3.5 shrink-0 transition-colors',
                                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                                    )}
                                  />
                                  <span className="truncate">{subItem.label}</span>
                                </div>
                                {subItem.isComingSoon && (
                                  <span
                                    className={cn(
                                      'text-[9px] px-1 py-0.2 rounded font-medium shrink-0 ml-1.5',
                                      isActive
                                        ? 'bg-blue-800 text-blue-100'
                                        : 'bg-slate-800/90 text-slate-400 border border-slate-700/50'
                                    )}
                                  >
                                    Soon
                                  </span>
                                )}
                              </>
                            )}
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Recycle Bin & Settings */}
          <div className="pt-2 border-t border-slate-800/60 space-y-1">
            <NavLink
              to="/recycle-bin"
              onClick={() => onClose()}
              title={isMinimized ? `Recycle Bin ${deletedCount ? `(${deletedCount})` : ''}` : undefined}
              className={({ isActive }) =>
                cn(
                  'group flex items-center rounded-lg font-medium transition-all duration-150 relative',
                  isMinimized ? 'justify-center p-2.5' : 'justify-between px-3 py-2',
                  isActive
                    ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.35)]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className={cn('flex items-center min-w-0', !isMinimized && 'gap-2.5')}>
                    <Trash2
                      className={cn(
                        'w-4 h-4 shrink-0 transition-colors',
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                      )}
                    />
                    {!isMinimized && <span className="font-semibold truncate">Recycle Bin</span>}
                  </div>
                  {deletedCount !== undefined && deletedCount > 0 && (
                    <span
                      className={cn(
                        'text-[10px] rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30',
                        isMinimized
                          ? 'absolute top-1 right-1 w-2 h-2 p-0 bg-amber-400 rounded-full'
                          : 'px-1.5 py-0.2 shrink-0'
                      )}
                    >
                      {!isMinimized && deletedCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>

            <NavLink
              to="/settings"
              onClick={() => onClose()}
              title={isMinimized ? 'Settings' : undefined}
              className={({ isActive }) =>
                cn(
                  'group flex items-center rounded-lg font-medium transition-all duration-150',
                  isMinimized ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2',
                  isActive
                    ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.35)]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Settings
                    className={cn(
                      'w-4 h-4 shrink-0 transition-colors',
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                    )}
                  />
                  {!isMinimized && <span className="font-semibold truncate">Settings</span>}
                </>
              )}
            </NavLink>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-2.5 border-t border-[#161D2E] bg-[#0E121E] shrink-0">
          {isMinimized ? (
            /* Minimized Profile Footer */
            <div className="flex flex-col items-center gap-2">
              <div
                title={user?.name || user?.email || 'User'}
                className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-md cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
              >
                {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={toggleTheme}
                  title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  className="p-1.5 rounded-lg bg-slate-800/80 text-amber-300 hover:bg-slate-700 transition-colors"
                >
                  {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={logout}
                  title="Log Out"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Full Profile Footer */
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
                  {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-200 truncate">
                    {user?.name || (user?.email ? user.email.split('@')[0] : 'User')}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[10px] text-slate-400 truncate max-w-[90px]">
                      {user?.email || ''}
                    </p>
                    <span className="text-[9px] text-slate-500 font-mono shrink-0">
                      v1.0
                    </span>
                  </div>
                </div>
              </div>

              {/* Theme Toggle & Logout */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={toggleTheme}
                  title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  className="p-1.5 rounded-lg bg-slate-800/80 text-amber-300 hover:bg-slate-700 transition-colors"
                >
                  {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={logout}
                  title="Log Out"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Mouse Drag Resize Handle (Only active when not minimized) */}
        {!isMinimized && (
          <div
            onMouseDown={handleMouseDown}
            onDoubleClick={handleResetWidth}
            title="Drag to resize sidebar width | Double-click to reset (260px)"
            className={cn(
              'hidden md:flex absolute top-0 bottom-0 -right-1.5 w-3 cursor-col-resize z-50 items-center justify-center group touch-none select-none transition-colors',
              isDragging && 'bg-blue-600/20'
            )}
          >
            {/* Subtle vertical accent indicator */}
            <div
              className={cn(
                'w-0.5 h-full transition-colors duration-150',
                isDragging
                  ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]'
                  : 'bg-transparent group-hover:bg-blue-500/40'
              )}
            />

            {/* Grab Dots Indicator in middle */}
            <div
              className={cn(
                'absolute top-1/2 -translate-y-1/2 flex items-center justify-center p-0.5 rounded-md transition-all duration-150',
                isDragging
                  ? 'bg-blue-600 text-white opacity-100 shadow-md scale-110'
                  : 'bg-slate-800 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:bg-slate-700'
              )}
            >
              <GripVertical className="w-3 h-3" />
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
