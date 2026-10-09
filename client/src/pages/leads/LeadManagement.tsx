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
  GripVertical,
  FileText,
  AlertTriangle,
  MessageSquare,
  UserPlus,
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
import { UserProfileMenu } from '../../components/profile/UserProfileMenu';

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
  const paramView = (searchParams.get('view') as 'list' | 'today-due' | 'process') || 'list';
  const paramToday = searchParams.get('todayOnly') === 'true' || searchParams.get('today') === 'true';
  const paramSearch = searchParams.get('search') || '';
  const paramDate = searchParams.get('date') || '';
  const paramStage = searchParams.get('stage') || 'All Stages';

  const [activeView, setActiveView] = useState<'list' | 'today-due' | 'process'>(paramView);

  // Filter States matching Screenshot 2
  const [searchQuery, setSearchQuery] = useState(paramSearch);
  const [selectedDate, setSelectedDate] = useState(paramDate);
  const [statusMode, setStatusMode] = useState<'Active' | 'Dead' | 'All'>('Active');
  const [companyFilter, setCompanyFilter] = useState('All Companies');
  const [serviceFilter, setServiceFilter] = useState('All Services');
  const [stageFilter, setStageFilter] = useState(paramStage);
  const [todayOnly, setTodayOnly] = useState(paramToday);

  // Sync state when URL search params change
  useEffect(() => {
    const v = searchParams.get('view');
    if (v === 'list' || v === 'today-due' || v === 'process') {
      setActiveView(v);
    }
    if (searchParams.has('todayOnly') || searchParams.has('today')) {
      const t = searchParams.get('todayOnly') === 'true' || searchParams.get('today') === 'true';
      setTodayOnly(t);
    }
    const s = searchParams.get('search');
    if (s !== null) {
      setSearchQuery(s);
    }
    const st = searchParams.get('stage');
    if (st !== null) {
      setStageFilter(st);
    }
    const d = searchParams.get('date');
    if (d !== null) {
      setSelectedDate(d);
    }
  }, [searchParams]);

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

  // Drag and Drop Pipeline States
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<{
    message: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

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
    stageFilter,
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
        // In process/Kanban view, always fetch All leads (including Dead) so all 6 columns stay full
        statusMode: activeView === 'process' ? 'All' : statusMode === 'Active' ? 'NonDead' : statusMode,
        companyCode: companyFilter !== 'All Companies' ? companyFilter : undefined,
        service: serviceFilter !== 'All Services' ? serviceFilter : undefined,
        stage: stageFilter !== 'All Stages' ? stageFilter : undefined,
        date: selectedDate || undefined,
        view: activeView,
        page: activeView === 'process' ? 1 : currentPage,
        limit: activeView === 'process' ? 200 : 15,
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

  /**
   * Handle dragging & dropping a lead card into any stage (Lead, Meeting, Site Visit, Quotation, Client, Dead)
   */
  const handleDropLead = async (leadId: string, targetStage: string) => {
    const leadToMove = leads.find((l) => l._id === leadId);
    if (!leadToMove) return;

    const currentStage = leadToMove.isDead ? 'Dead' : leadToMove.stage;
    if (currentStage === targetStage) return;

    // 1. Optimistic instant UI update
    setLeads((prevLeads) =>
      prevLeads.map((item) => {
        if (item._id === leadId) {
          if (targetStage === 'Dead') {
            return { ...item, stage: 'Dead' as any, isDead: true };
          }
          return { ...item, stage: targetStage as any, isDead: false };
        }
        return item;
      })
    );

    setFeedbackNotice({
      message: `Moving "${leadToMove.clientName}" to ${targetStage.toUpperCase()}...`,
      type: 'info',
    });

    try {
      if (targetStage === 'Dead') {
        // Mark lead dead
        await leadService.markDead(leadId, 'Moved to Dead via Pipeline Drag & Drop');
        setFeedbackNotice({
          message: `Lead "${leadToMove.clientName}" marked as DEAD`,
          type: 'error',
        });
      } else if (leadToMove.isDead) {
        // Restore from dead and update stage
        await leadService.restoreDead(leadId);
        if (targetStage !== 'Lead') {
          await leadService.updateLead(leadId, { stage: targetStage as any });
        }
        setFeedbackNotice({
          message: `Lead "${leadToMove.clientName}" restored & moved to ${targetStage}`,
          type: 'success',
        });
      } else {
        // Standard pipeline stage update
        await leadService.updateLead(leadId, { stage: targetStage as any });
        setFeedbackNotice({
          message: `Lead "${leadToMove.clientName}" successfully moved to ${targetStage}`,
          type: 'success',
        });
      }

      // If dropped into Client, trigger registration modal if not yet registered
      if (targetStage === 'Client' && !leadToMove.isRegisteredClient) {
        setSelectedLeadForReg(leadToMove);
      }
    } catch (err: any) {
      console.error('Failed to update stage on server', err);
      // Revert from server
      fetchLeads();
      setFeedbackNotice({
        message: err.response?.data?.message || err.message || 'Failed to update stage',
        type: 'error',
      });
    } finally {
      setTimeout(() => {
        setFeedbackNotice(null);
      }, 4500);
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

          {/* User profile capsule with full interactive profile section */}
          <div className="pl-2 border-l border-[#1F293F]">
            <UserProfileMenu />
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

          {/* Stage filter */}
          <div>
            <select
              value={stageFilter}
              onChange={(e) => {
                setStageFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[#161C2C] border border-[#2B354C] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="All Stages">All Stages</option>
              <option value="Lead">Lead</option>
              <option value="Meeting">Meeting</option>
              <option value="Site Visit">Site Visit</option>
              <option value="Quotation">Quotation</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Client">Client</option>
              <option value="Dead">Dead</option>
            </select>
          </div>

          {/* Active Today Only Badge */}
          {todayOnly && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 border border-amber-500/40 rounded-lg text-xs text-amber-300 font-semibold">
              <span>Today Only</span>
              <button
                type="button"
                onClick={() => setTodayOnly(false)}
                className="hover:text-white cursor-pointer"
                title="Remove today only filter"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

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
          /* KANBAN PROCESS PIPELINE VIEW WITH FULL DRAG & DROP & DEAD COLUMN */
          <div className="space-y-3 pt-2">
            {/* Feedback notification toast */}
            {feedbackNotice && (
              <div
                className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold shadow-lg animate-in fade-in duration-200 ${
                  feedbackNotice.type === 'success'
                    ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                    : feedbackNotice.type === 'error'
                    ? 'bg-rose-950/80 border-rose-500/40 text-rose-300'
                    : 'bg-amber-950/80 border-amber-500/40 text-amber-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {feedbackNotice.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : feedbackNotice.type === 'error' ? (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  ) : (
                    <Clock className="w-4 h-4 shrink-0 text-amber-400 animate-spin" />
                  )}
                  <span>{feedbackNotice.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFeedbackNotice(null)}
                  className="p-1 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Kanban Info & Helper Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-[#121725] border border-[#1E273A] text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="font-bold text-white tracking-wide">
                  Interactive Lead Pipeline
                </span>
                <span className="text-slate-400 hidden md:inline">
                  • Drag any lead card between columns to update stage (including DEAD)
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="text-slate-400">Total Pipeline:</span>
                <span className="px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300">
                  {leads.length} Leads
                </span>
              </div>
            </div>

            {/* 6 Kanban Columns with Drag and Drop */}
            <div className="flex gap-3.5 overflow-x-auto pb-4 custom-scrollbar select-none min-h-[72vh]">
              {[
                {
                  id: 'Lead',
                  label: 'LEAD',
                  headerBg: 'bg-[#101726] border-cyan-500/30',
                  titleColor: 'text-cyan-400',
                  badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
                  indicatorColor: 'bg-cyan-400',
                  icon: UserPlus,
                },
                {
                  id: 'Meeting',
                  label: 'MEETING',
                  headerBg: 'bg-[#1B1812] border-amber-500/30',
                  titleColor: 'text-amber-400',
                  badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                  indicatorColor: 'bg-amber-400',
                  icon: Calendar,
                },
                {
                  id: 'Site Visit',
                  label: 'SITE VISIT',
                  headerBg: 'bg-[#181325] border-purple-500/30',
                  titleColor: 'text-purple-400',
                  badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
                  indicatorColor: 'bg-purple-400',
                  icon: MapPin,
                },
                {
                  id: 'Quotation',
                  label: 'QUOTATION',
                  headerBg: 'bg-[#10192A] border-blue-500/30',
                  titleColor: 'text-blue-400',
                  badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                  indicatorColor: 'bg-blue-400',
                  icon: FileText,
                },
                {
                  id: 'Client',
                  label: 'CLIENT',
                  headerBg: 'bg-[#0E2018] border-emerald-500/30',
                  titleColor: 'text-emerald-400',
                  badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                  indicatorColor: 'bg-emerald-400',
                  icon: CheckCircle2,
                },
                {
                  id: 'Dead',
                  label: 'DEAD',
                  headerBg: 'bg-[#220E14] border-rose-500/30',
                  titleColor: 'text-rose-400',
                  badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
                  indicatorColor: 'bg-rose-400',
                  icon: AlertTriangle,
                },
              ].map((colStage) => {
                const colLeads = leads.filter((l) => {
                  if (colStage.id === 'Dead') {
                    return l.stage === 'Dead' || l.isDead === true;
                  }
                  return !l.isDead && l.stage === colStage.id;
                });

                const isOverThis = dragOverStage === colStage.id;
                const ColIcon = colStage.icon;

                return (
                  <div
                    key={colStage.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverStage !== colStage.id) {
                        setDragOverStage(colStage.id);
                      }
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setDragOverStage(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverStage(null);
                      const leadId =
                        e.dataTransfer.getData('text/plain') || draggedLeadId;
                      if (leadId) {
                        handleDropLead(leadId, colStage.id);
                      }
                    }}
                    className={`w-[305px] sm:w-[315px] shrink-0 bg-[#10141F] rounded-2xl flex flex-col transition-all duration-200 shadow-xl border ${
                      isOverThis
                        ? 'border-amber-400 bg-[#151D2F] ring-2 ring-amber-400/50 shadow-[0_0_25px_rgba(245,158,11,0.25)]'
                        : 'border-[#1D2538]'
                    }`}
                  >
                    {/* Column Header */}
                    <div
                      className={`p-3 border-b flex items-center justify-between rounded-t-2xl transition-colors ${colStage.headerBg}`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${colStage.indicatorColor}`}
                        />
                        <ColIcon className="w-3.5 h-3.5 shrink-0" />
                        <span
                          className={`font-black text-xs uppercase tracking-wider font-mono ${colStage.titleColor}`}
                        >
                          {colStage.label}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold font-mono border ${colStage.badgeClass}`}
                      >
                        {colLeads.length}
                      </span>
                    </div>

                    {/* Drag-over drop prompt banner */}
                    {isOverThis && (
                      <div className="m-2 p-2.5 rounded-xl border border-dashed border-amber-400 bg-amber-500/10 text-amber-300 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-pulse">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Drop here to move to {colStage.label}</span>
                      </div>
                    )}

                    {/* Cards Container */}
                    <div className="p-2.5 space-y-2.5 overflow-y-auto flex-1 custom-scrollbar max-h-[70vh]">
                      {colLeads.length === 0 ? (
                        <div className="p-6 text-center border border-dashed border-[#1E273A] rounded-xl text-slate-500 text-xs flex flex-col items-center justify-center gap-2 my-2 bg-[#0C101A]">
                          <ColIcon className="w-6 h-6 text-slate-600 stroke-[1.5]" />
                          <p className="font-medium italic">No leads in {colStage.label}</p>
                          <span className="text-[10px] text-slate-600">
                            Drag a card here to update status
                          </span>
                        </div>
                      ) : (
                        colLeads.map((lead) => {
                          const isBeingDragged = draggedLeadId === lead._id;
                          return (
                            <div
                              key={lead._id}
                              draggable={true}
                              onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', lead._id);
                                setDraggedLeadId(lead._id);
                              }}
                              onDragEnd={() => {
                                setDraggedLeadId(null);
                                setDragOverStage(null);
                              }}
                              className={`p-3 rounded-xl bg-[#161C2C] border transition-all text-xs space-y-2 group shadow-md cursor-grab active:cursor-grabbing hover:bg-[#1A2236] ${
                                isBeingDragged
                                  ? 'opacity-40 border-dashed border-amber-400 scale-[0.98]'
                                  : 'border-[#222B40] hover:border-amber-400/50'
                              }`}
                            >
                              {/* Top Bar: Grip handle + Lead code + Priority */}
                              <div className="flex items-center justify-between gap-1.5">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span title="Drag to change stage" className="shrink-0 flex items-center">
                                    <GripVertical className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 shrink-0 transition-colors" />
                                  </span>
                                  <span className="font-mono text-cyan-400 font-bold text-[11px] tracking-wide truncate">
                                    {lead.leadCode}
                                  </span>
                                </div>
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider shrink-0 border ${getPriorityBadgeClass(
                                    lead.priority
                                  )}`}
                                >
                                  {lead.priority}
                                </span>
                              </div>

                              {/* Client Name & Target Company */}
                              <div>
                                <p className="font-black text-white text-sm group-hover:text-amber-300 transition-colors leading-tight">
                                  {lead.clientName}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  <span className="text-[10px] text-amber-300 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                    {lead.targetCompanyName ||
                                      (lead.targetCompanyCode === 'LD'
                                        ? 'Lucknow Developers'
                                        : 'Lucknow Builders')}
                                  </span>
                                  {lead.requirements?.[0] && (
                                    <span className="text-[9.5px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded truncate max-w-[140px]">
                                      {lead.requirements[0]}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Site Location & Budget */}
                              <div className="flex items-center justify-between text-[11px] text-slate-400 gap-2 pt-0.5">
                                <div className="flex items-center gap-1 truncate">
                                  <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                                  <span className="truncate">
                                    {lead.siteLocation || 'Location not specified'}
                                  </span>
                                </div>
                                {lead.finances?.budget ? (
                                  <span className="text-[10px] font-mono font-bold text-emerald-400 shrink-0 bg-emerald-950/60 px-1 py-0.2 rounded border border-emerald-500/20">
                                    ₹{lead.finances.budget.toLocaleString('en-IN')}
                                  </span>
                                ) : null}
                              </div>

                              {/* Follow-up Remark or Scheduled Meeting */}
                              {lead.latestFollowUp?.remarks ? (
                                <div className="p-2 bg-[#101420] rounded-lg text-[10.5px] border border-[#1B2234] space-y-0.5">
                                  <p className="text-amber-400 font-bold flex items-center gap-1 text-[10px]">
                                    <Clock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                                    <span>
                                      {formatDateDisplay(lead.latestFollowUp.date)}
                                    </span>
                                  </p>
                                  <p className="text-slate-300 line-clamp-2 leading-relaxed">
                                    {lead.latestFollowUp.remarks}
                                  </p>
                                </div>
                              ) : lead.meetingDateTime ? (
                                <div className="p-2 bg-[#101826] rounded-lg text-[10.5px] border border-cyan-500/20 space-y-0.5">
                                  <p className="text-cyan-400 font-bold flex items-center gap-1 text-[10px]">
                                    <Calendar className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                                    <span>
                                      Meeting: {formatDateDisplay(lead.meetingDateTime)}
                                    </span>
                                  </p>
                                </div>
                              ) : null}

                              {/* Contact Bar + Quick Stage Switcher */}
                              <div className="pt-1.5 flex items-center justify-between border-t border-[#1F273C] gap-1">
                                <div className="flex items-center gap-1">
                                  {/* Click to Call */}
                                  <a
                                    href={`tel:${lead.mobile1}`}
                                    title={`Call ${lead.clientName} (${lead.mobile1})`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1 rounded bg-[#131722] hover:bg-emerald-600/25 hover:text-emerald-300 text-slate-300 text-[10.5px] font-mono flex items-center gap-1 transition-colors"
                                  >
                                    <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                                    <span>{lead.mobile1}</span>
                                  </a>

                                  {/* Direct WhatsApp Message */}
                                  {lead.mobile1 && (
                                    <a
                                      href={`https://wa.me/91${lead.mobile1.replace(
                                        /\D/g,
                                        ''
                                      )}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Chat on WhatsApp"
                                      onClick={(e) => e.stopPropagation()}
                                      className="p-1 rounded bg-emerald-950/60 hover:bg-emerald-600 hover:text-white text-emerald-400 border border-emerald-500/30 transition-colors"
                                    >
                                      <MessageSquare className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>

                                {/* Quick Move dropdown (touch & beginner friendly) */}
                                <select
                                  value={colStage.id}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleDropLead(lead._id, e.target.value);
                                  }}
                                  title="Change stage"
                                  className="bg-[#101420] border border-[#232F48] hover:border-amber-400/50 text-[9.5px] text-amber-300 font-bold rounded px-1.5 py-0.5 cursor-pointer focus:outline-none"
                                >
                                  <option value={colStage.id} disabled>
                                    Move ▾
                                  </option>
                                  <option value="Lead">→ Lead</option>
                                  <option value="Meeting">→ Meeting</option>
                                  <option value="Site Visit">→ Site Visit</option>
                                  <option value="Quotation">→ Quotation</option>
                                  <option value="Client">→ Client</option>
                                  <option value="Dead">→ Dead</option>
                                </select>
                              </div>

                              {/* Card Bottom Actions */}
                              <div className="flex items-center gap-1.5 pt-1">
                                {colStage.id === 'Dead' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDropLead(lead._id, 'Lead')}
                                    className="flex-1 py-1 px-2 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-[10.5px] font-bold border border-amber-500/40 flex items-center justify-center gap-1 transition-all cursor-pointer"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Restore to Lead</span>
                                  </button>
                                ) : colStage.id === 'Client' && !lead.isRegisteredClient ? (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedLeadForReg(lead)}
                                    className="flex-1 py-1 px-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10.5px] font-black flex items-center justify-center gap-1 shadow-sm transition-all cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Register Client</span>
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedLeadForFollowUp(lead)}
                                      className="flex-1 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10.5px] font-bold transition-colors cursor-pointer text-center"
                                    >
                                      Follow
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedLeadForEdit(lead);
                                        setIsAddModalOpen(true);
                                      }}
                                      className="flex-1 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10.5px] font-bold transition-colors cursor-pointer text-center"
                                    >
                                      Edit
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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
