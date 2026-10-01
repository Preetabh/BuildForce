import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Handshake,
  Plus,
  Phone,
  Mail,
  Edit2,
  Trash2,
  Search,
  Users,
  LayoutGrid,
  Table as TableIcon,
  MapPin,
  Calendar,
} from 'lucide-react';
import { PartnerItem } from '../../types';
import leadService from '../../services/lead.service';
import { AssociatePartnerModal } from '../../components/leads/AssociatePartnerModal';

export const ReferencePartners: React.FC = () => {
  const navigate = useNavigate();
  const [partners, setPartners] = useState<PartnerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPartnerForEdit, setSelectedPartnerForEdit] = useState<PartnerItem | null>(null);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    setIsLoading(true);
    try {
      const data = await leadService.getPartners();
      setPartners(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setSelectedPartnerForEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (partner: PartnerItem) => {
    setSelectedPartnerForEdit(partner);
    setIsModalOpen(true);
  };

  const handleDeletePartner = async (partnerId: string, partnerName: string) => {
    if (!window.confirm(`Are you sure you want to remove partner "${partnerName}"?`)) return;
    try {
      await leadService.deletePartner(partnerId);
      fetchPartners();
    } catch (err) {
      console.error('Failed to delete partner', err);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to remove all reference partners?')) return;
    try {
      await leadService.deleteAllPartners();
      fetchPartners();
    } catch (err) {
      console.error('Failed to clear partners', err);
    }
  };

  const filteredPartners = partners.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.phone?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q) ||
      p.partnerType?.toLowerCase().includes(q) ||
      p.address?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#0D1017] text-slate-200 p-4 sm:p-6 space-y-4">
      {/* 1. Top Section Header with Tabs Matching Screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1A2234] pb-4">
        {/* Left Tabs: Leads / Associate Partners */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/leads')}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-[#161D2B] transition-all cursor-pointer"
          >
            Leads
          </button>
          <button
            onClick={() => navigate('/leads/partners')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#EAB308] text-slate-950 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            Associate Partners
          </button>
        </div>

        {/* Right Search Bar & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#121622] border border-[#232D42] focus:border-amber-400 rounded-xl pl-3.5 pr-9 py-2 text-xs text-white placeholder-slate-500 outline-none w-48 sm:w-60 transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-[#121724] border border-[#20293D] rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode('table')}
              title="Table View"
              className={`p-1.5 rounded-lg text-xs transition-all ${
                viewMode === 'table' ? 'bg-[#EAB308] text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              title="Cards View"
              className={`p-1.5 rounded-lg text-xs transition-all ${
                viewMode === 'cards' ? 'bg-[#EAB308] text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {partners.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-700/50 text-red-300 font-semibold text-xs rounded-xl transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}

          {/* Add Associate Partner Button */}
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#EAB308] hover:bg-yellow-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Associate Partner</span>
          </button>
        </div>
      </div>

      {/* 2. Main Content: Table or Cards */}
      {isLoading ? (
        <div className="text-center py-20 text-slate-400 text-xs">
          Loading Associate Partners...
        </div>
      ) : filteredPartners.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-xs bg-[#10141F] border border-[#1E2638] rounded-3xl p-8 space-y-3">
          <Handshake className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-base font-semibold text-slate-300">No associate partners found</p>
          <p className="text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `No partners matching "${searchQuery}". Try clearing search.`
              : 'Add an associate partner to begin tracking referrals, leads, and commissions.'}
          </p>
          <button
            onClick={handleOpenAddModal}
            className="mt-2 px-4 py-2 bg-[#EAB308] hover:bg-yellow-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
          >
            + Add Associate Partner
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View Matching User Screenshot */
        <div className="bg-[#10141F] border border-[#1D2536] rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1D2536] text-[10.5px] uppercase tracking-wider text-slate-400 font-bold select-none whitespace-nowrap bg-[#0D1017]">
                  <th className="py-3 px-4">PARTNER NAME</th>
                  <th className="py-3 px-4">MOBILE / EMAIL</th>
                  <th className="py-3 px-4">CITY / ADDRESS</th>
                  <th className="py-3 px-4 text-center">PRIORITY</th>
                  <th className="py-3 px-4 text-center">DUE DATE</th>
                  <th className="py-3 px-4 text-center">STATUS</th>
                  <th className="py-3 px-4">LAST REMARK</th>
                  <th className="py-3 px-4 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#182030] text-slate-200">
                {filteredPartners.map((partner) => (
                  <tr
                    key={partner._id}
                    className="hover:bg-[#141B2A] transition-colors group"
                  >
                    {/* Partner Name & Type */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-xs sm:text-sm">
                        {partner.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {partner.partnerType || 'Associate'}
                        </span>
                        {partner.interestLevel && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 bg-slate-800">
                            {partner.interestLevel}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Mobile & Email */}
                    <td className="py-3.5 px-4 font-mono text-[11.5px] whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-200">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>{partner.phone}</span>
                      </div>
                      {partner.email && (
                        <div className="flex items-center gap-1.5 text-slate-400 text-[10.5px] mt-0.5">
                          <Mail className="w-3 h-3 text-sky-400" />
                          <span>{partner.email}</span>
                        </div>
                      )}
                    </td>

                    {/* City & Address */}
                    <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">
                      <div className="font-semibold text-white">
                        {partner.city || '-'}
                      </div>
                      {partner.address && (
                        <div className="text-[11px] text-slate-400 truncate mt-0.5" title={partner.address}>
                          {partner.address}
                        </div>
                      )}
                    </td>

                    {/* PRIORITY (Matching screenshot with red 'High') */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-xs font-bold ${
                          partner.priority === 'High' || partner.priority === 'Urgent'
                            ? 'text-rose-400'
                            : partner.priority === 'Medium'
                            ? 'text-amber-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {partner.priority || 'High'}
                      </span>
                    </td>

                    {/* DUE DATE */}
                    <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-xs whitespace-nowrap">
                      {partner.dueDate ? (
                        <span className="flex items-center justify-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{partner.dueDate}</span>
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* STATUS (Matching screenshot Active pill) */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-950/50 text-emerald-400 border border-emerald-500/30">
                        {partner.status || 'Active'}
                      </span>
                    </td>

                    {/* LAST REMARK */}
                    <td className="py-3.5 px-4 text-slate-400 text-xs max-w-xs truncate">
                      {partner.lastRemark || partner.notes || '-'}
                    </td>

                    {/* ACTIONS: Edit Button Matching Screenshot */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(partner)}
                          className="px-3 py-1 bg-[#1A202C] hover:bg-[#252E40] border border-[#2D3748] text-slate-300 hover:text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                          <Edit2 className="w-3 h-3 text-blue-400" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePartner(partner._id, partner.name)}
                          className="p-1 rounded-lg bg-red-950/30 hover:bg-red-900/60 border border-red-800/40 text-red-300 transition-colors cursor-pointer"
                          title="Delete Partner"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredPartners.map((p) => (
            <div
              key={p._id}
              className="p-5 bg-[#10141F] border border-[#1E2638] rounded-2xl space-y-4 shadow-xl hover:border-amber-400/40 transition-all relative group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">{p.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {p.partnerType || 'Associate'}
                    </span>
                    <span className="text-[10px] font-bold text-rose-400">
                      {p.priority || 'High'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEditModal(p)}
                    className="p-1.5 rounded-lg bg-[#1A202C] hover:bg-[#252E40] border border-[#2D3748] text-slate-300 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                  </button>
                  <button
                    onClick={() => handleDeletePartner(p._id, p.name)}
                    className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900 border border-red-700/40 text-red-300 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 border-t border-[#1C2436] pt-3">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-mono">{p.phone}</span>
                </div>
                {p.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-sky-400" />
                    <span>{p.email}</span>
                  </div>
                )}
                {p.city && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>{p.city}</span>
                  </div>
                )}
              </div>

              {/* Stats Counters */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-[#151B2A] rounded-xl text-center text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Leads Referred</p>
                  <p className="text-base font-black text-white font-mono mt-0.5">
                    {p.totalLeadsReferred || 0}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Converted</p>
                  <p className="text-base font-black text-cyan-400 font-mono mt-0.5">
                    {p.totalConverted || 0}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-[#1C2436]">
                <span className="text-slate-400">Total Earned:</span>
                <span className="font-black text-emerald-400 font-mono">
                  ₹{p.totalCommissionEarned?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Add / Edit Associate Partner Modal (Exact Recreation of User Screenshot) */}
      <AssociatePartnerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchPartners}
        partnerToEdit={selectedPartnerForEdit}
      />
    </div>
  );
};
