import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  UserPlus,
  Contact,
  Coins,
  Users,
  Briefcase,
  Box,
  ListChecks,
  ShieldCheck,
  UserCheck,
  Compass,
  User as UserIcon,
  Eye,
  Lock,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { rbacService } from '../../services/rbac.service';
import { useAuth } from '../../context/AuthContext';
import { useImpersonation } from '../../context/ImpersonationContext';
import { cn } from '../../utils/cn';
import { usePermissions } from '../../hooks/usePermissions';

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
  permissionKey?: string;
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
  const { viewingUser, startViewing, stopViewing, isViewing } = useImpersonation();
  const { isModuleAllowed, canAccess, roleDisplayName, isMasterAdmin } = usePermissions();
  const location = useLocation();
  const navigate = useNavigate();

  const { data: teamUsers = [] } = useQuery({
    queryKey: ['rbacUsers'],
    queryFn: rbacService.getUsers,
  });

  // Resize drag state
  const [isDragging, setIsDragging] = useState(false);

  // Hover expansion state when sidebar is minimized ("after hover expand navbar")
  const [isHovered, setIsHovered] = useState(false);

  // Group accordion state (only ONE section open at a time: "jab ek section open ho dusra close")
  const [openGroupId, setOpenGroupId] = useState<string | null>('plannings');

  // Dedicated Settings Accordion state
  const [isSettingsOpen, setIsSettingsOpen] = useState(() => {
    return (
      location.pathname.startsWith('/settings') ||
      location.pathname.startsWith('/RBAC') ||
      location.pathname.startsWith('/Admin/ManageMenus') ||
      location.pathname.startsWith('/Admin/ManageRoles') ||
      location.pathname.startsWith('/Admin/RoleVsUser') ||
      location.pathname.startsWith('/Admin/Users')
    );
  });

  // The sidebar is visually compact ONLY if it is minimized AND not currently hovered
  const isCompact = isMinimized && !isHovered;

  const toggleGroup = (groupId: string) => {
    // When clicking the currently open group, toggle it closed; otherwise open it and close any other
    setOpenGroupId((prev) => (prev === groupId ? null : groupId));
  };

  // Master Navigation Groups list with permission mapping
  const allNavGroups: NavGroup[] = [
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
      icon: Users,
      items: [
        { label: 'Leads', path: '/leads', icon: UserPlus, isComingSoon: false, permissionKey: 'Admin/Enquiry' },
        { label: 'Client', path: '/leads/clients', icon: Contact, isComingSoon: false, permissionKey: 'Admin/Clients' },
        { label: 'Payment', path: '/leads/payments', icon: CreditCard, isComingSoon: false, permissionKey: 'Admin/PaymentHistory' },
        { label: 'Pay Amount', path: '/leads/pay-amount', icon: Coins, isComingSoon: false, permissionKey: 'Admin/CollectPayment' },
        { label: 'Reference Partners', path: '/leads/partners', icon: Handshake, isComingSoon: false, permissionKey: 'Admin/ReferencePartners' },
        { label: 'Commission Report', path: '/leads/commission-reports', icon: FileSpreadsheet, isComingSoon: false, permissionKey: 'Admin/CommissionReport' },
      ],
    },
    {
      id: 'service_catalog',
      label: 'SERVICE',
      icon: Briefcase,
      items: [
        { label: 'Services', path: '/services', icon: Layers, isComingSoon: false, permissionKey: 'Admin/ManageServices' },
        { label: 'Module', path: '/services/modules', icon: Box, isComingSoon: true, permissionKey: 'Admin/Modules' },
      ],
    },
    {
      id: 'all_teams',
      label: 'All Teams',
      icon: CreditCard,
      items: [],
    },
    {
      id: 'site_enginner',
      label: 'Site Enginner',
      icon: HardHat,
      items: [
        { label: 'Detailed Site Engineers', path: '/admin/site-engineers', icon: Users, isComingSoon: false },
        { label: 'AddSiteEnginner', path: '/admin/add-site-engineer', icon: Compass, isComingSoon: false, permissionKey: 'Admin/ManageSiteEngineers' },
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

  // Dynamically filter allowed navigation groups and items based on role permissions
  const navGroups = allNavGroups
    .filter((group) => isModuleAllowed(group.id))
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.permissionKey) return true;
        return canAccess(item.permissionKey);
      }),
    }));

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
                title="InfraPilot (Click or hover to expand sidebar)"
                className="w-11 h-11 rounded-xl overflow-hidden shadow-lg shadow-amber-500/25 border border-amber-500/40 bg-gradient-to-br from-[#161F30] via-[#0E1528] to-black p-1 flex items-center justify-center hover:scale-105 hover:border-amber-400 transition-all cursor-pointer group"
              >
                <img
                  src="/logo-dark.png"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('logo.png')) target.src = '/logo.png';
                  }}
                  alt="InfraPilot Logo"
                  className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(245,158,11,0.7)] group-hover:drop-shadow-[0_0_12px_rgba(245,158,11,1)] transition-all"
                />
              </button>

              {/* Expand Toggle Button */}
              <button
                onClick={onToggleMinimize}
                title="Expand Sidebar"
                className="w-8 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-amber-300 hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-700/60"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Full Expanded Brand Header (also shown when hovered!) */
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-amber-500/25 shrink-0 border border-amber-500/40 bg-gradient-to-br from-[#161F30] via-[#0E1528] to-black p-1 flex items-center justify-center">
                  <img
                    src="/logo-dark.png"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (!target.src.includes('logo.png')) target.src = '/logo.png';
                    }}
                    alt="InfraPilot Logo"
                    className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(245,158,11,0.7)]"
                  />
                </div>
                <div className="min-w-0">
                  <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5 font-mono truncate">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-amber-300">
                      InfraPilot
                    </span>
                  </h1>
                  <p className="text-[10px] font-medium tracking-wider uppercase text-amber-400/90 truncate">
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
                    ? 'bg-[#F59E0B] text-slate-950 font-bold shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Home
                    className={cn(
                      'w-4 h-4 shrink-0 transition-colors',
                      isActive ? 'text-slate-950 font-bold' : 'text-slate-400 group-hover:text-white'
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
              const hasActiveChild =
                group.id === 'all_teams'
                  ? isViewing
                  : group.items.some(
                      (item) =>
                        location.pathname === item.path ||
                        (item.path !== '/' && location.pathname.startsWith(item.path))
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
                      group.id === 'all_teams' && isViewing
                        ? 'bg-[#F59E0B] text-slate-950 font-bold shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                        : isOpenGroup && !isCompact
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
                          group.id === 'all_teams' && isViewing
                            ? 'text-slate-950'
                            : isOpenGroup || hasActiveChild
                            ? 'text-amber-400'
                            : 'text-slate-400'
                        )}
                      />
                      {!isCompact && <span className="truncate">{group.label}</span>}
                    </div>
                    {!isCompact && (
                      isOpenGroup ? (
                        <ChevronDown
                          className={cn(
                            'w-3.5 h-3.5 transition-transform shrink-0 ml-1',
                            group.id === 'all_teams' && isViewing ? 'text-slate-950' : 'text-amber-400'
                          )}
                        />
                      ) : (
                        <ChevronRight
                          className={cn(
                            'w-3.5 h-3.5 transition-transform shrink-0 ml-1',
                            group.id === 'all_teams' && isViewing ? 'text-slate-950' : 'text-slate-500'
                          )}
                        />
                      )
                    )}
                  </button>

                  {/* Group Sub-Items (Single accordion active) */}
                  {!isCompact && isOpenGroup && (
                    <div className="pl-4 pr-1 py-1 space-y-0.5 border-l border-amber-500/30 ml-4 my-1 animate-in fade-in slide-in-from-top-1 duration-150">
                      {group.id === 'all_teams' ? (
                        /* Dynamic All Teams */
                        <div className="space-y-1">
                          {teamUsers.length === 0 ? (
                            <div className="py-2.5 px-2 text-center space-y-1.5 bg-[#0A0E18] rounded-lg border border-slate-800/80">
                              <p className="text-[11px] text-slate-400">No team members yet</p>
                              <NavLink
                                to="/settings/users"
                                onClick={() => onClose()}
                                className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-amber-400 hover:text-amber-300"
                              >
                                <UserPlus className="w-3 h-3" />
                                <span>+ Add in Users</span>
                              </NavLink>
                            </div>
                          ) : (
                            <>
                              {teamUsers.map((member) => {
                                const isSelected =
                                  viewingUser?.email?.toLowerCase() === member.email?.toLowerCase() ||
                                  viewingUser?.id === member._id;
                                const isCurrentUser =
                                  user?.email?.toLowerCase() === member.email?.toLowerCase();

                                return (
                                  <button
                                    key={member._id}
                                    type="button"
                                    onClick={() => {
                                      onClose();
                                      startViewing({
                                        id: member._id,
                                        name: member.name,
                                        email: member.email,
                                        role: member.role,
                                        mobile: member.mobile,
                                      });
                                      navigate(`/leads?userId=${member._id}&userName=${encodeURIComponent(member.name)}`);
                                    }}
                                    className={cn(
                                      'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11.5px] font-medium transition-all duration-150 cursor-pointer',
                                      isSelected
                                        ? 'bg-[#1E190D] text-amber-300 font-bold border border-amber-500/40 shadow-sm'
                                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                                    )}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <UserIcon
                                        className={cn(
                                          'w-3.5 h-3.5 shrink-0',
                                          isSelected ? 'text-amber-400' : 'text-slate-400'
                                        )}
                                      />
                                      <span className="truncate">{member.name}</span>
                                      {isCurrentUser && (
                                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 shrink-0 font-normal">
                                          You
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[9px] font-mono uppercase px-1 py-0.5 rounded bg-amber-500/10 text-amber-400/90 shrink-0 ml-1">
                                      {member.role === 'SITE_ENGINEER' ? 'SE' : member.role}
                                    </span>
                                  </button>
                                );
                              })}

                              {isViewing && (
                                <button
                                  type="button"
                                  onClick={() => stopViewing()}
                                  className="w-full mt-1.5 flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                  <span>Stop Viewing</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      ) : (
                        /* Standard Sub-items */
                        group.items.map((subItem) => {
                          const SubIcon = subItem.icon || FileSpreadsheet;
                          return (
                            <NavLink
                              key={subItem.path}
                              to={subItem.path}
                              end
                              onClick={() => onClose()}
                              className={({ isActive }) =>
                                cn(
                                  'group flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11.5px] font-medium transition-all duration-150',
                                  isActive
                                    ? 'bg-[#F59E0B] text-slate-950 font-bold shadow-sm'
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
                                        isActive
                                          ? 'text-slate-950'
                                          : subItem.label.includes('AddSiteEnginner')
                                          ? 'text-blue-400'
                                          : 'text-slate-400 group-hover:text-slate-200'
                                      )}
                                    />
                                    <span className="truncate">{subItem.label}</span>
                                  </div>
                                  {subItem.isComingSoon && (
                                    <span
                                      className={cn(
                                        'text-[9px] px-1 py-0.2 rounded font-medium shrink-0 ml-1.5',
                                        isActive
                                          ? 'bg-amber-900/60 text-amber-200 border border-amber-600/50'
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
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Recycle Bin & Settings Section */}
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
                    ? 'bg-[#F59E0B] text-slate-950 font-bold shadow-[0_0_15px_rgba(245,158,11,0.4)]'
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
                        isActive ? 'text-slate-950 font-bold' : 'text-slate-400 group-hover:text-white'
                      )}
                    />
                    {!isCompact && <span className="font-semibold truncate">Recycle Bin</span>}
                  </div>
                  {deletedCount !== undefined && deletedCount > 0 && (
                    <span
                      className={cn(
                        'text-[10px] rounded-full font-semibold',
                        isActive
                          ? 'bg-slate-950 text-[#F59E0B]'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
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

            {/* Expandable Settings Accordion matching Screenshot 4 */}
            {isModuleAllowed('settings') && (
              <div className="relative rounded-lg">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen((prev) => !prev)}
                  title={isCompact ? 'Settings' : undefined}
                  className={cn(
                    'w-full flex items-center rounded-lg font-semibold tracking-wider text-[11px] transition-all duration-150',
                    isCompact ? 'justify-center p-2.5' : 'justify-between px-3 py-2',
                    isSettingsOpen && !isCompact
                      ? 'text-amber-400 bg-amber-500/10'
                      : location.pathname.startsWith('/settings') ||
                        location.pathname.startsWith('/RBAC') ||
                        location.pathname.startsWith('/Admin/Manage')
                      ? 'text-amber-300 bg-slate-800/50'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                  )}
                >
                  <div className={cn('flex items-center min-w-0', !isCompact && 'gap-2.5')}>
                    <Settings
                      className={cn(
                        'w-4 h-4 shrink-0 transition-colors',
                        isSettingsOpen ? 'text-amber-400' : 'text-slate-400'
                      )}
                    />
                    {!isCompact && <span className="truncate">Settings</span>}
                  </div>
                  {!isCompact && (
                    isSettingsOpen ? (
                      <ChevronDown className="w-3.5 h-3.5 text-amber-400 transition-transform shrink-0 ml-1" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 transition-transform shrink-0 ml-1" />
                    )
                  )}
                </button>

                {/* Settings Sub-Items */}
                {!isCompact && isSettingsOpen && (
                  <div className="pl-4 pr-1 py-1 space-y-0.5 border-l border-amber-500/30 ml-4 my-1 animate-in fade-in slide-in-from-top-1 duration-150">
                    {canAccess('RBAC/ManageMenus') && (
                      <NavLink
                        to="/settings/manage-menus"
                        onClick={() => onClose()}
                        className={({ isActive }) =>
                          cn(
                            'group flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11.5px] font-medium transition-all duration-150',
                            isActive
                              ? 'bg-[#F59E0B] text-slate-950 font-bold shadow-sm'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                          )
                        }
                      >
                        {({ isActive }) => (
                          <div className="flex items-center gap-2 min-w-0">
                            <ListChecks
                              className={cn(
                                'w-3.5 h-3.5 shrink-0 transition-colors',
                                isActive ? 'text-slate-950' : 'text-blue-400'
                              )}
                            />
                            <span className="truncate">Manage Menus</span>
                          </div>
                        )}
                      </NavLink>
                    )}

                    {canAccess('RBAC/ManageRoles') && (
                      <NavLink
                        to="/settings/manage-roles"
                        onClick={() => onClose()}
                        className={({ isActive }) =>
                          cn(
                            'group flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11.5px] font-medium transition-all duration-150',
                            isActive
                              ? 'bg-[#F59E0B] text-slate-950 font-bold shadow-sm'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                          )
                        }
                      >
                        {({ isActive }) => (
                          <div className="flex items-center gap-2 min-w-0">
                            <ShieldCheck
                              className={cn(
                                'w-3.5 h-3.5 shrink-0 transition-colors',
                                isActive ? 'text-slate-950' : 'text-blue-400'
                              )}
                            />
                            <span className="truncate">Manage Roles</span>
                          </div>
                        )}
                      </NavLink>
                    )}

                    {canAccess('RBAC/UserOverrides') && (
                      <NavLink
                        to="/settings/role-vs-user"
                        onClick={() => onClose()}
                        className={({ isActive }) =>
                          cn(
                            'group flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11.5px] font-medium transition-all duration-150',
                            isActive
                              ? 'bg-[#F59E0B] text-slate-950 font-bold shadow-sm'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                          )
                        }
                      >
                        {({ isActive }) => (
                          <div className="flex items-center gap-2 min-w-0">
                            <UserCheck
                              className={cn(
                                'w-3.5 h-3.5 shrink-0 transition-colors',
                                isActive ? 'text-slate-950' : 'text-blue-400'
                              )}
                            />
                            <span className="truncate">Role Vs User</span>
                          </div>
                        )}
                      </NavLink>
                    )}

                    {canAccess('Home/ManageEmployees') && (
                      <NavLink
                        to="/settings/users"
                        onClick={() => onClose()}
                        className={({ isActive }) =>
                          cn(
                            'group flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11.5px] font-medium transition-all duration-150',
                            isActive
                              ? 'bg-[#F59E0B] text-slate-950 font-bold shadow-sm'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                          )
                        }
                      >
                        {({ isActive }) => (
                          <div className="flex items-center gap-2 min-w-0">
                            <Users
                              className={cn(
                                'w-3.5 h-3.5 shrink-0 transition-colors',
                                isActive ? 'text-slate-950' : 'text-blue-400'
                              )}
                            />
                            <span className="truncate">User</span>
                          </div>
                        )}
                      </NavLink>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-2.5 border-t border-[#161D2E] bg-[#0E121E] shrink-0">
          {isCompact ? (
            /* Minimized Profile Footer */
            <div className="flex flex-col items-center gap-2">
              <div
                title={`${user?.name || 'User'} (${roleDisplayName})`}
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
                  <p className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1.5">
                    <span>{user?.name || (user?.email ? user.email.split('@')[0] : 'User')}</span>
                    {isViewing && viewingUser && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold shrink-0" title={`Filtering data for ${viewingUser.name}`}>
                        Data Filtered
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[10px] text-amber-400/90 font-medium truncate max-w-[110px]">
                      {roleDisplayName}
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
