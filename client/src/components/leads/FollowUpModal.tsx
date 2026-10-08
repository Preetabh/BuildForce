import React, { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { LeadItem } from '../../types';
import leadService from '../../services/lead.service';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface FollowUpModalProps {
  isOpen: boolean;
  lead: LeadItem | null;
  onClose: () => void;
  onSuccess: (updatedLead: LeadItem) => void;
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({
  isOpen,
  lead,
  onClose,
  onSuccess,
}) => {
  useEscapeKey(onClose, isOpen);

  const [isDead, setIsDead] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [stage, setStage] = useState('Meeting');
  const [remark, setRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (lead) {
      setIsDead(Boolean(lead.isDead));
      setStage(lead.stage || 'Meeting');
      setRemark('');
      setError('');

      // Set default next due date: tomorrow or latest follow-up date
      const d = lead.latestFollowUp?.date
        ? new Date(lead.latestFollowUp.date)
        : new Date(Date.now() + 24 * 60 * 60 * 1000);
      setDueDate(d.toISOString().split('T')[0]);
    }
  }, [lead, isOpen]);

  if (!isOpen || !lead) return null;

  // Format date helper for DD-MM-YYYY
  const formatDDMMYYYY = (dateStr?: string | Date) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return String(dateStr);
    }
  };

  // Format timestamp e.g. "29-Sep-2026 12:50 PM"
  const formatFollowUpTimestamp = (dateStr?: string | Date) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const day = d.getDate();
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      const month = monthNames[d.getMonth()];
      const year = d.getFullYear();
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
    } catch {
      return String(dateStr);
    }
  };

  // Service name display
  const serviceDisplay =
    lead.serviceItems?.[0]?.service ||
    (lead.requirements && lead.requirements.length > 0
      ? lead.requirements.join(', ')
      : 'Construction Furnished');

  // Reference display
  let referenceDisplay = '-';
  if (lead.referenceType === 'Social Media') {
    referenceDisplay = `Social Media: ${lead.referenceDetails?.channel || 'Facebook'}`;
  } else if (lead.referenceType === 'Associate') {
    referenceDisplay = `Associate: ${lead.referenceDetails?.partnerName || 'Partner'}`;
  } else if (lead.referenceType === 'Employee') {
    referenceDisplay = `Employee: ${lead.referenceDetails?.employeeName || 'Staff'}`;
  } else if (lead.referenceType) {
    referenceDisplay = lead.referenceType;
  }

  // Lead Taken By email
  const leadTakenBy = 'admin@lucknowbuilders.com';

  // Latest follow up info
  const latestEntry =
    lead.followUps && lead.followUps.length > 0
      ? lead.followUps[lead.followUps.length - 1]
      : null;

  const latestRemarkText =
    latestEntry?.remarks ||
    lead.latestFollowUp?.remarks ||
    (lead.meetingDateTime
      ? `Meeting scheduled for ${new Date(lead.meetingDateTime).toLocaleDateString()}`
      : 'No previous follow up recorded.');

  const latestTimestamp = latestEntry?.createdAt
    ? formatFollowUpTimestamp(latestEntry.createdAt)
    : lead.latestFollowUp?.date
    ? formatFollowUpTimestamp(lead.latestFollowUp.date)
    : formatFollowUpTimestamp(lead.leadDate);

  const latestAuthor = latestEntry?.createdByName || leadTakenBy;

  // Handle standard follow-up submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!remark.trim()) {
      setError('Please enter a remark before submitting.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const updated = await leadService.addFollowUp(lead._id, {
        date: dueDate,
        remarks: remark.trim(),
        stage: isDead ? 'Dead' : stage,
        isDead: isDead,
      });
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update follow up');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Mark as Dead button click
  const handleMarkDead = async () => {
    const deadReasonText = remark.trim() || 'Client not responsive / not interested';
    setIsSubmitting(true);
    setError('');

    try {
      const updated = await leadService.markDead(lead._id, deadReasonText);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to mark lead as dead');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#141518] border border-[#272830] rounded-2xl w-full max-w-lg text-slate-200 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#22232a] flex items-center justify-between bg-[#17181c]">
          <h2 className="font-bold text-white text-base tracking-wide">
            Follow Up Detail [ {lead.leadCode} ] : {formatDDMMYYYY(lead.leadDate)}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#23242c] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 bg-red-950/70 border border-red-500/40 rounded-xl text-red-200 text-xs">
              {error}
            </div>
          )}

          {/* Metadata Two-Column Grid */}
          <div className="grid grid-cols-2 gap-y-3.5 gap-x-4 text-xs">
            {/* Row 1 */}
            <div>
              <div className="text-[#e5a919] font-bold text-[11px] uppercase tracking-wide mb-1">
                BUSINESS NAME
              </div>
              <div className="text-white font-medium text-xs truncate">
                {lead.businessName || lead.targetCompanyName || '-'}
              </div>
            </div>

            <div>
              <div className="text-[#e5a919] font-bold text-[11px] uppercase tracking-wide mb-1">
                SERVICE
              </div>
              <div className="text-white font-medium text-xs truncate">
                {serviceDisplay}
              </div>
            </div>

            {/* Row 2 */}
            <div>
              <div className="text-[#e5a919] font-bold text-[11px] uppercase tracking-wide mb-1">
                ADDRESS
              </div>
              <div className="text-white font-medium text-xs truncate">
                {lead.permanentAddress || lead.siteLocation || '-'}
              </div>
            </div>

            <div>
              <div className="text-[#e5a919] font-bold text-[11px] uppercase tracking-wide mb-1">
                CONTACT
              </div>
              <div className="text-white font-medium text-xs font-mono">
                {lead.mobile1 || '-'}
              </div>
            </div>

            {/* Row 3 */}
            <div>
              <div className="text-[#e5a919] font-bold text-[11px] uppercase tracking-wide mb-1">
                EMAIL
              </div>
              <div className="text-white font-medium text-xs truncate">
                {lead.email || '-'}
              </div>
            </div>

            <div>
              <div className="text-[#e5a919] font-bold text-[11px] uppercase tracking-wide mb-1">
                REFERENCE
              </div>
              <div className="text-white font-medium text-xs truncate">
                {referenceDisplay}
              </div>
            </div>

            {/* Row 4: Lead Taken By (full width span) */}
            <div className="col-span-2 pt-1">
              <div className="text-[#e5a919] font-bold text-[11px] uppercase tracking-wide mb-1">
                LEAD TAKEN BY
              </div>
              <div className="text-white font-medium text-xs">
                {leadTakenBy}
              </div>
            </div>
          </div>

          {/* Form Actions Section */}
          <form onSubmit={handleSubmit} className="pt-2 space-y-3">
            {/* Is Dead & Due Date */}
            <div className="flex items-center justify-between gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isDead}
                  onChange={(e) => setIsDead(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#101114] border border-[#353642] text-red-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-red-500"
                />
                <span className="text-xs font-semibold text-white">Is Dead?</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">Due Date</span>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="bg-[#101114] border border-[#2e303b] focus:border-[#e5a919] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none cursor-pointer transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Stage Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full bg-[#101114] border border-[#2e303b] focus:border-[#e5a919] rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none cursor-pointer transition-colors"
              >
                <option value="Meeting">Meeting</option>
                <option value="Site Visit">Site Visit</option>
                <option value="Lead">Lead</option>
                <option value="Quotation">Quotation</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Client">Client</option>
                <option value="Dead">Dead</option>
              </select>
            </div>

            {/* Remark Textarea */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Remark
              </label>
              <textarea
                rows={3}
                required
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Enter Remark"
                className="w-full bg-[#101114] border border-[#2e303b] focus:border-[#e5a919] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Action Buttons: Dead | Submit | Close */}
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleMarkDead}
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-[#ef4444] hover:bg-[#dc2626] text-white font-semibold text-xs rounded-lg shadow-sm transition-colors"
              >
                Dead
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-1.5 bg-[#e5a919] hover:bg-[#d49713] text-slate-950 font-bold text-xs rounded-lg shadow-sm transition-colors"
              >
                {isSubmitting ? 'Saving...' : 'Submit'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-[#23242c] hover:bg-[#2c2d38] border border-[#353642] text-slate-300 font-semibold text-xs rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </form>

          {/* Latest Follow Up Card */}
          <div className="pt-2">
            <div className="text-[#e5a919] font-bold text-xs mb-2">
              Latest Follow Up
            </div>
            <div className="bg-[#101114] border border-[#26272f] rounded-xl p-3.5 space-y-1.5">
              <div className="text-white text-xs font-normal leading-relaxed">
                {latestRemarkText}
              </div>
              <div className="text-[10.5px] text-slate-400">
                {latestAuthor} {latestTimestamp ? `(${latestTimestamp})` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
