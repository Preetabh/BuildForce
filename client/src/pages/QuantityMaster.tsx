import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import {
  Boxes,
  Users,
  Truck,
  Calculator,
  Receipt,
  History,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Upload,
  Sparkles,
  Edit2,
  Trash2,
  Copy,
  RefreshCw,
  X,
  Check,
  AlertCircle,
  Clock,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  Info,
  Eye,
  Archive,
  RotateCcw,
  Tag,
  Calendar,
} from 'lucide-react';
import api from '../services/api';
import { Header } from '../components/layout/Header';
import { Button } from '../components/common/Button';
import {
  MasterMaterial,
  MasterLabour,
  MasterMachinery,
  MasterFormula,
  MasterRateList,
  SorImport,
} from '../types';
import { cn } from '../utils/cn';
import {
  exportMaterialsPdf,
  exportManpowerPdf,
  exportMachineryPdf,
  exportFormulasPdf,
  exportRateListsPdf,
  exportMaterialsExcel,
  exportManpowerExcel,
  exportMachineryExcel,
  exportFormulasExcel,
  exportRateListsExcel,
} from '../utils/quantityMasterPdfExport';
import {
  QuantityMasterPdfImportModal,
  MasterType,
} from '../components/quantityMaster/QuantityMasterPdfImportModal';

interface OutletContextType {
  setSidebarOpen: (open: boolean) => void;
}

type TabType = 'materials' | 'manpower' | 'machinery' | 'formulas' | 'rate-lists' | 'import-history';

