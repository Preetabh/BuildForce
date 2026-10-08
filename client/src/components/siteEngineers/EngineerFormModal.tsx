import React, { useState, useEffect } from 'react';
import { HardHat, X } from 'lucide-react';
import { SiteEngineerItem } from '../../types/rbac';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface EngineerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingEngineer: SiteEngineerItem | null;
  onSubmit: (data: Partial<SiteEngineerItem>) => void;
  isSubmitting: boolean;
}

export const EngineerFormModal: React.FC<EngineerFormModalProps> = ({
  isOpen,
  onClose,
  editingEngineer,
  onSubmit,
  isSubmitting,
}) => {
  useEscapeKey(onClose, isOpen);

  const [name, setName] = useState('');
  const [loginId, setLoginId] = useState('');
  const [mobile, setMobile] = useState('-');
  const [expertise, setExpertise] = useState('Common');
  const [projectsCount, setProjectsCount] = useState(0);
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    if (editingEngineer) {
      setName(editingEngineer.name);
      setLoginId(editingEngineer.loginId);
      setMobile(editingEngineer.mobile || '-');
      setExpertise(editingEngineer.expertise || 'Common');
      setProjectsCount(editingEngineer.projectsCount || 0);
      setStatus(editingEngineer.status);
      setWalletBalance(editingEngineer.walletBalance || 0);
    } else {
      setName('');
      setLoginId('');
      setMobile('-');
      setExpertise('Common');
      setProjectsCount(0);
      setStatus('Active');
      setWalletBalance(0);
    }
  }, [editingEngineer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !loginId.trim()) return;

    onSubmit({
      name: name.trim(),
      loginId: loginId.trim().toLowerCase(),
      mobile: mobile.trim() || '-',
      expertise: expertise.trim() || 'Common',
      projectsCount: Number(projectsCount) || 0,
      status,
      walletBalance: Number(walletBalance) || 0,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#0D121F] border border-amber-500/30 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-[#1C2538] pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <HardHat className="w-4 h-4 text-amber-400" />
              {editingEngineer ? 'Edit Site Engineer' : 'Add New Site Engineer'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Field staff registration and portal credential configuration
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
              Engineer Name <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Login ID / Email <span className="text-amber-400">*</span>
              </label>
              <input
                type="email"
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="e.g. rahul@lucknowbuilders.com"
                className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Mobile Phone</label>
              <input
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="e.g. 9616533535"
                className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Expertise</label>
              <select
                value={expertise}
                onChange={(e) => setExpertise(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Common">Common</option>
                <option value="2">2 (Senior Field)</option>
                <option value="Civil Structure">Civil Structure</option>
                <option value="Finishing & Interior">Finishing & Interior</option>
                <option value="MEP & Electrical">MEP & Electrical</option>
                <option value="Surveying & Quantity">Surveying & Quantity</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Assigned Projects</label>
              <input
                type="number"
                min="0"
                value={projectsCount}
                onChange={(e) => setProjectsCount(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Initial Wallet</label>
              <input
                type="number"
                min="0"
                value={walletBalance}
                onChange={(e) => setWalletBalance(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Status (Allow / Decline)</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white focus:outline-none focus:border-amber-500 font-semibold"
              >
                <option value="Active">Active (Allowed)</option>
                <option value="Inactive">Inactive (Declined)</option>
              </select>
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
              {isSubmitting ? 'Saving...' : editingEngineer ? 'Save Changes' : 'Add Engineer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
