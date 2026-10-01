import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Info } from 'lucide-react';
import { LeadItem, PartnerItem } from '../../types';
import leadService from '../../services/lead.service';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (lead: LeadItem) => void;
  leadToEdit?: LeadItem | null;
}

const AVAILABLE_SERVICES = [
  'Construction Furnished',
  'Construction Raw / Grey Structure',
  'Architectural Design',
  'Interior Designing',
  'Renovation & Remodelling',
  'Commercial Construction',
  'Turnkey Solution',
  'Waterproofing & Painting',
  'Modular Kitchen & Wardrobes',
];

const OCCUPATIONS = [
  'Business',
  'Govt. Employee',
  'Doctor',
  'Engineer',
  'Advocate',
  'Teacher',
  'Private Job',
  'Retired',
  'Other',
];

const FACINGS = [
  'East',
  'West',
  'North',
  'South',
  'North-East',
  'North-West',
  'South-East',
  'South-West',
];

export const AddLeadModal: React.FC<AddLeadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  leadToEdit,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [partners, setPartners] = useState<PartnerItem[]>([]);

  // Form State
  const [leadDate, setLeadDate] = useState(new Date().toISOString().split('T')[0]);
  const [clientName, setClientName] = useState('');
  const [targetCompanyCode, setTargetCompanyCode] = useState('LB');
  const [occupation, setOccupation] = useState('');
  const [mobile1, setMobile1] = useState('');
  const [mobile2, setMobile2] = useState('');
  const [email, setEmail] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');

  // Step 2 State
  const [siteLocation, setSiteLocation] = useState('');
  const [requirements, setRequirements] = useState<string[]>(['Construction Furnished']);
  const [propertyType, setPropertyType] = useState<'Resi.' | 'Comm.'>('Resi.');
  const [landArea, setLandArea] = useState('');
  const [buildupArea, setBuildupArea] = useState('');
  const [dimensional, setDimensional] = useState('');
  const [facing, setFacing] = useState('');
  const [level, setLevel] = useState('Grnd/1st');
  const [meetingDateTime, setMeetingDateTime] = useState('');
  const [budget, setBudget] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');

  // Step 3 State
  const [referenceType, setReferenceType] = useState<'Associate' | 'Social Media' | 'Employee' | 'Direct'>('Direct');
  const [partnerName, setPartnerName] = useState('');
  const [channel, setChannel] = useState('Facebook');
  const [employeeName, setEmployeeName] = useState('');
  const [referenceNotes, setReferenceNotes] = useState('');
  const [stage, setStage] = useState<string>('Lead');
  const [priority, setPriority] = useState<string>('Normal');

  useEffect(() => {
    if (isOpen) {
      loadPartners();
      if (leadToEdit) {
        setLeadDate(leadToEdit.leadDate ? new Date(leadToEdit.leadDate).toISOString().split('T')[0] : '');
        setClientName(leadToEdit.clientName || '');
        setTargetCompanyCode(leadToEdit.targetCompanyCode || 'LB');
        setOccupation(leadToEdit.occupation || '');
        setMobile1(leadToEdit.mobile1 || '');
        setMobile2(leadToEdit.mobile2 || '');
        setEmail(leadToEdit.email || '');
        setPermanentAddress(leadToEdit.permanentAddress || '');
        setSiteLocation(leadToEdit.siteLocation || '');
        setRequirements(leadToEdit.requirements?.length ? leadToEdit.requirements : ['Construction Furnished']);
        setPropertyType(
          leadToEdit.propertyType === 'Comm.' || leadToEdit.propertyType === 'Commercial'
            ? 'Comm.'
            : 'Resi.'
        );
        setLandArea(leadToEdit.landArea || '');
        setBuildupArea(leadToEdit.buildupArea || '');
        setDimensional(leadToEdit.dimensional || '');
        setFacing(leadToEdit.facing || '');
        setLevel(leadToEdit.level || 'Grnd/1st');
        setMeetingDateTime(
          leadToEdit.meetingDateTime
            ? new Date(leadToEdit.meetingDateTime).toISOString().slice(0, 16)
            : ''
        );
        setBudget(leadToEdit.finances?.budget ? String(leadToEdit.finances.budget) : '');
        setEstimatedCost(leadToEdit.finances?.estimatedCost ? String(leadToEdit.finances.estimatedCost) : '');
        setReferenceType(leadToEdit.referenceType || 'Direct');
        setPartnerName(leadToEdit.referenceDetails?.partnerName || '');
        setChannel(leadToEdit.referenceDetails?.channel || 'Facebook');
        setEmployeeName(leadToEdit.referenceDetails?.employeeName || '');
        setReferenceNotes(leadToEdit.referenceDetails?.notes || '');
        setStage(leadToEdit.stage || 'Lead');
        setPriority(leadToEdit.priority || 'Normal');
      } else {
        // Reset defaults
        resetForm();
      }
      setStep(1);
      setErrorMessage('');
    }
  }, [isOpen, leadToEdit]);

  const resetForm = () => {
    setLeadDate(new Date().toISOString().split('T')[0]);
    setClientName('');
    setTargetCompanyCode('LB');
    setOccupation('');
    setMobile1('');
    setMobile2('');
    setEmail('');
    setPermanentAddress('');
    setSiteLocation('');
    setRequirements(['Construction Furnished']);
    setPropertyType('Resi.');
    setLandArea('');
    setBuildupArea('');
    setDimensional('');
    setFacing('');
    setLevel('Grnd/1st');
    setMeetingDateTime('');
    setBudget('');
    setEstimatedCost('');
    setReferenceType('Direct');
    setPartnerName('');
    setChannel('Facebook');
    setEmployeeName('');
    setReferenceNotes('');
    setStage('Lead');
    setPriority('Normal');
  };

  const loadPartners = async () => {
    try {
      const data = await leadService.getPartners();
      setPartners(data);
    } catch {
      // Ignored
    }
  };

  if (!isOpen) return null;

  const handleAddRequirement = () => {
    setRequirements([...requirements, 'Construction Furnished']);
  };

  const handleRemoveRequirement = (index: number) => {
    if (requirements.length <= 1) return;
    const updated = [...requirements];
    updated.splice(index, 1);
    setRequirements(updated);
  };

  const handleRequirementChange = (index: number, val: string) => {
    const updated = [...requirements];
    updated[index] = val;
    setRequirements(updated);
  };

  const handleNextStep1 = () => {
    if (!clientName.trim()) {
      setErrorMessage('Please enter Owner / Client Name.');
      return;
    }
    if (!targetCompanyCode) {
      setErrorMessage('Please select a Company.');
      return;
    }
    if (!mobile1.trim()) {
      setErrorMessage('Please enter primary Mobile number.');
      return;
    }
    setErrorMessage('');
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (!siteLocation.trim()) {
      setErrorMessage('Please enter Site Location.');
      return;
    }
    if (!requirements.length || !requirements[0]) {
      setErrorMessage('Please specify at least one requirement service.');
      return;
    }
    setErrorMessage('');
    setStep(3);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload: Partial<LeadItem> = {
        leadDate,
        clientName: clientName.trim(),
        targetCompanyCode,
        targetCompanyName: targetCompanyCode === 'LD' ? 'Lucknow Developers' : 'Lucknow Builders',
        occupation,
        mobile1: mobile1.trim(),
        mobile2: mobile2.trim(),
        email: email.trim(),
        permanentAddress: permanentAddress.trim(),
        siteLocation: siteLocation.trim(),
        requirements,
        propertyType,
        landArea: landArea.trim(),
        buildupArea: buildupArea.trim(),
        dimensional: dimensional.trim(),
        facing,
        level: level.trim(),
        meetingDateTime: meetingDateTime ? new Date(meetingDateTime).toISOString() : undefined,
        finances: {
          budget: Number(budget) || 0,
          estimatedCost: Number(estimatedCost) || 0,
        },
        referenceType,
        referenceDetails: {
          partnerName: referenceType === 'Associate' ? partnerName : '',
          channel: referenceType === 'Social Media' ? channel : '',
          employeeName: referenceType === 'Employee' ? employeeName : '',
          notes: referenceNotes,
        },
        stage: stage as any,
        priority: priority as any,
      };

      let result: LeadItem;
      if (leadToEdit) {
        result = await leadService.updateLead(leadToEdit._id, payload);
      } else {
        result = await leadService.createLead(payload);
      }

      onSuccess(result);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to save lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#12161F] border border-[#232B3E] rounded-3xl w-full max-w-2xl text-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden my-auto">
        {/* Header */}
        <div className="relative pt-6 px-6 pb-4 border-b border-[#1E2638] text-center">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-[#1A2234] text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {leadToEdit ? 'Edit Lead' : 'Add New Lead'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Fill in the details to expand your business network.
          </p>

          {/* Steppers */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 mt-6 max-w-md mx-auto">
            {/* Step 1 */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > 1
                    ? 'bg-[#0284C7] text-white shadow-[0_0_10px_rgba(2,132,199,0.5)]'
                    : step === 1
                    ? 'bg-[#EAB308] text-slate-950 font-black shadow-[0_0_12px_rgba(234,179,8,0.5)]'
                    : 'bg-[#1E2638] text-slate-400'
                }`}
              >
                {step > 1 ? <Check className="w-4 h-4 stroke-[3]" /> : '1'}
              </div>
              <span
                className={`text-[11px] font-semibold tracking-wide ${
                  step === 1 ? 'text-[#EAB308]' : step > 1 ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                Lead Detail
              </span>
            </div>

            {/* Divider 1 */}
            <div
              className={`h-[1px] flex-1 max-w-[60px] transition-colors ${
                step > 1 ? 'bg-[#0284C7]' : 'bg-[#2A344A]'
              }`}
            />

            {/* Step 2 */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > 2
                    ? 'bg-[#0284C7] text-white shadow-[0_0_10px_rgba(2,132,199,0.5)]'
                    : step === 2
                    ? 'bg-[#EAB308] text-slate-950 font-black shadow-[0_0_12px_rgba(234,179,8,0.5)]'
                    : 'bg-[#1E2638] text-slate-400'
                }`}
              >
                {step > 2 ? <Check className="w-4 h-4 stroke-[3]" /> : '2'}
              </div>
              <span
                className={`text-[11px] font-semibold tracking-wide ${
                  step === 2 ? 'text-[#EAB308]' : step > 2 ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                Project & Services
              </span>
            </div>

            {/* Divider 2 */}
            <div
              className={`h-[1px] flex-1 max-w-[60px] transition-colors ${
                step > 2 ? 'bg-[#0284C7]' : 'bg-[#2A344A]'
              }`}
            />

            {/* Step 3 */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === 3
                    ? 'bg-[#EAB308] text-slate-950 font-black shadow-[0_0_12px_rgba(234,179,8,0.5)]'
                    : 'bg-[#1E2638] text-slate-400'
                }`}
              >
                3
              </div>
              <span
                className={`text-[11px] font-semibold tracking-wide ${
                  step === 3 ? 'text-[#EAB308]' : 'text-slate-500'
                }`}
              >
                Reference Source
              </span>
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
            {errorMessage}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {/* STEP 1: CLIENT DETAILS */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1 h-4 bg-[#EAB308] rounded-full inline-block" />
                <h3 className="text-sm font-bold text-[#EAB308] tracking-wide">Client Details</h3>
              </div>

              {/* Row 1: Date, Name, Company */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Lead Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={leadDate}
                    onChange={(e) => setLeadDate(e.target.value)}
                    className="w-full bg-[#181F2F] border border-[#2B354C] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#EAB308] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Owner / Client Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-[#181F2F] border border-[#2B354C] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#EAB308] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Company <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={targetCompanyCode}
                    onChange={(e) => setTargetCompanyCode(e.target.value)}
                    className="w-full bg-[#181F2F] border border-[#2B354C] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#EAB308] transition-colors"
                  >
                    <option value="LB">Lucknow Builders (LB)</option>
                    <option value="LD">Lucknow Developers (LD)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Occupation, Mobile 1, Mobile 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Occupation
                  </label>
                  <select
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className="w-full bg-[#181F2F] border border-[#2B354C] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#EAB308] transition-colors"
                  >
                    <option value="">-- Select Occupation --</option>
                    {OCCUPATIONS.map((occ) => (
                      <option key={occ} value={occ}>
                        {occ}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Mobile No 1 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Primary Number"
                    value={mobile1}
                    onChange={(e) => setMobile1(e.target.value)}
                    className="w-full bg-[#181F2F] border border-[#2B354C] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#EAB308] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Mobile No 2
                  </label>
                  <input
                    type="text"
                    placeholder="Secondary"
                    value={mobile2}
                    onChange={(e) => setMobile2(e.target.value)}
                    className="w-full bg-[#181F2F] border border-[#2B354C] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#EAB308] transition-colors"
                  />
                </div>
              </div>

              {/* Row 3: Email */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#181F2F] border border-[#2B354C] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#EAB308] transition-colors"
                />
              </div>

              {/* Row 4: Permanent Address */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Permanent Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Enter Full Address"
                  value={permanentAddress}
                  onChange={(e) => setPermanentAddress(e.target.value)}
                  className="w-full bg-[#181F2F] border border-[#2B354C] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#EAB308] transition-colors resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP 2: PROJECT & SERVICES */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1 h-4 bg-[#EAB308] rounded-full inline-block" />
                <h3 className="text-sm font-bold text-[#EAB308] tracking-wide">
                  Project & Site Details
                </h3>
              </div>

              {/* Site Location */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Site Location <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter Site Area / Landmark"
                  value={siteLocation}
                  onChange={(e) => setSiteLocation(e.target.value)}
                  className="w-full bg-[#181F2F] border border-[#2B354C] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#EAB308] transition-colors"
                />
              </div>

              {/* SPECIFY REQUIREMENTS with +ADD */}
              <div className="p-3 bg-[#171D2C] border border-[#263044] rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    SPECIFY REQUIREMENTS <span className="text-red-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddRequirement}
                    className="flex items-center gap-1 px-2.5 py-1 bg-[#D97706] hover:bg-[#F59E0B] text-slate-950 font-bold rounded-lg text-[10px] transition-all"
                  >
                    <Plus className="w-3 h-3 stroke-[3]" /> ADD
                  </button>
                </div>

                {requirements.map((req, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={req}
                      onChange={(e) => handleRequirementChange(idx, e.target.value)}
                      className="flex-1 bg-[#121622] border border-[#2B354C] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#EAB308] transition-colors"
                    >
                      <option value="">-Select Service-</option>
                      {AVAILABLE_SERVICES.map((srv) => (
                        <option key={srv} value={srv}>
                          {srv}
                        </option>
                      ))}
                    </select>
                    {requirements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRequirement(idx)}
                        className="w-8 h-8 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-700/50 text-red-300 flex items-center justify-center transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Property Type Toggle */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                  Property Type
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPropertyType('Resi.')}
                    className={`flex-1 py-1.5 rounded-xl font-semibold text-xs transition-all ${
                      propertyType === 'Resi.'
                        ? 'bg-white text-slate-900 shadow-md font-bold'
                        : 'bg-[#181F2F] text-slate-400 border border-[#2B354C] hover:text-white'
                    }`}
                  >
                    Resi.
                  </button>
                  <button
                    type="button"
                    onClick={() => setPropertyType('Comm.')}
                    className={`flex-1 py-1.5 rounded-xl font-semibold text-xs transition-all ${
                      propertyType === 'Comm.'
                        ? 'bg-white text-slate-900 shadow-md font-bold'
                        : 'bg-[#181F2F] text-slate-400 border border-[#2B354C] hover:text-white'
                    }`}
                  >
                    Comm.
                  </button>
                </div>
              </div>

              {/* 3 Columns: Land Area, Buildup Area, Dimensional */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    LAND AREA(SQFT)
                  </label>
                  <input
                    type="text"
                    placeholder="Total"
                    value={landArea}
                    onChange={(e) => setLandArea(e.target.value)}
                    className="w-full bg-[#181F2F] border border-[#2B354C] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#EAB308]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    BUILDUP AREA
                  </label>
                  <input
                    type="text"
                    placeholder="L x W"
                    value={buildupArea}
                    onChange={(e) => setBuildupArea(e.target.value)}
                    className="w-full bg-[#181F2F] border border-[#2B354C] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#EAB308]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    DIMENSIONAL
                  </label>
                  <input
                    type="text"
                    placeholder="L x W"
                    value={dimensional}
                    onChange={(e) => setDimensional(e.target.value)}
                    className="w-full bg-[#181F2F] border border-[#2B354C] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#EAB308]"
                  />
                </div>
              </div>

              {/* Facing & Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    FACING
                  </label>
                  <select
                    value={facing}
                    onChange={(e) => setFacing(e.target.value)}
                    className="w-full bg-[#181F2F] border border-[#2B354C] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#EAB308]"
                  >
                    <option value="">Facing</option>
                    {FACINGS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    LEVEL
                  </label>
                  <input
                    type="text"
                    placeholder="Grnd/1st"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full bg-[#181F2F] border border-[#2B354C] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#EAB308]"
                  />
                </div>
              </div>

              {/* Meeting Date & Finances */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Meeting Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={meetingDateTime}
                    onChange={(e) => setMeetingDateTime(e.target.value)}
                    className="w-full bg-[#181F2F] border border-[#2B354C] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#EAB308]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Finances (Budget / Est.)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Budget ₹"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full bg-[#181F2F] border border-[#2B354C] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#EAB308]"
                    />
                    <input
                      type="number"
                      placeholder="Est ₹"
                      value={estimatedCost}
                      onChange={(e) => setEstimatedCost(e.target.value)}
                      className="w-full bg-[#181F2F] border border-[#2B354C] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#EAB308]"
                    />
                  </div>
                </div>
              </div>

              {/* Site Pictures */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Site Pictures
                </label>
                <div className="flex items-center gap-3 bg-[#181F2F] border border-[#2B354C] rounded-xl p-2 text-xs text-slate-400">
                  <input type="file" multiple className="text-xs file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-white file:text-slate-900 hover:file:bg-slate-200 cursor-pointer" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: REFERENCE SOURCE */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1 h-4 bg-[#EAB308] rounded-full inline-block" />
                <h3 className="text-sm font-bold text-[#EAB308] tracking-wide">
                  Reference Source
                </h3>
              </div>

              {/* Reference Type Selection Pills */}
              <div className="p-4 bg-[#171D2C] border border-[#263044] rounded-2xl space-y-3">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  SELECT REFERENCE TYPE
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Associate', 'Social Media', 'Employee', 'Direct'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setReferenceType(type)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                        referenceType === type
                          ? 'bg-[#1E273A] text-white border-2 border-amber-400/80 shadow-md'
                          : 'bg-[#131722] text-slate-400 border border-[#252E42] hover:text-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* Context dynamic field based on referenceType */}
                {referenceType === 'Direct' && (
                  <div className="p-3 bg-[#121E33] border border-[#1E365E] rounded-xl text-sky-200 text-xs flex items-center gap-2">
                    <Info className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Direct lead, no external referral attribution.</span>
                  </div>
                )}

                {referenceType === 'Associate' && (
                  <div className="pt-2">
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Select Associate / Partner
                    </label>
                    <select
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      className="w-full bg-[#121622] border border-[#2B354C] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#EAB308]"
                    >
                      <option value="">-- Select Partner or Enter New --</option>
                      {partners.map((p) => (
                        <option key={p._id} value={p.name}>
                          {p.name} ({p.partnerType} - {p.commissionRatePercent}%)
                        </option>
                      ))}
                    </select>
                    {!partnerName && (
                      <input
                        type="text"
                        placeholder="Or enter associate name manually"
                        onChange={(e) => setPartnerName(e.target.value)}
                        className="mt-2 w-full bg-[#121622] border border-[#2B354C] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#EAB308]"
                      />
                    )}
                  </div>
                )}

                {referenceType === 'Social Media' && (
                  <div className="pt-2">
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Social Media Channel
                    </label>
                    <select
                      value={channel}
                      onChange={(e) => setChannel(e.target.value)}
                      className="w-full bg-[#121622] border border-[#2B354C] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#EAB308]"
                    >
                      <option value="Facebook">Facebook Ads / Page</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Google Ads">Google Ads</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="YouTube">YouTube</option>
                      <option value="Website">Company Website</option>
                      <option value="Other">Other Social Media</option>
                    </select>
                  </div>
                )}

                {referenceType === 'Employee' && (
                  <div className="pt-2">
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Employee Name / Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Verma (Site Engineer)"
                      value={employeeName}
                      onChange={(e) => setEmployeeName(e.target.value)}
                      className="w-full bg-[#121622] border border-[#2B354C] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#EAB308]"
                    />
                  </div>
                )}
              </div>

              {/* Status & Priority Row */}
              <div className="p-4 bg-[#171D2C] border border-[#263044] rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    LEAD STATUS
                  </label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="w-full bg-[#121622] border border-[#2B354C] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#EAB308]"
                  >
                    <option value="Lead">Lead</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Site Visit">Site Visit</option>
                    <option value="Quotation">Quotation</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Client">Client</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    PRIORITY
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-[#121622] border border-[#2B354C] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#EAB308]"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">🔥 High</option>
                    <option value="Urgent">🚨 Urgent</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Actions */}
        <div className="p-4 sm:p-5 bg-[#0E121B] border-t border-[#1E2638] flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-5 py-2.5 bg-[#181F2F] hover:bg-[#20293D] border border-[#2B354C] text-slate-300 font-semibold text-xs rounded-xl transition-all"
            >
              Previous
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-transparent hover:bg-slate-800 text-slate-400 font-medium text-xs rounded-xl transition-all"
            >
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={step === 1 ? handleNextStep1 : handleNextStep2}
              className="px-6 py-2.5 bg-[#D97706] hover:bg-[#F59E0B] text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all ml-auto"
            >
              Next Phase
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="px-7 py-2.5 bg-[#D97706] hover:bg-[#F59E0B] disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all ml-auto flex items-center gap-2"
            >
              {isSubmitting ? (
                <>Saving...</>
              ) : (
                <>Save Record</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
