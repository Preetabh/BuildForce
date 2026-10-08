import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, History, Clock, RefreshCw, AlertCircle, Eye } from 'lucide-react';
import { AuditLog } from '../../types/audit';
import AuditService from '../../services/audit.service';
import { AuditActionBadge } from './AuditActionBadge';
import { AuditSeverityBadge } from './AuditSeverityBadge';
import { AuditDiffViewer } from './AuditDiffViewer';
import { AuditLogDrawer } from './AuditLogDrawer';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface EntityAuditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: string;
  entityId: string;
  entityTitle?: string;
}

export const EntityAuditHistoryModal: React.FC<EntityAuditHistoryModalProps> = ({
  isOpen,
  onClose,
  entity,
  entityId,
  entityTitle,
}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEscapeKey(onClose, isOpen && !selectedLog);
  useEscapeKey(() => setSelectedLog(null), !!selectedLog);

  useEffect(() => {
    if (isOpen && entity && entityId) {
      loadLogs();
    }
  }, [isOpen, entity, entityId]);

  const loadLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await AuditService.getEntityLogs(entity, entityId, 100);
      setLogs(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load entity audit trail.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99990] flex justify-end animate-in fade-in duration-200">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl sm:max-w-2xl bg-[#0B101D] text-slate-100 shadow-2xl border-l border-slate-800 flex flex-col h-full z-10 overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0E1528] shrink-0 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {entity.toUpperCase()} AUDIT TRAIL
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {logs.length} event{logs.length !== 1 ? 's' : ''}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white truncate mt-0.5">
                {entityTitle || `${entity} #${entityId}`}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={loadLogs}
              disabled={isLoading}
              className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
              title="Refresh History"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-[#10172A] border border-slate-800 rounded-2xl animate-pulse">
              Retrieving historical lifecycle records for this {entity}...
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900/50 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center bg-[#10172A] border border-slate-800 rounded-2xl space-y-2">
              <Clock className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No audit events recorded yet</p>
              <p className="text-xs text-slate-500">
                Mutations on this {entity} will automatically appear in this audit log.
              </p>
            </div>
          ) : (
            logs.map((log) => {
              const userName =
                (typeof log.userId === 'object' && log.userId?.name) ||
                log.userSnapshot?.name ||
                'System User';
              const userEmail =
                (typeof log.userId === 'object' && log.userId?.email) ||
                log.userSnapshot?.email ||
                '';
              const hasDiff =
                (log.diff && log.diff.length > 0) ||
                Boolean(log.oldValue || log.newValue);

              return (
                <div
                  key={log._id}
                  className="p-4 sm:p-5 rounded-2xl bg-[#0D1424] border border-white/[0.08] hover:border-amber-500/30 transition-all space-y-3.5 shadow-xl"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <AuditActionBadge action={log.action} size="sm" />
                      <AuditSeverityBadge severity={log.severity} size="sm" />
                      <span className="text-[10.5px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedLog(log)}
                      className="self-end sm:self-auto px-3 py-1.5 rounded-xl text-xs font-bold bg-[#121B2F] hover:bg-amber-400 hover:text-slate-950 text-amber-300 border border-amber-500/30 hover:border-amber-400 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 group-hover:scale-105"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                  </div>

                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">
                      {log.summary || `${log.action} on ${log.entity}`}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Executed by <strong className="text-slate-300">{userName}</strong> ({userEmail})
                    </p>
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
            })
          )}
        </div>
      </div>

      {/* Deep Log Inspector Drawer */}
      <AuditLogDrawer
        log={selectedLog}
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
      />
    </div>,
    document.body
  );
};
