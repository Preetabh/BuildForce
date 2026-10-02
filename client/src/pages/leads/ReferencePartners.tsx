import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit2,
  PhoneCall,
  Skull,
  Building2,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Calendar,
} from 'lucide-react';
import { PartnerItem } from '../../types';
import leadService from '../../services/lead.service';
import { AssociatePartnerModal } from '../../components/leads/AssociatePartnerModal';
import { AssociatePartnerFollowUpModal } from '../../components/leads/AssociatePartnerFollowUpModal';

type StatusFilter = 'active' | 'dead' | 'all';

export const ReferencePartners: React.FC = () => {
  const navigate = useNavigate();

  // Data states
  const [partners, setPartners] = useState<PartnerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [typeFilter, setTypeFilter] = useState<string>('All Types');
  const [searchInput, setSearchInput] = useState<string>('');
  const [appliedSearch, setAppliedSearch] = useState<string>('');

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [selectedPartnerForEdit, setSelectedPartnerForEdit] = useState<PartnerItem | null>(null);

  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
  const [selectedPartnerForFollow, setSelectedPartnerForFollow] = useState<PartnerItem | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    setIsLoading(true);
    try {
      const data = await leadService.getPartners();
      setPartners(data || []);
    } catch (err) {
      console.error('Failed to load associate partners:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Format date helper: "10 Jun 2026"
  const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const day = date.getDate();
      const month = date.toLocaleString('en-US', { month: 'short' });
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return dateStr;
    }
  };

  // Handle Search Submission
  const handleTriggerSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedSearch(searchInput.trim());
  };

  // Toggle Dead / Active status logic
  const handleToggleDead = async (partner: PartnerItem) => {
    const isCurrentlyDead = partner.status === 'Dead' || partner.status === 'INACTIVE';
    const newStatus = isCurrentlyDead ? 'Active' : 'Dead';
    const confirmPrompt = isCurrentlyDead
      ? `Reactivate associate partner "${partner.name}" to Active?`
      : `Mark associate partner "${partner.name}" as Dead?`;

    if (!window.confirm(confirmPrompt)) return;

    try {
      await leadService.updatePartner(partner._id, { status: newStatus as any });
      setPartners((prev) =>
        prev.map((p) => (p._id === partner._id ? { ...p, status: newStatus } : p))
      );
      showToast(
        isCurrentlyDead
          ? `Partner "${partner.name}" reactivated to Active`
          : `Partner "${partner.name}" marked as Dead`
      );
    } catch (err: any) {
      console.error('Failed to update partner status:', err);
      alert('Failed to update partner status. Please try again.');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (partner: PartnerItem) => {
    setSelectedPartnerForEdit(partner);
    setIsAddEditModalOpen(true);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setSelectedPartnerForEdit(null);
    setIsAddEditModalOpen(true);
  };

  // Open Follow-up Modal
  const handleOpenFollow = (partner: PartnerItem) => {
    setSelectedPartnerForFollow(partner);
    setIsFollowModalOpen(true);
  };

  // Filtering Logic
  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      // 1. Status Filter
      const isDead = p.status === 'Dead' || p.status === 'INACTIVE';
      if (statusFilter === 'active' && isDead) return false;
      if (statusFilter === 'dead' && !isDead) return false;

      // 2. Type Filter
      if (typeFilter !== 'All Types') {
        const pType = (p.partnerType || '').toLowerCase();
        const selected = typeFilter.toLowerCase();
        if (!pType.includes(selected) && !selected.includes(pType)) {
          return false;
        }
      }

      // 3. Search Filter
      if (appliedSearch) {
        const query = appliedSearch.toLowerCase();
        const matchName = (p.name || '').toLowerCase().includes(query);
        const matchPhone = (p.phone || '').toLowerCase().includes(query);
        const matchEmail = (p.email || '').toLowerCase().includes(query);
        const matchCity = (p.city || '').toLowerCase().includes(query);
        const matchAddress = (p.address || '').toLowerCase().includes(query);
        const matchType = (p.partnerType || '').toLowerCase().includes(query);
        if (!matchName && !matchPhone && !matchEmail && !matchCity && !matchAddress && !matchType) {
          return false;
        }
      }

      return true;
    });
  }, [partners, statusFilter, typeFilter, appliedSearch]);

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-200 p-3 sm:p-5 lg:p-6 space-y-4 max-w-full overflow-x-hidden">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#161D2B] border border-amber-500/40 text-amber-300 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs select-none">
        <span
          className="text-slate-400 hover:text-slate-300 cursor-pointer"
          onClick={() => navigate('/dashboard')}
        >
          Admin
        </span>
        <span className="text-slate-600">/</span>
        <span className="text-[#EAB308] font-medium">Associate Partners</span>
      </div>

      {/* 2. Top Header with Title, Switcher Tabs, and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        {/* Title & Subtitle */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#EAB308] tracking-tight">
            Associate Partners
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Manage outsiders who refer leads — freelancers, brokers, architects & more
          </p>
        </div>

        {/* Switcher Pills & Add Button */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Switcher Pills: Leads / Associate Partners */}
          <div className="inline-flex bg-[#121622] p-1 rounded-xl border border-[#1E2638] shrink-0">
            <button
              type="button"
              onClick={() => navigate('/leads')}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#182030] transition-all cursor-pointer"
            >
              Leads
            </button>
            <button
              type="button"
              onClick={() => navigate('/leads/partners')}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-bold bg-[#EAB308] text-slate-950 shadow-md shadow-amber-500/20 cursor-default"
            >
              Associate Partners
            </button>
          </div>

          {/* Add Associate Button */}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-[#EAB308] hover:bg-yellow-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Associate</span>
          </button>
        </div>
      </div>

      {/* 3. Toolbar / Filters Bar Matching Screenshot */}
      <div className="bg-[#0E121A] border border-[#1A2234] rounded-2xl p-3 sm:p-3.5 shadow-xl">
        <form
          onSubmit={handleTriggerSearch}
          className="flex flex-col xl:flex-row xl:items-center justify-between gap-3"
        >
          {/* Controls Cluster */}
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Status Radio Controls */}
            <div className="flex items-center gap-2.5 bg-[#121724] border border-[#1E283D] px-3 py-1.5 rounded-xl">
              <span className="text-[#EAB308] font-bold text-xs">Status:</span>
              <div className="flex items-center gap-2.5 text-xs font-semibold">
                <label className="flex items-center gap-1 cursor-pointer text-slate-200 hover:text-white">
                  <input
                    type="radio"
                    name="statusFilter"
                    value="active"
                    checked={statusFilter === 'active'}
                    onChange={() => setStatusFilter('active')}
                    className="accent-[#EAB308] w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Active</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer text-slate-200 hover:text-white">
                  <input
                    type="radio"
                    name="statusFilter"
                    value="dead"
                    checked={statusFilter === 'dead'}
                    onChange={() => setStatusFilter('dead')}
                    className="accent-[#EAB308] w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Dead</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer text-slate-200 hover:text-white">
                  <input
                    type="radio"
                    name="statusFilter"
                    value="all"
                    checked={statusFilter === 'all'}
                    onChange={() => setStatusFilter('all')}
                    className="accent-[#EAB308] w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>All</span>
                </label>
              </div>
            </div>

            {/* Type Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-300 font-medium text-xs">Type:</span>
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-[#141926] border border-[#232D42] focus:border-[#EAB308] rounded-xl px-3 py-1.5 text-xs text-white outline-none cursor-pointer pr-7 appearance-none transition-all"
                >
                  <option value="All Types">All Types</option>
                  <option value="Architect">Architect</option>
                  <option value="Interior Designer">Interior Designer</option>
                  <option value="Contractor">Contractor</option>
                  <option value="Broker">Broker / Agent</option>
                  <option value="Freelancer">Freelancer</option>
                  <option value="Consultant">Consultant</option>
                  <option value="Channel Partner">Channel Partner</option>
                  <option value="Associate">Associate</option>
                  <option value="Vendor">Vendor</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Search Input Box */}
            <div className="flex-1 min-w-[200px] sm:min-w-[260px]">
              <input
                type="text"
                placeholder="Search by name, mobile, email, city..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-[#141926] border border-[#232D42] focus:border-[#EAB308] rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#EAB308] hover:bg-yellow-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all cursor-pointer shrink-0"
            >
              <Search className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Search</span>
            </button>
          </div>

          {/* Right: Counter Found */}
          <div className="text-right text-xs text-slate-400 font-medium shrink-0 pt-1 xl:pt-0">
            <span className="text-[#EAB308] font-bold">{filteredPartners.length}</span> partner(s) found
          </div>
        </form>
      </div>

      {/* 4. Table / Content Container (Zero scrollbar, fully responsive) */}
      <div className="bg-[#0D1017] border border-[#1A2234] rounded-2xl overflow-hidden shadow-2xl">
        {isLoading ? (
          <div className="text-center py-20 text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
            <span>Loading associate partners...</span>
          </div>
        ) : filteredPartners.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs p-6 space-y-3">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto stroke-1" />
            <p className="text-sm font-semibold text-slate-300">No associate partners found</p>
            <p className="text-slate-500 max-w-sm mx-auto">
              {appliedSearch || statusFilter !== 'all' || typeFilter !== 'All Types'
                ? 'No partners matched your filters. Try clearing your search or status.'
                : 'Click "+ Add Associate" to register your first partner.'}
            </p>
            {(appliedSearch || statusFilter !== 'active' || typeFilter !== 'All Types') && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('active');
                  setTypeFilter('All Types');
                  setSearchInput('');
                  setAppliedSearch('');
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#161D2B] border border-[#232D42] text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop & Tablet Table View (No Scrollbar, clean 100% fit) */}
            <div className="hidden md:block overflow-x-auto no-scrollbar scrollbar-none">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#182030] text-[10.5px] uppercase tracking-wider text-slate-400 font-bold select-none bg-[#090C12]">
                    <th className="py-2.5 px-3 whitespace-nowrap">DATE</th>
                    <th className="py-2.5 px-2.5 whitespace-nowrap">TYPE</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">NAME</th>
                    <th className="py-2.5 px-2.5 whitespace-nowrap">CONTACT</th>
                    <th className="py-2.5 px-2.5 whitespace-nowrap">EMAIL</th>
                    <th className="py-2.5 px-3">ADDRESS</th>
                    <th className="py-2.5 px-2 text-center whitespace-nowrap">INTEREST</th>
                    <th className="py-2.5 px-2 text-center whitespace-nowrap">PRIORITY</th>
                    <th className="py-2.5 px-2 text-center whitespace-nowrap">DUE DATE</th>
                    <th className="py-2.5 px-2 text-center whitespace-nowrap">STATUS</th>
                    <th className="py-2.5 px-2.5">LAST REMARK</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#151B28] text-slate-200">
                  {filteredPartners.map((partner) => {
                    const isDead = partner.status === 'Dead' || partner.status === 'INACTIVE';
                    const displayDate = formatDisplayDate(partner.createdAt || partner.dueDate);

                    return (
                      <tr
                        key={partner._id}
                        className="hover:bg-[#121622] transition-colors group"
                      >
                        {/* DATE */}
                        <td className="py-3 px-3 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                          {displayDate}
                        </td>

                        {/* TYPE */}
                        <td className="py-3 px-2.5 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#262013] text-[#FBBF24] border border-[#B45309]/50">
                            {partner.partnerType || 'Associate'}
                          </span>
                        </td>

                        {/* NAME */}
                        <td className="py-3 px-3 font-bold text-white text-xs sm:text-[13px] whitespace-nowrap">
                          {partner.name}
                        </td>

                        {/* CONTACT */}
                        <td className="py-3 px-2.5 font-mono text-slate-200 text-xs whitespace-nowrap">
                          {partner.phone}
                        </td>

                        {/* EMAIL */}
                        <td className="py-3 px-2.5 text-slate-400 text-xs whitespace-nowrap max-w-[130px] truncate" title={partner.email}>
                          {partner.email || '-'}
                        </td>

                        {/* ADDRESS */}
                        <td className="py-3 px-3 text-slate-300 text-xs max-w-[160px] truncate" title={partner.address || partner.city}>
                          {partner.address || partner.city || '-'}
                        </td>

                        {/* INTEREST */}
                        <td className="py-3 px-2 text-center font-bold text-white text-xs whitespace-nowrap">
                          {partner.interestLevel || 'A'}
                        </td>

                        {/* PRIORITY */}
                        <td className="py-3 px-2 text-center whitespace-nowrap font-bold text-xs text-rose-400">
                          {partner.priority === 'Urgent'
                            ? '🚨 Urgent'
                            : partner.priority || 'High'}
                        </td>

                        {/* DUE DATE */}
                        <td className="py-3 px-2 text-center text-slate-400 font-mono text-xs whitespace-nowrap">
                          {partner.dueDate ? formatDisplayDate(partner.dueDate) : '-'}
                        </td>

                        {/* STATUS */}
                        <td className="py-3 px-2 text-center whitespace-nowrap">
                          {isDead ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950/60 text-rose-400 border border-rose-500/40">
                              Dead
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/40">
                              Active
                            </span>
                          )}
                        </td>

                        {/* LAST REMARK */}
                        <td className="py-3 px-2.5 text-slate-400 text-xs max-w-[110px] truncate" title={partner.lastRemark || partner.notes}>
                          {partner.lastRemark || partner.notes || '-'}
                        </td>

                        {/* ACTIONS: Edit, Dead, Follow */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(partner)}
                              className="px-2.5 py-1 bg-[#1A2234] hover:bg-[#232E47] border border-blue-500/30 text-blue-400 hover:text-blue-300 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                              title="Edit Associate Partner"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>

                            {/* Dead */}
                            <button
                              type="button"
                              onClick={() => handleToggleDead(partner)}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-sm ${
                                isDead
                                  ? 'bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-600/40 text-emerald-400'
                                  : 'bg-[#261D12] hover:bg-[#382B19] border border-amber-600/40 text-amber-400 hover:text-amber-300'
                              }`}
                              title={isDead ? 'Reactivate Partner' : 'Mark Partner as Dead'}
                            >
                              <Skull className="w-3 h-3" />
                              <span>{isDead ? 'Active' : 'Dead'}</span>
                            </button>

                            {/* Follow */}
                            <button
                              type="button"
                              onClick={() => handleOpenFollow(partner)}
                              className="px-2.5 py-1 bg-[#0D241C] hover:bg-[#14362B] border border-emerald-600/40 text-emerald-400 hover:text-emerald-300 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                              title="Follow Up Associate Partner"
                            >
                              <PhoneCall className="w-3 h-3" />
                              <span>Follow</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards View (< md screens, zero scrollbar needed) */}
            <div className="block md:hidden divide-y divide-[#182030]">
              {filteredPartners.map((partner) => {
                const isDead = partner.status === 'Dead' || partner.status === 'INACTIVE';
                const displayDate = formatDisplayDate(partner.createdAt || partner.dueDate);

                return (
                  <div key={partner._id} className="p-3.5 space-y-2.5">
                    {/* Header Row: Name & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-white text-sm">{partner.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#262013] text-[#FBBF24] border border-[#B45309]/50">
                            {partner.partnerType || 'Associate'}
                          </span>
                          <span className="text-[10px] font-bold text-rose-400">
                            {partner.priority === 'Urgent' ? '🚨 Urgent' : partner.priority || 'High'}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          isDead
                            ? 'bg-rose-950/60 text-rose-400 border border-rose-500/40'
                            : 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40'
                        }`}
                      >
                        {isDead ? 'Dead' : 'Active'}
                      </span>
                    </div>

                    {/* Contact & Date Info */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                      <div className="flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{partner.phone}</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-slate-400">
                        <Calendar className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>{displayDate}</span>
                      </div>
                    </div>

                    {partner.address && (
                      <div className="flex items-start gap-1 text-[11px] text-slate-400">
                        <MapPin className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{partner.address}</span>
                      </div>
                    )}

                    {partner.lastRemark && (
                      <div className="p-2 bg-[#121722] rounded-lg text-[11px] text-slate-400 italic">
                        "{partner.lastRemark}"
                      </div>
                    )}

                    {/* Mobile Action Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(partner)}
                        className="flex-1 py-1.5 bg-[#1A2234] hover:bg-[#232E47] border border-blue-500/30 text-blue-400 text-xs font-semibold rounded-lg flex items-center justify-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleDead(partner)}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 ${
                          isDead
                            ? 'bg-emerald-950/40 border border-emerald-600/40 text-emerald-400'
                            : 'bg-[#261D12] border border-amber-600/40 text-amber-400'
                        }`}
                      >
                        <Skull className="w-3 h-3" />
                        <span>{isDead ? 'Active' : 'Dead'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenFollow(partner)}
                        className="flex-1 py-1.5 bg-[#0D241C] border border-emerald-600/40 text-emerald-400 text-xs font-semibold rounded-lg flex items-center justify-center gap-1"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>Follow</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 5. Add / Edit Associate Partner Modal */}
      <AssociatePartnerModal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        onSuccess={() => {
          fetchPartners();
          showToast(
            selectedPartnerForEdit
              ? 'Associate partner updated successfully'
              : 'Associate partner created successfully'
          );
        }}
        partnerToEdit={selectedPartnerForEdit}
      />

      {/* 6. Follow-Up Modal */}
      <AssociatePartnerFollowUpModal
        isOpen={isFollowModalOpen}
        onClose={() => setIsFollowModalOpen(false)}
        onSuccess={() => {
          fetchPartners();
          showToast('Follow-up recorded successfully');
        }}
        partner={selectedPartnerForFollow}
      />
    </div>
  );
};

export default ReferencePartners;
