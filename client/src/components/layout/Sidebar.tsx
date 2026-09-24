import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  CalendarRange,
  HardHat,
  LineChart,
  Receipt,
  BadgePercent,
  Boxes,
  Truck,
  Users,
  ShieldCheck,
  Trash2,
  HelpCircle,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Sparkles,
  BookOpen,
  Calculator,
  ClipboardCheck,
  FileSpreadsheet,
  Sun,
  Moon,
  Flame,
  X,
  Layers,
  Wrench,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  deletedCount?: number;
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

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, deletedCount }) => {
  const { user, company, logout } = useAuth();
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Group accordion state (default open for active section or planning)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    planning: true,
    execution: false,
    project_control: false,
    billing: false,
    sales: false,
    materials: false,
    machinery: false,
    manpower: false,
    hse: false,
  });

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const navGroups: NavGroup[] = [
    {
      id: 'planning',
      label: 'PLANNING',
      icon: CalendarRange,
      items: [
        { label: 'Schedule of Rates', path: '/sor', icon: BookOpen, isComingSoon: false },
        { label: 'Quantity Master', path: '/planning/quantity-master', icon: Calculator, isComingSoon: false },
        { label: 'QC Master', path: '/planning/qc-master', icon: ClipboardCheck, isComingSoon: true },
      ],
    },
    {
      id: 'execution',
      label: 'EXECUTION',
      icon: HardHat,
      items: [
        { label: 'Measurement Book', path: '/execution/measurement-book', icon: Layers, isComingSoon: true },
        { label: 'Daily Progress Report (DPR)', path: '/execution/dpr', icon: FileSpreadsheet, isComingSoon: true },
        { label: 'Site Inspection Checklist', path: '/execution/inspections', icon: ClipboardCheck, isComingSoon: true },
        { label: 'Subcontractor Work Log', path: '/execution/subcontractor-logs', icon: Wrench, isComingSoon: true },
      ],
    },
    {
      id: 'project_control',
      label: 'PROJECT CONTROL',
      icon: LineChart,
      items: [
        { label: 'Cost Control & EVM', path: '/project-control/evm', icon: TrendingUp, isComingSoon: true },
        { label: 'Budget & Variance Analysis', path: '/project-control/budget', icon: LineChart, isComingSoon: true },
        { label: 'S-Curve & Cash Flow', path: '/project-control/cashflow', icon: Sparkles, isComingSoon: true },
      ],
    },
    {
      id: 'billing',
      label: 'BILLING',
      icon: Receipt,
      items: [
        { label: 'Client RA Billing', path: '/billing/ra-bills', icon: Receipt, isComingSoon: true },
        { label: 'Subcontractor Invoices', path: '/billing/subcontractor-bills', icon: FileSpreadsheet, isComingSoon: true },
        { label: 'Price Escalation & GST', path: '/billing/escalation', icon: Calculator, isComingSoon: true },
      ],
    },
    {
      id: 'sales',
      label: 'SALES',
      icon: BadgePercent,
      items: [
        { label: 'Tender Estimation', path: '/sales/tenders', icon: BadgePercent, isComingSoon: true },
        { label: 'Client Quotations & Bids', path: '/sales/bids', icon: FileSpreadsheet, isComingSoon: true },
        { label: 'Work Orders', path: '/sales/work-orders', icon: ClipboardCheck, isComingSoon: true },
      ],
    },
    {
      id: 'materials',
      label: 'MATERIALS',
      icon: Boxes,
      items: [
        { label: 'Stock & Central Store', path: '/materials/inventory', icon: Boxes, isComingSoon: true },
        { label: 'Purchase Orders (PO)', path: '/materials/purchase-orders', icon: FileSpreadsheet, isComingSoon: true },
        { label: 'Requisitions (MRN)', path: '/materials/mrn', icon: Layers, isComingSoon: true },
        { label: 'Goods Receipt (GRN)', path: '/materials/grn', icon: ClipboardCheck, isComingSoon: true },
      ],
    },
    {
      id: 'machinery',
      label: 'MACHINERY & ASSETS',
      icon: Truck,
      items: [
        { label: 'Plant & Equipment Tracker', path: '/machinery/equipment', icon: Truck, isComingSoon: true },
        { label: 'Fuel & Log Sheets', path: '/machinery/fuel-log', icon: FileSpreadsheet, isComingSoon: true },
        { label: 'Maintenance Schedule', path: '/machinery/maintenance', icon: Wrench, isComingSoon: true },
      ],
    },
    {
      id: 'manpower',
      label: 'MANPOWER & HR',
      icon: Users,
      items: [
        { label: 'Muster Roll & Attendance', path: '/manpower/attendance', icon: Users, isComingSoon: true },
        { label: 'Labor Wage & Productivity', path: '/manpower/productivity', icon: TrendingUp, isComingSoon: true },
      ],
    },
    {
      id: 'hse',
      label: 'QUALITY & SAFETY (HSE)',
      icon: ShieldCheck,
      items: [
        { label: 'QC Checklists & NCRs', path: '/hse/qc', icon: ShieldCheck, isComingSoon: true },
        { label: 'Safety Audits & Logs', path: '/hse/safety', icon: ClipboardCheck, isComingSoon: true },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0A0D14] border-r border-[#161D2E] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 select-none shadow-2xl',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="p-3.5 border-b border-[#161D2E] flex items-center justify-between bg-gradient-to-r from-[#0E1322] to-[#0A0D14]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]">
              <Flame className="w-4.5 h-4.5 text-pink-200 fill-pink-300" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                <span>BudgetPilot</span>
              </h1>
              <p className="text-[9.5px] font-medium tracking-wide text-purple-400/90 uppercase">
                BY CIVIL GURUJI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 px-2.5 py-3 overflow-y-auto space-y-4 custom-scrollbar text-xs">
          {/* Home Direct Link */}
          <div>
            <NavLink
              to="/"
              end
              onClick={() => onClose()}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-all duration-150',
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
                      'w-4 h-4 transition-colors',
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                    )}
                  />
                  <span>Home</span>
                </>
              )}
            </NavLink>
          </div>

          {/* Collapsible Groups */}
          <div className="space-y-1">
            {navGroups.map((group) => {
              const isOpenGroup = openGroups[group.id] ?? false;
              const hasActiveChild = group.items.some((item) => location.pathname === item.path);

              return (
                <div key={group.id} className="rounded-lg overflow-hidden">
                  {/* Group Header Button */}
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg font-semibold tracking-wider text-[11px] transition-all duration-150',
                      hasActiveChild
                        ? 'text-blue-400 bg-blue-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <group.icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{group.label}</span>
                    </div>
                    {isOpenGroup ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 transition-transform" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 transition-transform" />
                    )}
                  </button>

                  {/* Group Sub-Items */}
                  {isOpenGroup && (
                    <div className="pl-6 pr-1 py-1 space-y-0.5 border-l border-slate-800/80 ml-4.5 my-1">
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
                                      'text-[9px] px-1 py-0.2 rounded font-medium shrink-0 ml-1',
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

          {/* System & Management */}
          <div className="pt-2 border-t border-slate-800/60 space-y-1">
            <NavLink
              to="/recycle-bin"
              onClick={() => onClose()}
              className={({ isActive }) =>
                cn(
                  'group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-2.5">
                    <Trash2
                      className={cn(
                        'w-4 h-4 transition-colors',
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                      )}
                    />
                    <span>Recycle Bin</span>
                  </div>
                  {deletedCount !== undefined && deletedCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                      {deletedCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>

            <NavLink
              to="/help"
              onClick={() => onClose()}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                )
              }
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>Help & Info</span>
            </NavLink>

            <NavLink
              to="/settings"
              onClick={() => onClose()}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                )
              }
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
            </NavLink>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-[#161D2E] bg-[#0E121E]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
                {user?.name?.charAt(0).toUpperCase() || 'P'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {user?.name || 'Pratyush...'}
                </p>
                <div className="flex items-center gap-1.5">
                  <p className="text-[10px] text-slate-400 truncate max-w-[80px]">
                    {user?.email || 'pratyushdix...'}
                  </p>
                  <span className="text-[9px] text-slate-500 font-mono shrink-0">
                    v1.0.342
                  </span>
                </div>
              </div>
            </div>

            {/* Theme Toggle & Logout */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                title="Toggle Theme"
                className="p-1.5 rounded-lg bg-slate-800/80 text-amber-300 hover:bg-slate-700 transition-colors"
              >
                {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
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
        </div>
      </aside>
    </>
  );
};
