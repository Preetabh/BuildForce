import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  ClipboardCheck,
  Building2,
  HardHat,
  Calendar,
  AlertTriangle,
  Clock,
  Filter,
  Search,
  FileSpreadsheet,
  FileText,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  MessageSquare,
  ArrowUpRight,
  TrendingUp,
  Image,
  Paperclip,
  Check,
  Send,
  History,
  ShieldCheck,
  ChevronRight,
  Users,
  ExternalLink,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/common/Button';
import { dailyReportService } from '../../services/dailyReport.service';
import { siteService } from '../../services/site.service';
import { leadService } from '../../services/lead.service';
import { rbacService } from '../../services/rbac.service';
import {
  DailySiteReportItem,
  DailyReportStatus,
  MissingSiteReportItem,
} from '../../types/dailyReport';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface OutletContextType {
  setSidebarOpen: (open: boolean) => void;
}

export const AdminDailyReportsPage: React.FC = () => {
  const { setSidebarOpen } = useOutletContext<OutletContextType>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Filters state
  const [activeTab, setActiveTab] = useState<'today' | 'all' | 'pending' | 'missing'>('today');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');
  const [selectedEngineerId, setSelectedEngineerId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [onlyIssues, setOnlyIssues] = useState<boolean>(false);

  // Detail Modal state
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'Reviewed' | 'Needs Correction' | 'Approved'>('Approved');
  const [reviewComments, setReviewComments] = useState<string>('');
  const [reviewDetails, setReviewDetails] = useState<string>('');
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'work' | 'materials' | 'safety' | 'photos' | 'history'>('overview');

  useEscapeKey(() => setSelectedReportId(null), Boolean(selectedReportId));

  // Queries
  const { data: reportsData, isLoading: isLoadingReports } = useQuery({
    queryKey: [
      'adminDailyReports',
      selectedSiteId,
      selectedEngineerId,
      selectedStatus,
      startDate,
      endDate,
      searchTerm,
    ],
    queryFn: () =>
      dailyReportService.getReports({
        projectId: selectedSiteId,
        siteEngineerId: selectedEngineerId,
        status: selectedStatus as any,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: searchTerm || undefined,
        limit: 100,
      }),
  });

  const { data: missingReports = [], isLoading: isLoadingMissing } = useQuery({
    queryKey: ['missingReportsList'],
    queryFn: dailyReportService.getMissingReports,
  });

  const { data: allClients = [] } = useQuery({
    queryKey: ['filterClientsList'],
    queryFn: () => leadService.getClients(),
  });

  const { data: sitesData } = useQuery({
    queryKey: ['filterSitesList'],
    queryFn: () => siteService.getSites({ limit: 100 }),
  });

  const { data: engineers = [] } = useQuery({
    queryKey: ['filterEngineersList'],
    queryFn: rbacService.getSiteEngineers,
  });

  // Selected report full details query
  const { data: currentReport, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['reportDetail', selectedReportId],
    queryFn: () => (selectedReportId ? dailyReportService.getReportById(selectedReportId) : null),
    enabled: Boolean(selectedReportId),
  });

  const reports = reportsData?.reports || [];
  const stats = reportsData?.stats || {
    totalSites: 0,
    activeEngineers: 0,
    reportsSubmittedToday: 0,
    pendingReviews: 0,
    missingReportsToday: 0,
    sitesWithReportedIssues: 0,
  };

  const reviewMutation = useMutation({
    mutationFn: ({ id, reviewData }: { id: string; reviewData: any }) =>
      dailyReportService.reviewReport(id, reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDailyReports'] });
      queryClient.invalidateQueries({ queryKey: ['reportDetail', selectedReportId] });
      queryClient.invalidateQueries({ queryKey: ['userNotifications'] });
      setReviewComments('');
      setReviewDetails('');
    },
  });

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportId) return;

    reviewMutation.mutate({
      id: selectedReportId,
      reviewData: {
        status: reviewStatus,
        comments: reviewComments.trim(),
        correctionRequested: reviewStatus === 'Needs Correction',
        correctionDetails: reviewDetails.trim() || reviewComments.trim(),
      },
    });
  };

  const todayDateStr = new Date().toISOString().slice(0, 10);
  const todayReportsCount = reports.filter(
    (r) => new Date(r.reportDate).toISOString().slice(0, 10) === todayDateStr
  ).length;

  // Filtered reports for current tab
  const displayedReports = reports.filter((r) => {
    if (activeTab === 'today') {
      const rDate = new Date(r.reportDate).toISOString().slice(0, 10);
      return rDate === todayDateStr;
    }
    if (activeTab === 'pending') {
      return r.status === 'Submitted';
    }
    if (onlyIssues) {
      return Boolean(r.issuesAndDelays) || (r.safetyInspection?.incidentsCount || 0) > 0;
    }
    return true;
  });

  // Export to Excel / CSV
  const handleExportExcel = () => {
    if (displayedReports.length === 0) {
      alert('No reports available to export');
      return;
    }

    const dataRows = displayedReports.map((r, index) => ({
      'S.N.': index + 1,
      'Report Number': r.reportNumber,
      'Report Date': new Date(r.reportDate).toLocaleDateString('en-GB'),
      'Site Name': r.clientId?.name || r.projectId?.name || 'Site',
      'Site Code': r.clientCode || r.clientId?.clientCode || r.projectId?.code || '-',
      'Site Location': r.clientId?.siteLocation || r.projectId?.location || '-',
      'Site Engineer': r.engineerName || r.siteEngineerId?.name || '-',
      'Workers Present': r.workersCount || 0,
      'Progress %': `${r.progressPercentage || 0}%`,
      'Status': r.status,
      'Weather': r.weather || '-',
      'Safety Incidents': r.safetyInspection?.incidentsCount || 0,
      'Work Completed': r.workCompletedToday || '-',
      'Work Planned': r.workPlannedTomorrow || '-',
      'Issues & Roadblocks': r.issuesAndDelays || 'None',
      'Submitted At': r.submissionTimestamp ? new Date(r.submissionTimestamp).toLocaleString('en-GB') : '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily_Site_Reports');
    XLSX.writeFile(workbook, `Daily_Site_Reports_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (displayedReports.length === 0) {
      alert('No reports available to export');
      return;
    }

    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text('InfraPilot - Daily Site Reports Audit Summary', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString('en-GB')} | Total Reports: ${displayedReports.length}`, 14, 22);

    const tableData = displayedReports.map((r, i) => [
      i + 1,
      r.reportNumber,
      new Date(r.reportDate).toLocaleDateString('en-GB'),
      r.clientId?.name || r.projectId?.name || '-',
      r.engineerName || '-',
      r.workersCount || 0,
      `${r.progressPercentage || 0}%`,
      r.status,
      r.safetyInspection?.incidentsCount || 0,
      r.issuesAndDelays ? 'Reported' : 'None',
    ]);

    autoTable(doc, {
      head: [['#', 'Report #', 'Date', 'Site Name', 'Engineer', 'Labor', 'Progress', 'Status', 'Incidents', 'Issues']],
      body: tableData,
      startY: 28,
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11], textColor: [15, 23, 42] },
      styles: { fontSize: 8 },
    });

    doc.save(`Daily_Site_Reports_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 flex flex-col">
      <Header
        breadcrumbs={[{ label: 'Admin' }, { label: 'Daily Site Reports Dashboard' }]}
        onToggleSidebar={() => setSidebarOpen(true)}
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[11px] font-bold text-amber-400 tracking-wider uppercase">
                Centralized Field Intelligence & DPR
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1 flex items-center gap-2.5">
              <ClipboardCheck className="w-7 h-7 text-amber-400" />
              <span>Daily Site Reports Dashboard</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Inspect site progress across all construction locations, review field submissions, verify labor and materials, request revisions, and detect overdue reporting.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 rounded-xl bg-[#121929] hover:bg-[#18233C] border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="px-3.5 py-2 rounded-xl bg-[#121929] hover:bg-[#18233C] border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-rose-400" />
              <span>Export PDF</span>
            </button>

            <Button
              onClick={() => navigate('/engineer/submit-report')}
              className="bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <span>+ Submit New Report</span>
            </Button>
          </div>
        </div>

        {/* 6 Summary Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-[#0C101A] border border-[#182032] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Total Sites</span>
              <Building2 className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-white mt-2">{stats.totalSites}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Under management</p>
          </div>

          <div className="bg-[#0C101A] border border-[#182032] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Active Engineers</span>
              <HardHat className="w-4 h-4 text-orange-400" />
            </div>
            <p className="text-2xl font-black text-orange-400 mt-2">{stats.activeEngineers}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Field workforce</p>
          </div>

          <div className="bg-[#0C101A] border border-[#182032] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Submitted Today</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-emerald-400 mt-2">{stats.reportsSubmittedToday}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Reports logged today</p>
          </div>

          <div className="bg-[#0C101A] border border-[#182032] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Pending Reviews</span>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-black text-blue-400 mt-2">{stats.pendingReviews}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Awaiting admin review</p>
          </div>

          <div className="bg-[#0C101A] border border-[#182032] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Missing Reports</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-2xl font-black text-rose-400 mt-2">{stats.missingReportsToday}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Sites overdue today</p>
          </div>

          <div className="bg-[#0C101A] border border-[#182032] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Site Challenges</span>
              <AlertCircle className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-black text-purple-400 mt-2">{stats.sitesWithReportedIssues}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Issues & delays logged</p>
          </div>
        </div>

        {/* View Tabs & Main Filter Controls */}
        <div className="bg-[#0C101A] border border-[#182032] rounded-2xl p-4 space-y-4 shadow-lg">
          {/* Top Tab Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 flex-wrap">
              <button
                onClick={() => {
                  setActiveTab('today');
                  setStartDate('');
                  setEndDate('');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'today'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-amber-400 hover:text-white bg-amber-500/10'
                }`}
              >
                <span>📅 Today's Work Updates (Aaj Ka Kaam)</span>
                <span className="w-5 h-5 rounded-full bg-slate-900 text-amber-400 text-[10.5px] flex items-center justify-center font-bold">
                  {todayReportsCount}
                </span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('all');
                  setStartDate('');
                  setEndDate('');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-slate-700 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Reports ({reports.length})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'pending'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Pending Review</span>
                <span className="w-4 h-4 rounded-full bg-blue-500/30 text-[10px] flex items-center justify-center font-bold">
                  {stats.pendingReviews}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('missing')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'missing'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Missing Sites</span>
                <span className="w-4 h-4 rounded-full bg-rose-500/30 text-[10px] flex items-center justify-center font-bold">
                  {missingReports.length}
                </span>
              </button>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyIssues}
                onChange={(e) => setOnlyIssues(e.target.checked)}
                className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900"
              />
              <span className="text-amber-400">Only Sites with Roadblocks / Incidents</span>
            </label>
          </div>

          {/* Filter Bar Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
            {/* Search */}
            <div className="lg:col-span-2 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search report #, engineer, tasks..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Site selector */}
            <div>
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Sites & Clients</option>
                {allClients.length > 0 && (
                  <optgroup label="🏗️ Client Construction Sites">
                    {allClients.map((c: any) => (
                      <option key={c._id} value={c._id}>
                        {c.name} [{c.clientCode}]
                      </option>
                    ))}
                  </optgroup>
                )}
                {(sitesData?.projects || []).length > 0 && (
                  <optgroup label="🏢 Projects">
                    {(sitesData?.projects || []).map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Engineer selector */}
            <div>
              <select
                value={selectedEngineerId}
                onChange={(e) => setSelectedEngineerId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Site Engineers</option>
                {engineers.map((eng) => (
                  <option key={eng._id} value={eng._id}>
                    {eng.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status selector */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white focus:outline-none focus:border-amber-500"
              >
                <option value="All">All Statuses</option>
                <option value="Submitted">Submitted (Pending)</option>
                <option value="Approved">Approved</option>
                <option value="Needs Correction">Needs Correction</option>
                <option value="Reviewed">Reviewed</option>
                <option value="Draft">Draft</option>
              </select>
            </div>

            {/* Date range */}
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                title="Start Date"
                className="w-full px-2 py-1.5 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white font-mono text-[11px] focus:outline-none focus:border-amber-500"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                title="End Date"
                className="w-full px-2 py-1.5 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white font-mono text-[11px] focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Missing / Overdue Sites View */}
        {activeTab === 'missing' ? (
          <div className="bg-[#0C101A] border border-[#182032] rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-rose-500/10 border-b border-rose-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <span className="font-bold text-sm text-white">
                  Sites with Missing Daily Reports Today ({missingReports.length})
                </span>
              </div>
              <span className="text-xs text-rose-300 font-semibold">
                Daily Deadline: 6:00 PM
              </span>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#1B2438] bg-[#0E1526]/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4 sm:px-6">Site Name & Code</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Assigned Engineers</th>
                    <th className="py-3 px-4">Progress</th>
                    <th className="py-3 px-4">Reporting Deadline</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#151D2E]">
                  {missingReports.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                        All construction sites have submitted their reports for today!
                      </td>
                    </tr>
                  ) : (
                    missingReports.map((site: MissingSiteReportItem) => (
                      <tr key={site._id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6">
                          <span className="font-bold text-white block">{site.name}</span>
                          <span className="text-[10.5px] font-mono text-amber-400">{site.code}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {site.location || '-'}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {(site.assignedEngineers || []).map((eng, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-semibold text-[10.5px] flex items-center gap-1"
                              >
                                <HardHat className="w-3 h-3 text-amber-400" />
                                <span>{eng.name}</span>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-slate-200">{site.progress || 0}%</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <Clock className="w-3 h-3" />
                            <span>{site.isOverdue ? 'Overdue' : 'Due by 6:00 PM'}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <button
                            onClick={() => navigate(`/engineer/submit-report?siteId=${site._id}`)}
                            className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-sm"
                          >
                            Submit Report
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Main Reports Table */
          <div className="bg-[#0C101A] border border-[#182032] rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#1B2438] bg-[#0E1526]/80 text-[11px] font-bold uppercase tracking-wider text-amber-400/90">
                    <th className="py-3.5 px-4 sm:px-6">Report # & Date</th>
                    <th className="py-3.5 px-4">Site Name</th>
                    <th className="py-3.5 px-4">Site Engineer</th>
                    <th className="py-3.5 px-4 min-w-[220px]">Work Done Today (Aaj Ka Kaam)</th>
                    <th className="py-3.5 px-4 text-center">Labor</th>
                    <th className="py-3.5 px-4">Progress %</th>
                    <th className="py-3.5 px-4">Safety & Issues</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#151D2E]">
                  {isLoadingReports ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        Loading daily site reports...
                      </td>
                    </tr>
                  ) : displayedReports.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-slate-400">
                        <div className="max-w-xs mx-auto space-y-3">
                          <ClipboardCheck className="w-8 h-8 mx-auto text-slate-600" />
                          <p className="font-semibold text-white">No reports match your filters</p>
                          <p className="text-xs text-slate-400">Try adjusting the site, engineer, status, or date range filters.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayedReports.map((report) => {
                      const hasIssues = Boolean(report.issuesAndDelays);
                      const hasIncidents = (report.safetyInspection?.incidentsCount || 0) > 0;

                      return (
                        <tr key={report._id} className="hover:bg-[#121929]/70 transition-colors">
                          {/* Report # & Date */}
                          <td className="py-3.5 px-4 sm:px-6">
                            <span className="font-mono font-bold text-amber-400 block text-xs">
                              {report.reportNumber}
                            </span>
                            <span className="text-[10.5px] text-slate-400 block font-mono">
                              {new Date(report.reportDate).toLocaleDateString('en-GB', {
                                weekday: 'short',
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </td>

                          {/* Site Name */}
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-white block">
                              {report.clientId?.name || report.projectId?.name || 'Site'}
                            </span>
                            <span className="text-[10.5px] font-mono text-slate-400">
                              {(report.clientCode || report.clientId?.clientCode || report.projectId?.code || '-')} • {(report.clientId?.siteLocation || report.projectId?.location || '-')}
                            </span>
                          </td>

                          {/* Engineer */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                                {report.engineerName.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-slate-200 truncate max-w-[120px]">
                                {report.engineerName}
                              </span>
                            </div>
                          </td>

                          {/* Work Completed Today */}
                          <td className="py-3.5 px-4 min-w-[220px] max-w-[300px]">
                            <p className="text-white text-xs font-semibold line-clamp-2 leading-relaxed" title={report.workCompletedToday}>
                              {report.workCompletedToday || 'No work description provided'}
                            </p>
                            {report.workPlannedTomorrow && (
                              <p className="text-[10.5px] text-amber-400/80 line-clamp-1 mt-0.5" title={report.workPlannedTomorrow}>
                                🔜 Kal: {report.workPlannedTomorrow}
                              </p>
                            )}
                          </td>

                          {/* Workers */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono font-bold">
                              <Users className="w-3 h-3 text-slate-400" />
                              <span>{report.workersCount || 0}</span>
                            </div>
                          </td>

                          {/* Progress % */}
                          <td className="py-3.5 px-4">
                            <div className="w-24 space-y-1">
                              <span className="font-bold text-white text-[11px]">
                                {report.progressPercentage || 0}%
                              </span>
                              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full bg-amber-500 rounded-full"
                                  style={{ width: `${report.progressPercentage || 0}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Safety & Issues badges */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {hasIncidents ? (
                                <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                                  {report.safetyInspection.incidentsCount} Incident(s)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold">
                                  Safe
                                </span>
                              )}

                              {hasIssues && (
                                <span
                                  title={report.issuesAndDelays}
                                  className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30 truncate max-w-[100px]"
                                >
                                  Roadblock
                                </span>
                              )}

                              {report.photos && report.photos.length > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] flex items-center gap-1">
                                  <Image className="w-3 h-3 text-amber-400" />
                                  <span>{report.photos.length}</span>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                                report.status === 'Approved'
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)]'
                                  : report.status === 'Needs Correction'
                                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                  : report.status === 'Reviewed'
                                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                  : report.status === 'Submitted'
                                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse'
                                  : 'bg-slate-700/40 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {report.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 sm:px-6 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedReportId(report._id);
                                setActiveDetailTab('overview');
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-all cursor-pointer shadow-sm active:scale-95"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Inspect Report</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Comprehensive Report Detail Modal */}
      {selectedReportId && currentReport && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-[#0B101E] border border-amber-500/30 rounded-2xl w-full max-w-4xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 bg-[#0E1528] border-b border-[#1C2538] flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-400">
                    {currentReport.reportNumber}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      currentReport.status === 'Approved'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : currentReport.status === 'Needs Correction'
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {currentReport.status}
                  </span>
                  {currentReport.version > 1 && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400">
                      Revision v{currentReport.version}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-white mt-1">
                  {currentReport.clientId?.name || currentReport.projectId?.name || 'Site Report'}
                  {(currentReport.clientCode || currentReport.clientId?.clientCode || currentReport.projectId?.code)
                    ? ` [${currentReport.clientCode || currentReport.clientId?.clientCode || currentReport.projectId?.code}]`
                    : ''}
                </h2>
                <p className="text-xs text-slate-400">
                  Report Date: {new Date(currentReport.reportDate).toLocaleDateString('en-GB')} • Submitted by {currentReport.engineerName}
                </p>
              </div>

              <button
                onClick={() => setSelectedReportId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Detail Tabs */}
            <div className="flex items-center gap-1 px-5 py-2.5 bg-[#0D1322] border-b border-[#1C2538] overflow-x-auto custom-scrollbar shrink-0 text-xs font-semibold">
              {[
                { id: 'overview', label: 'Overview & Progress' },
                { id: 'work', label: 'Work Execution & Tasks' },
                { id: 'materials', label: `Materials & Equipment (${(currentReport.materialsReceived?.length || 0) + (currentReport.equipmentUsed?.length || 0)})` },
                { id: 'safety', label: 'Safety & Roadblocks' },
                { id: 'photos', label: `Photos & Docs (${(currentReport.photos?.length || 0) + (currentReport.documents?.length || 0)})` },
                { id: 'history', label: `Audit Log (${currentReport.history?.length || 0})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDetailTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                    activeDetailTab === tab.id
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-5 text-xs text-slate-300">
              {activeDetailTab === 'overview' && (
                <div className="space-y-4">
                  {/* Progress Comparison Card */}
                  <div className="bg-[#121A2D] border border-amber-500/20 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-400 flex items-center gap-1.5 text-xs">
                        <TrendingUp className="w-4 h-4" />
                        Today's Progress vs Previous Report
                      </span>
                      <span className="text-lg font-black text-white">
                        {currentReport.progressPercentage}%
                      </span>
                    </div>

                    {currentReport.previousReport ? (
                      <div className="bg-[#0C1220] p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <p className="text-[11px] text-slate-400">
                            Previous Report ({currentReport.previousReport.reportNumber} on {new Date(currentReport.previousReport.reportDate).toLocaleDateString('en-GB')}):
                          </p>
                          <p className="font-bold text-slate-200 mt-0.5">
                            Progress was {currentReport.previousReport.progressPercentage}%
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded-md ${
                              currentReport.progressPercentage >= currentReport.previousReport.progressPercentage
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {currentReport.progressPercentage >= currentReport.previousReport.progressPercentage ? '+' : ''}
                            {currentReport.progressPercentage - currentReport.previousReport.progressPercentage}% Delta
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        Initial report logged for this site. No previous comparison available.
                      </p>
                    )}
                  </div>

                  {/* Conditions & Labor Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-[#101726] border border-slate-800 rounded-xl p-4 space-y-2">
                      <span className="font-bold text-slate-200">Site Environmental Conditions</span>
                      <div className="space-y-1.5 text-slate-300">
                        <p><span className="text-slate-500">Weather:</span> {currentReport.weather || 'Normal'}</p>
                        <p><span className="text-slate-500">Working Conditions:</span> {currentReport.workingConditions || 'Normal'}</p>
                        <p><span className="text-slate-500">Site Location:</span> {currentReport.projectId?.location || '-'}</p>
                      </div>
                    </div>

                    <div className="bg-[#101726] border border-slate-800 rounded-xl p-4 space-y-2">
                      <span className="font-bold text-slate-200">Labor Attendance & Workforce</span>
                      <p className="text-lg font-black text-amber-400">{currentReport.workersCount} Total Workers Present</p>
                      {currentReport.workersBreakdown && (
                        <div className="grid grid-cols-3 gap-1.5 text-[11px] text-slate-400 pt-1">
                          <span>Masons: {currentReport.workersBreakdown.masons || 0}</span>
                          <span>Carpenters: {currentReport.workersBreakdown.carpenters || 0}</span>
                          <span>Helpers: {currentReport.workersBreakdown.helpers || 0}</span>
                          <span>Skilled: {currentReport.workersBreakdown.skilled || 0}</span>
                          <span>Unskilled: {currentReport.workersBreakdown.unskilled || 0}</span>
                          <span>Others: {currentReport.workersBreakdown.others || 0}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeDetailTab === 'work' && (
                <div className="space-y-4">
                  <div className="bg-[#101726] border border-slate-800 rounded-xl p-4 space-y-2">
                    <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wide">
                      Work Completed Today
                    </h4>
                    <p className="text-slate-200 leading-relaxed whitespace-pre-line text-xs">
                      {currentReport.workCompletedToday || 'No details specified.'}
                    </p>
                  </div>

                  <div className="bg-[#101726] border border-slate-800 rounded-xl p-4 space-y-2">
                    <h4 className="font-bold text-blue-400 text-xs uppercase tracking-wide">
                      Work Planned for Tomorrow
                    </h4>
                    <p className="text-slate-200 leading-relaxed whitespace-pre-line text-xs">
                      {currentReport.workPlannedTomorrow || 'No details specified.'}
                    </p>
                  </div>

                  {currentReport.remarks && (
                    <div className="bg-[#101726] border border-slate-800 rounded-xl p-4 space-y-2">
                      <h4 className="font-bold text-slate-400 text-xs uppercase tracking-wide">
                        Additional Engineer Remarks
                      </h4>
                      <p className="text-slate-300 leading-relaxed text-xs">
                        {currentReport.remarks}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeDetailTab === 'materials' && (
                <div className="space-y-4">
                  {/* Materials Received */}
                  <div className="bg-[#101726] border border-slate-800 rounded-xl p-4 space-y-3">
                    <h4 className="font-bold text-emerald-400 text-xs">Materials Received Today</h4>
                    {currentReport.materialsReceived?.length === 0 ? (
                      <p className="text-slate-400 italic">No materials received today.</p>
                    ) : (
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-slate-400 border-b border-slate-800 pb-1 font-semibold text-[11px]">
                            <th>Material</th>
                            <th>Quantity</th>
                            <th>Supplier</th>
                            <th>Invoice / Challan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {currentReport.materialsReceived.map((m, i) => (
                            <tr key={i} className="py-2">
                              <td className="py-1.5 font-medium text-white">{m.materialName}</td>
                              <td className="py-1.5 font-mono text-emerald-300">{m.quantity} {m.unit}</td>
                              <td className="py-1.5 text-slate-400">{m.supplier || '-'}</td>
                              <td className="py-1.5 font-mono text-slate-400">{m.invoiceNo || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Materials Consumed */}
                  <div className="bg-[#101726] border border-slate-800 rounded-xl p-4 space-y-3">
                    <h4 className="font-bold text-amber-400 text-xs">Materials Consumed Today</h4>
                    {currentReport.materialsConsumed?.length === 0 ? (
                      <p className="text-slate-400 italic">No material consumption recorded.</p>
                    ) : (
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-slate-400 border-b border-slate-800 pb-1 font-semibold text-[11px]">
                            <th>Material</th>
                            <th>Consumed Qty</th>
                            <th>Usage Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {currentReport.materialsConsumed.map((m, i) => (
                            <tr key={i} className="py-2">
                              <td className="py-1.5 font-medium text-white">{m.materialName}</td>
                              <td className="py-1.5 font-mono text-amber-300">{m.quantity} {m.unit}</td>
                              <td className="py-1.5 text-slate-400">{m.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Equipment */}
                  <div className="bg-[#101726] border border-slate-800 rounded-xl p-4 space-y-3">
                    <h4 className="font-bold text-blue-400 text-xs">Equipment & Machinery Logs</h4>
                    {currentReport.equipmentUsed?.length === 0 ? (
                      <p className="text-slate-400 italic">No heavy machinery logs recorded.</p>
                    ) : (
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-slate-400 border-b border-slate-800 pb-1 font-semibold text-[11px]">
                            <th>Equipment</th>
                            <th>Count</th>
                            <th>Hours Operated</th>
                            <th>Operational Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {currentReport.equipmentUsed.map((eq, i) => (
                            <tr key={i} className="py-2">
                              <td className="py-1.5 font-medium text-white">{eq.equipmentName}</td>
                              <td className="py-1.5 font-mono">{eq.count}</td>
                              <td className="py-1.5 font-mono">{eq.hoursOperated} hrs</td>
                              <td className="py-1.5">
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                                  {eq.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {activeDetailTab === 'safety' && (
                <div className="space-y-4">
                  {/* Safety Inspection */}
                  <div className="bg-[#101726] border border-slate-800 rounded-xl p-4 space-y-3">
                    <h4 className="font-bold text-emerald-400 text-xs flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Safety Compliance & Incident Log</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-slate-300">
                      <p>
                        <span className="text-slate-500">Safety Gear & PPE Compliance:</span>{' '}
                        {currentReport.safetyInspection?.safetyGearCompliance ? (
                          <span className="text-emerald-400 font-bold">100% Compliant</span>
                        ) : (
                          <span className="text-rose-400 font-bold">Non-compliant Observed</span>
                        )}
                      </p>
                      <p>
                        <span className="text-slate-500">Reported Incidents:</span>{' '}
                        <span className="font-bold text-white">
                          {currentReport.safetyInspection?.incidentsCount || 0}
                        </span>
                      </p>
                    </div>
                    {currentReport.safetyInspection?.incidentDetails && (
                      <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300">
                        <span className="font-bold block mb-1">Incident Details:</span>
                        {currentReport.safetyInspection.incidentDetails}
                      </div>
                    )}
                  </div>

                  {/* Issues & Roadblocks */}
                  <div className="bg-[#101726] border border-slate-800 rounded-xl p-4 space-y-3">
                    <h4 className="font-bold text-purple-400 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Issues, Delays & Site Challenges</span>
                    </h4>
                    {currentReport.issuesAndDelays ? (
                      <div className="p-3 bg-purple-500/10 border border-purple-500/25 rounded-xl text-purple-200 leading-relaxed whitespace-pre-line">
                        {currentReport.issuesAndDelays}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">No delays or roadblocks reported for today.</p>
                    )}
                  </div>
                </div>
              )}

              {activeDetailTab === 'photos' && (
                <div className="space-y-4">
                  {/* Photos */}
                  <div>
                    <h4 className="font-bold text-slate-200 text-xs mb-3">Site Photograph Gallery</h4>
                    {currentReport.photos?.length === 0 ? (
                      <p className="text-slate-400 italic">No photographs attached to this report.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {currentReport.photos.map((photo, i) => (
                          <div key={i} className="bg-[#101726] border border-slate-800 rounded-xl overflow-hidden group">
                            <a href={photo.url} target="_blank" rel="noopener noreferrer" className="block relative aspect-video bg-black/40">
                              <img
                                src={photo.url}
                                alt={photo.caption || `Site Photo ${i + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            </a>
                            <div className="p-2">
                              <p className="text-[11px] text-slate-300 truncate font-semibold">
                                {photo.caption || 'Site Photograph'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Documents */}
                  <div className="pt-3 border-t border-slate-800">
                    <h4 className="font-bold text-slate-200 text-xs mb-2">Supporting Documents</h4>
                    {currentReport.documents?.length === 0 ? (
                      <p className="text-slate-400 italic">No supporting documents uploaded.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {currentReport.documents.map((doc, i) => (
                          <a
                            key={i}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 rounded-xl bg-[#101726] hover:bg-[#162035] border border-slate-800 flex items-center justify-between text-slate-200 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Paperclip className="w-4 h-4 text-amber-400" />
                              <span className="font-semibold">{doc.name}</span>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeDetailTab === 'history' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-200 text-xs">Report Audit & Revision Trail</h4>
                  <div className="space-y-2 border-l-2 border-amber-500/40 pl-4 ml-2">
                    {currentReport.history?.map((entry, i) => (
                      <div key={i} className="relative pb-3">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-white">{entry.action}</span>
                          <span className="text-slate-500 font-mono">
                            {new Date(entry.timestamp).toLocaleString('en-GB')}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px]">
                          By {entry.performerName} ({entry.performerRole})
                        </p>
                        {entry.comments && (
                          <p className="text-slate-300 mt-1 italic bg-[#101726] p-2 rounded-lg border border-slate-800">
                            "{entry.comments}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Admin Review Action Box */}
            <div className="p-4 bg-[#0E1528] border-t border-[#1C2538] shrink-0 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  Admin Report Review & Approval Action
                </span>
                <span className="text-[11px] text-slate-400">
                  Current Status: <strong className="text-amber-400">{currentReport.status}</strong>
                </span>
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-3 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { id: 'Approved', label: 'Approve Report', color: 'bg-emerald-500 text-slate-950 font-bold' },
                    { id: 'Needs Correction', label: 'Request Correction', color: 'bg-rose-500 text-white font-bold' },
                    { id: 'Reviewed', label: 'Mark Reviewed', color: 'bg-blue-500 text-white font-bold' },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => setReviewStatus(btn.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                        reviewStatus === btn.id
                          ? btn.color + ' shadow-md scale-105'
                          : 'bg-[#141B2D] text-slate-400 hover:text-white'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={reviewComments}
                    onChange={(e) => setReviewComments(e.target.value)}
                    placeholder={
                      reviewStatus === 'Needs Correction'
                        ? 'Specify corrections required from engineer (e.g. Please clarify brickwork count)'
                        : 'Add optional administrative comments...'
                    }
                    className="flex-1 px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white focus:outline-none focus:border-amber-500 text-xs"
                  />
                  <button
                    type="submit"
                    disabled={reviewMutation.isPending}
                    className="px-4 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 font-bold shadow-md shadow-amber-500/20 cursor-pointer active:scale-95 transition-all shrink-0"
                  >
                    {reviewMutation.isPending ? 'Updating...' : 'Submit Decision'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
