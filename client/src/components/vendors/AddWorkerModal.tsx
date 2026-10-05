import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save } from 'lucide-react';
import { WorkerItem, WorkerTrade, WorkerStatus } from '../../types/vendor';

interface AddWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<WorkerItem>) => Promise<void>;
  workerToEdit?: WorkerItem | null;
}

export const AddWorkerModal: React.FC<AddWorkerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  workerToEdit,
}) => {
  const [name, setName] = useState('');
  const [trade, setTrade] = useState<string>('Mason');
  const [contactPhone, setContactPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [dailyRate, setDailyRate] = useState<string | number>('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [specialSkills, setSpecialSkills] = useState('');
  const [status, setStatus] = useState<WorkerStatus>('Active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (workerToEdit) {
      setName(workerToEdit.name || '');
      setTrade(workerToEdit.trade || 'Mason');
      setContactPhone(workerToEdit.contactPhone || '');
      setAlternatePhone(workerToEdit.alternatePhone || '');
      setContactEmail(workerToEdit.contactEmail || '');
      setDailyRate(workerToEdit.dailyRate !== undefined ? workerToEdit.dailyRate : '');
      setPermanentAddress(workerToEdit.permanentAddress || '');
      setCity(workerToEdit.city || '');
      setState(workerToEdit.state || '');
      setPincode(workerToEdit.pincode || '');
      setSpecialSkills(workerToEdit.specialSkills && workerToEdit.specialSkills !== '-' ? workerToEdit.specialSkills : '');
      setStatus(workerToEdit.status || 'Active');
    } else {
      setName('');
      setTrade('Mason');
      setContactPhone('');
      setAlternatePhone('');
      setContactEmail('');
      setDailyRate('');
      setPermanentAddress('');
      setCity('');
      setState('');
      setPincode('');
      setSpecialSkills('');
      setStatus('Active');
    }
  }, [workerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contactPhone.trim()) {
      alert('Worker Full Name and Mobile Number are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const derivedLocation =
        [city.trim(), state.trim()].filter(Boolean).join(', ') ||
        permanentAddress.trim() ||
        '';

      await onSubmit({
        name: name.trim(),
        trade,
        contactPhone: contactPhone.trim(),
        alternatePhone: alternatePhone.trim(),
        contactEmail: contactEmail.trim(),
        dailyRate: Number(dailyRate) || 0,
        permanentAddress: permanentAddress.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        location: derivedLocation,
        specialSkills: specialSkills.trim() || '-',
        status,
      });
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save worker profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#121316] border-2 border-[#F3C048] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header matching Screenshot 2 */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-white/5">
          <h2 className="text-xl font-bold text-white tracking-tight">
            {workerToEdit ? 'Edit Worker Profile' : 'Register Skilled Worker'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body matching Screenshot 2 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-3.5 custom-scrollbar">
          {/* Row 1: WORKER FULL NAME & TRADE / TYPE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                WORKER FULL NAME *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#18191E] border border-[#26282E] rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-[#F3C048] transition-colors"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                TRADE / TYPE *
              </label>
              <select
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#18191E] border border-[#26282E] rounded-lg text-white focus:outline-none focus:border-[#F3C048] transition-colors cursor-pointer"
              >
                <option value="Mason">Mason</option>
                <option value="Carpenter">Carpenter</option>
                <option value="Plumber">Plumber</option>
                <option value="Electrician">Electrician</option>
                <option value="Painter">Painter</option>
                <option value="Welder">Welder</option>
                <option value="Bar Bender">Bar Bender</option>
                <option value="Tile Fitter">Tile Fitter</option>
                <option value="Helper">Helper</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Row 2: MOBILE NUMBER & ALTERNATE MOBILE (OPTIONAL) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                MOBILE NUMBER *
              </label>
              <input
                type="text"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#18191E] border border-[#26282E] rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-[#F3C048] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                ALTERNATE MOBILE (OPTIONAL)
              </label>
              <input
                type="text"
                value={alternatePhone}
                onChange={(e) => setAlternatePhone(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#18191E] border border-[#26282E] rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-[#F3C048] transition-colors"
              />
            </div>
          </div>

          {/* Row 3: EMAIL ADDRESS (OPTIONAL) & DAILY WAGE / RATE (₹) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                EMAIL ADDRESS (OPTIONAL)
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#18191E] border border-[#26282E] rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-[#F3C048] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                DAILY WAGE / RATE (₹)
              </label>
              <input
                type="number"
                min="0"
                value={dailyRate}
                onChange={(e) => setDailyRate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#18191E] border border-[#26282E] rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-[#F3C048] transition-colors"
              />
            </div>
          </div>

          {/* Row 4: PERMANENT ADDRESS */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              PERMANENT ADDRESS
            </label>
            <input
              type="text"
              value={permanentAddress}
              onChange={(e) => setPermanentAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#18191E] border border-[#26282E] rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-[#F3C048] transition-colors"
            />
          </div>

          {/* Row 5: CITY, STATE, PINCODE */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                CITY
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#18191E] border border-[#26282E] rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-[#F3C048] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                STATE
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#18191E] border border-[#26282E] rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-[#F3C048] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                PINCODE
              </label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#18191E] border border-[#26282E] rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-[#F3C048] transition-colors"
              />
            </div>
          </div>

          {/* Row 6: SPECIAL SKILLS / EXPERIENCE DETAILS */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              SPECIAL SKILLS / EXPERIENCE DETAILS
            </label>
            <textarea
              rows={3}
              value={specialSkills}
              onChange={(e) => setSpecialSkills(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#18191E] border border-[#26282E] rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-[#F3C048] transition-colors resize-none"
            />
          </div>

          {/* Bottom Action matching Screenshot 2 */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#F3C048] hover:bg-[#E5B23A] active:bg-[#D4A32F] text-black font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 fill-black text-black" />
              <span>{isSubmitting ? 'Saving...' : workerToEdit ? 'Save Changes' : 'Save Worker Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AddWorkerModal;
