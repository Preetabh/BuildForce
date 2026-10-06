import React, { useState, useEffect } from 'react';
import { History, Clock, RefreshCw, Eye, AlertCircle, Laptop, Globe } from 'lucide-react';
import { AuditLog } from '../../types/audit';
import AuditService from '../../services/audit.service';
import { AuditActionBadge } from './AuditActionBadge';
import { AuditSeverityBadge } from './AuditSeverityBadge';
import { AuditDiffViewer } from './AuditDiffViewer';
import { AuditLogDrawer } from './AuditLogDrawer';

interface UserActivityTabProps {
  userId?: string;
  userName?: string;
}

export const UserActivityTab: React.FC<UserActivityTabProps> = ({
  userId = 'me',
  userName,
}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [filterAction, setFilterAction] = useState<string>('all');

  useEffect(() => {
    loadUserLogs();
  }, [userId]);

  const loadUserLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await AuditService.getUserLogs(userId, 50);
      setLogs(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to retrieve profile audit history.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filterAction === 'all') return true;
    return log.action === filterAction;
  });

  return (
    <div className="space-y-4">
      {/* Header bar with Refresh and Quick Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#10172A] border border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Profile Activity History & Audit Trail
            </h3>
            <p className="text-[11px] text-slate-400">
              Immutable session operations and state alterations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Action Filter */}
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-[#090E1A] border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            <option value="all">All Operations</option>
            <option value="LOGIN">Logins Only</option>
            <option value="UPDATE">Updates Only</option>
            <option value="CREATE">Creations Only</option>
            <option value="ROLE_CHANGE">Role Changes</option>
            <option value="PERMISSION_CHANGE">Security Changes</option>
          </select>

          <button
            type="button"
            onClick={loadUserLogs}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-white bg-[#090E1A] border border-slate-700/80 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
            title="Refresh logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Logs Stream */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400 bg-[#10172A] border border-slate-800 rounded-2xl animate-pulse">
          Loading user activity history records...
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900/50 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-10 text-center bg-[#10172A] border border-slate-800 rounded-2xl space-y-2">
          <Clock className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs font-semibold text-slate-300">No activity records match this filter</p>
          <p className="text-[11px] text-slate-500">
            System logins and profile operations will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const hasDiff =
              (log.diff && log.diff.length > 0) ||
              Boolean(log.oldValue || log.newValue);

            return (
              <div
                key={log._id}
                className="p-4 rounded-2xl bg-[#10172A] border border-slate-800 hover:border-slate-700/80 transition-all space-y-3 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <AuditActionBadge action={log.action} size="sm" />
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60">
                      {log.module}
                    </span>
                    <AuditSeverityBadge severity={log.severity} size="sm" />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString('en-IN', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedLog(log)}
                      className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-700/80 flex items-center gap-1 transition-all"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspect</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white">
                    {log.summary || `${log.action} on ${log.entity}`}
                  </h4>
                  {log.entityName && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Target Entity: <strong className="text-slate-300">{log.entityName}</strong> ({log.entity})
                    </p>
                  )}
                </div>

                {/* Device & Network Footer */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3 text-sky-400" />
                    <span className="font-mono">{log.ipAddress || '127.0.0.1'}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Laptop className="w-3 h-3 text-emerald-400" />
                    <span>{log.device?.browser || 'Browser'} on {log.device?.os || 'System'}</span>
                  </span>
                </div>

                {hasDiff && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <AuditDiffViewer
                      diff={log.diff}
                      oldValue={log.oldValue}
                      newValue={log.newValue}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Inspector Drawer */}
      <AuditLogDrawer
        log={selectedLog}
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
};
