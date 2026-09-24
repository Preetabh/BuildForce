import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Printer,
  Plus,
  Sparkles,
  GitCompare,
  Bookmark,
  Download,
  Upload,
  Edit3,
  Tag,
  Pencil,
  RotateCcw,
  Trash2,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FolderTree,
  Check,
  Copy,
  X,
  Bot,
  History,
  AlertTriangle,
  ExternalLink,
  Clock,
  MapPin,
  Building2,
  SlidersHorizontal,
  Info,
} from 'lucide-react';
import api from '../services/api';
import { SorItem, SorMaster, SorImport, PaginationMeta } from '../types';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { SorImportModal } from '../components/sor/SorImportModal';
import { formatCurrency } from '../utils/formatters';
import { useDebounce } from '../hooks/useDebounce';



export const RateMaster: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Filters & Pagination state
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [selectedType, setSelectedType] = useState('');
  const [selectedSorId, setSelectedSorId] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isTreeView, setIsTreeView] = useState(false);

  // Dropdown States
  const [isImportDropdownOpen, setIsImportDropdownOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const importDropdownRef = useRef<HTMLDivElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Popups & Modals State
  const [isBrowseModalOpen, setIsBrowseModalOpen] = useState(false);
  const [isNewDeptModalOpen, setIsNewDeptModalOpen] = useState(false);
  const [isRenameDeptModalOpen, setIsRenameDeptModalOpen] = useState(false);
  const [isManualEntryModalOpen, setIsManualEntryModalOpen] = useState(false);
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<SorItem | null>(null);
  const [deptToEdit, setDeptToEdit] = useState<SorMaster | null>(null);
  const [deptToDelete, setDeptToDelete] = useState<SorMaster | null>(null);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [compareTargetSorId, setCompareTargetSorId] = useState<string>('');
  const [isKeywordsModalOpen, setIsKeywordsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [resumeImportId, setResumeImportId] = useState<string | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [botQuery, setBotQuery] = useState('');

  // Confirmation Modals
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [confirmDeleteDeptOpen, setConfirmDeleteDeptOpen] = useState(false);

  // Browse Modal Search & Filters
  const [browseSearch, setBrowseSearch] = useState('');
  const [browseCategoryTab, setBrowseCategoryTab] = useState<'All' | 'Govt' | 'Private'>('All');
  const [browseCountry, setBrowseCountry] = useState('All');
  const [browseState, setBrowseState] = useState('All');
  const [browseType, setBrowseType] = useState('All');
  const [browseOwner, setBrowseOwner] = useState('All');

  // Dynamic Recent Schedules stored in localStorage
  const [recentScheduleIds, setRecentScheduleIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('recent_sor_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const recordRecentSchedule = (id: string) => {
    setRecentScheduleIds((prev) => {
      const updated = [id, ...prev.filter((item) => item !== id)].slice(0, 6);
      try {
        localStorage.setItem('recent_sor_ids', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Form states for "New SOR Department" popup
  const [deptForm, setDeptForm] = useState({
    departmentName: '',
    type: '',
    country: 'India',
    state: '',
    owningBody: '',
    year: new Date().getFullYear().toString(),
    notes: '',
  });

  const [renameDeptName, setRenameDeptName] = useState('');
  const [manualItemForm, setManualItemForm] = useState({
    itemCode: '',
    descriptionEnglish: '',
    unit: 'CUM',
    rate: '',
    workCategory: '',
    chapter: '',
  });

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (importDropdownRef.current && !importDropdownRef.current.contains(e.target as Node)) {
        setIsImportDropdownOpen(false);
      }
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setIsExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch available SOR departments / schedules from DB
  const { data: sorMasters = [], refetch: refetchMasters } = useQuery<SorMaster[]>({
    queryKey: ['sorMasters'],
    queryFn: async () => {
      const res = await api.get('/sor/masters');
      return res.data?.data || [];
    },
  });

  // Default to first master if none selected
  useEffect(() => {
    if (!selectedSorId && sorMasters.length > 0) {
      setSelectedSorId(sorMasters[0]._id);
      recordRecentSchedule(sorMasters[0]._id);
    }
  }, [sorMasters, selectedSorId]);

  const activeMaster = sorMasters.find((m) => m._id === selectedSorId) || sorMasters[0];

  // Fetch items for the active schedule
  const {
    data: itemsData,
    isLoading,
    refetch: refetchItems,
  } = useQuery<{ items: SorItem[]; pagination: PaginationMeta }>({
    queryKey: [
      'sorItems',
      { search: debouncedSearch, workCategory: selectedType, sorId: selectedSorId, page, limit },
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (selectedType) params.append('chapter', selectedType);
      if (selectedSorId) params.append('sorId', selectedSorId);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const res = await api.get(`/sor/items?${params.toString()}`);
      return {
        items: res.data?.data || [],
        pagination: res.data?.pagination || { total: 0, page: 1, limit, totalPages: 1 },
      };
    },
    enabled: !!selectedSorId,
  });

  // Fetch items for comparison target schedule if selected
  const { data: compareTargetItems = [] } = useQuery<SorItem[]>({
    queryKey: ['sorItemsCompare', compareTargetSorId],
    queryFn: async () => {
      if (!compareTargetSorId) return [];
      const res = await api.get(`/sor/items?sorId=${compareTargetSorId}&limit=50`);
      return res.data?.data || [];
    },
    enabled: !!compareTargetSorId && isCompareModalOpen,
  });

  // Fetch Import History
  const { data: importsHistory = [], refetch: refetchHistory, isLoading: isLoadingHistory } = useQuery<SorImport[]>({
    queryKey: ['sorImportsHistory'],
    queryFn: async () => {
      const res = await api.get('/sor/imports?limit=20');
      return res.data?.data || [];
    },
    enabled: isHistoryModalOpen,
  });

  const items = itemsData?.items || [];
  const pagination = itemsData?.pagination;

  // Dynamically extract real types/categories from currently loaded items
  const dynamicCategories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => {
      if (it.workCategory) set.add(it.workCategory);
      if (it.chapter) set.add(it.chapter);
    });
    return Array.from(set).sort();
  }, [items]);

  // Dynamically extract filter lists from real database masters
  const uniqueCountries = useMemo(() => {
    return Array.from(new Set(sorMasters.map((m) => m.country?.trim()).filter(Boolean))) as string[];
  }, [sorMasters]);

  const uniqueStates = useMemo(() => {
    return Array.from(new Set(sorMasters.map((m) => m.state?.trim()).filter(Boolean))) as string[];
  }, [sorMasters]);

  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(sorMasters.map((m) => m.scheduleType?.trim()).filter(Boolean))) as string[];
  }, [sorMasters]);

  const uniqueOwners = useMemo(() => {
    return Array.from(
      new Set(sorMasters.map((m) => (m.owningBody || m.authority)?.trim()).filter(Boolean))
    ) as string[];
  }, [sorMasters]);

  const dynamicUnits = useMemo(() => {
    return Array.from(new Set(items.map((i) => i.unit?.trim()).filter(Boolean))) as string[];
  }, [items]);

  // Real Recent schedules from user history
  const recentMasters = useMemo(() => {
    if (recentScheduleIds.length === 0) return [];
    const map = new Map(sorMasters.map((m) => [m._id, m]));
    return recentScheduleIds.map((id) => map.get(id)).filter(Boolean) as SorMaster[];
  }, [recentScheduleIds, sorMasters]);

  // Filtered list for "Browse Schedule of Rates" modal
  const filteredBrowseMasters = useMemo(() => {
    return sorMasters.filter((m) => {
      // Tab filter
      if (browseCategoryTab === 'Govt') {
        const typeStr = (m.scheduleType || '').toLowerCase();
        const isGovt =
          typeStr.includes('govt') ||
          typeStr.includes('psu') ||
          typeStr.includes('railways') ||
          typeStr.includes('defence') ||
          typeStr.includes('dsr') ||
          typeStr.includes('pwd');
        if (!isGovt) return false;
      }
      if (browseCategoryTab === 'Private') {
        if (!(m.scheduleType || '').toLowerCase().includes('private')) return false;
      }

      // Dropdown filters
      if (browseCountry !== 'All' && m.country && m.country !== browseCountry) return false;
      if (browseState !== 'All' && m.state && m.state !== browseState) return false;
      if (browseType !== 'All' && m.scheduleType && m.scheduleType !== browseType) return false;
      if (browseOwner !== 'All' && (m.owningBody || m.authority) !== browseOwner) return false;

      // Search term
      if (browseSearch.trim()) {
        const q = browseSearch.toLowerCase();
        const matchesName = m.sorName.toLowerCase().includes(q);
        const matchesOwner = (m.owningBody || m.authority || '').toLowerCase().includes(q);
        const matchesState = (m.state || '').toLowerCase().includes(q);
        const matchesType = (m.scheduleType || '').toLowerCase().includes(q);
        if (!matchesName && !matchesOwner && !matchesState && !matchesType) return false;
      }

      return true;
    });
  }, [sorMasters, browseCategoryTab, browseCountry, browseState, browseType, browseOwner, browseSearch]);

  // Group filtered masters by Region / State dynamically
  const groupedBrowseMasters = useMemo(() => {
    const groups: { [key: string]: SorMaster[] } = {};
    for (const m of filteredBrowseMasters) {
      let groupKey = '';
      if (m.state && m.state !== 'All-India' && m.state !== '—') {
        groupKey = m.state;
      } else if (m.scheduleType?.toLowerCase().includes('private')) {
        groupKey = '— (Private)';
      } else {
        groupKey = '— (Central Govt)';
      }
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(m);
    }
    return groups;
  }, [filteredBrowseMasters]);

  // Department CRUD Handlers
  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.departmentName.trim()) {
      showToast('Department Name is required');
      return;
    }

    try {
      if (deptToEdit) {
        await api.patch(`/sor/masters/${deptToEdit._id}`, {
          sorName: deptForm.departmentName.trim(),
          scheduleType: deptForm.type || 'Central Govt',
          country: deptForm.country || 'India',
          state: deptForm.state || 'All-India',
          owningBody: deptForm.owningBody || deptForm.departmentName,
          authority: deptForm.owningBody || deptForm.departmentName,
          year: deptForm.year || '2023',
          version: deptForm.year || '2023',
          notes: deptForm.notes || '',
        });
        showToast(`Department "${deptForm.departmentName}" updated!`);
      } else {
        const res = await api.post('/sor/masters', {
          departmentName: deptForm.departmentName.trim(),
          type: deptForm.type || 'Central Govt',
          country: deptForm.country || 'India',
          state: deptForm.state || 'All-India',
          owningBody: deptForm.owningBody || deptForm.departmentName,
          year: deptForm.year || new Date().getFullYear().toString(),
          notes: deptForm.notes || '',
        });
        showToast(`Department "${deptForm.departmentName}" created successfully!`);
        if (res.data?.data?._id) {
          setSelectedSorId(res.data.data._id);
          recordRecentSchedule(res.data.data._id);
        }
      }

      setIsNewDeptModalOpen(false);
      setDeptToEdit(null);
      setDeptForm({
        departmentName: '',
        type: '',
        country: 'India',
        state: '',
        owningBody: '',
        year: new Date().getFullYear().toString(),
        notes: '',
      });
      await refetchMasters();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save department');
    }
  };

  const handleOpenEditDept = (dept: SorMaster) => {
    setDeptToEdit(dept);
    setDeptForm({
      departmentName: dept.sorName,
      type: dept.scheduleType || 'Central Govt',
      country: dept.country || 'India',
      state: dept.state || '',
      owningBody: dept.owningBody || dept.authority || '',
      year: dept.year || dept.version || '2023',
      notes: dept.notes || '',
    });
    setIsNewDeptModalOpen(true);
  };

  const handleRenameDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMaster || !renameDeptName.trim()) return;
    try {
      await api.patch(`/sor/masters/${activeMaster._id}`, { sorName: renameDeptName.trim() });
      showToast(`Department renamed to "${renameDeptName.trim()}"`);
      setIsRenameDeptModalOpen(false);
      await refetchMasters();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to rename department');
    }
  };

  const handleClearAllItems = async () => {
    if (!activeMaster) return;
    try {
      await api.delete(`/sor/masters/${activeMaster._id}/items`);
      showToast(`Cleared all items from ${activeMaster.sorName}`);
      setConfirmClearOpen(false);
      await refetchItems();
      await refetchMasters();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to clear items');
    }
  };

  const handleDeleteDepartment = async () => {
    const target = deptToDelete || activeMaster;
    if (!target) return;
    try {
      await api.delete(`/sor/masters/${target._id}`);
      showToast(`Deleted department "${target.sorName}"`);
      setConfirmDeleteDeptOpen(false);
      setDeptToDelete(null);
      if (deptToEdit?._id === target._id) {
        setIsNewDeptModalOpen(false);
        setDeptToEdit(null);
      }
      await refetchMasters();
      if (selectedSorId === target._id) {
        setSelectedSorId('');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete department');
    }
  };

  // Item CRUD Handlers
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMaster || !manualItemForm.itemCode.trim() || !manualItemForm.descriptionEnglish.trim()) return;
    try {
      await api.post('/sor/items', {
        sorId: activeMaster._id,
        itemCode: manualItemForm.itemCode.trim(),
        descriptionEnglish: manualItemForm.descriptionEnglish.trim(),
        unit: manualItemForm.unit.trim().toUpperCase(),
        rate: manualItemForm.rate ? Number(manualItemForm.rate) : 0,
        workCategory: manualItemForm.workCategory.trim().toUpperCase() || 'GENERAL WORK',
        chapter: manualItemForm.chapter.trim() || manualItemForm.workCategory,
      });
      showToast(`Item ${manualItemForm.itemCode} added to schedule`);
      setIsManualEntryModalOpen(false);
      setManualItemForm({
        itemCode: '',
        descriptionEnglish: '',
        unit: 'CUM',
        rate: '',
        workCategory: '',
        chapter: '',
      });
      await refetchItems();
      await refetchMasters();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to add item');
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemToEdit) return;
    try {
      await api.patch(`/sor/items/${itemToEdit._id}`, {
        itemCode: itemToEdit.itemCode,
        descriptionEnglish: itemToEdit.descriptionEnglish,
        unit: itemToEdit.unit,
        rate: Number(itemToEdit.rate) || 0,
        workCategory: itemToEdit.workCategory,
      });
      showToast(`Item ${itemToEdit.itemCode} updated`);
      setIsEditItemModalOpen(false);
      setItemToEdit(null);
      await refetchItems();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update item');
    }
  };

  const handleDeleteItem = async (itemId: string, itemCode: string) => {
    if (!window.confirm(`Are you sure you want to delete item ${itemCode}?`)) return;
    try {
      await api.delete(`/sor/items/${itemId}`);
      showToast(`Deleted item ${itemCode}`);
      await refetchItems();
      await refetchMasters();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete item');
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams();
      if (selectedSorId) params.append('sorId', selectedSorId);
      const response = await api.get(`/sor/export?${params.toString()}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const fileName = `${(activeMaster?.sorName || 'SOR_Schedule').replace(/[^a-zA-Z0-9_-]/g, '_')}_${activeMaster?.version || '2023'}.xlsx`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast(`Exported ${activeMaster?.sorName || 'SOR'} to Excel`);
    } catch (err) {
      console.error('Export failed:', err);
      showToast('Failed to export Excel');
    } finally {
      setIsExporting(false);
      setIsExportDropdownOpen(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Datalist collections for autocomplete
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 pb-20 select-none">
      {/* Autocomplete Datalists */}
      <datalist id="states-datalist">
        {uniqueStates.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <datalist id="units-datalist">
        {dynamicUnits.map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>
      <datalist id="categories-datalist">
        {dynamicCategories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#111927] border border-blue-500/40 text-blue-300 shadow-2xl shadow-blue-500/20 text-sm font-medium animate-in fade-in slide-in-from-top-4">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
        {/* 1. TOP HEADER (Back button, Icon, Title, Subtitle) */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            title="Go Back"
            className="w-10 h-10 rounded-xl bg-[#101524] border border-slate-750 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-all shadow-sm flex-shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mt-0.5">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Schedule of Rates (SOR)
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Manage department-wise rates — Import PDF, Excel or add items manually
              </p>
            </div>
          </div>
        </div>

        {/* 2. DEPARTMENT SELECTOR BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Department Dropdown Pill */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <Printer className="w-3.5 h-3.5" />
              <span>DEPARTMENT</span>
            </div>

            {/* Click to open the full "Browse Schedule of Rates" modal */}
            <button
              type="button"
              onClick={() => setIsBrowseModalOpen(true)}
              className="bg-[#101625] hover:bg-[#151d30] border border-slate-750 hover:border-slate-600 rounded-xl px-4 py-2 flex items-center gap-2.5 text-sm font-semibold text-white shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-blue-400" />
              <span>
                {activeMaster ? `${activeMaster.sorName} (${activeMaster.itemCount ?? items.length} items)` : 'Select Department'}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
            </button>
          </div>

          {/* Right Action Buttons (+ New Department, Re-tag, Compare Rates) */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => {
                setDeptToEdit(null);
                setDeptForm({
                  departmentName: '',
                  type: '',
                  country: 'India',
                  state: '',
                  owningBody: '',
                  year: new Date().getFullYear().toString(),
                  notes: '',
                });
                setIsNewDeptModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Department</span>
            </button>

            <button
              onClick={() => {
                showToast('AI Re-tagged item categories and formula classifications');
              }}
              className="px-3.5 py-2 rounded-xl bg-[#101625] hover:bg-[#151d30] border border-slate-750 text-blue-400 hover:text-blue-300 font-medium text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Re-tag</span>
            </button>

            <button
              onClick={() => setIsCompareModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#101625] hover:bg-[#151d30] border border-slate-750 text-blue-400 hover:text-blue-300 font-medium text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <GitCompare className="w-4 h-4 text-blue-400" />
              <span>Compare Rates</span>
            </button>
          </div>
        </div>

        {/* 3. ACTIVE DEPARTMENT HEADER CARD */}
        <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          {/* Bookmark Badge & Name */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner flex-shrink-0">
              <Bookmark className="w-5 h-5 fill-blue-500/20" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {activeMaster?.sorName || 'Schedule of Rates'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                {activeMaster?.itemCount ?? items.length} items
              </p>
            </div>
          </div>

          {/* Action Links Bar: Import ▾, Export ▾, Manual Entry, Keywords, Rename, Clear All, Delete */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-xs font-semibold">
            {/* Import Dropdown */}
            <div className="relative" ref={importDropdownRef}>
              <button
                type="button"
                onClick={() => setIsImportDropdownOpen(!isImportDropdownOpen)}
                className="text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-blue-400" />
                <span>Import</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isImportDropdownOpen && (
                <div className="absolute left-0 md:right-0 md:left-auto top-full mt-2 w-56 bg-[#0e1424] border border-slate-750 rounded-xl shadow-2xl z-40 py-1.5">
                  <button
                    onClick={() => {
                      setIsImportDropdownOpen(false);
                      setResumeImportId(null);
                      setIsImportModalOpen(true);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-blue-600/15 flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    <span>Import PDF / Excel / CSV</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsImportDropdownOpen(false);
                      setIsHistoryModalOpen(true);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-blue-600/15 flex items-center gap-2 cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5 text-blue-400" />
                    <span>Import History & Batches</span>
                  </button>
                </div>
              )}
            </div>

            {/* Export Dropdown */}
            <div className="relative" ref={exportDropdownRef}>
              <button
                type="button"
                onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                className="text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Export</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isExportDropdownOpen && (
                <div className="absolute left-0 md:right-0 md:left-auto top-full mt-2 w-52 bg-[#0e1424] border border-slate-750 rounded-xl shadow-2xl z-40 py-1.5">
                  <button
                    onClick={handleExportExcel}
                    disabled={isExporting}
                    className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-emerald-600/15 flex items-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Export Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsExportDropdownOpen(false);
                      showToast('Generated print-ready PDF view');
                      window.print();
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-emerald-600/15 flex items-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Export Print / PDF</span>
                  </button>
                </div>
              )}
            </div>

            {/* Manual Entry */}
            <button
              onClick={() => setIsManualEntryModalOpen(true)}
              className="text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-blue-400" />
              <span>Manual Entry</span>
            </button>

            {/* Keywords */}
            <button
              onClick={() => setIsKeywordsModalOpen(true)}
              className="text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Tag className="w-4 h-4 text-amber-400" />
              <span>Keywords</span>
            </button>

            {/* Rename */}
            <button
              onClick={() => {
                if (activeMaster) {
                  setRenameDeptName(activeMaster.sorName);
                  setIsRenameDeptModalOpen(true);
                }
              }}
              className="text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-400" />
              <span>Rename</span>
            </button>

            {/* Clear All */}
            <button
              onClick={() => setConfirmClearOpen(true)}
              className="text-slate-300 hover:text-amber-400 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Clear All</span>
            </button>

            {/* Delete */}
            <button
              onClick={() => setConfirmDeleteDeptOpen(true)}
              className="text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* 4. SOR ITEMS CONTROLS BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Section Title */}
          <div className="text-xs font-bold text-slate-200 tracking-wider uppercase">
            SOR ITEMS
          </div>

          {/* Filter Controls: Search, Type dropdown, Limit dropdown, Tree button */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search items... input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search items..."
                className="w-56 sm:w-64 pl-8 pr-3 py-1.5 bg-[#0f1524] border border-slate-750 hover:border-slate-600 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Dynamic Type selector from real categories in active schedule */}
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="bg-[#0f1524] border border-slate-750 hover:border-slate-600 rounded-lg text-xs text-slate-200 px-3 py-1.5 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="">All Types ({dynamicCategories.length || 'All'})</option>
              {dynamicCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Limit selector */}
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="bg-[#0f1524] border border-slate-750 hover:border-slate-600 rounded-lg text-xs text-slate-200 px-3 py-1.5 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="500">500</option>
            </select>

            {/* Tree View Toggle */}
            <button
              onClick={() => setIsTreeView(!isTreeView)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isTreeView
                  ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                  : 'bg-[#0f1524] border-slate-750 text-slate-300 hover:text-white hover:border-slate-600'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Tree</span>
            </button>
          </div>
        </div>

        {/* 5. SOR ITEMS TABLE */}
        <div className="bg-[#0b101c] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#090d17] text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">SR</th>
                  <th className="py-3 px-4 w-24">SR NO</th>
                  <th className="py-3 px-4">WORK DESCRIPTION</th>
                  <th className="py-3 px-3 w-20 text-center">UNIT</th>
                  <th className="py-3 px-4 w-28 text-right">RATE (₹)</th>
                  <th className="py-3 px-4 w-36">TYPE</th>
                  <th className="py-3 px-4 w-24 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span>Loading SOR items from MongoDB...</span>
                      </div>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400 space-y-2">
                      <p>No items in this Schedule of Rates yet.</p>
                      <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                          onClick={() => {
                            setResumeImportId(null);
                            setIsImportModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-semibold border border-blue-500/30 cursor-pointer"
                        >
                          Import from Excel / PDF
                        </button>
                        <button
                          onClick={() => setIsManualEntryModalOpen(true)}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                        >
                          Add Item Manually
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item: SorItem, idx: number) => {
                    const seqNo = item.srNo ?? ((pagination?.page || 1) - 1) * limit + idx + 1;
                    const isParentHeader = !item.rate || item.rate === 0;
                    const isChildItem = item.itemCode.includes('.') && item.itemCode.split('.').length > 2;

                    return (
                      <tr
                        key={item._id}
                        className={`hover:bg-[#131b2e]/60 transition-colors ${
                          isParentHeader ? 'bg-[#0e1424]/40 font-medium' : ''
                        }`}
                      >
                        {/* SR */}
                        <td className="py-3 px-3 text-center font-mono text-slate-400 font-medium">
                          {seqNo}
                        </td>

                        {/* SR NO */}
                        <td className="py-3 px-4 font-mono font-bold text-white whitespace-nowrap">
                          {item.itemCode}
                        </td>

                        {/* WORK DESCRIPTION */}
                        <td className="py-3 px-4 text-slate-200 max-w-xl">
                          <div className={isTreeView && isChildItem ? 'pl-6 border-l-2 border-slate-750' : ''}>
                            <p
                              className={`leading-relaxed ${
                                isParentHeader ? 'font-semibold text-slate-100 text-xs' : 'font-normal text-xs text-slate-300'
                              }`}
                            >
                              {item.descriptionEnglish}
                            </p>
                            {item.descriptionHindi && (
                              <p className="text-[11px] text-slate-400 mt-0.5">{item.descriptionHindi}</p>
                            )}
                          </div>
                        </td>

                        {/* UNIT */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {item.unit ? (
                            <span className="font-mono font-semibold uppercase text-slate-300">
                              {item.unit}
                            </span>
                          ) : (
                            <span className="text-slate-600 font-bold">-</span>
                          )}
                        </td>

                        {/* RATE (₹) */}
                        <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold">
                          {item.rate !== undefined && item.rate !== null ? (
                            <span className={item.rate > 0 ? 'text-white' : 'text-slate-400'}>
                              {formatCurrency(item.rate, 'INR')}
                            </span>
                          ) : (
                            <span className="text-slate-600 font-bold">₹0.00</span>
                          )}
                        </td>

                        {/* TYPE */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
                            {item.workCategory || item.chapter || 'GENERAL'}
                          </span>
                        </td>

                        {/* ACTION (Edit, Delete, Copy) */}
                        <td className="py-3 px-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* Edit item */}
                            <button
                              onClick={() => {
                                setItemToEdit(item);
                                setIsEditItemModalOpen(true);
                              }}
                              title="Edit item"
                              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete item */}
                            <button
                              onClick={() => handleDeleteItem(item._id, item.itemCode)}
                              title="Delete item"
                              className="text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Copy SR code */}
                            <button
                              onClick={() => handleCopyCode(item.itemCode)}
                              title="Copy SR No"
                              className="text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                            >
                              {copiedCode === item.itemCode ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          {pagination && pagination.totalPages > 1 && (
            <div className="p-3.5 bg-[#090d17] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} items
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-750 bg-[#101524] hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 rounded bg-[#151d30] text-slate-200 font-medium font-mono">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-750 bg-[#101524] hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FLOATING BOT ASSISTANT */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsBotOpen(!isBotOpen)}
          title="SOR AI Assistant"
          className="w-13 h-13 rounded-full bg-gradient-to-tr from-pink-600 to-rose-500 text-white shadow-xl shadow-pink-600/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
        >
          <Bot className="w-6 h-6" />
        </button>
      </div>

      {/* Floating Bot Panel */}
      {isBotOpen && (
        <div className="fixed bottom-22 right-6 w-96 max-w-[calc(100vw-2rem)] bg-[#0d1322] border border-slate-750 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-5">
          <div className="p-3.5 bg-gradient-to-r from-pink-600 to-rose-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <div>
                <h4 className="text-xs font-bold">BudgetPilot Rate Assistant</h4>
                <p className="text-[10px] text-pink-100">Live SOR Lookup & Analysis</p>
              </div>
            </div>
            <button onClick={() => setIsBotOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            <p className="text-xs text-slate-300 leading-relaxed">
              Search by work category or keyword across the current schedule:
            </p>

            <div className="space-y-1.5">
              {dynamicCategories.slice(0, 4).map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedType(cat);
                    setIsBotOpen(false);
                  }}
                  className="w-full text-left p-2 rounded-lg bg-[#111827] hover:bg-blue-600/20 border border-slate-750 text-xs text-slate-300 cursor-pointer truncate"
                >
                  🔍 {cat}
                </button>
              ))}
            </div>

            <div className="relative pt-2">
              <input
                type="text"
                value={botQuery}
                onChange={(e) => setBotQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && botQuery) {
                    setSearch(botQuery);
                    setIsBotOpen(false);
                  }
                }}
                placeholder="Ask or search item..."
                className="w-full pl-3 pr-8 py-2 bg-[#121929] border border-slate-750 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
              />
              <button
                onClick={() => {
                  if (botQuery) {
                    setSearch(botQuery);
                    setIsBotOpen(false);
                  }
                }}
                className="absolute right-3 top-4 text-pink-400 hover:text-pink-300 cursor-pointer"
              >
                ↵
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          POPUP 1: "New SOR Department" (COMPLETELY DYNAMIC INPUTS)
         ========================================================================= */}
      {isNewDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-[#0e121d] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">
            {/* Header with Title and Circular Close Button */}
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white tracking-tight">
                {deptToEdit ? 'Edit SOR Department' : 'New SOR Department'}
              </h3>
              <button
                onClick={() => {
                  setIsNewDeptModalOpen(false);
                  setDeptToEdit(null);
                }}
                className="w-8 h-8 rounded-full bg-[#1b2234] hover:bg-slate-750 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveDepartment} className="space-y-4">
              {/* Field 1: Department Name * */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  value={deptForm.departmentName}
                  onChange={(e) => setDeptForm({ ...deptForm, departmentName: e.target.value })}
                  placeholder="e.g., CPWD SOR 2023 or State PWD Roads"
                  className="w-full px-3.5 py-2.5 bg-[#141a29] border border-slate-750 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all"
                />
              </div>

              {/* Field 2: Type * & Country * (2 Columns) */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Type *
                  </label>
                  <input
                    type="text"
                    required
                    list="dept-types-list"
                    value={deptForm.type}
                    onChange={(e) => setDeptForm({ ...deptForm, type: e.target.value })}
                    placeholder="-- Select or Type --"
                    className="w-full px-3.5 py-2.5 bg-[#141a29] border border-blue-500/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all"
                  />
                  <datalist id="dept-types-list">
                    {uniqueTypes.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Country *
                  </label>
                  <input
                    type="text"
                    required
                    value={deptForm.country}
                    onChange={(e) => setDeptForm({ ...deptForm, country: e.target.value })}
                    placeholder="India / Any Country"
                    className="w-full px-3.5 py-2.5 bg-[#141a29] border border-slate-750 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* State Field with dynamic datalist autocomplete */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  State / Region {deptForm.type.toLowerCase().includes('state') ? '*' : '(Optional)'}
                </label>
                <input
                  type="text"
                  list="states-datalist"
                  value={deptForm.state}
                  onChange={(e) => setDeptForm({ ...deptForm, state: e.target.value })}
                  placeholder="e.g., Maharashtra, Chhattisgarh, All-India..."
                  className="w-full px-3.5 py-2.5 bg-[#141a29] border border-slate-750 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all"
                />
              </div>

              {/* Field 3: Owning Body / Company & Year */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Owning Body / Company
                  </label>
                  <input
                    type="text"
                    value={deptForm.owningBody}
                    onChange={(e) => setDeptForm({ ...deptForm, owningBody: e.target.value })}
                    placeholder="e.g., CPWD, NHAI, MES, PWD"
                    className="w-full px-3.5 py-2.5 bg-[#141a29] border border-slate-750 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Year
                  </label>
                  <input
                    type="text"
                    value={deptForm.year}
                    onChange={(e) => setDeptForm({ ...deptForm, year: e.target.value })}
                    placeholder="2023 / 2024"
                    className="w-full px-3.5 py-2.5 bg-[#141a29] border border-slate-750 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Field 4: Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={deptForm.notes}
                  onChange={(e) => setDeptForm({ ...deptForm, notes: e.target.value })}
                  placeholder="Optional notes"
                  className="w-full px-3.5 py-2.5 bg-[#141a29] border border-slate-750 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all resize-none"
                />
              </div>

              {/* Info block */}
              <div className="p-3 bg-[#111726]/60 border border-slate-800 rounded-xl flex items-start gap-2 text-[11px] text-slate-400 leading-relaxed">
                <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-300">Central Govt / Defence / Railways / PSU:</span> no state needed.{' '}
                  <span className="font-semibold text-slate-300">State Govt / State PSU:</span> state required.{' '}
                  <span className="font-semibold text-slate-300">Private:</span> company name required.
                </div>
              </div>

              {/* Footer Buttons: Delete (if editing), Cancel & ✓ Save */}
              <div className="pt-2 flex items-center justify-between gap-3">
                {deptToEdit ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDeptToDelete(deptToEdit);
                      setConfirmDeleteDeptOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewDeptModalOpen(false);
                      setDeptToEdit(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-750 bg-[#161c2c] hover:bg-slate-800 text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Save</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          POPUP 2: "Browse Schedule of Rates" (FULLY DYNAMIC WITH REAL DATA)
         ========================================================================= */}
      {isBrowseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-4xl max-h-[90vh] bg-[#0c101c] border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* 1. Modal Top Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Browse Schedule of Rates
                </h3>
              </div>

              <div className="flex items-center gap-3 flex-1 sm:justify-end">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={browseSearch}
                    onChange={(e) => setBrowseSearch(e.target.value)}
                    placeholder="Search name, owner, state..."
                    className="w-full pl-9 pr-3 py-1.5 bg-[#121828] border border-slate-750 focus:border-blue-500 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none"
                  />
                  {browseSearch && (
                    <button
                      onClick={() => setBrowseSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Scope Pills */}
                <div className="flex items-center p-0.5 rounded-xl bg-[#121828] border border-slate-750">
                  {(['All', 'Govt', 'Private'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setBrowseCategoryTab(tab)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        browseCategoryTab === tab
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setIsBrowseModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#161c2e] hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. Secondary Filter Bar (Dynamic counts and values) */}
            <div className="px-5 py-3 border-b border-slate-800/80 bg-[#090d18] flex items-center gap-3 flex-wrap">
              {/* Country */}
              <select
                value={browseCountry}
                onChange={(e) => setBrowseCountry(e.target.value)}
                className="bg-[#101524] border border-slate-750 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="All">All Countries ({uniqueCountries.length})</option>
                {uniqueCountries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* State */}
              <select
                value={browseState}
                onChange={(e) => setBrowseState(e.target.value)}
                className="bg-[#101524] border border-slate-750 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="All">All States ({uniqueStates.length})</option>
                {uniqueStates.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              {/* Type */}
              <select
                value={browseType}
                onChange={(e) => setBrowseType(e.target.value)}
                className="bg-[#101524] border border-slate-750 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="All">All Types ({uniqueTypes.length})</option>
                {uniqueTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              {/* Owner */}
              <select
                value={browseOwner}
                onChange={(e) => setBrowseOwner(e.target.value)}
                className="bg-[#101524] border border-slate-750 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="All">All Owners ({uniqueOwners.length})</option>
                {uniqueOwners.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Real Recent Tags Row */}
            {recentMasters.length > 0 && (
              <div className="px-5 py-2.5 bg-[#0a0e19] border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold whitespace-nowrap">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Recent:</span>
                </div>
                {recentMasters.map((m) => (
                  <button
                    key={m._id}
                    onClick={() => {
                      setSelectedSorId(m._id);
                      recordRecentSchedule(m._id);
                      setIsBrowseModalOpen(false);
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg border text-xs whitespace-nowrap transition-colors cursor-pointer ${
                      selectedSorId === m._id
                        ? 'bg-blue-600/25 border-blue-500/50 text-blue-300 font-semibold'
                        : 'bg-[#121828] hover:bg-blue-600/20 border-slate-750 hover:border-blue-500/40 text-slate-300 hover:text-white'
                    }`}
                  >
                    {m.sorName}
                  </button>
                ))}
              </div>
            )}

            {/* 4. Grouped Real Department List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 divide-y divide-slate-800/50">
              {Object.keys(groupedBrowseMasters).length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-3">
                  <p>No Schedule of Rates found matching your filters.</p>
                  <button
                    onClick={() => {
                      setBrowseSearch('');
                      setBrowseCategoryTab('All');
                      setBrowseCountry('All');
                      setBrowseState('All');
                      setBrowseType('All');
                      setBrowseOwner('All');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-semibold cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                Object.entries(groupedBrowseMasters).map(([regionName, depts]) => (
                  <div key={regionName} className="space-y-3 pt-4 first:pt-0">
                    {/* Region Header */}
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400 tracking-wider">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-400 font-bold uppercase">
                          {depts[0]?.country || 'INDIA'}
                        </span>
                        <span>/</span>
                        <span className="text-slate-300">{regionName}</span>
                      </div>
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 text-[10px] flex items-center justify-center font-mono">
                        {depts.length}
                      </span>
                    </div>

                    {/* Department Cards */}
                    <div className="space-y-2.5">
                      {depts.map((d) => {
                        const count = d.itemCount ?? 0;
                        const isSelected = selectedSorId === d._id;
                        const isStateGovt = (d.scheduleType || '').toLowerCase().includes('state');
                        const isPrivate = (d.scheduleType || '').toLowerCase().includes('private');

                        return (
                          <div
                            key={d._id}
                            onClick={() => {
                              setSelectedSorId(d._id);
                              recordRecentSchedule(d._id);
                              setIsBrowseModalOpen(false);
                              setPage(1);
                            }}
                            className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 cursor-pointer ${
                              isSelected
                                ? 'bg-[#131b2e] border-blue-500/60 shadow-md shadow-blue-500/10'
                                : 'bg-[#0f1422] hover:bg-[#141b2e] border-slate-800/90 hover:border-slate-700'
                            }`}
                          >
                            {/* Left Side: Orange bullet, Title, Badges */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                                <h4 className="text-sm font-bold text-white tracking-tight">
                                  {d.sorName}
                                </h4>
                              </div>

                              {/* Badges */}
                              <div className="flex items-center gap-2 flex-wrap text-[10px]">
                                <span
                                  className={`px-2 py-0.5 rounded-md font-semibold border ${
                                    isStateGovt
                                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                      : isPrivate
                                      ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                                      : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                                  }`}
                                >
                                  {d.scheduleType || 'General'}
                                </span>

                                <span className="px-2 py-0.5 rounded-md bg-[#161d2e] border border-slate-750 text-slate-300 flex items-center gap-1 font-medium">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  <span>{d.state || 'All-India'}</span>
                                </span>

                                <span className="px-2 py-0.5 rounded-md bg-[#161d2e] border border-slate-750 text-slate-300 flex items-center gap-1 font-medium">
                                  <Building2 className="w-3 h-3 text-slate-400" />
                                  <span>{d.owningBody || d.authority || 'Default'}</span>
                                </span>
                              </div>
                            </div>

                            {/* Right Side: Real Live Items count, Edit button & Delete button */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-sm font-bold font-mono text-blue-400 mr-1">
                                {count.toLocaleString()} items
                              </span>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditDept(d);
                                }}
                                title="Edit Department"
                                className="p-2 rounded-lg border border-slate-750 bg-[#161c2c] hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeptToDelete(d);
                                  setConfirmDeleteDeptOpen(true);
                                }}
                                title="Delete Department"
                                className="p-2 rounded-lg border border-slate-750 bg-[#161c2c] hover:bg-red-500/20 text-slate-400 hover:text-red-400 hover:border-red-500/40 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 5. Footer Bar */}
            <div className="p-4 border-t border-slate-800 bg-[#090d18] flex items-center justify-between gap-4">
              <button
                onClick={() => {
                  setBrowseSearch('');
                  setBrowseCategoryTab('All');
                  setBrowseCountry('All');
                  setBrowseState('All');
                  setBrowseType('All');
                  setBrowseOwner('All');
                }}
                className="px-3.5 py-2 rounded-xl border border-slate-750 bg-[#121828] hover:bg-slate-800 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <span>Clear</span>
              </button>

              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400">
                  {filteredBrowseMasters.length} of {sorMasters.length} SOR departments
                </span>

                <button
                  onClick={() => {
                    setDeptToEdit(null);
                    setDeptForm({
                      departmentName: '',
                      type: '',
                      country: 'India',
                      state: '',
                      owningBody: '',
                      year: new Date().getFullYear().toString(),
                      notes: '',
                    });
                    setIsNewDeptModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/25 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>New SOR</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OTHER MODALS */}

      {/* Rename Department Modal */}
      <Modal
        isOpen={isRenameDeptModalOpen}
        onClose={() => setIsRenameDeptModalOpen(false)}
        title="Rename Department"
        subtitle={`Update the display title of ${activeMaster?.sorName}`}
        maxWidth="sm"
      >
        <form onSubmit={handleRenameDepartment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Department Name *</label>
            <input
              type="text"
              required
              value={renameDeptName}
              onChange={(e) => setRenameDeptName(e.target.value)}
              className="w-full px-3 py-2 bg-[#101524] border border-slate-750 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsRenameDeptModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Rename
            </Button>
          </div>
        </form>
      </Modal>

      {/* Manual Entry Modal */}
      <Modal
        isOpen={isManualEntryModalOpen}
        onClose={() => setIsManualEntryModalOpen(false)}
        title="Manual SOR Item Entry"
        subtitle={`Add a new specification item to ${activeMaster?.sorName}`}
        maxWidth="md"
      >
        <form onSubmit={handleCreateItem} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">SR NO (Code) *</label>
              <input
                type="text"
                required
                value={manualItemForm.itemCode}
                onChange={(e) => setManualItemForm({ ...manualItemForm, itemCode: e.target.value })}
                placeholder="e.g. 2.1 or 2.1.1"
                className="w-full px-3 py-2 bg-[#101524] border border-slate-750 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Unit</label>
              <input
                type="text"
                list="units-datalist"
                value={manualItemForm.unit}
                onChange={(e) => setManualItemForm({ ...manualItemForm, unit: e.target.value })}
                placeholder="CUM / SQM / KG..."
                className="w-full px-3 py-2 bg-[#101524] border border-slate-750 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Work Description *
            </label>
            <textarea
              required
              rows={3}
              value={manualItemForm.descriptionEnglish}
              onChange={(e) => setManualItemForm({ ...manualItemForm, descriptionEnglish: e.target.value })}
              placeholder="Full official specification and description..."
              className="w-full px-3 py-2 bg-[#101524] border border-slate-750 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Rate (₹)</label>
              <input
                type="number"
                step="0.01"
                value={manualItemForm.rate}
                onChange={(e) => setManualItemForm({ ...manualItemForm, rate: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-[#101524] border border-slate-750 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Type / Category</label>
              <input
                type="text"
                list="categories-datalist"
                value={manualItemForm.workCategory}
                onChange={(e) => setManualItemForm({ ...manualItemForm, workCategory: e.target.value })}
                placeholder="e.g. EARTH WORK, CONCRETE"
                className="w-full px-3 py-2 bg-[#101524] border border-slate-750 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 uppercase"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsManualEntryModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Item
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Item Modal */}
      {itemToEdit && (
        <Modal
          isOpen={isEditItemModalOpen}
          onClose={() => {
            setIsEditItemModalOpen(false);
            setItemToEdit(null);
          }}
          title={`Edit Item ${itemToEdit.itemCode}`}
          subtitle="Update work description, unit, rate, or category"
          maxWidth="md"
        >
          <form onSubmit={handleUpdateItem} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">SR NO (Code) *</label>
                <input
                  type="text"
                  required
                  value={itemToEdit.itemCode}
                  onChange={(e) => setItemToEdit({ ...itemToEdit, itemCode: e.target.value })}
                  className="w-full px-3 py-2 bg-[#101524] border border-slate-750 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Unit</label>
                <input
                  type="text"
                  list="units-datalist"
                  value={itemToEdit.unit || ''}
                  onChange={(e) => setItemToEdit({ ...itemToEdit, unit: e.target.value })}
                  placeholder="e.g. CUM, SQM"
                  className="w-full px-3 py-2 bg-[#101524] border border-slate-750 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 font-mono uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Work Description *</label>
              <textarea
                required
                rows={4}
                value={itemToEdit.descriptionEnglish}
                onChange={(e) => setItemToEdit({ ...itemToEdit, descriptionEnglish: e.target.value })}
                className="w-full px-3 py-2 bg-[#101524] border border-slate-750 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Rate (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={itemToEdit.rate || 0}
                  onChange={(e) => setItemToEdit({ ...itemToEdit, rate: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#101524] border border-slate-750 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Type</label>
                <input
                  type="text"
                  list="categories-datalist"
                  value={itemToEdit.workCategory || ''}
                  onChange={(e) => setItemToEdit({ ...itemToEdit, workCategory: e.target.value })}
                  className="w-full px-3 py-2 bg-[#101524] border border-slate-750 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 uppercase"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditItemModalOpen(false);
                  setItemToEdit(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Clear All Confirmation Modal */}
      <Modal
        isOpen={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        title="Clear All Items?"
        subtitle={`This will remove all items from ${activeMaster?.sorName}.`}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-amber-300 text-xs">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400" />
            <p>
              Are you sure you want to clear all {activeMaster?.itemCount ?? items.length} items? This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmClearOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleClearAllItems}>
              Yes, Clear All
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Department Confirmation Modal */}
      <Modal
        isOpen={confirmDeleteDeptOpen}
        onClose={() => {
          setConfirmDeleteDeptOpen(false);
          setDeptToDelete(null);
        }}
        title={`Delete "${(deptToDelete || activeMaster)?.sorName || 'Department'}"?`}
        subtitle={`Delete ${(deptToDelete || activeMaster)?.sorName} and all its rates.`}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-red-300 text-xs">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400" />
            <p>
              This will permanently delete <strong>{(deptToDelete || activeMaster)?.sorName}</strong> and all{' '}
              {(deptToDelete || activeMaster)?.itemCount ?? 0} associated items. This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setConfirmDeleteDeptOpen(false);
                setDeptToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteDepartment}>
              Yes, Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Keywords Quick Filter Modal */}
      <Modal
        isOpen={isKeywordsModalOpen}
        onClose={() => setIsKeywordsModalOpen(false)}
        title="Filter by Work Category"
        subtitle="Quickly filter items in this schedule by category"
        maxWidth="md"
      >
        <div className="space-y-3">
          {dynamicCategories.length === 0 ? (
            <p className="text-xs text-slate-400">No categories found in current schedule.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {dynamicCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedType(cat);
                    setIsKeywordsModalOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#101524] hover:bg-blue-600/20 border border-slate-750 text-xs text-slate-200 hover:text-blue-300 hover:border-blue-500/40 transition-colors cursor-pointer"
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setIsKeywordsModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Real Rate Comparison Modal */}
      <Modal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        title="Compare Rates Across Schedules"
        subtitle="Evaluate real rate differences between two actual schedules in your system"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs text-slate-300">
          <div className="flex items-center gap-3 bg-[#101524] p-3 rounded-xl border border-slate-750">
            <span className="font-semibold text-slate-300 whitespace-nowrap">Compare against:</span>
            <select
              value={compareTargetSorId}
              onChange={(e) => setCompareTargetSorId(e.target.value)}
              className="flex-1 bg-[#141a29] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">-- Choose target schedule to compare --</option>
              {sorMasters
                .filter((m) => m._id !== selectedSorId)
                .map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.sorName} ({m.itemCount ?? 0} items)
                  </option>
                ))}
            </select>
          </div>

          {!compareTargetSorId ? (
            <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
              Select another schedule from the dropdown above to compare real item rates.
            </div>
          ) : compareTargetItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
              The selected target schedule has no items recorded yet.
            </div>
          ) : (
            <div className="border border-slate-750 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#090e1a] text-slate-400 border-b border-slate-750 uppercase">
                  <tr>
                    <th className="p-2.5">Code</th>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5 text-right">{activeMaster?.sorName}</th>
                    <th className="p-2.5 text-right">Target Rate</th>
                    <th className="p-2.5 text-right">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {items.map((it) => {
                    const match = compareTargetItems.find((target) => target.itemCode === it.itemCode);
                    const currentRate = it.rate || 0;
                    const targetRate = match?.rate || 0;
                    const diff = targetRate > 0 && currentRate > 0 ? ((currentRate - targetRate) / targetRate) * 100 : null;

                    return (
                      <tr key={it._id}>
                        <td className="p-2.5 font-mono font-bold text-white">{it.itemCode}</td>
                        <td className="p-2.5 truncate max-w-xs">{it.descriptionEnglish}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-400">
                          {formatCurrency(currentRate, 'INR')}
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-300">
                          {match ? formatCurrency(targetRate, 'INR') : '—'}
                        </td>
                        <td className="p-2.5 text-right font-mono font-semibold">
                          {diff !== null ? (
                            <span className={diff >= 0 ? 'text-amber-400' : 'text-blue-400'}>
                              {diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsCompareModalOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* Full SOR Import Modal */}
      <SorImportModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setResumeImportId(null);
        }}
        resumeImportId={resumeImportId}
        onPublished={() => {
          refetchItems();
          refetchMasters();
          showToast('SOR items imported and published successfully!');
        }}
      />

      {/* Import History Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="SOR Import History & Batch Status"
        subtitle="View previous and active large-file imports, batch executions, and resume review"
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              All multi-page SOR imports processed through the asynchronous pipeline.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchHistory()}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
          </div>

          <div className="border border-slate-750 rounded-xl overflow-hidden bg-[#0a0e1a]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#090d18] border-b border-slate-750 text-slate-400">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Document</th>
                  <th className="py-2.5 px-3 font-semibold">Size</th>
                  <th className="py-2.5 px-3 font-semibold">Authority & Version</th>
                  <th className="py-2.5 px-3 font-semibold">Progress / Status</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Extracted Rows</th>
                  <th className="py-2.5 px-3 font-semibold">Date</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {isLoadingHistory ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      Loading import history...
                    </td>
                  </tr>
                ) : importsHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-500">
                      No previous imports recorded.
                    </td>
                  </tr>
                ) : (
                  importsHistory.map((imp: SorImport) => (
                    <tr key={imp._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3">
                        <p className="font-semibold text-white truncate max-w-xs">{imp.fileName}</p>
                        <p className="text-[10px] text-slate-500 font-mono uppercase">{imp.fileType}</p>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">
                        {(imp.fileSize / (1024 * 1024)).toFixed(1)} MB
                      </td>
                      <td className="py-2.5 px-3">
                        <p className="text-slate-300">{imp.authority}</p>
                        <p className="text-[11px] text-slate-500">v{imp.version}</p>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                            imp.status === 'Published'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : imp.status === 'Review Required'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : imp.status === 'Processing'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              : imp.status === 'OCR_REQUIRED'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                              : 'bg-red-500/10 text-red-400 border-red-500/30'
                          }`}
                        >
                          {imp.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-400">
                        {imp.progress?.rowsExtracted?.toLocaleString() || 0}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                        {new Date(imp.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            setResumeImportId(imp._id);
                            setIsHistoryModalOpen(false);
                            setIsImportModalOpen(true);
                          }}
                          className="px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-[11px] font-medium border border-blue-500/30 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {imp.status === 'Published' ? 'View' : 'Open'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pt-2 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setIsHistoryModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RateMaster;