export const QuantityMaster: React.FC = () => {
  const { setSidebarOpen } = useOutletContext<OutletContextType>();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>('materials');
  const [formulaSubTab, setFormulaSubTab] = useState<'all' | 'materials' | 'manpower' | 'machinery'>('all');

  // Search, Filters & Pagination
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRateListId, setSelectedRateListId] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  // View Details Modal State
  const [viewingItem, setViewingItem] = useState<{
    type: 'material' | 'manpower' | 'machinery' | 'formula';
    item: any;
  } | null>(null);

  // Modals
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState<MasterMaterial | null>(null);

  const [isManpowerModalOpen, setIsManpowerModalOpen] = useState(false);
  const [manpowerToEdit, setManpowerToEdit] = useState<MasterLabour | null>(null);

  const [isMachineryModalOpen, setIsMachineryModalOpen] = useState(false);
  const [machineryToEdit, setMachineryToEdit] = useState<MasterMachinery | null>(null);

  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);
  const [formulaToEdit, setFormulaToEdit] = useState<MasterFormula | null>(null);

  const [isRateListModalOpen, setIsRateListModalOpen] = useState(false);
  const [rateListToEdit, setRateListToEdit] = useState<MasterRateList | null>(null);

  // PDF Bulk Import & Export State
  const [isPdfImportModalOpen, setIsPdfImportModalOpen] = useState(false);
  const [pdfImportType, setPdfImportType] = useState<MasterType>('materials');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenPdfImport = (type: MasterType) => {
    setPdfImportType(type);
    setIsPdfImportModalOpen(true);
  };

  // PDF Export Handlers
  const handleExportMaterials = async () => {
    try {
      setIsExportingPdf(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (selectedRateListId) params.append('rateListId', selectedRateListId);
      params.append('page', '1');
      params.append('limit', '1000');
      const res = await api.get(`/quantity-master/materials?${params.toString()}`);
      const items = res.data?.data?.items || materialsData?.items || [];
      exportMaterialsPdf(items, categoryFilter !== 'all' ? categoryFilter : undefined);
      showToast(`Exported ${items.length} materials to PDF`);
    } catch (err) {
      console.error('Export materials error:', err);
      showToast('Failed to export materials PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportManpower = async () => {
    try {
      setIsExportingPdf(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (selectedRateListId) params.append('rateListId', selectedRateListId);
      params.append('page', '1');
      params.append('limit', '1000');
      const res = await api.get(`/quantity-master/manpower?${params.toString()}`);
      const items = res.data?.data?.items || manpowerData?.items || [];
      exportManpowerPdf(items, categoryFilter !== 'all' ? categoryFilter : undefined);
      showToast(`Exported ${items.length} manpower trades to PDF`);
    } catch (err) {
      console.error('Export manpower error:', err);
      showToast('Failed to export manpower PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportMachinery = async () => {
    try {
      setIsExportingPdf(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (selectedRateListId) params.append('rateListId', selectedRateListId);
      params.append('page', '1');
      params.append('limit', '1000');
      const res = await api.get(`/quantity-master/machinery?${params.toString()}`);
      const items = res.data?.data?.items || machineryData?.items || [];
      exportMachineryPdf(items, categoryFilter !== 'all' ? categoryFilter : undefined);
      showToast(`Exported ${items.length} machinery items to PDF`);
    } catch (err) {
      console.error('Export machinery error:', err);
      showToast('Failed to export machinery PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportFormulas = async () => {
    try {
      setIsExportingPdf(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (formulaSubTab !== 'all') params.append('typeFilter', formulaSubTab);
      params.append('page', '1');
      params.append('limit', '1000');
      const res = await api.get(`/quantity-master/formulas?${params.toString()}`);
      const items = res.data?.data?.items || formulasData?.items || [];
      exportFormulasPdf(items);
      showToast(`Exported ${items.length} formulas to PDF`);
    } catch (err) {
      console.error('Export formulas error:', err);
      showToast('Failed to export formulas PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportRateLists = async () => {
    try {
      setIsExportingPdf(true);
      const items = rateListsData || [];
      exportRateListsPdf(items);
      showToast(`Exported ${items.length} rate lists to PDF`);
    } catch (err) {
      console.error('Export rate lists error:', err);
      showToast('Failed to export rate lists PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Excel Export Handlers
  const handleExportMaterialsExcel = async () => {
    try {
      setIsExportingPdf(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (selectedRateListId) params.append('rateListId', selectedRateListId);
      params.append('page', '1');
      params.append('limit', '1000');
      const res = await api.get(`/quantity-master/materials?${params.toString()}`);
      const items = res.data?.data?.items || materialsData?.items || [];
      exportMaterialsExcel(items);
      showToast(`Exported ${items.length} materials to Excel`);
    } catch (err) {
      console.error('Export materials excel error:', err);
      showToast('Failed to export materials Excel');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportManpowerExcel = async () => {
    try {
      setIsExportingPdf(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (selectedRateListId) params.append('rateListId', selectedRateListId);
      params.append('page', '1');
      params.append('limit', '1000');
      const res = await api.get(`/quantity-master/manpower?${params.toString()}`);
      const items = res.data?.data?.items || manpowerData?.items || [];
      exportManpowerExcel(items);
      showToast(`Exported ${items.length} manpower trades to Excel`);
    } catch (err) {
      console.error('Export manpower excel error:', err);
      showToast('Failed to export manpower Excel');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportMachineryExcel = async () => {
    try {
      setIsExportingPdf(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (selectedRateListId) params.append('rateListId', selectedRateListId);
      params.append('page', '1');
      params.append('limit', '1000');
      const res = await api.get(`/quantity-master/machinery?${params.toString()}`);
      const items = res.data?.data?.items || machineryData?.items || [];
      exportMachineryExcel(items);
      showToast(`Exported ${items.length} machinery items to Excel`);
    } catch (err) {
      console.error('Export machinery excel error:', err);
      showToast('Failed to export machinery Excel');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportFormulasExcel = async () => {
    try {
      setIsExportingPdf(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (formulaSubTab !== 'all') params.append('typeFilter', formulaSubTab);
      params.append('page', '1');
      params.append('limit', '1000');
      const res = await api.get(`/quantity-master/formulas?${params.toString()}`);
      const items = res.data?.data?.items || formulasData?.items || [];
      exportFormulasExcel(items);
      showToast(`Exported ${items.length} formulas to Excel`);
    } catch (err) {
      console.error('Export formulas excel error:', err);
      showToast('Failed to export formulas Excel');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportRateListsExcel = async () => {
    try {
      setIsExportingPdf(true);
      const items = rateListsData || [];
      exportRateListsExcel(items);
      showToast(`Exported ${items.length} rate lists to Excel`);
    } catch (err) {
      console.error('Export rate lists excel error:', err);
      showToast('Failed to export rate lists Excel');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearch('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setPage(1);
  };

  // 1. Materials Query
  const {
    data: materialsData,
    isLoading: isMaterialsLoading,
    refetch: refetchMaterials,
  } = useQuery({
    queryKey: ['qm-materials', { search, category: categoryFilter, status: statusFilter, rateListId: selectedRateListId, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (selectedRateListId) params.append('rateListId', selectedRateListId);
      params.append('page', String(page));
      params.append('limit', String(limit));
      const res = await api.get(`/quantity-master/materials?${params.toString()}`);
      return res.data?.data;
    },
    enabled: activeTab === 'materials',
  });

  // 2. Manpower Query
  const {
    data: manpowerData,
    isLoading: isManpowerLoading,
    refetch: refetchManpower,
  } = useQuery({
    queryKey: ['qm-manpower', { search, category: categoryFilter, status: statusFilter, rateListId: selectedRateListId, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (selectedRateListId) params.append('rateListId', selectedRateListId);
      params.append('page', String(page));
      params.append('limit', String(limit));
      const res = await api.get(`/quantity-master/manpower?${params.toString()}`);
      return res.data?.data;
    },
    enabled: activeTab === 'manpower',
  });

  // 3. Machinery Query
  const {
    data: machineryData,
    isLoading: isMachineryLoading,
    refetch: refetchMachinery,
  } = useQuery({
    queryKey: ['qm-machinery', { search, category: categoryFilter, status: statusFilter, rateListId: selectedRateListId, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (selectedRateListId) params.append('rateListId', selectedRateListId);
      params.append('page', String(page));
      params.append('limit', String(limit));
      const res = await api.get(`/quantity-master/machinery?${params.toString()}`);
      return res.data?.data;
    },
    enabled: activeTab === 'machinery',
  });

  // 4. Formulas Query
  const {
    data: formulasData,
    isLoading: isFormulasLoading,
    refetch: refetchFormulas,
  } = useQuery({
    queryKey: ['qm-formulas', { search, category: categoryFilter, typeFilter: formulaSubTab, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (formulaSubTab !== 'all') params.append('typeFilter', formulaSubTab);
      params.append('page', String(page));
      params.append('limit', String(limit));
      const res = await api.get(`/quantity-master/formulas?${params.toString()}`);
      return res.data?.data;
    },
    enabled: activeTab === 'formulas',
  });

  // 5. Rate Lists Query
  const {
    data: rateListsData,
    isLoading: isRateListsLoading,
    refetch: refetchRateLists,
  } = useQuery<MasterRateList[]>({
    queryKey: ['qm-rate-lists'],
    queryFn: async () => {
      const res = await api.get('/quantity-master/rate-lists');
      return res.data?.data || [];
    },
    enabled: activeTab === 'rate-lists' || activeTab === 'materials' || activeTab === 'manpower' || activeTab === 'machinery',
  });

  // 6. Import History Query
  const {
    data: importHistoryData,
    isLoading: isHistoryLoading,
  } = useQuery<SorImport[]>({
    queryKey: ['qm-import-history'],
    queryFn: async () => {
      const res = await api.get('/quantity-master/import-history');
      return res.data?.data || [];
    },
    enabled: activeTab === 'import-history',
  });

  // Material Mutations
  const archiveMaterialMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/quantity-master/materials/${id}/archive`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['qm-materials'] });
      showToast(res.data?.message || 'Material archive state updated');
    },
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/quantity-master/materials/${id}`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['qm-materials'] });
      showToast(res.data?.message || 'Material deleted successfully');
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to delete material');
    },
  });

  // Manpower Mutations
  const archiveManpowerMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/quantity-master/manpower/${id}/archive`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['qm-manpower'] });
      showToast(res.data?.message || 'Manpower archive state updated');
    },
  });

  const deleteManpowerMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/quantity-master/manpower/${id}`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['qm-manpower'] });
      showToast(res.data?.message || 'Manpower trade deleted');
    },
  });

  // Machinery Mutations
  const archiveMachineryMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/quantity-master/machinery/${id}/archive`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['qm-machinery'] });
      showToast(res.data?.message || 'Machinery archive state updated');
    },
  });

  const deleteMachineryMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/quantity-master/machinery/${id}`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['qm-machinery'] });
      showToast(res.data?.message || 'Machinery deleted');
    },
  });

  // Formula Mutations
  const deleteFormulaMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/quantity-master/formulas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qm-formulas'] });
      showToast('Calculation formula deleted');
    },
  });

  const copyFormulaMutation = useMutation({
    mutationFn: (id: string) => api.post(`/quantity-master/formulas/${id}/copy`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qm-formulas'] });
      showToast('Formula duplicated successfully');
    },
  });

  // Rate List Delete Mutation
  const deleteRateListMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/quantity-master/rate-lists/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qm-rate-lists'] });
      showToast('Rate list deleted');
    },
  });

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <Archive className="w-2.5 h-2.5" />
            ARCHIVED
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            INACTIVE
          </span>
        );
      case 'ACTIVE':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            ACTIVE
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100">
      <Header
        breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Planning' }, { label: 'Quantity Master' }]}
        onToggleSidebar={() => setSidebarOpen(true)}
      />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#131926] border border-blue-500/40 text-blue-300 px-4 py-2.5 rounded-xl shadow-glow text-xs sm:text-sm flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Module Title Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#121828] via-[#0E1322] to-[#0A0D18] border border-slate-800 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(37,99,235,0.35)]">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Quantity Master
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Material, Manpower & Machinery masters, work-wise calculation formulas, and Rate Lists
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => {
                refetchMaterials();
                refetchManpower();
                refetchMachinery();
                refetchFormulas();
                refetchRateLists();
                showToast('Quantity Master refreshed with live MongoDB records');
              }}
              title="Refresh Data"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 no-scrollbar">
          <button
            onClick={() => handleTabChange('materials')}
            className={cn(
              'px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shrink-0',
              activeTab === 'materials'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            )}
          >
            <Boxes className="w-4 h-4" />
            <span>Materials</span>
            {materialsData?.total !== undefined && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 text-white">
                {materialsData.total}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange('manpower')}
            className={cn(
              'px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shrink-0',
              activeTab === 'manpower'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            )}
          >
            <Users className="w-4 h-4" />
            <span>Manpower</span>
            {manpowerData?.total !== undefined && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 text-white">
                {manpowerData.total}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange('machinery')}
            className={cn(
              'px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shrink-0',
              activeTab === 'machinery'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            )}
          >
            <Truck className="w-4 h-4" />
            <span>Machinery</span>
            {machineryData?.total !== undefined && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 text-white">
                {machineryData.total}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange('formulas')}
            className={cn(
              'px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shrink-0',
              activeTab === 'formulas'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            )}
          >
            <Calculator className="w-4 h-4" />
            <span>Formulas</span>
            {formulasData?.total !== undefined && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 text-white">
                {formulasData.total}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange('rate-lists')}
            className={cn(
              'px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shrink-0',
              activeTab === 'rate-lists'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            )}
          >
            <Receipt className="w-4 h-4" />
            <span>Rate Lists</span>
          </button>

          <button
            onClick={() => handleTabChange('import-history')}
            className={cn(
              'px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shrink-0',
              activeTab === 'import-history'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            )}
          >
            <History className="w-4 h-4" />
            <span>Import History</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: MATERIALS */}
        {/* ========================================================================= */}
        {activeTab === 'materials' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#0F1422] border border-slate-800">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                {/* Search */}
                <div className="relative flex-1 min-w-[180px] max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search material name or code..."
                    className="w-full pl-9 pr-3 py-2 bg-[#0A0D16] border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 bg-[#0A0D16] border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {materialsData?.categories?.map((c: string) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 bg-[#0A0D16] border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="INACTIVE">Inactive Only</option>
                  <option value="ARCHIVED">Archived Only</option>
                </select>

                {/* Rate List Filter */}
                <select
                  value={selectedRateListId}
                  onChange={(e) => {
                    setSelectedRateListId(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 bg-[#0A0D16] border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="">Base Master Rates</option>
                  {rateListsData?.map((rl) => (
                    <option key={rl._id} value={rl._id}>
                      Rate List: {rl.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleExportMaterialsExcel}
                  disabled={isExportingPdf}
                  title="Export Materials to Excel Spreadsheet (.xlsx)"
                  className="px-3 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-600/40 transition-all shadow-sm disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={handleExportMaterials}
                  disabled={isExportingPdf}
                  title="Export Materials as PDF Document"
                  className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700/80 transition-all shadow-sm disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => handleOpenPdfImport('materials')}
                  title="Bulk Import Materials from PDF, Excel or CSV"
                  className="px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold flex items-center gap-1.5 border border-blue-500/30 transition-all shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  <span>Import (PDF/Excel)</span>
                </button>
                <button
                  onClick={() => {
                    setMaterialToEdit(null);
                    setIsMaterialModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Material</span>
                </button>
              </div>
            </div>

            {/* Materials Table */}
            <div className="rounded-xl border border-slate-800 bg-[#0E1320] overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#131928] text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-3.5 w-12 text-center">#</th>
                      <th className="py-3 px-4">Material</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-3 text-center">Unit</th>
                      <th className="py-3 px-4 text-right">Rate (₹)</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-center w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {isMaterialsLoading ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <span>Loading materials...</span>
                        </td>
                      </tr>
                    ) : !materialsData?.items || materialsData.items.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <Boxes className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-slate-300">No materials found</p>
                        </td>
                      </tr>
                    ) : (
                      materialsData.items.map((mat: MasterMaterial, idx: number) => (
                        <tr key={mat._id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3.5 text-center text-slate-500 font-mono text-xs">
                            {(page - 1) * limit + idx + 1}
                          </td>
                          <td className="py-3 px-4 text-white font-medium">
                            <div>
                              <span>{mat.name}</span>
                              {mat.subcategory && (
                                <span className="text-[11px] text-slate-400 ml-2">({mat.subcategory})</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              {mat.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-300 font-mono text-xs">{mat.code}</td>
                          <td className="py-3 px-3 text-center text-slate-300 lowercase">{mat.unit}</td>
                          <td className="py-3 px-4 text-right font-bold text-white font-mono">
                            ₹{(mat.effectiveRate ?? mat.standardRate)?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            {mat.hasOverride && (
                              <span className="ml-1 text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                List
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">{getStatusBadge(mat.status)}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setViewingItem({ type: 'material', item: mat })}
                                title="View Details"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setMaterialToEdit(mat);
                                  setIsMaterialModalOpen(true);
                                }}
                                title="Edit Material"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => archiveMaterialMutation.mutate(mat._id)}
                                title={mat.status === 'ARCHIVED' ? 'Unarchive' : 'Archive'}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-slate-800 transition-colors"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Delete material "${mat.name}"?\nIf referenced in active BOQ, it will be safely archived.`)) {
                                    deleteMaterialMutation.mutate(mat._id);
                                  }
                                }}
                                title="Delete Material"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {materialsData && materialsData.totalPages > 1 && (
                <div className="p-3 bg-[#111726] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, materialsData.total)} of{' '}
                    {materialsData.total} items
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>
                    <span className="font-semibold text-white px-2">
                      {page} / {materialsData.totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(materialsData.totalPages, p + 1))}
                      disabled={page >= materialsData.totalPages}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white flex items-center gap-1"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MANPOWER */}
        {/* ========================================================================= */}
        {activeTab === 'manpower' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#0F1422] border border-slate-800">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                <div className="relative flex-1 min-w-[180px] max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search manpower trade or code..."
                    className="w-full pl-9 pr-3 py-2 bg-[#0A0D16] border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 bg-[#0A0D16] border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">All Skill Types</option>
                  <option value="Skilled">Skilled</option>
                  <option value="Semi-Skilled">Semi-Skilled</option>
                  <option value="Unskilled">Unskilled</option>
                  <option value="Supervisory">Supervisory</option>
                  <option value="Specialist">Specialist</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 bg-[#0A0D16] border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="INACTIVE">Inactive Only</option>
                  <option value="ARCHIVED">Archived Only</option>
                </select>

                <select
                  value={selectedRateListId}
                  onChange={(e) => {
                    setSelectedRateListId(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 bg-[#0A0D16] border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="">Base Master Rates</option>
                  {rateListsData?.map((rl) => (
                    <option key={rl._id} value={rl._id}>
                      Rate List: {rl.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleExportManpowerExcel}
                  disabled={isExportingPdf}
                  title="Export Manpower to Excel Spreadsheet (.xlsx)"
                  className="px-3 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-600/40 transition-all shadow-sm disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={handleExportManpower}
                  disabled={isExportingPdf}
                  title="Export Manpower as PDF Document"
                  className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700/80 transition-all shadow-sm disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => handleOpenPdfImport('manpower')}
                  title="Bulk Import Manpower from PDF, Excel or CSV"
                  className="px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold flex items-center gap-1.5 border border-blue-500/30 transition-all shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  <span>Import (PDF/Excel)</span>
                </button>
                <button
                  onClick={() => {
                    setManpowerToEdit(null);
                    setIsManpowerModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Manpower</span>
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0E1320] overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#131928] text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-3.5 w-12 text-center">#</th>
                      <th className="py-3 px-4">Manpower Trade</th>
                      <th className="py-3 px-4">Skill Type</th>
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-3 text-center">Unit</th>
                      <th className="py-3 px-4 text-right">Daily Rate (₹)</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-center w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {isManpowerLoading ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <span>Loading manpower...</span>
                        </td>
                      </tr>
                    ) : !manpowerData?.items || manpowerData.items.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-slate-300">No manpower trades found</p>
                        </td>
                      </tr>
                    ) : (
                      manpowerData.items.map((mp: MasterLabour, idx: number) => (
                        <tr key={mp._id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3.5 text-center text-slate-500 font-mono text-xs">
                            {(page - 1) * limit + idx + 1}
                          </td>
                          <td className="py-3 px-4 text-white font-medium">{mp.name}</td>
                          <td className="py-3 px-4">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border',
                                mp.skillType === 'Skilled'
                                  ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                                  : mp.skillType === 'Semi-Skilled'
                                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                  : 'bg-slate-700/30 text-slate-300 border-slate-600/30'
                              )}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {mp.skillType || mp.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-300 font-mono text-xs">{mp.code}</td>
                          <td className="py-3 px-3 text-center text-slate-300 lowercase">{mp.unit}</td>
                          <td className="py-3 px-4 text-right font-bold text-white font-mono">
                            ₹{(mp.effectiveRate ?? mp.standardDailyRate)?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            {mp.hasOverride && (
                              <span className="ml-1 text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                List
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">{getStatusBadge(mp.status)}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setViewingItem({ type: 'manpower', item: mp })}
                                title="View Details"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setManpowerToEdit(mp);
                                  setIsManpowerModalOpen(true);
                                }}
                                title="Edit Trade"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => archiveManpowerMutation.mutate(mp._id)}
                                title={mp.status === 'ARCHIVED' ? 'Unarchive' : 'Archive'}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-slate-800 transition-colors"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Delete trade "${mp.name}"?`)) {
                                    deleteManpowerMutation.mutate(mp._id);
                                  }
                                }}
                                title="Delete Trade"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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

        {/* ========================================================================= */}
        {/* TAB 3: MACHINERY */}
        {/* ========================================================================= */}
        {activeTab === 'machinery' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#0F1422] border border-slate-800">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                <div className="relative flex-1 min-w-[180px] max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search machinery or code..."
                    className="w-full pl-9 pr-3 py-2 bg-[#0A0D16] border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 bg-[#0A0D16] border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">All Machinery Categories</option>
                  {machineryData?.categories?.map((c: string) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 bg-[#0A0D16] border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="INACTIVE">Inactive Only</option>
                  <option value="ARCHIVED">Archived Only</option>
                </select>

                <select
                  value={selectedRateListId}
                  onChange={(e) => {
                    setSelectedRateListId(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 bg-[#0A0D16] border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="">Base Master Rates</option>
                  {rateListsData?.map((rl) => (
                    <option key={rl._id} value={rl._id}>
                      Rate List: {rl.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleExportMachineryExcel}
                  disabled={isExportingPdf}
                  title="Export Machinery to Excel Spreadsheet (.xlsx)"
                  className="px-3 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-600/40 transition-all shadow-sm disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={handleExportMachinery}
                  disabled={isExportingPdf}
                  title="Export Machinery as PDF Document"
                  className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700/80 transition-all shadow-sm disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => handleOpenPdfImport('machinery')}
                  title="Bulk Import Machinery from PDF, Excel or CSV"
                  className="px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold flex items-center gap-1.5 border border-blue-500/30 transition-all shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  <span>Import (PDF/Excel)</span>
                </button>
                <button
                  onClick={() => {
                    setMachineryToEdit(null);
                    setIsMachineryModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Machinery</span>
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0E1320] overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#131928] text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-3.5 w-12 text-center">#</th>
                      <th className="py-3 px-4">Machinery / Plant</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-3 text-center">Unit</th>
                      <th className="py-3 px-4 text-right">Hourly Rate (₹)</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-center w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {isMachineryLoading ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <span>Loading machinery...</span>
                        </td>
                      </tr>
                    ) : !machineryData?.items || machineryData.items.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <Truck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-slate-300">No machinery equipment found</p>
                        </td>
                      </tr>
                    ) : (
                      machineryData.items.map((mac: MasterMachinery, idx: number) => (
                        <tr key={mac._id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3.5 text-center text-slate-500 font-mono text-xs">
                            {(page - 1) * limit + idx + 1}
                          </td>
                          <td className="py-3 px-4 text-white font-medium">{mac.name}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                              {mac.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-300 font-mono text-xs">{mac.code}</td>
                          <td className="py-3 px-3 text-center text-slate-300 lowercase">{mac.unit}</td>
                          <td className="py-3 px-4 text-right font-bold text-white font-mono">
                            ₹{(mac.effectiveRate ?? mac.standardHourlyRate)?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            {mac.hasOverride && (
                              <span className="ml-1 text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                List
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">{getStatusBadge(mac.status)}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setViewingItem({ type: 'machinery', item: mac })}
                                title="View Details"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setMachineryToEdit(mac);
                                  setIsMachineryModalOpen(true);
                                }}
                                title="Edit Machinery"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => archiveMachineryMutation.mutate(mac._id)}
                                title={mac.status === 'ARCHIVED' ? 'Unarchive' : 'Archive'}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-slate-800 transition-colors"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Delete equipment "${mac.name}"?`)) {
                                    deleteMachineryMutation.mutate(mac._id);
                                  }
                                }}
                                title="Delete Machinery"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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

        {/* ========================================================================= */}
        {/* TAB 4: FORMULAS */}
        {/* ========================================================================= */}
        {activeTab === 'formulas' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl bg-[#0F1422] border border-slate-800">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setFormulaSubTab('all')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                    formulaSubTab === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  )}
                >
                  All Formulas
                </button>
                <button
                  onClick={() => setFormulaSubTab('materials')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors',
                    formulaSubTab === 'materials'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  )}
                >
                  <Boxes className="w-3.5 h-3.5" />
                  <span>Material Formulas</span>
                </button>
                <button
                  onClick={() => setFormulaSubTab('manpower')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors',
                    formulaSubTab === 'manpower'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  )}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Manpower Formulas</span>
                </button>
                <button
                  onClick={() => setFormulaSubTab('machinery')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors',
                    formulaSubTab === 'machinery'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  )}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Machinery Formulas</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleExportFormulasExcel}
                  disabled={isExportingPdf}
                  title="Export Formulas to Excel Spreadsheet (.xlsx)"
                  className="px-3 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-600/40 transition-all shadow-sm disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={handleExportFormulas}
                  disabled={isExportingPdf}
                  title="Export Formulas as PDF Document"
                  className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700/80 transition-all shadow-sm disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => handleOpenPdfImport('formulas')}
                  title="Bulk Import Formulas from PDF, Excel or CSV"
                  className="px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold flex items-center gap-1.5 border border-blue-500/30 transition-all shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  <span>Import (PDF/Excel)</span>
                </button>
                <button
                  onClick={() => {
                    setFormulaToEdit(null);
                    setIsFormulaModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Formula</span>
                </button>
              </div>
            </div>

            {/* Formulas Table */}
            <div className="rounded-xl border border-slate-800 bg-[#0E1320] overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#131928] text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-3.5 w-12 text-center">#</th>
                      <th className="py-3 px-4 min-w-[220px]">Formula Name</th>
                      <th className="py-3 px-3 text-center">Unit</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 min-w-[340px]">Materials & Factors (Per Unit)</th>
                      <th className="py-3 px-4 text-center w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {isFormulasLoading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <span>Loading formulas...</span>
                        </td>
                      </tr>
                    ) : !formulasData?.items || formulasData.items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <Calculator className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-slate-300">No formulas created yet</p>
                        </td>
                      </tr>
                    ) : (
                      formulasData.items.map((form: MasterFormula, idx: number) => (
                        <tr key={form._id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-3.5 text-center text-slate-500 font-mono text-xs">
                            {(page - 1) * limit + idx + 1}
                          </td>
                          <td className="py-3.5 px-4 text-white font-medium">
                            <span className="font-bold text-sm text-white">{form.name}</span>
                            {form.description && (
                              <p className="text-[11px] text-slate-400 line-clamp-1">{form.description}</p>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-center text-slate-300 lowercase font-mono">{form.unit}</td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                              {form.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1.5">
                              {form.materialFactors?.map((mf, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-200 border border-slate-700/70 text-[11px] font-mono"
                                >
                                  <span className="text-slate-400 mr-1">{mf.name}:</span>
                                  <span className="font-bold text-amber-300">{mf.factor}</span>
                                  <span className="text-slate-500 ml-0.5">{mf.unit}</span>
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setFormulaToEdit(form);
                                  setIsFormulaModalOpen(true);
                                }}
                                title="Edit Formula"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => copyFormulaMutation.mutate(form._id)}
                                title="Duplicate Formula"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Delete formula "${form.name}"?`)) {
                                    deleteFormulaMutation.mutate(form._id);
                                  }
                                }}
                                title="Delete Formula"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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

        {/* ========================================================================= */}
        {/* TAB 5: RATE LISTS */}
        {/* ========================================================================= */}
        {activeTab === 'rate-lists' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#0F1422] border border-slate-800">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400 shrink-0" />
                <p className="text-xs sm:text-sm text-slate-300">
                  City/time-wise rates for Material + Manpower + Machinery in one list. Select in project measurements for BOM & rate analysis.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleExportRateListsExcel}
                  disabled={isExportingPdf}
                  title="Export Rate Lists to Excel Spreadsheet (.xlsx)"
                  className="px-3 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-600/40 transition-all shadow-sm disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={handleExportRateLists}
                  disabled={isExportingPdf}
                  title="Export Rate Lists as PDF Document"
                  className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700/80 transition-all shadow-sm disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => handleOpenPdfImport('rate-lists')}
                  title="Bulk Import Rate Lists from PDF, Excel or CSV"
                  className="px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold flex items-center gap-1.5 border border-blue-500/30 transition-all shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  <span>Import (PDF/Excel)</span>
                </button>
                <button
                  onClick={() => {
                    setRateListToEdit(null);
                    setIsRateListModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Rate List</span>
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0E1320] overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#131928] text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-3.5 w-12 text-center">SR</th>
                      <th className="py-3 px-4">Rate List Name</th>
                      <th className="py-3 px-4">Rates Coverage</th>
                      <th className="py-3 px-4 text-center">Created</th>
                      <th className="py-3 px-4 text-center w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {isRateListsLoading ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400">
                          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <span>Loading rate lists...</span>
                        </td>
                      </tr>
                    ) : !rateListsData || rateListsData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400">
                          <Receipt className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-slate-300">No custom rate lists created</p>
                        </td>
                      </tr>
                    ) : (
                      rateListsData.map((rl, idx) => (
                        <tr key={rl._id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-3.5 text-center text-slate-500 font-mono text-xs">
                            {idx + 1}
                          </td>
                          <td className="py-3.5 px-4 text-white font-medium">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{rl.name}</span>
                              {rl.isDefault && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                  Default
                                </span>
                              )}
                            </div>
                            {rl.description && (
                              <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{rl.description}</p>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                                🧱 {rl.coverage?.materials || '0/0'} MATERIAL
                              </span>
                              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                                👷 {rl.coverage?.labour || '0/0'} MANPOWER
                              </span>
                              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                                🚜 {rl.coverage?.machinery || '0/0'} MACHINERY
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center text-slate-400 text-xs">
                            {rl.createdAt ? new Date(rl.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setRateListToEdit(rl);
                                  setIsRateListModalOpen(true);
                                }}
                                title="Edit Rates"
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-semibold flex items-center gap-1 border border-slate-700 transition-colors"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Edit Rates</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Delete rate list "${rl.name}"?`)) {
                                    deleteRateListMutation.mutate(rl._id);
                                  }
                                }}
                                title="Delete"
                                className="p-1 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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

        {/* ========================================================================= */}
        {/* TAB 6: IMPORT HISTORY */}
        {/* ========================================================================= */}
        {activeTab === 'import-history' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-800 bg-[#0E1320] overflow-hidden shadow-lg">
              <div className="p-4 bg-[#131928] border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">SOR / DSR & Resource Import Records</h3>
                  <p className="text-xs text-slate-400">Chronological history of master datasets imported into this company</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#111726] text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Dataset Name</th>
                      <th className="py-3 px-4">Authority</th>
                      <th className="py-3 px-4">Source File</th>
                      <th className="py-3 px-3 text-center">Items Count</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Import Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {isHistoryLoading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <span>Loading import history...</span>
                        </td>
                      </tr>
                    ) : !importHistoryData || importHistoryData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-slate-300">No import records recorded</p>
                        </td>
                      </tr>
                    ) : (
                      importHistoryData.map((imp) => (
                        <tr key={imp._id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 text-white font-medium">
                            <span className="font-bold text-white">{imp.scheduleName || 'Master Import'}</span>
                            <span className="text-[11px] text-slate-400 block font-mono">v{imp.version || '1.0'}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">{imp.authority || 'CPWD'}</td>
                          <td className="py-3.5 px-4 text-slate-400 font-mono text-xs">{imp.fileName}</td>
                          <td className="py-3.5 px-3 text-center font-bold text-white font-mono">
                            {imp.validRowsCount || imp.totalRows || 0}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-full text-[11px] font-semibold border',
                                imp.status === 'Published'
                                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                  : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                              )}
                            >
                              {imp.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center text-slate-400 text-xs">
                            {new Date(imp.createdAt).toLocaleDateString()}
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
      </div>

      {/* ========================================================================= */}
      {/* VIEW DETAILS MODAL */}
      {/* ========================================================================= */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#10141E] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 bg-[#131926] border-b border-slate-800">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white capitalize">
                  {viewingItem.type} Master Details
                </h3>
                {getStatusBadge(viewingItem.item.status)}
              </div>
              <button onClick={() => setViewingItem(null)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar text-xs sm:text-sm">
              <div className="p-4 rounded-xl bg-[#0A0D16] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Name</span>
                  <span className="font-bold text-white text-base">{viewingItem.item.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Code</span>
                  <span className="font-mono text-cyan-300 font-bold">{viewingItem.item.code}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Category</span>
                  <span className="text-white font-medium">{viewingItem.item.category}</span>
                </div>
                {viewingItem.item.subcategory && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Subcategory</span>
                    <span className="text-slate-300">{viewingItem.item.subcategory}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Standard Rate</span>
                  <span className="font-bold text-amber-300 font-mono text-base">
                    ₹{(viewingItem.item.standardRate ?? viewingItem.item.standardDailyRate ?? viewingItem.item.standardHourlyRate)?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    <span className="text-xs text-slate-400 font-normal ml-1">/ {viewingItem.item.unit}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Source</span>
                  <span className="text-slate-300 font-mono">{viewingItem.item.source || 'MARKET'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Rate Version</span>
                  <span className="text-slate-300 font-mono">v{viewingItem.item.rateVersion || '1.0'}</span>
                </div>
                {viewingItem.item.supplier && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Preferred Supplier</span>
                    <span className="text-slate-300">{viewingItem.item.supplier}</span>
                  </div>
                )}
                {viewingItem.item.specification && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-slate-400 block mb-1">Specification</span>
                    <p className="text-slate-300 text-xs leading-relaxed">{viewingItem.item.specification}</p>
                  </div>
                )}
                {viewingItem.item.notes && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-slate-400 block mb-1">Engineering Notes</span>
                    <p className="text-slate-300 text-xs leading-relaxed">{viewingItem.item.notes}</p>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Created: {new Date(viewingItem.item.createdAt).toLocaleDateString()}</span>
                  <span>Updated: {new Date(viewingItem.item.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setViewingItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}
      {isMaterialModalOpen && (
        <MaterialModal
          isOpen={isMaterialModalOpen}
          materialToEdit={materialToEdit}
          availableRateLists={rateListsData || []}
          onClose={() => setIsMaterialModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['qm-materials'] });
            showToast(materialToEdit ? 'Material updated successfully' : 'Material added to master');
          }}
        />
      )}

      {isManpowerModalOpen && (
        <ManpowerModal
          isOpen={isManpowerModalOpen}
          manpowerToEdit={manpowerToEdit}
          availableRateLists={rateListsData || []}
          onClose={() => setIsManpowerModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['qm-manpower'] });
            showToast(manpowerToEdit ? 'Manpower trade updated successfully' : 'Trade added to master');
          }}
        />
      )}

      {isMachineryModalOpen && (
        <MachineryModal
          isOpen={isMachineryModalOpen}
          machineryToEdit={machineryToEdit}
          availableRateLists={rateListsData || []}
          onClose={() => setIsMachineryModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['qm-machinery'] });
            showToast(machineryToEdit ? 'Machinery updated successfully' : 'Machinery added to master');
          }}
        />
      )}

      {isFormulaModalOpen && (
        <FormulaModal
          isOpen={isFormulaModalOpen}
          formulaToEdit={formulaToEdit}
          onClose={() => setIsFormulaModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['qm-formulas'] });
            showToast(formulaToEdit ? 'Formula updated successfully' : 'Work formula created');
          }}
        />
      )}

      {isRateListModalOpen && (
        <RateListModal
          isOpen={isRateListModalOpen}
          rateListToEdit={rateListToEdit}
          onClose={() => setIsRateListModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['qm-rate-lists'] });
            showToast('Rate list saved successfully');
          }}
        />
      )}

      {/* PDF BULK IMPORT & EXTRACTION MODAL */}
      {isPdfImportModalOpen && (
        <QuantityMasterPdfImportModal
          isOpen={isPdfImportModalOpen}
          initialType={pdfImportType}
          onClose={() => setIsPdfImportModalOpen(false)}
          onImportSuccess={(msg) => {
            queryClient.invalidateQueries({ queryKey: ['qm-materials'] });
            queryClient.invalidateQueries({ queryKey: ['qm-manpower'] });
            queryClient.invalidateQueries({ queryKey: ['qm-machinery'] });
            queryClient.invalidateQueries({ queryKey: ['qm-formulas'] });
            queryClient.invalidateQueries({ queryKey: ['qm-rate-lists'] });
            queryClient.invalidateQueries({ queryKey: ['qm-import-history'] });
            showToast(msg);
          }}
        />
      )}
    </div>
  );
};

/* ========================================================================= */
/* MODAL: MATERIAL */
/* ========================================================================= */
const MaterialModal: React.FC<{
  isOpen: boolean;
  materialToEdit: MasterMaterial | null;
  availableRateLists: MasterRateList[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ isOpen, materialToEdit, availableRateLists, onClose, onSuccess }) => {
  const [name, setName] = useState(materialToEdit?.name || '');
  const [code, setCode] = useState(materialToEdit?.code || '');
  const [category, setCategory] = useState(materialToEdit?.category || 'Aggregate');
  const [subcategory, setSubcategory] = useState(materialToEdit?.subcategory || '');
  const [unit, setUnit] = useState(materialToEdit?.unit || 'cum');
  const [standardRate, setStandardRate] = useState<number | ''>(
    materialToEdit?.standardRate !== undefined ? materialToEdit.standardRate : 0
  );
  const [rateListId, setRateListId] = useState<string>(
    typeof materialToEdit?.rateListId === 'object' ? materialToEdit.rateListId?._id || '' : materialToEdit?.rateListId || ''
  );
  const [rateVersion, setRateVersion] = useState(materialToEdit?.rateVersion || '1.0');
  const [source, setSource] = useState(materialToEdit?.source || 'MARKET');
  const [effectiveFrom, setEffectiveFrom] = useState(
    materialToEdit?.effectiveFrom ? new Date(materialToEdit.effectiveFrom).toISOString().slice(0, 10) : ''
  );
  const [effectiveTo, setEffectiveTo] = useState(
    materialToEdit?.effectiveTo ? new Date(materialToEdit.effectiveTo).toISOString().slice(0, 10) : ''
  );
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | 'ARCHIVED'>(materialToEdit?.status || 'ACTIVE');
  const [specification, setSpecification] = useState(materialToEdit?.specification || '');
  const [notes, setNotes] = useState(materialToEdit?.notes || '');
  const [supplier, setSupplier] = useState(materialToEdit?.supplier || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!materialToEdit) {
      const derived = val
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 30);
      setCode(derived);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Material name is required');
      return;
    }
    if (standardRate !== '' && Number(standardRate) < 0) {
      setError('Material rate cannot be negative');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        code: code.trim(),
        category: category.trim(),
        subcategory: subcategory.trim(),
        unit: unit.trim(),
        standardRate: standardRate === '' ? 0 : Number(standardRate),
        rateListId: rateListId || null,
        rateVersion: rateVersion.trim(),
        source: source.trim(),
        effectiveFrom: effectiveFrom || null,
        effectiveTo: effectiveTo || null,
        status,
        specification: specification.trim(),
        notes: notes.trim(),
        supplier: supplier.trim(),
      };
      if (materialToEdit) {
        await api.patch(`/quantity-master/materials/${materialToEdit._id}`, payload);
      } else {
        await api.post('/quantity-master/materials', payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save material');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#10141E] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 my-auto">
        <div className="flex items-center justify-between px-6 py-4 bg-[#131926] border-b border-slate-800">
          <h3 className="font-bold text-sm sm:text-base text-white">
            {materialToEdit ? 'Edit Material Master' : 'Add Material Master'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Material Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. OPC 53 Grade Cement"
                className="w-full px-3 py-2 bg-[#0A0D16] border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Material Code <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="auto-derived code"
                className="w-full px-3 py-2 bg-[#0A0D16] border border-slate-800 rounded-xl text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-[#0A0D16] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="Aggregate">Aggregate</option>
                <option value="Cement">Cement</option>
                <option value="Sand">Sand</option>
                <option value="Steel">Steel & Rebar</option>
                <option value="Bricks">Bricks & Blocks</option>
                <option value="Tiles">Tiles & Stone</option>
                <option value="Finishing">Finishing & Paints</option>
                <option value="Timber">Timber & Wood</option>
                <option value="Chemicals">Chemicals & Admixtures</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Subcategory</label>
              <input
                type="text"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="e.g. 20mm Crushed"
                className="w-full px-3 py-2 bg-[#0A0D16] border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Unit *</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 bg-[#0A0D16] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="cum">cum (m³)</option>
                <option value="bag">bag (50kg)</option>
                <option value="kg">kg</option>
                <option value="MT">MT (Tonne)</option>
                <option value="sqm">sqm (m²)</option>
                <option value="nos">nos</option>
                <option value="litre">litre</option>
                <option value="rmt">rmt (m)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Standard Rate (₹) *</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={standardRate}
                onChange={(e) => setStandardRate(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#0A0D16] border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 bg-[#0A0D16] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="MARKET">Market Average</option>
                <option value="CPWD">CPWD / DSR</option>
                <option value="VENDOR">Vendor Quotation</option>
                <option value="INTERNAL">Internal Estimate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#0A0D16] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Effective From</label>
              <input
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                className="w-full px-3 py-2 bg-[#0A0D16] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Effective To</label>
              <input
                type="date"
                value={effectiveTo}
                onChange={(e) => setEffectiveTo(e.target.value)}
                className="w-full px-3 py-2 bg-[#0A0D16] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Specification</label>
            <input
              type="text"
              value={specification}
              onChange={(e) => setSpecification(e.target.value)}
              placeholder="e.g. Conforming to IS:12269 53 grade standards"
              className="w-full px-3 py-2 bg-[#0A0D16] border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Notes (optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal engineering notes..."
              className="w-full px-3 py-2 bg-[#0A0D16] border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-transparent border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* MODAL: MANPOWER */
/* ========================================================================= */
const ManpowerModal: React.FC<{
  isOpen: boolean;
  manpowerToEdit: MasterLabour | null;
  availableRateLists: MasterRateList[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ isOpen, manpowerToEdit, availableRateLists, onClose, onSuccess }) => {
  const [name, setName] = useState(manpowerToEdit?.name || '');
  const [code, setCode] = useState(manpowerToEdit?.code || '');
  const [category, setCategory] = useState(manpowerToEdit?.category || 'Civil Work');
  const [skillType, setSkillType] = useState(manpowerToEdit?.skillType || 'Skilled');
  const [unit, setUnit] = useState(manpowerToEdit?.unit || 'Day');
  const [standardDailyRate, setStandardDailyRate] = useState<number | ''>(
    manpowerToEdit?.standardDailyRate !== undefined ? manpowerToEdit.standardDailyRate : 800
  );
  const [source, setSource] = useState(manpowerToEdit?.source || 'MARKET');
  const [effectiveDate, setEffectiveDate] = useState(
    manpowerToEdit?.effectiveDate ? new Date(manpowerToEdit.effectiveDate).toISOString().slice(0, 10) : ''
  );
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | 'ARCHIVED'>(manpowerToEdit?.status || 'ACTIVE');
  const [notes, setNotes] = useState(manpowerToEdit?.notes || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Manpower trade name is required');
      return;
    }
    if (standardDailyRate !== '' && Number(standardDailyRate) < 0) {
      setError('Daily wage rate cannot be negative');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        code: code.trim(),
        category: category.trim(),
        skillType,
        unit: unit.trim(),
        standardDailyRate: standardDailyRate === '' ? 0 : Number(standardDailyRate),
        source: source.trim(),
        effectiveDate: effectiveDate || null,
        status,
        notes: notes.trim(),
      };
      if (manpowerToEdit) {
        await api.patch(`/quantity-master/manpower/${manpowerToEdit._id}`, payload);
      } else {
        await api.post('/quantity-master/manpower', payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save trade');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#10141E] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 my-auto">
        <div className="flex items-center justify-between px-6 py-4 bg-[#131926] border-b border-slate-800">
          <h3 className="font-bold text-sm sm:text-base text-white">
            {manpowerToEdit ? 'Edit Manpower Master' : 'Add Manpower Master'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Trade / Labour Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mason (Brick / Plaster)"
                className="w-full px-3 py-2 bg-[#0A0D16] border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Trade Code <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. L-MASON"
                className="w-full px-3 py-2 bg-[#0A0D16] border border-slate-800 rounded-xl text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Skill Classification *</label>
              <select
                value={skillType}
                onChange={(e) => setSkillType(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#0A0D16] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="Skilled">Skilled</option>
                <option value="Semi-Skilled">Semi-Skilled</option>
                <option value="Unskilled">Unskilled</option>
                <option value="Supervisory">Supervisory</option>
                <option value="Specialist">Specialist</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Daily Wage (₹) *</label>
              <input
                type="number"
                min={0}
                step={10}
                value={standardDailyRate}
                onChange={(e) => setStandardDailyRate(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#0A0D16] border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#0A0D16] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Standard gang deployment notes..."
              className="w-full px-3 py-2 bg-[#0A0D16] border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-transparent border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Trade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* MODAL: MACHINERY */
/* ========================================================================= */
const MachineryModal: React.FC<{
  isOpen: boolean;
  machineryToEdit: MasterMachinery | null;
  availableRateLists: MasterRateList[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ isOpen, machineryToEdit, availableRateLists, onClose, onSuccess }) => {
  const [name, setName] = useState(machineryToEdit?.name || '');
  const [code, setCode] = useState(machineryToEdit?.code || '');
  const [category, setCategory] = useState(machineryToEdit?.category || 'Concreting');
  const [unit, setUnit] = useState(machineryToEdit?.unit || 'Hour');
  const [rateType, setRateType] = useState(machineryToEdit?.rateType || 'Hourly');
  const [standardHourlyRate, setStandardHourlyRate] = useState<number | ''>(
    machineryToEdit?.standardHourlyRate !== undefined ? machineryToEdit.standardHourlyRate : 1200
  );
  const [source, setSource] = useState(machineryToEdit?.source || 'MARKET');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | 'ARCHIVED'>(machineryToEdit?.status || 'ACTIVE');
  const [notes, setNotes] = useState(machineryToEdit?.notes || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Machinery name is required');
      return;
    }
    if (standardHourlyRate !== '' && Number(standardHourlyRate) < 0) {
      setError('Hourly rate cannot be negative');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        code: code.trim(),
        category: category.trim(),
        unit: unit.trim(),
        rateType,
        standardHourlyRate: standardHourlyRate === '' ? 0 : Number(standardHourlyRate),
        source: source.trim(),
        status,
        notes: notes.trim(),
      };
      if (machineryToEdit) {
        await api.patch(`/quantity-master/machinery/${machineryToEdit._id}`, payload);
      } else {
        await api.post('/quantity-master/machinery', payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save machinery');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#10141E] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 my-auto">
        <div className="flex items-center justify-between px-6 py-4 bg-[#131926] border-b border-slate-800">
          <h3 className="font-bold text-sm sm:text-base text-white">
            {machineryToEdit ? 'Edit Machinery Master' : 'Add Machinery Master'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Equipment Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Concrete Pump (Boom)"
                className="w-full px-3 py-2 bg-[#0A0D16] border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Equipment Code <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. T-PUMP"
                className="w-full px-3 py-2 bg-[#0A0D16] border border-slate-800 rounded-xl text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-[#0A0D16] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="Concreting">Concreting</option>
                <option value="Earthmoving">Earthmoving</option>
                <option value="Compaction">Compaction</option>
                <option value="Lifting">Lifting</option>
                <option value="Transport">Transport</option>
                <option value="Pumping">Pumping</option>
                <option value="Access">Access</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Hire Rate (₹) *</label>
              <input
                type="number"
                min={0}
                step={50}
                value={standardHourlyRate}
                onChange={(e) => setStandardHourlyRate(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#0A0D16] border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Rate Basis</label>
              <select
                value={rateType}
                onChange={(e) => setRateType(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#0A0D16] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="Hourly">Hourly (/hr)</option>
                <option value="Daily">Daily (/day)</option>
                <option value="Shift">Shift (/shift)</option>
                <option value="Trip">Trip (/trip)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Fuel, operator and mobilization conditions..."
              className="w-full px-3 py-2 bg-[#0A0D16] border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-transparent border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Machinery'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* MODAL: FORMULA */
/* ========================================================================= */
const FormulaModal: React.FC<{
  isOpen: boolean;
  formulaToEdit: MasterFormula | null;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ isOpen, formulaToEdit, onClose, onSuccess }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(formulaToEdit?.name || '');
  const [category, setCategory] = useState(formulaToEdit?.category || 'Concrete Work');
  const [unit, setUnit] = useState(formulaToEdit?.unit || 'Cum');
  const [description, setDescription] = useState(formulaToEdit?.description || '');

  const [materialFactors, setMaterialFactors] = useState(
    formulaToEdit?.materialFactors || [
      { name: 'OPC 43 Cement', materialCode: 'cement', unit: 'bag', factor: 6.4, wastePercent: 2 },
      { name: 'Coarse Sand', materialCode: 'sand', unit: 'cum', factor: 0.45, wastePercent: 5 },
      { name: 'Aggregate 20mm', materialCode: 'agg_20mm', unit: 'cum', factor: 0.88, wastePercent: 3 },
    ]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Formula name is required');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        category: category.trim(),
        unit: unit.trim(),
        description: description.trim(),
        materialFactors,
      };
      if (formulaToEdit) {
        await api.patch(`/quantity-master/formulas/${formulaToEdit._id}`, payload);
      } else {
        await api.post('/quantity-master/formulas', payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save formula');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#10141E] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        <div className="flex items-center justify-between px-6 py-4 bg-[#131926] border-b border-slate-800">
          <h3 className="font-bold text-sm sm:text-base text-white">
            {formulaToEdit ? 'Edit Work Formula' : 'New Work Formula'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Work / Formula Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. M20 Concrete (1:1.5:3)"
                    className="w-full px-3 py-2 bg-[#0A0D16] border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Work Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A0D16] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Concrete Work">Concrete Work</option>
                    <option value="Brickwork">Brickwork</option>
                    <option value="Plastering">Plastering</option>
                    <option value="Flooring">Flooring</option>
                    <option value="Painting">Painting</option>
                    <option value="Earthwork">Earthwork</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Output Unit *</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A0D16] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Cum">Cum (m³)</option>
                    <option value="Sqm">Sqm (m²)</option>
                    <option value="Rmt">Rmt (m)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Reference Standard</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. IS:456 Table 9"
                    className="w-full px-3 py-2 bg-[#0A0D16] border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-white uppercase tracking-wider">
                  Material Factors (Per 1 {unit})
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setMaterialFactors((prev) => [
                      ...prev,
                      { name: 'New Ingredient', materialCode: 'mat_item', unit: 'kg', factor: 1, wastePercent: 0 },
                    ])
                  }
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Ingredient</span>
                </button>
              </div>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {materialFactors.map((mf, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#0A0D16] border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-center"
                  >
                    <input
                      type="text"
                      value={mf.name}
                      onChange={(e) => {
                        const updated = [...materialFactors];
                        updated[idx].name = e.target.value;
                        setMaterialFactors(updated);
                      }}
                      className="px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400">Factor:</span>
                      <input
                        type="number"
                        step={0.001}
                        value={mf.factor}
                        onChange={(e) => {
                          const updated = [...materialFactors];
                          updated[idx].factor = Number(e.target.value);
                          setMaterialFactors(updated);
                        }}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700/80 rounded-lg text-xs font-mono text-amber-300 font-bold"
                      />
                    </div>
                    <input
                      type="text"
                      value={mf.unit}
                      onChange={(e) => {
                        const updated = [...materialFactors];
                        updated[idx].unit = e.target.value;
                        setMaterialFactors(updated);
                      }}
                      className="px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white text-center font-mono"
                    />
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => setMaterialFactors(materialFactors.filter((_, i) => i !== idx))}
                        className="p-1 rounded text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {step === 1 ? (
              <div />
            ) : (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl bg-transparent border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium"
              >
                Back
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-transparent border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium"
              >
                Cancel
              </button>
              {step === 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!name.trim()) {
                      setError('Formula name is required');
                      return;
                    }
                    setError(null);
                    setStep(2);
                  }}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md"
                >
                  Next: Ingredients →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Formula'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* MODAL: RATE LIST */
/* ========================================================================= */
const RateListModal: React.FC<{
  isOpen: boolean;
  rateListToEdit: MasterRateList | null;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ isOpen, rateListToEdit, onClose, onSuccess }) => {
  const [name, setName] = useState(rateListToEdit?.name || '');
  const [description, setDescription] = useState(rateListToEdit?.description || '');
  const [isDefault, setIsDefault] = useState(rateListToEdit?.isDefault || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Rate list name is required');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        isDefault,
      };
      await api.post('/quantity-master/rate-lists', payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save rate list');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#10141E] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        <div className="flex items-center justify-between px-6 py-4 bg-[#131926] border-b border-slate-800">
          <h3 className="font-bold text-sm sm:text-base text-white">
            {rateListToEdit ? 'Edit Rate List' : 'New Regional Rate List'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Rate List Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Delhi NCR Schedule Rates 2026"
              className="w-full px-3 py-2 bg-[#0A0D16] border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Description / Location</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Applicable for Gurugram & Noida tender work"
              className="w-full px-3 py-2 bg-[#0A0D16] border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefaultRateList"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded"
            />
            <label htmlFor="isDefaultRateList" className="text-xs text-slate-300 font-medium cursor-pointer">
              Set as company default reference rate list
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-transparent border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Rate List'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
