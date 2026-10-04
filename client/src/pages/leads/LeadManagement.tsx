import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  X,
  RotateCcw,
  Plus,
  Phone,
  Calendar,
  List as ListIcon,
  Columns3,
  Bell,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  CheckCircle2,
  CalendarDays,
  Activity,
  Layers,
} from 'lucide-react';
import { LeadItem, LeadStats, UserTodayStats } from '../../types';
import leadService, { LeadFilterQuery } from '../../services/lead.service';
import catalogService from '../../services/catalog.service';
import { AddLeadModal } from '../../components/leads/AddLeadModal';
import { FollowUpModal } from '../../components/leads/FollowUpModal';
import { RegisterClientModal } from '../../components/leads/RegisterClientModal';
import { MarkDeadModal } from '../../components/leads/MarkDeadModal';
import { useAuth } from '../../context/AuthContext';
import { useImpersonation } from '../../context/ImpersonationContext';

export const LeadManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { viewingUser, isViewing, stopViewing } = useImpersonation();

  // User Profile Filter from URL params or Impersonation
  const urlUserId = searchParams.get('userId') || '';
  const urlUserName = searchParams.get('userName') || '';

  const activeUserId = urlUserId || (isViewing && viewingUser ? viewingUser.id : '');
  const activeUserName = urlUserName || (isViewing && viewingUser ? viewingUser.name : '');
  const activeUserRole = viewingUser?.role || (activeUserName ? 'Team Member' : '');

  // Active view: 'list' | 'today-due' | 'process'
  const [activeView, setActiveView] = useState<'list' | 'today-due' | 'process'>('list');

  // Filter States matching Screenshot 2
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [statusMode, setStatusMode] = useState<'Active' | 'Dead' | 'All'>('Active');
  const [companyFilter, setCompanyFilter] = useState('All Companies');
  const [serviceFilter, setServiceFilter] = useState('All Services');
  const [todayOnly, setTodayOnly] = useState(false);

  // Leads & Pagination
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [userTodayStats, setUserTodayStats] = useState<UserTodayStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<LeadItem | null>(null);
  const [selectedLeadForFollowUp, setSelectedLeadForFollowUp] = useState<LeadItem | null>(null);
  const [selectedLeadForReg, setSelectedLeadForReg] = useState<LeadItem | null>(null);
  const [selectedLeadForDead, setSelectedLeadForDead] = useState<LeadItem | null>(null);
  const [availableServices, setAvailableServices] = useState<string[]>([]);

  useEffect(() => {
    catalogService
      .getActiveServices()
      .then((data) => {
        const activeList = (data || []).filter((s) => s.isActive).map((s) => s.name);
        setAvailableServices(activeList);
      })
      .catch(() => {});
  }, [activeView]);

  useEffect(() => {
    fetchLeads();
  }, [
    activeView,
    statusMode,
    companyFilter,
    serviceFilter,
    currentPage,
    activeUserId,
    activeUserName,
    todayOnly,
  ]);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const query: LeadFilterQuery = {
        search: searchQuery.trim() || undefined,
        statusMode: statusMode === 'Active' ? 'NonDead' : statusMode,
        companyCode: companyFilter !== 'All Companies' ? companyFilter : undefined,
        service: serviceFilter !== 'All Services' ? serviceFilter : undefined,
        date: selectedDate || undefined,
        view: activeView,
        page: currentPage,
        limit: 15,
        userId: activeUserId || undefined,
        viewingUserId: activeUserId || undefined,
        selectedUserId: activeUserId || undefined,
        userName: activeUserName || undefined,
        todayOnly: todayOnly || undefined,
      };

      const res = await leadService.getLeads(query);
      setLeads(res.leads || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalCount(res.pagination?.total || 0);
      setStats(res.stats || null);
      if (res.userTodayStats) {
        setUserTodayStats(res.userTodayStats);
      } else {
        setUserTodayStats(null);
      }
    } catch (err) {
      console.error('Failed to load leads', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLeads();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDate('');
    setStatusMode('Active');
    setCompanyFilter('All Companies');
    setServiceFilter('All Services');
    setTodayOnly(false);
    setCurrentPage(1);
    // Trigger immediate refetch with clean values
    setIsLoading(true);
    leadService
      .getLeads({
        statusMode: 'NonDead',
        view: activeView,
        page: 1,
        limit: 15,
        userId: activeUserId || undefined,
        viewingUserId: activeUserId || undefined,
        selectedUserId: activeUserId || undefined,
        userName: activeUserName || undefined,
      })
      .then((res) => {
        setLeads(res.leads || []);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalCount(res.pagination?.total || 0);
        setStats(res.stats || null);
        setUserTodayStats(res.userTodayStats || null);
      })
      .finally(() => setIsLoading(false));
  };

  const handleClearMemberFilter = () => {
    setSearchParams({});
    if (isViewing) {
      stopViewing();
    }
    setUserTodayStats(null);
    setTodayOnly(false);
    setCurrentPage(1);
    navigate('/leads', { replace: true });
  };

  const formatDateDisplay = (dateStr?: string | Date) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
      });
    } catch {
      return String(dateStr);
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-500/20 text-red-300 border border-red-500/40';
      case 'Urgent':
        return 'bg-red-600 text-white font-black shadow-sm';
      case 'Low':
        return 'bg-slate-700/60 text-slate-300 border border-slate-600/40';
      case 'Normal':
      default:
        return 'bg-slate-800 text-slate-400 border border-slate-700/50';
    }
  };

  const getStageBadgeClass = (stage: string) => {
    switch (stage) {
      case 'Meeting':
        return 'bg-[#0284C7] text-white shadow-sm font-semibold';
      case 'Client':
        return 'bg-emerald-600 text-white shadow-sm font-bold';
      case 'Quotation':
        return 'bg-purple-600 text-white shadow-sm font-semibold';
      case 'Site Visit':
        return 'bg-amber-600 text-slate-950 font-bold';
      case 'Dead':
        return 'bg-red-700 text-white';
      case 'Lead':
      default:
        return 'bg-[#2563EB] text-white font-medium';
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1017] text-slate-200">
      {/* 1. Portal Brand Top Bar */}
      <div className="hidden md:flex bg-[#0A0D14] border-b border-[#1A2234] px-4 sm:px-6 py-2.5 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse" />
            <h1 className="text-xs sm:text-sm font-black tracking-widest uppercase font-mono text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
              LEAD FORCE PORTAL
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Active Session Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#141B2D] border border-amber-500/30 text-[11px] font-medium text-amber-300 font-mono shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>2026–2027 Session Active</span>
          </div>

          {/* Notifications */}
          <button
            type="button"
            title="Notifications"
            className="w-8 h-8 rounded-full bg-[#141B2D] border border-[#222E48] text-amber-400 hover:text-amber-300 flex items-center justify-center transition-colors"
          >
            <Bell className="w-3.5 h-3.5" />
          </button>

          {/* User profile capsule */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#1F293F]">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-[11px] font-semibold text-white leading-tight">
                {user?.email || 'admin@lucknowbuilders.com'}
              </p>
              <p className="text-[9px] text-amber-400/90 font-medium">Master Admin</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="p-4 sm:p-6 space-y-4">
        {/* Breadcrumb matching Screenshot 2 */}
        <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
          <span>Admin</span>
          <span>/</span>
          <span className="text-amber-400 font-semibold">Lead Management</span>
        </div>

        {/* Header line matching Screenshot 2 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-black text-[#EAB308] tracking-tight">
              Leads Management
            </h2>

            {/* Tabs: [Leads] [Associate Partners] matching Screenshot 2 */}
            <div className="flex items-center gap-1 bg-[#121724] border border-[#1E2638] rounded-xl p-1">
              <button
                type="button"
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#EAB308] text-slate-950 shadow-md cursor-pointer transition-all"
              >
                Leads
              </button>
              <button
                type="button"
                onClick={() => navigate('/leads/partners')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-[#1A2234] transition-all cursor-pointer"
              >
                Associate Partners
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* View switcher (List / Today Due / Process) */}
            <div className="hidden md:flex bg-[#121724] border border-[#20293D] rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={() => setActiveView('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeView === 'list'
                    ? 'bg-[#EAB308] text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ListIcon className="w-3.5 h-3.5" />
                <span>List</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('today-due')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeView === 'today-due'
                    ? 'bg-[#EAB308] text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Today Due</span>
                {stats && stats.todayDueCount > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                      activeView === 'today-due'
                        ? 'bg-slate-950 text-[#EAB308]'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {stats.todayDueCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveView('process')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeView === 'process'
                    ? 'bg-[#EAB308] text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Columns3 className="w-3.5 h-3.5" />
                <span>Process</span>
              </button>
            </div>

            {/* + Add Leads Button matching Screenshot 2 */}
            <button
              type="button"
              onClick={() => {
                setSelectedLeadForEdit(null);
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-[#EAB308] hover:bg-yellow-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Add Leads</span>
            </button>
          </div>
        </div>

        {/* 2. Team Member Profile & Today's Lead Management Activity Banner */}
        {(activeUserName || activeUserId) && (
          <div className="bg-gradient-to-r from-[#141A28] via-[#182136] to-[#121724] border border-amber-500/50 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
              {/* Member Identity */}
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-lg flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
                  {activeUserName ? activeUserName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base sm:text-lg font-black text-white">
                      {activeUserName || 'Team Member'}
                    </span>
                    {activeUserRole && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40 uppercase">
                        {activeUserRole}
                      </span>
                    )}
                    {viewingUser?.email && (
                      <span className="text-xs text-slate-400 font-mono">
                        ({viewingUser.email})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-amber-300/90 font-medium flex items-center gap-1.5 mt-0.5">
                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                    <span>Today's Lead Management Performance & Pipeline Record</span>
                  </p>
                </div>
              </div>

              {/* Today's Management Activity Counters */}
              <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                {/* Leads Added Today */}
                <div className="bg-[#0B0F1A] border border-amber-500/30 px-3.5 py-2 rounded-xl text-center min-w-[110px] shadow-sm">
                  <div className="text-[9.5px] uppercase font-bold text-slate-400 tracking-wider">
                    Leads Added Today
                  </div>
                  <div className="text-xl font-black text-amber-400 mt-0.5">
                    {userTodayStats?.leadsCreatedToday ?? 0}
                  </div>
                </div>

                {/* Follow-ups Handled Today */}
                <div className="bg-[#0B0F1A] border border-emerald-500/30 px-3.5 py-2 rounded-xl text-center min-w-[110px] shadow-sm">
                  <div className="text-[9.5px] uppercase font-bold text-slate-400 tracking-wider">
                    Follow-ups Today
                  </div>
                  <div className="text-xl font-black text-emerald-400 mt-0.5">
                    {userTodayStats?.followUpsToday ?? 0}
                  </div>
                </div>

                {/* Total Leads Managed */}
                <div className="bg-[#0B0F1A] border border-slate-700/60 px-3.5 py-2 rounded-xl text-center min-w-[90px] shadow-sm">
                  <div className="text-[9.5px] uppercase font-bold text-slate-400 tracking-wider">
                    Total Managed
                  </div>
                  <div className="text-xl font-black text-white mt-0.5">
                    {userTodayStats?.totalManaged ?? totalCount}
                  </div>
                </div>

                {/* Quick Toggle: Today's Work Only */}
                <div className="flex items-center gap-2 pl-1">
                  <button
                    type="button"
                    onClick={() => {
                      setTodayOnly(!todayOnly);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                      todayOnly
                        ? 'bg-[#EAB308] text-slate-950 font-black shadow-amber-500/25'
                        : 'bg-[#1C2538] hover:bg-[#25324c] text-slate-300 hover:text-white border border-[#2B3852]'
                    }`}
                  >
                    <span>⚡ Today's Work Only</span>
                    {todayOnly && <span className="w-2 h-2 rounded-full bg-slate-950 animate-pulse" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleClearMemberFilter}
                    className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer flex items-center gap-1"
                    title="Clear filter to view all team leads"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>View All Team Leads</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Filter Controls Row matching Screenshot 2 */}
        <form
          onSubmit={handleSearchSubmit}
          className="bg-[#10141F] border border-[#1E2638] rounded-xl px-4 py-3 flex flex-wrap items-center gap-3.5 text-xs shadow-md"
        >
          {/* Status Radio Buttons: Active / Dead / All */}
          <div className="flex items-center gap-3 text-slate-300">
            <span className="font-bold text-[#EAB308]">Status:</span>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white font-medium">
              <input
                type="radio"
                name="statusMode"
                checked={statusMode === 'Active'}
                onChange={() => {
                  setStatusMode('Active');
                  setCurrentPage(1);
                }}
                className="accent-amber-400 cursor-pointer"
              />
              <span>Active</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white font-medium">
              <input
                type="radio"
                name="statusMode"
                checked={statusMode === 'Dead'}
                onChange={() => {
                  setStatusMode('Dead');
                  setCurrentPage(1);
                }}
                className="accent-amber-400 cursor-pointer"
              />
              <span>Dead</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white font-medium">
              <input
                type="radio"
                name="statusMode"
                checked={statusMode === 'All'}
                onChange={() => {
                  setStatusMode('All');
                  setCurrentPage(1);
                }}
                className="accent-amber-400 cursor-pointer"
              />
              <span>All</span>
            </label>
          </div>

          {/* Search Input: Search Lead Name/Mobile... matching Screenshot 2 */}
          <div className="flex-1 min-w-[200px] max-w-sm">
            <input
              type="text"
              placeholder="Search Lead Name/Mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#161C2C] border border-[#2B354C] rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Date Picker: dd-mm-yyyy matching Screenshot 2 */}
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[#161C2C] border border-[#2B354C] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
              title="Pick Date to see that day's leads & activity"
            />
          </div>

          {/* Company filter */}
          <div>
            <select
              value={companyFilter}
              onChange={(e) => {
                setCompanyFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[#161C2C] border border-[#2B354C] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="All Companies">All Companies</option>
              <option value="LB">Lucknow Builders (LB)</option>
              <option value="LD">Lucknow Developers (LD)</option>
            </select>
          </div>

          {/* Filter Button (Gold with Funnel) matching Screenshot 2 */}
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-[#EAB308] hover:bg-yellow-400 text-slate-950 font-bold text-xs shadow transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Filter className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Filter</span>
          </button>

          {/* Clear Button (Dark with 'x') matching Screenshot 2 */}
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3.5 py-1.5 rounded-lg bg-[#283248] hover:bg-[#34405c] text-slate-200 font-semibold text-xs border border-slate-700 transition-all flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </form>

        {/* 4. Table / Process View Container */}
        {activeView === 'process' ? (
          /* KANBAN PROCESS PIPELINE VIEW */
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 pt-2">
            {(['Lead', 'Meeting', 'Site Visit', 'Quotation', 'Client'] as const).map((colStage) => {
              const colLeads = leads.filter((l) => l.stage === colStage);
              return (
                <div
                  key={colStage}
                  className="bg-[#111520] border border-[#1E273A] rounded-2xl flex flex-col max-h-[75vh]"
                >
                  <div className="p-3 border-b border-[#1E273A] flex items-center justify-between bg-[#151B2A] rounded-t-2xl">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
                      {colStage}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300">
                      {colLeads.length}
                    </span>
                  </div>

                  <div className="p-2 space-y-2 overflow-y-auto flex-1 custom-scrollbar">
                    {colLeads.length === 0 ? (
                      <div className="p-4 text-center text-slate-500 text-xs italic">
                        No leads in {colStage}
                      </div>
                    ) : (
                      colLeads.map((lead) => (
                        <div
                          key={lead._id}
                          className="p-3 rounded-xl bg-[#171E2E] border border-[#232D44] hover:border-amber-400/50 transition-all text-xs space-y-2 group shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-cyan-400 font-bold text-[11px]">
                              {lead.leadCode}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${getPriorityBadgeClass(
                                lead.priority
                              )}`}
                            >
                              {lead.priority}
                            </span>
                          </div>

                          <div>
                            <p className="font-bold text-white text-sm group-hover:text-amber-300 transition-colors">
                              {lead.clientName}
                            </p>
                            <p className="text-[10px] text-amber-400/80 font-medium">
                              {lead.targetCompanyName || lead.targetCompanyCode}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span>{lead.siteLocation}</span>
                          </div>

                          {lead.latestFollowUp?.remarks && (
                            <div className="p-2 bg-[#121622] rounded-lg text-[10.5px] border border-[#1E2536]">
                              <p className="text-amber-400/90 font-medium">
                                {formatDateDisplay(lead.latestFollowUp.date)}
                              </p>
                              <p className="text-slate-300 truncate">
                                {lead.latestFollowUp.remarks}
                              </p>
                            </div>
                          )}

                          <div className="pt-1 flex items-center justify-between border-t border-[#1E273A]">
                            <span className="text-[10px] text-slate-500 font-mono">
                              {lead.mobile1}
                            </span>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => setSelectedLeadForFollowUp(lead)}
                                className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-semibold"
                              >
                                Follow
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedLeadForEdit(lead);
                                  setIsAddModalOpen(true);
                                }}
                                className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-semibold"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TABULAR LIST VIEW EXACTLY MATCHING SCREENSHOT 2 COLUMNS:
             SN | DATE | TYPE | EMAIL | LEAD NAME | MOBILE | SERVICE / INTEREST | DUE DATE | STATUS | LAST REMARK | ACTIONS
          */
          <div className="bg-[#10141F] border border-[#1E2638] rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-[11.5px] min-w-[1050px]">
                <thead>
                  <tr className="bg-[#131825] border-b border-[#1E2638] text-[10.5px] font-extrabold tracking-wider text-[#EAB308] uppercase select-none">
                    <th className="py-3.5 px-3 w-12 text-center">SN</th>
                    <th className="py-3.5 px-3 min-w-[90px]">DATE</th>
                    <th className="py-3.5 px-3 min-w-[90px]">TYPE</th>
                    <th className="py-3.5 px-3 min-w-[140px]">EMAIL</th>
                    <th className="py-3.5 px-3 min-w-[150px]">LEAD NAME</th>
                    <th className="py-3.5 px-3 min-w-[110px]">MOBILE</th>
                    <th className="py-3.5 px-3 min-w-[150px]">SERVICE / INTEREST</th>
                    <th className="py-3.5 px-3 min-w-[100px]">DUE DATE</th>
                    <th className="py-3.5 px-3 min-w-[95px] text-center">STATUS</th>
                    <th className="py-3.5 px-3 min-w-[180px]">LAST REMARK</th>
                    <th className="py-3.5 px-3 text-center min-w-[190px]">ACTIONS</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#1A2234]">
                  {isLoading ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400 text-xs">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                          <span>Loading lead records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : leads.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400 text-xs">
                        <div className="max-w-md mx-auto space-y-2">
                          <p className="text-sm font-semibold text-slate-300">
                            {todayOnly
                              ? `No lead activity recorded today for ${activeUserName || 'this user'}`
                              : 'No leads found matching your criteria'}
                          </p>
                          <p className="text-slate-500 text-xs">
                            {todayOnly
                              ? 'Try clicking "View All Team Leads" or scheduling a follow-up.'
                              : 'Try adjusting filters or search keywords.'}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLeadForEdit(null);
                              setIsAddModalOpen(true);
                            }}
                            className="mt-2 px-4 py-1.5 bg-[#EAB308] hover:bg-yellow-400 text-slate-950 font-bold text-xs rounded-xl shadow"
                          >
                            + Add New Lead
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead, index) => {
                      const serialNumber = (currentPage - 1) * 15 + (index + 1);
                      const leadTypeDisplay =
                        lead.propertyType ||
                        (lead.targetCompanyCode ? `${lead.targetCompanyCode}` : 'Residential');

                      const dueDateDisplay = lead.latestFollowUp?.date
                        ? formatDateDisplay(lead.latestFollowUp.date)
                        : lead.meetingDateTime
                        ? formatDateDisplay(lead.meetingDateTime)
                        : '-';

                      const lastRemarkText =
                        lead.latestFollowUp?.remarks ||
                        (lead.followUps && lead.followUps.length > 0
                          ? lead.followUps[lead.followUps.length - 1].remarks
                          : '-');

                      return (
                        <tr
                          key={lead._id}
                          className="hover:bg-[#151C2C]/80 transition-colors group"
                        >
                          {/* 1. SN */}
                          <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                            {serialNumber}
                          </td>

                          {/* 2. DATE */}
                          <td className="py-3 px-3 whitespace-nowrap text-slate-300 font-medium">
                            {formatDateDisplay(lead.leadDate || lead.createdAt)}
                          </td>

                          {/* 3. TYPE */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700/60">
                              {leadTypeDisplay}
                            </span>
                          </td>

                          {/* 4. EMAIL */}
                          <td className="py-3 px-3 text-slate-300 truncate max-w-[160px]">
                            {lead.email ? (
                              <a
                                href={`mailto:${lead.email}`}
                                className="text-slate-300 hover:text-amber-300 underline-offset-2 hover:underline transition-colors"
                              >
                                {lead.email}
                              </a>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>

                          {/* 5. LEAD NAME */}
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                              {lead.clientName}
                            </div>
                            <div className="text-[10px] text-amber-500/90 font-mono font-semibold">
                              {lead.leadCode}
                            </div>
                          </td>

                          {/* 6. MOBILE */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <a
                              href={`tel:${lead.mobile1}`}
                              className="inline-flex items-center gap-1.5 text-slate-200 hover:text-emerald-400 font-mono font-medium transition-colors"
                            >
                              <Phone className="w-3 h-3 text-emerald-400" />
                              <span>{lead.mobile1}</span>
                            </a>
                          </td>

                          {/* 7. SERVICE / INTEREST */}
                          <td className="py-3 px-3 text-slate-300 font-medium">
                            {lead.requirements && lead.requirements.length > 0
                              ? lead.requirements.join(', ')
                              : lead.requirementType || '-'}
                          </td>

                          {/* 8. DUE DATE */}
                          <td className="py-3 px-3 whitespace-nowrap text-slate-300 font-medium">
                            {dueDateDisplay}
                          </td>

                          {/* 9. STATUS */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] ${getStageBadgeClass(
                                lead.stage
                              )}`}
                            >
                              {lead.stage}
                            </span>
                          </td>

                          {/* 10. LAST REMARK */}
                          <td className="py-3 px-3">
                            <div className="text-[11px] text-slate-300 line-clamp-2 max-w-[200px]" title={lastRemarkText}>
                              {lastRemarkText}
                            </div>
                            {lead.latestFollowUp?.createdByName && (
                              <div className="text-[9px] text-amber-400/80 font-medium mt-0.5">
                                by {lead.latestFollowUp.createdByName}
                              </div>
                            )}
                          </td>

                          {/* 11. ACTIONS */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Follow Button */}
                              <button
                                type="button"
                                onClick={() => setSelectedLeadForFollowUp(lead)}
                                title="Schedule Follow Up"
                                className="px-2.5 py-1 rounded-md bg-[#059669] hover:bg-[#10B981] text-white font-bold text-[10px] shadow-sm transition-all cursor-pointer"
                              >
                                Follow
                              </button>

                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedLeadForEdit(lead);
                                  setIsAddModalOpen(true);
                                }}
                                title="Edit Lead"
                                className="px-2.5 py-1 rounded-md bg-[#2563EB] hover:bg-[#3B82F6] text-white font-bold text-[10px] shadow-sm transition-all cursor-pointer"
                              >
                                Edit
                              </button>

                              {/* Reg Button */}
                              <button
                                type="button"
                                onClick={() => setSelectedLeadForReg(lead)}
                                title="Register as Official Client"
                                className="px-2.5 py-1 rounded-md bg-[#0891B2] hover:bg-[#06B6D4] text-white font-bold text-[10px] shadow-sm transition-all cursor-pointer"
                              >
                                Reg
                              </button>

                              {/* Dead / Revive Button */}
                              <button
                                type="button"
                                onClick={() => setSelectedLeadForDead(lead)}
                                title={lead.isDead ? 'Restore Dead Lead' : 'Mark Lead as Dead'}
                                className={`px-2.5 py-1 rounded-md text-white font-bold text-[10px] shadow-sm transition-all cursor-pointer ${
                                  lead.isDead
                                    ? 'bg-amber-600 hover:bg-amber-500'
                                    : 'bg-[#DC2626] hover:bg-[#EF4444]'
                                }`}
                              >
                                {lead.isDead ? 'Revive' : 'Dead'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="p-3 bg-[#131825] border-t border-[#1E2638] flex items-center justify-between text-xs text-slate-400">
                <span>
                  Showing page {currentPage} of {totalPages} ({totalCount} total records)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1 rounded-lg bg-[#182030] hover:bg-[#202B40] disabled:opacity-40 text-slate-300 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 font-semibold text-white">{currentPage}</span>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1 rounded-lg bg-[#182030] hover:bg-[#202B40] disabled:opacity-40 text-slate-300 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Modals */}
      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedLeadForEdit(null);
        }}
        onSuccess={() => fetchLeads()}
        leadToEdit={selectedLeadForEdit}
      />

      <FollowUpModal
        isOpen={!!selectedLeadForFollowUp}
        lead={selectedLeadForFollowUp}
        onClose={() => setSelectedLeadForFollowUp(null)}
        onSuccess={() => fetchLeads()}
      />

      <RegisterClientModal
        isOpen={!!selectedLeadForReg}
        lead={selectedLeadForReg}
        onClose={() => setSelectedLeadForReg(null)}
        onSuccess={() => fetchLeads()}
      />

      <MarkDeadModal
        isOpen={!!selectedLeadForDead}
        lead={selectedLeadForDead}
        onClose={() => setSelectedLeadForDead(null)}
        onSuccess={() => fetchLeads()}
      />
    </div>
  );
};
