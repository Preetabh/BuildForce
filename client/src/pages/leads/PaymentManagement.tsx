import React, { useState, useEffect } from 'react';
import {
  Calendar,
  ExternalLink,
  RotateCcw,
  Search,
  Plus,
  FileText,
  CreditCard,
} from 'lucide-react';
import { PaymentItem } from '../../types';
import leadService from '../../services/lead.service';
import { PayAmountModal } from '../../components/leads/PayAmountModal';
import { PaymentReceiptModal } from '../../components/leads/PaymentReceiptModal';

export const PaymentManagement: React.FC = () => {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [pageSize, setPageSize] = useState('50');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentItem | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async (overrideParams?: {
    search?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) => {
    setIsLoading(true);
    try {
      const data = await leadService.getPayments(
        overrideParams || {
          search: search.trim() || undefined,
          startDate: fromDate || undefined,
          endDate: toDate || undefined,
          limit: Number(pageSize) || 50,
        }
      );
      setPayments(data || []);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments({
      search: search.trim() || undefined,
      startDate: fromDate || undefined,
      endDate: toDate || undefined,
      limit: Number(pageSize) || 50,
    });
  };

  const handleReset = () => {
    setSearch('');
    setFromDate('');
    setToDate('');
    setPageSize('50');
    fetchPayments({
      search: undefined,
      startDate: undefined,
      endDate: undefined,
      limit: 50,
    });
  };

  const formatDateDisplay = (dateString: string) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return { date: dateString, time: '00:00' };

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return {
      date: `${day}/${month}/${year}`,
      time: `${hours}:${minutes}`,
    };
  };

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-slate-200 p-4 sm:p-6 space-y-5">
      {/* Top Breadcrumb & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-amber-500 flex items-center gap-1.5">
            <span>Admin</span>
            <span className="text-slate-500">/</span>
            <span className="text-amber-400">Payment History</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">
            Payment History
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            View all transactions and subscription payments
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPayModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <div className="bg-[#12141a] border border-[#202534] rounded-2xl p-4 sm:p-5 shadow-xl">
        <form onSubmit={handleApplyFilters} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Search Client/Business */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Search Client/Business
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Name or Business ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white text-zinc-900 placeholder:text-zinc-400 rounded-lg px-3 py-2 text-xs font-normal border border-zinc-200 outline-none focus:ring-2 focus:ring-amber-400 transition"
                />
              </div>
            </div>

            {/* From Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                From Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full bg-white text-zinc-900 rounded-lg px-3 py-2 text-xs font-normal border border-zinc-200 outline-none focus:ring-2 focus:ring-amber-400 transition"
                />
              </div>
            </div>

            {/* To Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                To Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full bg-white text-zinc-900 rounded-lg px-3 py-2 text-xs font-normal border border-zinc-200 outline-none focus:ring-2 focus:ring-amber-400 transition"
                />
              </div>
            </div>

            {/* Page Size */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Page Size
              </label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value)}
                className="w-full bg-white text-zinc-900 rounded-lg px-3 py-2 text-xs font-normal border border-zinc-200 outline-none focus:ring-2 focus:ring-amber-400 transition cursor-pointer"
              >
                <option value="10">10 per page</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              className="px-5 py-2 bg-[#eab308] hover:bg-[#ca8a04] text-zinc-950 font-bold text-xs rounded-lg shadow-md transition cursor-pointer"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 bg-[#1a1f2c] hover:bg-[#252b3d] text-zinc-300 font-medium text-xs rounded-lg border border-[#2b3348] transition cursor-pointer"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Main Payment History Table */}
      <div className="bg-[#12141a] border border-[#202534] rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#202534] bg-[#0e1015] text-[11px] font-bold tracking-wider text-slate-400 uppercase select-none">
                <th className="py-3.5 px-4 w-32">DATE</th>
                <th className="py-3.5 px-4 w-60">CLIENT / BUSINESS</th>
                <th className="py-3.5 px-4 w-52">SERVICE / PLAN</th>
                <th className="py-3.5 px-4 w-32">AMOUNT</th>
                <th className="py-3.5 px-4 w-24">MODE</th>
                <th className="py-3.5 px-4 w-44">REFERENCE</th>
                <th className="py-3.5 px-4">REMARKS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b202c]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    Loading payment records...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No transactions found for the selected criteria.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const { date, time } = formatDateDisplay(p.paymentDate);
                  return (
                    <tr
                      key={p._id}
                      className="hover:bg-[#161a24] transition-colors text-slate-300 align-top"
                    >
                      {/* DATE */}
                      <td className="py-4 px-4 font-mono text-slate-200">
                        <div>{date}</div>
                        <div className="text-[11px] text-slate-400">{time}</div>
                      </td>

                      {/* CLIENT / BUSINESS */}
                      <td className="py-4 px-4 font-semibold text-white">
                        {p.clientName}
                      </td>

                      {/* SERVICE / PLAN */}
                      <td className="py-4 px-4">
                        <div className="text-slate-200 font-medium">
                          {p.serviceName || p.purpose || 'Interior Full Design'}
                        </div>
                        <div className="mt-1">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#0f2936] text-[#38bdf8] border border-[#0284c7]/40">
                            {p.servicePlan || 'Construction'}
                          </span>
                        </div>
                      </td>

                      {/* AMOUNT */}
                      <td className="py-4 px-4 font-bold text-white text-sm font-mono whitespace-nowrap">
                        ₹
                        {p.amount?.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      {/* MODE */}
                      <td className="py-4 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#eab308] text-zinc-950 uppercase tracking-wider">
                          {p.modeBadge || (p.paymentMode === 'Cash' ? 'Cash' : 'Online')}
                        </span>
                      </td>

                      {/* REFERENCE */}
                      <td className="py-4 px-4 space-y-1">
                        <div className="font-bold text-xs text-slate-200">
                          {p.referenceType || p.paymentMode || 'UPI'}
                        </div>
                        {p.transactionRef && (
                          <div className="text-[11px] font-mono text-slate-400">
                            Ref: {p.transactionRef}
                          </div>
                        )}
                        <div>
                          <button
                            onClick={() => setSelectedReceipt(p)}
                            className="inline-flex items-center gap-1 text-xs text-[#38bdf8] hover:text-[#7dd3fc] hover:underline cursor-pointer font-medium mt-0.5"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>View Receipt</span>
                          </button>
                        </div>
                      </td>

                      {/* REMARKS */}
                      <td className="py-4 px-4 text-xs text-slate-300 leading-relaxed max-w-md">
                        {p.remarks || p.notes || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Amount Modal */}
      <PayAmountModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        onSuccess={() => fetchPayments()}
      />

      {/* View Receipt Printable Modal */}
      <PaymentReceiptModal
        isOpen={!!selectedReceipt}
        payment={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
};
export default PaymentManagement;
