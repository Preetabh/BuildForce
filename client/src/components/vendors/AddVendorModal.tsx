import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save } from 'lucide-react';
import { VendorItem, VendorType, VendorStatus } from '../../types/vendor';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface AddVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<VendorItem>) => Promise<void>;
  vendorToEdit?: VendorItem | null;
}

export const AddVendorModal: React.FC<AddVendorModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  vendorToEdit,
}) => {
  useEscapeKey(onClose, isOpen);

  const [name, setName] = useState('');
  const [type, setType] = useState<VendorType>('Material');
  const [contactPhone, setContactPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [supplies, setSupplies] = useState('');
  const [deliveryAvailable, setDeliveryAvailable] = useState<boolean>(true);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<VendorStatus>('Active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (vendorToEdit) {
      setName(vendorToEdit.name || '');
      setType(vendorToEdit.type || 'Material');
      setContactPhone(vendorToEdit.contactPhone || '');
      setAlternatePhone(vendorToEdit.alternatePhone || '');
      setContactEmail(vendorToEdit.contactEmail || '');
      setGstNumber(vendorToEdit.gstNumber && vendorToEdit.gstNumber !== 'N/A' ? vendorToEdit.gstNumber : '');
      setFullAddress(vendorToEdit.fullAddress || '');
      setCity(vendorToEdit.city || '');
      setState(vendorToEdit.state || '');
      setPincode(vendorToEdit.pincode || '');
      setSupplies(vendorToEdit.supplies || '');
      setDeliveryAvailable(vendorToEdit.deliveryAvailable ?? true);
      setNotes(vendorToEdit.notes || '');
      setStatus(vendorToEdit.status || 'Active');
    } else {
      setName('');
      setType('Material');
      setContactPhone('');
      setAlternatePhone('');
      setContactEmail('');
      setGstNumber('');
      setFullAddress('');
      setCity('');
      setState('');
      setPincode('');
      setSupplies('');
      setDeliveryAvailable(true);
      setNotes('');
      setStatus('Active');
    }
  }, [vendorToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contactPhone.trim()) {
      alert('Vendor Name and Mobile Number are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Derive display location
      const derivedLocation =
        [city.trim(), state.trim()].filter(Boolean).join(', ') ||
        fullAddress.trim() ||
        '';

      await onSubmit({
        name: name.trim(),
        type,
        contactPhone: contactPhone.trim(),
        alternatePhone: alternatePhone.trim(),
        contactEmail: contactEmail.trim(),
        gstNumber: gstNumber.trim() || 'N/A',
        fullAddress: fullAddress.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        location: derivedLocation,
        supplies: supplies.trim(),
        deliveryAvailable,
        notes: notes.trim(),
        status,
      });
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save vendor profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#121316] border-2 border-[#F3C048]/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header matching Screenshot 1 */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-white/5">
          <h2 className="text-xl font-bold text-white tracking-tight">
            {vendorToEdit ? 'Edit Vendor Profile' : 'Register New Vendor'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body matching Screenshot 1 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-3.5 custom-scrollbar">
          {/* Row 1: VENDOR NAME / ENTITY & VENDOR TYPE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                VENDOR NAME / ENTITY *
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
                VENDOR TYPE *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as VendorType)}
                className="w-full px-3 py-2 text-xs bg-[#18191E] border border-[#26282E] rounded-lg text-white focus:outline-none focus:border-[#F3C048] transition-colors cursor-pointer"
              >
                <option value="Material">Material</option>
                <option value="Service">Service</option>
                <option value="Equipment">Equipment</option>
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

          {/* Row 3: EMAIL ADDRESS (OPTIONAL) & GST NUMBER (OPTIONAL) */}
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
                GST NUMBER (OPTIONAL)
              </label>
              <input
                type="text"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#18191E] border border-[#26282E] rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-[#F3C048] transition-colors"
              />
            </div>
          </div>

          {/* Row 4: FULL ADDRESS */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              FULL ADDRESS
            </label>
            <input
              type="text"
              value={fullAddress}
              onChange={(e) => setFullAddress(e.target.value)}
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

          {/* Row 6: SUPPLIES / ITEMS & DELIVERY AVAILABLE? */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                SUPPLIES / ITEMS (CEMENT, STEEL, ETC.)
              </label>
              <textarea
                rows={2}
                value={supplies}
                onChange={(e) => setSupplies(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#18191E] border border-[#26282E] rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-[#F3C048] transition-colors resize-none"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                DELIVERY AVAILABLE?
              </label>
              <select
                value={deliveryAvailable ? 'Yes' : 'No'}
                onChange={(e) => setDeliveryAvailable(e.target.value === 'Yes')}
                className="w-full px-3 py-2 text-xs bg-[#18191E] border border-[#26282E] rounded-lg text-white focus:outline-none focus:border-[#F3C048] transition-colors cursor-pointer"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>

          {/* Row 7: INTERNAL NOTES / REMARKS */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              INTERNAL NOTES / REMARKS
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              <span>{isSubmitting ? 'Saving...' : vendorToEdit ? 'Save Changes' : 'Save Vendor Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AddVendorModal;
