import React, { useState, useEffect, useMemo } from 'react';
import {
  Coins,
  Search,
  CheckCircle,
  AlertCircle,
  Building2,
  CreditCard,
  Printer,
  Layers,
  Calendar,
  Phone,
  MapPin,
  RefreshCw,
  Plus,
  X,
  FileText,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { ClientRecord, PaymentItem, ClientLedgerStage } from '../../types';
import leadService from '../../services/lead.service';
import { PaymentLedgerModal } from '../../components/leads/PaymentLedgerModal';
import { PaymentReceiptModal } from '../../components/leads/PaymentReceiptModal';

const PAYMENT_MODES = ['UPI', 'Cash', 'Cheque', 'Bank Transfer', 'NEFT/RTGS'];

export const PayAmountPage: React.FC = () => {
  // Data states
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tabs: 'pending' (default) | 'all-clients' | 'history'
  const [activeTab, setActiveTab] = useState<'pending' | 'all-clients' | 'history'>('pending');

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Payment Modal state (simple popup for recording/updating payment)
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedClientForPay, setSelectedClientForPay] = useState<ClientRecord | null>(null);
  const [selectedStageId, setSelectedStageId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactionRef, setTransactionRef] = useState('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Modals for Ledger & Receipt
  const [selectedClientForLedger, setSelectedClientForLedger] = useState<ClientRecord | null>(null);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentItem | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Toast alert
  const [toastMessage, setToastMessage] = useState<{ text: string; receipt?: PaymentItem } | null>(null);

  const showToast = (text: string, receipt?: PaymentItem) => {
    setToastMessage({ text, receipt });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.receipt ? prev : null));
    }, 6000);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [clientsData, paymentsData] = await Promise.all([
        leadService.getClients({ statusMode: 'NonDead' }).catch(() => []),
        leadService.getPayments({ limit: 100 }).catch(() => []),
      ]);
      setClients(clientsData || []);
      setPayments(paymentsData || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Due calculation helper
  const getDueAmount = (c: ClientRecord): number => {
    if (c.balanceAmount !== undefined && c.balanceAmount !== null && c.balanceAmount > 0) {
      return c.balanceAmount;
    }
    const agreed = c.agreedAmount || 0;
    const paid = c.paidAmount || 0;
    return Math.max(0, agreed - paid);
  };

  // Next pending stage helper
  const getNextStage = (c: ClientRecord): ClientLedgerStage | null => {
    if (!c.ledgerStages || c.ledgerStages.length === 0) return null;
    return c.ledgerStages.find((s) => (s.due || 0) > 0 || s.status === 'Pending' || s.status === 'Partial') || null;
  };

  // Open simple payment modal for a client
  const openPayModal = (client?: ClientRecord, stage?: ClientLedgerStage) => {
    setModalError('');
    if (client) {
      setSelectedClientForPay(client);
      const due = getDueAmount(client);
      const targetStage = stage || getNextStage(client);

      if (targetStage) {
        setSelectedStageId(targetStage._id ? String(targetStage._id) : targetStage.stageName);
        setPayAmount(String(targetStage.due || due || ''));
        setPurpose(targetStage.stageName);
      } else {
        setSelectedStageId('');
        setPayAmount(due > 0 ? String(due) : '');
        setPurpose(due > 0 ? 'Milestone Payment' : 'Advance Booking');
      }
    } else {
      // No client pre-selected (clicking "+ Record Payment" at top)
      const firstWithDue = clients.find((c) => getDueAmount(c) > 0) || clients[0] || null;
      setSelectedClientForPay(firstWithDue);
      if (firstWithDue) {
        const due = getDueAmount(firstWithDue);
        const targetStage = getNextStage(firstWithDue);
        if (targetStage) {
          setSelectedStageId(targetStage._id ? String(targetStage._id) : targetStage.stageName);
          setPayAmount(String(targetStage.due || due || ''));
          setPurpose(targetStage.stageName);
        } else {
          setSelectedStageId('');
          setPayAmount(due > 0 ? String(due) : '');
          setPurpose(due > 0 ? 'Milestone Payment' : 'Advance Booking');
        }
      } else {
        setSelectedStageId('');
        setPayAmount('');
        setPurpose('');
      }
    }

    setPaymentMode('UPI');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setTransactionRef('');
    setNotes('');
    setIsPayModalOpen(true);
  };

  // When user selects a different client inside modal
  const handleModalClientChange = (clientId: string) => {
    const c = clients.find((item) => item._id === clientId) || null;
    setSelectedClientForPay(c);
    if (c) {
      const due = getDueAmount(c);
      const targetStage = getNextStage(c);
      if (targetStage) {
        setSelectedStageId(targetStage._id ? String(targetStage._id) : targetStage.stageName);
        setPayAmount(String(targetStage.due || due || ''));
        setPurpose(targetStage.stageName);
      } else {
        setSelectedStageId('');
        setPayAmount(due > 0 ? String(due) : '');
        setPurpose(due > 0 ? 'Milestone Payment' : 'Advance Booking');
      }
    } else {
      setSelectedStageId('');
      setPayAmount('');
      setPurpose('');
    }
  };

  // When user selects a different stage inside modal
  const handleModalStageChange = (stageId: string) => {
    setSelectedStageId(stageId);
    if (!selectedClientForPay) return;

    if (!stageId) {
      const due = getDueAmount(selectedClientForPay);
      setPayAmount(due > 0 ? String(due) : '');
      setPurpose('Milestone Payment');
      return;
    }

    const stage = selectedClientForPay.ledgerStages?.find(
      (s) => String(s._id) === stageId || s.stageName === stageId
    );
    if (stage) {
      setPayAmount(String(stage.due || stage.amount || 0));
      setPurpose(stage.stageName);
    }
  };

  // Handle submit payment
  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientForPay) {
      setModalError('Please select a client.');
      return;
    }

    const numAmount = Number(payAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setModalError('Please enter a valid amount greater than ₹0.');
      return;
    }

    setIsSubmitting(true);
    setModalError('');

    try {
      const createdPayment = await leadService.recordPayment({
        clientId: selectedClientForPay._id,
        clientName: selectedClientForPay.name,
        amount: numAmount,
        paymentDate,
        paymentMode: paymentMode as any,
        transactionRef: transactionRef.trim(),
        purpose: purpose.trim() || 'Milestone Stage Payment',
        notes: notes.trim(),
        serviceName: selectedClientForPay.services || 'Construction',
      });

      setIsPayModalOpen(false);
      showToast(
        `₹${numAmount.toLocaleString()} payment recorded for ${selectedClientForPay.name}!`,
        createdPayment
      );

      await loadData();
    } catch (err: any) {
      setModalError(err.response?.data?.message || err.message || 'Payment recording failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Totals
  const pendingClients = useMemo(() => {
    return clients.filter((c) => getDueAmount(c) > 0);
  }, [clients]);

  const totalPendingDue = clients.reduce((sum, c) => sum + getDueAmount(c), 0);
  const totalPaidAmount = clients.reduce((sum, c) => sum + (c.paidAmount || 0), 0);
  const totalContractValue = clients.reduce((sum, c) => sum + (c.agreedAmount || 0), 0);

  // Filter list based on tab & search
  const displayedClients = useMemo(() => {
    const baseList = activeTab === 'pending' ? pendingClients : clients;
    if (!searchQuery.trim()) return baseList;

    const q = searchQuery.toLowerCase().trim();
    return baseList.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.clientCode && c.clientCode.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.siteLocation && c.siteLocation.toLowerCase().includes(q)) ||
        (c.services && c.services.toLowerCase().includes(q))
    );
  }, [activeTab, pendingClients, clients, searchQuery]);

  // Filter payment history
  const displayedHistory = useMemo(() => {
    if (!searchQuery.trim()) return payments;
    const q = searchQuery.toLowerCase().trim();
    return payments.filter(
      (p) =>
        p.clientName?.toLowerCase().includes(q) ||
        p.receiptNo?.toLowerCase().includes(q) ||
        p.purpose?.toLowerCase().includes(q) ||
        p.paymentMode?.toLowerCase().includes(q)
    );
  }, [payments, searchQuery]);

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-200 p-4 sm:p-6 space-y-5">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-[#111927] border border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-top-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs font-semibold">{toastMessage.text}</div>
          {toastMessage.receipt && (
            <button
              onClick={() => {
                setSelectedReceipt(toastMessage.receipt!);
                setIsReceiptModalOpen(true);
              }}
              className="ml-2 px-2.5 py-1 bg-emerald-500 text-slate-950 font-bold text-[11px] rounded-lg hover:bg-emerald-400 transition cursor-pointer flex items-center gap-1"
            >
              <Printer className="w-3 h-3" />
              <span>Receipt</span>
            </button>
          )}
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white text-xs ml-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold text-amber-500 flex items-center gap-1.5 uppercase tracking-wider">
            <span>Admin</span>
            <span className="text-slate-600">/</span>
            <span>Lead Management</span>
            <span className="text-slate-600">/</span>
            <span className="text-amber-400">Pay Amount</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2.5">
            <Coins className="w-7 h-7 text-amber-400 stroke-[2.2]" />
            <span>Pending Payments & Update</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Yaha se client ke pending payments dekhe aur 1-click me update / record kare
          </p>
        </div>

        {/* Big Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2.5 bg-[#141A28] hover:bg-[#1E2638] text-slate-300 hover:text-white border border-[#232E42] rounded-xl transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          <button
            onClick={() => openPayModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Record / Update Payment</span>
          </button>
        </div>
      </div>

      {/* 3 Simple KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Pending Due */}
        <div className="p-4 sm:p-5 bg-[#131016] border border-rose-500/30 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Total Pending Due
            </span>
            <div className="text-2xl sm:text-3xl font-black text-rose-300 font-mono mt-1">
              ₹{totalPendingDue.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              <span className="font-bold text-rose-400">{pendingClients.length} clients</span> ka payment bacha hai
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        {/* Total Collected */}
        <div className="p-4 sm:p-5 bg-[#0E1715] border border-emerald-500/30 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Total Received / Paid
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono mt-1">
              ₹{totalPaidAmount.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Total collected so far
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Total Contract Value */}
        <div className="p-4 sm:p-5 bg-[#121622] border border-[#1E2638] rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              Total Contract Value
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
              ₹{totalContractValue.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Across {clients.length} client accounts
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-[#121622] border border-[#1E2638] rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
        {/* Navigation Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E2638] pb-4">
          <div className="flex items-center gap-2 text-xs font-bold">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'bg-[#181F2E] text-slate-400 hover:text-white'
              }`}
            >
              <span>Pending Payments Only</span>
              <span className="px-1.5 py-0.2 rounded-md bg-rose-500/30 text-rose-200 text-[10px]">
                {pendingClients.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('all-clients')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition cursor-pointer ${
                activeTab === 'all-clients'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'bg-[#181F2E] text-slate-400 hover:text-white'
              }`}
            >
              <span>All Clients</span>
              <span className="px-1.5 py-0.2 rounded-md bg-[#232E42] text-slate-300 text-[10px]">
                {clients.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-[#181F2E] text-slate-400 hover:text-white'
              }`}
            >
              <span>Payment History</span>
              <span className="px-1.5 py-0.2 rounded-md bg-[#232E42] text-slate-300 text-[10px]">
                {payments.length}
              </span>
            </button>
          </div>

          {/* Simple Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search client, mobile, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#181F2E] border border-[#232E42] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Tab Content: Clients Table (Pending or All) */}
        {activeTab !== 'history' && (
          <div>
            {displayedClients.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-base">Koi Pending Payment Nahi Hai!</h3>
                <p className="text-xs text-slate-400">
                  Sabhi clients ke payments clear hain ya search se koi match nahi hua.
                </p>
                <button
                  onClick={() => {
                    setActiveTab('all-clients');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 bg-[#1A2234] hover:bg-[#232E42] text-amber-400 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Sabhi Clients Dekhe
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[#1E2638]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#0E121B] text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-[#1E2638]">
                      <th className="py-3 px-4">Client Name & Details</th>
                      <th className="py-3 px-4">Service</th>
                      <th className="py-3 px-4">Contract Value</th>
                      <th className="py-3 px-4">Paid So Far</th>
                      <th className="py-3 px-4">Pending Due</th>
                      <th className="py-3 px-4">Next Due Milestone</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A2234]">
                    {displayedClients.map((c) => {
                      const due = getDueAmount(c);
                      const nextStage = getNextStage(c);

                      return (
                        <tr key={c._id} className="hover:bg-[#161D2B] transition">
                          {/* Client Name & Mobile */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>{c.name}</span>
                              {c.clientCode && (
                                <span className="font-mono text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20">
                                  {c.clientCode}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="font-mono">{c.phone || '-'}</span>
                              <span>•</span>
                              <span>{c.siteLocation || '-'}</span>
                            </div>
                          </td>

                          {/* Service */}
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-[#181F2E] text-slate-300 border border-[#232E42]">
                              {c.services || 'Construction'}
                            </span>
                          </td>

                          {/* Contract Value */}
                          <td className="py-3.5 px-4 font-mono font-bold text-white">
                            ₹{(c.agreedAmount || 0).toLocaleString()}
                          </td>

                          {/* Paid So Far */}
                          <td className="py-3.5 px-4 font-mono text-emerald-400 font-semibold">
                            ₹{(c.paidAmount || 0).toLocaleString()}
                          </td>

                          {/* Pending Due Amount */}
                          <td className="py-3.5 px-4">
                            {due > 0 ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-black text-rose-300 text-sm">
                                  ₹{due.toLocaleString()}
                                </span>
                                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-rose-500/20 text-rose-300 rounded">
                                  Due
                                </span>
                              </div>
                            ) : (
                              <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Paid (₹0)</span>
                              </span>
                            )}
                          </td>

                          {/* Next Due Milestone */}
                          <td className="py-3.5 px-4">
                            {nextStage ? (
                              <div>
                                <div className="font-semibold text-slate-200 text-xs truncate max-w-[200px]" title={nextStage.stageName}>
                                  {nextStage.stageName}
                                </div>
                                <div className="text-[11px] text-amber-400 font-mono font-bold">
                                  Stage Due: ₹{(nextStage.due || 0).toLocaleString()}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-xs">
                                {due > 0 ? 'General Milestone' : 'All Clear'}
                              </span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openPayModal(c, nextStage || undefined)}
                                className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-xs hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer shadow-md shadow-amber-500/20 flex items-center gap-1.5"
                              >
                                <CreditCard className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Update Payment</span>
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedClientForLedger(c);
                                  setIsLedgerModalOpen(true);
                                }}
                                className="p-1.5 rounded-xl bg-[#181F2E] hover:bg-[#232E42] text-slate-300 hover:text-white border border-[#232E42] transition cursor-pointer"
                                title="View full Milestone Ledger Schedule"
                              >
                                <Layers className="w-4 h-4 text-amber-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Payment History */}
        {activeTab === 'history' && (
          <div>
            {displayedHistory.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No payment transactions recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[#1E2638]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#0E121B] text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-[#1E2638]">
                      <th className="py-3 px-4">Receipt No</th>
                      <th className="py-3 px-4">Client Name</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Payment Mode</th>
                      <th className="py-3 px-4">Purpose / Stage</th>
                      <th className="py-3 px-4">Amount Paid</th>
                      <th className="py-3 px-4 text-right">Receipt Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A2234]">
                    {displayedHistory.map((p) => {
                      const formattedDate = new Date(p.paymentDate).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      });

                      return (
                        <tr key={p._id} className="hover:bg-[#161D2B] transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                            {p.receiptNo}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-white">{p.clientName}</td>
                          <td className="py-3.5 px-4 text-slate-300">{formattedDate}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#181F2E] text-slate-300 border border-[#232E42]">
                              {p.paymentMode || 'UPI'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">{p.purpose || 'Milestone Payment'}</td>
                          <td className="py-3.5 px-4 font-mono font-black text-emerald-400 text-sm">
                            ₹{(p.amount || 0).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedReceipt(p);
                                setIsReceiptModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-[#1A2234] hover:bg-[#232E42] text-amber-400 hover:text-amber-300 font-bold rounded-lg text-xs border border-amber-500/30 transition cursor-pointer flex items-center gap-1.5 ml-auto"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>View Receipt</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SIMPLE, CLEAN PAYMENT MODAL (Easy & Fast) */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#121622] border border-[#232B3E] rounded-3xl w-full max-w-lg text-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#1E2638] flex items-center justify-between bg-gradient-to-r from-[#172233] to-[#121622]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Update / Collect Payment</h3>
                  <p className="text-xs text-slate-400">Payment record kare aur balance update kare</p>
                </div>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="p-1.5 rounded-full bg-[#1A2234] text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConfirmPayment} className="p-5 space-y-4">
              {modalError && (
                <div className="p-3 bg-rose-950/70 border border-rose-500/40 rounded-xl text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Client Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Client <span className="text-amber-400">*</span>
                </label>
                <select
                  value={selectedClientForPay?._id || ''}
                  onChange={(e) => handleModalClientChange(e.target.value)}
                  className="w-full bg-[#181F2E] border border-[#232E42] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-semibold"
                  required
                >
                  <option value="">-- Choose Client --</option>
                  {clients.map((c) => {
                    const due = getDueAmount(c);
                    return (
                      <option key={c._id} value={c._id}>
                        {c.name} {c.clientCode ? `(${c.clientCode})` : ''} — {due > 0 ? `₹${due.toLocaleString()} Due` : 'Paid'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Client Info Banner inside Modal */}
              {selectedClientForPay && (
                <div className="p-3.5 bg-[#181F2E] border border-[#232E42] rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Total Contract</span>
                    <span className="font-mono font-bold text-white text-xs">
                      ₹{(selectedClientForPay.agreedAmount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-emerald-400 block text-[11px]">Paid Amount</span>
                    <span className="font-mono font-bold text-emerald-400 text-xs">
                      ₹{(selectedClientForPay.paidAmount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-rose-400 block text-[11px] font-bold">Pending Due</span>
                    <span className="font-mono font-black text-rose-300 text-sm">
                      ₹{getDueAmount(selectedClientForPay).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Milestone Stage Selector (if client has stages) */}
              {selectedClientForPay?.ledgerStages && selectedClientForPay.ledgerStages.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Milestone Stage
                  </label>
                  <select
                    value={selectedStageId}
                    onChange={(e) => handleModalStageChange(e.target.value)}
                    className="w-full bg-[#181F2E] border border-[#232E42] rounded-xl px-3 py-2 text-xs text-amber-300 focus:outline-none focus:border-amber-400"
                  >
                    <option value="">Auto-Cascade (Apply to Pending Stages)</option>
                    {selectedClientForPay.ledgerStages.map((s, idx) => (
                      <option key={s._id || idx} value={s._id ? String(s._id) : s.stageName}>
                        {s.stageName} — Due: ₹{(s.due || 0).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Amount Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300">
                    Payment Amount (₹) <span className="text-amber-400">*</span>
                  </label>
                  {selectedClientForPay && getDueAmount(selectedClientForPay) > 0 && (
                    <button
                      type="button"
                      onClick={() => setPayAmount(String(getDueAmount(selectedClientForPay)))}
                      className="text-[11px] text-amber-400 font-bold hover:underline"
                    >
                      Full Due: ₹{getDueAmount(selectedClientForPay).toLocaleString()}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">₹</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="Enter amount..."
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full bg-[#181F2E] border border-[#232E42] rounded-xl pl-8 pr-4 py-2.5 text-base font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Payment Mode & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full bg-[#181F2E] border border-[#232E42] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-semibold"
                  >
                    {PAYMENT_MODES.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-[#181F2E] border border-[#232E42] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
              </div>

              {/* Transaction Ref / Cheque No */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Reference / Cheque / UTR (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR / Cheque No / UPI ID"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full bg-[#181F2E] border border-[#232E42] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="w-1/3 py-2.5 bg-[#181F2E] hover:bg-[#232E42] text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedClientForPay}
                  className="w-2/3 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider hover:scale-[1.01] active:scale-[0.99] transition cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving Payment...' : `Save Payment (₹${Number(payAmount || 0).toLocaleString()})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Ledger Modal (Milestone Schedule & Stages) */}
      <PaymentLedgerModal
        isOpen={isLedgerModalOpen}
        client={selectedClientForLedger}
        onClose={() => {
          setIsLedgerModalOpen(false);
          setSelectedClientForLedger(null);
        }}
        onSuccess={() => loadData()}
      />

      {/* Official Payment Receipt Modal */}
      <PaymentReceiptModal
        isOpen={isReceiptModalOpen}
        payment={selectedReceipt}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setSelectedReceipt(null);
        }}
      />
    </div>
  );
};

export default PayAmountPage;
