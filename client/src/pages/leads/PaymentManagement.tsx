import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  IndianRupee,
  Calendar,
  FileCheck,
  CheckCircle2,
} from 'lucide-react';
import { PaymentItem } from '../../types';
import leadService from '../../services/lead.service';
import { PayAmountModal } from '../../components/leads/PayAmountModal';

export const PaymentManagement: React.FC = () => {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const data = await leadService.getPayments(search);
      setPayments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments();
  };

  const totalCollected = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

  return (
    <div className="min-h-screen bg-[#0D1017] text-slate-200 p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
            <span>Admin</span>
            <span>/</span>
            <span>Lead Management</span>
            <span>/</span>
            <span className="text-amber-400 font-semibold">Payments</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-amber-400" />
            <span>Client Payments Ledger</span>
          </h2>
          <p className="text-xs text-slate-400">
            Track customer installment collections, advance bookings, and milestone receipts
          </p>
        </div>

        <button
          onClick={() => setIsPayModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Record New Payment</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-[#10141F] border border-[#1E2638] rounded-2xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Collected</p>
          <p className="text-xl font-black text-emerald-400 font-mono mt-1">
            ₹{totalCollected.toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-[#10141F] border border-[#1E2638] rounded-2xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Transactions</p>
          <p className="text-xl font-black text-white font-mono mt-1">{payments.length}</p>
        </div>
        <div className="p-4 bg-[#10141F] border border-[#1E2638] rounded-2xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Collection Status</p>
          <p className="text-xl font-black text-amber-400 font-mono mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" /> 100% Verified
          </p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md">
        <input
          type="text"
          placeholder="Search by receipt no, client name, ref..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-[#10141F] border border-[#1E2638] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-[#0284C7] hover:bg-[#0369a1] text-white font-bold text-xs rounded-xl"
        >
          Search
        </button>
      </form>

      {/* Table */}
      <div className="bg-[#10141F] border border-[#1E2638] rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-[11.5px]">
            <thead>
              <tr className="bg-[#131825] border-b border-[#1E2638] text-[10px] font-bold tracking-wider text-amber-400/90 uppercase select-none">
                <th className="py-3 px-3">RECEIPT NO</th>
                <th className="py-3 px-3">DATE</th>
                <th className="py-3 px-3">CLIENT NAME</th>
                <th className="py-3 px-3 text-right">AMOUNT PAID</th>
                <th className="py-3 px-3 text-center">MODE</th>
                <th className="py-3 px-3">REFERENCE / UTR</th>
                <th className="py-3 px-3">PURPOSE / STAGE</th>
                <th className="py-3 px-3">RECEIVED BY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A2234]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    Loading payments...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No payment records found. Record a payment using the button above.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p._id} className="hover:bg-[#151C2C]/80 transition-colors">
                    <td className="py-3 px-3 font-mono text-cyan-400 font-bold">{p.receiptNo}</td>
                    <td className="py-3 px-3 text-slate-300">
                      {new Date(p.paymentDate).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-3 font-bold text-white">{p.clientName}</td>
                    <td className="py-3 px-3 text-right font-mono font-black text-emerald-400 text-sm">
                      ₹{p.amount?.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1C2538] text-slate-300 border border-[#2D3A54]">
                        {p.paymentMode}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400 text-xs">
                      {p.transactionRef || '-'}
                    </td>
                    <td className="py-3 px-3 font-medium text-amber-300/90">{p.purpose}</td>
                    <td className="py-3 px-3 text-slate-400 text-xs">{p.receivedBy || 'Admin'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PayAmountModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        onSuccess={() => fetchPayments()}
      />
    </div>
  );
};
