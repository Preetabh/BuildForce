import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronDown,
  Download,
  Upload,
  Calculator,
  FolderTree,
  ArrowRight,
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
  | 'subprojects'
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

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('measurements');

  // Sub-Projects State & Query
  const [isAddSubProjectModalOpen, setIsAddSubProjectModalOpen] = useState(false);
  const [subProjectForm, setSubProjectForm] = useState({
    name: '',
    code: '',
    projectType: '',
    clientName: '',
    location: '',
    department: '',
    buildupArea: '',
    description: '',
    measurementUnit: 'Metres (m)',
    contractValue: '',
  });

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

  // Measurement Book Filters & Expansion (Matching Screenshot)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [measurementSearch, setMeasurementSearch] = useState('');
  const [measurementSort, setMeasurementSort] = useState('default');
  const [selectedWorkCategory, setSelectedWorkCategory] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');
  const [stageGroupsEnabled, setStageGroupsEnabled] = useState(true);
  const [selectedMeasurementIds, setSelectedMeasurementIds] = useState<Record<string, boolean>>({});

  // 1. Fetch Project Details
  const { data: project, isLoading: isProjectLoading } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}`);
      return res.data?.data;
    },
    enabled: !!projectId,
  });

  // 1b. Fetch Sub-Projects
  const { data: subProjects = [], refetch: refetchSubProjects } = useQuery<Project[]>({
    queryKey: ['subProjects', projectId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}/sub-projects`);
      return res.data?.data || [];
    },
    enabled: !!projectId,
  });

  // Create Sub-Project Mutation
  const createSubProjectMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post(`/projects/${projectId}/sub-projects`, payload);
    },
    onSuccess: () => {
      refetchSubProjects();
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setIsAddSubProjectModalOpen(false);
      setSubProjectForm({
        name: '',
        code: '',
        projectType: '',
        clientName: '',
        location: '',
        department: '',
        buildupArea: '',
        description: '',
        measurementUnit: project?.measurementUnit || 'Metres (m)',
        contractValue: '',
      });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to create sub-project');
    },
  });

  const openCreateSubProjectModal = () => {
    setSubProjectForm({
      name: '',
      code: '',
      projectType: '',
      clientName: project?.clientName || '',
      location: project?.location || '',
      department: project?.department || '',
      buildupArea: '',
      description: '',
      measurementUnit: project?.measurementUnit || 'Metres (m)',
      contractValue: '',
    });
    setIsAddSubProjectModalOpen(true);
  };

  const handleCreateSubProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subProjectForm.name.trim()) {
      alert('Please provide a Sub-Project name');
      return;
    }
    createSubProjectMutation.mutate({
      name: subProjectForm.name.trim(),
      code: subProjectForm.code.trim() || undefined,
      projectType: subProjectForm.projectType.trim() || project?.projectType || 'Residential Building',
      clientName: subProjectForm.clientName.trim(),
      location: subProjectForm.location.trim(),
      department: subProjectForm.department.trim(),
      buildupArea: Number(subProjectForm.buildupArea) || 0,
      description: subProjectForm.description.trim(),
      measurementUnit: subProjectForm.measurementUnit || project?.measurementUnit || 'Metres (m)',
      contractValue: Number(subProjectForm.contractValue) || 0,
    });
  };

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
    enabled: !!projectId,
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
    refetchSubProjects();
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

  // Dynamic schedules from authenticated organization database
  const { data: workspaceSchedules = [] } = useQuery<any[]>({
    queryKey: ['scheduleHierarchy'],
    queryFn: async () => {
      const res = await api.get('/sor/schedules/hierarchy');
      return Array.isArray(res.data?.data) ? res.data.data : [];
    },
  });
  const activeWorkspaceSor = workspaceSchedules[0] || null;

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

  const isSubProject = Boolean(project?.parentId);
  const parentProject =
    project?.parentId && typeof project.parentId === 'object'
      ? (project.parentId as { _id: string; name: string; code: string; projectType?: string; status?: string })
      : null;

  const safeSubProjects = Array.isArray(subProjects) ? subProjects : [];
  const safeMeasurements = Array.isArray(measurements) ? measurements : [];
  const safeBoqItems = Array.isArray(boqData?.items) ? boqData.items : [];
  const boq = boqData?.boq;

  // Tabs configured strictly according to project level:
  // Master Project: Sub-Projects is primary hub (NO direct BOQ at root)
  // Sub-Project: Measurements is primary hub, with BOQ, BOM, Manpower, Machinery auto-calculated
  const tabs = useMemo(() => {
    return isSubProject
      ? [
          { key: 'measurements' as const, label: 'Measurements', icon: Ruler },
          { key: 'boq' as const, label: 'BOQ / Abstract', icon: FileSpreadsheet },
          { key: 'materials' as const, label: 'Bill of Materials', icon: Package },
          { key: 'manpower' as const, label: 'Bill of Manpower', icon: Users2 },
          { key: 'machinery' as const, label: 'Bill of Machinery', icon: Truck },
        ]
      : [
          {
            key: 'subprojects' as const,
            label: `Sub-Projects (${safeSubProjects.length})`,
            icon: FolderTree,
          },
          { key: 'overview' as const, label: 'Overview & Rollup', icon: Info },
        ];
  }, [isSubProject, safeSubProjects.length]);

  // Auto-synchronize tab based on Master Project vs Sub-Project
  useEffect(() => {
    if (project) {
      if (project.parentId) {
        // Sub-project: primary tab is measurements
        if (!['measurements', 'boq', 'materials', 'manpower', 'machinery'].includes(activeTab)) {
          setActiveTab('measurements');
        }
      } else {
        // Master project: primary tab is subprojects (NO direct BOQ at root)
        if (!['subprojects', 'overview'].includes(activeTab)) {
          setActiveTab('subprojects');
        }
      }
    }
  }, [project?._id, Boolean(project?.parentId)]);

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

  // Export Measurements to Excel / CSV
  const handleExportMeasurementsExcel = () => {
    if (safeMeasurements.length === 0) {
      alert('No measurement records available to export.');
      return;
    }
    const headers = ['#', 'SOR Item Code', 'Description', 'Formula', 'Nos', 'Length (m)', 'Width (m)', 'Height (m)', 'Total Qty', 'Unit', 'Rate (INR)', 'Amount (INR)', 'Status', 'Date'];
    const rows: string[] = [headers.join(',')];

    safeMeasurements.forEach((m, idx) => {
      const entries = Array.isArray(m.entries) ? m.entries : [];
      const entry = entries[0] || {};
      const item = m.boqItemId as any;
      const rate = m.unitRate ?? item?.rate ?? 0;
      const qty = typeof m.totalQuantity === 'number' ? m.totalQuantity : 0;
      const amt = typeof m.amount === 'number' ? m.amount : (qty * rate);
      const unit = entry.unit || item?.unit || 'cum';

      rows.push([
        idx + 1,
        `"${m.sourceItemCode || item?.itemCode || ''}"`,
        `"${(entry.description || item?.description || '').replace(/"/g, '""')}"`,
        `"${entry.formula || 'LxWxH'}"`,
        entry.nos || 1,
        entry.length || 0,
        entry.width || entry.breadth || 0,
        entry.heightDepth || entry.height || entry.depth || 0,
        qty,
        `"${unit}"`,
        rate,
        amt,
        `"${m.status || 'Approved'}"`,
        `"${formatDate(m.measurementDate)}"`,
      ].join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(rows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `${project?.name || 'Project'}-Measurements-${formatDate(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered & Sorted Measurements for Sub-Project
  const filteredMeasurements = useMemo(() => {
    let list = [...safeMeasurements];

    if (measurementSearch.trim()) {
      const q = measurementSearch.toLowerCase();
      list = list.filter((m: Measurement) => {
        const item = m.boqItemId as any;
        const code = (m.sourceItemCode || item?.itemCode || '').toLowerCase();
        const desc = (m.entries?.[0]?.description || item?.description || '').toLowerCase();
        const rem = (m.remarks || m.entries?.[0]?.remarks || '').toLowerCase();
        return code.includes(q) || desc.includes(q) || rem.includes(q);
      });
    }

    if (selectedWorkCategory !== 'all') {
      list = list.filter((m: Measurement) => {
        const item = m.boqItemId as any;
        const cat = (m as any).category || item?.workCategory || item?.chapter || '';
        return cat === selectedWorkCategory;
      });
    }

    if (selectedStage !== 'all') {
      list = list.filter((m: Measurement) => {
        const item = m.boqItemId as any;
        const st = (m as any).stage || item?.stage || '';
        return st === selectedStage;
      });
    }

    if (measurementSort === 'itemCode') {
      list.sort((a, b) => (a.sourceItemCode || '').localeCompare(b.sourceItemCode || ''));
    } else if (measurementSort === 'amountDesc') {
      list.sort((a, b) => (b.amount || 0) - (a.amount || 0));
    } else if (measurementSort === 'amountAsc') {
      list.sort((a, b) => (a.amount || 0) - (b.amount || 0));
    } else if (measurementSort === 'dateDesc') {
      list.sort((a, b) => new Date(b.measurementDate).getTime() - new Date(a.measurementDate).getTime());
    }

    return list;
  }, [safeMeasurements, measurementSearch, selectedWorkCategory, selectedStage, measurementSort]);

  // Grouped Measurements by Category or Stage
  const groupedMeasurements = useMemo((): Record<string, Measurement[]> => {
    if (!stageGroupsEnabled) {
      return { 'ALL MEASUREMENTS': filteredMeasurements };
    }

    const groups: Record<string, Measurement[]> = {};
    filteredMeasurements.forEach((m: Measurement) => {
      const item = m.boqItemId as any;
      const groupKey = ((m as any).stage || (m as any).category || item?.stage || item?.workCategory || 'UNCATEGORIZED').toUpperCase();
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(m);
    });

    return groups;
  }, [filteredMeasurements, stageGroupsEnabled]);

  // Grand Total for Filtered Measurements
  const measurementGrandTotal = useMemo(() => {
    return filteredMeasurements.reduce((sum: number, m: Measurement) => {
      const item = m.boqItemId as any;
      const rate = m.unitRate ?? item?.rate ?? 0;
      const qty = typeof m.totalQuantity === 'number' ? m.totalQuantity : 0;
      const amt = typeof m.amount === 'number' ? m.amount : (qty * rate);
      return sum + (m.isReversed ? 0 : amt);
    }, 0);
  }, [filteredMeasurements]);

  const availableWorkCategories = useMemo(() => {
    const cats = new Set<string>();
    safeMeasurements.forEach((m: Measurement) => {
      const item = m.boqItemId as any;
      const cat = (m as any).category || item?.workCategory || item?.chapter;
      if (cat) cats.add(cat);
    });
    return Array.from(cats);
  }, [safeMeasurements]);

  const availableStages = useMemo(() => {
    const stages = new Set<string>();
    safeMeasurements.forEach((m: Measurement) => {
      const item = m.boqItemId as any;
      const st = (m as any).stage || item?.stage;
      if (st) stages.add(st);
    });
    return Array.from(stages);
  }, [safeMeasurements]);

  if (isProjectLoading) {
    return (
      <div className="min-h-screen bg-[#080a0f] text-slate-300">
        <Header breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Project Workspace' }]} onToggleSidebar={() => setSidebarOpen(true)} />
        <div className="p-16 text-center text-sm text-slate-400 font-medium">Loading Project Workspace...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#080a0f] text-slate-300">
        <Header breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Project Workspace' }]} onToggleSidebar={() => setSidebarOpen(true)} />
        <div className="max-w-md mx-auto mt-20 p-8 glass-panel rounded-2xl border border-slate-800 text-center space-y-4 shadow-2xl">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Project Not Found</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            This project could not be found or may have been moved to the recycle bin.
          </p>
          <Button onClick={() => navigate('/')} size="sm">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        breadcrumbs={
          parentProject
            ? [
                { label: 'Dashboard', path: '/' },
                { label: parentProject.name, path: `/projects/${parentProject._id}` },
                { label: project.name, path: `/projects/${project._id}` },
                { label: activeTab === 'measurements' ? 'Measurements' : (activeTab === 'boq' ? 'BOQ' : activeTab) },
              ]
            : [
                { label: 'Dashboard', path: '/' },
                { label: project.name },
              ]
        }
        onToggleSidebar={() => setSidebarOpen(true)}
      />

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Sub-Project Parent Association Banner */}
        {parentProject && (
          <div className="flex items-center justify-between p-3 px-4 rounded-xl bg-gradient-to-r from-blue-900/30 to-indigo-900/20 border border-blue-500/40 text-xs shadow-lg">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold uppercase text-[10px] tracking-wider border border-blue-500/30">
                Sub-Project / Package
              </span>
              <span className="text-slate-300">
                Child of Master Project: <strong className="text-white font-semibold">{parentProject.name}</strong> ({parentProject.code})
              </span>
            </div>
            <button
              onClick={() => navigate(`/projects/${parentProject._id}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white border border-blue-500/30 font-medium transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Master Project</span>
            </button>
          </div>
        )}

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

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
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

              {/* Action Buttons from Screenshot 1 */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => alert('Exporting Project Excel workbook...')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export Excel</span>
                </button>
                {!isSubProject ? (
                  <button
                    type="button"
                    onClick={() => openCreateSubProjectModal()}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Sub-Project</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMeasurement(null);
                      setInitialBoqItemForMeasurement(null);
                      setIsSmartMeasurementModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ New Item</span>
                  </button>
                )}
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
          <div className="space-y-6">
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
                    <span className="font-bold text-blue-400">{safeBoqItems.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-erp-border">
                    <span className="text-erp-text">Approved Measurements</span>
                    <span className="font-bold text-emerald-400">{measurements.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-erp-border">
                    <span className="text-erp-text">Sub-Projects Configured</span>
                    <span className="font-bold text-indigo-400">{subProjects.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-erp-border">
                    <span className="text-erp-text">Running Bills</span>
                    <span className="font-bold text-purple-400">{runningBills.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-Projects & Quantity Master Summary Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sub-Projects Snapshot Card */}
              <div className="glass-panel rounded-xl p-6 border border-erp-border space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-erp-text flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-blue-400" />
                    Sub-Projects & Packages ({subProjects.length})
                  </h3>
                  <button
                    onClick={() => setActiveTab('subprojects')}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Manage</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                {subProjects.length === 0 ? (
                  <div className="p-6 rounded-xl bg-slate-900/60 border border-erp-border text-center space-y-2">
                    <p className="text-xs text-slate-400">No sub-projects partitioned yet under this project.</p>
                    <button
                      onClick={() => openCreateSubProjectModal()}
                      className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Sub-Project</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {subProjects.slice(0, 4).map((sp) => (
                      <div
                        key={sp._id}
                        onClick={() => navigate(`/projects/${sp._id}`)}
                        className="p-3 rounded-lg bg-slate-900/70 border border-erp-border hover:border-blue-500/40 flex items-center justify-between gap-3 text-xs cursor-pointer transition-all"
                      >
                        <div>
                          <div className="font-semibold text-white flex items-center gap-2">
                            <span className="font-mono text-[11px] text-blue-400">{sp.code}</span>
                            <span>{sp.name}</span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Budget: {formatCurrency(sp.contractValue || sp.estimatedValue, sp.currency)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-semibold text-emerald-400">{sp.progress || 0}%</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Automated Resource Engine Breakdown Card */}
              <div className="glass-panel rounded-xl p-6 border border-erp-border space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-erp-text flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Quantity Master Automated Breakdown
                  </h3>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    Measurement-Driven
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-erp-border text-center">
                    <span className="text-slate-400 block text-[10px] uppercase">Materials (BOM)</span>
                    <span className="text-sm font-bold text-blue-400 block mt-1">{bomItems.length} items</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ₹{bomItems.reduce((s, m) => s + (m.executedAmount || m.amount || 0), 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-erp-border text-center">
                    <span className="text-slate-400 block text-[10px] uppercase">Manpower</span>
                    <span className="text-sm font-bold text-purple-400 block mt-1">{manpowerItems.length} trades</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ₹{manpowerItems.reduce((s, m) => s + (m.executedAmount || m.amount || 0), 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-erp-border text-center">
                    <span className="text-slate-400 block text-[10px] uppercase">Machinery</span>
                    <span className="text-sm font-bold text-amber-400 block mt-1">{machineryItems.length} units</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ₹{machineryItems.reduce((s, m) => s + (m.executedAmount || m.amount || 0), 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Materials, manpower mandays, and machinery hours are continuously recalculated via live engineering formulas from Quantity Master as measurements are entered.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================
            TAB: SUB-PROJECTS
           ====================================================================== */}
        {activeTab === 'subprojects' && (
          <div className="space-y-5">
            {/* Master Project Architecture Alert */}
            <div className="p-3.5 px-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between gap-4 text-xs text-blue-300 shadow-sm">
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  <strong>Master Project Architecture:</strong> Direct BOQ and measurements are disabled at the Master Project level. All civil measurements, detailed BOQs, and resource breakdowns are managed inside individual <strong>Sub-Projects</strong> below.
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-erp-text flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-blue-400" />
                  Sub-Projects & Work Packages
                </h3>
                <p className="text-xs text-erp-text-muted">
                  Deconstruct this master project into discrete towers, phases, or civil packages with autonomous BOQs and measurements.
                </p>
              </div>
              <Button
                onClick={() => openCreateSubProjectModal()}
                leftIcon={<Plus className="w-4 h-4" />}
                size="sm"
              >
                Create Sub-Project
              </Button>
            </div>

            {subProjects.length === 0 ? (
              <div className="glass-panel rounded-2xl p-12 text-center border border-erp-border space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto shadow-glow">
                  <FolderTree className="w-8 h-8" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h4 className="text-base font-bold text-white">No Sub-Projects Configured Yet</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Break down "{project.name}" into sub-projects (e.g. Tower A, Foundation & Sub-structure, Podium, Finishing Works). Each sub-project has its own autonomous measurements, BOQ, and resource analysis.
                  </p>
                </div>
                <Button
                  onClick={() => openCreateSubProjectModal()}
                  leftIcon={<Plus className="w-4 h-4" />}
                  size="sm"
                >
                  Create First Sub-Project
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {subProjects.map((sp) => {
                  return (
                    <div
                      key={sp._id}
                      className="glass-panel rounded-xl p-5 border border-erp-border hover:border-blue-500/40 transition-all duration-200 flex flex-col justify-between space-y-4 group shadow-lg hover:shadow-blue-500/10"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-blue-400 border border-slate-700">
                            {sp.code}
                          </span>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full capitalize bg-blue-500/10 text-blue-300 border border-blue-500/20">
                            {sp.status}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                            {sp.name}
                          </h4>
                          {sp.description && (
                            <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                              {sp.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-erp-border/60 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Budget / Value</span>
                          <span className="font-bold text-white">
                            {formatCurrency(sp.contractValue || sp.estimatedValue, sp.currency)}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Execution Progress</span>
                            <span className="font-semibold text-blue-400">{sp.progress || 0}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.max(0, sp.progress || 0))}%` }}
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => navigate(`/projects/${sp._id}`)}
                          className="w-full mt-2 py-2 px-3 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <span>Open Sub-Project Workspace</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================================
            TAB 2: BOQ / ABSTRACT
           ====================================================================== */}
        {activeTab === 'boq' && !isSubProject && (
          <div className="glass-panel p-8 rounded-2xl border border-erp-border text-center space-y-4 max-w-xl mx-auto my-12 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
              <FolderTree className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">Direct BOQ is Disabled at Master Project Level</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              In this architecture, BOQs and measurements cannot be created directly at the root project level. All work breakdown, measurement books, and BOQ schedules belong inside individual <strong>Sub-Projects</strong>.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button onClick={() => setActiveTab('subprojects')} size="sm" leftIcon={<FolderTree className="w-4 h-4" />}>
                Go to Sub-Projects
              </Button>
              <Button onClick={() => openCreateSubProjectModal()} variant="outline" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                + Add Sub-Project
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'boq' && isSubProject && (
          <div className="space-y-4">
            {/* BOQ Header Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-erp-text">Bill of Quantities (BOQ) & Abstract</h3>
                <p className="text-xs text-erp-text-muted">
                  Abstracted schedule of quantities auto-derived directly from detailed Measurement Book entries.
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
                  + Record Measurement
                </Button>
              </div>
            </div>

            {/* BOQ Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-panel p-4 rounded-xl border border-erp-border">
                <span className="text-xs text-erp-text-subtle uppercase block">Total Abstract Items</span>
                <span className="text-2xl font-bold text-erp-text">{safeBoqItems.length}</span>
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
                  <strong>Measurement-Driven BOQ:</strong> Quantities and amounts are derived directly from approved Measurement Book entries. Recording measurements instantly updates this abstract, along with BOM, Manpower, and Machinery.
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
                    {safeBoqItems.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-erp-text-muted">
                          No abstract items generated yet. Click "+ Record Measurement" above to enter dimensions and auto-generate this BOQ.
                        </td>
                      </tr>
                    ) : (
                      safeBoqItems.map((item: BoqItem, idx: number) => (
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
            TAB 3: MEASUREMENTS (MB) - Exact UI Matching Screenshot
           ====================================================================== */}
        {activeTab === 'measurements' && (
          <div className="space-y-4">
            {/* Top Title & Actions Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white tracking-tight">Measurement Book</h3>
                <button
                  type="button"
                  title="Single source of truth for all project quantities & resource calculations"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs">
                {/* Active SOR Schedule Pill */}
                <div className="px-3 py-1.5 rounded-lg bg-[#121620] border border-slate-750 text-xs font-medium text-slate-300">
                  {activeWorkspaceSor
                    ? `${activeWorkspaceSor.sorName} (${(activeWorkspaceSor.itemCount || 0).toLocaleString()} items)`
                    : 'Schedule of Rates'}
                </div>

                {/* Browse Button */}
                <button
                  type="button"
                  onClick={() => setIsSorSelectModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#181c28] hover:bg-[#222838] border border-slate-750 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <span>Browse</span>
                </button>

                {/* BOM Rate List Dropdown */}
                <select
                  aria-label="BOM Rate List"
                  className="px-3 py-1.5 rounded-lg bg-[#121620] border border-slate-750 text-xs text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="">-- BOM Rate List --</option>
                  {workspaceSchedules.map((ws: any) => (
                    <option key={ws._id} value={ws._id}>
                      {ws.sorName}
                    </option>
                  ))}
                </select>

                {/* Export Button */}
                <button
                  type="button"
                  onClick={handleExportMeasurementsExcel}
                  className="px-3 py-1.5 rounded-lg bg-[#181c28] hover:bg-[#222838] border border-slate-750 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Export</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Import Button */}
                <button
                  type="button"
                  onClick={() => {
                    setEditingMeasurement(null);
                    setInitialBoqItemForMeasurement(null);
                    setIsSmartMeasurementModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#181c28] hover:bg-[#222838] border border-slate-750 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Import</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Primary Action Button: + New Item */}
                <button
                  type="button"
                  onClick={() => {
                    setEditingMeasurement(null);
                    setInitialBoqItemForMeasurement(null);
                    setIsSmartMeasurementModalOpen(true);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-xs font-semibold text-white flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ New Item</span>
                </button>
              </div>
            </div>

            {/* Section Header */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <span className="w-3.5 h-3.5 rounded bg-blue-600/30 border border-blue-500 flex items-center justify-center text-[9px] text-blue-400 font-bold">▦</span>
                <span>MEASUREMENT BOOK</span>
              </div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {filteredMeasurements.length} ITEMS
              </span>
            </div>

            {/* Filter & Sort Toolbar (Exact match from screenshot) */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 bg-[#0d1017] rounded-xl border border-slate-800 text-xs">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={measurementSearch}
                  onChange={(e) => setMeasurementSearch(e.target.value)}
                  placeholder="Search description / SOR / remarks ->"
                  className="w-full pl-8 pr-3 py-1.5 bg-[#080a0f] border border-slate-750 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  aria-label="Sort order"
                  value={measurementSort}
                  onChange={(e) => setMeasurementSort(e.target.value)}
                  className="px-2.5 py-1.5 bg-[#080a0f] border border-slate-750 rounded-lg text-xs text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="default">Sort: Default order (manual)</option>
                  <option value="itemCode">Sort: Item Code (A-Z)</option>
                  <option value="amountDesc">Sort: Amount (High to Low)</option>
                  <option value="amountAsc">Sort: Amount (Low to High)</option>
                  <option value="dateDesc">Sort: Date (Newest)</option>
                </select>

                <select
                  aria-label="Work category filter"
                  value={selectedWorkCategory}
                  onChange={(e) => setSelectedWorkCategory(e.target.value)}
                  className="px-2.5 py-1.5 bg-[#080a0f] border border-slate-750 rounded-lg text-xs text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="all">Work: All work categories</option>
                  {availableWorkCategories.map((cat: string) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <select
                  aria-label="Stage filter"
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="px-2.5 py-1.5 bg-[#080a0f] border border-slate-750 rounded-lg text-xs text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="all">Stage: All stages</option>
                  {availableStages.map((st: string) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>

                <label className="flex items-center gap-1.5 text-slate-300 px-2 py-1 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stageGroupsEnabled}
                    onChange={(e) => setStageGroupsEnabled(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-750 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <span>Stage groups</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setMeasurementSearch('');
                    setMeasurementSort('default');
                    setSelectedWorkCategory('all');
                    setSelectedStage('all');
                    setStageGroupsEnabled(true);
                  }}
                  className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 px-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Group Accordions & Items List */}
            <div className="rounded-xl border border-slate-800 bg-[#080a0f] overflow-hidden">
              {filteredMeasurements.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-3">
                  <Ruler className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-sm font-medium">No measurement items recorded yet.</p>
                  <p className="text-xs text-slate-500">Click "+ New Item" above to record dimensions and calculate quantities.</p>
                </div>
              ) : (
                Object.entries(groupedMeasurements).map(([groupName, groupItems]: [string, Measurement[]]) => {
                  const isCollapsed = Boolean(collapsedGroups[groupName]);
                  const groupTotal = groupItems.reduce((acc: number, m: Measurement) => {
                    const item = m.boqItemId as any;
                    const r = m.unitRate ?? item?.rate ?? 0;
                    const q = typeof m.totalQuantity === 'number' ? m.totalQuantity : 0;
                    return acc + (m.isReversed ? 0 : (typeof m.amount === 'number' ? m.amount : q * r));
                  }, 0);

                  return (
                    <div key={groupName} className="border-b border-slate-800/80 last:border-b-0">
                      {/* Accordion Group Header matching Screenshot */}
                      <div
                        onClick={() => setCollapsedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }))}
                        className="px-4 py-2.5 bg-[#0d1017] hover:bg-[#121622] flex items-center justify-between text-xs font-bold text-slate-300 cursor-pointer transition-colors border-y border-slate-800/60"
                      >
                        <div className="flex items-center gap-2">
                          <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', isCollapsed && '-rotate-90')} />
                          <span className="uppercase tracking-wider">{groupName}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono font-normal">
                            {groupItems.length} {groupItems.length === 1 ? 'ITEM' : 'ITEMS'}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-white text-sm">
                          {formatCurrency(groupTotal, 'INR')}
                        </span>
                      </div>

                      {/* Items in this group */}
                      {!isCollapsed && (
                        <div className="divide-y divide-slate-800/60">
                          {groupItems.map((m: Measurement, idx: number) => {
                            const entries = Array.isArray(m?.entries) ? m.entries : [];
                            const entry = entries[0] || {};
                            const item = m?.boqItemId as any;
                            const itemRate = m?.unitRate ?? item?.rate ?? 0;
                            const totalQty = typeof m?.totalQuantity === 'number' ? m.totalQuantity : 0;
                            const itemAmount = typeof m?.amount === 'number' ? m.amount : (totalQty * itemRate);
                            const displayUnit = entry.unit || item?.unit || 'cum';
                            const isExpanded = Boolean(expandedRows[m._id]);
                            const isSelected = Boolean(selectedMeasurementIds[m._id]);

                            return (
                              <div key={m._id} className={cn('transition-colors', m.isReversed ? 'opacity-60 bg-red-950/10' : 'hover:bg-slate-900/40')}>
                                {/* Main Item Row matching screenshot */}
                                <div className="p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                  {/* Left: Checkbox, Index, Dot, Pill, Description */}
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => setSelectedMeasurementIds((prev) => ({ ...prev, [m._id]: e.target.checked }))}
                                      className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                                    />
                                    <span className="text-slate-400 font-mono text-[11px] w-4 text-center">{idx + 1}</span>
                                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                                    <span className="font-bold text-slate-300 shrink-0">
                                      SOR {m.sourceItemCode || item?.itemCode || '14.78'}
                                    </span>
                                    <span className="font-semibold text-white truncate max-w-sm sm:max-w-md md:max-w-lg" title={entry.description || item?.description}>
                                      {entry.description || item?.description || 'Cleaning of under ground sump...'}
                                    </span>
                                  </div>

                                  {/* Right: Quantity, Unit, Rate, Amount, Actions */}
                                  <div className="flex items-center gap-5 shrink-0 font-mono">
                                    <div className="text-right">
                                      <span className="font-bold text-white text-xs">{totalQty.toFixed(2)}</span>
                                    </div>
                                    <div className="w-10 text-left text-slate-400">
                                      {displayUnit}
                                    </div>
                                    <div className="text-right text-slate-300 w-16">
                                      ₹{itemRate.toFixed(2)}
                                    </div>
                                    <div className="text-right font-bold text-blue-400 text-sm min-w-[90px]">
                                      {formatCurrency(itemAmount, 'INR')}
                                    </div>

                                    {/* Action Icons */}
                                    <div className="flex items-center gap-1.5 pl-2">
                                      <button
                                        type="button"
                                        onClick={() => setExpandedRows((prev) => ({ ...prev, [m._id]: !prev[m._id] }))}
                                        className="w-6 h-6 rounded-full bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 flex items-center justify-center transition-colors cursor-pointer"
                                        title={isExpanded ? 'Collapse dimensions' : 'Expand dimensions breakdown'}
                                      >
                                        <Plus className={cn('w-3.5 h-3.5 transition-transform', isExpanded && 'rotate-45 text-amber-400')} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingMeasurement(m);
                                          setInitialBoqItemForMeasurement(null);
                                          setIsSmartMeasurementModalOpen(true);
                                        }}
                                        className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
                                        title="Edit measurement"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => duplicateMeasurementMutation.mutate(m._id)}
                                        disabled={duplicateMeasurementMutation.isPending}
                                        className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                                        title="Duplicate entry"
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
                                            if (confirm('Delete this measurement entry? Derived BOQ and resources will be updated.')) {
                                              deleteMeasurementMutation.mutate(m._id);
                                            }
                                          }
                                        }}
                                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                        title="Delete / Reverse entry"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Detailed Dimensions Spreadsheet Sub-Table */}
                                {isExpanded && (
                                  <div className="bg-[#06080d] p-3 px-6 border-t border-slate-800/80 animate-in fade-in slide-in-from-top-1">
                                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                      <Ruler className="w-3 h-3 text-blue-400" />
                                      <span>DIMENSION ENTRIES ({entries.length})</span>
                                    </div>
                                    <div className="overflow-x-auto rounded-lg border border-slate-800">
                                      <table className="w-full text-left text-xs font-mono">
                                        <thead className="bg-[#0d1017] text-slate-400 text-[10px] uppercase">
                                          <tr>
                                            <th className="py-2 px-3 w-8 text-center">#</th>
                                            <th className="py-2 px-3">Description / Sub-item</th>
                                            <th className="py-2 px-2 text-center">Formula</th>
                                            <th className="py-2 px-2 text-right">Nos</th>
                                            <th className="py-2 px-2 text-right">Length (m)</th>
                                            <th className="py-2 px-2 text-right">Width (m)</th>
                                            <th className="py-2 px-2 text-right">Height/Depth (m)</th>
                                            <th className="py-2 px-3 text-right text-emerald-400">Total Qty ({displayUnit})</th>
                                            <th className="py-2 px-3">Remarks</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/60 bg-[#080a0f]">
                                          {entries.map((ent: any, eIdx: number) => {
                                            const nos = ent.nos ?? 1;
                                            const l = ent.length || 0;
                                            const w = ent.width || ent.breadth || 0;
                                            const h = ent.heightDepth || ent.height || ent.depth || 0;
                                            const rowQty = typeof ent.calculatedQuantity === 'number' ? ent.calculatedQuantity : (l * (w || 1) * (h || 1) * nos);

                                            return (
                                              <tr key={ent._id || eIdx} className="hover:bg-slate-850/30">
                                                <td className="py-2 px-3 text-center text-slate-500 text-[11px]">{eIdx + 1}</td>
                                                <td className="py-2 px-3 font-sans text-slate-200">{ent.description || 'Measured Sub-item'}</td>
                                                <td className="py-2 px-2 text-center text-slate-400">{ent.formula || 'LxWxH'}</td>
                                                <td className="py-2 px-2 text-right text-slate-300">{nos}</td>
                                                <td className="py-2 px-2 text-right text-slate-300">{l ? l.toFixed(2) : '-'}</td>
                                                <td className="py-2 px-2 text-right text-slate-300">{w ? w.toFixed(2) : '-'}</td>
                                                <td className="py-2 px-2 text-right text-slate-300">{h ? h.toFixed(2) : '-'}</td>
                                                <td className="py-2 px-3 text-right font-bold text-emerald-400">{rowQty.toFixed(2)}</td>
                                                <td className="py-2 px-3 font-sans text-slate-400">{ent.remarks || '-'}</td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Grand Total Footer Bar */}
              <div className="p-3.5 px-5 bg-[#080a0f] border-t border-slate-800 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
                <span>GRAND TOTAL ({filteredMeasurements.length} {filteredMeasurements.length === 1 ? 'ITEM' : 'ITEMS'})</span>
                <span className="text-base font-bold text-white font-mono">
                  {formatCurrency(measurementGrandTotal, 'INR')}
                </span>
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

      {/* 2. Modal: Select Item from Schedule of Rates (SOR) */}
      <Modal isOpen={isSorSelectModalOpen} onClose={() => setIsSorSelectModalOpen(false)} title="Select from Schedule of Rates (SOR)" maxWidth="xl">
        <form onSubmit={handleAddSorItemToBoq} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-erp-text-muted" />
            <input
              type="text"
              value={sorSearch}
              onChange={(e) => setSorSearch(e.target.value)}
              placeholder="Type to search SOR standard items..."
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
                        <Sparkles className="w-3 h-3" /> Standard Rate Analysis Active
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

      {/* 9. Modal: Create Sub-Project (Exact UI from Screenshot 1) */}
      <Modal
        isOpen={isAddSubProjectModalOpen}
        onClose={() => setIsAddSubProjectModalOpen(false)}
        title={`New Sub-Project for ${project?.name || 'Project'}`}
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSubProject} className="space-y-4 pt-1">
          {/* Row 1: Name * & Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Name *
              </label>
              <input
                type="text"
                required
                value={subProjectForm.name}
                onChange={(e) => setSubProjectForm({ ...subProjectForm, name: e.target.value })}
                placeholder=""
                className="w-full px-3 py-2 bg-[#12141a] border border-slate-700/70 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Type
              </label>
              <input
                type="text"
                value={subProjectForm.projectType}
                onChange={(e) => setSubProjectForm({ ...subProjectForm, projectType: e.target.value })}
                placeholder="e.g. Villa, Road, Canal"
                className="w-full px-3 py-2 bg-[#12141a] border border-slate-700/70 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Sub-projects group by this type (Villa, Road, Drain Line...)
              </p>
            </div>
          </div>

          {/* Row 2: Client / Owner, Location, Department */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Client / Owner
              </label>
              <input
                type="text"
                value={subProjectForm.clientName}
                onChange={(e) => setSubProjectForm({ ...subProjectForm, clientName: e.target.value })}
                className="w-full px-3 py-2 bg-[#12141a] border border-slate-700/70 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Location
              </label>
              <input
                type="text"
                value={subProjectForm.location}
                onChange={(e) => setSubProjectForm({ ...subProjectForm, location: e.target.value })}
                className="w-full px-3 py-2 bg-[#12141a] border border-slate-700/70 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Department
              </label>
              <input
                type="text"
                value={subProjectForm.department}
                onChange={(e) => setSubProjectForm({ ...subProjectForm, department: e.target.value })}
                className="w-full px-3 py-2 bg-[#12141a] border border-slate-700/70 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Row 3: Buildup Area (SQM) & Description / Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Buildup Area (SQM)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={subProjectForm.buildupArea}
                onChange={(e) => setSubProjectForm({ ...subProjectForm, buildupArea: e.target.value })}
                placeholder="e.g. 500"
                className="w-full px-3 py-2 bg-[#12141a] border border-slate-700/70 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Used for Avg Rate / Area (per sqm & per sqft)
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Description / Notes
              </label>
              <textarea
                rows={3}
                value={subProjectForm.description}
                onChange={(e) => setSubProjectForm({ ...subProjectForm, description: e.target.value })}
                placeholder=""
                className="w-full px-3 py-2 bg-[#12141a] border border-slate-700/70 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 resize-none transition-colors"
              />
            </div>
          </div>

          {/* Row 4: Measurement Unit */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Measurement Unit
            </label>
            <div className="w-full md:w-1/2">
              <input
                type="text"
                readOnly
                value={subProjectForm.measurementUnit || project?.measurementUnit || 'Metres (m)'}
                className="w-full px-3 py-2 bg-[#0e1015] border border-slate-800 rounded-lg text-sm text-slate-300 cursor-not-allowed font-medium"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Inherited from {project?.name || 'parent'} — a sub-project always works in its parent's unit.
            </p>
          </div>

          {/* Footer: Cancel & Save buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddSubProjectModalOpen(false)}
              className="px-5 py-2 rounded-lg bg-[#222634] hover:bg-[#2c3142] text-slate-300 hover:text-white text-sm font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSubProjectMutation.isPending}
              className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold transition-all shadow-md hover:shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
            >
              {createSubProjectMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
