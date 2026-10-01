import React, { useState } from 'react';
import { X, AlertTriangle, RotateCcw, Skull } from 'lucide-react';
import { ClientRecord } from '../../types';
import leadService from '../../services/lead.service';

interface ClientDeadModalProps {
  isOpen: boolean;
  client: ClientRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

const COMMON_REASONS = [
  'Budget constraints / Project on hold',
  'Client bought from another builder / competitor',
  'Plot / Land legal clearance issues',
  'Unresponsive after multiple follow-ups',
  'Client relocated / cancelled plan',
];

export const ClientDeadModal: React.FC<ClientDeadModalProps> = ({
  isOpen,
  client,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !client) return null;

  const isAlreadyDead = client.isDead;

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (isAlreadyDead) {
        await leadService.restoreClientDead(client._id);
      } else {
        await leadService.markClientDead(client._id, reason || 'Marked dead from Client List');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0F141F] border border-rose-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2638] bg-gradient-to-r from-rose-950/20 to-[#0F141F]">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isAlreadyDead ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}`}>
              {isAlreadyDead ? <RotateCcw className="w-5 h-5" /> : <Skull className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                {isAlreadyDead ? 'Restore Client Account' : 'Mark Client as Dead'}
              </h3>
              <p className="text-xs text-slate-400">
                {client.clientCode} • {client.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleAction} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
              {error}
            </div>
          )}

          {isAlreadyDead ? (
            <p className="text-xs text-slate-300 leading-relaxed">
              This client is currently marked as <strong className="text-rose-400">Dead / Inactive</strong>.
              Restoring will bring them back into the active client pipeline.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                Marking client <strong className="text-white">{client.name}</strong> as dead will archive
                their active operations. Please select or describe the reason:
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Reason for marking dead
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Budget dropped, client opted for another builder, etc."
                  className="w-full bg-[#161D2C] border border-[#232D42] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400 resize-none"
                />

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {COMMON_REASONS.map((r, i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => setReason(r)}
                      className="text-[10px] bg-[#1A2336] hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-[#26334D] px-2 py-0.5 rounded-full transition-all cursor-pointer truncate max-w-[240px]"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center gap-2 px-5 py-2 font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50 text-white ${
                isAlreadyDead
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'
              }`}
            >
              {isAlreadyDead ? <RotateCcw className="w-3.5 h-3.5" /> : <Skull className="w-3.5 h-3.5" />}
              <span>{isSubmitting ? 'Processing...' : isAlreadyDead ? 'Restore Client' : 'Mark as Dead'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
