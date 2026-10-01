import React, { useState, useEffect } from 'react';
import { X, CreditCard, IndianRupee, CheckCircle } from 'lucide-react';
import { ClientRecord } from '../../types';
import leadService from '../../services/lead.service';

interface PayAmountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultClient?: ClientRecord | null;
}

const PAYMENT_MODES = ['UPI', 'Cash', 'Cheque', 'NEFT/RTGS', 'Bank Transfer'];

const PURPOSES = [
  'Advance Booking',
  'Milestone 1 - Foundation Complete',
  'Milestone 2 - Plinth & Column Cast',
  'Milestone 3 - Roof Slab Casting',
  'Milestone 4 - Brickwork & Plastering',
  'Milestone 5 - Electrical & Plumbing Rough-in',
  'Milestone 6 - Flooring & Tile Work',
  'Milestone 7 - Paint & Finishing Handover',
  'Architectural & Interior Design Fee',
  'Material Surcharge / Extra Work',
];

export const PayAmountModal: React.FC<PayAmountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultClient,
}) => {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [purpose, setPurpose] = useState('Advance Booking');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadClients();
      if (defaultClient) {
        setSelectedClientId(defaultClient._id);
        setClientName(defaultClient.name);
      } else {
        setSelectedClientId('');
        setClientName('');
      }
      setAmount('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentMode('UPI');
      setTransactionRef('');
      setPurpose('Advance Booking');
      setNotes('');
      setError('');
    }
  }, [isOpen, defaultClient]);

  const loadClients = async () => {
    try {
      const data = await leadService.getClients();
      setClients(data);
    } catch {
      // Ignored
    }
  };

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    const found = clients.find((c) => c._id === clientId);
    if (found) {
      setClientName(found.name);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }
    if (!clientName.trim()) {
      setError('Please select or specify client name.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await leadService.recordPayment({
        clientId: selectedClientId || undefined,
        clientName: clientName.trim(),
        amount: Number(amount),
        paymentDate,
        paymentMode: paymentMode as any,
        transactionRef: transactionRef.trim(),
        purpose,
        notes: notes.trim(),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#121622] border border-[#232B3E] rounded-3xl w-full max-w-lg text-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#1E2638] flex items-center justify-between bg-gradient-to-r from-[#172233] to-[#121622]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Record Payment (Pay Amount)</h3>
              <p className="text-xs text-slate-400">Issue official payment receipt to client account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#1A2234] text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-200 text-xs">
              {error}
            </div>
          )}

          {/* Client Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Select Client Account <span className="text-red-400">*</span>
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => handleClientChange(e.target.value)}
              className="w-full bg-[#182030] border border-[#2A354C] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            >
              <option value="">-- Choose Registered Client or Enter Custom --</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.clientCode} • {c.name} ({c.siteLocation}) - Bal: ₹{c.balanceAmount?.toLocaleString() || 0}
                </option>
              ))}
            </select>
            {!selectedClientId && (
              <input
                type="text"
                placeholder="Or enter client name manually"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="mt-2 w-full bg-[#182030] border border-[#2A354C] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            )}
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-amber-400" /> Amount Received ₹ *
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 250000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#182030] border border-[#2A354C] rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full bg-[#182030] border border-[#2A354C] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Payment Mode & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full bg-[#182030] border border-[#2A354C] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                {PAYMENT_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                UTR / Cheque / Ref No.
              </label>
              <input
                type="text"
                placeholder="e.g. UPI/123456789 or CHQ-0045"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="w-full bg-[#182030] border border-[#2A354C] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Purpose Milestone */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Payment Purpose / Stage Milestone
            </label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full bg-[#182030] border border-[#2A354C] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            >
              {PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Remarks / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Received via PhonePe against invoice #2026-10"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#182030] border border-[#2A354C] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#1E2638] flex items-center justify-end gap-2">
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
              className="px-6 py-2 bg-[#D97706] hover:bg-[#F59E0B] text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/25 flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4 stroke-[2.5]" />
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
