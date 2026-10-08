import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Building2,
  Phone,
  MapPin,
  Calendar,
  IndianRupee,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Layers,
  Handshake,
  Coins,
  ArrowRight,
  Receipt,
  UserCheck,
  FileCheck,
} from 'lucide-react';
import { ClientRecord, ClientDossier } from '../../types';
import leadService from '../../services/lead.service';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface ClientReportModalProps {
  isOpen: boolean;
  client: ClientRecord | null;
  onClose: () => void;
}

export const ClientReportModal: React.FC<ClientReportModalProps> = ({
  isOpen,
  client,
  onClose,
}) => {
  useEscapeKey(onClose, isOpen);

  const [dossier, setDossier] = useState<ClientDossier | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && client?._id) {
      loadDossier(client._id);
    } else {
      setDossier(null);
    }
  }, [isOpen, client?._id]);

  const loadDossier = async (clientId: string) => {
    setIsLoading(true);
    try {
      const data = await leadService.getClientDossier(clientId);
      setDossier(data);
    } catch (err) {
      console.error('Failed to load client dossier:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !client) return null;

  const handlePrint = () => {
    window.print();
  };

  const balanceDue = client.balanceAmount ?? Math.max(0, (client.agreedAmount || 0) - (client.paidAmount || 0));

  const lead = dossier?.lead;
  const payments = dossier?.payments || [];
  const partner = dossier?.partner;
  const commissions = dossier?.commissions || [];
  const payouts = dossier?.payouts || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#0F141F] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Controls (Hidden during print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2638] bg-gradient-to-r from-[#131B2A] to-[#0F141F] print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Client Connected Dossier & Lifecycle Statement
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {client.clientCode} • {client.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Dossier</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Statement Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar print:p-0 print:overflow-visible text-slate-200">
          {/* Branded Letterhead */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E2638] print:border-black/20">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-amber-400 tracking-wider">
                  LEAD FORCE PORTAL
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold">
                  CONNECTED AUDIT
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Civil Infrastructure, Client Payments & Reference Partner Ledger
              </p>
            </div>
            <div className="text-right text-xs text-slate-400 space-y-0.5">
              <p className="font-mono text-cyan-400 font-bold">Client ID: {client.clientCode}</p>
              {lead?.leadCode && (
                <p className="font-mono text-slate-400">Orig. Lead: #{lead.leadCode}</p>
              )}
              <p>
                Status:{' '}
                <span className={`font-bold ${client.isDead ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {client.isDead ? 'Dead / Inactive' : 'Active Account'}
                </span>
              </p>
            </div>
          </div>

          {/* Connected Flow Visual Pipeline Banner */}
          <div className="bg-[#141A28] border border-cyan-500/20 rounded-2xl p-4">
            <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 block mb-2">
              End-to-End Connected Lifecycle Trace
            </span>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
                1. LEAD {lead ? `#${lead.leadCode}` : 'Captured'}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              <span className="px-3 py-1.5 rounded-xl bg-cyan-950/60 text-cyan-300 border border-cyan-800">
                2. CLIENT {client.clientCode}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              <span className="px-3 py-1.5 rounded-xl bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                3. PAYMENTS ({payments.length} • ₹{(client.paidAmount || 0).toLocaleString()})
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              <span className="px-3 py-1.5 rounded-xl bg-amber-950/60 text-amber-300 border border-amber-800">
                4. COMMISSIONS ({commissions.length} • ₹
                {commissions.reduce((sum, c) => sum + (c.commissionAmount || 0), 0).toLocaleString()})
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              <span className="px-3 py-1.5 rounded-xl bg-purple-950/60 text-purple-300 border border-purple-800">
                5. PAYOUTS ({payouts.length} • ₹
                {payouts.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()})
              </span>
            </div>
          </div>

          {/* Section 1: Client & Lead Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client Profile */}
            <div className="bg-[#121825] border border-[#1E2638] rounded-2xl p-4 text-xs space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block border-b border-[#1E2638] pb-1">
                Client Profile Details
              </span>
              <div className="flex justify-between">
                <span className="text-slate-400">Name:</span>
                <span className="font-bold text-white">{client.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mobile Phone:</span>
                <span className="font-mono text-slate-200">{client.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Site Location:</span>
                <span className="text-slate-200">{client.siteLocation || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Project Type:</span>
                <span className="text-slate-200">{client.projectType || 'Residential'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Service:</span>
                <span className="text-slate-200">{client.services || 'Construction'}</span>
              </div>
            </div>

            {/* Financial Ledger */}
            <div className="bg-[#121825] border border-[#1E2638] rounded-2xl p-4 text-xs space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block border-b border-[#1E2638] pb-1">
                Financial Agreement Ledger
              </span>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Agreed Contract:</span>
                <span className="font-mono font-bold text-white">
                  ₹{(client.agreedAmount || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Collected to Date:</span>
                <span className="font-mono font-bold text-emerald-400">
                  ₹{(client.paidAmount || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#1E2638] pt-1">
                <span className="text-amber-400 font-bold">Outstanding Balance:</span>
                <span className="font-mono font-black text-amber-400 text-sm">
                  ₹{balanceDue.toLocaleString()}
                </span>
              </div>
              {partner && (
                <div className="mt-2 pt-2 border-t border-[#1E2638] flex justify-between items-center">
                  <span className="text-slate-400">Ref. Partner:</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">
                    {partner.name} ({partner.commissionRatePercent || 2.5}%)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Client Payments Received */}
          <div className="bg-[#121825] border border-[#1E2638] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#1E2638] pb-2">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Payments Received From Client ({payments.length})
                </h4>
              </div>
              <span className="font-mono text-emerald-400 font-bold text-xs">
                Total: ₹{(client.paidAmount || 0).toLocaleString()}
              </span>
            </div>

            {payments.length === 0 ? (
              <p className="text-slate-500 text-xs py-2">No payments recorded for this client yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="text-slate-400 border-b border-[#1E2638]">
                      <th className="py-2">RECEIPT NO</th>
                      <th className="py-2">DATE</th>
                      <th className="py-2 text-right">AMOUNT</th>
                      <th className="py-2 text-center">MODE</th>
                      <th className="py-2">REFERENCE</th>
                      <th className="py-2 text-center">COMMISSION AUTO-GENERATED</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A2234]">
                    {payments.map((p) => (
                      <tr key={p._id} className="text-slate-300">
                        <td className="py-2 font-mono text-cyan-400 font-bold">{p.receiptNo}</td>
                        <td className="py-2">
                          {new Date(p.paymentDate).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-2 text-right font-mono font-bold text-emerald-400">
                          ₹{p.amount?.toLocaleString()}
                        </td>
                        <td className="py-2 text-center">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                            {p.paymentMode}
                          </span>
                        </td>
                        <td className="py-2 font-mono text-slate-400">{p.transactionRef || '-'}</td>
                        <td className="py-2 text-center">
                          {p.commissionGenerated || p.commissionId ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                              <CheckCircle2 className="w-3 h-3" /> Linked
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">Direct / No Partner</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 3: Commissions Generated & Payouts Disbursed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Commissions */}
            <div className="bg-[#121825] border border-[#1E2638] rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-[#1E2638] pb-1">
                <span className="font-bold text-amber-300 uppercase tracking-wide text-[10px] flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5" />
                  Referral Commissions Accrued ({commissions.length})
                </span>
                <span className="font-mono text-amber-400 font-bold">
                  ₹{commissions.reduce((s, c) => s + (c.commissionAmount || 0), 0).toLocaleString()}
                </span>
              </div>
              {commissions.length === 0 ? (
                <p className="text-slate-500 py-2">No commissions generated for this client.</p>
              ) : (
                <div className="space-y-2 pt-1">
                  {commissions.map((c) => (
                    <div
                      key={c._id}
                      className="p-2.5 rounded-xl bg-[#151D2C] border border-[#20293D] flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold text-white">{c.partnerName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Rate: {c.commissionPercent}% • From Payment: ₹
                          {(c.paymentAmount || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-white">
                          ₹{c.commissionAmount.toLocaleString()}
                        </div>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            c.status === 'Paid'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Partner Payouts */}
            <div className="bg-[#121825] border border-[#1E2638] rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-[#1E2638] pb-1">
                <span className="font-bold text-emerald-300 uppercase tracking-wide text-[10px] flex items-center gap-1.5">
                  <Handshake className="w-3.5 h-3.5" />
                  Partner Payouts Executed ({payouts.length})
                </span>
                <span className="font-mono text-emerald-400 font-bold">
                  ₹{payouts.reduce((s, p) => s + (p.amount || 0), 0).toLocaleString()}
                </span>
              </div>
              {payouts.length === 0 ? (
                <p className="text-slate-500 py-2">No payouts disbursed against this client yet.</p>
              ) : (
                <div className="space-y-2 pt-1">
                  {payouts.map((p) => (
                    <div
                      key={p._id}
                      className="p-2.5 rounded-xl bg-[#151D2C] border border-[#20293D] flex justify-between items-center"
                    >
                      <div>
                        <div className="font-mono font-bold text-cyan-400">{p.payoutNo}</div>
                        <div className="text-[10px] text-slate-400">
                          {p.paymentMode} • Ref: {p.transactionRef || 'N/A'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-black text-emerald-400">
                          ₹{p.amount?.toLocaleString()}
                        </div>
                        <span className="text-[9px] font-bold text-emerald-400">DISBURSED</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Trust verification footer */}
          <div className="pt-4 border-t border-[#1E2638] flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Full Connected Audit Record • Lead Force 360 Core</span>
            </div>
            <div className="text-right font-mono text-[10px] text-slate-500">
              Verified: {new Date().toLocaleDateString('en-GB')}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#1E2638] bg-[#141824] flex justify-end print:hidden">
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
export default ClientReportModal;
