import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import {
  ClipboardCheck,
  Building2,
  Calendar,
  CloudSun,
  Users,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Upload,
  Image,
  Paperclip,
  Save,
  Send,
  ArrowLeft,
  X,
  FileText,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { siteService } from '../../services/site.service';
import { leadService } from '../../services/lead.service';
import { dailyReportService } from '../../services/dailyReport.service';
import { ClientRecord } from '../../types';
import {
  IMaterialReceived,
  IMaterialConsumed,
  IEquipmentUsed,
  IReportPhoto,
  IReportDocument,
} from '../../types/dailyReport';

interface OutletContextType {
  setSidebarOpen: (open: boolean) => void;
}

export const SubmitDailyReportPage: React.FC = () => {
  const { setSidebarOpen } = useOutletContext<OutletContextType>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const queryParams = new URLSearchParams(location.search);
  const initialSiteId = queryParams.get('siteId') || '';
  const initialClientId = queryParams.get('clientId') || '';
  const editReportId = queryParams.get('reportId') || '';

  // Form states
  const [selectedTarget, setSelectedTarget] = useState<string>(
    initialClientId ? `client:${initialClientId}` : initialSiteId ? `project:${initialSiteId}` : ''
  );
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [weather, setWeather] = useState<string>('Sunny / Clear');
  const [workingConditions, setWorkingConditions] = useState<string>('Normal Operations');
  const [workersCount, setWorkersCount] = useState<number>(0);
  const [workersBreakdown, setWorkersBreakdown] = useState({
    skilled: 0,
    unskilled: 0,
    masons: 0,
    carpenters: 0,
    helpers: 0,
    others: 0,
  });

  const [workCompletedToday, setWorkCompletedToday] = useState<string>('');
  const [workPlannedTomorrow, setWorkPlannedTomorrow] = useState<string>('');

  // Materials dynamic lists
  const [materialsReceived, setMaterialsReceived] = useState<IMaterialReceived[]>([]);
  const [materialsConsumed, setMaterialsConsumed] = useState<IMaterialConsumed[]>([]);

  // Equipment dynamic list
  const [equipmentUsed, setEquipmentUsed] = useState<IEquipmentUsed[]>([]);

  // Progress & Safety
  const [progressPercentage, setProgressPercentage] = useState<number>(0);
  const [safetyGearCompliance, setSafetyGearCompliance] = useState<boolean>(true);
  const [incidentsCount, setIncidentsCount] = useState<number>(0);
  const [incidentDetails, setIncidentDetails] = useState<string>('');

  // Roadblocks & Remarks
  const [issuesAndDelays, setIssuesAndDelays] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [correctionSummary, setCorrectionSummary] = useState<string>('');

  // Media
  const [photos, setPhotos] = useState<IReportPhoto[]>([]);
  const [documents, setDocuments] = useState<IReportDocument[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Fetch engineer's assigned clients (customer construction sites)
  const { data: assignedClients = [] } = useQuery<ClientRecord[]>({
    queryKey: ['myAssignedClientsList'],
    queryFn: () => leadService.getClients(),
  });

  // 2. Fetch engineer's assigned project sites
  const { data: sitesData } = useQuery({
    queryKey: ['myAssignedSitesList'],
    queryFn: () => siteService.getSites({ limit: 50 }),
  });

  const assignedSites = sitesData?.projects || [];

  // Default select first available target if none selected
  useEffect(() => {
    if (!selectedTarget) {
      if (initialClientId) {
        setSelectedTarget(`client:${initialClientId}`);
      } else if (initialSiteId) {
        setSelectedTarget(`project:${initialSiteId}`);
      } else if (assignedClients.length > 0) {
        setSelectedTarget(`client:${assignedClients[0]._id}`);
      } else if (assignedSites.length > 0) {
        setSelectedTarget(`project:${assignedSites[0]._id}`);
      }
    }
  }, [initialClientId, initialSiteId, assignedClients, assignedSites, selectedTarget]);

  // 3. Fetch existing report if editing
  const { data: existingReport } = useQuery({
    queryKey: ['editReportDetail', editReportId],
    queryFn: () => (editReportId ? dailyReportService.getReportById(editReportId) : null),
    enabled: Boolean(editReportId),
  });

  useEffect(() => {
    if (existingReport) {
      if (existingReport.clientId) {
        const cId = typeof existingReport.clientId === 'object' ? existingReport.clientId._id : existingReport.clientId;
        setSelectedTarget(`client:${cId}`);
      } else if (existingReport.projectId) {
        const pId = typeof existingReport.projectId === 'object' ? existingReport.projectId._id : existingReport.projectId;
        setSelectedTarget(`project:${pId}`);
      }
      setReportDate(new Date(existingReport.reportDate).toISOString().slice(0, 10));
      setWeather(existingReport.weather || 'Sunny / Clear');
      setWorkingConditions(existingReport.workingConditions || 'Normal Operations');
      setWorkersCount(existingReport.workersCount || 0);
      if (existingReport.workersBreakdown) {
        setWorkersBreakdown({
          skilled: existingReport.workersBreakdown.skilled || 0,
          unskilled: existingReport.workersBreakdown.unskilled || 0,
          masons: existingReport.workersBreakdown.masons || 0,
          carpenters: existingReport.workersBreakdown.carpenters || 0,
          helpers: existingReport.workersBreakdown.helpers || 0,
          others: existingReport.workersBreakdown.others || 0,
        });
      }
      setWorkCompletedToday(existingReport.workCompletedToday || '');
      setWorkPlannedTomorrow(existingReport.workPlannedTomorrow || '');
      setMaterialsReceived(existingReport.materialsReceived || []);
      setMaterialsConsumed(existingReport.materialsConsumed || []);
      setEquipmentUsed(existingReport.equipmentUsed || []);
      setProgressPercentage(existingReport.progressPercentage || 0);
      setSafetyGearCompliance(existingReport.safetyInspection?.safetyGearCompliance ?? true);
      setIncidentsCount(existingReport.safetyInspection?.incidentsCount || 0);
      setIncidentDetails(existingReport.safetyInspection?.incidentDetails || '');
      setIssuesAndDelays(existingReport.issuesAndDelays || '');
      setRemarks(existingReport.remarks || '');
      setPhotos(existingReport.photos || []);
      setDocuments(existingReport.documents || []);
    }
  }, [existingReport]);

  // Mutation
  const createMutation = useMutation({
    mutationFn: (data: any) =>
      editReportId
        ? dailyReportService.updateReport(editReportId, data)
        : dailyReportService.createReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDailyReports'] });
      queryClient.invalidateQueries({ queryKey: ['mySiteReports'] });
      queryClient.invalidateQueries({ queryKey: ['userNotifications'] });
      navigate('/engineer-dashboard');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to submit report';
      setErrorMessage(msg);
    },
  });

  // Material helpers
  const addMaterialReceivedRow = () => {
    setMaterialsReceived((prev) => [
      ...prev,
      { materialName: '', quantity: 0, unit: 'Bags', supplier: '', invoiceNo: '' },
    ]);
  };

  const removeMaterialReceivedRow = (index: number) => {
    setMaterialsReceived((prev) => prev.filter((_, i) => i !== index));
  };

  const updateMaterialReceived = (index: number, field: keyof IMaterialReceived, val: any) => {
    setMaterialsReceived((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  const addMaterialConsumedRow = () => {
    setMaterialsConsumed((prev) => [
      ...prev,
      { materialName: '', quantity: 0, unit: 'Bags', notes: '' },
    ]);
  };

  const removeMaterialConsumedRow = (index: number) => {
    setMaterialsConsumed((prev) => prev.filter((_, i) => i !== index));
  };

  const updateMaterialConsumed = (index: number, field: keyof IMaterialConsumed, val: any) => {
    setMaterialsConsumed((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  // Equipment helpers
  const addEquipmentRow = () => {
    setEquipmentUsed((prev) => [
      ...prev,
      { equipmentName: '', count: 1, hoursOperated: 8, status: 'Operational' },
    ]);
  };

  const removeEquipmentRow = (index: number) => {
    setEquipmentUsed((prev) => prev.filter((_, i) => i !== index));
  };

  const updateEquipment = (index: number, field: keyof IEquipmentUsed, val: any) => {
    setEquipmentUsed((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  // Photo upload handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploaded = await dailyReportService.uploadFiles(Array.from(files));
      const newPhotos: IReportPhoto[] = uploaded.map((f) => ({
        url: f.url,
        caption: f.name.replace(/\.[^/.]+$/, ''),
        originalName: f.name,
      }));
      setPhotos((prev) => [...prev, ...newPhotos]);
    } catch (err: any) {
      alert(`Photo upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePhotoCaption = (index: number, caption: string) => {
    setPhotos((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], caption };
      return copy;
    });
  };

  // Submit action
  const handleSubmitReport = (actionStatus: 'Draft' | 'Submitted') => {
    setErrorMessage(null);

    if (!selectedTarget) {
      setErrorMessage('Please select an assigned construction site or client');
      return;
    }
    if (!reportDate) {
      setErrorMessage('Please enter a valid report date');
      return;
    }
    if (actionStatus === 'Submitted') {
      if (!workCompletedToday.trim()) {
        setErrorMessage('Please provide details for "Work Completed Today"');
        return;
      }
      if (!workPlannedTomorrow.trim()) {
        setErrorMessage('Please provide details for "Work Planned for Tomorrow"');
        return;
      }
    }

    const isClientTarget = selectedTarget.startsWith('client:');
    const targetId = selectedTarget.replace(/^(client|project):/, '');
    const targetClient = isClientTarget ? assignedClients.find((c) => c._id === targetId) : null;

    const payload: any = {
      reportDate,
      weather,
      workingConditions,
      workersCount: Number(workersCount) || 0,
      workersBreakdown,
      workCompletedToday: workCompletedToday.trim(),
      workPlannedTomorrow: workPlannedTomorrow.trim(),
      materialsReceived: materialsReceived.filter((m) => m.materialName.trim()),
      materialsConsumed: materialsConsumed.filter((m) => m.materialName.trim()),
      equipmentUsed: equipmentUsed.filter((e) => e.equipmentName.trim()),
      progressPercentage: Number(progressPercentage) || 0,
      safetyInspection: {
        safetyGearCompliance,
        incidentsCount: Number(incidentsCount) || 0,
        incidentDetails: incidentDetails.trim(),
      },
      issuesAndDelays: issuesAndDelays.trim(),
      remarks: remarks.trim(),
      photos,
      documents,
      status: actionStatus,
    };

    if (isClientTarget) {
      payload.clientId = targetId;
      if (targetClient?.clientCode) {
        payload.clientCode = targetClient.clientCode;
      }
    } else {
      payload.projectId = targetId;
    }

    if (editReportId) {
      payload.correctionSummary = correctionSummary.trim() || 'Revised DPR report submission';
    }

    createMutation.mutate(payload);
  };

  const isClientTargetSelected = selectedTarget.startsWith('client:');
  const selectedClientId = isClientTargetSelected ? selectedTarget.replace('client:', '') : null;
  const currentSelectedClient = selectedClientId
    ? assignedClients.find((c) => c._id === selectedClientId)
    : null;

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 flex flex-col">
      <Header
        breadcrumbs={[
          { label: 'Site Engineer' },
          { label: editReportId ? 'Edit Daily Report' : 'Submit Daily Site Report' },
        ]}
        onToggleSidebar={() => setSidebarOpen(true)}
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto space-y-6">
        {/* Back Link & Header Title */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/engineer-dashboard')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          {existingReport && (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
              Editing Report #{existingReport.reportNumber}
            </span>
          )}
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <ClipboardCheck className="w-7 h-7 text-amber-400" />
            <span>{editReportId ? 'Revise Daily Site Report (DPR)' : 'Submit Daily Site Report (DPR)'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Official daily progress reporting system. Record labor attendance, site photographs, material consumption, and project milestones.
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-start gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
            <div className="text-xs">
              <span className="font-bold block text-rose-200">Validation Notice:</span>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Correction Feedback from Admin (If Editing) */}
        {existingReport?.adminReview?.comments && (
          <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 space-y-1">
            <div className="flex items-center gap-2 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Admin Correction Feedback:</span>
            </div>
            <p className="text-xs text-amber-100">{existingReport.adminReview.comments}</p>
          </div>
        )}

        {/* SECTION 1: Site Context & Report Date */}
        <div className="bg-[#0C101A] border border-[#182032] rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Building2 className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">1. Site Selection & Reporting Date</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Assigned Construction Site / Client <span className="text-amber-400">*</span>
              </label>
              <select
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white focus:outline-none focus:border-amber-500 font-semibold"
              >
                {assignedClients.length > 0 && (
                  <optgroup label="🏗️ Assigned Client Sites (Customer Sites)">
                    {assignedClients.map((client) => (
                      <option key={client._id} value={`client:${client._id}`}>
                        👤 {client.name} [{client.clientCode}] • {client.siteLocation || 'Site Location'}
                      </option>
                    ))}
                  </optgroup>
                )}
                {assignedSites.length > 0 && (
                  <optgroup label="🏢 Construction Project Sites">
                    {assignedSites.map((site) => (
                      <option key={site._id} value={`project:${site._id}`}>
                        📍 {site.name} ({site.code}) • {site.location || 'Site Location'}
                      </option>
                    ))}
                  </optgroup>
                )}
                {assignedClients.length === 0 && assignedSites.length === 0 && (
                  <option value="" disabled>
                    No sites or clients assigned to your account yet
                  </option>
                )}
              </select>

              {/* Selected Client Quick Summary info banner */}
              {currentSelectedClient && (
                <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>📍 <strong>Location:</strong> {currentSelectedClient.siteLocation}</span>
                  <span>📞 <strong>Phone:</strong> {currentSelectedClient.phone}</span>
                  {currentSelectedClient.services && (
                    <span>🛠️ <strong>Services:</strong> {currentSelectedClient.services}</span>
                  )}
                  {currentSelectedClient.area && (
                    <span>📐 <strong>Area:</strong> {currentSelectedClient.area}</span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Report Date <span className="text-amber-400">*</span>
              </label>
              <input
                type="date"
                required
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Environmental Conditions & Labor Workforce */}
        <div className="bg-[#0C101A] border border-[#182032] rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Users className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">2. Environmental Conditions & Labor Attendance</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Weather Conditions</label>
              <select
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Sunny / Clear">Sunny / Clear</option>
                <option value="Partly Cloudy">Partly Cloudy</option>
                <option value="Rainy / Wet Site">Rainy / Wet Site</option>
                <option value="Extreme Heat">Extreme Heat</option>
                <option value="Storm / High Wind">Storm / High Wind</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Working Conditions</label>
              <select
                value={workingConditions}
                onChange={(e) => setWorkingConditions(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Normal Operations">Normal Operations</option>
                <option value="Partial Shift Delay">Partial Shift Delay</option>
                <option value="Work Halted / Weather">Work Halted / Weather Stoppage</option>
                <option value="Overtime Shift Active">Overtime Shift Active</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Total Workers Present <span className="text-amber-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={workersCount}
                onChange={(e) => setWorkersCount(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Breakdown by trade */}
          <div className="bg-[#101726] border border-slate-800 rounded-xl p-3 space-y-2">
            <span className="text-xs font-bold text-slate-300 block">Workforce Breakdown by Trade (Optional)</span>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
              <div>
                <label className="text-[10.5px] text-slate-400">Masons</label>
                <input
                  type="number"
                  min="0"
                  value={workersBreakdown.masons}
                  onChange={(e) => setWorkersBreakdown((p) => ({ ...p, masons: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10.5px] text-slate-400">Carpenters</label>
                <input
                  type="number"
                  min="0"
                  value={workersBreakdown.carpenters}
                  onChange={(e) => setWorkersBreakdown((p) => ({ ...p, carpenters: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10.5px] text-slate-400">Helpers</label>
                <input
                  type="number"
                  min="0"
                  value={workersBreakdown.helpers}
                  onChange={(e) => setWorkersBreakdown((p) => ({ ...p, helpers: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10.5px] text-slate-400">Skilled</label>
                <input
                  type="number"
                  min="0"
                  value={workersBreakdown.skilled}
                  onChange={(e) => setWorkersBreakdown((p) => ({ ...p, skilled: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10.5px] text-slate-400">Unskilled</label>
                <input
                  type="number"
                  min="0"
                  value={workersBreakdown.unskilled}
                  onChange={(e) => setWorkersBreakdown((p) => ({ ...p, unskilled: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10.5px] text-slate-400">Others</label>
                <input
                  type="number"
                  min="0"
                  value={workersBreakdown.others}
                  onChange={(e) => setWorkersBreakdown((p) => ({ ...p, others: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Work Execution (Completed & Planned) */}
        <div className="bg-[#0C101A] border border-[#182032] rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <ClipboardCheck className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">3. Daily Work Execution & Forward Planning</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Work Completed Today <span className="text-amber-400">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={workCompletedToday}
                onChange={(e) => setWorkCompletedToday(e.target.value)}
                placeholder="e.g. Completed 1st floor slab shuttering and reinforcement inspection. Converted 12 cum M25 concrete for beam casting..."
                className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 leading-relaxed text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Work Planned for Tomorrow <span className="text-amber-400">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={workPlannedTomorrow}
                onChange={(e) => setWorkPlannedTomorrow(e.target.value)}
                placeholder="e.g. Begin concrete curing of 1st floor slab; erect scaffolding for external brickwork on North elevation..."
                className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 leading-relaxed text-xs"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: Materials Received & Consumed */}
        <div className="bg-[#0C101A] border border-[#182032] rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">4. Materials Received & Consumed</h2>
            </div>
          </div>

          {/* Materials Received Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400">Materials Received Today</span>
              <button
                type="button"
                onClick={addMaterialReceivedRow}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Material</span>
              </button>
            </div>

            {materialsReceived.length === 0 ? (
              <p className="text-slate-500 text-xs italic py-2">No materials received added.</p>
            ) : (
              <div className="space-y-2">
                {materialsReceived.map((m, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2 bg-[#101726] rounded-xl border border-slate-800 text-xs items-center">
                    <input
                      type="text"
                      placeholder="Material Name (e.g. Ultratech Cement)"
                      value={m.materialName}
                      onChange={(e) => updateMaterialReceived(idx, 'materialName', e.target.value)}
                      className="sm:col-span-4 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={m.quantity}
                      onChange={(e) => updateMaterialReceived(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      className="sm:col-span-2 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Unit (Bags/MT)"
                      value={m.unit}
                      onChange={(e) => updateMaterialReceived(idx, 'unit', e.target.value)}
                      className="sm:col-span-2 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                    <input
                      type="text"
                      placeholder="Supplier / Invoice #"
                      value={m.supplier}
                      onChange={(e) => updateMaterialReceived(idx, 'supplier', e.target.value)}
                      className="sm:col-span-3 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeMaterialReceivedRow(idx)}
                      className="sm:col-span-1 p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Materials Consumed Table */}
          <div className="space-y-2 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400">Materials Consumed Today</span>
              <button
                type="button"
                onClick={addMaterialConsumedRow}
                className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Consumption</span>
              </button>
            </div>

            {materialsConsumed.length === 0 ? (
              <p className="text-slate-500 text-xs italic py-2">No material consumption added.</p>
            ) : (
              <div className="space-y-2">
                {materialsConsumed.map((m, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2 bg-[#101726] rounded-xl border border-slate-800 text-xs items-center">
                    <input
                      type="text"
                      placeholder="Material Name"
                      value={m.materialName}
                      onChange={(e) => updateMaterialConsumed(idx, 'materialName', e.target.value)}
                      className="sm:col-span-5 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={m.quantity}
                      onChange={(e) => updateMaterialConsumed(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      className="sm:col-span-2 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Unit"
                      value={m.unit}
                      onChange={(e) => updateMaterialConsumed(idx, 'unit', e.target.value)}
                      className="sm:col-span-2 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                    <input
                      type="text"
                      placeholder="Usage Notes"
                      value={m.notes}
                      onChange={(e) => updateMaterialConsumed(idx, 'notes', e.target.value)}
                      className="sm:col-span-2 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeMaterialConsumedRow(idx)}
                      className="sm:col-span-1 p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 5: Machinery & Equipment */}
        <div className="bg-[#0C101A] border border-[#182032] rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white">5. Heavy Machinery & Equipment Log</h2>
            <button
              type="button"
              onClick={addEquipmentRow}
              className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Equipment</span>
            </button>
          </div>

          {equipmentUsed.length === 0 ? (
            <p className="text-slate-500 text-xs italic py-2">No heavy equipment log recorded today.</p>
          ) : (
            <div className="space-y-2">
              {equipmentUsed.map((eq, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2 bg-[#101726] rounded-xl border border-slate-800 text-xs items-center">
                  <input
                    type="text"
                    placeholder="Equipment (e.g. Concrete Mixer / Tower Crane)"
                    value={eq.equipmentName}
                    onChange={(e) => updateEquipment(idx, 'equipmentName', e.target.value)}
                    className="sm:col-span-5 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                  <input
                    type="number"
                    placeholder="Count"
                    value={eq.count}
                    onChange={(e) => updateEquipment(idx, 'count', parseInt(e.target.value, 10) || 1)}
                    className="sm:col-span-2 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                  />
                  <input
                    type="number"
                    placeholder="Hours Operated"
                    value={eq.hoursOperated}
                    onChange={(e) => updateEquipment(idx, 'hoursOperated', parseFloat(e.target.value) || 0)}
                    className="sm:col-span-2 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                  />
                  <select
                    value={eq.status}
                    onChange={(e) => updateEquipment(idx, 'status', e.target.value as any)}
                    className="sm:col-span-2 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="Operational">Operational</option>
                    <option value="Breakdown">Breakdown</option>
                    <option value="Idle">Idle</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeEquipmentRow(idx)}
                    className="sm:col-span-1 p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 6: Work Progress & Safety Inspection */}
        <div className="bg-[#0C101A] border border-[#182032] rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">6. Overall Progress & Safety Compliance</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Cumulative Site Progress ({progressPercentage}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={progressPercentage}
                onChange={(e) => setProgressPercentage(parseInt(e.target.value, 10) || 0)}
                className="w-full accent-amber-500"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-1">
                <span>0%</span>
                <span className="font-bold text-amber-400">{progressPercentage}%</span>
                <span>100%</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">PPE & Safety Compliance</label>
              <select
                value={safetyGearCompliance ? 'yes' : 'no'}
                onChange={(e) => setSafetyGearCompliance(e.target.value === 'yes')}
                className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white focus:outline-none focus:border-amber-500"
              >
                <option value="yes">Yes — 100% PPE Compliant</option>
                <option value="no">No — Infractions Observed</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Safety Incidents Count</label>
              <input
                type="number"
                min="0"
                value={incidentsCount}
                onChange={(e) => setIncidentsCount(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {incidentsCount > 0 && (
            <div>
              <label className="block text-rose-300 font-semibold mb-1">Incident Details & First Aid Action</label>
              <input
                type="text"
                value={incidentDetails}
                onChange={(e) => setIncidentDetails(e.target.value)}
                placeholder="Describe incident, injured personnel, and treatment provided"
                className="w-full px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs"
              />
            </div>
          )}
        </div>

        {/* SECTION 7: Issues, Delays & Additional Remarks */}
        <div className="bg-[#0C101A] border border-[#182032] rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">7. Delays, Roadblocks & Additional Remarks</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Issues, Roadblocks & Material Shortages (if any)
              </label>
              <textarea
                rows={2}
                value={issuesAndDelays}
                onChange={(e) => setIssuesAndDelays(e.target.value)}
                placeholder="Mention any municipal stoppages, vendor delays, machinery breakdowns, or material shortages..."
                className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Additional Remarks</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Any special notes or client visitor remarks"
                className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
              />
            </div>

            {editReportId && (
              <div>
                <label className="block text-amber-400 font-bold mb-1">
                  Revision Change Summary (For Audit History)
                </label>
                <input
                  type="text"
                  value={correctionSummary}
                  onChange={(e) => setCorrectionSummary(e.target.value)}
                  placeholder="e.g. Corrected cement consumption from 40 to 65 bags as instructed by admin"
                  className="w-full px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs"
                />
              </div>
            )}
          </div>
        </div>

        {/* SECTION 8: Photo Uploads & Captions */}
        <div className="bg-[#0C101A] border border-[#182032] rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">8. Site Photographs & Evidence Upload</h2>
            </div>
            <label className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md">
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploading ? 'Uploading...' : 'Upload Photos'}</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>

          {photos.length === 0 ? (
            <div className="py-8 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl space-y-1">
              <Upload className="w-8 h-8 mx-auto text-slate-600" />
              <p className="font-semibold text-xs text-slate-400">No site photographs uploaded yet</p>
              <p className="text-[11px] text-slate-500">Upload site progress photos, concrete slump checks, steel mesh, etc.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {photos.map((photo, idx) => (
                <div key={idx} className="bg-[#121929] border border-slate-800 rounded-xl overflow-hidden p-2 space-y-2">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-black/40">
                    <img src={photo.url} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-rose-500 text-white hover:bg-rose-600 cursor-pointer shadow"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Caption (e.g. Beam reinforcement inspection)"
                    value={photo.caption || ''}
                    onChange={(e) => updatePhotoCaption(idx, e.target.value)}
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white text-[11px]"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons: Save Draft & Submit */}
        <div className="bg-[#0C101A] border border-[#182032] rounded-2xl p-4 flex items-center justify-between gap-4 shadow-xl sticky bottom-4 z-20 backdrop-blur-md">
          <button
            type="button"
            onClick={() => navigate('/engineer-dashboard')}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-[#141B2D] hover:bg-[#1A233A] font-semibold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={createMutation.isPending}
              onClick={() => handleSubmitReport('Draft')}
              className="px-4 py-2 rounded-xl bg-[#141E33] hover:bg-[#1A2844] border border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4 text-amber-400" />
              <span>Save as Draft</span>
            </button>

            <button
              type="button"
              disabled={createMutation.isPending}
              onClick={() => handleSubmitReport('Submitted')}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
              <span>{createMutation.isPending ? 'Submitting...' : 'Submit Official Report'}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
