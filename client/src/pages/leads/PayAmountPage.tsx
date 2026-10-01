import React, { useState, useEffect } from 'react';
import {
  Coins,
  IndianRupee,
  CheckCircle,
  Clock,
  UserCheck,
  Handshake,
  AlertCircle,
  FileCheck,
  Send,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { PartnerItem, CommissionItem, PartnerPayoutItem } from '../../types';
import leadService from '../../services/lead.service';

export const PayAmountPage: React.FC = () => {
  const [partners, setPartners] = useState<PartnerItem[]>([]);
  const [commissions, setCommissions] = useState<CommissionItem[]>([]);
  const [payouts, setPayouts] = useState<PartnerPayoutItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [selectedCommissionId, setSelectedCommissionId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Tab switch
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [partnersData, commData, payoutsData] = await Promise.all([
        leadService.getPartners(),
        leadService.getCommissionReports(),
        leadService.getPayouts(),
      ]);
      setPartners(partnersData || []);
      setCommissions(commData.reports || []);
      setPayouts(payoutsData || []);
    } catch (err) {
      console.error('Failed to load payout data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPartner = partners.find((p) => p._id === selectedPartnerId);

  // Filter commissions for selected partner
  const partnerCommissions = selectedPartnerId
    ? commissions.filter(
        (c) =>
          (typeof c.partnerId === 'string' ? c.partnerId : c.partnerId?._id) ===
            selectedPartnerId &&
          (c.status === 'Pending' || c.status === 'Approved' || (c.balanceAmount && c.balanceAmount > 0))
      )
    : [];

  const selectedCommission = commissions.find((c) => c._id === selectedCommissionId);

  // Handle partner selection
  const handlePartnerSelect = (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    setSelectedCommissionId('');
    setAmount('');
  };

  // Handle commission selection
  const handleCommissionSelect = (commId: string) => {
    setSelectedCommissionId(commId);
    const comm = commissions.find((c) => c._id === commId);
    if (comm) {
      const bal =
        comm.balanceAmount !== undefined
          ? comm.balanceAmount
          : comm.status === 'Paid'
          ? 0
          : comm.commissionAmount;
      setAmount(String(bal));
    }
  };

  // Quick action from the pending commissions table
  const handleQuickPay = (comm: CommissionItem) => {
    const pId = typeof comm.partnerId === 'string' ? comm.partnerId : comm.partnerId?._id;
    if (pId) {
      setSelectedPartnerId(pId);
    }
    setSelectedCommissionId(comm._id);
    const bal =
      comm.balanceAmount !== undefined
        ? comm.balanceAmount
        : comm.status === 'Paid'
        ? 0
        : comm.commissionAmount;
    setAmount(String(bal));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApprove = async (commId: string) => {
    try {
      await leadService.approveCommission(commId);
      loadAllData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve commission');
    }
  };

  const handleSubmitPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnerId) {
      setErrorMsg('Please select a reference partner to disburse payout.');
      return;
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setErrorMsg('Please enter a valid payout amount.');
      return;
    }

    if (selectedCommission) {
      const maxAllowed =
        selectedCommission.balanceAmount !== undefined
          ? selectedCommission.balanceAmount
          : selectedCommission.commissionAmount;
      if (numAmount > maxAllowed) {
        setErrorMsg(
          `Overpayment prevented: Requested ₹${numAmount.toLocaleString()} exceeds commission balance of ₹${maxAllowed.toLocaleString()}`
        );
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await leadService.processPayout({
        partnerId: selectedPartnerId,
        commissionId: selectedCommissionId || undefined,
        amount: numAmount,
        paymentMode,
        transactionRef: transactionRef.trim(),
        notes: notes.trim(),
      });

      setSuccessMsg(
        `Payout of ₹${numAmount.toLocaleString()} disbursed successfully to ${
          selectedPartner?.name || 'partner'
        }! (Payout No: ${res.payout?.payoutNo || 'PAY-SUCCESS'})`
      );
      setAmount('');
      setSelectedCommissionId('');
      setTransactionRef('');
      setNotes('');
      loadAllData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Payout disbursement failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // KPIs
  const totalPaidOut = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingCommissionsList = commissions.filter(
    (c) => c.status !== 'Paid' || (c.balanceAmount && c.balanceAmount > 0)
  );
  const totalPendingCommissions = pendingCommissionsList.reduce(
    (sum, c) =>
      sum +
      (c.balanceAmount !== undefined
        ? c.balanceAmount
        : c.status === 'Paid'
        ? 0
        : c.commissionAmount),
    0
  );

  return (
    <div className="min-h-screen bg-[#0D1017] text-slate-200 p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <div>
        <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
          <span>Admin</span>
          <span>/</span>
          <span>Lead Management</span>
          <span>/</span>
          <span className="text-amber-400 font-semibold">Pay Amount</span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
          <Coins className="w-6 h-6 text-amber-400" />
          <span>Pay Amount • Reference Partner Payouts</span>
        </h1>
        <p className="text-xs text-slate-400">
          Disburse earned referral commissions directly to channel partners, brokers, and associates
        </p>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-4 bg-[#10141F] border border-[#1E2638] rounded-2xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Paid Out
          </p>
          <p className="text-xl font-black text-emerald-400 font-mono mt-1">
            ₹{totalPaidOut.toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-[#10141F] border border-[#1E2638] rounded-2xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Pending Commission Due
          </p>
          <p className="text-xl font-black text-amber-400 font-mono mt-1">
            ₹{totalPendingCommissions.toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-[#10141F] border border-[#1E2638] rounded-2xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Disbursed Payouts
          </p>
          <p className="text-xl font-black text-white font-mono mt-1">{payouts.length}</p>
        </div>
        <div className="p-4 bg-[#10141F] border border-[#1E2638] rounded-2xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Partner Network
          </p>
          <p className="text-xl font-black text-cyan-400 font-mono mt-1">
            {partners.length} Partners
          </p>
        </div>
      </div>

      {/* Main Grid: Form on Left, Lists on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Disburse Payout Terminal */}
        <div className="lg:col-span-5 bg-[#10141F] border border-[#1E2638] rounded-3xl p-6 shadow-2xl space-y-4">
          <h2 className="font-bold text-white text-base flex items-center gap-2">
            <Handshake className="w-5 h-5 text-amber-400" />
            <span>Disburse Commission Payout</span>
          </h2>

          {successMsg && (
            <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-red-950/60 border border-red-500/40 rounded-2xl text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmitPayout} className="space-y-4">
            {/* Partner Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Select Reference Partner <span className="text-amber-400">*</span>
              </label>
              <select
                value={selectedPartnerId}
                onChange={(e) => handlePartnerSelect(e.target.value)}
                className="w-full bg-[#161D2B] border border-[#232E42] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                required
              >
                <option value="">-- Choose Partner / Associate --</option>
                {partners.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.partnerType} • {p.commissionRatePercent || 2.5}%)
                  </option>
                ))}
              </select>
            </div>

            {/* Partner Summary Card if selected */}
            {selectedPartner && (
              <div className="p-3.5 bg-[#141A28] border border-[#20293D] rounded-2xl text-xs space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>Earned Commissions:</span>
                  <span className="font-mono font-bold text-white">
                    ₹{(selectedPartner.totalCommissionEarned || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Already Paid:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    ₹{(selectedPartner.totalCommissionPaid || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between border-t border-[#20293D] pt-1 text-slate-200 font-bold">
                  <span>Outstanding Balance:</span>
                  <span className="font-mono text-amber-400">
                    ₹{Math.max(
                      0,
                      (selectedPartner.totalCommissionEarned || 0) -
                        (selectedPartner.totalCommissionPaid || 0)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Commission Selection (Optional/Specific) */}
            {partnerCommissions.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Link to Specific Commission Voucher
                </label>
                <select
                  value={selectedCommissionId}
                  onChange={(e) => handleCommissionSelect(e.target.value)}
                  className="w-full bg-[#161D2B] border border-[#232E42] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="">All Pending Commissions (Auto-allocate)</option>
                  {partnerCommissions.map((c) => {
                    const bal =
                      c.balanceAmount !== undefined
                        ? c.balanceAmount
                        : c.status === 'Paid'
                        ? 0
                        : c.commissionAmount;
                    return (
                      <option key={c._id} value={c._id}>
                        {c.clientName} • ₹{c.commissionAmount.toLocaleString()} ({c.status}) • Bal Due: ₹{bal.toLocaleString()}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Payout Amount */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Payout Amount (₹) <span className="text-amber-400">*</span>
                </label>
                {selectedPartner && (
                  <button
                    type="button"
                    onClick={() => {
                      const maxBal = selectedCommission
                        ? selectedCommission.balanceAmount ?? selectedCommission.commissionAmount
                        : Math.max(
                            0,
                            (selectedPartner.totalCommissionEarned || 0) -
                              (selectedPartner.totalCommissionPaid || 0)
                          );
                      setAmount(String(maxBal));
                    }}
                    className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                  >
                    Pay Full Due
                  </button>
                )}
              </div>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#161D2B] border border-[#232E42] rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
            </div>

            {/* Payment Mode & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full bg-[#161D2B] border border-[#232E42] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="UPI">UPI</option>
                  <option value="NEFT/RTGS">NEFT / RTGS</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Disbursement Date
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full bg-[#161D2B] border border-[#232E42] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Transaction Ref / UTR */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Transaction Reference / UTR Number
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="e.g. UTR12984928174 or UPI Txn ID"
                className="w-full bg-[#161D2B] border border-[#232E42] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            {/* Remarks / Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Remarks / Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Disbursement details or memo..."
                className="w-full bg-[#161D2B] border border-[#232E42] rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
              <span>{isSubmitting ? 'Disbursing Payout...' : 'Disburse Payout to Partner'}</span>
            </button>
          </form>
        </div>

        {/* Right Section: Pending Commissions & Disbursed Payouts Tabs */}
        <div className="lg:col-span-7 space-y-4">
          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-[#1E2638] pb-2 overflow-x-auto custom-scrollbar whitespace-nowrap">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Commissions Ready to Disburse ({pendingCommissionsList.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Disbursed Payouts Ledger ({payouts.length})
            </button>
          </div>

          {/* TAB 1: Pending / Approved Commissions */}
          {activeTab === 'pending' && (
            <div className="bg-[#10141F] border border-[#1E2638] rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-[11px] min-w-[580px]">
                  <thead>
                    <tr className="bg-[#131825] border-b border-[#1E2638] text-[10px] font-bold text-amber-400 uppercase">
                      <th className="py-3 px-3">PARTNER</th>
                      <th className="py-3 px-3">CLIENT REFERRED</th>
                      <th className="py-3 px-3 text-right">COMMISSION</th>
                      <th className="py-3 px-3 text-right">BALANCE DUE</th>
                      <th className="py-3 px-3 text-center">STATUS</th>
                      <th className="py-3 px-3 text-center">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A2234]">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                          Loading pending commissions...
                        </td>
                      </tr>
                    ) : pendingCommissionsList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                          No pending commissions due. When clients make payments, referral commissions appear here automatically.
                        </td>
                      </tr>
                    ) : (
                      pendingCommissionsList.map((c) => {
                        const bal =
                          c.balanceAmount !== undefined
                            ? c.balanceAmount
                            : c.status === 'Paid'
                            ? 0
                            : c.commissionAmount;
                        return (
                          <tr key={c._id} className="hover:bg-[#151C2C]/80 transition-colors">
                            <td className="py-3 px-3 font-semibold text-white">
                              {c.partnerName}
                            </td>
                            <td className="py-3 px-3 text-slate-300">
                              <div>{c.clientName}</div>
                              {c.leadCode && (
                                <span className="font-mono text-[10px] text-cyan-400">
                                  Lead #{c.leadCode}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-200">
                              ₹{c.commissionAmount?.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-black text-amber-400 text-xs">
                              ₹{bal?.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  c.status === 'Approved'
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                {c.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center space-x-1 whitespace-nowrap">
                              {c.status === 'Pending' && (
                                <button
                                  onClick={() => handleApprove(c._id)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold transition cursor-pointer"
                                >
                                  Approve
                                </button>
                              )}
                              <button
                                onClick={() => handleQuickPay(c)}
                                className="px-2 py-1 bg-[#eab308] hover:bg-[#ca8a04] text-slate-950 rounded text-[10px] font-bold transition cursor-pointer"
                              >
                                Pay Now
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Disbursed Payouts Ledger */}
          {activeTab === 'history' && (
            <div className="bg-[#10141F] border border-[#1E2638] rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-[11px] min-w-[620px]">
                  <thead>
                    <tr className="bg-[#131825] border-b border-[#1E2638] text-[10px] font-bold text-amber-400 uppercase">
                      <th className="py-3 px-3">PAYOUT NO</th>
                      <th className="py-3 px-3">DATE</th>
                      <th className="py-3 px-3">PARTNER</th>
                      <th className="py-3 px-3 text-right">AMOUNT PAID</th>
                      <th className="py-3 px-3 text-center">MODE</th>
                      <th className="py-3 px-3">REFERENCE / UTR</th>
                      <th className="py-3 px-3 text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A2234]">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                          Loading payout history...
                        </td>
                      </tr>
                    ) : payouts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                          No payouts disbursed yet. Use the terminal on the left to record payments to partners.
                        </td>
                      </tr>
                    ) : (
                      payouts.map((p) => (
                        <tr key={p._id} className="hover:bg-[#151C2C]/80 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-cyan-400">
                            {p.payoutNo}
                          </td>
                          <td className="py-3 px-3 text-slate-300">
                            {new Date(p.paymentDate).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3 px-3 font-bold text-white">
                            {p.partnerName}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-emerald-400 text-xs">
                            ₹{p.amount?.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1C2538] text-slate-300 border border-[#2D3A54]">
                              {p.paymentMode}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-400">
                            {p.transactionRef || '-'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              PAID
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default PayAmountPage;
