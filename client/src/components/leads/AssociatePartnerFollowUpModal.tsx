import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Phone, Mail, User, Save, CheckCircle2 } from 'lucide-react';
import { PartnerItem } from '../../types';
import leadService from '../../services/lead.service';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface AssociatePartnerFollowUpModalProps {
  isOpen: boolean;
  partner: PartnerItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const AssociatePartnerFollowUpModal: React.FC<AssociatePartnerFollowUpModalProps> = ({
  isOpen,
  partner,
  onClose,
  onSuccess,
}) => {
  useEscapeKey(onClose, isOpen);

  const [dueDate, setDueDate] = useState('');
  const [remark, setRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && partner) {
      // Default next due date to tomorrow or partner's current due date
      if (partner.dueDate) {
        setDueDate(partner.dueDate);
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 2);
        const yyyy = tomorrow.getFullYear();
        const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const dd = String(tomorrow.getDate()).padStart(2, '0');
        setDueDate(`${yyyy}-${mm}-${dd}`);
      }
      setRemark('');
      setError('');
    }
  }, [isOpen, partner]);

  if (!isOpen || !partner) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remark.trim()) {
      setError('Please enter a follow-up remark or update notes.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const existingFollowUps = partner.followUps || [];
      const newFollowUp = {
        date: dueDate || new Date().toISOString().split('T')[0],
        remarks: remark.trim(),
        status: 'Scheduled',
        createdAt: new Date().toISOString(),
        createdByName: 'Admin',
      };

      await leadService.updatePartner(partner._id, {
        lastRemark: remark.trim(),
        dueDate: dueDate || partner.dueDate,
        followUps: [newFollowUp, ...existingFollowUps] as any,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to record follow-up');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#111622] border border-[#212b3e] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-7 text-slate-200 max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#1f283b] shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-emerald-400">📞</span> Follow Up Associate
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Record follow-up notes & schedule next reminder for this partner
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Partner Info Summary Card */}
        <div className="my-4 p-3.5 bg-[#171f2e] border border-[#253249] rounded-xl flex items-center justify-between gap-3 text-xs">
          <div>
            <div className="font-bold text-white text-sm">{partner.name}</div>
            <div className="flex items-center gap-2 mt-1 text-slate-300">
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <Phone className="w-3 h-3 text-emerald-400" />
                {partner.phone}
              </span>
              <span className="text-slate-500">•</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {partner.partnerType || 'Associate'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
              {partner.status || 'Active'}
            </span>
            {partner.dueDate && (
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                Due: {partner.dueDate}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto custom-scrollbar pr-1 flex-1 py-1">
          {/* Next Due Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Next Due Date / Follow-up Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[#171e2c] border border-[#26334a] focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all scheme-dark cursor-pointer"
              />
            </div>
          </div>

          {/* Remark / Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Follow-up Remark / Discussion Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="e.g. Spoke about upcoming luxury villa project. Agreed to share catalog and meet this Friday..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full bg-[#171e2c] border border-[#26334a] focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all resize-y"
            />
          </div>

          {/* Past Follow-ups / Remarks if any */}
          {(partner.lastRemark || (partner.followUps && partner.followUps.length > 0)) && (
            <div className="p-3 bg-[#141a27] border border-[#212b3d] rounded-xl space-y-1.5">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                Previous Remark
              </span>
              <p className="text-xs text-slate-300 italic">
                "{partner.lastRemark || partner.notes || 'None'}"
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1f283b] shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-[#1b2230] hover:bg-[#252f42] text-slate-300 text-xs font-semibold border border-[#2a374f] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Follow Up'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
