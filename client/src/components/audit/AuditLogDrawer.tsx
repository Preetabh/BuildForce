import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  User,
  Shield,
  Laptop,
  Globe,
  Clock,
  Layers,
  FileText,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { AuditLog } from '../../types/audit';
import { AuditSeverityBadge } from './AuditSeverityBadge';
import { AuditActionBadge } from './AuditActionBadge';
import { AuditDiffViewer } from './AuditDiffViewer';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface AuditLogDrawerProps {
  log: AuditLog | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectRelated?: (logId: string) => void;
  relatedActivities?: AuditLog[];
}

export const AuditLogDrawer: React.FC<AuditLogDrawerProps> = ({
  log,
  isOpen,
  onClose,
  onSelectRelated,
  relatedActivities = [],
}) => {
  useEscapeKey(onClose, isOpen);

  const [activeTab, setActiveTab] = useState<'details' | 'diff' | 'raw'>('details');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen || !log) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 1800);
  };

  const userName =
    (typeof log.userId === 'object' && log.userId?.name) ||
    log.userSnapshot?.name ||
    'System User';
  const userEmail =
    (typeof log.userId === 'object' && log.userId?.email) ||
    log.userSnapshot?.email ||
    'system@buildforce360.internal';
  const userRole =
    (typeof log.userId === 'object' && log.userId?.role) ||
    log.userSnapshot?.role ||
    'SYSTEM';
  const userInitial = (userName || userEmail || 'U').charAt(0).toUpperCase();

  const formattedDate = new Date(log.timestamp).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });

  const relativeTime = () => {
    const diffMs = Date.now() - new Date(log.timestamp).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const hasDiff =
    (log.diff && log.diff.length > 0) ||
    Boolean(log.oldValue || log.newValue);

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex justify-end animate-in fade-in duration-200">
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Inspector Drawer Container */}
      <div className="relative w-full max-w-xl sm:max-w-2xl bg-[#0B101D] text-slate-100 shadow-2xl border-l border-slate-800 flex flex-col h-full z-10 overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0E1528] shrink-0 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-slate-400">LOG #{log._id.slice(-8)}</span>
                <AuditSeverityBadge severity={log.severity} size="sm" />
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider border ${
                    log.status === 'SUCCESS'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {log.status}
                </span>
              </div>
              <h2 className="text-sm font-bold text-white truncate mt-0.5">
                {log.summary || `${log.action} on ${log.entity}`}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 flex items-center justify-center transition-all cursor-pointer shrink-0"
            title="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="px-5 py-2 border-b border-slate-800 bg-[#090D18] shrink-0 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'details'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Log Overview
          </button>

          {hasDiff && (
            <button
              type="button"
              onClick={() => setActiveTab('diff')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'diff'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span>Before → After Diff</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('raw')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'raw'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Raw Metadata JSON
          </button>
        </div>

        {/* Scrollable Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'details' && (
            <>
              {/* Actor / User Identity Card */}
              <div className="p-4 rounded-2xl bg-[#10172A] border border-slate-800 space-y-3 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>Actor / Triggered By</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {relativeTime()}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black text-sm flex items-center justify-center shadow-md ring-2 ring-amber-500/30 shrink-0">
                    {userInitial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-white truncate">{userName}</p>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        {userRole}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono truncate">{userEmail}</p>
                  </div>
                </div>

                {/* Network & Device Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#090E1A] border border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-sky-400" />
                      <span>IP Address</span>
                    </span>
                    <span className="font-mono font-bold text-slate-200">
                      {log.ipAddress || '127.0.0.1'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#090E1A] border border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Laptop className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Device / Platform</span>
                    </span>
                    <span className="font-semibold text-slate-200 truncate max-w-[130px]" title={`${log.device?.browser} on ${log.device?.os}`}>
                      {log.device?.browser || 'Browser'} • {log.device?.os || 'OS'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Event Attributes Card */}
              <div className="p-4 rounded-2xl bg-[#10172A] border border-slate-800 space-y-3 shadow-sm">
                <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Operation Specifics</span>
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#090E1A] border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Action</span>
                    <div className="mt-1">
                      <AuditActionBadge action={log.action} size="sm" />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#090E1A] border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Module</span>
                    <span className="font-bold text-amber-400 text-xs mt-1 block">
                      {log.module}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#090E1A] border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Entity</span>
                    <span className="font-bold text-slate-200 text-xs mt-1 block">
                      {log.entity}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#090E1A] border border-slate-800/80 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Target Entity ID</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(log.entityId, 'entityId')}
                      className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedText === 'entityId' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedText === 'entityId' ? 'Copied' : 'Copy ID'}</span>
                    </button>
                  </div>
                  <p className="font-mono text-slate-300 break-all">{log.entityId}</p>
                  {log.entityName && (
                    <div className="pt-1 border-t border-slate-800/60">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Target Name</span>
                      <p className="font-semibold text-white mt-0.5">{log.entityName}</p>
                    </div>
                  )}
                </div>

                {log.failureReason && (
                  <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-900/50 text-xs text-rose-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <div>
                      <span className="font-bold block">Execution Error Reason:</span>
                      <span>{log.failureReason}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Exact Timestamp:</span>
                  </span>
                  <span className="font-mono text-slate-300">{formattedDate}</span>
                </div>
              </div>

              {/* Quick Diff Preview in Overview */}
              {hasDiff && (
                <div className="p-4 rounded-2xl bg-[#10172A] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>State Modification Snapshot</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('diff')}
                      className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                    >
                      <span>Full Diff Inspector</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <AuditDiffViewer
                    diff={log.diff}
                    oldValue={log.oldValue}
                    newValue={log.newValue}
                  />
                </div>
              )}

              {/* Related Activities */}
              {relatedActivities.length > 0 && (
                <div className="p-4 rounded-2xl bg-[#10172A] border border-slate-800 space-y-3">
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                    <span>Related Events on Same Target / Actor</span>
                  </span>

                  <div className="space-y-1.5">
                    {relatedActivities.map((rel) => (
                      <button
                        key={rel._id}
                        type="button"
                        onClick={() => onSelectRelated?.(rel._id)}
                        className="w-full p-2.5 rounded-xl bg-[#090E1A] hover:bg-slate-800/60 border border-slate-800/80 transition-all text-left flex items-center justify-between gap-3 group cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <AuditActionBadge action={rel.action} size="sm" />
                            <span className="text-xs font-semibold text-slate-200 truncate group-hover:text-amber-300 transition-colors">
                              {rel.summary || rel.entity}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(rel.timestamp).toLocaleString('en-IN', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: DETAILED DIFF VIEW */}
          {activeTab === 'diff' && (
            <div className="p-4 rounded-2xl bg-[#10172A] border border-slate-800 space-y-4">
              <AuditDiffViewer
                diff={log.diff}
                oldValue={log.oldValue}
                newValue={log.newValue}
              />
            </div>
          )}

          {/* TAB 3: RAW METADATA JSON */}
          {activeTab === 'raw' && (
            <div className="p-4 rounded-2xl bg-[#090D18] border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400 text-[11px]">Audit Record Full Payload</span>
                <button
                  type="button"
                  onClick={() => handleCopy(JSON.stringify(log, null, 2), 'rawLog')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 transition-all"
                >
                  {copiedText === 'rawLog' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText === 'rawLog' ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>
              <pre className="text-amber-300/90 overflow-x-auto max-h-[600px] custom-scrollbar text-[11px]">
                {JSON.stringify(log, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
