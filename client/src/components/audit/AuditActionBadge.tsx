import React from 'react';
import {
  PlusCircle,
  Edit3,
  Trash2,
  LogIn,
  LogOut,
  SlidersHorizontal,
  UserCheck,
  KeyRound,
  RotateCcw,
  Archive,
  Download,
  UserPlus,
} from 'lucide-react';
import { AuditAction } from '../../types/audit';

interface AuditActionBadgeProps {
  action: AuditAction;
  size?: 'sm' | 'md';
}

export const AuditActionBadge: React.FC<AuditActionBadgeProps> = ({
  action,
  size = 'md',
}) => {
  const isSm = size === 'sm';
  const iconClass = isSm ? 'w-2.5 h-2.5' : 'w-3 h-3';

  const badgeConfigs: Record<
    AuditAction,
    { label: string; icon: React.ElementType; styles: string }
  > = {
    CREATE: {
      label: 'Create',
      icon: PlusCircle,
      styles: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    },
    UPDATE: {
      label: 'Update',
      icon: Edit3,
      styles: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
    },
    DELETE: {
      label: 'Delete',
      icon: Trash2,
      styles: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
    },
    LOGIN: {
      label: 'Login',
      icon: LogIn,
      styles: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300',
    },
    LOGOUT: {
      label: 'Logout',
      icon: LogOut,
      styles: 'bg-slate-700/40 border-slate-600/40 text-slate-300',
    },
    STATUS_CHANGE: {
      label: 'Status Change',
      icon: SlidersHorizontal,
      styles: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
    },
    ASSIGNMENT: {
      label: 'Assignment',
      icon: UserPlus,
      styles: 'bg-teal-500/15 border-teal-500/30 text-teal-300',
    },
    ROLE_CHANGE: {
      label: 'Role Change',
      icon: UserCheck,
      styles: 'bg-violet-500/15 border-violet-500/30 text-violet-300',
    },
    PERMISSION_CHANGE: {
      label: 'Permission',
      icon: KeyRound,
      styles: 'bg-fuchsia-500/15 border-fuchsia-500/30 text-fuchsia-300',
    },
    RESTORE: {
      label: 'Restore',
      icon: RotateCcw,
      styles: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    },
    ARCHIVE: {
      label: 'Archive',
      icon: Archive,
      styles: 'bg-slate-700/40 border-slate-600/40 text-slate-300',
    },
    EXPORT: {
      label: 'Export',
      icon: Download,
      styles: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
    },
  };

  const config = badgeConfigs[action] || {
    label: action,
    icon: SlidersHorizontal,
    styles: 'bg-slate-800 border-slate-700 text-slate-300',
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-md border shadow-sm ${
        config.styles
      } ${isSm ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'}`}
    >
      <Icon className={iconClass} />
      <span>{config.label}</span>
    </span>
  );
};
