import React from 'react';
import { Sliders, X, Check, X as XIcon } from 'lucide-react';
import { RbacUserItem, RbacMenuItem } from '../../types/rbac';

interface UserOverrideModalProps {
  user: RbacUserItem | null;
  menus: RbacMenuItem[];
  overrides: Record<string, boolean>;
  onClose: () => void;
  onToggleOverride: (route: string, currentVal: boolean) => void;
  onSave: () => void;
  isSaving: boolean;
}

export const UserOverrideModal: React.FC<UserOverrideModalProps> = ({
  user,
  menus,
  overrides,
  onClose,
  onToggleOverride,
  onSave,
  isSaving,
}) => {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#0D121F] border border-amber-500/30 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-[#1C2538] pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              Customize Access: {user.name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Explicitly Allow or Decline specific portal modules for this user
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1 custom-scrollbar text-xs">
          {menus.map((menu) => {
            const isOverridden = overrides[menu.route] !== undefined;
            const isAllowed = isOverridden ? overrides[menu.route] : true;

            return (
              <div
                key={menu._id}
                className="p-3 rounded-xl bg-[#141C2E] border border-slate-800 flex items-center justify-between gap-3"
              >
                <div>
                  <span className="font-semibold text-white block">{menu.title}</span>
                  <span className="font-mono text-[10px] text-slate-400">{menu.route}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Allow Button */}
                  <button
                    type="button"
                    onClick={() => onToggleOverride(menu.route, false)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                      isAllowed
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-emerald-300'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>ALLOW</span>
                  </button>

                  {/* Decline Button */}
                  <button
                    type="button"
                    onClick={() => onToggleOverride(menu.route, true)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                      !isAllowed
                        ? 'bg-red-500 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-red-300'
                    }`}
                  >
                    <XIcon className="w-3 h-3 stroke-[3]" />
                    <span>DECLINE</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#1C2538]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-[#141B2D] hover:bg-[#1A233A] font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all"
          >
            {isSaving ? 'Saving...' : 'Save Overrides'}
          </button>
        </div>
      </div>
    </div>
  );
};
