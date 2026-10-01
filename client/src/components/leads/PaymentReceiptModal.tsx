import React from 'react';
import { X, Printer, CheckCircle2, Building2, ShieldCheck } from 'lucide-react';
import { PaymentItem } from '../../types';

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentItem | null;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  isOpen,
  onClose,
  payment,
}) => {
  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(payment.paymentDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const formattedTime = new Date(payment.paymentDate).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-[#0f1117] border border-[#232938] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200">
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#232938] bg-[#141824]">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-wide uppercase">
              Official Payment Receipt
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-[#1e2538] hover:bg-[#2b354f] border border-[#344061] rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]" id="printable-receipt">
          {/* Header with Organization info */}
          <div className="flex items-start justify-between border-b border-[#232938] pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-black tracking-wider text-base">LEAD FORCE</span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  PORTAL
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Civil Construction & Interior Infrastructure Suite
              </p>
              <p className="text-[10px] text-slate-500">GSTIN: 09AAACB2201M1Z1 | Ref: UP/LKO/2026</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                PAID & VERIFIED
              </span>
              <p className="text-[11px] font-mono text-slate-400 mt-1">
                Receipt #{payment.receiptNo || 'RCP-TXN-001'}
              </p>
            </div>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-[#141824]/60 p-4 rounded-xl border border-[#232938]">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Received From</span>
              <p className="font-bold text-white text-sm mt-0.5">{payment.clientName}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Payment Date & Time</span>
              <p className="font-mono text-slate-200 mt-0.5">
                {formattedDate} {formattedTime}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Service / Category</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-slate-200 font-medium">{payment.serviceName || payment.purpose || 'Construction'}</span>
                {payment.servicePlan && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-950/60 border border-teal-500/40 text-teal-300 font-medium">
                    {payment.servicePlan}
                  </span>
                )}
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Mode & Reference</span>
              <p className="font-mono text-slate-200 mt-0.5">
                {payment.paymentMode || 'UPI'} • {payment.transactionRef || 'N/A'}
              </p>
            </div>
          </div>

          {/* Amount Paid Box */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-500/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Amount Received
              </span>
              <p className="text-2xl font-black text-white font-mono mt-0.5">
                ₹{payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase text-slate-400">Mode</span>
              <div className="mt-0.5">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  {payment.modeBadge || 'Online'}
                </span>
              </div>
            </div>
          </div>

          {/* Remarks */}
          {payment.remarks && (
            <div className="p-3.5 bg-[#141824]/60 rounded-xl border border-[#232938] text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Transaction Remarks / Notes
              </span>
              <p className="text-slate-300 leading-relaxed font-sans">{payment.remarks}</p>
            </div>
          )}

          {/* Signature / Trust badge footer */}
          <div className="pt-4 border-t border-[#232938] flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Computer Generated Secure Receipt • No signature required</span>
            </div>
            <div className="text-right font-mono text-[10px] text-slate-500">
              Auth ID: {payment._id?.slice(-8).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#232938] bg-[#141824] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-[#1e2538] hover:bg-[#28324a] rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
