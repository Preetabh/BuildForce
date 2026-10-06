import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  Download,
  Calendar,
  Layers,
  Activity,
  FileSpreadsheet,
  FileJson,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Laptop,
  Globe,
  SlidersHorizontal,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';
import { AuditLog, AuditQueryParams, AuditStats } from '../../types/audit';
import AuditService from '../../services/audit.service';
import { AuditActionBadge } from '../../components/audit/AuditActionBadge';
import { AuditSeverityBadge } from '../../components/audit/AuditSeverityBadge';
import { AuditFiltersBar } from '../../components/audit/AuditFiltersBar';
import { AuditAnalyticsPanel } from '../../components/audit/AuditAnalyticsPanel';
import { AuditTimelineView } from '../../components/audit/AuditTimelineView';
import { AuditLogDrawer } from '../../components/audit/AuditLogDrawer';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';

export const AuditLogsPage: React.FC = () => {
  const { user } = useAuth();
  const { roleDisplayName, isMasterAdmin } = usePermissions();

  const [activeTab, setActiveTab] = useState<'stream' | 'timeline' | 'analytics'>('stream');

  // Logs and query state
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Pagination & Filters
  const [filters, setFilters] = useState<AuditQueryParams>({
    page: 1,
    limit: 25,
    sortBy: 'timestamp',
    sortOrder: 'desc',
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
    hasMore: false,
  });

  // Fetch logs whenever filters change
  useEffect(() => {
    loadLogs();
  }, [
    filters.page,
    filters.limit,
    filters.search,
    filters.modules,
    filters.actions,
    filters.severity,
    filters.status,
    filters.userId,
    filters.ip,
    filters.startDate,
    filters.endDate,
    filters.sortBy,
    filters.sortOrder,
  ]);

  // Load stats once or when date changes
  useEffect(() => {
    loadStats();
  }, [filters.startDate, filters.endDate]);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const result = await AuditService.getLogs(filters);
      setLogs(result.logs);
      setPagination(result.pagination);
    } catch (err) {
      // Handled cleanly
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    setIsStatsLoading(true);
    try {
      const data = await AuditService.getStats({
        startDate: filters.startDate as string,
        endDate: filters.endDate as string,
      });
      setStats(data);
    } catch {
      // fallback
    } finally {
      setIsStatsLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 25,
      sortBy: 'timestamp',
      sortOrder: 'desc',
    });
  };

  const handleExport = async (format: 'csv' | 'json') => {
    setIsExporting(true);
    try {
      await AuditService.exportLogs(format, filters);
    } catch {
      alert(`Failed to export audit logs as ${format.toUpperCase()}. Please try again.`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Banner Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#121B30] via-[#0E1528] to-[#0A0E18] border border-slate-800 p-5 sm:p-6 shadow-xl overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(#F59E0B_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Security & Governance</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Immutable Trail Active</span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Enterprise Audit & Activity Logs</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Centralized, tamper-evident audit record tracking logins, role changes, data creations, modifications, and security operations with exact before/after diffs.
            </p>
          </div>

          {/* Action CTAs: Refresh, CSV, JSON */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => {
                loadLogs();
                loadStats();
              }}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all cursor-pointer disabled:opacity-50"
              title="Refresh logs stream"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 hover:border-slate-600 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => handleExport('json')}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 hover:border-slate-600 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              <FileJson className="w-3.5 h-3.5 text-amber-400" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Tab Controls Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('stream')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'stream'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Audit Stream (Table View)</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-mono">
              {pagination.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'timeline'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Visual Timeline</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Security & Velocity Insights</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <AuditFiltersBar
        filters={filters}
        onFilterChange={(newFilters) => setFilters(newFilters)}
        onReset={handleResetFilters}
      />

      {/* TAB 1: Enterprise Audit Stream (Data Table) */}
      {activeTab === 'stream' && (
        <div className="space-y-4">
          <div className="bg-[#10172A] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {/* Table Header / Counter info */}
            <div className="px-5 py-3 border-b border-slate-800 bg-[#0C1222] flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">
                Displaying {logs.length} of {pagination.total} recorded events
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">Rows per page:</span>
                <select
                  value={filters.limit}
                  onChange={(e) =>
                    setFilters({ ...filters, limit: Number(e.target.value), page: 1 })
                  }
                  className="px-2 py-1 text-xs bg-slate-900 border border-slate-700/80 rounded-lg text-slate-300 focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-[#0A0F1D] text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Actor / Profile</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Module</th>
                    <th className="py-3 px-4">Target Entity</th>
                    <th className="py-3 px-4">Changes</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Network & Client</th>
                    <th className="py-3 px-4 text-right">Inspect</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 animate-pulse">
                        Querying indexed audit records...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center space-y-2">
                        <Clock className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="text-sm font-semibold text-slate-300">
                          No audit entries match the current filter criteria
                        </p>
                        <p className="text-xs text-slate-500">
                          Clear search or reset filters to display records.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => {
                      const userName =
                        (typeof log.userId === 'object' && log.userId?.name) ||
                        log.userSnapshot?.name ||
                        'System';
                      const userRole =
                        (typeof log.userId === 'object' && log.userId?.role) ||
                        log.userSnapshot?.role ||
                        'USER';
                      const userInitial = userName.charAt(0).toUpperCase();

                      const diffCount = log.diff?.length || 0;

                      return (
                        <tr
                          key={log._id}
                          onClick={() => setSelectedLog(log)}
                          className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                        >
                          {/* 1. Timestamp */}
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                            <span className="block font-semibold">
                              {new Date(log.timestamp).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </span>
                          </td>

                          {/* 2. Actor / Profile */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                                {userInitial}
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-slate-200 block truncate group-hover:text-amber-300 transition-colors">
                                  {userName}
                                </span>
                                <span className="text-[10px] text-amber-400/90 font-mono uppercase">
                                  {userRole}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 3. Action Badge */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <AuditActionBadge action={log.action} size="sm" />
                          </td>

                          {/* 4. Module */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800/90 text-slate-300 border border-slate-700/60">
                              {log.module}
                            </span>
                          </td>

                          {/* 5. Target Entity & Summary */}
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="min-w-0">
                              <span className="font-bold text-slate-200 block truncate">
                                {log.entityName || `#${log.entityId}`}
                              </span>
                              <span className="text-[10px] text-slate-400 block truncate">
                                {log.summary || `${log.action} ${log.entity}`}
                              </span>
                            </div>
                          </td>

                          {/* 6. Changes Diff Chip */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {diffCount > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950/50 text-cyan-300 border border-cyan-800/60">
                                <span>{diffCount} changed</span>
                              </span>
                            ) : log.oldValue || log.newValue ? (
                              <span className="text-[10px] text-slate-500 italic">State saved</span>
                            ) : (
                              <span className="text-[10px] text-slate-600">—</span>
                            )}
                          </td>

                          {/* 7. Severity */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <AuditSeverityBadge severity={log.severity} size="sm" />
                          </td>

                          {/* 8. IP & Client */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-slate-400">
                            <div className="font-mono text-slate-300 flex items-center gap-1">
                              <Globe className="w-3 h-3 text-sky-400" />
                              <span>{log.ipAddress || '127.0.0.1'}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 block truncate max-w-[120px]">
                              {log.device?.browser || 'Browser'}
                            </span>
                          </td>

                          {/* 9. Inspect CTA */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLog(log);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-700/80 hover:border-amber-500/50 inline-flex items-center gap-1 transition-all"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            {pagination.totalPages > 1 && (
              <div className="px-5 py-3.5 border-t border-slate-800 bg-[#0C1222] flex items-center justify-between gap-4 text-xs">
                <span className="text-slate-400">
                  Page <strong className="text-white">{pagination.page}</strong> of{' '}
                  <strong className="text-white">{pagination.totalPages}</strong> (
                  {pagination.total} events)
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setFilters({ ...filters, page: 1 })}
                    disabled={pagination.page <= 1}
                    className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
                    title="First Page"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                    disabled={pagination.page <= 1}
                    className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="px-3 py-1 font-mono font-bold text-amber-400 bg-slate-900 rounded-lg border border-slate-800">
                    {pagination.page}
                  </span>

                  <button
                    type="button"
                    onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
                    disabled={pagination.page >= pagination.totalPages}
                    className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilters({ ...filters, page: pagination.totalPages })}
                    disabled={pagination.page >= pagination.totalPages}
                    className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
                    title="Last Page"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Visual Chronological Timeline */}
      {activeTab === 'timeline' && (
        <AuditTimelineView
          logs={logs}
          onSelectLog={(log) => setSelectedLog(log)}
          isLoading={isLoading}
        />
      )}

      {/* TAB 3: Security & Velocity Analytics */}
      {activeTab === 'analytics' && (
        <AuditAnalyticsPanel stats={stats} isLoading={isStatsLoading} />
      )}

      {/* Deep Inspection Drawer */}
      <AuditLogDrawer
        log={selectedLog}
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        onSelectRelated={async (logId) => {
          const detail = await AuditService.getLogById(logId);
          if (detail?.log) setSelectedLog(detail.log);
        }}
      />
    </div>
  );
};
