import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  Phone,
  MapPin,
  CreditCard,
  IndianRupee,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { ClientRecord } from '../../types';
import leadService from '../../services/lead.service';
import { PayAmountModal } from '../../components/leads/PayAmountModal';

export const ClientManagement: React.FC = () => {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClientForPay, setSelectedClientForPay] = useState<ClientRecord | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const data = await leadService.getClients(search);
      setClients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchClients();
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
            <span className="text-amber-400 font-semibold">Clients</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-amber-400" />
            <span>Registered Clients ({clients.length})</span>
          </h2>
          <p className="text-xs text-slate-400">
            Accounts converted from sales leads into active construction agreements
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedClientForPay(null);
            setIsPayModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <CreditCard className="w-4 h-4 stroke-[2.5]" />
          <span>Record Client Payment</span>
        </button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md">
        <input
          type="text"
          placeholder="Search by client name, code, phone, location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-[#10141F] border border-[#1E2638] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-[#0284C7] hover:bg-[#0369a1] text-white font-bold text-xs rounded-xl transition-all"
        >
          Search
        </button>
      </form>

      {/* Clients Table */}
      <div className="bg-[#10141F] border border-[#1E2638] rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-[11.5px]">
            <thead>
              <tr className="bg-[#131825] border-b border-[#1E2638] text-[10px] font-bold tracking-wider text-amber-400/90 uppercase select-none">
                <th className="py-3 px-3">CODE</th>
                <th className="py-3 px-3">CLIENT NAME</th>
                <th className="py-3 px-3">COMPANY</th>
                <th className="py-3 px-3">LOCATION</th>
                <th className="py-3 px-3">CONTACT</th>
                <th className="py-3 px-3 text-right">AGREED VALUE</th>
                <th className="py-3 px-3 text-right">PAID AMOUNT</th>
                <th className="py-3 px-3 text-right">BALANCE DUE</th>
                <th className="py-3 px-3 text-center">STATUS</th>
                <th className="py-3 px-3 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A2234]">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 text-xs">
                    Loading clients...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 text-xs">
                    No registered clients yet. Convert a lead using the <strong>[Reg]</strong> button
                    in Lead Management.
                  </td>
                </tr>
              ) : (
                clients.map((c) => (
                  <tr key={c._id} className="hover:bg-[#151C2C]/80 transition-colors">
                    <td className="py-3 px-3 font-mono text-cyan-400 font-bold">{c.clientCode}</td>
                    <td className="py-3 px-3 font-bold text-white">{c.name}</td>
                    <td className="py-3 px-3 text-amber-400 font-medium">{c.companyName}</td>
                    <td className="py-3 px-3 text-slate-300">{c.siteLocation}</td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      <a href={`tel:${c.phone}`} className="hover:text-emerald-400 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>{c.phone}</span>
                      </a>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-200">
                      ₹{c.agreedAmount?.toLocaleString() || 0}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                      ₹{c.paidAmount?.toLocaleString() || 0}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-amber-400">
                      ₹{c.balanceAmount?.toLocaleString() || 0}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedClientForPay(c);
                          setIsPayModalOpen(true);
                        }}
                        className="px-3 py-1 rounded-md bg-[#D97706] hover:bg-[#F59E0B] text-slate-950 font-bold text-[10.5px] transition-all cursor-pointer flex items-center gap-1 mx-auto"
                      >
                        <IndianRupee className="w-3 h-3" />
                        <span>Pay Amount</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PayAmountModal
        isOpen={isPayModalOpen}
        defaultClient={selectedClientForPay}
        onClose={() => {
          setIsPayModalOpen(false);
          setSelectedClientForPay(null);
        }}
        onSuccess={() => fetchClients()}
      />
    </div>
  );
};
