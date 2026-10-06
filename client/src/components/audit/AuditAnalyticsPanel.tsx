import React from 'react';
import {
  Activity,
  ShieldAlert,
  Users,
  CheckCircle2,
  TrendingUp,
  Layers,
  Calendar,
} from 'lucide-react';
import { AuditStats } from '../../types/audit';

interface AuditAnalyticsPanelProps {
  stats: AuditStats | null;
  isLoading?: boolean;
}

export const AuditAnalyticsPanel: React.FC<AuditAnalyticsPanelProps> = ({
  stats,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="p-8 text-center bg-[#10172A] border border-slate-800 rounded-2xl animate-pulse text-xs text-slate-400">
        Aggregating enterprise security & audit metrics...
      </div>
    );
  }

  if (!stats) return null;

  const total = stats.totalCount || 1;
  const successRate = Math.round(((stats.successCount || 0) / total) * 100);

  return (
    <div className="space-y-4">
      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Events */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121B30] to-[#0D1322] border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Audit Events
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2 font-mono">
            {stats.totalCount.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Immutable records across all modules</p>
        </div>

        {/* Security / Critical Alarms */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1F1424] to-[#0D1322] border border-purple-900/40 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider">
              Security / Alarms
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-300 mt-2 font-mono">
            {(stats.securityCount + stats.criticalCount).toLocaleString()}
          </p>
          <p className="text-[10px] text-purple-400/70 mt-1">
            {stats.securityCount} Security • {stats.criticalCount} Critical
          </p>
        </div>

        {/* Active Operators */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#101D2D] to-[#0D1322] border border-sky-900/40 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-sky-300 uppercase tracking-wider">
              Active Users
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-sky-300 mt-2 font-mono">
            {(stats.topUsers?.length || 0).toLocaleString()}
          </p>
          <p className="text-[10px] text-sky-400/70 mt-1">Unique actors in recent window</p>
        </div>

        {/* Success Rate */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0F221D] to-[#0D1322] border border-emerald-900/40 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">
              Execution Health
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-300 mt-2 font-mono">
            {successRate}%
          </p>
          <p className="text-[10px] text-emerald-400/70 mt-1">
            {stats.failureCount} failed operations logged
          </p>
        </div>
      </div>

      {/* Middle Row: Module Distribution & Action Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Module Distribution Bar Cards */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0D1424] border border-white/[0.08] space-y-3.5 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Activity by Module</span>
            </h3>
            <span className="text-[11px] text-slate-400">Top operational sections</span>
          </div>

          <div className="space-y-2.5">
            {stats.byModule?.map((mod) => {
              const pct = Math.round((mod.count / total) * 100) || 1;
              return (
                <div key={mod.module} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">{mod.module}</span>
                    <span className="font-mono text-amber-400">
                      {mod.count} <span className="text-slate-500">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Type Breakdown */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0D1424] border border-white/[0.08] space-y-3.5 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Activity by Action Category</span>
            </h3>
            <span className="text-[11px] text-slate-400">Distribution of operations</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {stats.byAction?.map((act) => (
              <div
                key={act.action}
                className="p-2.5 rounded-xl bg-[#080D18] border border-white/[0.08] flex flex-col justify-between shadow-inner"
              >
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                  {act.action.replace('_', ' ')}
                </span>
                <span className="text-lg font-black text-white mt-1 font-mono">
                  {act.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Daily Activity Volume Visualization */}
      {stats.timeline && stats.timeline.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0D1424] border border-white/[0.08] space-y-3.5 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-400" />
              <span>Daily Event Velocity Timeline</span>
            </h3>
            <span className="text-[11px] text-slate-400">Past activity volume</span>
          </div>

          {/* Simple visual bar chart */}
          <div className="flex items-end gap-2 h-32 pt-4 px-2 overflow-x-auto">
            {stats.timeline.map((item) => {
              const maxCount = Math.max(...stats.timeline.map((t) => t.count), 1);
              const heightPct = Math.max(15, Math.round((item.count / maxCount) * 100));
              const hasCritical = item.critical > 0;

              return (
                <div
                  key={item.date}
                  className="flex-1 min-w-[28px] max-w-[48px] flex flex-col items-center gap-1 group relative cursor-pointer"
                >
                  {/* Tooltip on Hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-1 px-2 rounded-lg border border-slate-700 whitespace-nowrap shadow-lg z-20 pointer-events-none">
                    <p className="font-bold">{item.date}</p>
                    <p className="text-amber-400">{item.count} events ({item.critical} alerts)</p>
                  </div>

                  <div className="w-full flex-1 flex items-end">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-lg transition-all group-hover:brightness-125 ${
                        hasCritical
                          ? 'bg-gradient-to-t from-purple-600 to-rose-400'
                          : 'bg-gradient-to-t from-amber-600 to-yellow-400'
                      }`}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 truncate w-full text-center">
                    {item.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
