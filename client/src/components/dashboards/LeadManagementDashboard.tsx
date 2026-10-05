import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Phone,
  Clock,
  Calendar,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Plus,
  ExternalLink,
  Sparkles,
  MessageSquare,
  Building2,
  Filter,
} from 'lucide-react';
import { LeadItem, LeadStats, ClientRecord } from '../../types';
import leadService from '../../services/lead.service';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { AddLeadModal } from '../leads/AddLeadModal';
import { FollowUpModal } from '../leads/FollowUpModal';
import { RegisterClientModal } from '../leads/RegisterClientModal';
import { formatCurrency } from '../../utils/formatters';

interface LeadManagementDashboardProps {
  showWelcomeHeader?: boolean;
}

export const LeadManagementDashboard: React.FC<LeadManagementDashboardProps> = ({
  showWelcomeHeader = true,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canAccess, isMasterAdmin } = usePermissions();

  const [isLoading, setIsLoading] = useState(true);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [userTodayStats, setUserTodayStats] = useState<any>(null);

  // Modals
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedLeadForFollowUp, setSelectedLeadForFollowUp] = useState<LeadItem | null>(null);

  // Dynamic Time-Based Greeting
  const greeting = useMemo(() => {
    const currentHour = new Date().getHours();
    if (currentHour >= 4 && currentHour < 12) return 'Good morning';
    if (currentHour >= 12 && currentHour < 17) return 'Good afternoon';
    if (currentHour >= 17 && currentHour < 22) return 'Good evening';
    return 'Good night';
  }, []);

  const displayName = useMemo(() => {
    if (user?.name && user.name.trim()) return user.name.trim().split(' ')[0];
    if (user?.email) {
      const prefix = user.email.split('@')[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return '';
  }, [user]);

  const todayFormatted = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [leadsRes, clientsRes, statsRes] = await Promise.all([
        leadService.getLeads({ limit: 50, view: 'list' }),
        leadService.getClients({ statusMode: 'NonDead' }).catch(() => []),
        leadService.getStats().catch(() => null),
      ]);

      setLeads(leadsRes.leads || []);
      setClients(clientsRes || []);
      setStats(statsRes || leadsRes.stats || null);
      if (leadsRes.userTodayStats) {
        setUserTodayStats(leadsRes.userTodayStats);
      }
    } catch (err) {
      console.error('Failed to load lead dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Pipeline stages count breakdown
  const stagesCount = useMemo(() => {
    const counts: Record<string, number> = {
      Lead: 0,
      Meeting: 0,
      'Site Visit': 0,
      Quotation: 0,
      Negotiation: 0,
      Client: 0,
    };
    leads.forEach((l) => {
      const st = l.stage || 'Lead';
      if (counts[st] !== undefined) {
        counts[st]++;
      }
    });
    return counts;
  }, [leads]);

  // Today due follow-ups
  const todayDueLeads = useMemo(() => {
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    return leads.filter((l) => {
      if (l.isDead || l.stage === 'Client') return false;
      if (!l.latestFollowUp?.date) return false;
      const fDate = new Date(l.latestFollowUp.date);
      return fDate <= endOfDay;
    });
  }, [leads]);

  // Calculate total client collection and pending
  const totalAgreed = useMemo(() => {
    return clients.reduce((acc, c) => acc + (c.agreedAmount || 0), 0);
  }, [clients]);

  const totalCollected = useMemo(() => {
    return clients.reduce((acc, c) => acc + (c.paidAmount || 0), 0);
  }, [clients]);

  const totalPending = useMemo(() => {
    return Math.max(0, totalAgreed - totalCollected);
  }, [totalAgreed, totalCollected]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      {showWelcomeHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[11px] font-bold text-amber-400 tracking-wider uppercase">
                Lead Force Operations Dashboard
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
              {displayName ? `${greeting}, ${displayName}` : greeting}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Here is what is happening across your lead pipeline and client conversions today.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
            <div className="text-right hidden sm:block mr-1">
              <p className="text-xs font-semibold text-slate-300">{todayFormatted}</p>
              <p className="text-[11px] text-slate-500">Live Client CRM Synchronization</p>
            </div>

            <button
              onClick={() => setIsAddLeadModalOpen(true)}
              className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all hover:shadow cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Lead</span>
            </button>

            <button
              onClick={() => navigate('/leads')}
              className="px-4 py-2 bg-[#121929] hover:bg-[#1A2338] border border-amber-500/30 text-amber-300 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>View Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Inquiries */}
        <div className="bg-[#101625] border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Today's Inquiries</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-white tracking-tight">
              {userTodayStats?.leadsCreatedToday ?? leads.filter((l) => {
                const d = new Date(l.leadDate || l.createdAt);
                const t = new Date();
                return d.toDateString() === t.toDateString();
              }).length}
            </h2>
            <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1 font-medium">
              <TrendingUp className="w-3 h-3" />
              <span>Logged today</span>
            </p>
          </div>
        </div>

        {/* Card 2: Today Due Follow-ups */}
        <div className="bg-[#101625] border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-rose-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Follow-ups Due Today</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-rose-400 tracking-tight">
              {stats?.todayDueCount ?? todayDueLeads.length}
            </h2>
            <p className="text-xs text-slate-400 mt-1">Requires call or meeting today</p>
          </div>
        </div>

        {/* Card 3: Active Leads in Funnel */}
        <div className="bg-[#101625] border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Pipeline</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-white tracking-tight">
              {stats?.totalActive ?? leads.filter((l) => !l.isDead && l.stage !== 'Client').length}
            </h2>
            <p className="text-xs text-blue-400 mt-1">Ongoing discussions</p>
          </div>
        </div>

        {/* Card 4: Converted Clients */}
        <div className="bg-[#101625] border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Converted Clients</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-emerald-400 tracking-tight">
              {stats?.totalClients ?? clients.length}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Total converted accounts
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Financial KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0C1220] border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Fee Collection
            </p>
            <p className="text-lg font-bold text-emerald-400 mt-0.5">
              {totalCollected > 0 ? formatCurrency(totalCollected, 'INR', true) : '₹0.00'}
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#0C1220] border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Pending Collections
            </p>
            <p className="text-lg font-bold text-amber-400 mt-0.5">
              {totalPending > 0 ? formatCurrency(totalPending, 'INR', true) : '₹0.00'}
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#0C1220] border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Booked Value
            </p>
            <p className="text-lg font-bold text-white mt-0.5">
              {totalAgreed > 0 ? formatCurrency(totalAgreed, 'INR', true) : '₹0.00'}
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Pipeline Funnel Stages Breakdown */}
      <div className="bg-[#0E1424] border border-[#18233A] rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Lead Pipeline Funnel</h3>
          </div>
          <span className="text-xs text-slate-400">Total Pipeline: {leads.length} Leads</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Initial Inquiry', stage: 'Lead', color: '#3B82F6', icon: Users },
            { label: 'Meeting Scheduled', stage: 'Meeting', color: '#8B5CF6', icon: Calendar },
            { label: 'Site Inspection', stage: 'Site Visit', color: '#06B6D4', icon: Building2 },
            { label: 'Quotation Sent', stage: 'Quotation', color: '#F59E0B', icon: IndianRupee },
            { label: 'Negotiation', stage: 'Negotiation', color: '#EC4899', icon: MessageSquare },
            { label: 'Converted Client', stage: 'Client', color: '#10B981', icon: CheckCircle2 },
          ].map((item) => {
            const count = stagesCount[item.stage] || 0;
            const pct = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0;
            return (
              <div
                key={item.stage}
                className="bg-[#12192B] border border-slate-800 rounded-xl p-3 flex flex-col justify-between hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-[10px] font-bold text-slate-400">{pct}%</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-300 mt-2 truncate">
                    {item.label}
                  </p>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-xl font-bold text-white">{count}</span>
                  <span className="text-[10px] text-slate-500 font-mono">leads</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout: Left (Recent Inquiries) & Right (Urgent Follow-ups) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Recent Active Inquiries */}
        <div className="lg:col-span-8 bg-[#0E1424] border border-[#18233A] rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                Active Inquiries & Prospects
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Latest assigned inquiries requiring pipeline progression
              </p>
            </div>
            <button
              onClick={() => navigate('/leads')}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-500">Loading inquiries...</div>
          ) : leads.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No inquiries found in your allocated portfolio.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400">
                    <th className="py-2.5 px-3">Lead Code</th>
                    <th className="py-2.5 px-3">Prospect Name</th>
                    <th className="py-2.5 px-3">Contact</th>
                    <th className="py-2.5 px-3">Service</th>
                    <th className="py-2.5 px-3">Stage</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {leads.slice(0, 6).map((lead) => (
                    <tr key={lead._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-amber-400">
                        {lead.leadCode}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-white block">{lead.clientName}</span>
                        <span className="text-[10px] text-slate-500">{lead.siteLocation || '-'}</span>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <a
                          href={`tel:${lead.mobile1}`}
                          className="hover:text-amber-400 flex items-center gap-1 text-[11px]"
                        >
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{lead.mobile1}</span>
                        </a>
                      </td>
                      <td className="py-3 px-3 text-[11px] text-slate-300">
                        {lead.requirements?.[0] || 'Construction'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1C2538] border border-amber-500/20 text-amber-300">
                          {lead.stage || 'Lead'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedLeadForFollowUp(lead)}
                          className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer"
                        >
                          Follow Up
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Urgent Follow-ups & Recent Conversions */}
        <div className="lg:col-span-4 space-y-6">
          {/* Urgent Follow-ups Card */}
          <div className="bg-[#0E1424] border border-[#18233A] rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Due Today ({todayDueLeads.length})
              </h3>
              <span className="text-[10.5px] text-slate-400">Action Required</span>
            </div>

            {todayDueLeads.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 flex flex-col items-center gap-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-400/60" />
                <span>All follow-ups are up to date!</span>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {todayDueLeads.slice(0, 5).map((l) => (
                  <div
                    key={l._id}
                    className="p-3 rounded-xl bg-[#131A2C] border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-white truncate max-w-[140px]">
                        {l.clientName}
                      </p>
                      <p className="text-[10.5px] text-slate-400 font-mono mt-0.5">
                        {l.mobile1}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedLeadForFollowUp(l)}
                      className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-lg text-[10.5px] font-bold cursor-pointer"
                    >
                      Call Now
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Client Conversions */}
          <div className="bg-[#0E1424] border border-[#18233A] rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Recent Converted Clients
              </h3>
              <button
                onClick={() => navigate('/leads/clients')}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
              >
                View
              </button>
            </div>

            {clients.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No converted clients yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {clients.slice(0, 4).map((c) => (
                  <div
                    key={c._id}
                    className="p-2.5 rounded-xl bg-[#131A2C] border border-slate-800/80 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-white truncate max-w-[140px]">
                        {c.name}
                      </p>
                      <p className="text-[10.5px] text-slate-400 mt-0.5">
                        {c.clientCode} · {c.phone}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-400 block font-mono">
                        {c.agreedAmount ? formatCurrency(c.agreedAmount, 'INR', true) : 'Active'}
                      </span>
                      <span className="text-[9.5px] text-slate-500">Agreed</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddLeadModal
        isOpen={isAddLeadModalOpen}
        onClose={() => setIsAddLeadModalOpen(false)}
        onSuccess={() => {
          setIsAddLeadModalOpen(false);
          fetchDashboardData();
        }}
      />

      <FollowUpModal
        isOpen={!!selectedLeadForFollowUp}
        lead={selectedLeadForFollowUp}
        onClose={() => setSelectedLeadForFollowUp(null)}
        onSuccess={() => {
          setSelectedLeadForFollowUp(null);
          fetchDashboardData();
        }}
      />
    </div>
  );
};
