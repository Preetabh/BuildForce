import React, { useState } from 'react';
import {
  Search,
  Filter,
  Calendar,
  RotateCcw,
  ShieldAlert,
  ChevronDown,
  X,
} from 'lucide-react';
import { AuditAction, AuditQueryParams, AuditSeverity, AuditStatus } from '../../types/audit';

interface AuditFiltersBarProps {
  filters: AuditQueryParams;
  onFilterChange: (filters: AuditQueryParams) => void;
  onReset: () => void;
  availableUsers?: Array<{ id: string; name: string; email: string }>;
}

export const AuditFiltersBar: React.FC<AuditFiltersBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  availableUsers = [],
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [datePreset, setDatePreset] = useState<string>('all');

  const modulesList = [
    { value: '', label: 'All Modules' },
    { value: 'AUTH', label: 'Authentication & Access' },
    { value: 'PROJECTS', label: 'Projects & BOQ' },
    { value: 'VENDORS', label: 'Vendors & Suppliers' },
    { value: 'WORKERS', label: 'Workers & Labours' },
    { value: 'ROLES', label: 'RBAC Roles & Menus' },
    { value: 'USERS', label: 'User Accounts' },
    { value: 'LEADS', label: 'Leads & Inquiries' },
    { value: 'SERVICES', label: 'Service Catalog' },
    { value: 'SETTINGS', label: 'System Settings' },
  ];

  const actionsList: Array<{ value: AuditAction | ''; label: string }> = [
    { value: '', label: 'All Actions' },
    { value: 'CREATE', label: 'Create' },
    { value: 'UPDATE', label: 'Update' },
    { value: 'DELETE', label: 'Delete' },
    { value: 'LOGIN', label: 'Login' },
    { value: 'LOGOUT', label: 'Logout' },
    { value: 'STATUS_CHANGE', label: 'Status Change' },
    { value: 'ROLE_CHANGE', label: 'Role Change' },
    { value: 'PERMISSION_CHANGE', label: 'Permission Change' },
    { value: 'ASSIGNMENT', label: 'Assignment' },
    { value: 'RESTORE', label: 'Restore' },
    { value: 'ARCHIVE', label: 'Archive' },
  ];

  const severitiesList: Array<{ value: AuditSeverity | ''; label: string; color: string }> = [
    { value: '', label: 'All Severities', color: 'text-slate-400' },
    { value: 'INFO', label: 'Info', color: 'text-sky-400' },
    { value: 'WARN', label: 'Warning', color: 'text-amber-400' },
    { value: 'CRITICAL', label: 'Critical', color: 'text-rose-400' },
    { value: 'SECURITY', label: 'Security', color: 'text-purple-400' },
  ];

  const handleDatePreset = (preset: string) => {
    setDatePreset(preset);
    const now = new Date();
    let startDate: string | undefined = undefined;

    if (preset === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      startDate = start.toISOString();
    } else if (preset === '7d') {
      const start = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      startDate = start.toISOString();
    } else if (preset === '30d') {
      const start = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
      startDate = start.toISOString();
    }

    onFilterChange({
      ...filters,
      startDate,
      endDate: preset === 'all' ? undefined : new Date().toISOString(),
      page: 1,
    });
  };

  // Count active filters
  const activeFiltersCount = [
    filters.search,
    filters.modules && filters.modules.length > 0,
    filters.actions && filters.actions.length > 0,
    filters.severity,
    filters.status,
    filters.userId,
    filters.ip,
    filters.startDate,
  ].filter(Boolean).length;

  return (
    <div className="bg-[#0D1424] border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl backdrop-blur-xl">
      {/* Primary Row: Search Bar, Module Dropdown, Action Dropdown, Advanced Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1 group">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-400 transition-colors pointer-events-none" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value, page: 1 })}
            placeholder="Search audit trail by entity, actor, IP, summary..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-[#080D18] border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/60 transition-all shadow-inner"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, search: '', page: 1 })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Module Dropdown */}
        <div className="sm:w-44 shrink-0">
          <select
            value={filters.modules?.[0] || ''}
            onChange={(e) => {
              const val = e.target.value;
              onFilterChange({
                ...filters,
                modules: val ? [val] : undefined,
                page: 1,
              });
            }}
            className="w-full px-3 py-2 text-xs bg-[#080D18] border border-white/[0.08] rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/60 cursor-pointer"
          >
            {modulesList.map((m) => (
              <option key={m.value} value={m.value} className="bg-[#0D1424] text-slate-200">
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Action Dropdown */}
        <div className="sm:w-40 shrink-0">
          <select
            value={filters.actions?.[0] || ''}
            onChange={(e) => {
              const val = e.target.value as AuditAction;
              onFilterChange({
                ...filters,
                actions: val ? [val] : undefined,
                page: 1,
              });
            }}
            className="w-full px-3 py-2 text-xs bg-[#080D18] border border-white/[0.08] rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/60 cursor-pointer"
          >
            {actionsList.map((a) => (
              <option key={a.value} value={a.value} className="bg-[#0D1424] text-slate-200">
                {a.label}
              </option>
            ))}
          </select>
        </div>

        {/* Advanced Filters Button */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer shrink-0 ${
            showAdvanced || activeFiltersCount > 0
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              : 'bg-[#080D18] border-white/[0.08] text-slate-400 hover:text-white hover:bg-[#121B2F]'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              showAdvanced ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Clear / Reset Filter Button */}
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent transition-all cursor-pointer shrink-0"
            title="Reset all filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>

      {/* Advanced Filter Panel: Severity, Status, User, Date Presets, IP */}
      {showAdvanced && (
        <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-1 duration-150 text-xs">
          {/* 1. Severity Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Event Severity
            </label>
            <div className="flex items-center gap-1 flex-wrap">
              {severitiesList.map((sev) => {
                const isSelected =
                  sev.value === ''
                    ? !filters.severity
                    : filters.severity === sev.value ||
                      (Array.isArray(filters.severity) && filters.severity.includes(sev.value as any));

                return (
                  <button
                    key={sev.value}
                    type="button"
                    onClick={() => {
                      onFilterChange({
                        ...filters,
                        severity: sev.value ? (sev.value as any) : undefined,
                        page: 1,
                      });
                    }}
                    className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-[#090E1A] text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {sev.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Execution Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Execution Outcome
            </label>
            <div className="flex items-center gap-1">
              {[
                { value: '', label: 'All' },
                { value: 'SUCCESS', label: 'Success Only' },
                { value: 'FAILURE', label: 'Failed Only' },
              ].map((st) => {
                const isSelected = (filters.status || '') === st.value;
                return (
                  <button
                    key={st.value}
                    type="button"
                    onClick={() => {
                      onFilterChange({
                        ...filters,
                        status: st.value ? (st.value as AuditStatus) : undefined,
                        page: 1,
                      });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-[#090E1A] text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Date Presets */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Date Period
            </label>
            <div className="flex items-center gap-1 flex-wrap">
              {[
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: '7d', label: 'Last 7 Days' },
                { id: '30d', label: 'Last 30 Days' },
              ].map((dp) => (
                <button
                  key={dp.id}
                  type="button"
                  onClick={() => handleDatePreset(dp.id)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    datePreset === dp.id
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-[#090E1A] text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {dp.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. IP Address Search */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Client IP Address
            </label>
            <input
              type="text"
              value={filters.ip || ''}
              onChange={(e) => onFilterChange({ ...filters, ip: e.target.value, page: 1 })}
              placeholder="e.g. 103.21.244.18"
              className="w-full px-2.5 py-1 text-xs bg-[#090E1A] border border-slate-700/80 rounded-lg text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};
