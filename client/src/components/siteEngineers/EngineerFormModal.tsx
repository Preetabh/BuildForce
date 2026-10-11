import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HardHat, X, Key, Building2, Check } from 'lucide-react';
import { SiteEngineerItem } from '../../types/rbac';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import api from '../../services/api';

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
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [expertise, setExpertise] = useState('Common');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [walletBalance, setWalletBalance] = useState(0);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  // Fetch all available sites/projects for multi-selection
  const { data: projects = [] } = useQuery({
    queryKey: ['availableSitesList'],
    queryFn: async () => {
      const res = await api.get('/projects?limit=100');
      const all = res.data?.data || [];
      return all.filter((p: any) => !p.parentId && !/-SP\d+/i.test(p.code || ''));
    },
    enabled: isOpen,
  });

  useEffect(() => {
    if (editingEngineer) {
      setName(editingEngineer.name);
      setLoginId(editingEngineer.loginId);
      setPassword(''); // keep blank if not changing
      setMobile(editingEngineer.mobile === '-' ? '' : editingEngineer.mobile || '');
      setExpertise(editingEngineer.expertise || 'Common');
      setStatus(editingEngineer.status);
      setWalletBalance(editingEngineer.walletBalance || 0);

      // Extract assigned project IDs
      if (Array.isArray(editingEngineer.assignedProjectIds)) {
        const ids = editingEngineer.assignedProjectIds.map((p: any) =>
          typeof p === 'string' ? p : p._id
        );
        setSelectedProjectIds(ids);
      } else {
        setSelectedProjectIds([]);
      }
    } else {
      setName('');
      setLoginId('');
      setPassword('password123');
      setMobile('');
      setExpertise('Common');
      setStatus('Active');
      setWalletBalance(0);
      setSelectedProjectIds([]);
    }
  }, [editingEngineer, isOpen]);

  if (!isOpen) return null;

  const toggleProjectSelection = (projectId: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !loginId.trim()) return;

    const payload: Partial<SiteEngineerItem> & { password?: string } = {
      name: name.trim(),
      loginId: loginId.trim().toLowerCase(),
      mobile: mobile.trim() || '-',
      expertise: expertise.trim() || 'Common',
      projectsCount: selectedProjectIds.length,
      assignedProjectIds: selectedProjectIds,
      status,
      walletBalance: Number(walletBalance) || 0,
    };

    if (password.trim()) {
      payload.password = password.trim();
    }

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#0D121F] border border-amber-500/30 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#1C2538] pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <HardHat className="w-5 h-5 text-amber-400" />
              {editingEngineer ? 'Edit Site Engineer Account' : 'Register New Site Engineer'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure engineer credentials, expertise, status, and assigned construction sites.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Full Name <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Er. Tridev Sharma"
              className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Login Email ID <span className="text-amber-400">*</span>
              </label>
              <input
                type="email"
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="e.g. tridev@buildforce.com"
                className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Mobile Phone Number</label>
              <input
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Secure Login Credentials */}
          <div className="bg-[#101728] border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Secure Portal Login Password</span>
            </div>
            <div>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={editingEngineer ? 'Leave blank to retain current password' : 'Enter password (min 6 chars)'}
                className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white font-mono focus:outline-none focus:border-amber-500 text-xs"
              />
              <p className="text-[10.5px] text-slate-400 mt-1">
                {editingEngineer
                  ? 'Enter a new password only if you wish to reset the engineer login credentials.'
                  : 'Site engineers log in to the portal with their email and this password.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Technical Expertise</label>
              <select
                value={expertise}
                onChange={(e) => setExpertise(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Common">General Civil / Common</option>
                <option value="Civil Structure">Civil Structure & RCC</option>
                <option value="Finishing & Interior">Finishing & Interior</option>
                <option value="MEP & Electrical">MEP & Electrical</option>
                <option value="Surveying & Quantity">Surveying & Quantity (e-MB)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Status (Active / Inactive)</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white focus:outline-none focus:border-amber-500 font-semibold"
              >
                <option value="Active">Active (Permitted Site Access)</option>
                <option value="Inactive">Inactive (Deactivated / Declined)</option>
              </select>
            </div>
          </div>

          {/* Assigned Sites Multi-Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-slate-300 font-semibold flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-400" />
                <span>Assign Construction Sites ({selectedProjectIds.length} selected)</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Engineer will only access these assigned sites
              </span>
            </div>

            <div className="border border-[#232F4A] bg-[#121929] rounded-xl p-3 max-h-48 overflow-y-auto custom-scrollbar space-y-1.5">
              {projects.length === 0 ? (
                <p className="text-center text-slate-400 py-3">No active sites found to assign</p>
              ) : (
                projects.map((proj: any) => {
                  const isChecked = selectedProjectIds.includes(proj._id);
                  return (
                    <div
                      key={proj._id}
                      onClick={() => toggleProjectSelection(proj._id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-amber-500/15 border border-amber-500/30 text-white'
                          : 'bg-[#161F33] hover:bg-[#1B2742] text-slate-300 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                            isChecked ? 'bg-amber-500 text-slate-950 font-bold' : 'border border-slate-600'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="truncate">
                          <p className="font-semibold text-xs truncate leading-tight">{proj.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {proj.code} • {proj.location || 'Site Location'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                        {proj.status || 'Active'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#1C2538]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-[#141B2D] hover:bg-[#1A233A] font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingEngineer ? 'Save Changes' : 'Create Site Engineer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
