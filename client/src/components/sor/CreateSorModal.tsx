import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, BookOpen, Check, AlertCircle, Plus } from 'lucide-react';
import api from '../../services/api';
import { ScheduleHierarchyItem } from '../../types';

interface CreateSorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newSor: ScheduleHierarchyItem) => void;
}

export const CreateSorModal: React.FC<CreateSorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    sorName: '',
    country: 'India',
    state: '',
    owningBody: '',
    department: 'Civil',
    scheduleType: 'State Govt',
    version: new Date().getFullYear().toString(),
    effectiveFrom: new Date().toISOString().split('T')[0],
    notes: '',
    sourceDocument: '',
  });

  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const createSorMutation = useMutation({
    mutationFn: async (formData: typeof form) => {
      const res = await api.post('/sor/masters', formData);
      return res.data?.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['scheduleHierarchy'] });
      queryClient.invalidateQueries({ queryKey: ['sorMasters'] });
      queryClient.invalidateQueries({ queryKey: ['userRecentSors'] });
      if (onSuccess && data) {
        onSuccess(data);
      }
      onClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to create Schedule of Rates';
      if (err.response?.status === 409) {
        setFieldErrors({ sorName: msg });
      } else {
        setGeneralError(msg);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!form.sorName.trim()) {
      errors.sorName = 'Schedule name is required';
    }
    if (form.scheduleType.includes('State') && !form.state.trim()) {
      errors.state = 'State / Region is required for State Govt schedules';
    }
    if (!form.version.trim()) {
      errors.version = 'Version / Financial year is required';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setGeneralError(null);
    createSorMutation.mutate(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-lg bg-[#0c1017] border border-slate-750 rounded-2xl shadow-2xl z-10 overflow-hidden my-4 flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#090d14]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Create Schedule of Rates (SOR)
              </h3>
              <p className="text-[11px] text-slate-400">BudgetPilot Organization Master</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {generalError && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/50 rounded-xl text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Schedule Name */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              SOR Schedule Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={form.sorName}
              onChange={(e) => {
                setForm({ ...form, sorName: e.target.value });
                if (fieldErrors.sorName) setFieldErrors({ ...fieldErrors, sorName: '' });
              }}
              placeholder="e.g. Building Works SOR 2026, Municipal Rates 2024"
              className="w-full px-3 py-2 bg-[#080b11] border border-slate-750 focus:border-blue-500 rounded-lg text-white placeholder:text-slate-500 focus:outline-none"
            />
            {fieldErrors.sorName && (
              <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.sorName}</p>
            )}
          </div>

          {/* Schedule Type & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Schedule Type</label>
              <select
                value={form.scheduleType}
                onChange={(e) => setForm({ ...form, scheduleType: e.target.value })}
                className="w-full px-3 py-2 bg-[#080b11] border border-slate-750 focus:border-blue-500 rounded-lg text-slate-200 focus:outline-none"
              >
                <option value="Central Govt">Central Govt</option>
                <option value="State Govt">State Govt</option>
                <option value="Private">Private / Personal</option>
                <option value="Municipal">Municipal / Local Body</option>
                <option value="PSU">Public Sector Undertaking (PSU)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Department</label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="Civil, Electrical, Roads..."
                className="w-full px-3 py-2 bg-[#080b11] border border-slate-750 focus:border-blue-500 rounded-lg text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Country & State / Region */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Country</label>
              <input
                type="text"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                placeholder="India, United Arab Emirates..."
                className="w-full px-3 py-2 bg-[#080b11] border border-slate-750 focus:border-blue-500 rounded-lg text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                State / Region {form.scheduleType.includes('State') && <span className="text-rose-400">*</span>}
              </label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => {
                  setForm({ ...form, state: e.target.value });
                  if (fieldErrors.state) setFieldErrors({ ...fieldErrors, state: '' });
                }}
                placeholder="e.g. Maharashtra, Chhattisgarh, All-India..."
                className="w-full px-3 py-2 bg-[#080b11] border border-slate-750 focus:border-blue-500 rounded-lg text-white placeholder:text-slate-500 focus:outline-none"
              />
              {fieldErrors.state && (
                <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.state}</p>
              )}
            </div>
          </div>

          {/* Owning Authority & Version */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Owning Body / Authority</label>
              <input
                type="text"
                value={form.owningBody}
                onChange={(e) => setForm({ ...form, owningBody: e.target.value })}
                placeholder="e.g. PWD, CPWD, NHAI, In-House..."
                className="w-full px-3 py-2 bg-[#080b11] border border-slate-750 focus:border-blue-500 rounded-lg text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Version / Financial Year <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })}
                placeholder="e.g. 2026, 2023-24, v2.1"
                className="w-full px-3 py-2 bg-[#080b11] border border-slate-750 focus:border-blue-500 rounded-lg text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Effective Date & Source Document */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Effective Date</label>
              <input
                type="date"
                value={form.effectiveFrom}
                onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
                className="w-full px-3 py-2 bg-[#080b11] border border-slate-750 focus:border-blue-500 rounded-lg text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Source Document (Optional)</label>
              <input
                type="text"
                value={form.sourceDocument}
                onChange={(e) => setForm({ ...form, sourceDocument: e.target.value })}
                placeholder="e.g. Notification No. 142/2026.pdf"
                className="w-full px-3 py-2 bg-[#080b11] border border-slate-750 focus:border-blue-500 rounded-lg text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Description / Notes */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Description / Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Internal notes, application scope, reference..."
              className="w-full px-3 py-2 bg-[#080b11] border border-slate-750 focus:border-blue-500 rounded-lg text-white placeholder:text-slate-500 focus:outline-none resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#141a27] hover:bg-[#1c2438] text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSorMutation.isPending}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{createSorMutation.isPending ? 'Saving...' : 'Create SOR'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
