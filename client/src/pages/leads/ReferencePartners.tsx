import React, { useState, useEffect } from 'react';
import {
  Handshake,
  Plus,
  Phone,
  Mail,
  IndianRupee,
  Percent,
  CheckCircle,
  X,
  Trash2,
} from 'lucide-react';
import { PartnerItem } from '../../types';
import leadService from '../../services/lead.service';

export const ReferencePartners: React.FC = () => {
  const [partners, setPartners] = useState<PartnerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Partner Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [partnerType, setPartnerType] = useState('Associate');
  const [commissionRate, setCommissionRate] = useState('2.5');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setIsSubmitting(true);
    try {
      await leadService.createPartner({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        partnerType,
        commissionRatePercent: Number(commissionRate) || 2.0,
        notes: notes.trim(),
      });
      setIsAddModalOpen(false);
      setName('');
      setPhone('');
      setEmail('');
      setCommissionRate('2.5');
      setNotes('');
      fetchPartners();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <div className="min-h-screen bg-[#0D1017] text-slate-200 p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
            <span>Admin</span>
            <span>/</span>
            <span>Lead Management</span>
            <span>/</span>
            <span className="text-amber-400 font-semibold">Reference Partners</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            <Handshake className="w-6 h-6 text-amber-400" />
            <span>Reference Partners & Associates ({partners.length})</span>
          </h2>
          <p className="text-xs text-slate-400">
            Channel partners, business associates, and referral network attribution
          </p>
        </div>

        <div className="flex items-center gap-2">
          {partners.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-700/50 text-red-300 font-semibold text-xs rounded-xl transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove All</span>
            </button>
          )}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add New Partner</span>
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">
            Loading partners...
          </div>
        ) : partners.length === 0 ? (
          <div className="col-span-3 text-center py-16 text-slate-400 text-xs bg-[#10141F] border border-[#1E2638] rounded-3xl p-8 space-y-3">
            <Handshake className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-base font-semibold text-slate-300">No reference partners found</p>
            <p className="text-slate-500 max-w-sm mx-auto">
              Your partner network is currently clear. Add a partner to begin tracking associate referrals and commissions.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-2 px-4 py-2 bg-[#EAB308] hover:bg-yellow-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all"
            >
              + Add First Partner
            </button>
          </div>
        ) : (
          partners.map((p) => (
            <div
              key={p._id}
              className="p-5 bg-[#10141F] border border-[#1E2638] rounded-2xl space-y-4 shadow-xl hover:border-amber-400/40 transition-all relative group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">{p.name}</h3>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {p.partnerType} • {p.commissionRatePercent}% Comm.
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleDeletePartner(p._id, p.name)}
                    title="Delete Partner"
                    className="p-1 rounded-lg bg-red-950/40 hover:bg-red-900 border border-red-700/40 text-red-300 transition-colors opacity-80 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
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
          ))
        )}
      </div>

      {/* Add Partner Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121622] border border-[#232B3E] rounded-3xl w-full max-w-md text-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[#1E2638] flex items-center justify-between bg-[#151B2A]">
              <h3 className="font-bold text-white text-base">Add Reference Partner</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePartner} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Partner / Associate Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Realty Partners"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#182030] border border-[#2A354C] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#182030] border border-[#2A354C] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="partner@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#182030] border border-[#2A354C] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Partner Type
                  </label>
                  <select
                    value={partnerType}
                    onChange={(e) => setPartnerType(e.target.value)}
                    className="w-full bg-[#182030] border border-[#2A354C] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Associate">Associate</option>
                    <option value="Channel Partner">Channel Partner</option>
                    <option value="Broker">Broker</option>
                    <option value="Social Media Influencer">Influencer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Commission %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    className="w-full bg-[#182030] border border-[#2A354C] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Terms or area of influence..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#182030] border border-[#2A354C] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#1E2638]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-[#182030] text-slate-300 text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#D97706] hover:bg-[#F59E0B] text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20"
                >
                  {isSubmitting ? 'Saving...' : 'Save Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
