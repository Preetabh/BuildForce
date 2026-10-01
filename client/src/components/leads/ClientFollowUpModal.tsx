import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertCircle } from 'lucide-react';
import { ClientRecord } from '../../types';
import leadService from '../../services/lead.service';

interface ClientFollowUpModalProps {
  isOpen: boolean;
  client: ClientRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ClientFollowUpModal: React.FC<ClientFollowUpModalProps> = ({
  isOpen,
  client,
  onClose,
  onSuccess,
}) => {
  const [nextDueDate, setNextDueDate] = useState('');
  const [remark, setRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && client) {
      // Default next due date to tomorrow or client's latest follow up
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const dd = String(tomorrow.getDate()).padStart(2, '0');
      setNextDueDate(`${yyyy}-${mm}-${dd}`);
      setRemark('');
      setError('');
    }
  }, [isOpen, client]);

  if (!isOpen || !client) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nextDueDate) {
      setError('Please select a valid Next Due Date.');
      return;
    }
    if (!remark.trim()) {
      setError('Please enter a remark.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await leadService.addClientFollowUp(client._id, {
        date: nextDueDate,
        remarks: remark.trim(),
        status: 'Scheduled',
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to submit follow-up');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date helper: "29-Sep-2026 12:32 PM"
  const formatLatestFollowUp = () => {
    if (!client.latestFollowUp?.date && (!client.followUps || client.followUps.length === 0)) {
      return 'No previous follow-up recorded';
    }
    const latest = client.followUps && client.followUps.length > 0 ? client.followUps[0] : null;
    const author = latest?.createdByName || 'admin@lucknowbuilders.com';
    const dateObj = latest?.date ? new Date(latest.date) : client.latestFollowUp?.date ? new Date(client.latestFollowUp.date) : new Date();

    const formattedDate = dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const formattedTime = dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const remarkText = latest?.remarks || client.latestFollowUp?.remarks || '';
    return `${author} (${formattedDate} ${formattedTime}) ${remarkText ? `- ${remarkText}` : ''}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#14161D] border border-amber-500/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header (Matches Screenshot 3) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#202532] bg-[#14161D]">
          <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
            Client Follow Up [ {client.clientCode} ] : {client.name}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 4 Info Fields: 2x2 Grid (Yellow Labels, White Values) */}
          <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs">
            <div>
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                BUSINESS NAME
              </span>
              <span className="text-white font-medium text-xs">
                {client.businessName || '-'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                CONTACT
              </span>
              <span className="text-white font-medium text-xs">
                {client.name}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                ADDRESS
              </span>
              <span className="text-white font-medium text-xs">
                {client.siteLocation || client.address || '-'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                EMAIL
              </span>
              <span className="text-white font-medium text-xs">
                {client.email || `${client.name.toLowerCase().replace(/\s+/g, '')}@dummy.com`}
              </span>
            </div>
          </div>

          {/* Next Due Date Field (Matches Screenshot 3) */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-bold text-slate-300">
              Next Due Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-full bg-[#181B24] border border-[#272D3C] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                required
              />
            </div>
          </div>

          {/* Remark Textarea (Matches Screenshot 3) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              Remark
            </label>
            <textarea
              rows={4}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Enter Remark"
              className="w-full bg-[#181B24] border border-[#272D3C] rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors resize-none leading-relaxed"
              required
            />
          </div>

          {/* Submit & Close Buttons (Matches Screenshot 3) */}
          <div className="flex justify-end items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-[#202532] hover:bg-[#2A3142] text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer border border-[#2D3548]"
            >
              Close
            </button>
          </div>

          {/* Divider Line */}
          <div className="w-full h-[1px] bg-[#222736]"></div>

          {/* Latest Follow Up Section (Matches Screenshot 3) */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide">
              Latest Follow Up
            </h4>
            <div className="bg-[#181B24] border border-[#272D3C] rounded-xl p-3.5 text-xs text-slate-300 font-normal leading-relaxed">
              {formatLatestFollowUp()}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
