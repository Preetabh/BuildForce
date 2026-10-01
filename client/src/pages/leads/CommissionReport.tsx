import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  IndianRupee,
  CheckCircle,
  Clock,
  Filter,
  ArrowUpRight,
  Handshake,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CommissionItem, PartnerItem } from '../../types';
import leadService from '../../services/lead.service';

export const CommissionReport: React.FC = () => {
  const navigate = useNavigate();
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
      setPartners(partnersData || []);
      setCommissions(repData.reports || []);
      setSummary(repData.summary || { totalCommission: 0, paidCommission: 0, pendingCommission: 0 });
    } catch (err) {
      console.error('Failed to load commission report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (commId: string) => {
    try {
      await leadService.approveCommission(commId);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Approval failed');
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
          <h1 className="text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-amber-400" />
            <span>Partner Commission Report</span>
          </h1>
          <p className="text-xs text-slate-400">
            Real-time audit of commissions generated from client installment collections and partner disbursements
          </p>
        </div>

        {/* Partner Filter & Quick Link */}
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

          <button
            onClick={() => navigate('/leads/pay-amount')}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs rounded-xl shadow-md hover:scale-[1.02] transition cursor-pointer"
          >
            <Handshake className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Pay Amount</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-[#10141F] border border-[#1E2638] rounded-2xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Commissions Accrued</p>
          <p className="text-xl font-black text-white font-mono mt-1">
            ₹{summary.totalCommission.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Calculated per client payment received</p>
        </div>
        <div className="p-4 bg-[#10141F] border border-[#1E2638] rounded-2xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Paid Out to Partners</p>
          <p className="text-xl font-black text-emerald-400 font-mono mt-1">
            ₹{summary.paidCommission.toLocaleString()}
          </p>
          <p className="text-[10px] text-emerald-400/80 mt-1">Verified bank / UPI disbursements</p>
        </div>
        <div className="p-4 bg-[#10141F] border border-[#1E2638] rounded-2xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Net Pending Payable</p>
          <p className="text-xl font-black text-amber-400 font-mono mt-1">
            ₹{summary.pendingCommission.toLocaleString()}
          </p>
          <p className="text-[10px] text-amber-400/80 mt-1">Outstanding unpaid balance</p>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-[#10141F] border border-[#1E2638] rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-[11px] min-w-[850px]">
            <thead>
              <tr className="bg-[#131825] border-b border-[#1E2638] text-[10px] font-bold tracking-wider text-amber-400/90 uppercase select-none">
                <th className="py-3 px-3">DATE</th>
                <th className="py-3 px-3">PARTNER / ASSOCIATE</th>
                <th className="py-3 px-3">CLIENT REFERRED</th>
                <th className="py-3 px-3">PAYMENT RECEIPT</th>
                <th className="py-3 px-3 text-right">CLIENT PAID</th>
                <th className="py-3 px-3 text-center">RATE</th>
                <th className="py-3 px-3 text-right">COMMISSION ₹</th>
                <th className="py-3 px-3 text-right">PAID OUT ₹</th>
                <th className="py-3 px-3 text-right">BALANCE DUE ₹</th>
                <th className="py-3 px-3 text-center">STATUS</th>
                <th className="py-3 px-3 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A2234]">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 text-xs">
                    Loading commission report...
                  </td>
                </tr>
              ) : commissions.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 text-xs">
                    No partner commission logs found. Convert partner-referred leads and receive client payments to see commissions here.
                  </td>
                </tr>
              ) : (
                commissions.map((comm) => {
                  const receiptNo =
                    comm.paymentId && typeof comm.paymentId === 'object'
                      ? comm.paymentId.receiptNo
                      : comm.paymentRef || 'N/A';
                  const paymentAmt =
                    comm.paymentId && typeof comm.paymentId === 'object'
                      ? comm.paymentId.amount
                      : comm.paymentAmount || comm.projectValue;
                  const bal =
                    comm.balanceAmount !== undefined
                      ? comm.balanceAmount
                      : comm.status === 'Paid'
                      ? 0
                      : comm.commissionAmount;

                  return (
                    <tr key={comm._id} className="hover:bg-[#151C2C]/80 transition-colors">
                      <td className="py-3 px-3 text-slate-300">
                        {new Date(comm.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-3 font-bold text-amber-300">
                        {comm.partnerName}
                      </td>
                      <td className="py-3 px-3 font-semibold text-white">
                        <div>{comm.clientName}</div>
                        {comm.leadCode && (
                          <span className="text-[10px] text-cyan-400 font-mono">
                            Lead #{comm.leadCode}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-cyan-400">
                        {receiptNo}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-slate-200">
                        ₹{paymentAmt?.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-semibold text-slate-300">
                        {comm.commissionPercent}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-white">
                        ₹{comm.commissionAmount?.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-400">
                        ₹{(comm.paidAmount || (comm.status === 'Paid' ? comm.commissionAmount : 0)).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-amber-400">
                        ₹{bal?.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                            comm.status === 'Paid'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : comm.status === 'Approved'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {comm.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center space-x-1 whitespace-nowrap">
                        {comm.status === 'Pending' && (
                          <button
                            onClick={() => handleApprove(comm._id)}
                            className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold transition cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                        {bal > 0 && (
                          <button
                            onClick={() => navigate('/leads/pay-amount')}
                            className="px-2 py-0.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded text-[10px] font-bold transition cursor-pointer"
                          >
                            Pay
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default CommissionReport;
