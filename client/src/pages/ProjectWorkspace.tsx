import React, { useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Calendar,
  Layers,
  MapPin,
  Ruler,
  FileSpreadsheet,
  Package,
  Users2,
  Truck,
  ArrowLeft,
  Info,
  Plus,
  Trash2,
  CheckCircle2,
  Receipt,
  LineChart,
  Edit2,
  Search,
  BookOpen,
  DollarSign,
  TrendingUp,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  Eye,
  Settings2,
  Copy,
  ChevronRight,
  Calculator,
} from 'lucide-react';
import api from '../services/api';
import {
  Project,
  Boq,
  BoqItem,
  Measurement,
  MeasurementSummary,
  BomItem,
  ManpowerItem,
  MachineryItem,
  RunningBill,
  ProjectCostControl,
  SorItem,
  MeasurementFormula,
  RateAnalysisDetail,
  RateAnalysisComponent,
} from '../types';
import { Header } from '../components/layout/Header';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { SmartMeasurementModal } from '../components/measurements/SmartMeasurementModal';
import { ResourceDrilldownModal } from '../components/resources/ResourceDrilldownModal';
import { formatCurrency, formatDate } from '../utils/formatters';
import { cn } from '../utils/cn';

interface OutletContextType {
  setSidebarOpen: (open: boolean) => void;
}

type WorkspaceTab =
  | 'overview'
  | 'boq'
  | 'measurements'
  | 'materials'
  | 'manpower'
  | 'machinery'
  | 'cost_control'
  | 'billing';

