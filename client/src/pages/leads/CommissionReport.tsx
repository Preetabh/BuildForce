import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  IndianRupee,
  CheckCircle,
  Clock,
  Filter,
} from 'lucide-react';
import { CommissionItem, PartnerItem } from '../../types';
import leadService from '../../services/lead.service';

export const CommissionReport: React.FC = () => {
  const [commissions, setCommissions] = useState<CommissionItem[]>([]);
  const [partners, setPartners] = useState<PartnerItem[]>([]);
  const [selectedPartner, setSelectedPartner] = useState('');
  const [summary, setSummary] = useState({ totalCommission: 0, paidCommission: 0, pendingCommission: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedPartner]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [partnersData, repData] = await Promise.all([
        leadService.getPartners(),
        leadService.getCommissionReports(selectedPartner || undefined),
      ]);
      setPartners(partnersData);
      setCommissions(repData.reports);
      setSummary(repData.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

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
            <span className="text-amber-400 font-semibold">Commission Report</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-amber-400" />
            <span>Partner Commission Report</span>
          </h2>
          <p className="text-xs text-slate-400">
            Audit affiliate, associate, and channel partner payouts based on closed agreements
          </p>
        </div>

        {/* Partner Filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedPartner}
            onChange={(e) => setSelectedPartner(e.target.value)}
            className="bg-[#10141F] border border-[#1E2638] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
          >
            <option value="">All Partners & Associates</option>
            {partners.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-[#10141F] border border-[#1E2638] rounded-2xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Commissions</p>
          <p className="text-xl font-black text-white font-mono mt-1">
            ₹{summary.totalCommission.toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-[#10141F] border border-[#1E2638] rounded-2xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Paid Out</p>
          <p className="text-xl font-black text-emerald-400 font-mono mt-1">
            ₹{summary.paidCommission.toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-[#10141F] border border-[#1E2638] rounded-2xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Payable</p>
          <p className="text-xl font-black text-amber-400 font-mono mt-1">
            ₹{summary.pendingCommission.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-[#10141F] border border-[#1E2638] rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-[11.5px]">
            <thead>
              <tr className="bg-[#131825] border-b border-[#1E2638] text-[10px] font-bold tracking-wider text-amber-400/90 uppercase select-none">
                <th className="py-3 px-3">DATE</th>
                <th className="py-3 px-3">PARTNER / ASSOCIATE</th>
                <th className="py-3 px-3">CLIENT REFERRED</th>
                <th className="py-3 px-3">LEAD ID</th>
                <th className="py-3 px-3 text-right">PROJECT CONTRACT VALUE</th>
                <th className="py-3 px-3 text-center">RATE</th>
                <th className="py-3 px-3 text-right">COMMISSION ₹</th>
                <th className="py-3 px-3 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A2234]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    Loading commission report...
                  </td>
                </tr>
              ) : commissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No partner commission logs found. Convert associate-referred leads to see commissions here.
                  </td>
                </tr>
              ) : (
                commissions.map((comm) => (
                  <tr key={comm._id} className="hover:bg-[#151C2C]/80 transition-colors">
                    <td className="py-3 px-3 text-slate-300">
                      {new Date(comm.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-3 font-bold text-amber-300">{comm.partnerName}</td>
                    <td className="py-3 px-3 font-bold text-white">{comm.clientName}</td>
                    <td className="py-3 px-3 font-mono text-cyan-400">{comm.leadCode || '-'}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-200">
                      ₹{comm.projectValue?.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-semibold text-slate-300">
                      {comm.commissionPercent}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black text-emerald-400 text-sm">
                      ₹{comm.commissionAmount?.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          comm.status === 'Paid'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {comm.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
