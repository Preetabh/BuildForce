import React from 'react';
import { Check, X } from 'lucide-react';
import { RolePermission } from '../../types/rbac';

interface PermissionRowProps {
  permission: RolePermission;
  onToggle: (route: string, currentAllow: boolean) => void;
}

export const PermissionRow: React.FC<PermissionRowProps> = ({ permission, onToggle }) => {
  return (
    <tr className="hover:bg-[#121929]/60 transition-colors">
      {/* Feature Name */}
      <td className="py-3 px-4 sm:px-6">
        <span className="font-semibold text-slate-200 block">{permission.menuTitle}</span>
      </td>

      {/* Route Path */}
      <td className="py-3 px-4">
        <span className="font-mono text-[11px] text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
          {permission.menuRoute}
        </span>
      </td>

      {/* ALLOW vs DECLINE Interactive Buttons */}
      <td className="py-3 px-4 text-center">
        <div className="inline-flex items-center rounded-xl p-0.5 bg-[#121828] border border-slate-800">
          {/* ALLOW Button */}
          <button
            type="button"
            onClick={() => {
              if (!permission.allow) {
                onToggle(permission.menuRoute, false);
              }
            }}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              permission.allow
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                : 'text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10'
            }`}
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>ALLOW</span>
          </button>

          {/* DECLINE Button */}
          <button
            type="button"
            onClick={() => {
              if (permission.allow) {
                onToggle(permission.menuRoute, true);
              }
            }}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              !permission.allow
                ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                : 'text-slate-400 hover:text-red-300 hover:bg-red-500/10'
            }`}
          >
            <X className="w-3.5 h-3.5 stroke-[3]" />
            <span>DECLINE</span>
          </button>
        </div>
      </td>
    </tr>
  );
};
