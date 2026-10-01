import React, { useState, useEffect } from 'react';
import {
  X,
  Briefcase,
  User,
  Building,
  FileText,
  Trash2,
  Plus,
  Save,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { ClientRecord } from '../../types';
import leadService from '../../services/lead.service';

interface ClientEditModalProps {
  isOpen: boolean;
  client: ClientRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ClientEditModal: React.FC<ClientEditModalProps> = ({
  isOpen,
  client,
  onClose,
  onSuccess,
}) => {
  // Project & Site Details
  const [siteLocation, setSiteLocation] = useState('');
  const [propertyType, setPropertyType] = useState('Residential');
  const [propertySubtype, setPropertySubtype] = useState('House');
  const [totalArea, setTotalArea] = useState('');
  const [buildup, setBuildup] = useState('');
  const [dimensional, setDimensional] = useState('');
  const [facing, setFacing] = useState('East');
  const [level, setLevel] = useState('');
  const [requirement, setRequirement] = useState('');
  const [projectCost, setProjectCost] = useState<number | string>('');
  const [projectDuration, setProjectDuration] = useState('');
  const [meetingDate, setMeetingDate] = useState('');

  // Client Details
  const [clientName, setClientName] = useState('');
  const [mobile1, setMobile1] = useState('');
  const [mobile2, setMobile2] = useState('');
  const [gender, setGender] = useState('Male');
  const [email, setEmail] = useState('');
  const [personalAddress, setPersonalAddress] = useState('');

  // Services Details
  const [servicesList, setServicesList] = useState<Array<{ name: string; total: number; paid: number }>>([]);
  const [newServiceName, setNewServiceName] = useState('');

  // Meta Details
  const [regDate, setRegDate] = useState('');
  const [priority, setPriority] = useState('High');
  const [referenceSource, setReferenceSource] = useState('Social Media: Facebook');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && client) {
      setSiteLocation(client.siteLocation || '');
      setPropertyType(client.propertyType || 'Residential');
      setPropertySubtype(client.propertySubtype || 'House');
      setTotalArea(client.area || '');
      setBuildup(client.buildupArea || '');
      setDimensional(client.dimensional || '');
      setFacing(client.facing || 'East');
      setLevel(client.level || '');
      setRequirement(client.requirementType || '');
      setProjectCost(client.agreedAmount || '');
      setProjectDuration(client.projectDuration || '');
      setMeetingDate(client.meetingDate || '');

      setClientName(client.name || '');
      setMobile1(client.phone || '');
      setMobile2(client.secondaryPhone || '');
      setGender(client.gender || 'Male');
      setEmail(client.email || '');
      setPersonalAddress(client.address || client.siteLocation || '');

      // Parse services
      if (client.servicesList && client.servicesList.length > 0) {
        setServicesList(client.servicesList);
      } else if (client.services) {
        const list = client.services.split(',').map((s) => ({
          name: s.trim(),
          total: client.agreedAmount || 0,
          paid: client.paidAmount || 0,
        }));
        setServicesList(list);
      } else {
        setServicesList([{ name: 'Floor Plan Design', total: 0, paid: 0 }]);
      }

      // Reg date
      if (client.registrationDate) {
        const d = new Date(client.registrationDate);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        setRegDate(`${yyyy}-${mm}-${dd}`);
      } else {
        setRegDate('');
      }

      setPriority(client.priority || 'High');
      setReferenceSource(client.associate || client.referenceSource || 'Social Media: Facebook');
      setError('');
    }
  }, [isOpen, client]);

  if (!isOpen || !client) return null;

  const handleRemoveService = (indexToRemove: number) => {
    setServicesList(servicesList.filter((_, i) => i !== indexToRemove));
  };

  const handleAddService = () => {
    if (!newServiceName.trim()) return;
    setServicesList([...servicesList, { name: newServiceName.trim(), total: 0, paid: 0 }]);
    setNewServiceName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      setError('Client Name is required.');
      return;
    }
    if (!mobile1.trim()) {
      setError('Mobile 1 is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const combinedServices = servicesList.map((s) => s.name).join(', ');
      await leadService.updateClient(client._id, {
        name: clientName.trim(),
        phone: mobile1.trim(),
        secondaryPhone: mobile2.trim(),
        email: email.trim(),
        address: personalAddress.trim(),
        siteLocation: siteLocation.trim(),
        propertyType,
        propertySubtype,
        area: totalArea.trim(),
        buildupArea: buildup.trim(),
        dimensional: dimensional.trim(),
        facing,
        level: level.trim(),
        requirementType: requirement.trim(),
        agreedAmount: Number(projectCost) || 0,
        projectDuration: projectDuration.trim(),
        meetingDate,
        gender,
        services: combinedServices,
        servicesList,
        priority,
        referenceSource,
        registrationDate: regDate || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update client');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#14161D] border border-amber-500/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Header (Matches Screenshot 4) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#202532] bg-[#14161D]">
          <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
            Edit Client [ {client.clientCode} ]
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar text-xs">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* SECTION 1: PROJECT & SITE DETAILS (Matches Screenshot 4) */}
          <div className="bg-[#181B24] border border-[#232938] rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
              <Building className="w-4 h-4" />
              <span>PROJECT & SITE DETAILS</span>
            </div>

            {/* Row 1: Site Location & Property Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="block text-[10px] font-semibold text-slate-300">
                  Site Location <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={siteLocation}
                  onChange={(e) => setSiteLocation(e.target.value)}
                  className="w-full bg-[#10141D] border border-[#2B3346] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-300">
                  Property Type
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full bg-[#10141D] border border-[#2B3346] rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                  <input
                    type="text"
                    value={propertySubtype}
                    onChange={(e) => setPropertySubtype(e.target.value)}
                    placeholder="House"
                    className="w-full bg-[#10141D] border border-[#2B3346] rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: 6 Grid Fields (Total Area, Buildup, Dimensional, Facing, Level, Requirement) */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-300">Total Area</label>
                <input
                  type="text"
                  placeholder="sqft"
                  value={totalArea}
                  onChange={(e) => setTotalArea(e.target.value)}
                  className="w-full bg-[#10141D] border border-[#2B3346] rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-300">Buildup</label>
                <input
                  type="text"
                  placeholder="dummy"
                  value={buildup}
                  onChange={(e) => setBuildup(e.target.value)}
                  className="w-full bg-[#10141D] border border-[#2B3346] rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-300">Dimensional</label>
                <input
                  type="text"
                  placeholder="dummy"
                  value={dimensional}
                  onChange={(e) => setDimensional(e.target.value)}
                  className="w-full bg-[#10141D] border border-[#2B3346] rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-300">Facing</label>
                <select
                  value={facing}
                  onChange={(e) => setFacing(e.target.value)}
                  className="w-full bg-[#10141D] border border-[#2B3346] rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="East">East</option>
                  <option value="West">West</option>
                  <option value="North">North</option>
                  <option value="South">South</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-300">Level</label>
                <input
                  type="text"
                  placeholder="dummy"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full bg-[#10141D] border border-[#2B3346] rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-300">Requirement</label>
                <input
                  type="text"
                  placeholder="Type"
                  value={requirement}
                  onChange={(e) => setRequirement(e.target.value)}
                  className="w-full bg-[#10141D] border border-[#2B3346] rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Row 3: Project Cost *, Project Duration, Meeting Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-300">
                  Project Cost <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  value={projectCost}
                  onChange={(e) => setProjectCost(e.target.value)}
                  placeholder="0"
                  className="w-full bg-[#10141D] border border-[#2B3346] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-300">
                  Project Duration
                </label>
                <input
                  type="text"
                  value={projectDuration}
                  onChange={(e) => setProjectDuration(e.target.value)}
                  placeholder="e.g. 6 Months"
                  className="w-full bg-[#10141D] border border-[#2B3346] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-300">
                  Meeting Date
                </label>
                <input
                  type="text"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  placeholder="30-09-2026 12:26 PM"
                  className="w-full bg-[#10141D] border border-[#2B3346] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: CLIENT DETAILS (Matches Screenshot 4) */}
          <div className="bg-[#181B24] border border-[#232938] rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
              <User className="w-4 h-4" />
              <span>CLIENT DETAILS</span>
            </div>

            {/* Client Name * */}
            <div className="space-y-1">
              <label className="block text-[10px] font-semibold text-slate-300">
                Client Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-[#10141D] border border-[#2B3346] rounded-lg px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            {/* Mobile 1 * & Mobile 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-300">
                  Mobile 1 <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={mobile1}
                  onChange={(e) => setMobile1(e.target.value)}
                  className="w-full bg-[#10141D] border border-[#2B3346] rounded-lg px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-300">Mobile 2</label>
                <input
                  type="text"
                  value={mobile2}
                  onChange={(e) => setMobile2(e.target.value)}
                  className="w-full bg-[#10141D] border border-[#2B3346] rounded-lg px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Gender & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-300">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-[#10141D] border border-[#2B3346] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-300">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Dummy@dummy.com"
                  className="w-full bg-[#10141D] border border-[#2B3346] rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Personal Address */}
            <div className="space-y-1">
              <label className="block text-[10px] font-semibold text-slate-300">
                Personal Address
              </label>
              <input
                type="text"
                value={personalAddress}
                onChange={(e) => setPersonalAddress(e.target.value)}
                className="w-full bg-[#10141D] border border-[#2B3346] rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* SECTION 3: SERVICES DETAILS (Matches Screenshot 4) */}
          <div className="bg-[#181B24] border border-[#232938] rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                <Briefcase className="w-4 h-4" />
                <span>SERVICES DETAILS</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add another service..."
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="bg-[#10141D] border border-[#2B3346] rounded px-2.5 py-1 text-[11px] text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddService}
                  className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded text-[10.5px] font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Services Cards List with Red Remove Button */}
            <div className="space-y-2">
              {servicesList.map((srv, index) => (
                <div
                  key={index}
                  className="p-3 bg-[#13161F] border border-[#262F42] rounded-xl flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-white block">{srv.name}</span>
                    <span className="text-[10.5px] text-slate-400 font-mono">
                      Total: ₹{srv.total?.toLocaleString() || 0} | Paid: ₹{srv.paid?.toLocaleString() || 0}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveService(index)}
                    className="flex items-center gap-1 px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: META DETAILS (Matches Screenshot 4) */}
          <div className="bg-[#181B24] border border-[#232938] rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
              <FileText className="w-4 h-4" />
              <span>META DETAILS</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Reg. Date */}
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-300">Reg. Date</label>
                <input
                  type="date"
                  value={regDate}
                  onChange={(e) => setRegDate(e.target.value)}
                  className="w-full bg-[#10141D] border border-[#2B3346] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-300">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-[#10141D] border border-[#2B3346] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="High">🔥 High</option>
                  <option value="Urgent">🚨 Urgent</option>
                  <option value="Normal">Normal</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {/* Reference / Source */}
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-300">
                  Reference / Source
                </label>
                <input
                  type="text"
                  value={referenceSource}
                  onChange={(e) => setReferenceSource(e.target.value)}
                  placeholder="Social Media: Facebook"
                  className="w-full bg-[#10141D] border border-[#2B3346] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons at bottom */}
          <div className="flex justify-end items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-[#202532] hover:bg-[#2A3142] text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer border border-[#2D3548]"
            >
              Close
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
