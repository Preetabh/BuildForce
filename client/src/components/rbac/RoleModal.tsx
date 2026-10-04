import React, { useState, useEffect } from 'react';
import { Shield, X } from 'lucide-react';
import { RbacRole } from '../../types/rbac';
import { APP_CONFIG } from '../../config/app.config';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRole: RbacRole | null;
  isSubmitting: boolean;
  onSubmit: (data: { name: string; code: string; description: string; color: string }) => void;
}

export const RoleModal: React.FC<RoleModalProps> = ({
  isOpen,
  onClose,
  editingRole,
  isSubmitting,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#F59E0B');

  useEffect(() => {
    if (editingRole) {
      setName(editingRole.name);
      setCode(editingRole.code);
      setDescription(editingRole.description || '');
      setColor(editingRole.color || '#F59E0B');
    } else {
      setName('');
      setCode('');
      setDescription('');
      setColor('#F59E0B');
    }
  }, [editingRole, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    onSubmit({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description.trim(),
      color,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#0D121F] border border-amber-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-[#1C2538] pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              {editingRole ? 'Edit Role Details' : 'Create Custom Role'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Define authority profile and identifier code
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Role Name <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Quality Auditor or Lead Inspector"
              className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Role Code <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              disabled={!!editingRole}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. QUALITY_AUDITOR"
              className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white font-mono focus:outline-none focus:border-amber-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of duties and access..."
              className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Color Accent</label>
            <div className="flex items-center gap-2">
              {APP_CONFIG.ROLE_ACCENT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
                    color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
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
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all"
            >
              {isSubmitting ? 'Saving...' : editingRole ? 'Save Changes' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
