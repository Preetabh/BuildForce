import React, { useState, useEffect } from 'react';
import { Plus, Edit2, X } from 'lucide-react';
import { RbacMenuItem } from '../../types/rbac';
import { APP_CONFIG } from '../../config/app.config';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: RbacMenuItem | null;
  parentMenus: RbacMenuItem[];
  isSubmitting: boolean;
  onSubmit: (data: Partial<RbacMenuItem>) => void;
}

export const MenuModal: React.FC<MenuModalProps> = ({
  isOpen,
  onClose,
  editingItem,
  parentMenus,
  isSubmitting,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [route, setRoute] = useState('');
  const [icon, setIcon] = useState('Layers');
  const [sort, setSort] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [parentId, setParentId] = useState('');

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title);
      setRoute(editingItem.route);
      setIcon(editingItem.icon || 'Layers');
      setSort(editingItem.sort ?? 0);
      setIsVisible(editingItem.isVisible);
      setParentId(editingItem.parentId ? String(editingItem.parentId) : '');
    } else {
      setTitle('');
      setRoute('');
      setIcon('Layers');
      setSort(0);
      setIsVisible(true);
      setParentId('');
    }
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !route.trim()) return;

    onSubmit({
      title: title.trim(),
      route: route.trim(),
      icon,
      sort: Number(sort) || 0,
      isVisible,
      parentId: parentId || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#0D121F] border border-amber-500/30 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-[#1C2538] pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {editingItem ? <Edit2 className="w-4 h-4 text-amber-400" /> : <Plus className="w-4 h-4 text-amber-400" />}
              {editingItem ? 'Edit Navigation Item' : 'Add New Navigation Item'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure routes, sidebar hierarchy, and visibility
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
              Navigation Title <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Detailed Site Engineers"
              className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Destination Route <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              placeholder="e.g. /admin/site-engineers or Admin/ManageSiteEngineers"
              className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Parent Menu (Optional - for sub-navigation flow)
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">(None - Top Level Root Menu)</option>
              {parentMenus
                .filter((p) => p._id !== editingItem?._id)
                .map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title} ({p.route})
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Icon</label>
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white focus:outline-none focus:border-amber-500"
              >
                {APP_CONFIG.NAVIGATION_ICONS.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Sort Order</label>
              <input
                type="number"
                value={sort}
                onChange={(e) => setSort(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isVisible}
                onChange={(e) => setIsVisible(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-[#141B2D] border-[#232F4A]"
              />
              <span className="text-slate-300 font-semibold">
                Set Visible in portal sidebar navigation
              </span>
            </label>
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
              {isSubmitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
