import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  User,
  HardHat,
  Scroll,
  FileCheck,
  Plus,
  Trash2,
  Rocket,
  ChevronDown,
} from 'lucide-react';
import { LeadItem } from '../../types';
import leadService from '../../services/lead.service';
import catalogService from '../../services/catalog.service';

interface RegisterClientModalProps {
  isOpen: boolean;
  lead: LeadItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface ServiceSelection {
  id: string;
  service: string;
  specificItems: string[];
}

const SPECIFIC_ITEMS_MAP: Record<string, string[]> = {
  'Construction Furnished': [
    'Complete Structure',
    'Flooring & Tiling',
    'Modular Kitchen',
    'Electrical & Plumbing',
    'Woodwork & Wardrobes',
    'Sanitary Fittings',
    'Painting & Finishing',
    'False Ceiling',
    'Exterior Elevation',
  ],
  'Construction Bare Shell': [
    'Excavation & Footing',
    'RCC Column & Slab',
    'Brickwork Masonry',
    'Internal/External Plaster',
    'Roof Waterproofing',
    'Boundary Wall & Gate',
  ],
  'Interior Designing': [
    'Living Room Decor',
    'Modular Kitchen & Appliances',
    'Wardrobes & Cabinets',
    'False Ceiling & Lighting',
    'Wall Paneling & Wallpaper',
    'Flooring & Carpets',
    'Curtains & Window Treatments',
  ],
  'Architectural Drawing': [
    '2D Floor Plans & Space Planning',
    '3D Elevation Design',
    'Structural Engineering Drawings',
    'MEP (Plumbing & Electrical) Layouts',
    'Municipal Sanction Map',
  ],
  'Renovation & Remodeling': [
    'Bathroom Overhaul',
    'Kitchen Renovation',
    'Flooring Replacement',
    'Waterproofing Repair',
    'Repainting & Wall Treatment',
  ],
  'Turnkey Contracting': [
    'Complete End-to-End Execution',
    'Material Procurement & Supply',
    'Site Supervision & QA',
    'Final Handover & Cleaning',
  ],
};

export const RegisterClientModal: React.FC<RegisterClientModalProps> = ({
  isOpen,
  lead,
  onClose,
  onSuccess,
}) => {
  const [dynamicServices, setDynamicServices] = useState<string[]>([]);

  // Client Details
  const [clientName, setClientName] = useState('');
  const [mobile1, setMobile1] = useState('');
  const [mobile2, setMobile2] = useState('');
  const [gender, setGender] = useState('Male');
  const [email, setEmail] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');

  // Project & Site Details
  const [siteLocation, setSiteLocation] = useState('');
  const [propertyType, setPropertyType] = useState('-Select-');
  const [propertyTypeDetail, setPropertyTypeDetail] = useState('');
  const [totalArea, setTotalArea] = useState('');
  const [buildup, setBuildup] = useState('');
  const [dimensional, setDimensional] = useState('');
  const [facing, setFacing] = useState('-F-');
  const [level, setLevel] = useState('');
  const [requirement, setRequirement] = useState('');
  const [projectCost, setProjectCost] = useState('');
  const [projectDuration, setProjectDuration] = useState('');
  const [meetingDate, setMeetingDate] = useState('');

  // Services
  const [servicesList, setServicesList] = useState<ServiceSelection[]>([]);

  // Metadata & Finances
  const [priority, setPriority] = useState<'Normal' | 'High' | 'Urgent' | 'Low'>('High');
  const [reference, setReference] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (lead) {
      setClientName(lead.clientName || '');
      setMobile1(lead.mobile1 || '');
      setMobile2(lead.mobile2 || '');
      setGender(lead.gender || 'Male');
      setEmail(lead.email || '');
      setPermanentAddress(lead.permanentAddress || '');

      setSiteLocation(lead.siteLocation || '');
      setPropertyType(lead.propertyType || '-Select-');
      setPropertyTypeDetail(lead.propertyTypeDetail || '');
      setTotalArea(lead.landArea || '');
      setBuildup(lead.buildupArea || '');
      setDimensional(lead.dimensional || '');
      setFacing(lead.facing || '-F-');
      setLevel(lead.level || '');
      setRequirement(lead.requirementType || (lead.requirements?.[0] || ''));
      setProjectCost(lead.finances?.budget ? String(lead.finances.budget) : '');
      setProjectDuration(lead.projectDuration || '');
      
      if (lead.meetingDateTime) {
        try {
          const d = new Date(lead.meetingDateTime);
          const isoStr = d.toISOString().slice(0, 16);
          setMeetingDate(isoStr);
        } catch {
          setMeetingDate('');
        }
      } else {
        setMeetingDate('');
      }

      // Initialize Services
      if (lead.serviceItems && lead.serviceItems.length > 0) {
        setServicesList(
          lead.serviceItems.map((item, idx) => ({
            id: `srv-${idx}-${Date.now()}`,
            service: item.service || '',
            specificItems: item.specificItems || [],
          }))
        );
      } else if (lead.requirements && lead.requirements.length > 0) {
        setServicesList(
          lead.requirements.map((req, idx) => ({
            id: `srv-${idx}-${Date.now()}`,
            service: req || '',
            specificItems: [],
          }))
        );
      } else {
        setServicesList([
          {
            id: `srv-0-${Date.now()}`,
            service: '',
            specificItems: [],
          },
        ]);
      }

      setPriority((lead.priority as any) || 'High');

      // Reference format display
      let refText = 'Direct';
      if (lead.referenceType === 'Social Media') {
        refText = `Social Media: ${lead.referenceDetails?.channel || 'Facebook'}`;
      } else if (lead.referenceType === 'Associate') {
        refText = `Associate: ${lead.referenceDetails?.partnerName || 'Partner'}`;
      } else if (lead.referenceType === 'Employee') {
        refText = `Employee: ${lead.referenceDetails?.employeeName || 'Staff'}`;
      } else if (lead.referenceType) {
        refText = lead.referenceType;
      }
      setReference(refText);
    }
  }, [lead, isOpen]);

  useEffect(() => {
    if (isOpen) {
      catalogService.getActiveServices().then((data) => {
        const activeList = (data || []).filter((s) => s.isActive).map((s) => s.name);
        setDynamicServices(activeList);
        // Exclude deactivated services from current selections
        setServicesList((prev) =>
          prev.map((s) => (s.service && !activeList.includes(s.service) ? { ...s, service: '' } : s))
        );
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen || !lead) return null;

  const formattedLeadDate = lead.leadDate
    ? new Date(lead.leadDate).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const handleAddService = () => {
    const nextServiceKey = dynamicServices[servicesList.length % (dynamicServices.length || 1)] || dynamicServices[0] || '';
    setServicesList((prev) => [
      ...prev,
      {
        id: `srv-${Date.now()}`,
        service: nextServiceKey,
        specificItems: [],
      },
    ]);
  };

  const handleRemoveService = (id: string) => {
    setServicesList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleServiceChange = (id: string, newService: string) => {
    setServicesList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, service: newService, specificItems: [] } : item
      )
    );
  };

  const handleToggleSpecificItem = (id: string, itemValue: string) => {
    setServicesList((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const exists = s.specificItems.includes(itemValue);
        const updated = exists
          ? s.specificItems.filter((i) => i !== itemValue)
          : [...s.specificItems, itemValue];
        return { ...s, specificItems: updated };
      })
    );
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !mobile1.trim() || !siteLocation.trim()) {
      setError('Please fill required fields (Client Name, Mobile 1, Site Location).');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        clientName: clientName.trim(),
        mobile1: mobile1.trim(),
        mobile2: mobile2.trim(),
        gender,
        email: email.trim(),
        permanentAddress: permanentAddress.trim(),
        siteLocation: siteLocation.trim(),
        propertyType: propertyType === '-Select-' ? 'Residential' : propertyType,
        propertyTypeDetail: propertyTypeDetail.trim(),
        landArea: totalArea.trim(),
        buildupArea: buildup.trim(),
        dimensional: dimensional.trim(),
        facing: facing === '-F-' ? '' : facing,
        level: level.trim(),
        requirementType: requirement.trim(),
        projectCost: Number(projectCost) || 0,
        agreedAmount: Number(projectCost) || 0,
        projectDuration: projectDuration.trim(),
        meetingDateTime: meetingDate ? new Date(meetingDate) : undefined,
        serviceItems: servicesList.map((s) => ({
          service: s.service,
          specificItems: s.specificItems,
        })),
        priority,
        notes: `Converted to registered client from Lead ${lead.leadCode}`,
      };

      await leadService.convertToClient(lead._id, payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to complete client registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-[#121316] border border-[#26272e] rounded-2xl w-full max-w-4xl text-slate-200 shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-[#22242c] flex items-center justify-between bg-[#15161b] flex-shrink-0">
          <div className="flex items-center gap-3.5 flex-wrap">
            <h2 className="font-bold text-white text-base sm:text-lg tracking-wide">
              Client Registration [ {lead.leadCode} ]
            </h2>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#221c10] border border-[#784d0b] text-[#f59e0b] text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5 text-[#f59e0b]" />
              <span>Lead Date:</span>
              <span className="font-mono text-[#fbbf24]">{formattedLeadDate}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#23252e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleCompleteRegistration} className="p-4 sm:p-5 overflow-y-auto space-y-4 custom-scrollbar flex-1">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-200 text-xs">
              {error}
            </div>
          )}

          {/* Section 1: CLIENT DETAILS */}
          <div className="bg-[#18191e] border border-[#26272e] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-[#e5a919]" />
              <span className="text-[#e5a919] font-bold text-xs uppercase tracking-wider">
                CLIENT DETAILS
              </span>
            </div>

            <div className="space-y-3">
              {/* Row 1: Name, Mobile 1, Mobile 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Client Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Varsha Trivedi"
                    className="w-full bg-[#101114] border border-[#2b2c35] focus:border-[#e5a919] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Mobile 1 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={mobile1}
                    onChange={(e) => setMobile1(e.target.value)}
                    placeholder="75708 13738"
                    className="w-full bg-[#101114] border border-[#2b2c35] focus:border-[#e5a919] rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Mobile 2
                  </label>
                  <input
                    type="tel"
                    value={mobile2}
                    onChange={(e) => setMobile2(e.target.value)}
                    placeholder="Secondary No"
                    className="w-full bg-[#101114] border border-[#2b2c35] focus:border-[#e5a919] rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Row 2: Gender, Email */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Gender
                  </label>
                  <div className="relative">
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-[#101114] border border-[#2b2c35] focus:border-[#e5a919] rounded-lg px-3 py-2 text-xs text-white focus:outline-none appearance-none cursor-pointer transition-colors pr-8"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full bg-[#101114] border border-[#2b2c35] focus:border-[#e5a919] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Row 3: Permanent Address */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Permanent Address
                </label>
                <input
                  type="text"
                  value={permanentAddress}
                  onChange={(e) => setPermanentAddress(e.target.value)}
                  placeholder="Full Residential Address"
                  className="w-full bg-[#101114] border border-[#2b2c35] focus:border-[#e5a919] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 2: PROJECT & SITE DETAILS */}
          <div className="bg-[#18191e] border border-[#26272e] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <HardHat className="w-4 h-4 text-[#e5a919]" />
              <span className="text-[#e5a919] font-bold text-xs uppercase tracking-wider">
                PROJECT & SITE DETAILS
              </span>
            </div>

            <div className="space-y-3">
              {/* Row 1: Site Location, Property Type */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-7">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Site Location <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={siteLocation}
                    onChange={(e) => setSiteLocation(e.target.value)}
                    placeholder="Barabanki"
                    className="w-full bg-[#101114] border border-[#2b2c35] focus:border-[#e5a919] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
                <div className="md:col-span-5">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Property Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <select
                        value={propertyType}
                        onChange={(e) => setPropertyType(e.target.value)}
                        className="w-full bg-[#101114] border border-[#2b2c35] focus:border-[#e5a919] rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none appearance-none cursor-pointer transition-colors pr-7"
                      >
                        <option value="-Select-">-Select-</option>
                        <option value="Residential">Residential</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Industrial">Industrial</option>
                        <option value="Plot">Plot / Land</option>
                        <option value="Agricultural">Agricultural</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
                    </div>
                    <input
                      type="text"
                      value={propertyTypeDetail}
                      onChange={(e) => setPropertyTypeDetail(e.target.value)}
                      placeholder="Detail (Flat/Shop)"
                      className="w-full bg-[#101114] border border-[#2b2c35] focus:border-[#e5a919] rounded-lg px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Total Area, Buildup, Dimensional, Facing, Level, Requirement */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Total Area
                  </label>
                  <input
                    type="text"
                    value={totalArea}
                    onChange={(e) => setTotalArea(e.target.value)}
                    placeholder="2000"
                    className="w-full bg-[#101114] border border-[#2b2c35] focus:border-[#e5a919] rounded-lg px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Buildup
                  </label>
                  <input
                    type="text"
                    value={buildup}
                    onChange={(e) => setBuildup(e.target.value)}
                    placeholder="L x W"
                    className="w-full bg-[#101114] border border-[#2b2c35] focus:border-[#e5a919] rounded-lg px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Dimensional
                  </label>
                  <input
                    type="text"
                    value={dimensional}
                    onChange={(e) => setDimensional(e.target.value)}
                    placeholder="L x W"
                    className="w-full bg-[#101114] border border-[#2b2c35] focus:border-[#e5a919] rounded-lg px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Facing
                  </label>
                  <div className="relative">
                    <select
                      value={facing}
                      onChange={(e) => setFacing(e.target.value)}
                      className="w-full bg-[#101114] border border-[#2b2c35] focus:border-[#e5a919] rounded-lg px-2 py-2 text-xs text-white focus:outline-none appearance-none cursor-pointer transition-colors pr-6"
                    >
                      <option value="-F-">-F-</option>
                      <option value="East">East</option>
                      <option value="West">West</option>
                      <option value="North">North</option>
                      <option value="South">South</option>
                      <option value="North-East">North-East</option>
                      <option value="North-West">North-West</option>
                      <option value="South-East">South-East</option>
                      <option value="South-West">South-West</option>
                    </select>
                    <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-2.5 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Level
                  </label>
                  <input
                    type="text"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    placeholder="e.g. G+1"
                    className="w-full bg-[#101114] border border-[#2b2c35] focus:border-[#e5a919] rounded-lg px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Requirement
                  </label>
                  <input
                    type="text"
                    value={requirement}
                    onChange={(e) => setRequirement(e.target.value)}
                    placeholder="Type"
                    className="w-full bg-[#101114] border border-[#2b2c35] focus:border-[#e5a919] rounded-lg px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Row 3: Project Cost, Project Duration, Meeting Date */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Project Cost <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={projectCost}
                    onChange={(e) => setProjectCost(e.target.value)}
                    placeholder="Total Project Value"
                    className="w-full bg-[#101114] border border-[#2b2c35] focus:border-[#e5a919] rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Project Duration
                  </label>
                  <input
                    type="text"
                    value={projectDuration}
                    onChange={(e) => setProjectDuration(e.target.value)}
                    placeholder="e.g. 6 Months"
                    className="w-full bg-[#101114] border border-[#2b2c35] focus:border-[#e5a919] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Meeting Date
                  </label>
                  <input
                    type="datetime-local"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full bg-[#101114] border border-[#2b2c35] focus:border-[#e5a919] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: SERVICES */}
          <div className="bg-[#18191e] border border-[#26272e] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Scroll className="w-4 h-4 text-[#e5a919]" />
                <span className="text-[#e5a919] font-bold text-xs uppercase tracking-wider">
                  SERVICES
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddService}
                className="bg-[#e5a919] hover:bg-[#d49713] text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/15"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add Services</span>
              </button>
            </div>

            {/* List of dynamic service cards */}
            <div className="space-y-3">
              {servicesList.map((srv, index) => {
                const availableSpecificItems = SPECIFIC_ITEMS_MAP[srv.service] || [];
                return (
                  <div
                    key={srv.id}
                    className="border-l-4 border-[#e5a919] bg-[#111215] border border-[#282a32] rounded-xl p-3.5 relative shadow-inner"
                  >
                    {/* Header line inside card */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#e5a919] font-bold text-xs tracking-wide">
                        {index + 1}. SELECT SERVICES
                      </span>
                      {servicesList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveService(srv.id)}
                          className="w-5 h-5 rounded-full bg-red-950/70 border border-red-500/40 text-red-400 hover:bg-red-900 hover:text-white flex items-center justify-center transition-colors"
                          title="Remove service"
                        >
                          <X className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      )}
                    </div>

                    {/* Main Service Dropdown */}
                    <div className="relative mb-3">
                      <select
                        value={srv.service}
                        onChange={(e) => handleServiceChange(srv.id, e.target.value)}
                        className="w-full bg-[#15161b] border border-[#2e303b] focus:border-[#e5a919] rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none appearance-none cursor-pointer transition-colors pr-8"
                      >
                        <option value="">-Select Service-</option>
                        {dynamicServices.map((srvOption) => (
                          <option key={srvOption} value={srvOption}>
                            {srvOption}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                    </div>

                    {/* Dashed line */}
                    <div className="border-t border-dashed border-[#282a33] my-2.5"></div>

                    {/* Specific Items Picker */}
                    <div>
                      <label className="block text-[10.5px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                        SELECT SPECIFIC ITEMS
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {availableSpecificItems.map((item) => {
                          const isSelected = srv.specificItems.includes(item);
                          return (
                            <button
                              type="button"
                              key={item}
                              onClick={() => handleToggleSpecificItem(srv.id, item)}
                              className={`text-[10px] sm:text-[11px] px-2.5 py-1 rounded-md border transition-all text-left ${
                                isSelected
                                  ? 'bg-[#e5a919]/20 text-[#fbbf24] border-[#e5a919]/50 font-semibold shadow-sm'
                                  : 'bg-[#15161b] text-slate-400 border-[#2a2c36] hover:text-slate-200 hover:bg-[#1a1c22]'
                              }`}
                            >
                              {item} {isSelected ? '✓' : '+'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: METADATA & FINANCES */}
          <div className="bg-[#18191e] border border-[#26272e] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileCheck className="w-4 h-4 text-[#e5a919]" />
              <span className="text-[#e5a919] font-bold text-xs uppercase tracking-wider">
                METADATA & FINANCES
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Priority
                </label>
                <div className="relative">
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-[#101114] border border-[#2b2c35] focus:border-[#e5a919] rounded-lg px-3 py-2 text-xs text-white focus:outline-none appearance-none cursor-pointer transition-colors pr-8"
                  >
                    <option value="High">🔥 High</option>
                    <option value="Urgent">🚨 Urgent</option>
                    <option value="Normal">Normal</option>
                    <option value="Low">Low</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Reference
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Social Media: Facebook"
                  className="w-full bg-[#101114] border border-[#2b2c35] focus:border-[#e5a919] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-[#1b1c22] hover:bg-[#23252d] border border-[#30323d] text-slate-300 font-semibold rounded-xl text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-[#d97706] via-[#e5a919] to-[#f59e0b] hover:from-[#c26703] hover:to-[#d97706] text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2"
            >
              <Rocket className="w-4 h-4 stroke-[2.5]" />
              <span>{isSubmitting ? 'Registering...' : 'Complete Registration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
