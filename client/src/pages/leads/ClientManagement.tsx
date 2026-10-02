import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Search,
  RotateCcw,
  Calendar,
  Phone,
  FileText,
  UserCheck,
  Edit,
  Skull,
  ArrowUpDown,
  CreditCard,
  IndianRupee,
  FolderOpen,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  Clock,
  Layers,
  MapPin,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { ClientRecord } from '../../types';
import leadService, { ClientFilterQuery } from '../../services/lead.service';
import catalogService from '../../services/catalog.service';
import { PaymentLedgerModal } from '../../components/leads/PaymentLedgerModal';
import { DailyProgressReportModal } from '../../components/leads/DailyProgressReportModal';
import { ClientFollowUpModal } from '../../components/leads/ClientFollowUpModal';
import { ClientEditModal } from '../../components/leads/ClientEditModal';
import { ClientDeadModal } from '../../components/leads/ClientDeadModal';

export const ClientManagement: React.FC = () => {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusMode, setStatusMode] = useState<'NonDead' | 'Dead' | 'All'>('NonDead');
  const [feeStatus, setFeeStatus] = useState<'All' | 'Paid' | 'Pending'>('All');
  const [companyFilter, setCompanyFilter] = useState('All Companies');
  const [serviceFilter, setServiceFilter] = useState('All Services');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sorting
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [selectedClientForPay, setSelectedClientForPay] = useState<ClientRecord | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  const [selectedClientForFollowUp, setSelectedClientForFollowUp] = useState<ClientRecord | null>(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);

  const [selectedClientForEdit, setSelectedClientForEdit] = useState<ClientRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [availableServices, setAvailableServices] = useState<string[]>([]);

  useEffect(() => {
    catalogService.getActiveServices().then((data) => {
      const activeList = (data || []).filter((s) => s.isActive).map((s) => s.name);
      setAvailableServices(activeList);
    }).catch(() => {});
  }, []);

  const [selectedClientForReport, setSelectedClientForReport] = useState<ClientRecord | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const [selectedClientForDead, setSelectedClientForDead] = useState<ClientRecord | null>(null);
  const [isDeadModalOpen, setIsDeadModalOpen] = useState(false);

  useEffect(() => {
    fetchClients();
  }, [statusMode, feeStatus, companyFilter, serviceFilter]);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const query: ClientFilterQuery = {
        search: search.trim() || undefined,
        statusMode,
        feeStatus,
        company: companyFilter !== 'All Companies' ? companyFilter : undefined,
        service: serviceFilter !== 'All Services' ? serviceFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
      const data = await leadService.getClients(query);
      setClients(data);
    } catch (err) {
      console.error('Failed to load clients', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchClients();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusMode('NonDead');
    setFeeStatus('All');
    setCompanyFilter('All Companies');
    setServiceFilter('All Services');
    setStartDate('');
    setEndDate('');
    // Trigger re-fetch
    leadService.getClients({ statusMode: 'NonDead', feeStatus: 'All' }).then((data) => setClients(data));
  };

  const handleRemoveAllData = async () => {
    if (!window.confirm('Are you sure you want to remove ALL data (leads, clients, payments, commissions, payouts, partners)?')) {
      return;
    }
    setIsLoading(true);
    try {
      await leadService.removeAllData();
      setClients([]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Sort by follow-up date
  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => {
      const dateA = a.latestFollowUp?.date ? new Date(a.latestFollowUp.date).getTime() : 0;
      const dateB = b.latestFollowUp?.date ? new Date(b.latestFollowUp.date).getTime() : 0;
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [clients, sortOrder]);

  // Aggregate totals
  const totalAgreed = clients.reduce((acc, c) => acc + (c.agreedAmount || 0), 0);
  const totalPaid = clients.reduce((acc, c) => acc + (c.paidAmount || 0), 0);
  const totalDue = clients.reduce(
    (acc, c) => acc + (c.balanceAmount ?? Math.max(0, (c.agreedAmount || 0) - (c.paidAmount || 0))),
    0
  );

  // Format date helper: "29 Sep 26"
  const formatDateDisplay = (d?: string | Date) => {
    if (!d) return 'No Date';
    try {
      const dateObj = new Date(d);
      if (isNaN(dateObj.getTime())) return 'No Date';
      return dateObj.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
      });
    } catch {
      return 'No Date';
    }
  };

  return (
    <div className="min-h-screen bg-[#0C1017] text-slate-200 p-3 sm:p-5 space-y-3 font-sans select-none">
      {/* Top Banner / Portal Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#111622] border border-[#1E2638] rounded-2xl px-5 py-3 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-slate-950 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
                LUCKNOW BUILDERS
              </div>
              <h1 className="text-lg font-black tracking-wider text-amber-300 drop-shadow-sm flex items-center gap-2">
                <span>LEAD FORCE PORTAL</span>
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#161D2B] border border-[#232E42]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300 font-bold">2026-2027</span>
            <span className="text-emerald-400 font-semibold text-[11px]">Session Active</span>
          </div>

          <button
            onClick={handleRemoveAllData}
            title="Remove all data from database"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Remove All Data</span>
          </button>

        </div>
      </div>

      {/* Breadcrumb & Section Title */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
            <span>Admin</span>
            <span className="text-slate-600">/</span>
            <span className="text-amber-400 font-semibold">Client List</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xl font-black text-white tracking-tight">
              Clients ({clients.length})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="hidden lg:flex items-center gap-4 bg-[#111622] border border-[#1E2638] px-4 py-1.5 rounded-xl">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Value</span>
              <span className="font-mono font-bold text-white text-xs">₹{totalAgreed.toLocaleString()}</span>
            </div>
            <div className="w-[1px] h-6 bg-[#1E2638]"></div>
            <div>
              <span className="text-[10px] text-emerald-500 uppercase font-semibold block">Total Paid</span>
              <span className="font-mono font-bold text-emerald-400 text-xs">₹{totalPaid.toLocaleString()}</span>
            </div>
            <div className="w-[1px] h-6 bg-[#1E2638]"></div>
            <div>
              <span className="text-[10px] text-amber-500 uppercase font-semibold block">Total Due</span>
              <span className="font-mono font-bold text-amber-400 text-xs">₹{totalDue.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Stats Summary (< lg screens) */}
      <div className="grid grid-cols-3 gap-2 lg:hidden w-full bg-[#111622] border border-[#1E2638] p-2.5 rounded-xl text-center">
        <div>
          <span className="text-[9.5px] text-slate-400 uppercase font-semibold block">Total</span>
          <span className="font-mono font-bold text-white text-xs">₹{totalAgreed.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-[9.5px] text-emerald-400 uppercase font-semibold block">Paid</span>
          <span className="font-mono font-bold text-emerald-400 text-xs">₹{totalPaid.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-[9.5px] text-amber-400 uppercase font-semibold block">Due</span>
          <span className="font-mono font-bold text-amber-400 text-xs">₹{totalDue.toLocaleString()}</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#111622] border border-[#1E2638] rounded-xl p-3 shadow-md">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Search box */}
          <div className="relative flex-1 min-w-[220px]">
            <input
              type="text"
              placeholder="Search name/mobile/business..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0C1017] border border-[#1E273A] rounded-lg pl-3 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  leadService.getClients({ statusMode, feeStatus }).then((d) => setClients(d));
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                ×
              </button>
            )}
          </div>

          {/* Status Radio Pills: Non-Dead / Dead / All */}
          <div className="flex items-center gap-1 bg-[#0C1017] border border-[#1E273A] rounded-lg p-1">
            <button
              type="button"
              onClick={() => setStatusMode('NonDead')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                statusMode === 'NonDead'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  statusMode === 'NonDead' ? 'bg-slate-950' : 'border border-slate-500'
                }`}
              ></span>
              <span>Non-Dead</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusMode('Dead')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                statusMode === 'Dead'
                  ? 'bg-rose-500 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  statusMode === 'Dead' ? 'bg-white' : 'border border-slate-500'
                }`}
              ></span>
              <span>Dead</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusMode('All')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                statusMode === 'All'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  statusMode === 'All' ? 'bg-slate-950' : 'border border-slate-500'
                }`}
              ></span>
              <span>All</span>
            </button>
          </div>

          {/* Fee Filter: FEE: All / Paid / Pending */}
          <div className="flex items-center gap-1.5 bg-[#0C1017] border border-[#1E273A] rounded-lg p-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1.5 pr-0.5">
              FEE:
            </span>
            <button
              type="button"
              onClick={() => setFeeStatus('All')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                feeStatus === 'All'
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  feeStatus === 'All' ? 'bg-slate-950' : 'border border-slate-500'
                }`}
              ></span>
              <span>All</span>
            </button>

            <button
              type="button"
              onClick={() => setFeeStatus('Paid')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                feeStatus === 'Paid'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  feeStatus === 'Paid' ? 'bg-slate-950' : 'border border-slate-500'
                }`}
              ></span>
              <span>Paid</span>
            </button>

            <button
              type="button"
              onClick={() => setFeeStatus('Pending')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                feeStatus === 'Pending'
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  feeStatus === 'Pending' ? 'bg-slate-950' : 'border border-slate-500'
                }`}
              ></span>
              <span>Pending</span>
            </button>
          </div>

          {/* Companies Dropdown */}
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="bg-[#0C1017] border border-[#1E273A] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="All Companies">All Companies</option>
            <option value="Lucknow Builders">Lucknow Builders</option>
            <option value="Lucknow Developers">Lucknow Developers</option>
            <option value="OLD INFRA">OLD INFRA</option>
            <option value="Apex Realty">Apex Realty</option>
          </select>

          {/* Services Dropdown */}
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="bg-[#0C1017] border border-[#1E273A] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="All Services">All Services</option>
            {availableServices.map((srv) => (
              <option key={srv} value={srv}>
                {srv}
              </option>
            ))}
          </select>

          {/* Date Range */}
          <div className="flex items-center gap-1.5 bg-[#0C1017] border border-[#1E273A] rounded-lg px-2 py-1">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs text-slate-300 focus:outline-none"
              placeholder="dd-mm-yyyy"
            />
            <span className="text-[11px] text-slate-500 font-medium">To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs text-slate-300 focus:outline-none"
              placeholder="dd-mm-yyyy"
            />
          </div>

          {/* Submit Search & Reset buttons */}
          <button
            type="submit"
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-all cursor-pointer shadow-sm"
          >
            Filter
          </button>

          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3 py-1.5 bg-[#1B2232] hover:bg-[#252E42] text-slate-300 font-semibold text-xs rounded-lg border border-[#2B364E] transition-all cursor-pointer"
          >
            Reset
          </button>
        </form>
      </div>

      {/* Main Clients Table */}
      <div className="bg-[#10141F] border border-[#1E2638] rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-[11px] min-w-[900px]">
            <thead>
              <tr className="bg-[#141A28] border-b border-[#232D42] text-[10px] font-bold tracking-wider text-amber-400 uppercase select-none whitespace-nowrap">
                <th className="py-2.5 px-2.5 text-center w-10">S.N.</th>
                <th className="py-2.5 px-2.5">
                  <div className="flex items-center gap-1">
                    <span>CLIENT ID</span>
                    <span className="text-slate-500">|</span>
                    <span className="text-slate-400">REG. DATE</span>
                  </div>
                </th>
                <th className="py-2.5 px-3">CLIENT NAME</th>
                <th className="py-2.5 px-2.5">SITE LOCATION</th>
                <th className="py-2.5 px-2.5">ASSOCIATE</th>
                <th className="py-2.5 px-2 text-center">AREA</th>
                <th className="py-2.5 px-2.5">MOBILE</th>
                <th className="py-2.5 px-2.5">SERVICES</th>
                <th className="py-2.5 px-2.5 text-right">TOTAL</th>
                <th className="py-2.5 px-2.5 text-right">PAID</th>
                <th className="py-2.5 px-2.5 text-right">DUE</th>
                <th
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="py-2.5 px-3 cursor-pointer hover:text-amber-300 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>FOLLOW UP</span>
                    <ArrowUpDown className="w-3 h-3 text-amber-400" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-center">ACTION</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#182032]">
              {isLoading ? (
                <tr>
                  <td colSpan={13} className="py-16 text-center text-slate-400 text-xs">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                      <span>Loading clients...</span>
                    </div>
                  </td>
                </tr>
              ) : sortedClients.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-16 text-center text-slate-400 text-xs">
                    <p className="font-semibold text-slate-300 text-sm">No client records found.</p>
                    <p className="text-slate-500 mt-1">Convert leads to clients or add new clients to see them here.</p>
                  </td>
                </tr>
              ) : (
                sortedClients.map((c, index) => {
                  const balanceDue =
                    c.balanceAmount ?? Math.max(0, (c.agreedAmount || 0) - (c.paidAmount || 0));
                  const cleanPhone = (c.phone || '').replace(/\D/g, '');
                  const waUrl = `https://wa.me/91${cleanPhone}`;

                  return (
                    <tr
                      key={c._id}
                      className={`hover:bg-[#151D2C] transition-colors ${
                        c.isDead ? 'opacity-60 bg-rose-950/5' : ''
                      }`}
                    >
                      {/* S.N. */}
                      <td className="py-2.5 px-2.5 text-center font-mono text-slate-400 font-semibold">
                        {index + 1}
                      </td>

                      {/* CLIENT ID & REG. DATE */}
                      <td className="py-2.5 px-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-amber-400 text-xs tracking-wide">
                            {c.clientCode}
                          </span>
                          <FolderOpen className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatDateDisplay(c.registrationDate)}
                          </span>
                        </div>
                      </td>

                      {/* CLIENT NAME & Sub-handler */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-white tracking-wide text-xs leading-tight">
                          {c.name}
                        </div>
                        {(c.subBadge || c.handlerName) && (
                          <div className="flex items-center gap-1 mt-0.5">
                            {c.subBadge && (
                              <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                {c.subBadge}
                              </span>
                            )}
                            {c.handlerName && (
                              <span className="text-[10px] text-amber-400 font-medium flex items-center gap-0.5">
                                <UserCheck className="w-2.5 h-2.5 text-amber-400" />
                                <span>{c.handlerName}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* SITE LOCATION */}
                      <td className="py-2.5 px-2.5 text-slate-300 max-w-[180px] truncate" title={c.siteLocation}>
                        {c.siteLocation || '-'}
                      </td>

                      {/* ASSOCIATE */}
                      <td className="py-2.5 px-2.5 whitespace-nowrap">
                        <div className="text-amber-400 font-semibold text-[11px]">
                          {c.associate || 'Direct'}
                        </div>
                        {c.associateType && (
                          <div className="text-[9.5px] text-slate-400 font-mono leading-none">
                            {c.associateType}
                          </div>
                        )}
                      </td>

                      {/* AREA */}
                      <td className="py-2.5 px-2 text-center font-mono text-emerald-400 whitespace-nowrap">
                        {c.area || '-'}
                      </td>

                      {/* MOBILE (WhatsApp icon + phone number) */}
                      <td className="py-2.5 px-2.5 whitespace-nowrap">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-slate-300 hover:text-emerald-400 font-mono transition-colors group"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20 group-hover:scale-110 transition-transform" />
                          <span>{c.phone}</span>
                        </a>
                      </td>

                      {/* SERVICES */}
                      <td className="py-2.5 px-2.5 text-slate-300 max-w-[160px] truncate" title={c.services}>
                        {c.services || '-'}
                      </td>

                      {/* TOTAL */}
                      <td className="py-2.5 px-2.5 text-right font-mono font-bold text-white whitespace-nowrap">
                        {c.agreedAmount ? c.agreedAmount.toLocaleString() : '0'}
                      </td>

                      {/* PAID */}
                      <td className="py-2.5 px-2.5 text-right font-mono font-bold text-white whitespace-nowrap">
                        {c.paidAmount ? c.paidAmount.toLocaleString() : '0'}
                      </td>

                      {/* DUE */}
                      <td className="py-2.5 px-2.5 text-right font-mono font-bold text-slate-200 whitespace-nowrap">
                        ₹{balanceDue.toLocaleString()}
                      </td>

                      {/* FOLLOW UP (Date + Remarks) */}
                      <td className="py-2.5 px-3 min-w-[200px] max-w-[280px]">
                        <div className="font-bold text-amber-400 text-[10.5px]">
                          {formatDateDisplay(c.latestFollowUp?.date)}
                        </div>
                        <div
                          className="text-[10px] text-slate-300 line-clamp-2 leading-snug mt-0.5"
                          title={c.latestFollowUp?.remarks || 'No Remark'}
                        >
                          {c.latestFollowUp?.remarks || 'No Remark'}
                        </div>
                      </td>

                      {/* ACTION BUTTONS (Exact match to screenshot buttons) */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {/* Schedule Payment or Pay Now */}
                          {balanceDue > 0 || (c.agreedAmount && c.agreedAmount > 0) ? (
                            <button
                              onClick={() => {
                                setSelectedClientForPay(c);
                                setIsPayModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded bg-[#5B55E6] hover:bg-[#4C45D8] text-white font-bold text-[10px] transition-all cursor-pointer shadow-sm"
                            >
                              Pay Now
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedClientForPay(c);
                                setIsPayModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded bg-[#0284C7] hover:bg-[#0369a1] text-white font-bold text-[10px] transition-all cursor-pointer shadow-sm"
                            >
                              Schedule Payment
                            </button>
                          )}

                          {/* Report */}
                          <button
                            onClick={() => {
                              setSelectedClientForReport(c);
                              setIsReportModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded bg-[#06B6D4] hover:bg-[#0891b2] text-slate-950 font-bold text-[10px] transition-all cursor-pointer shadow-sm"
                          >
                            Report
                          </button>

                          {/* Follow */}
                          <button
                            onClick={() => {
                              setSelectedClientForFollowUp(c);
                              setIsFollowUpModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded bg-[#10B981] hover:bg-[#059669] text-slate-950 font-bold text-[10px] transition-all cursor-pointer shadow-sm"
                          >
                            Follow
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => {
                              setSelectedClientForEdit(c);
                              setIsEditModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold text-[10px] transition-all cursor-pointer shadow-sm"
                          >
                            Edit
                          </button>

                          {/* Dead / Restore */}
                          <button
                            onClick={() => {
                              setSelectedClientForDead(c);
                              setIsDeadModalOpen(true);
                            }}
                            className={`px-2.5 py-1 rounded font-bold text-[10px] transition-all cursor-pointer shadow-sm ${
                              c.isDead
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                : 'bg-[#EF4444] hover:bg-[#dc2626] text-white'
                            }`}
                          >
                            {c.isDead ? 'Restore' : 'Dead'}
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

        {/* Bottom Footer Bar (Matching "Total 13 records") */}
        <div className="px-5 py-3 border-t border-[#1E2638] bg-[#0E121B] flex items-center justify-between text-xs font-semibold text-slate-400">
          <div>
            <span>Total</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-amber-400 font-black text-sm">{clients.length}</span>
            <span className="text-slate-400">records</span>
          </div>
        </div>
      </div>

      {/* Payment Ledger Modal (Schedule Payment / Pay Now) */}
      <PaymentLedgerModal
        isOpen={isPayModalOpen}
        client={selectedClientForPay}
        onClose={() => {
          setIsPayModalOpen(false);
          setSelectedClientForPay(null);
        }}
        onSuccess={() => fetchClients()}
      />

      {/* Follow-up Modal */}
      <ClientFollowUpModal
        isOpen={isFollowUpModalOpen}
        client={selectedClientForFollowUp}
        onClose={() => {
          setIsFollowUpModalOpen(false);
          setSelectedClientForFollowUp(null);
        }}
        onSuccess={() => fetchClients()}
      />

      {/* Edit Client Modal */}
      <ClientEditModal
        isOpen={isEditModalOpen}
        client={selectedClientForEdit}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedClientForEdit(null);
        }}
        onSuccess={() => fetchClients()}
      />

      {/* Daily Progress Report Modal */}
      <DailyProgressReportModal
        isOpen={isReportModalOpen}
        client={selectedClientForReport}
        onClose={() => {
          setIsReportModalOpen(false);
          setSelectedClientForReport(null);
        }}
        onSuccess={() => fetchClients()}
      />

      {/* Client Dead / Restore Confirmation Modal */}
      <ClientDeadModal
        isOpen={isDeadModalOpen}
        client={selectedClientForDead}
        onClose={() => {
          setIsDeadModalOpen(false);
          setSelectedClientForDead(null);
        }}
        onSuccess={() => fetchClients()}
      />
    </div>
  );
};

export default ClientManagement;
