import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { PartnerItem } from '../../types';
import leadService from '../../services/lead.service';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface AssociatePartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  partnerToEdit?: PartnerItem | null;
}

export const AssociatePartnerModal: React.FC<AssociatePartnerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  partnerToEdit,
}) => {
  useEscapeKey(onClose, isOpen);

  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [partnerType, setPartnerType] = useState('');
  const [interestLevel, setInterestLevel] = useState('');
  const [priority, setPriority] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (partnerToEdit) {
        setFullName(partnerToEdit.name || '');
        setMobile(partnerToEdit.phone || '');
        setEmail(partnerToEdit.email || '');
        setPartnerType(partnerToEdit.partnerType || '');
        setInterestLevel(partnerToEdit.interestLevel || '');
        setPriority(partnerToEdit.priority || '');
        setDueDate(partnerToEdit.dueDate || '');
        setCity(partnerToEdit.city || '');
        setAddress(partnerToEdit.address || '');
      } else {
        setFullName('');
        setMobile('');
        setEmail('');
        setPartnerType('');
        setInterestLevel('');
        setPriority('');
        setDueDate('');
        setCity('');
        setAddress('');
      }
      setError('');
    }
  }, [isOpen, partnerToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please enter Full Name.');
      return;
    }
    if (!mobile.trim()) {
      setError('Please enter Mobile Number.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload: Partial<PartnerItem> = {
        name: fullName.trim(),
        phone: mobile.trim(),
        email: email.trim(),
        partnerType: partnerType || 'Associate',
        interestLevel: interestLevel || '',
        priority: priority || 'High',
        dueDate: dueDate || '',
        city: city.trim(),
        address: address.trim(),
        commissionRatePercent: partnerToEdit?.commissionRatePercent || 2.0,
      };

      if (partnerToEdit && partnerToEdit._id) {
        await leadService.updatePartner(partnerToEdit._id, payload);
      } else {
        await leadService.createPartner(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save partner');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#14171F] border border-[#232836] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-7 text-slate-200 max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#232836] shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {partnerToEdit ? 'Edit Associate Partner' : 'Add Associate Partner'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto custom-scrollbar pr-1 flex-1 py-3">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Partner's full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-[#1B1F2A] border border-[#2B3242] focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>

          {/* Mobile & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mobile <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="10-digit mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full bg-[#1B1F2A] border border-[#2B3242] focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1B1F2A] border border-[#2B3242] focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Partner Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Partner Type
            </label>
            <div className="relative">
              <select
                value={partnerType}
                onChange={(e) => setPartnerType(e.target.value)}
                className="w-full bg-[#1B1F2A] border border-[#2B3242] focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">-- Select Type --</option>
                <option value="Architect">Architect</option>
                <option value="Interior Designer">Interior Designer</option>
                <option value="Contractor">Contractor</option>
                <option value="Broker / Real Estate Agent">Broker / Real Estate Agent</option>
                <option value="Consultant">Consultant</option>
                <option value="Channel Partner">Channel Partner</option>
                <option value="Associate">Associate</option>
                <option value="Vendor / Supplier">Vendor / Supplier</option>
                <option value="Social Media Influencer">Social Media Influencer</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Interest Level & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Interest Level
              </label>
              <div className="relative">
                <select
                  value={interestLevel}
                  onChange={(e) => setInterestLevel(e.target.value)}
                  className="w-full bg-[#1B1F2A] border border-[#2B3242] focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">-- Select --</option>
                  <option value="A">Grade A (High)</option>
                  <option value="B">Grade B (Medium)</option>
                  <option value="C">Grade C (Low)</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Priority
              </label>
              <div className="relative">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-[#1B1F2A] border border-[#2B3242] focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">-- Select --</option>
                  <option value="High">🔥 High</option>
                  <option value="Urgent">🚨 Urgent</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Due Date & City (Legacy) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Due Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-[#1B1F2A] border border-[#2B3242] focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all scheme-dark cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                City (Legacy)
              </label>
              <input
                type="text"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-[#1B1F2A] border border-[#2B3242] focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Address
            </label>
            <textarea
              rows={3}
              placeholder="Full Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-[#1B1F2A] border border-[#2B3242] focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all resize-y"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#232836] shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#202634] hover:bg-[#2A3245] text-slate-300 text-xs font-semibold border border-[#2E374C] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#EAB308] hover:bg-[#F59E0B] text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 fill-current stroke-[2.5]" />
              <span>{isSubmitting ? 'Saving...' : partnerToEdit ? 'Save Partner' : 'Save Partner'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