export const ProjectWorkspace: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { setSidebarOpen } = useOutletContext<OutletContextType>();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');

  // Modals
  const [isAddBoqModalOpen, setIsAddBoqModalOpen] = useState(false);
  const [isSorSelectModalOpen, setIsSorSelectModalOpen] = useState(false);
  const [isSmartMeasurementModalOpen, setIsSmartMeasurementModalOpen] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<Measurement | null>(null);
  const [initialBoqItemForMeasurement, setInitialBoqItemForMeasurement] = useState<BoqItem | null>(null);
  
  // Resource Drill-down Modal
  const [isResourceDrilldownOpen, setIsResourceDrilldownOpen] = useState(false);
  const [drilldownResourceType, setDrilldownResourceType] = useState<'MATERIAL' | 'LABOUR' | 'MACHINERY'>('MATERIAL');
  const [drilldownItem, setDrilldownItem] = useState<BomItem | ManpowerItem | MachineryItem | null>(null);

  // Form states for manual BOQ
  const [customItemCode, setCustomItemCode] = useState('');
  const [customItemDesc, setCustomItemDesc] = useState('');
  const [customItemUnit, setCustomItemUnit] = useState('cum');
  const [customItemQty, setCustomItemQty] = useState<number | ''>('');
  const [customItemRate, setCustomItemRate] = useState<number | ''>('');

  // SOR Selection in BOQ
  const [sorSearch, setSorSearch] = useState('');
  const [selectedSorItem, setSelectedSorItem] = useState<SorItem | null>(null);
  const [sorItemQty, setSorItemQty] = useState<number | ''>('');
  const [sorCustomRate, setSorCustomRate] = useState<number | ''>('');

  // Rate Analysis Modal & Configuration State
  const [selectedBoqItemForAnalysis, setSelectedBoqItemForAnalysis] = useState<BoqItem | null>(null);
  const [isRateAnalysisModalOpen, setIsRateAnalysisModalOpen] = useState(false);
  const [customMaterialsList, setCustomMaterialsList] = useState<Array<{ name: string; unit: string; coefficient: number; unitRate: number }>>([]);
  const [customLabourList, setCustomLabourList] = useState<Array<{ name: string; unit: string; coefficient: number; unitRate: number }>>([]);
  const [customMachineryList, setCustomMachineryList] = useState<Array<{ name: string; unit: string; coefficient: number; unitRate: number }>>([]);

  // Measurement Reversal Modal State
  const [reversalModalMeasurement, setReversalModalMeasurement] = useState<Measurement | null>(null);
  const [reversalReason, setReversalReason] = useState('');

  // 1. Fetch Project Details
  const { data: project, isLoading: isProjectLoading } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}`);
      return res.data?.data;
    },
    enabled: !!projectId,
  });

  // 2. Fetch BOQ Items
  const { data: boqData, refetch: refetchBoq } = useQuery<{ boq: Boq; items: BoqItem[] }>({
    queryKey: ['projectBoq', projectId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}/boq`);
      return res.data?.data || { boq: null, items: [] };
    },
    enabled: !!projectId,
  });

  // 3. Fetch Measurements
  const { data: measurements = [], refetch: refetchMeasurements } = useQuery<Measurement[]>({
    queryKey: ['projectMeasurements', projectId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}/measurements`);
      return res.data?.data || [];
    },
    enabled: !!projectId && activeTab === 'measurements',
  });

  // 3b. Fetch Measurement Dashboard Summary
  const { data: measurementSummary, refetch: refetchMeasurementSummary } = useQuery<MeasurementSummary>({
    queryKey: ['measurementSummary', projectId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}/measurements/summary`);
      return res.data?.data;
    },
    enabled: !!projectId,
  });

  // 4. Fetch BOM Items
  const { data: bomItems = [], refetch: refetchBom } = useQuery<BomItem[]>({
    queryKey: ['projectBom', projectId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}/resources/bom`);
      return res.data?.data || [];
    },
    enabled: !!projectId && (activeTab === 'materials' || activeTab === 'overview'),
  });

  // 5. Fetch Manpower Items
  const { data: manpowerItems = [], refetch: refetchManpower } = useQuery<ManpowerItem[]>({
    queryKey: ['projectManpower', projectId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}/resources/manpower`);
      return res.data?.data || [];
    },
    enabled: !!projectId && (activeTab === 'manpower' || activeTab === 'overview'),
  });

  // 6. Fetch Machinery Items
  const { data: machineryItems = [], refetch: refetchMachinery } = useQuery<MachineryItem[]>({
    queryKey: ['projectMachinery', projectId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}/resources/machinery`);
      return res.data?.data || [];
    },
    enabled: !!projectId && (activeTab === 'machinery' || activeTab === 'overview'),
  });

  // 7. Fetch Cost Control Overview
  const { data: costControl, refetch: refetchCostControl } = useQuery<ProjectCostControl>({
    queryKey: ['projectCostControl', projectId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}/billing/cost-control`);
      return res.data?.data;
    },
    enabled: !!projectId && (activeTab === 'cost_control' || activeTab === 'overview'),
  });

  // 8. Fetch Running Bills
  const { data: runningBills = [], refetch: refetchBills } = useQuery<RunningBill[]>({
    queryKey: ['projectBills', projectId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}/billing`);
      return res.data?.data || [];
    },
    enabled: !!projectId && activeTab === 'billing',
  });

  // Central refetch all connected data
  const refetchAllData = () => {
    refetchBoq();
    refetchMeasurements();
    refetchMeasurementSummary();
    refetchBom();
    refetchManpower();
    refetchMachinery();
    refetchCostControl();
    refetchBills();
    queryClient.invalidateQueries({ queryKey: ['project', projectId] });
  };

  // Search SOR items for BOQ
  const { data: sorResults = [] } = useQuery<SorItem[]>({
    queryKey: ['sorSearchForBoq', sorSearch],
    queryFn: async () => {
      const res = await api.get(`/sor/items?search=${encodeURIComponent(sorSearch)}&limit=10`);
      return res.data?.data || [];
    },
    enabled: isSorSelectModalOpen,
  });

  // Add Manual BOQ Item Mutation
  const addBoqItemMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      return api.post(`/projects/${projectId}/boq/items`, payload);
    },
    onSuccess: () => {
      refetchAllData();
      setIsAddBoqModalOpen(false);
      setIsSorSelectModalOpen(false);
    },
  });

  // Rate Analysis Inspection / Configuration Query
  const {
    data: currentAnalysisDetail,
    isLoading: isAnalysisLoading,
    refetch: refetchAnalysis,
  } = useQuery<RateAnalysisDetail>({
    queryKey: ['boqItemRateAnalysis', projectId, selectedBoqItemForAnalysis?._id],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}/boq/items/${selectedBoqItemForAnalysis?._id}/rate-analysis`);
      return res.data?.data;
    },
    enabled: !!selectedBoqItemForAnalysis && isRateAnalysisModalOpen,
  });

  // Save Custom Rate Analysis Mutation
  const saveAnalysisMutation = useMutation({
    mutationFn: async (payload: {
      materials: Array<{ name: string; unit: string; coefficient: number; unitRate: number }>;
      labour: Array<{ name: string; unit: string; coefficient: number; unitRate: number }>;
      machinery: Array<{ name: string; unit: string; coefficient: number; unitRate: number }>;
    }) => {
      return api.post(`/projects/${projectId}/boq/items/${selectedBoqItemForAnalysis?._id}/rate-analysis`, payload);
    },
    onSuccess: () => {
      refetchAllData();
      refetchAnalysis();
      alert('Rate analysis composition configured successfully! Execution resources auto-calculated.');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Failed to save rate analysis');
    },
  });

  // Reverse Measurement Mutation (Audit-Compliant Traceable Reversal)
  const reverseMeasurementMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return api.patch(`/projects/${projectId}/measurements/${id}/reverse`, { reason });
    },
    onSuccess: () => {
      refetchAllData();
      setReversalModalMeasurement(null);
      setReversalReason('');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Failed to reverse measurement');
    },
  });

  // Duplicate Measurement Mutation
  const duplicateMeasurementMutation = useMutation({
    mutationFn: async (measurementId: string) => {
      return api.post(`/projects/${projectId}/measurements/${measurementId}/duplicate`);
    },
    onSuccess: () => {
      refetchAllData();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Failed to duplicate measurement');
    },
  });

  // Delete Measurement Mutation
  const deleteMeasurementMutation = useMutation({
    mutationFn: async (measurementId: string) => {
      return api.delete(`/projects/${projectId}/measurements/${measurementId}`);
    },
    onSuccess: () => {
      refetchAllData();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Failed to delete measurement');
    },
  });

  // Generate Draft Bill Mutation
  const generateBillMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/projects/${projectId}/billing`, {});
    },
    onSuccess: () => {
      refetchBills();
      refetchCostControl();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Failed to generate bill');
    },
  });

  // Approve Bill Mutation
  const approveBillMutation = useMutation({
    mutationFn: async (billId: string) => {
      return api.patch(`/projects/${projectId}/billing/${billId}/approve`);
    },
    onSuccess: () => {
      refetchBills();
      refetchCostControl();
    },
  });

  if (isProjectLoading || !project) {
    return (
      <div className="min-h-screen bg-erp-bg">
        <Header breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Project Workspace' }]} onToggleSidebar={() => setSidebarOpen(true)} />
        <div className="p-8 text-center text-sm text-erp-text-muted">Loading Project Workspace...</div>
      </div>
    );
  }

  const boqItems = boqData?.items || [];
  const boq = boqData?.boq;

  const tabs = [
    { key: 'overview' as const, label: 'Overview', icon: Info },
    { key: 'boq' as const, label: 'BOQ / Abstract', icon: FileSpreadsheet },
    { key: 'measurements' as const, label: 'Measurements', icon: Ruler },
    { key: 'materials' as const, label: 'Bill of Materials', icon: Package },
    { key: 'manpower' as const, label: 'Bill of Manpower', icon: Users2 },
    { key: 'machinery' as const, label: 'Bill of Machinery', icon: Truck },
    { key: 'cost_control' as const, label: 'Cost Control', icon: LineChart },
    { key: 'billing' as const, label: 'Running Bills', icon: Receipt },
  ];

  // Handlers
  const handleCreateCustomBoqItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemCode || !customItemDesc || !customItemQty || !customItemRate) {
      alert('Please fill in all required fields');
      return;
    }
    addBoqItemMutation.mutate({
      itemCode: customItemCode,
      description: customItemDesc,
      unit: customItemUnit,
      quantity: Number(customItemQty),
      rate: Number(customItemRate),
    });
  };

  const handleAddSorItemToBoq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSorItem || !sorItemQty) {
      alert('Please select an SOR item and specify quantity');
      return;
    }
    addBoqItemMutation.mutate({
      sorItemId: selectedSorItem._id,
      quantity: Number(sorItemQty),
      rate: sorCustomRate !== '' ? Number(sorCustomRate) : selectedSorItem.rate,
    });
  };



  return (
    <div>
      <Header
        breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Project', path: '/' }, { label: project.name }]}
        onToggleSidebar={() => setSidebarOpen(true)}
      />

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Project Profile Banner */}
        <div className="glass-panel rounded-2xl p-6 border border-erp-border relative overflow-hidden shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-white flex items-center justify-center shrink-0 shadow-glow">
                <Building2 className="w-7 h-7" />
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-erp-text tracking-tight">{project.name}</h1>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {project.code}
                  </span>
                  <span className="capitalize text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    {project.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 mt-2 flex-wrap text-xs text-erp-text-muted">
                  {project.clientName && <span>Client: {project.clientName}</span>}
                  {project.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{project.location}</span>
                    </span>
                  )}
                  <span>{project.phases} Phases</span>
                  <span>{formatDate(project.startDate)} to {formatDate(project.endDate)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 border-t lg:border-t-0 lg:border-l border-erp-border pt-4 lg:pt-0 lg:pl-6">
              <div>
                <span className="text-[11px] text-erp-text-subtle uppercase block font-mono">Contract Value</span>
                <span className="text-xl font-bold text-erp-text">
                  {formatCurrency(project.contractValue || project.estimatedValue, project.currency)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-erp-text-subtle uppercase block font-mono">Overall Progress</span>
                <span className="text-xl font-bold text-blue-400">{project.progress}%</span>
              </div>
            </div>
          </div>

          {/* Module Navigation Tabs */}
          <div className="mt-6 pt-4 border-t border-erp-border/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150',
                  activeTab === t.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-erp-text-muted hover:text-erp-text hover:bg-slate-800'
                )}
              >
                <t.icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ======================================================================
            TAB 1: OVERVIEW
           ====================================================================== */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-panel rounded-xl p-6 border border-erp-border space-y-4">
              <h3 className="text-base font-semibold text-erp-text">Project Scope & Engineering Summary</h3>
              <p className="text-sm text-erp-text-muted leading-relaxed whitespace-pre-wrap">
                {project.description || 'No specific scope narrative documented.'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-erp-border/60 text-xs">
                <div>
                  <span className="text-erp-text-subtle block">Project Type</span>
                  <span className="text-sm font-medium text-erp-text">{project.projectType}</span>
                </div>
                <div>
                  <span className="text-erp-text-subtle block">Estimated Value</span>
                  <span className="text-sm font-medium text-erp-text">{formatCurrency(project.estimatedValue, project.currency)}</span>
                </div>
                <div>
                  <span className="text-erp-text-subtle block">Contract Value</span>
                  <span className="text-sm font-medium text-erp-text">{formatCurrency(project.contractValue, project.currency)}</span>
                </div>
                <div>
                  <span className="text-erp-text-subtle block">Phases</span>
                  <span className="text-sm font-medium text-erp-text">{project.phases}</span>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-xl p-6 border border-erp-border space-y-4">
              <h3 className="text-base font-semibold text-erp-text">Module Readiness</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-erp-border">
                  <span className="text-erp-text">BOQ Items</span>
                  <span className="font-bold text-blue-400">{boqItems.length}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-erp-border">
                  <span className="text-erp-text">Approved Measurements</span>
                  <span className="font-bold text-emerald-400">{measurements.length}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-erp-border">
                  <span className="text-erp-text">Running Bills</span>
                  <span className="font-bold text-purple-400">{runningBills.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================
            TAB 2: BOQ / ABSTRACT
           ====================================================================== */}
        {activeTab === 'boq' && (
          <div className="space-y-4">
            {/* BOQ Header Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-erp-text">Bill of Quantities (BOQ) & Abstract</h3>
                <p className="text-xs text-erp-text-muted">
                  Schedule items with immutable SOR rate snapshots and automated measurement-driven quantity amounts.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingMeasurement(null);
                    setInitialBoqItemForMeasurement(null);
                    setIsSmartMeasurementModalOpen(true);
                  }}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Add Measurement / Item
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddBoqModalOpen(true)}
                  leftIcon={<Settings2 className="w-4 h-4 text-blue-400" />}
                >
                  Add Custom Item
                </Button>
              </div>
            </div>

            {/* BOQ Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-panel p-4 rounded-xl border border-erp-border">
                <span className="text-xs text-erp-text-subtle uppercase block">Total BOQ Items</span>
                <span className="text-2xl font-bold text-erp-text">{boqItems.length}</span>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-erp-border">
                <span className="text-xs text-erp-text-subtle uppercase block">Total BOQ Value</span>
                <span className="text-2xl font-bold text-blue-400">
                  {formatCurrency(boq?.totalBoqValue || 0, project.currency)}
                </span>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-erp-border">
                <span className="text-xs text-erp-text-subtle uppercase block">Status</span>
                <span className="text-lg font-bold text-emerald-400">{boq?.status || 'Draft'}</span>
              </div>
            </div>

            {/* Single Source of Truth Banner */}
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 text-xs text-blue-300">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  <strong>Measurement-Driven BOQ:</strong> Item quantities and amounts are derived directly from detailed measurements. Recording or editing measurements instantly cascades updates to BOQ, BOM, Manpower, and Machinery.
                </span>
              </div>
            </div>

            {/* BOQ Table */}
            <div className="glass-panel rounded-xl border border-erp-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-erp-text-muted border-b border-erp-border">
                    <tr>
                      <th className="py-3 px-3 w-12 text-center">#</th>
                      <th className="py-3 px-3 w-24">Code</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-3 w-16">Unit</th>
                      <th className="py-3 px-3 w-24 text-right">BOQ Qty</th>
                      <th className="py-3 px-3 w-24 text-right">Rate (₹)</th>
                      <th className="py-3 px-3 w-28 text-right">Amount (₹)</th>
                      <th className="py-3 px-3 w-24 text-right">Executed</th>
                      <th className="py-3 px-3 w-24 text-center">Progress</th>
                      <th className="py-3 px-3 w-24 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-erp-border/60">
                    {boqItems.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-erp-text-muted">
                          No BOQ items yet. Click "Add Measurement / Item" above to search DSR/SOR and enter dimensions.
                        </td>
                      </tr>
                    ) : (
                      boqItems.map((item, idx) => (
                        <tr key={item._id} className="hover:bg-slate-850/50 transition-colors">
                          <td className="py-3 px-3 text-center text-erp-text-subtle font-mono">{idx + 1}</td>
                          <td className="py-3 px-3 font-mono font-bold text-blue-400">
                            {item.itemCode}
                          </td>
                          <td className="py-3 px-4 text-erp-text max-w-sm">
                            <p className="line-clamp-2 font-medium">{item.description}</p>
                            {item.sorReference?.scheduleName && (
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                Snapshot: {item.sorReference.scheduleName} ({item.sorReference.version})
                              </span>
                            )}
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              {item.isDerivedFromMeasurement && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                  <Ruler className="w-2.5 h-2.5" /> Measurement Driven
                                </span>
                              )}
                              {item.rateAnalysisStatus === 'AVAILABLE' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedBoqItemForAnalysis(item);
                                    setIsRateAnalysisModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
                                  title="Click to view SOR/DAR breakdown composition"
                                >
                                  <Sparkles className="w-3 h-3 text-emerald-400" />
                                  DAR Active
                                </button>
                              )}
                              {item.rateAnalysisStatus === 'CUSTOM' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedBoqItemForAnalysis(item);
                                    setIsRateAnalysisModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 hover:bg-purple-500/25 transition-colors"
                                >
                                  Custom Analysis Active
                                </button>
                              )}
                              {(!item.rateAnalysisStatus || item.rateAnalysisStatus === 'NOT_AVAILABLE') && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedBoqItemForAnalysis(item);
                                    setIsRateAnalysisModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
                                  title="No rate analysis in database. Click to configure composition."
                                >
                                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                                  Analysis Not Available (Configure)
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-erp-text-muted">{item.unit}</td>
                          <td className="py-3 px-3 text-right font-semibold text-erp-text">{item.quantity}</td>
                          <td className="py-3 px-3 text-right text-erp-text">{formatCurrency(item.rate, 'INR')}</td>
                          <td className="py-3 px-3 text-right font-bold text-blue-400">{formatCurrency(item.amount, 'INR')}</td>
                          <td className="py-3 px-3 text-right font-semibold text-emerald-400">{item.executedQuantity}</td>
                          <td className="py-3 px-3 text-center">
                            <span className="text-[11px] font-bold text-blue-400">{item.progressPercent}%</span>
                            <div className="w-16 h-1 bg-slate-800 rounded-full mx-auto mt-1 overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${item.progressPercent}%` }} />
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => {
                                setEditingMeasurement(null);
                                setInitialBoqItemForMeasurement(item);
                                setIsSmartMeasurementModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-[11px] font-medium rounded bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white transition-colors inline-flex items-center gap-1"
                              title="Add new measurement for this item"
                            >
                              <Ruler className="w-3 h-3" />
                              Measure
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================
            TAB 3: MEASUREMENTS (MB)
           ====================================================================== */}
        {activeTab === 'measurements' && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-erp-text">Measurement Book (MB)</h3>
                <p className="text-xs text-erp-text-muted">
                  Single source of truth: Record dimensions to automatically compute BOQ, BOM, Manpower, and Machinery.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingMeasurement(null);
                    setInitialBoqItemForMeasurement(null);
                    setIsSmartMeasurementModalOpen(true);
                  }}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Record New Measurement
                </Button>
              </div>
            </div>

            {/* Dashboard Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="glass-panel p-3.5 rounded-xl border border-erp-border">
                <span className="text-[10px] text-erp-text-subtle uppercase block font-semibold">Total Measurements</span>
                <span className="text-xl font-bold text-erp-text mt-0.5 block">
                  {measurementSummary?.totalMeasurements ?? measurements.length}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">Active Entries</span>
              </div>
              <div className="glass-panel p-3.5 rounded-xl border border-erp-border">
                <span className="text-[10px] text-erp-text-subtle uppercase block font-semibold">Total BOQ Executed</span>
                <span className="text-xl font-bold text-blue-400 mt-0.5 block">
                  {formatCurrency(measurementSummary?.totalBoqAmount ?? 0, 'INR')}
                </span>
                <span className="text-[10px] text-blue-300/70 mt-1 block">Value of Work</span>
              </div>
              <div className="glass-panel p-3.5 rounded-xl border border-erp-border">
                <span className="text-[10px] text-erp-text-subtle uppercase block font-semibold">Material Cost</span>
                <span className="text-xl font-bold text-emerald-400 mt-0.5 block">
                  {formatCurrency(measurementSummary?.totalMaterialCost ?? 0, 'INR')}
                </span>
                <span className="text-[10px] text-emerald-300/70 mt-1 block">BOM Consumption</span>
              </div>
              <div className="glass-panel p-3.5 rounded-xl border border-erp-border">
                <span className="text-[10px] text-erp-text-subtle uppercase block font-semibold">Labour Cost</span>
                <span className="text-xl font-bold text-amber-400 mt-0.5 block">
                  {formatCurrency(measurementSummary?.totalManpowerCost ?? 0, 'INR')}
                </span>
                <span className="text-[10px] text-amber-300/70 mt-1 block">Manpower Wages</span>
              </div>
              <div className="glass-panel p-3.5 rounded-xl border border-erp-border">
                <span className="text-[10px] text-erp-text-subtle uppercase block font-semibold">Machinery Cost</span>
                <span className="text-xl font-bold text-purple-400 mt-0.5 block">
                  {formatCurrency(measurementSummary?.totalMachineryCost ?? 0, 'INR')}
                </span>
                <span className="text-[10px] text-purple-300/70 mt-1 block">Plant & Equipment</span>
              </div>
              <div className="glass-panel p-3.5 rounded-xl border border-erp-border bg-gradient-to-br from-blue-950/20 to-slate-900/60">
                <span className="text-[10px] text-erp-text-subtle uppercase block font-semibold">Total Direct Cost</span>
                <span className="text-xl font-bold text-cyan-400 mt-0.5 block">
                  {formatCurrency(measurementSummary?.totalProjectCost ?? 0, 'INR')}
                </span>
                <span className="text-[10px] text-cyan-300/70 mt-1 block">Direct Execution</span>
              </div>
            </div>

            {/* Single Source of Truth Banner */}
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 text-xs text-blue-300">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  <strong>Measurement is Single Source of Truth:</strong> Adding, editing, duplicating, or reversing an entry updates the Measurement Book, BOQ item quantity, Bill of Materials, Bill of Manpower, and Bill of Machinery simultaneously.
                </span>
              </div>
            </div>

            {/* Measurement List */}
            <div className="glass-panel rounded-xl border border-erp-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-erp-text-muted border-b border-erp-border">
                    <tr>
                      <th className="py-3 px-3 w-24">Date</th>
                      <th className="py-3 px-3 w-28">Item Code</th>
                      <th className="py-3 px-4">Description / Location</th>
                      <th className="py-3 px-2 text-center">Formula</th>
                      <th className="py-3 px-2 text-center">Nos</th>
                      <th className="py-3 px-2 text-center">L (m)</th>
                      <th className="py-3 px-2 text-center">W / B (m)</th>
                      <th className="py-3 px-2 text-center">H / D (m)</th>
                      <th className="py-3 px-3 text-right font-semibold">Entry Qty</th>
                      <th className="py-3 px-3 text-right font-semibold">Cumulative</th>
                      <th className="py-3 px-3 text-right font-semibold">Item Amount (₹)</th>
                      <th className="py-3 px-2 text-center">Status</th>
                      <th className="py-3 px-3 text-center w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-erp-border/60">
                    {measurements.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="py-12 text-center text-erp-text-muted">
                          No measurement entries recorded yet. Click "Record New Measurement" above to get started.
                        </td>
                      </tr>
                    ) : (
                      measurements.map((m) => {
                        const entry = m.entries[0] || {};
                        const item = m.boqItemId;
                        const itemRate = m.unitRate ?? (typeof item === 'object' ? item?.rate : 0) ?? 0;
                        const itemAmount = m.amount ?? (m.totalQuantity * itemRate);

                        return (
                          <tr key={m._id} className={cn('hover:bg-slate-850/50 transition-colors', m.isReversed && 'opacity-60 bg-red-950/10')}>
                            <td className="py-3 px-3 font-mono text-erp-text-muted">{formatDate(m.measurementDate)}</td>
                            <td className="py-3 px-3 font-mono font-bold text-blue-400">
                              {m.sourceItemCode || (typeof item === 'object' ? item?.itemCode : 'BOQ Item')}
                            </td>
                            <td className="py-3 px-4 text-erp-text max-w-xs">
                              <p className={cn('font-medium', m.isReversed && 'line-through text-slate-400')}>{entry.description}</p>
                              {entry.location && (
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {entry.location} {entry.levelFloor ? `• ${entry.levelFloor}` : ''}
                                </p>
                              )}
                              {m.isReversed && m.reversalReason && (
                                <p className="text-[10px] text-red-400 mt-0.5">
                                  <strong>Reversal Note:</strong> {m.reversalReason}
                                </p>
                              )}
                            </td>
                            <td className="py-3 px-2 text-center font-mono text-slate-400">{entry.formula || 'LxWxH'}</td>
                            <td className="py-3 px-2 text-center font-mono">{entry.nos || 1}</td>
                            <td className="py-3 px-2 text-center font-mono">{entry.length || '-'}</td>
                            <td className="py-3 px-2 text-center font-mono">{entry.width || entry.breadth || '-'}</td>
                            <td className="py-3 px-2 text-center font-mono">{entry.heightDepth || entry.height || entry.depth || '-'}</td>
                            <td className="py-3 px-3 text-right font-bold text-emerald-400">
                              {m.totalQuantity} {entry.unit}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-slate-300">
                              {m.cumulativeQuantity ? `${m.cumulativeQuantity} ${entry.unit}` : `${m.totalQuantity} ${entry.unit}`}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-blue-400">
                              {formatCurrency(itemAmount, 'INR')}
                            </td>
                            <td className="py-3 px-2 text-center">
                              {m.isReversed ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-red-500/20 text-red-300 border border-red-500/30" title={m.reversalReason || 'Reversed'}>
                                  Reversed
                                </span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  {m.status || 'Approved'}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {!m.isReversed && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingMeasurement(m);
                                        setInitialBoqItemForMeasurement(null);
                                        setIsSmartMeasurementModalOpen(true);
                                      }}
                                      className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                                      title="Edit measurement & recalculate all downstream resources"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => duplicateMeasurementMutation.mutate(m._id)}
                                      disabled={duplicateMeasurementMutation.isPending}
                                      className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                      title="Duplicate measurement entry"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (m.status === 'Approved') {
                                          setReversalModalMeasurement(m);
                                          setReversalReason('');
                                        } else {
                                          if (confirm('Are you sure you want to delete this measurement? All derived resources will be adjusted.')) {
                                            deleteMeasurementMutation.mutate(m._id);
                                          }
                                        }
                                      }}
                                      className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                      title={m.status === 'Approved' ? 'Audit-compliant reversal' : 'Delete measurement'}
                                    >
                                      {m.status === 'Approved' ? <RotateCcw className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================
            TAB 4: BILL OF MATERIALS (BOM)
           ====================================================================== */}
        {activeTab === 'materials' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-erp-text">Bill of Materials (BOM)</h3>
                <p className="text-xs text-erp-text-muted">
                  Material requirements and executed consumption auto-calculated from BOQ & approved measurements.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setEditingMeasurement(null);
                  setInitialBoqItemForMeasurement(null);
                  setIsSmartMeasurementModalOpen(true);
                }}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Record Measurement
              </Button>
            </div>

            {/* Auto-Calculation Notification Banner */}
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-2.5 text-xs text-blue-300">
              <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                <strong>Auto-Synchronized with Measurements:</strong> Material requirements and executed costs are computed directly from Measurement Book entries using CPWD SOR/DAR consumption norms. Click "Drill-down" on any row to trace mathematical derivation.
              </span>
            </div>

            <div className="glass-panel rounded-xl border border-erp-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-erp-text-muted border-b border-erp-border">
                    <tr>
                      <th className="py-3 px-3">Material Name</th>
                      <th className="py-3 px-3">Linked BOQ Item</th>
                      <th className="py-3 px-2 text-right">Coeff</th>
                      <th className="py-3 px-2 text-right">Planned Qty</th>
                      <th className="py-3 px-3 text-right font-semibold">Executed Qty</th>
                      <th className="py-3 px-2 text-right">Balance</th>
                      <th className="py-3 px-2 text-right">Rate (₹)</th>
                      <th className="py-3 px-3 text-right font-semibold">Executed Cost (₹)</th>
                      <th className="py-3 px-3 text-center w-24">Trace</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-erp-border/60">
                    {bomItems.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-erp-text-muted">
                          No BOM items registered for this project. Measurements on DSR/SOR items will automatically generate and populate this list.
                        </td>
                      </tr>
                    ) : (
                      bomItems.map((bom) => (
                        <tr key={bom._id} className="hover:bg-slate-850/50 transition-colors">
                          <td className="py-3 px-3 font-semibold text-erp-text">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span>{bom.materialName}</span>
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <Sparkles className="w-2.5 h-2.5" /> DAR Auto
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-blue-400 font-semibold">
                            {bom.boqItemId?.itemCode || 'BOQ Item'}
                          </td>
                          <td className="py-3 px-2 text-right font-mono text-slate-400">{bom.coefficient}</td>
                          <td className="py-3 px-2 text-right text-slate-300">
                            {bom.plannedQuantity ?? bom.requiredQuantity} {bom.unit}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-400">
                            {bom.executedQuantity ?? 0} {bom.unit}
                          </td>
                          <td className="py-3 px-2 text-right text-slate-400 font-mono">
                            {bom.balanceQuantity ?? bom.requiredQuantity} {bom.unit}
                          </td>
                          <td className="py-3 px-2 text-right">{formatCurrency(bom.unitRate, 'INR')}</td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-400">
                            {formatCurrency(bom.executedAmount ?? 0, 'INR')}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setDrilldownResourceType('MATERIAL');
                                setDrilldownItem(bom);
                                setIsResourceDrilldownOpen(true);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-2 py-1 rounded transition-colors"
                              title="View mathematical derivation and contributing measurement entries"
                            >
                              <Eye className="w-3 h-3" />
                              Drill-down
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================
            TAB 5: BILL OF MANPOWER
           ====================================================================== */}
        {activeTab === 'manpower' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-erp-text">Bill of Manpower</h3>
                <p className="text-xs text-erp-text-muted">
                  Labour productivity norms, mandays requirements, and executed wages computed dynamically from measurements.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setEditingMeasurement(null);
                  setInitialBoqItemForMeasurement(null);
                  setIsSmartMeasurementModalOpen(true);
                }}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Record Measurement
              </Button>
            </div>

            {/* Auto-Calculation Notification Banner */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2.5 text-xs text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Auto-Synchronized with Measurements:</strong> Executed mandays and wages update automatically from approved MB records without manual re-entry.
              </span>
            </div>

            <div className="glass-panel rounded-xl border border-erp-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-erp-text-muted border-b border-erp-border">
                    <tr>
                      <th className="py-3 px-3">Labour Category / Trade</th>
                      <th className="py-3 px-3">Linked BOQ Item</th>
                      <th className="py-3 px-2 text-right">Mandays Coeff</th>
                      <th className="py-3 px-2 text-right">Planned Days</th>
                      <th className="py-3 px-3 text-right font-semibold">Executed Days</th>
                      <th className="py-3 px-2 text-right">Balance Days</th>
                      <th className="py-3 px-2 text-right">Wage (₹)</th>
                      <th className="py-3 px-3 text-right font-semibold">Executed Wages (₹)</th>
                      <th className="py-3 px-3 text-center w-24">Trace</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-erp-border/60">
                    {manpowerItems.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-erp-text-muted">
                          No manpower requirements configured for this project. Measurements on DSR/SOR items will automatically generate and populate this list.
                        </td>
                      </tr>
                    ) : (
                      manpowerItems.map((mp) => (
                        <tr key={mp._id} className="hover:bg-slate-850/50 transition-colors">
                          <td className="py-3 px-3 font-semibold text-erp-text">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span>{mp.labourType}</span>
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                <Sparkles className="w-2.5 h-2.5" /> DAR Auto
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-blue-400 font-semibold">
                            {mp.boqItemId?.itemCode || 'BOQ Item'}
                          </td>
                          <td className="py-3 px-2 text-right font-mono text-slate-400">{mp.coefficient}</td>
                          <td className="py-3 px-2 text-right text-slate-300">
                            {mp.plannedManpower ?? mp.requiredManpower} Days
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-amber-400">
                            {mp.executedManpower ?? 0} Days
                          </td>
                          <td className="py-3 px-2 text-right text-slate-400 font-mono">
                            {mp.balanceManpower ?? mp.requiredManpower} Days
                          </td>
                          <td className="py-3 px-2 text-right">{formatCurrency(mp.unitRate, 'INR')}</td>
                          <td className="py-3 px-3 text-right font-bold text-amber-400">
                            {formatCurrency(mp.executedAmount ?? 0, 'INR')}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setDrilldownResourceType('LABOUR');
                                setDrilldownItem(mp);
                                setIsResourceDrilldownOpen(true);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 px-2 py-1 rounded transition-colors"
                              title="View mathematical derivation and contributing measurement entries"
                            >
                              <Eye className="w-3 h-3" />
                              Drill-down
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================
            TAB 6: BILL OF MACHINERY
           ====================================================================== */}
        {activeTab === 'machinery' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-erp-text">Bill of Machinery</h3>
                <p className="text-xs text-erp-text-muted">
                  Heavy plant, equipment operational hours, and executed machinery costs derived from measurements.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setEditingMeasurement(null);
                  setInitialBoqItemForMeasurement(null);
                  setIsSmartMeasurementModalOpen(true);
                }}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Record Measurement
              </Button>
            </div>

            {/* Auto-Calculation Notification Banner */}
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-2.5 text-xs text-purple-300">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                <strong>Auto-Synchronized with Measurements:</strong> Equipment hours and plant costs are derived directly from approved measurements using CPWD equipment productivity norms.
              </span>
            </div>

            <div className="glass-panel rounded-xl border border-erp-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-erp-text-muted border-b border-erp-border">
                    <tr>
                      <th className="py-3 px-3">Equipment / Machine</th>
                      <th className="py-3 px-3">Linked BOQ Item</th>
                      <th className="py-3 px-2 text-right">Hours Coeff</th>
                      <th className="py-3 px-2 text-right">Planned Hours</th>
                      <th className="py-3 px-3 text-right font-semibold">Executed Hours</th>
                      <th className="py-3 px-2 text-right">Balance Hours</th>
                      <th className="py-3 px-2 text-right">Hourly Rate (₹)</th>
                      <th className="py-3 px-3 text-right font-semibold">Executed Cost (₹)</th>
                      <th className="py-3 px-3 text-center w-24">Trace</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-erp-border/60">
                    {machineryItems.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-erp-text-muted">
                          No machinery requirements configured for this project. Measurements on DSR/SOR items will automatically generate and populate this list.
                        </td>
                      </tr>
                    ) : (
                      machineryItems.map((mac) => (
                        <tr key={mac._id} className="hover:bg-slate-850/50 transition-colors">
                          <td className="py-3 px-3 font-semibold text-erp-text">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span>{mac.machineryType}</span>
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">
                                <Sparkles className="w-2.5 h-2.5" /> DAR Auto
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-blue-400 font-semibold">
                            {mac.boqItemId?.itemCode || 'BOQ Item'}
                          </td>
                          <td className="py-3 px-2 text-right font-mono text-slate-400">{mac.coefficient}</td>
                          <td className="py-3 px-2 text-right text-slate-300">
                            {mac.plannedHours ?? mac.requiredHours} Hrs
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-purple-400">
                            {mac.executedHours ?? 0} Hrs
                          </td>
                          <td className="py-3 px-2 text-right text-slate-400 font-mono">
                            {mac.balanceHours ?? mac.requiredHours} Hrs
                          </td>
                          <td className="py-3 px-2 text-right">{formatCurrency(mac.unitRate, 'INR')}</td>
                          <td className="py-3 px-3 text-right font-bold text-purple-400">
                            {formatCurrency(mac.executedAmount ?? 0, 'INR')}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setDrilldownResourceType('MACHINERY');
                                setDrilldownItem(mac);
                                setIsResourceDrilldownOpen(true);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 px-2 py-1 rounded transition-colors"
                              title="View mathematical derivation and contributing measurement entries"
                            >
                              <Eye className="w-3 h-3" />
                              Drill-down
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================
            TAB 7: COST CONTROL
           ====================================================================== */}
        {activeTab === 'cost_control' && costControl && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-erp-text">Project Cost Control & Variance</h3>
              <p className="text-xs text-erp-text-muted">
                Executive financial health aggregating BOQ, executed work, resource consumption and approved billing.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="glass-panel p-4 rounded-xl border border-erp-border">
                <span className="text-xs text-erp-text-subtle uppercase block">Contract Value</span>
                <span className="text-xl font-bold text-erp-text">{formatCurrency(costControl.contractValue, costControl.currency)}</span>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-erp-border">
                <span className="text-xs text-erp-text-subtle uppercase block">BOQ Total Value</span>
                <span className="text-xl font-bold text-blue-400">{formatCurrency(costControl.boqValue, costControl.currency)}</span>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-erp-border">
                <span className="text-xs text-erp-text-subtle uppercase block">Executed Work Value</span>
                <span className="text-xl font-bold text-emerald-400">{formatCurrency(costControl.executedValue, costControl.currency)}</span>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-erp-border">
                <span className="text-xs text-erp-text-subtle uppercase block">Total Billed to Date</span>
                <span className="text-xl font-bold text-purple-400">{formatCurrency(costControl.billedTotal, costControl.currency)}</span>
              </div>
            </div>

            {/* Direct Cost Breakdown */}
            <div className="glass-panel p-6 rounded-xl border border-erp-border space-y-4">
              <h4 className="text-sm font-semibold text-erp-text uppercase tracking-wider">Estimated Direct Cost Breakdown</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 rounded-lg bg-slate-900 border border-erp-border">
                  <span className="text-erp-text-muted block mb-1">Materials Cost (BOM)</span>
                  <span className="text-base font-bold text-erp-text">{formatCurrency(costControl.materialCost, costControl.currency)}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-erp-border">
                  <span className="text-erp-text-muted block mb-1">Manpower / Labour Cost</span>
                  <span className="text-base font-bold text-erp-text">{formatCurrency(costControl.manpowerCost, costControl.currency)}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-erp-border">
                  <span className="text-erp-text-muted block mb-1">Machinery / Equipment Cost</span>
                  <span className="text-base font-bold text-erp-text">{formatCurrency(costControl.machineryCost, costControl.currency)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================
            TAB 8: RUNNING BILLS (RA BILLS)
           ====================================================================== */}
        {activeTab === 'billing' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-erp-text">Running Account (RA) Bills</h3>
                <p className="text-xs text-erp-text-muted">
                  Client and contractor running bills computed directly from approved executed quantities.
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => generateBillMutation.mutate()}
                isLoading={generateBillMutation.isPending}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Generate Next RA Bill
              </Button>
            </div>

            {/* Running Bills List */}
            <div className="space-y-4">
              {runningBills.length === 0 ? (
                <div className="glass-panel p-12 text-center text-erp-text-muted rounded-xl border border-erp-border">
                  No Running Bills generated yet. Click "Generate Next RA Bill" above to draft a bill from approved measurements.
                </div>
              ) : (
                runningBills.map((bill) => (
                  <div key={bill._id} className="glass-panel rounded-xl border border-erp-border p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-erp-border/60">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-bold text-blue-400">{bill.billNumber}</span>
                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${
                              bill.status === 'Approved'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {bill.status}
                          </span>
                        </div>
                        <p className="text-xs text-erp-text-muted mt-0.5">
                          Date: {formatDate(bill.billDate)} | Items: {bill.items.length}
                        </p>
                      </div>

                      <div className="flex items-center gap-6">
                        <div>
                          <span className="text-[11px] text-erp-text-subtle uppercase block">Current Bill Amount</span>
                          <span className="text-lg font-bold text-erp-text">{formatCurrency(bill.totalCurrentAmount, 'INR')}</span>
                        </div>
                        <div>
                          <span className="text-[11px] text-erp-text-subtle uppercase block">Cumulative Billed</span>
                          <span className="text-lg font-bold text-blue-400">{formatCurrency(bill.totalCumulativeAmount, 'INR')}</span>
                        </div>
                        {bill.status !== 'Approved' && (
                          <Button
                            size="sm"
                            onClick={() => approveBillMutation.mutate(bill._id)}
                            isLoading={approveBillMutation.isPending}
                            leftIcon={<CheckCircle2 className="w-4 h-4" />}
                          >
                            Approve Bill
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Detailed Bill Items */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900/60 text-erp-text-muted">
                          <tr>
                            <th className="py-2 px-3">Item Code</th>
                            <th className="py-2 px-3">Description</th>
                            <th className="py-2 px-2 text-right">BOQ Qty</th>
                            <th className="py-2 px-2 text-right">Prev Qty</th>
                            <th className="py-2 px-2 text-right">Current Qty</th>
                            <th className="py-2 px-2 text-right">Cumul Qty</th>
                            <th className="py-2 px-3 text-right">Current Amt (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-erp-border/40">
                          {bill.items.map((it, idx) => (
                            <tr key={idx} className="hover:bg-slate-850/30">
                              <td className="py-2 px-3 font-mono text-blue-400 font-semibold">{it.itemCode}</td>
                              <td className="py-2 px-3 text-erp-text max-w-xs truncate">{it.description}</td>
                              <td className="py-2 px-2 text-right">{it.boqQuantity}</td>
                              <td className="py-2 px-2 text-right text-slate-400">{it.previouslyBilledQuantity}</td>
                              <td className="py-2 px-2 text-right font-bold text-emerald-400">{it.currentQuantity}</td>
                              <td className="py-2 px-2 text-right font-semibold">{it.cumulativeQuantity}</td>
                              <td className="py-2 px-3 text-right font-bold text-erp-text">{formatCurrency(it.currentAmount, 'INR')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ======================================================================
          MODALS
         ====================================================================== */}
      {/* 1. Modal: Add Custom BOQ Item */}
      <Modal isOpen={isAddBoqModalOpen} onClose={() => setIsAddBoqModalOpen(false)} title="Add Custom BOQ Item" maxWidth="md">
        <form onSubmit={handleCreateCustomBoqItem} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-erp-text mb-1">Item Code *</label>
            <input
              type="text"
              value={customItemCode}
              onChange={(e) => setCustomItemCode(e.target.value)}
              placeholder="e.g. 5.1.2 or CUST-01"
              required
              className="w-full px-3 py-2 bg-slate-900 border border-erp-border rounded-lg text-sm text-erp-text"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-erp-text mb-1">Description *</label>
            <textarea
              rows={3}
              value={customItemDesc}
              onChange={(e) => setCustomItemDesc(e.target.value)}
              placeholder="Detailed construction specifications"
              required
              className="w-full px-3 py-2 bg-slate-900 border border-erp-border rounded-lg text-sm text-erp-text"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-erp-text mb-1">Unit *</label>
              <input
                type="text"
                value={customItemUnit}
                onChange={(e) => setCustomItemUnit(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-erp-border rounded-lg text-sm text-erp-text"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-erp-text mb-1">Quantity *</label>
              <input
                type="number"
                min={0}
                value={customItemQty}
                onChange={(e) => setCustomItemQty(e.target.value === '' ? '' : Number(e.target.value))}
                required
                className="w-full px-3 py-2 bg-slate-900 border border-erp-border rounded-lg text-sm text-erp-text"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-erp-text mb-1">Rate (₹) *</label>
              <input
                type="number"
                min={0}
                value={customItemRate}
                onChange={(e) => setCustomItemRate(e.target.value === '' ? '' : Number(e.target.value))}
                required
                className="w-full px-3 py-2 bg-slate-900 border border-erp-border rounded-lg text-sm text-erp-text"
              />
            </div>
          </div>
          <div className="pt-3 border-t border-erp-border flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setIsAddBoqModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={addBoqItemMutation.isPending}>Add to BOQ</Button>
          </div>
        </form>
      </Modal>

      {/* 2. Modal: Select Item from Rate Master / SOR */}
      <Modal isOpen={isSorSelectModalOpen} onClose={() => setIsSorSelectModalOpen(false)} title="Select from Rate Master (SOR)" maxWidth="xl">
        <form onSubmit={handleAddSorItemToBoq} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-erp-text-muted" />
            <input
              type="text"
              value={sorSearch}
              onChange={(e) => setSorSearch(e.target.value)}
              placeholder="Type to search CPWD / DSR standard items..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-erp-border rounded-lg text-sm text-erp-text"
            />
          </div>

          <div className="border border-erp-border rounded-lg max-h-56 overflow-y-auto divide-y divide-erp-border/60">
            {sorResults.map((item) => (
              <div
                key={item._id}
                onClick={() => setSelectedSorItem(item)}
                className={`p-3 cursor-pointer transition-colors text-xs flex items-start justify-between gap-3 ${
                  selectedSorItem?._id === item._id ? 'bg-blue-600/20 border-l-2 border-blue-500' : 'hover:bg-slate-850/50'
                }`}
              >
                <div>
                  <span className="font-mono font-bold text-blue-400 mr-2">{item.itemCode}</span>
                  <span className="font-medium text-erp-text">{item.descriptionEnglish}</span>
                  <span className="text-erp-text-subtle block mt-0.5">{item.chapter}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-erp-text">{formatCurrency(item.rate, 'INR')}</span>
                  <span className="text-erp-text-muted block">per {item.unit}</span>
                </div>
              </div>
            ))}
          </div>

          {selectedSorItem && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs space-y-3">
              <p className="font-semibold text-blue-300">
                Selected: {selectedSorItem.itemCode} - {selectedSorItem.descriptionEnglish.slice(0, 60)}...
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-erp-text mb-1">Project Quantity ({selectedSorItem.unit}) *</label>
                  <input
                    type="number"
                    min={0.01}
                    step="any"
                    value={sorItemQty}
                    onChange={(e) => setSorItemQty(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                    placeholder="e.g. 500"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-erp-border rounded text-sm text-erp-text"
                  />
                </div>
                <div>
                  <label className="block font-medium text-erp-text mb-1">Snapshot Rate (₹) [Default: {selectedSorItem.rate}]</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={sorCustomRate}
                    onChange={(e) => setSorCustomRate(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={String(selectedSorItem.rate)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-erp-border rounded text-sm text-erp-text"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-erp-border flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setIsSorSelectModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={!selectedSorItem || !sorItemQty} isLoading={addBoqItemMutation.isPending}>
              Snapshot & Add to BOQ
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. Modal: Smart Measurement Engine Modal */}
      <SmartMeasurementModal
        isOpen={isSmartMeasurementModalOpen}
        onClose={() => {
          setIsSmartMeasurementModalOpen(false);
          setEditingMeasurement(null);
          setInitialBoqItemForMeasurement(null);
        }}
        projectId={projectId || ''}
        onSuccess={refetchAllData}
        editingMeasurement={editingMeasurement}
        initialBoqItem={initialBoqItemForMeasurement}
      />

      {/* 4. Modal: Resource Mathematical Drilldown Modal */}
      <ResourceDrilldownModal
        isOpen={isResourceDrilldownOpen}
        onClose={() => {
          setIsResourceDrilldownOpen(false);
          setDrilldownItem(null);
        }}
        resourceType={drilldownResourceType}
        item={drilldownItem}
        projectId={projectId || ''}
      />

      {/* 7. Modal: Rate Analysis Inspection & Custom Configuration */}
      <Modal
        isOpen={isRateAnalysisModalOpen}
        onClose={() => {
          setIsRateAnalysisModalOpen(false);
          setSelectedBoqItemForAnalysis(null);
        }}
        title={`Rate Analysis: ${selectedBoqItemForAnalysis?.itemCode || 'BOQ Item'}`}
        maxWidth="2xl"
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {isAnalysisLoading ? (
            <div className="p-8 text-center text-sm text-erp-text-muted">Loading composition breakdown...</div>
          ) : !currentAnalysisDetail ? (
            <div className="p-8 text-center text-sm text-erp-text-muted">No rate analysis data found.</div>
          ) : (
            <>
              {/* Item Overview Header */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-erp-border space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-blue-400">{currentAnalysisDetail.itemCode}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      Unit: {currentAnalysisDetail.unit}
                    </span>
                  </div>
                  <div>
                    {currentAnalysisDetail.rateAnalysisStatus === 'AVAILABLE' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <Sparkles className="w-3 h-3" /> Standard CPWD DAR Active
                      </span>
                    )}
                    {currentAnalysisDetail.rateAnalysisStatus === 'CUSTOM' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">
                        Custom User Analysis Active
                      </span>
                    )}
                    {currentAnalysisDetail.rateAnalysisStatus === 'NOT_AVAILABLE' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <AlertTriangle className="w-3 h-3" /> Analysis Not in DAR Database
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-erp-text font-medium">{currentAnalysisDetail.description}</p>
              </div>

              {/* Existing DAR / Active Breakdown */}
              {currentAnalysisDetail.analysis?.status === 'AVAILABLE' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-blue-400" /> Material Consumption Breakdown
                    </h4>
                    <div className="border border-erp-border rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900/80 text-erp-text-muted">
                          <tr>
                            <th className="py-2 px-3">Material Name</th>
                            <th className="py-2 px-2 text-right">Unit</th>
                            <th className="py-2 px-2 text-right">Coefficient</th>
                            <th className="py-2 px-3 text-right">DAR Rate (₹)</th>
                            <th className="py-2 px-3 text-right">Amount / Unit (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-erp-border/50">
                          {currentAnalysisDetail.analysis.materials.map((m, idx) => (
                            <tr key={idx} className="hover:bg-slate-850/40">
                              <td className="py-2 px-3 font-medium text-erp-text">{m.name}</td>
                              <td className="py-2 px-2 text-right text-slate-400">{m.unit}</td>
                              <td className="py-2 px-2 text-right font-mono text-slate-300">{m.coefficient}</td>
                              <td className="py-2 px-3 text-right">{formatCurrency(m.unitRate, 'INR')}</td>
                              <td className="py-2 px-3 text-right font-semibold text-emerald-400">
                                {formatCurrency(m.coefficient * m.unitRate, 'INR')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Users2 className="w-3.5 h-3.5 text-amber-400" /> Labour Productivity Norms
                    </h4>
                    <div className="border border-erp-border rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900/80 text-erp-text-muted">
                          <tr>
                            <th className="py-2 px-3">Trade / Category</th>
                            <th className="py-2 px-2 text-right">Unit</th>
                            <th className="py-2 px-2 text-right">Mandays Coeff</th>
                            <th className="py-2 px-3 text-right">Wage Rate (₹)</th>
                            <th className="py-2 px-3 text-right">Cost / Unit (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-erp-border/50">
                          {currentAnalysisDetail.analysis.labour.map((l, idx) => (
                            <tr key={idx} className="hover:bg-slate-850/40">
                              <td className="py-2 px-3 font-medium text-erp-text">{l.name}</td>
                              <td className="py-2 px-2 text-right text-slate-400">{l.unit}</td>
                              <td className="py-2 px-2 text-right font-mono text-slate-300">{l.coefficient}</td>
                              <td className="py-2 px-3 text-right">{formatCurrency(l.unitRate, 'INR')}</td>
                              <td className="py-2 px-3 text-right font-semibold text-amber-400">
                                {formatCurrency(l.coefficient * l.unitRate, 'INR')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-purple-400" /> Machinery & Equipment Norms
                    </h4>
                    <div className="border border-erp-border rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900/80 text-erp-text-muted">
                          <tr>
                            <th className="py-2 px-3">Equipment / Machine</th>
                            <th className="py-2 px-2 text-right">Unit</th>
                            <th className="py-2 px-2 text-right">Hours Coeff</th>
                            <th className="py-2 px-3 text-right">Hire Rate (₹)</th>
                            <th className="py-2 px-3 text-right">Cost / Unit (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-erp-border/50">
                          {currentAnalysisDetail.analysis.machinery.map((m, idx) => (
                            <tr key={idx} className="hover:bg-slate-850/40">
                              <td className="py-2 px-3 font-medium text-erp-text">{m.name}</td>
                              <td className="py-2 px-2 text-right text-slate-400">{m.unit}</td>
                              <td className="py-2 px-2 text-right font-mono text-slate-300">{m.coefficient}</td>
                              <td className="py-2 px-3 text-right">{formatCurrency(m.unitRate, 'INR')}</td>
                              <td className="py-2 px-3 text-right font-semibold text-purple-400">
                                {formatCurrency(m.coefficient * m.unitRate, 'INR')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Composition Editor (For missing DAR or customized adjustments) */}
              <div className="pt-4 border-t border-erp-border space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-erp-text uppercase tracking-wider flex items-center gap-1.5">
                      <Settings2 className="w-4 h-4 text-blue-400" /> Custom Composition Configurator
                    </h4>
                    <p className="text-[11px] text-erp-text-muted">
                      Define or override material, labour, and machinery rates for this BOQ item. Saving will instantly cascade and recalculate all execution resources.
                    </p>
                  </div>
                </div>

                {/* Custom Materials Section */}
                <div className="p-3 bg-slate-900/60 rounded-xl border border-erp-border space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-blue-300">Custom Materials</span>
                    <button
                      type="button"
                      onClick={() =>
                        setCustomMaterialsList((prev) => [
                          ...prev,
                          { name: '', unit: 'cum', coefficient: 1, unitRate: 0 },
                        ])
                      }
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Material
                    </button>
                  </div>
                  {customMaterialsList.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic">No custom materials added yet.</p>
                  ) : (
                    customMaterialsList.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs">
                        <input
                          type="text"
                          placeholder="Material Name"
                          value={row.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomMaterialsList((prev) => prev.map((item, i) => (i === idx ? { ...item, name: val } : item)));
                          }}
                          className="col-span-4 px-2 py-1 bg-slate-900 border border-erp-border rounded text-xs text-erp-text"
                        />
                        <input
                          type="text"
                          placeholder="Unit"
                          value={row.unit}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomMaterialsList((prev) => prev.map((item, i) => (i === idx ? { ...item, unit: val } : item)));
                          }}
                          className="col-span-2 px-2 py-1 bg-slate-900 border border-erp-border rounded text-xs text-erp-text"
                        />
                        <input
                          type="number"
                          step="any"
                          placeholder="Coeff"
                          value={row.coefficient}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCustomMaterialsList((prev) => prev.map((item, i) => (i === idx ? { ...item, coefficient: val } : item)));
                          }}
                          className="col-span-2 px-2 py-1 bg-slate-900 border border-erp-border rounded text-xs text-erp-text"
                        />
                        <input
                          type="number"
                          step="any"
                          placeholder="Rate"
                          value={row.unitRate}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCustomMaterialsList((prev) => prev.map((item, i) => (i === idx ? { ...item, unitRate: val } : item)));
                          }}
                          className="col-span-3 px-2 py-1 bg-slate-900 border border-erp-border rounded text-xs text-erp-text"
                        />
                        <button
                          type="button"
                          onClick={() => setCustomMaterialsList((prev) => prev.filter((_, i) => i !== idx))}
                          className="col-span-1 text-red-400 hover:text-red-300 p-1 flex justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Custom Labour Section */}
                <div className="p-3 bg-slate-900/60 rounded-xl border border-erp-border space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-300">Custom Labour</span>
                    <button
                      type="button"
                      onClick={() =>
                        setCustomLabourList((prev) => [
                          ...prev,
                          { name: '', unit: 'Day', coefficient: 0.2, unitRate: 0 },
                        ])
                      }
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Labour
                    </button>
                  </div>
                  {customLabourList.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic">No custom labour added yet.</p>
                  ) : (
                    customLabourList.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs">
                        <input
                          type="text"
                          placeholder="Labour Trade"
                          value={row.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomLabourList((prev) => prev.map((item, i) => (i === idx ? { ...item, name: val } : item)));
                          }}
                          className="col-span-4 px-2 py-1 bg-slate-900 border border-erp-border rounded text-xs text-erp-text"
                        />
                        <input
                          type="text"
                          placeholder="Unit"
                          value={row.unit}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomLabourList((prev) => prev.map((item, i) => (i === idx ? { ...item, unit: val } : item)));
                          }}
                          className="col-span-2 px-2 py-1 bg-slate-900 border border-erp-border rounded text-xs text-erp-text"
                        />
                        <input
                          type="number"
                          step="any"
                          placeholder="Coeff"
                          value={row.coefficient}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCustomLabourList((prev) => prev.map((item, i) => (i === idx ? { ...item, coefficient: val } : item)));
                          }}
                          className="col-span-2 px-2 py-1 bg-slate-900 border border-erp-border rounded text-xs text-erp-text"
                        />
                        <input
                          type="number"
                          step="any"
                          placeholder="Daily Wage"
                          value={row.unitRate}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCustomLabourList((prev) => prev.map((item, i) => (i === idx ? { ...item, unitRate: val } : item)));
                          }}
                          className="col-span-3 px-2 py-1 bg-slate-900 border border-erp-border rounded text-xs text-erp-text"
                        />
                        <button
                          type="button"
                          onClick={() => setCustomLabourList((prev) => prev.filter((_, i) => i !== idx))}
                          className="col-span-1 text-red-400 hover:text-red-300 p-1 flex justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Custom Machinery Section */}
                <div className="p-3 bg-slate-900/60 rounded-xl border border-erp-border space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-purple-300">Custom Machinery</span>
                    <button
                      type="button"
                      onClick={() =>
                        setCustomMachineryList((prev) => [
                          ...prev,
                          { name: '', unit: 'Hour', coefficient: 0.1, unitRate: 0 },
                        ])
                      }
                      className="text-[11px] text-purple-400 hover:text-purple-300 font-medium inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Machinery
                    </button>
                  </div>
                  {customMachineryList.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic">No custom machinery added yet.</p>
                  ) : (
                    customMachineryList.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs">
                        <input
                          type="text"
                          placeholder="Equipment Name"
                          value={row.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomMachineryList((prev) => prev.map((item, i) => (i === idx ? { ...item, name: val } : item)));
                          }}
                          className="col-span-4 px-2 py-1 bg-slate-900 border border-erp-border rounded text-xs text-erp-text"
                        />
                        <input
                          type="text"
                          placeholder="Unit"
                          value={row.unit}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomMachineryList((prev) => prev.map((item, i) => (i === idx ? { ...item, unit: val } : item)));
                          }}
                          className="col-span-2 px-2 py-1 bg-slate-900 border border-erp-border rounded text-xs text-erp-text"
                        />
                        <input
                          type="number"
                          step="any"
                          placeholder="Coeff"
                          value={row.coefficient}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCustomMachineryList((prev) => prev.map((item, i) => (i === idx ? { ...item, coefficient: val } : item)));
                          }}
                          className="col-span-2 px-2 py-1 bg-slate-900 border border-erp-border rounded text-xs text-erp-text"
                        />
                        <input
                          type="number"
                          step="any"
                          placeholder="Hourly Rate"
                          value={row.unitRate}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCustomMachineryList((prev) => prev.map((item, i) => (i === idx ? { ...item, unitRate: val } : item)));
                          }}
                          className="col-span-3 px-2 py-1 bg-slate-900 border border-erp-border rounded text-xs text-erp-text"
                        />
                        <button
                          type="button"
                          onClick={() => setCustomMachineryList((prev) => prev.filter((_, i) => i !== idx))}
                          className="col-span-1 text-red-400 hover:text-red-300 p-1 flex justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button
                    type="button"
                    disabled={
                      customMaterialsList.length === 0 &&
                      customLabourList.length === 0 &&
                      customMachineryList.length === 0
                    }
                    isLoading={saveAnalysisMutation.isPending}
                    onClick={() => {
                      saveAnalysisMutation.mutate({
                        materials: customMaterialsList,
                        labour: customLabourList,
                        machinery: customMachineryList,
                      });
                    }}
                  >
                    Save Composition & Recalculate Execution
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* 8. Modal: Measurement Reversal (Audit-Compliant Traceable Reversal) */}
      <Modal
        isOpen={!!reversalModalMeasurement}
        onClose={() => {
          setReversalModalMeasurement(null);
          setReversalReason('');
        }}
        title="Audit Reversal: Measurement Entry"
        maxWidth="md"
      >
        {reversalModalMeasurement && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!reversalReason.trim()) {
                alert('Please provide an engineering reason for reversing this measurement entry.');
                return;
              }
              reverseMeasurementMutation.mutate({
                id: reversalModalMeasurement._id,
                reason: reversalReason.trim(),
              });
            }}
            className="space-y-4"
          >
            {/* Explanatory Banner */}
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>Non-Destructive Audit Reversal</span>
              </div>
              <p className="text-[11px] text-red-200/80 leading-relaxed">
                This will mark the measurement as <strong>Reversed</strong> with an indelible audit log, subtract the executed quantity from the BOQ, and automatically recalculate executed quantities and costs across Bill of Materials, Bill of Manpower, Bill of Machinery, and Running Bills.
              </p>
            </div>

            {/* Measurement details */}
            <div className="p-3 bg-slate-900 rounded-xl border border-erp-border text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-erp-text-muted">Date:</span>
                <span className="font-mono font-medium text-erp-text">{formatDate(reversalModalMeasurement.measurementDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-erp-text-muted">BOQ Item:</span>
                <span className="font-mono font-bold text-blue-400">
                  {reversalModalMeasurement.boqItemId?.itemCode || 'BOQ Item'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-erp-text-muted">Quantity to Reverse:</span>
                <span className="font-bold text-red-400">
                  {reversalModalMeasurement.totalQuantity} {reversalModalMeasurement.entries[0]?.unit}
                </span>
              </div>
              {reversalModalMeasurement.entries[0]?.location && (
                <div className="flex justify-between">
                  <span className="text-erp-text-muted">Location:</span>
                  <span className="text-erp-text">{reversalModalMeasurement.entries[0].location}</span>
                </div>
              )}
            </div>

            {/* Reason input */}
            <div>
              <label className="block text-xs font-medium text-erp-text mb-1">
                Reason for Reversal * <span className="text-[11px] text-erp-text-muted">(Recorded in audit trail)</span>
              </label>
              <textarea
                rows={3}
                required
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="e.g. Measurement over-reported during joint inspection; revision requested by consultant."
                className="w-full px-3 py-2 bg-slate-900 border border-erp-border rounded-lg text-xs text-erp-text"
              />
            </div>

            <div className="pt-3 border-t border-erp-border flex justify-end gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setReversalModalMeasurement(null);
                  setReversalReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                isLoading={reverseMeasurementMutation.isPending}
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                Confirm Reversal & Recalculate
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
