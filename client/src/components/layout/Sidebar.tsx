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
  LogOut,
  X,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Trash2,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Building2,
  CreditCard,
  Handshake,
  HardHat,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
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

  // Resize drag state
  const [isDragging, setIsDragging] = useState(false);

  // Hover expansion state when sidebar is minimized ("after hover expand navbar")
  const [isHovered, setIsHovered] = useState(false);

  // Group accordion state (only ONE section open at a time: "jab ek section open ho dusra close")
  const [openGroupId, setOpenGroupId] = useState<string | null>('plannings');

  // The sidebar is visually compact ONLY if it is minimized AND not currently hovered
  const isCompact = isMinimized && !isHovered;

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
        { label: 'Leads', path: '/leads', icon: Target, isComingSoon: true },
        { label: 'Client', path: '/leads/clients', icon: Building2, isComingSoon: true },
        { label: 'Payment', path: '/leads/payments', icon: CreditCard, isComingSoon: true },
        { label: 'Reference Partners', path: '/leads/partners', icon: Handshake, isComingSoon: true },
        { label: 'Commission Report', path: '/leads/commission-reports', icon: FileSpreadsheet, isComingSoon: true },
      ],
    },
    {
      id: 'vendor_management',
      label: 'VENDOR MANAGEMENT',
      icon: Truck,
      items: [
        { label: 'Suppliers', path: '/vendors/suppliers', icon: Truck, isComingSoon: true },
        { label: 'Workers', path: '/vendors/workers', icon: HardHat, isComingSoon: true },
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

  const currentEffectiveWidth = isCompact ? 68 : width;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container with Hover-Expand Support */}
      <aside
        onMouseEnter={() => {
          if (isMinimized) setIsHovered(true);
        }}
        onMouseLeave={() => {
          if (isMinimized) setIsHovered(false);
        }}
        style={{
          width: `${currentEffectiveWidth}px`,
          maxWidth: 'calc(100vw - 2.5rem)',
          transition: isDragging
            ? 'none'
            : 'width 240ms cubic-bezier(0.4, 0, 0.2, 1), transform 300ms ease-in-out',
        }}
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 bg-[#0A0D14] border-r border-[#161D2E] flex flex-col md:translate-x-0 select-none shadow-2xl',
          isMinimized && isHovered && 'shadow-[0_0_35px_rgba(0,0,0,0.85)] border-r-amber-500/40 z-50',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div
          className={cn(
            'border-b border-[#161D2E] bg-[#0E1528] shrink-0 transition-all duration-200',
            isCompact ? 'p-2.5 flex flex-col items-center gap-2' : 'p-3.5 flex items-center justify-between min-h-[62px]'
          )}
        >
          {isCompact ? (
            /* Minimized Brand Header with Prominent Logo */
            <div className="w-full flex flex-col items-center gap-2">
              {/* Clickable Logo with glow */}
              <button
                onClick={onToggleMinimize}
                title="BudgetPilot (Click or hover to expand sidebar)"
                className="w-11 h-11 rounded-xl overflow-hidden shadow-lg shadow-amber-500/20 border border-amber-500/40 bg-gradient-to-br from-[#0c1426] via-[#080d19] to-black p-1 flex items-center justify-center hover:scale-105 hover:border-amber-400 transition-all cursor-pointer group"
              >
                <img
                  src="/logo-dark.png"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('logo.png')) target.src = '/logo.png';
                  }}
                  alt="BudgetPilot Logo"
                  className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(56,189,248,0.7)] group-hover:drop-shadow-[0_0_12px_rgba(56,189,248,1)] transition-all"
                />
              </button>

              {/* Expand Toggle Button */}
              <button
                onClick={onToggleMinimize}
                title="Expand Sidebar"
                className="w-8 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-700/60"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Full Expanded Brand Header (also shown when hovered!) */
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-blue-500/25 shrink-0 border border-cyan-500/50 bg-gradient-to-br from-[#0c1426] via-[#080d19] to-black p-1 flex items-center justify-center">
                  <img
                    src="/logo-dark.png"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (!target.src.includes('logo.png')) target.src = '/logo.png';
                    }}
                    alt="BudgetPilot Logo"
                    className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]"
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
                    title={isMinimized ? 'Pin Expanded' : 'Minimize Sidebar'}
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
              title={isCompact ? 'Home' : undefined}
              className={({ isActive }) =>
                cn(
                  'group flex items-center rounded-lg font-medium transition-all duration-150',
                  isCompact ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2',
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
                  {!isCompact && <span className="font-semibold truncate">Home</span>}
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

              return (
                <div key={group.id} className="relative rounded-lg">
                  {/* Group Header Button */}
                  <button
                    onClick={() => {
                      if (isCompact && onToggleMinimize) {
                        onToggleMinimize();
                        setOpenGroupId(group.id);
                      } else {
                        toggleGroup(group.id);
                      }
                    }}
                    title={isCompact ? group.label : undefined}
                    className={cn(
                      'w-full flex items-center rounded-lg font-semibold tracking-wider text-[11px] transition-all duration-150',
                      isCompact ? 'justify-center p-2.5' : 'justify-between px-3 py-2',
                      isOpenGroup && !isCompact
                        ? 'text-amber-400 bg-amber-500/10'
                        : hasActiveChild
                        ? 'text-amber-300 bg-slate-800/50'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                    )}
                  >
                    <div className={cn('flex items-center min-w-0', !isCompact && 'gap-2.5')}>
                      <group.icon
                        className={cn(
                          'w-4 h-4 shrink-0 transition-colors',
                          isOpenGroup || hasActiveChild ? 'text-amber-400' : 'text-slate-400'
                        )}
                      />
                      {!isCompact && <span className="truncate">{group.label}</span>}
                    </div>
                    {!isCompact && (
                      isOpenGroup ? (
                        <ChevronDown className="w-3.5 h-3.5 text-amber-400 transition-transform shrink-0 ml-1" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 transition-transform shrink-0 ml-1" />
                      )
                    )}
                  </button>

                  {/* Group Sub-Items (Single accordion active) */}
                  {!isCompact && isOpenGroup && (
                    <div className="pl-4 pr-1 py-1 space-y-0.5 border-l border-amber-500/30 ml-4 my-1 animate-in fade-in slide-in-from-top-1 duration-150">
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
                                  ? 'bg-amber-600 text-white shadow-sm'
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
              title={isCompact ? `Recycle Bin ${deletedCount ? `(${deletedCount})` : ''}` : undefined}
              className={({ isActive }) =>
                cn(
                  'group flex items-center rounded-lg font-medium transition-all duration-150 relative',
                  isCompact ? 'justify-center p-2.5' : 'justify-between px-3 py-2',
                  isActive
                    ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.35)]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className={cn('flex items-center min-w-0', !isCompact && 'gap-2.5')}>
                    <Trash2
                      className={cn(
                        'w-4 h-4 shrink-0 transition-colors',
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                      )}
                    />
                    {!isCompact && <span className="font-semibold truncate">Recycle Bin</span>}
                  </div>
                  {deletedCount !== undefined && deletedCount > 0 && (
                    <span
                      className={cn(
                        'text-[10px] rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30',
                        isCompact
                          ? 'absolute top-1 right-1 w-2 h-2 p-0 bg-amber-400 rounded-full'
                          : 'px-1.5 py-0.2 shrink-0'
                      )}
                    >
                      {!isCompact && deletedCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>

            <NavLink
              to="/settings"
              onClick={() => onClose()}
              title={isCompact ? 'Settings' : undefined}
              className={({ isActive }) =>
                cn(
                  'group flex items-center rounded-lg font-medium transition-all duration-150',
                  isCompact ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2',
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
                  {!isCompact && <span className="font-semibold truncate">Settings</span>}
                </>
              )}
            </NavLink>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-2.5 border-t border-[#161D2E] bg-[#0E121E] shrink-0">
          {isCompact ? (
            /* Minimized Profile Footer */
            <div className="flex flex-col items-center gap-2">
              <div
                title={user?.name || user?.email || 'User'}
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-md cursor-pointer hover:ring-2 hover:ring-amber-400 transition-all"
              >
                {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col items-center gap-1">
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
            /* Full Profile Footer (also shown on hover!) */
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-500 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
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

              {/* Logout Button */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={logout}
                  title="Log Out"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Mouse Drag Resize Handle (Only active when not in compact rail mode) */}
        {!isCompact && (
          <div
            onMouseDown={handleMouseDown}
            onDoubleClick={handleResetWidth}
            title="Drag to resize sidebar width | Double-click to reset (260px)"
            className={cn(
              'hidden md:flex absolute top-0 bottom-0 -right-1.5 w-3 cursor-col-resize z-50 items-center justify-center group touch-none select-none transition-colors',
              isDragging && 'bg-amber-600/20'
            )}
          >
            {/* Subtle vertical accent indicator */}
            <div
              className={cn(
                'w-0.5 h-full transition-colors duration-150',
                isDragging
                  ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                  : 'bg-transparent group-hover:bg-amber-500/40'
              )}
            />

            {/* Grab Dots Indicator in middle */}
            <div
              className={cn(
                'absolute top-1/2 -translate-y-1/2 flex items-center justify-center p-0.5 rounded-md transition-all duration-150',
                isDragging
                  ? 'bg-amber-600 text-white opacity-100 shadow-md scale-110'
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
