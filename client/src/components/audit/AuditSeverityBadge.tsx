import React from 'react';
import { ShieldAlert, AlertTriangle, AlertOctagon, Info } from 'lucide-react';
import { AuditSeverity } from '../../types/audit';

interface AuditSeverityBadgeProps {
  severity: AuditSeverity;
  size?: 'sm' | 'md';
}

export const AuditSeverityBadge: React.FC<AuditSeverityBadgeProps> = ({
  severity,
  size = 'md',
}) => {
  const isSm = size === 'sm';

  switch (severity) {
    case 'SECURITY':
      return (
        <span
          className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider rounded-md border bg-purple-500/15 border-purple-500/30 text-purple-300 shadow-sm ${
            isSm ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'
          }`}
          title="Security Critical Event"
        >
          <ShieldAlert className={isSm ? 'w-2.5 h-2.5' : 'w-3 h-3 text-purple-400'} />
          <span>Security</span>
        </span>
      );

    case 'CRITICAL':
      return (
        <span
          className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider rounded-md border bg-rose-500/15 border-rose-500/30 text-rose-300 shadow-sm ${
            isSm ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'
          }`}
          title="Critical Severity Event"
        >
          <AlertOctagon className={isSm ? 'w-2.5 h-2.5' : 'w-3 h-3 text-rose-400'} />
          <span>Critical</span>
        </span>
      );

    case 'WARN':
      return (
        <span
          className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider rounded-md border bg-amber-500/15 border-amber-500/30 text-amber-300 shadow-sm ${
            isSm ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'
          }`}
          title="Warning Level Event"
        >
          <AlertTriangle className={isSm ? 'w-2.5 h-2.5' : 'w-3 h-3 text-amber-400'} />
          <span>Warning</span>
        </span>
      );

    case 'INFO':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold uppercase tracking-wider rounded-md border bg-sky-500/10 border-sky-500/25 text-sky-300 ${
            isSm ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'
          }`}
          title="Informational Audit Event"
        >
          <Info className={isSm ? 'w-2.5 h-2.5' : 'w-3 h-3 text-sky-400'} />
          <span>Info</span>
        </span>
      );
  }
};
