import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  HardHat,
  Building2,
  Calendar,
  Clock,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ArrowRight,
  TrendingUp,
  MapPin,
  Bell,
  Eye,
  FileText,
  Users,
  ShieldCheck,
  X,
  MessageSquare,
  ChevronDown,
  Phone,
  MessageCircle,
  ExternalLink,
  DollarSign,
  Briefcase,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { siteService } from '../../services/site.service';
import { leadService } from '../../services/lead.service';
import { dailyReportService } from '../../services/dailyReport.service';
import { notificationService } from '../../services/notification.service';
import { Project, ClientRecord } from '../../types';
import { DailySiteReportItem } from '../../types/dailyReport';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface OutletContextType {
  setSidebarOpen: (open: boolean) => void;
}

export const DedicatedEngineerDashboard: React.FC = () => {
  const { setSidebarOpen } = useOutletContext<OutletContextType>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  useEscapeKey(() => setSelectedReportId(null), Boolean(selectedReportId));

  // 1. Fetch assigned clients (Customer Construction Sites)
  const { data: assignedClients = [], isLoading: isLoadingClients } = useQuery<ClientRecord[]>({
    queryKey: ['myAssignedClientsList'],
    queryFn: () => leadService.getClients(),
  });

  // 2. Fetch assigned sites (Projects)
  const { data: sitesData, isLoading: isLoadingSites } = useQuery({
    queryKey: ['myAssignedSitesList'],
    queryFn: () => siteService.getSites({ limit: 50 }),
  });

  const assignedSites = sitesData?.projects || [];

  // Parse selector state
  const isClientSelected = selectedSiteId.startsWith('client:');
  const isProjectSelected = selectedSiteId.startsWith('project:');
  const filterClientId = isClientSelected ? selectedSiteId.replace('client:', '') : undefined;
  const filterProjectId = isProjectSelected
    ? selectedSiteId.replace('project:', '')
    : selectedSiteId !== 'all' && !isClientSelected
    ? selectedSiteId
    : undefined;

  // 3. Fetch daily reports for this engineer
  const { data: reportsData, isLoading: isLoadingReports } = useQuery({
    queryKey: ['mySiteReports', selectedSiteId],
    queryFn: () =>
      dailyReportService.getReports({
        projectId: filterProjectId,
        clientId: filterClientId,
        limit: 50,
      }),
  });

  // 4. Fetch notifications
  const { data: notificationsData } = useQuery({
    queryKey: ['userNotifications'],
    queryFn: notificationService.getNotifications,
  });

  // 5. Detail view query
  const { data: currentReport } = useQuery({
    queryKey: ['engineerReportDetail', selectedReportId],
    queryFn: () => (selectedReportId ? dailyReportService.getReportById(selectedReportId) : null),
    enabled: Boolean(selectedReportId),
  });

  const reports = reportsData?.reports || [];
  const notifications = notificationsData?.notifications || [];

  // Today's date string (YYYY-MM-DD)
  const todayStr = new Date().toISOString().slice(0, 10);

  // Check today's submission status for selected site or all sites
  const todayReport = useMemo(() => {
    return reports.find((r) => {
      const rDate = new Date(r.reportDate).toISOString().slice(0, 10);
      const matchesDate = rDate === todayStr;
      if (selectedSiteId === 'all') return matchesDate;
      if (filterClientId) {
        const cId = typeof r.clientId === 'object' ? (r.clientId as any)?._id : r.clientId;
        return matchesDate && cId === filterClientId;
      }
      if (filterProjectId) {
        const pId = typeof r.projectId === 'object' ? (r.projectId as any)?._id : r.projectId;
        return matchesDate && pId === filterProjectId;
      }
      return matchesDate;
    });
  }, [reports, todayStr, selectedSiteId, filterClientId, filterProjectId]);

  // Helper: check if a specific client has today's DPR submitted
  const getClientTodayReport = (clientId: string) => {
    return reports.find((r) => {
      const rDate = new Date(r.reportDate).toISOString().slice(0, 10);
      const cId = typeof r.clientId === 'object' ? (r.clientId as any)?._id : r.clientId;
      return rDate === todayStr && cId === clientId;
    });
  };

  // Helper: check if a specific project site has today's DPR submitted
  const getProjectTodayReport = (projectId: string) => {
    return reports.find((r) => {
      const rDate = new Date(r.reportDate).toISOString().slice(0, 10);
      const pId = typeof r.projectId === 'object' ? (r.projectId as any)?._id : r.projectId;
      return rDate === todayStr && pId === projectId;
    });
  };

  // Open issues and challenges across assigned sites
  const reportedIssues = useMemo(() => {
    return reports.filter((r) => Boolean(r.issuesAndDelays) || (r.safetyInspection?.incidentsCount || 0) > 0);
  }, [reports]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const totalAssignedSitesCount = assignedClients.length + assignedSites.length;

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 flex flex-col">
      <Header
        breadcrumbs={[{ label: 'Field Portal' }, { label: 'Site Engineer Dashboard' }]}
        onToggleSidebar={() => setSidebarOpen(true)}
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-6">
        {/* Top Hero Banner */}
        <div className="bg-gradient-to-r from-[#0E1527] via-[#121B30] to-[#0A0E1A] border border-amber-500/20 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-2 max-w-2xl relative z-10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold text-amber-400 tracking-wider uppercase">
                Site Operations & Daily Field Reports
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>{greeting}, {user?.name ? `Er. ${user.name}` : 'Site Engineer'}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold font-mono">
                Field Engineer
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Check all client construction sites assigned by administration, review customer requirements, submit daily DPR progress reports, record worker attendance, and manage site execution.
            </p>
          </div>

          {/* Quick Action CTA */}
          <div className="flex items-center gap-3 relative z-10 flex-wrap">
            <button
              onClick={() => navigate('/engineer/submit-report')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Submit Today's Daily Report</span>
            </button>

            <button
              onClick={() => navigate('/engineer/reports')}
              className="px-4 py-2.5 rounded-xl bg-[#141E33] hover:bg-[#1A2640] border border-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ClipboardCheck className="w-4 h-4 text-amber-400" />
              <span>Report History</span>
            </button>
          </div>
        </div>

        {/* Site Selector Bar */}
        <div className="bg-[#0C101A] border border-[#182032] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Active Site Context</p>
              <p className="text-[10.5px] text-slate-400">
                You are assigned to {assignedClients.length} Client Site(s) {assignedSites.length > 0 ? `& ${assignedSites.length} Project(s)` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-[#141B2D] border border-amber-500/40 text-amber-300 font-bold text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="all">🌐 All Assigned Sites & Clients ({totalAssignedSitesCount})</option>
              {assignedClients.length > 0 && (
                <optgroup label="🏗️ Assigned Client Sites (Customer Construction Sites)">
                  {assignedClients.map((c) => (
                    <option key={c._id} value={`client:${c._id}`}>
                      👤 {c.name} [{c.clientCode}] • {c.siteLocation}
                    </option>
                  ))}
                </optgroup>
              )}
              {assignedSites.length > 0 && (
                <optgroup label="🏢 Project Construction Sites">
                  {assignedSites.map((s) => (
                    <option key={s._id} value={`project:${s._id}`}>
                      📍 {s.name} ({s.code})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column (8 cols): Today's Report Banner, My Assigned Clients, History */}
          <div className="lg:col-span-8 space-y-5">
            {/* Today's Daily Report Status Card */}
            <div className="bg-[#0E1424] border border-[#18233A] rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Today's Daily Site Report (DPR) Status</h3>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>

              {todayReport ? (
                <div className="bg-[#121929] border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10.5px] font-bold">
                        Submitted • {todayReport.status}
                      </span>
                      <span className="font-mono text-xs text-amber-400 font-bold">
                        {todayReport.reportNumber}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-white">
                      {todayReport.clientId?.name || todayReport.projectId?.name || 'Assigned Site'}
                      {todayReport.clientCode ? ` [${todayReport.clientCode}]` : ''}
                    </p>
                    <p className="text-xs text-slate-400">
                      Logged {todayReport.workersCount} workers • Progress recorded at {todayReport.progressPercentage}%
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedReportId(todayReport._id)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Submission</span>
                    </button>

                    {todayReport.status === 'Needs Correction' && (
                      <button
                        onClick={() => navigate(`/engineer/submit-report?reportId=${todayReport._id}`)}
                        className="px-3.5 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                      >
                        <span>Fix Corrections</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-[#17120C] border border-amber-500/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      <span className="text-amber-400 font-bold text-xs uppercase tracking-wide">
                        Report Pending for Today
                      </span>
                    </div>
                    <p className="text-sm font-bold text-white">
                      Your assigned construction sites require today's daily site progress report
                    </p>
                    <p className="text-xs text-slate-400">
                      Standard closing deadline is 6:00 PM. Record labor attendance, site photos, and materials used.
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      navigate(
                        filterClientId
                          ? `/engineer/submit-report?clientId=${filterClientId}`
                          : filterProjectId
                          ? `/engineer/submit-report?siteId=${filterProjectId}`
                          : `/engineer/submit-report`
                      )
                    }
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Create DPR</span>
                  </button>
                </div>
              )}
            </div>

            {/* PRIMARY SECTION: Assigned Customer Construction Sites (Clients) */}
            <div className="bg-[#0E1424] border border-[#18233A] rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <HardHat className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">
                    Assigned Client Construction Sites ({assignedClients.length})
                  </h3>
                </div>
                <span className="text-[11px] text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">
                  Assigned by Admin from Client Management
                </span>
              </div>

              {isLoadingClients ? (
                <p className="text-center py-8 text-xs text-slate-400">Loading assigned client sites...</p>
              ) : assignedClients.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                  <Building2 className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="font-semibold text-white">No Client Construction Sites Assigned Yet</p>
                  <p className="text-slate-400 max-w-md mx-auto">
                    When the administrator assigns you to a client from the Client Management portal, their full site information, location, contact, and reports will appear right here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {assignedClients.map((client) => {
                    const clientTodayReport = getClientTodayReport(client._id);
                    const cleanPhone = client.phone ? client.phone.replace(/\D/g, '') : '';
                    const whatsappLink = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                      `Hello ${client.name}, this is your Site Engineer from BuildForce regarding your construction site at ${client.siteLocation}.`
                    )}`;
                    const mapsLink = `https://maps.google.com/?q=${encodeURIComponent(client.siteLocation || '')}`;

                    return (
                      <div
                        key={client._id}
                        className="bg-[#121929] border border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 space-y-3.5 transition-all shadow-md group relative"
                      >
                        {/* Header: Client Name, ID & Status */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-white text-sm group-hover:text-amber-400 transition-colors">
                                {client.name}
                              </span>
                              <span className="font-mono text-[10.5px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30">
                                {client.clientCode}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              {client.companyName || 'Residential Construction'}
                            </span>
                          </div>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                              client.status === 'Active'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : client.status === 'Under Construction'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {client.status || 'Active'}
                          </span>
                        </div>

                        {/* Site Location with Google Maps Link */}
                        <div className="flex items-center justify-between text-xs bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                          <div className="flex items-center gap-1.5 text-slate-300 min-w-0">
                            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate font-medium">{client.siteLocation || 'Site Location'}</span>
                          </div>
                          {client.siteLocation && (
                            <a
                              href={mapsLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10.5px] text-amber-400 hover:text-amber-300 inline-flex items-center gap-0.5 shrink-0 ml-2 font-semibold"
                            >
                              <span>Map</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        {/* Contact Information & Quick WhatsApp/Call */}
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-mono font-medium">{client.phone}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {client.phone && (
                              <>
                                <a
                                  href={`tel:${client.phone}`}
                                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                                  title="Call Client"
                                >
                                  <Phone className="w-3 h-3 text-slate-300" />
                                  <span>Call</span>
                                </a>

                                <a
                                  href={whatsappLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                                  title="Chat on WhatsApp"
                                >
                                  <MessageCircle className="w-3 h-3 text-emerald-400" />
                                  <span>WhatsApp</span>
                                </a>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Project Scope / Services */}
                        {client.services && (
                          <div className="text-[11px] bg-[#0E1527] p-2 rounded-xl border border-slate-800/80 flex items-center justify-between">
                            <span className="text-slate-400 text-[10.5px]">Work Scope:</span>
                            <span className="text-amber-300 font-semibold truncate">{client.services}</span>
                          </div>
                        )}

                        {/* Today's DPR indicator for this client */}
                        {clientTodayReport ? (
                          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-xs">
                            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span>Aaj Ka Update Ho Gaya ({clientTodayReport.reportNumber})</span>
                            </span>
                            <button
                              onClick={() => setSelectedReportId(clientTodayReport._id)}
                              className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[11px] hover:bg-emerald-500/30 cursor-pointer"
                            >
                              Dekhein
                            </button>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between text-xs">
                            <span className="text-amber-400 font-bold flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                              <span>Aaj Ka Update Pending Hai</span>
                            </span>
                            <button
                              onClick={() => navigate(`/engineer/submit-report?clientId=${client._id}`)}
                              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[11px] cursor-pointer shadow-md"
                            >
                              + Update Dein
                            </button>
                          </div>
                        )}

                        {/* Card Actions Footer */}
                        <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                          <button
                            onClick={() => navigate(`/engineer/submit-report?clientId=${client._id}`)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Aaj Ka Daily Update Dein</span>
                          </button>

                          <button
                            onClick={() => setSelectedSiteId(`client:${client._id}`)}
                            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <span>Pichle Updates</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECONDARY: Project Construction Sites (If Any) */}
            {assignedSites.length > 0 && (
              <div className="bg-[#0E1424] border border-[#18233A] rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">
                      Construction Project Sites ({assignedSites.length})
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {assignedSites.map((site) => (
                    <div
                      key={site._id}
                      className="bg-[#121929] border border-slate-800 hover:border-amber-500/40 rounded-xl p-4 space-y-3 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-white text-sm block">{site.name}</span>
                          <span className="text-[10.5px] font-mono text-amber-400 block">
                            {site.code} • {site.clientName || 'Civil Works'}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                            site.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {site.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{site.location || 'Site Location'}</span>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Execution Progress</span>
                          <span className="font-bold text-white">{site.progress || 0}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                            style={{ width: `${site.progress || 0}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <button
                          onClick={() => navigate(`/engineer/submit-report?siteId=${site._id}`)}
                          className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                        >
                          <span>Submit Report</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setSelectedSiteId(`project:${site._id}`)}
                          className="text-xs text-slate-400 hover:text-white cursor-pointer"
                        >
                          Filter Reports
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Previous Daily Reports Table */}
            <div className="bg-[#0E1424] border border-[#18233A] rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">
                    Daily Reports History {selectedSiteId !== 'all' ? '(Filtered)' : ''}
                  </h3>
                </div>
                {selectedSiteId !== 'all' && (
                  <button
                    onClick={() => setSelectedSiteId('all')}
                    className="text-xs text-amber-400 hover:underline cursor-pointer"
                  >
                    Clear Filter
                  </button>
                )}
                <button
                  onClick={() => navigate('/engineer/reports')}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>All Reports ({reports.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {reports.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400">
                  No previous daily reports recorded yet.
                </p>
              ) : (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400">
                        <th className="py-2 px-3">Report #</th>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Site / Client</th>
                        <th className="py-2 px-3 min-w-[180px]">Work Completed (Aaj Ka Kaam)</th>
                        <th className="py-2 px-3 text-center">Labor</th>
                        <th className="py-2 px-3 text-center">Status</th>
                        <th className="py-2 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {reports.slice(0, 8).map((r) => {
                        const siteDisplayName = r.clientId?.name || r.projectId?.name || 'Site';
                        const siteCode = r.clientCode || r.clientId?.clientCode || r.projectId?.code;

                        return (
                          <tr key={r._id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                              {r.reportNumber}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-400">
                              {new Date(r.reportDate).toLocaleDateString('en-GB')}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-white">
                              <span>{siteDisplayName}</span>
                              {siteCode && (
                                <span className="ml-1.5 font-mono text-[10.5px] text-amber-400/90">
                                  [{siteCode}]
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-200 font-medium max-w-[220px]">
                              <p className="line-clamp-1">{r.workCompletedToday || '-'}</p>
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-slate-300">
                              {r.workersCount || 0}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  r.status === 'Approved'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : r.status === 'Needs Correction'
                                    ? 'bg-rose-500/20 text-rose-400'
                                    : 'bg-amber-500/20 text-amber-300'
                                }`}
                              >
                                {r.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => setSelectedReportId(r._id)}
                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] cursor-pointer"
                              >
                                Inspect
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (4 cols): Notifications, Roadblocks & Protocols */}
          <div className="lg:col-span-4 space-y-5">
            {/* Notifications Card */}
            <div className="bg-[#0E1424] border border-[#18233A] rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span>Workflow Notifications</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Real-time alerts</span>
              </div>

              {notifications.length === 0 ? (
                <p className="text-slate-400 text-xs py-4 text-center">No new notifications</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                  {notifications.slice(0, 5).map((n) => (
                    <div
                      key={n._id}
                      onClick={() => n.link && navigate(n.link)}
                      className="p-2.5 rounded-xl bg-[#121929] hover:bg-[#18233C] border border-slate-800/80 cursor-pointer transition-colors space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-[11px]">{n.title}</span>
                        <span className="text-[9.5px] text-slate-400 font-mono">
                          {new Date(n.createdAt).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-400 line-clamp-2">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Roadblocks & Issues */}
            <div className="bg-[#0E1424] border border-[#18233A] rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Site Challenges & Roadblocks</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Open issues</span>
              </div>

              {reportedIssues.length === 0 ? (
                <p className="text-slate-400 text-xs py-4 text-center">
                  No active site challenges reported. Sites operating smoothly.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                  {reportedIssues.slice(0, 4).map((issue) => (
                    <div
                      key={issue._id}
                      className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/25 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-purple-200 text-[11px]">
                          {issue.clientId?.name || issue.projectId?.name || 'Site'}
                        </span>
                        <span className="text-[10px] font-mono text-purple-400">
                          {new Date(issue.reportDate).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                      <p className="text-[11px] text-purple-300 line-clamp-2">
                        {issue.issuesAndDelays || 'Safety incident reported'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Safety & Execution Standards */}
            <div className="bg-[#0E1424] border border-[#18233A] rounded-2xl p-5 shadow-lg space-y-3">
              <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-2 border-b border-slate-800 pb-3">
                <ShieldCheck className="w-4 h-4" />
                <span>Daily Site Standards Checklist</span>
              </h3>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <span>Verify PPE gear & helmet compliance before labor entry</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <span>Inspect materials received against vendor delivery challan</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <span>Submit DPR with photographs before 6:00 PM shift close</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Report Quick Inspection Modal */}
      {selectedReportId && currentReport && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-[#0B101E] border border-amber-500/30 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="font-mono text-amber-400 font-bold text-xs">{currentReport.reportNumber}</span>
                <h3 className="font-bold text-white text-base mt-0.5">
                  {currentReport.clientId?.name || currentReport.projectId?.name || 'Site Report'}
                  {currentReport.clientCode ? ` [${currentReport.clientCode}]` : ''}
                </h3>
                <p className="text-xs text-slate-400">
                  {new Date(currentReport.reportDate).toLocaleDateString('en-GB')} • Status: {currentReport.status}
                </p>
              </div>
              <button
                onClick={() => setSelectedReportId(null)}
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-900 rounded-xl space-y-1">
                <p className="font-bold text-amber-400">Work Completed Today:</p>
                <p className="text-white whitespace-pre-line">{currentReport.workCompletedToday}</p>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl space-y-1">
                <p className="font-bold text-blue-400">Work Planned Tomorrow:</p>
                <p className="text-white whitespace-pre-line">{currentReport.workPlannedTomorrow}</p>
              </div>

              {currentReport.adminReview?.comments && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1">
                  <p className="font-bold text-amber-400">Admin Feedback:</p>
                  <p className="text-amber-200">{currentReport.adminReview.comments}</p>
                </div>
              )}

              {currentReport.photos && currentReport.photos.length > 0 && (
                <div>
                  <p className="font-bold text-white mb-2">Photographs ({currentReport.photos.length}):</p>
                  <div className="grid grid-cols-2 gap-2">
                    {currentReport.photos.map((p: any, i: number) => (
                      <a key={i} href={p.url} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border border-slate-800">
                        <img src={p.url} alt={p.caption || 'Site Photo'} className="w-full h-32 object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedReportId(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 text-white font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
