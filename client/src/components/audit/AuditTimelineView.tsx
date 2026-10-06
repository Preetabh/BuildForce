import React from 'react';
import { Clock, Eye, Layers } from 'lucide-react';
import { AuditLog } from '../../types/audit';
import { AuditSeverityBadge } from './AuditSeverityBadge';
import { AuditActionBadge } from './AuditActionBadge';

interface AuditTimelineViewProps {
  logs: AuditLog[];
  onSelectLog: (log: AuditLog) => void;
  isLoading?: boolean;
}

export const AuditTimelineView: React.FC<AuditTimelineViewProps> = ({
  logs,
  onSelectLog,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400 bg-[#10172A] border border-slate-800 rounded-2xl animate-pulse">
        Loading activity stream timeline...
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="p-12 text-center bg-[#10172A] border border-slate-800 rounded-2xl space-y-2">
        <Clock className="w-8 h-8 text-slate-600 mx-auto" />
        <p className="text-sm font-semibold text-slate-300">No events found in this timeframe</p>
        <p className="text-xs text-slate-500">Try adjusting your filters or date selection.</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
      {logs.map((log) => {
        const userName =
          (typeof log.userId === 'object' && log.userId?.name) ||
          log.userSnapshot?.name ||
          'System';
        const userRole =
          (typeof log.userId === 'object' && log.userId?.role) ||
          log.userSnapshot?.role ||
          'USER';
        const userInitial = userName.charAt(0).toUpperCase();

        const diffFields = log.diff?.map((d) => d.field) || [];

        return (
          <div key={log._id} className="relative group">
            {/* Timeline Dot Indicator */}
            <div className="absolute -left-6 sm:-left-8 top-3.5 w-6 h-6 rounded-full bg-[#0B101D] border-2 border-amber-500/60 flex items-center justify-center shadow-md ring-4 ring-[#0B101D] group-hover:border-amber-400 group-hover:scale-110 transition-all">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            </div>

            {/* Event Card */}
            <div className="p-4 rounded-2xl bg-[#10172A] border border-slate-800 hover:border-slate-700/80 transition-all shadow-sm space-y-3 group-hover:shadow-lg group-hover:shadow-black/40">
              {/* Top Header of the event */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <AuditActionBadge action={log.action} size="sm" />
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700/60">
                    {log.module}
                  </span>
                  <AuditSeverityBadge severity={log.severity} size="sm" />
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-mono text-[11px] text-slate-400">
                    {new Date(log.timestamp).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
              </div>

              {/* Event Summary / Description */}
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                  {log.summary || `${log.action} on ${log.entity}`}
                </h4>
                {log.entityName && (
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    <span>Target: <strong className="text-slate-300">{log.entityName}</strong></span>
                    <span className="text-[10px] text-slate-500 font-mono">[{log.entity}]</span>
                  </p>
                )}
              </div>

              {/* Diff Fields Tags if any */}
              {diffFields.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] font-semibold text-slate-400">Modified:</span>
                  {diffFields.slice(0, 4).map((f) => (
                    <span
                      key={f}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/40 text-cyan-300 border border-cyan-800/50"
                    >
                      {f}
                    </span>
                  ))}
                  {diffFields.length > 4 && (
                    <span className="text-[10px] text-slate-500">
                      +{diffFields.length - 4} more
                    </span>
                  )}
                </div>
              )}

              {/* Footer: User Identity + Inspect Button */}
              <div className="pt-2.5 border-t border-slate-800/70 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0">
                    {userInitial}
                  </div>
                  <div className="min-w-0 text-xs">
                    <span className="font-semibold text-slate-300 truncate block">
                      {userName}
                    </span>
                  </div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700">
                    {userRole}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectLog(log)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-700/80 hover:border-amber-500/50 flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
