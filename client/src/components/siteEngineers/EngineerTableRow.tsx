import React from 'react';
import {
  Wallet,
  Edit2,
  UserCheck,
  UserX,
  Eye,
  Trash2,
  Building2,
  Calendar,
  Phone,
  Mail,
} from 'lucide-react';
import { SiteEngineerItem } from '../../types/rbac';

interface EngineerTableRowProps {
  engineer: SiteEngineerItem;
  onOpenWallet: (eng: SiteEngineerItem) => void;
  onEdit: (eng: SiteEngineerItem) => void;
  onToggleStatus: (id: string) => void;
  onViewAs: (eng: SiteEngineerItem) => void;
  onDelete?: (id: string) => void;
}

export const EngineerTableRow: React.FC<EngineerTableRowProps> = ({
  engineer,
  onOpenWallet,
  onEdit,
  onToggleStatus,
  onViewAs,
  onDelete,
}) => {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Never reported';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Never reported';
    }
  };

  const assignedSites = Array.isArray(engineer.assignedProjectIds)
    ? engineer.assignedProjectIds
    : [];

  return (
    <tr className="hover:bg-[#121929]/70 transition-colors text-xs">
      {/* 1. Engineer Name with Avatar Initial & Joined Date */}
      <td className="py-3 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2D200E] via-[#1F170B] to-[#120F08] border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 shadow-md">
            {engineer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-semibold text-white block text-xs">{engineer.name}</span>
            <span className="text-[10.5px] text-slate-400 block">
              Joined {formatDate(engineer.joinedDate)}
            </span>
          </div>
        </div>
      </td>

      {/* 2. Contact: Email & Phone */}
      <td className="py-3 px-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="font-mono text-[11px] truncate max-w-[160px]">{engineer.loginId}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="font-mono text-[10.5px]">{engineer.mobile || '-'}</span>
          </div>
        </div>
      </td>

      {/* 3. Expertise */}
      <td className="py-3 px-4">
        <span className="inline-block px-2 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300 text-[11px] font-medium">
          {engineer.expertise || 'Common'}
        </span>
      </td>

      {/* 4. Assigned Sites */}
      <td className="py-3 px-4">
        {assignedSites.length === 0 ? (
          <span className="text-slate-400 text-[11px] italic">No sites assigned</span>
        ) : (
          <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
            {assignedSites.slice(0, 2).map((site: any, idx: number) => {
              const name = typeof site === 'string' ? 'Site' : site.name || site.code;
              return (
                <span
                  key={idx}
                  title={typeof site === 'object' ? `${site.name} (${site.code})` : undefined}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10.5px] font-medium"
                >
                  <Building2 className="w-3 h-3 text-amber-400" />
                  <span className="truncate max-w-[100px]">{name}</span>
                </span>
              );
            })}
            {assignedSites.length > 2 && (
              <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-bold">
                +{assignedSites.length - 2} more
              </span>
            )}
          </div>
        )}
      </td>

      {/* 5. Status: Active (Green) / Inactive (Red) */}
      <td className="py-3 px-4 text-center">
        {engineer.status === 'Active' ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)]">
            Active
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            Inactive
          </span>
        )}
      </td>

      {/* 6. Last Report Date */}
      <td className="py-3 px-4 text-center">
        <div className="inline-flex items-center gap-1 text-slate-300 font-mono text-[11px]">
          <Calendar className="w-3 h-3 text-amber-400" />
          <span>{formatDate(engineer.lastReportDate)}</span>
        </div>
      </td>

      {/* 7. Action Buttons */}
      <td className="py-3 px-4 sm:px-6 text-right">
        <div className="flex items-center justify-end gap-1.5">
          {/* Wallet Button */}
          <button
            type="button"
            onClick={() => onOpenWallet(engineer)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all active:scale-95 cursor-pointer"
          >
            <Wallet className="w-3 h-3" />
            <span>Wallet</span>
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => onEdit(engineer)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all active:scale-95 cursor-pointer"
          >
            <Edit2 className="w-3 h-3" />
            <span>Edit</span>
          </button>

          {/* Activate / Deactivate Button */}
          {engineer.status === 'Active' ? (
            <button
              type="button"
              onClick={() => onToggleStatus(engineer._id)}
              title="Deactivate / Decline Access"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all active:scale-95 cursor-pointer"
            >
              <UserX className="w-3 h-3" />
              <span>Deactivate</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onToggleStatus(engineer._id)}
              title="Activate / Allow Access"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all active:scale-95 cursor-pointer"
            >
              <UserCheck className="w-3 h-3" />
              <span>Activate</span>
            </button>
          )}

          {/* View As (Impersonate) Button */}
          <button
            type="button"
            onClick={() => onViewAs(engineer)}
            title="View Field Dashboard As This Engineer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-all active:scale-95 cursor-pointer"
          >
            <Eye className="w-3 h-3" />
            <span className="hidden xl:inline">Portal</span>
          </button>

          {/* Delete Button */}
          {onDelete && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Delete site engineer "${engineer.name}" permanently?`)) {
                  onDelete(engineer._id);
                }
              }}
              title="Delete Site Engineer"
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};
