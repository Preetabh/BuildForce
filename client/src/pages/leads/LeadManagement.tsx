import React, { useState, useEffect } from 'react';
import {
  Search,
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
  Building,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { LeadItem, LeadStats } from '../../types';
import leadService, { LeadFilterQuery } from '../../services/lead.service';
import { AddLeadModal } from '../../components/leads/AddLeadModal';
import { FollowUpModal } from '../../components/leads/FollowUpModal';
import { RegisterClientModal } from '../../components/leads/RegisterClientModal';
import { MarkDeadModal } from '../../components/leads/MarkDeadModal';
import { useAuth } from '../../context/AuthContext';

export const LeadManagement: React.FC = () => {
  const { user } = useAuth();

  // Active view: 'list' | 'today-due' | 'process'
  const [activeView, setActiveView] = useState<'list' | 'today-due' | 'process'>('list');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusMode, setStatusMode] = useState<'NonDead' | 'Dead' | 'All'>('NonDead');
  const [companyFilter, setCompanyFilter] = useState('All Companies');
  const [serviceFilter, setServiceFilter] = useState('All Services');

  // Leads & Pagination
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
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

  useEffect(() => {
    fetchLeads();
  }, [activeView, statusMode, companyFilter, serviceFilter, currentPage]);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const query: LeadFilterQuery = {
        search: searchQuery,
        statusMode,
        companyCode: companyFilter,
        service: serviceFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        view: activeView,
        page: currentPage,
        limit: 15,
      };

      const res = await leadService.getLeads(query);
      setLeads(res.leads);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
      setStats(res.stats);
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
    setStartDate('');
    setEndDate('');
    setStatusMode('NonDead');
    setCompanyFilter('All Companies');
    setServiceFilter('All Services');
    setCurrentPage(1);
  };

  const formatDateDisplay = (dateStr?: string | Date) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
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
      <div className="bg-[#0A0D14] border-b border-[#1A2234] px-4 sm:px-6 py-2.5 flex items-center justify-between">
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
        {/* 2. Subheader & Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <span>Admin</span>
              <span>/</span>
              <span className="text-amber-400 font-semibold">Lead Management</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <h2 className="text-2xl font-black text-white tracking-tight">
                Leads ({totalCount})
              </h2>
            </div>
            <p className="text-xs text-slate-400">Track and manage your sales pipeline</p>
          </div>

          {/* Views Toggles & New Lead Button */}
          <div className="flex items-center gap-3">
            <div className="flex bg-[#121724] border border-[#20293D] rounded-xl p-1 gap-1">
              {/* List View */}
              <button
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

              {/* Today Due View */}
              <button
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
                      activeView === 'today-due' ? 'bg-slate-950 text-[#EAB308]' : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {stats.todayDueCount}
                  </span>
                )}
              </button>

              {/* Process / Kanban View */}
              <button
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

            {/* + New Lead Button */}
            <button
              onClick={() => {
                setSelectedLeadForEdit(null);
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#9333ea] to-[#a855f7] hover:from-[#8b24e6] hover:to-[#9f45f0] text-white font-bold text-xs shadow-lg shadow-purple-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ New Lead</span>
            </button>
          </div>
        </div>

        {/* 3. Filter Controls Row */}
        <form
          onSubmit={handleSearchSubmit}
          className="bg-[#10141F] border border-[#1E2638] rounded-2xl p-3 sm:p-3.5 flex flex-wrap items-center gap-3 text-xs shadow-xl"
        >
          {/* Search input + button */}
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <input
              type="text"
              placeholder="Search Lead"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#161C2C] border border-[#2B354C] rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-xl bg-[#0284C7] hover:bg-[#0369a1] text-white font-bold text-xs shadow-md transition-all shrink-0 cursor-pointer"
            >
              Search
            </button>
          </div>

          {/* Date Range: dd-mm-yyyy To dd-mm-yyyy */}
          <div className="flex items-center gap-1.5 text-slate-400">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-[#161C2C] border border-[#2B354C] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
            />
            <span className="text-[11px] text-slate-500">To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-[#161C2C] border border-[#2B354C] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Status Radio Buttons: NonDead, Dead, All */}
          <div className="flex items-center gap-3 px-3 py-1.5 bg-[#161C2C] border border-[#2B354C] rounded-xl">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 font-medium">
              <input
                type="radio"
                name="statusMode"
                checked={statusMode === 'NonDead'}
                onChange={() => setStatusMode('NonDead')}
                className="accent-amber-400"
              />
              <span>NonDead</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 font-medium">
              <input
                type="radio"
                name="statusMode"
                checked={statusMode === 'Dead'}
                onChange={() => setStatusMode('Dead')}
                className="accent-amber-400"
              />
              <span>Dead</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 font-medium">
              <input
                type="radio"
                name="statusMode"
                checked={statusMode === 'All'}
                onChange={() => setStatusMode('All')}
                className="accent-amber-400"
              />
              <span>All</span>
            </label>
          </div>

          {/* Company Filter Dropdown */}
          <div>
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="bg-[#161C2C] border border-[#2B354C] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="All Companies">All Companies</option>
              <option value="LB">Lucknow Builders (LB)</option>
              <option value="LD">Lucknow Developers (LD)</option>
            </select>
          </div>

          {/* Service Filter Dropdown */}
          <div>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="bg-[#161C2C] border border-[#2B354C] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="All Services">All Services</option>
              <option value="Construction Furnished">Construction Furnished</option>
              <option value="Construction Raw / Grey Structure">Construction Raw</option>
              <option value="Architectural Design">Architectural Design</option>
              <option value="Interior Designing">Interior Designing</option>
              <option value="Renovation & Remodelling">Renovation</option>
            </select>
          </div>

          {/* Reset button */}
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3 py-1.5 rounded-xl bg-[#1E2638] hover:bg-[#2A354E] text-slate-300 hover:text-white font-semibold text-xs border border-[#2B354C] transition-all cursor-pointer flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
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
                  {/* Column Header */}
                  <div className="p-3 border-b border-[#1E273A] flex items-center justify-between bg-[#151B2A] rounded-t-2xl">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
                      {colStage}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300">
                      {colLeads.length}
                    </span>
                  </div>

                  {/* Cards List */}
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
                                onClick={() => setSelectedLeadForFollowUp(lead)}
                                className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-semibold"
                              >
                                Follow
                              </button>
                              <button
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
          /* TABULAR LIST VIEW (Matching Image 2 exactly!) */
          <div className="bg-[#10141F] border border-[#1E2638] rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-[11.5px]">
                <thead>
                  <tr className="bg-[#131825] border-b border-[#1E2638] text-[10px] font-bold tracking-wider text-amber-400/90 uppercase select-none">
                    <th className="py-3 px-3 w-10 text-center">S.N</th>
                    <th className="py-3 px-3">ID</th>
                    <th className="py-3 px-3">DATE</th>
                    <th className="py-3 px-3 min-w-[130px]">LEAD NAME</th>
                    <th className="py-3 px-3">SITE LOCATION</th>
                    <th className="py-3 px-3 min-w-[140px]">ASSOCIATE</th>
                    <th className="py-3 px-3 text-center">AREA</th>
                    <th className="py-3 px-3">SERVICES</th>
                    <th className="py-3 px-3 min-w-[110px]">MOBILE</th>
                    <th className="py-3 px-3 text-center">PRIORITY</th>
                    <th className="py-3 px-3 text-center">STAGE</th>
                    <th className="py-3 px-3 min-w-[150px]">FOLLOW UP</th>
                    <th className="py-3 px-3 text-center min-w-[190px]">ACTION</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#1A2234]">
                  {isLoading ? (
                    <tr>
                      <td colSpan={13} className="py-12 text-center text-slate-400 text-xs">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                          <span>Loading real lead records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : leads.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="py-12 text-center text-slate-400 text-xs">
                        <div className="max-w-md mx-auto space-y-2">
                          <p className="text-sm font-semibold text-slate-300">No leads found</p>
                          <p className="text-slate-500 text-xs">
                            Try adjusting your filters or search keywords.
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
                      const associateTitle =
                        lead.referenceType === 'Social Media'
                          ? `Social Media : ${lead.referenceDetails?.channel || 'Facebook'}`
                          : lead.referenceType === 'Associate'
                          ? lead.referenceDetails?.partnerName || 'Associate'
                          : lead.referenceType === 'Employee'
                          ? lead.referenceDetails?.employeeName || 'Employee'
                          : 'Direct';

                      const associateSub =
                        lead.referenceType === 'Social Media'
                          ? 'Social Media'
                          : lead.referenceType === 'Associate'
                          ? 'Associate'
                          : lead.referenceType === 'Employee'
                          ? 'Employee'
                          : 'Direct';

                      return (
                        <tr
                          key={lead._id}
                          className="hover:bg-[#151C2C]/80 transition-colors group"
                        >
                          {/* S.N */}
                          <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                            {serialNumber}
                          </td>

                          {/* ID */}
                          <td className="py-3 px-3 font-mono text-cyan-400 font-semibold tracking-wide">
                            {lead.leadCode}
                          </td>

                          {/* DATE */}
                          <td className="py-3 px-3 whitespace-nowrap text-slate-300 font-medium">
                            {formatDateDisplay(lead.leadDate)}
                          </td>

                          {/* LEAD NAME with company code */}
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                              {lead.clientName}
                            </div>
                            <div className="text-[10px] text-amber-500/90 font-mono font-semibold">
                              {lead.targetCompanyCode || 'LB'}
                            </div>
                          </td>

                          {/* SITE LOCATION */}
                          <td className="py-3 px-3 font-medium text-slate-300">
                            {lead.siteLocation || '-'}
                          </td>

                          {/* ASSOCIATE */}
                          <td className="py-3 px-3">
                            <div className="text-amber-400/95 font-medium leading-tight">
                              {associateTitle}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium">
                              {associateSub}
                            </div>
                          </td>

                          {/* AREA */}
                          <td className="py-3 px-3 text-center font-mono text-slate-300">
                            {lead.landArea || '-'}
                          </td>

                          {/* SERVICES */}
                          <td className="py-3 px-3 text-slate-300 font-medium">
                            {lead.requirements?.[0] || 'Construction Furnished'}
                          </td>

                          {/* MOBILE */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <a
                              href={`tel:${lead.mobile1}`}
                              className="inline-flex items-center gap-1.5 text-slate-200 hover:text-emerald-400 font-mono font-medium transition-colors"
                            >
                              <Phone className="w-3 h-3 text-emerald-400" />
                              <span>{lead.mobile1}</span>
                            </a>
                          </td>

                          {/* PRIORITY */}
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${getPriorityBadgeClass(
                                lead.priority
                              )}`}
                            >
                              {lead.priority}
                            </span>
                          </td>

                          {/* STAGE */}
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] ${getStageBadgeClass(
                                lead.stage
                              )}`}
                            >
                              {lead.stage}
                            </span>
                          </td>

                          {/* FOLLOW UP */}
                          <td className="py-3 px-3">
                            {lead.latestFollowUp?.date ? (
                              <div className="space-y-0.5">
                                <div className="font-bold text-slate-200 text-[11px]">
                                  {formatDateDisplay(lead.latestFollowUp.date)}
                                </div>
                                <div className="text-[10px] text-slate-400 line-clamp-1 italic">
                                  {lead.latestFollowUp.remarks}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-[11px]">-</span>
                            )}
                          </td>

                          {/* ACTION BUTTONS (Follow, Edit, Reg, Dead) */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Follow Button */}
                              <button
                                onClick={() => setSelectedLeadForFollowUp(lead)}
                                title="Schedule Follow Up"
                                className="px-2.5 py-1 rounded-md bg-[#059669] hover:bg-[#10B981] text-white font-bold text-[10px] shadow-sm transition-all cursor-pointer"
                              >
                                Follow
                              </button>

                              {/* Edit Button */}
                              <button
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
                                onClick={() => setSelectedLeadForReg(lead)}
                                title="Register as Official Client"
                                className="px-2.5 py-1 rounded-md bg-[#0891B2] hover:bg-[#06B6D4] text-white font-bold text-[10px] shadow-sm transition-all cursor-pointer"
                              >
                                Reg
                              </button>

                              {/* Dead Button */}
                              <button
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
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1 rounded-lg bg-[#182030] hover:bg-[#202B40] disabled:opacity-40 text-slate-300"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 font-semibold text-white">{currentPage}</span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1 rounded-lg bg-[#182030] hover:bg-[#202B40] disabled:opacity-40 text-slate-300"
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
