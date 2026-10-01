import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  IndianRupee,
  CheckCircle,
  FileText,
  Clock,
  UserCheck,
} from 'lucide-react';
import { ClientRecord, PaymentItem } from '../../types';
import leadService from '../../services/lead.service';

export const PayAmountPage: React.FC = () => {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [recentPayments, setRecentPayments] = useState<PaymentItem[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [purpose, setPurpose] = useState('Advance Booking');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cData, pData] = await Promise.all([
        leadService.getClients(),
        leadService.getPayments(),
      ]);
      setClients(cData);
      setRecentPayments(pData.slice(0, 10));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setErrorMsg('Please specify a valid payment amount.');
      return;
    }
    if (!clientName.trim()) {
      setErrorMsg('Please select or enter client name.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await leadService.recordPayment({
        clientId: selectedClientId || undefined,
        clientName: clientName.trim(),
        amount: Number(amount),
        paymentDate,
        paymentMode: paymentMode as any,
        transactionRef: transactionRef.trim(),
        purpose,
        notes: notes.trim(),
      });

      setSuccessMsg(`Payment of ₹${Number(amount).toLocaleString()} recorded successfully (Receipt: ${res.receiptNo})`);
      setAmount('');
      setTransactionRef('');
      setNotes('');
      loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Payment recording failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedClientObj = clients.find((c) => c._id === selectedClientId);

  return (
    <div className="min-h-screen bg-[#0D1017] text-slate-200 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
          <span>Admin</span>
          <span>/</span>
          <span>Lead Management</span>
          <span>/</span>
          <span className="text-amber-400 font-semibold">Pay Amount</span>
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-amber-400" />
          <span>Pay Amount • Client Billing Terminal</span>
        </h2>
        <p className="text-xs text-slate-400">
          Accept client payments, disburse milestones, and issue instantaneous verification vouchers
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Payment Collection Terminal */}
        <div className="lg:col-span-7 bg-[#10141F] border border-[#1E2638] rounded-3xl p-6 shadow-2xl">
          <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-amber-400" />
            <span>Collect Client Payment</span>
          </h3>

          {successMsg && (
            <div className="mb-4 p-3.5 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-3.5 bg-red-950/60 border border-red-500/40 rounded-2xl text-red-200 text-xs">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Client selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Select Client Account *
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => handleClientChange(e.target.value)}
                className="w-full bg-[#161C2C] border border-[#2B354C] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="">-- Choose Registered Client or Enter Custom --</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.clientCode} • {c.name} ({c.siteLocation})
                  </option>
                ))}
              </select>

              {!selectedClientId && (
                <input
                  type="text"
                  placeholder="Or enter client name manually"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="mt-2 w-full bg-[#161C2C] border border-[#2B354C] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              )}
            </div>

            {/* Selected Client Ledger Snapshot */}
            {selectedClientObj && (
              <div className="p-3 bg-[#151B2A] border border-[#222E48] rounded-xl grid grid-cols-3 gap-2 text-xs text-center">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Agreed Value</p>
                  <p className="font-bold text-white font-mono mt-0.5">
                    ₹{selectedClientObj.agreedAmount?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Total Paid</p>
                  <p className="font-bold text-emerald-400 font-mono mt-0.5">
                    ₹{selectedClientObj.paidAmount?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Remaining Due</p>
                  <p className="font-bold text-amber-400 font-mono mt-0.5">
                    ₹{selectedClientObj.balanceAmount?.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

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
                  placeholder="e.g. 500000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[#161C2C] border border-[#2B354C] rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-amber-400"
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
                  className="w-full bg-[#161C2C] border border-[#2B354C] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Mode & Ref */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full bg-[#161C2C] border border-[#2B354C] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="Cash">Cash Receipt</option>
                  <option value="Cheque">Bank Cheque</option>
                  <option value="NEFT/RTGS">NEFT / RTGS</option>
                  <option value="Bank Transfer">Direct Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Transaction / UTR Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR123456789 or Cheque #004"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full bg-[#161C2C] border border-[#2B354C] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Payment Stage / Purpose
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full bg-[#161C2C] border border-[#2B354C] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="Advance Booking">Advance Booking / Token</option>
                <option value="Milestone 1 - Foundation Complete">Milestone 1 - Foundation Complete</option>
                <option value="Milestone 2 - Plinth & Column Cast">Milestone 2 - Plinth & Column Cast</option>
                <option value="Milestone 3 - Roof Slab Casting">Milestone 3 - Roof Slab Casting</option>
                <option value="Milestone 4 - Brickwork & Plastering">Milestone 4 - Brickwork & Plastering</option>
                <option value="Milestone 5 - Flooring & Tile Work">Milestone 5 - Flooring & Tile Work</option>
                <option value="Milestone 6 - Finishing & Handover">Milestone 6 - Finishing & Handover</option>
                <option value="Extra Work & Revisions">Extra Work & Revisions</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Notes & Remarks
              </label>
              <input
                type="text"
                placeholder="Optional remarks..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#161C2C] border border-[#2B354C] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#D97706] hover:bg-[#F59E0B] disabled:opacity-50 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle className="w-5 h-5 stroke-[2.5]" />
              <span>{isSubmitting ? 'Recording Payment...' : 'Confirm & Generate Receipt'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Recent Activity & Receipts */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#10141F] border border-[#1E2638] rounded-3xl p-5 shadow-2xl">
            <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Recent Payment Collections</span>
            </h3>

            {recentPayments.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">
                No recent payments recorded.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                {recentPayments.map((p) => (
                  <div
                    key={p._id}
                    className="p-3 bg-[#151B2A] border border-[#222E48] rounded-2xl text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-cyan-400 font-bold">{p.receiptNo}</span>
                      <span className="font-black text-emerald-400 font-mono text-sm">
                        ₹{p.amount?.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="font-bold text-white">{p.clientName}</span>
                      <span className="px-2 py-0.2 rounded text-[10px] bg-[#1E283D] text-slate-300">
                        {p.paymentMode}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-[#1C2538]">
                      <span className="text-amber-300/80">{p.purpose}</span>
                      <span>
                        {new Date(p.paymentDate).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
