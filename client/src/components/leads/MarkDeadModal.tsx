import React, { useState } from 'react';
import { X, AlertTriangle, RotateCcw } from 'lucide-react';
import { LeadItem } from '../../types';
import leadService from '../../services/lead.service';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface MarkDeadModalProps {
  isOpen: boolean;
  lead: LeadItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

const COMMON_DEAD_REASONS = [
  'Budget mismatch / Expected lower price',
  'Postponing construction till next year',
  'Wrong number / Call not connecting',
  'Selected another contractor / builder',
  'Location outside our operational radius',
  'Plot dispute / Legal clearance pending',
  'No response after multiple follow-ups',
];

export const MarkDeadModal: React.FC<MarkDeadModalProps> = ({
  isOpen,
  lead,
  onClose,
  onSuccess,
}) => {
  useEscapeKey(onClose, isOpen);

  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !lead) return null;

  const handleMarkDead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please select or specify a reason.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await leadService.markDead(lead._id, reason.trim());
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      await leadService.restoreDead(lead._id);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to restore lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#121622] border border-[#232B3E] rounded-3xl w-full max-w-md text-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#1E2638] flex items-center justify-between bg-gradient-to-r from-[#2B1519] to-[#121622]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                {lead.isDead ? 'Lead Marked as Dead' : 'Mark Lead as Dead'}
              </h3>
              <p className="text-xs text-slate-400">
                Lead {lead.leadCode} • {lead.clientName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#1A2234] text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-200 text-xs">
              {error}
            </div>
          )}

          {lead.isDead ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-red-950/30 border border-red-800/40 rounded-2xl text-xs space-y-2">
                <span className="font-bold text-red-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Currently Archived as Dead Lead
                </span>
                <p className="text-slate-300">
                  <strong className="text-slate-400">Recorded Reason:</strong> {lead.deadReason || 'N/A'}
                </p>
                {lead.deadAt && (
                  <p className="text-[11px] text-slate-500">
                    Archived on: {new Date(lead.deadAt).toLocaleDateString()}
                  </p>
                )}
              </div>

              <p className="text-xs text-slate-300">
                Would you like to restore this lead back to active status in your pipeline?
              </p>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-[#182030] hover:bg-[#202B40] text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleRestore}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/25 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Restoring...' : 'Restore to Active'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleMarkDead} className="space-y-4">
              <p className="text-xs text-slate-300">
                Marking a lead as dead will archive it from the standard active sales list. Please provide a reason:
              </p>

              {/* Quick Reasons */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                  Select Reason
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                  {COMMON_DEAD_REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReason(r)}
                      className={`w-full text-left text-[11px] p-2 rounded-xl border transition-all ${
                        reason === r
                          ? 'bg-red-950/40 text-red-200 border-red-500/50 font-semibold'
                          : 'bg-[#182030] text-slate-400 border-[#2A354C] hover:text-white'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Reason Text */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Or Custom Reason Details
                </label>
                <textarea
                  rows={2}
                  placeholder="Enter detailed reason..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-[#182030] border border-[#2A354C] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-400 resize-none"
                />
              </div>

              <div className="pt-2 border-t border-[#1E2638] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-[#182030] hover:bg-[#202B40] text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/25 transition-all"
                >
                  {isSubmitting ? 'Archiving...' : 'Mark as Dead'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
