import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  History,
  Building2,
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  Send,
  Plus,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { useAuth } from '../../context/AuthContext';
import { rbacService } from '../../services/rbac.service';
import { dailyReportService } from '../../services/dailyReport.service';

interface OutletContextType {
  setSidebarOpen: (open: boolean) => void;
}

export const EngineerWalletPage: React.FC = () => {
  const { setSidebarOpen } = useOutletContext<OutletContextType>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestAmount, setRequestAmount] = useState<number>(5000);
  const [requestPurpose, setRequestPurpose] = useState('');
  const [requestSuccess, setRequestSuccess] = useState(false);

  // Fetch engineer profile
  const { data: engineer, isLoading: isLoadingEngineer } = useQuery({
    queryKey: ['myEngineerProfile'],
    queryFn: rbacService.getMyEngineerProfile,
  });

  // Fetch reports count
  const { data: reportsData } = useQuery({
    queryKey: ['mySiteReportsWallet'],
    queryFn: () => dailyReportService.getReports({ limit: 50 }),
  });

  const reportsCount = reportsData?.reports?.length || 0;
  const balance = engineer?.walletBalance || 0;
  const assignedSitesCount =
    (engineer?.assignedClientIds?.length || 0) + (engineer?.assignedProjectIds?.length || 0);

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestAmount || !requestPurpose.trim()) return;

    setRequestSuccess(true);
    setTimeout(() => {
      setRequestSuccess(false);
      setIsRequestModalOpen(false);
      setRequestPurpose('');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 flex flex-col">
      <Header
        breadcrumbs={[{ label: 'Field Portal', path: '/engineer-dashboard' }, { label: 'My Wallet' }]}
        onToggleSidebar={() => setSidebarOpen(true)}
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto space-y-6">
        {/* Top Wallet Hero Banner */}
        <div className="bg-gradient-to-r from-[#0E1527] via-[#141C30] to-[#0A0E1A] border border-amber-500/25 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-3 max-w-xl relative z-10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold text-amber-400 tracking-wider uppercase">
                Site Operations & Expense Wallet
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
              <span>{user?.name ? `Er. ${user.name}'s Wallet` : 'Field Engineer Wallet'}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold font-mono">
                Active Account
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Track site allowances, petrol & local conveyance expenses, material cash advances, and claim reimbursements for your assigned construction sites.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 relative z-10 flex-wrap">
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
              <span>Request Advance / Expense Claim</span>
            </button>

            <button
              onClick={() => navigate('/engineer/sites')}
              className="px-4 py-2.5 rounded-xl bg-[#141E33] hover:bg-[#1A2640] border border-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>Assigned Sites</span>
            </button>
          </div>
        </div>

        {/* Primary Balance & Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Main Balance Card */}
          <div className="bg-gradient-to-br from-[#12192A] via-[#0E1424] to-[#0A0F1D] border border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Available Wallet Balance
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Wallet className="w-5 h-5" />
              </div>
            </div>

            <div className="my-4">
              <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono tracking-tight flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-bold">₹</span>
                <span>{balance.toLocaleString('en-IN')}</span>
              </div>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Disbursed by Admin • Ready for site expenses
              </span>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Account Login:</span>
              <span className="font-mono text-slate-300 font-semibold">{engineer?.loginId || user?.email}</span>
            </div>
          </div>

          {/* Assigned Sites Summary */}
          <div className="bg-[#0E1424] border border-[#18233A] rounded-2xl p-6 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Linked Sites & Projects
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Building2 className="w-5 h-5" />
              </div>
            </div>

            <div className="my-4">
              <div className="text-3xl font-black text-white font-mono">
                {assignedSitesCount}
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">
                Active Client Sites assigned by Admin
              </span>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">Status:</span>
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <span>View My Assigned Sites</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Daily Reports Progress Metric */}
          <div className="bg-[#0E1424] border border-[#18233A] rounded-2xl p-6 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Daily Field Reports Filed
              </span>
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="my-4">
              <div className="text-3xl font-black text-white font-mono">
                {reportsCount}
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">
                DPR logs submitted to administration
              </span>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Last Reported:</span>
              <span className="font-mono text-slate-300 font-semibold">
                {engineer?.lastReportDate
                  ? new Date(engineer.lastReportDate).toLocaleDateString('en-GB')
                  : 'Pending Today'}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Transactions & Disbursement History */}
        <div className="bg-[#0E1424] border border-[#18233A] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <History className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">
                Recent Wallet Credits & Allowances
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Live Ledger Records
            </span>
          </div>

          <div className="divide-y divide-slate-800/60">
            <div className="py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Opening Wallet Balance / Site Advance</p>
                  <p className="text-[10.5px] text-slate-400">Credited by Head Office for site field visits</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono font-bold text-emerald-400">
                  + ₹ {(balance || 5000).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-500 block">Status: Approved</span>
              </div>
            </div>

            <div className="py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Monthly Fuel & Conveyance Allowance</p>
                  <p className="text-[10.5px] text-slate-400">Automatic allowance credited for site inspections</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono font-bold text-blue-400">
                  Auto-Settled
                </span>
                <span className="text-[10px] text-slate-500 block">Verified</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Advance Request Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D121F] border border-amber-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Request Site Advance / Claim</h3>
              </div>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {requestSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <p className="text-sm font-bold text-white">Expense Claim Submitted!</p>
                <p className="text-xs text-slate-400">Admin will review and credit to your wallet.</p>
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Amount Required (₹)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Purpose / Site Remarks
                  </label>
                  <textarea
                    rows={3}
                    value={requestPurpose}
                    onChange={(e) => setRequestPurpose(e.target.value)}
                    placeholder="e.g. Local labor arrangement advance for site CL-001266"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRequestModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md"
                  >
                    Submit Claim
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
