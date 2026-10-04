import React from 'react';
import { Wallet, Edit2, UserCheck, UserX, Eye, FolderKanban, Trash2 } from 'lucide-react';
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
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `Joined ${d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })}`;
    } catch {
      return 'Joined 2026';
    }
  };

  return (
    <tr className="hover:bg-[#121929]/70 transition-colors">
      {/* Engineer Name with Avatar Initial & Joined Date */}
      <td className="py-3 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#241A0B] border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
            {engineer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-semibold text-white block">{engineer.name}</span>
            <span className="text-[10px] text-slate-400 block">{formatDate(engineer.joinedDate)}</span>
          </div>
        </div>
      </td>

      {/* Expertise */}
      <td className="py-3 px-4">
        <span className="text-slate-300">{engineer.expertise || 'Common'}</span>
      </td>

      {/* Login ID */}
      <td className="py-3 px-4">
        <span className="font-mono text-[11px] text-slate-400">{engineer.loginId}</span>
      </td>

      {/* Mobile */}
      <td className="py-3 px-4">
        <span className="font-mono text-[11px] text-slate-300">{engineer.mobile || '-'}</span>
      </td>

      {/* Projects */}
      <td className="py-3 px-4 text-center">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#141C2E] border border-slate-700/60 text-slate-300 font-mono text-[11px]">
          <FolderKanban className="w-3 h-3 text-amber-400/80" />
          <span>{engineer.projectsCount || 0}</span>
        </div>
      </td>

      {/* Status: Active (Green) / Inactive (Red) */}
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

      {/* Action Buttons */}
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

          {/* Activate / Deactivate (Allow / Decline) Button */}
          {engineer.status === 'Active' ? (
            <button
              type="button"
              onClick={() => onToggleStatus(engineer._id)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all active:scale-95 cursor-pointer"
              title="Decline / Deactivate this engineer account"
            >
              <UserX className="w-3 h-3" />
              <span>Deactivate</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onToggleStatus(engineer._id)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-all active:scale-95 cursor-pointer"
              title="Allow / Activate this engineer account"
            >
              <UserCheck className="w-3 h-3" />
              <span>Activate</span>
            </button>
          )}

          {/* View Portal As button */}
          <button
            type="button"
            onClick={() => onViewAs(engineer)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-[#141C2E] hover:bg-[#1A253D] text-slate-300 hover:text-amber-300 border border-slate-700/60 transition-all cursor-pointer"
            title="View portal as this engineer"
          >
            <Eye className="w-3 h-3" />
          </button>

          {/* Delete Button */}
          {onDelete && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete ${engineer.name}?`)) {
                  onDelete(engineer._id);
                }
              }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
              title="Delete engineer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};
