import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Search,
  Sparkles,
  Layers,
  Ruler,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Info,
  Calculator,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
  Code2,
  GripVertical,
  Settings,
  Maximize2,
  FileText,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Tag,
  Check,
  Building2,
  BookOpen,
  MapPin,
  Clock,
  Edit,
  Filter,
  ArrowRight,
  Bookmark,
  Building,
  RotateCcw,
  Copy,
} from 'lucide-react';
import api from '../../services/api';
import {
  SorItem,
  ScheduleHierarchyItem,
  Measurement,
  BoqItem,
} from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formatCurrency } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import {
  PickSorClauseByKeywordModal,
  KeywordClauseCard,
} from './PickSorClauseByKeywordModal';
import {
  PickSorMeasurementBookModal,
} from './PickSorMeasurementBookModal';
import { CurrencyUtil } from '../../utils/currency';

interface SmartMeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: () => void;
  editingMeasurement?: Measurement | null;
  initialBoqItem?: BoqItem | null;
}

export interface MeasurementRowItem {
  id: string;
  isSubheading?: boolean;
  description: string;
  nos: number | string;
  length: number | string;
  width: number | string;
  heightDepth: number | string;
  formula: string;
  remarks: string;
}

export interface SlashFormulaDefinition {
  command: string;
  name: string;
  code: string;
  category: 'AREA' | 'VOLUME' | 'PERIMETER' | 'DEDUCTIONS' | 'CUSTOM';
  expressionDesc: string;
  calculate: (params: { nos: number; l: number; w: number; h: number }) => number;
  highlightCols?: ('NOS' | 'L' | 'B' | 'H')[];
}

interface SubclauseItem {
  _id: string;
  itemCode: string;
  description: string;
  unit: string;
  rate: number;
  workCategory: string;
  chapter: string;
  measurementFormula?: string;
}

interface DynamicKeyword {
  label: string;
  count: number;
  category: string;
}

export type { KeywordClauseCard };

export const SmartMeasurementModal: React.FC<SmartMeasurementModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onSuccess,
  editingMeasurement,
  initialBoqItem,
}) => {
  // Input Heading tab: 'KEYWORDS' | 'ITEM_HEADING'
  const [activeInputTab, setActiveInputTab] = useState<'KEYWORDS' | 'ITEM_HEADING'>('KEYWORDS');
  const [itemHeading, setItemHeading] = useState<string>('');
  const [keywordsText, setKeywordsText] = useState<string>('');
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);

  // SOR & Clause
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [selectedSorItem, setSelectedSorItem] = useState<SorItem | null>(null);
  const [sorClauseInput, setSorClauseInput] = useState<string>('');
  const [subClause, setSubClause] = useState<string>('');
  const [workCategory, setWorkCategory] = useState<string>('');
  const [stage, setStage] = useState<string>('');

  // Estimation
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>('');
  const [unit, setUnit] = useState<string>('sqm');
  const [rate, setRate] = useState<number | ''>(0);

  // Quality
  const [qcChecklist, setQcChecklist] = useState<string>('— Select a work category first —');
  const [qualityLevel, setQualityLevel] = useState<string>('Project default');

  // Sub-items (Measurements) Rows
  const [measurementRows, setMeasurementRows] = useState<MeasurementRowItem[]>([
    {
      id: 'row-1',
      description: '',
      nos: '',
      length: '',
      width: '',
      heightDepth: '',
      formula: 'LxWxH',
      remarks: '',
    },
  ]);

  // Slash Command (/) Autocomplete State
  const [isSlashMenuOpen, setIsSlashMenuOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashTarget, setSlashTarget] = useState<'HEADING' | 'ROW'>('HEADING');
  const [activeRowIndexForSlash, setActiveRowIndexForSlash] = useState<number>(0);
  const [importedFormulaNotice, setImportedFormulaNotice] = useState<string | null>(null);

  // Floating coordinates and keyboard navigation for Slash Menu (never clipped by table overflow)
  const [slashMenuCoords, setSlashMenuCoords] = useState<{
    left: number;
    top: number;
    bottom: number;
    width: number;
    placeAbove: boolean;
  } | null>(null);
  const [highlightedFormulaIndex, setHighlightedFormulaIndex] = useState<number>(0);
  const slashMenuRef = useRef<HTMLDivElement | null>(null);
  const rowInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // Column Dropdown state (for NOS ▾, LENGTH (M) ▾, BREADTH (M) ▾, H/DEPTH (M) ▾, QTY ▾)
  const [activeColumnDropdown, setActiveColumnDropdown] = useState<'NOS' | 'LENGTH' | 'BREADTH' | 'H_DEPTH' | 'QTY' | null>(null);
  const columnDropdownRef = useRef<HTMLDivElement | null>(null);

  // Right-click row context menu state
  const [rowContextMenu, setRowContextMenu] = useState<{ x: number; y: number; rowIndex: number } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);

  // Manage Formulas Modal state
  const [isManageFormulasModalOpen, setIsManageFormulasModalOpen] = useState(false);
  const [customFormulasList, setCustomFormulasList] = useState<SlashFormulaDefinition[]>(() => {
    try {
      const saved = localStorage.getItem('budgetpilot_custom_formulas');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  // Global click outside listener for popups & menus
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        isSlashMenuOpen &&
        slashMenuRef.current &&
        !slashMenuRef.current.contains(target) &&
        !Object.values(rowInputRefs.current).some((el) => el && el.contains(target))
      ) {
        setIsSlashMenuOpen(false);
      }
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(target)) {
        setActiveColumnDropdown(null);
      }
      if (contextMenuRef.current && !contextMenuRef.current.contains(target)) {
        setRowContextMenu(null);
      }
    };
    window.addEventListener('mousedown', handleGlobalClick);
    return () => window.removeEventListener('mousedown', handleGlobalClick);
  }, [isSlashMenuOpen, activeColumnDropdown, rowContextMenu]);

  // Selection Modals State
  const [isSorModalOpen, setIsSorModalOpen] = useState(false);
  const [sorSearchTerm, setSorSearchTerm] = useState('');
  const [isKeywordsModalOpen, setIsKeywordsModalOpen] = useState(false);
  const [keywordSearchTerm, setKeywordSearchTerm] = useState('');
  const [isClausePickerOpen, setIsClausePickerOpen] = useState(false);
  const [clauseSearchTerm, setClauseSearchTerm] = useState('');
  const [isSubclausePickerOpen, setIsSubclausePickerOpen] = useState(false);

  // Sub-popup 1: "Pick SOR Clause by Keyword" states
  const [keywordClauseSearch, setKeywordClauseSearch] = useState<string>('');
  const [isAiMatching, setIsAiMatching] = useState<boolean>(false);
  const [aiMatchMessage, setAiMatchMessage] = useState<string | null>(null);

  // Sub-popup 2: "Pick SOR for Measurement Book" states & filters
  const [sorModalSearch, setSorModalSearch] = useState<string>('');
  const [countryFilter, setCountryFilter] = useState<string>('All Countries');
  const [stateFilter, setStateFilter] = useState<string>('All States');
  const [typeFilter, setTypeFilter] = useState<string>('All Types');
  const [ownerFilter, setOwnerFilter] = useState<string>('All Owners');
  const [ownerTypeSegment, setOwnerTypeSegment] = useState<'ALL' | 'GOVT' | 'PRIVATE'>('ALL');
  const [recentSorNames, setRecentSorNames] = useState<string[]>([]);

  // Aux Modals
  const [isExcelPasteModalOpen, setIsExcelPasteModalOpen] = useState(false);
  const [excelPasteText, setExcelPasteText] = useState('');
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [isCellFormulaHelpOpen, setIsCellFormulaHelpOpen] = useState(false);
  const [isDrawingNoticeOpen, setIsDrawingNoticeOpen] = useState(false);

  // 1. Fetch Dynamic Schedule Hierarchy from Master Database (ONLY real database SORs)
  const { data: scheduleList = [], isLoading: isSchedulesLoading } = useQuery<ScheduleHierarchyItem[]>({
    queryKey: ['scheduleHierarchy'],
    queryFn: async () => {
      const res = await api.get('/sor/schedules/hierarchy');
      return Array.isArray(res.data?.data) ? res.data.data : [];
    },
    enabled: isOpen,
  });

  // Database-driven Schedules ONLY
  const allSchedules: ScheduleHierarchyItem[] = useMemo(() => {
    return scheduleList;
  }, [scheduleList]);

  // Current Active Schedule
  const activeSchedule = useMemo(() => {
    return (
      allSchedules.find((s) => s._id === selectedScheduleId) ||
      allSchedules[0] ||
      null
    );
  }, [allSchedules, selectedScheduleId]);

  // Auto-select first schedule on initial load if none set
  useEffect(() => {
    if (allSchedules.length > 0 && !selectedScheduleId) {
      setSelectedScheduleId(allSchedules[0]._id);
    }
  }, [allSchedules, selectedScheduleId]);


  // 2. Fetch Dynamic Work Categories for currently selected SOR
  const { data: categoriesData } = useQuery<{ workCategories: string[]; chapters: string[] }>({
    queryKey: ['sorCategories', selectedScheduleId],
    queryFn: async () => {
      if (!selectedScheduleId) return { workCategories: [], chapters: [] };
      const res = await api.get(`/sor/categories?sorId=${selectedScheduleId}`);
      return res.data?.data || { workCategories: [], chapters: [] };
    },
    enabled: isOpen && !!selectedScheduleId,
  });

  const availableWorkCategories = useMemo(() => {
    return categoriesData?.workCategories || categoriesData?.chapters || [];
  }, [categoriesData]);

  // 3. Fetch Dynamic Keywords for currently selected SOR & Category
  const { data: dynamicKeywordsData, isLoading: isKeywordsLoading } = useQuery<{
    keywords: DynamicKeyword[];
    categories: string[];
  }>({
    queryKey: ['dynamicKeywords', selectedScheduleId, workCategory, keywordSearchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedScheduleId) params.append('sorId', selectedScheduleId);
      if (workCategory) params.append('workCategory', workCategory);
      if (keywordSearchTerm) params.append('search', keywordSearchTerm);
      params.append('limit', '100');
      const res = await api.get(`/sor/keywords?${params.toString()}`);
      return res.data?.data || { keywords: [], categories: [] };
    },
    enabled: isOpen,
  });

  const availableKeywords = useMemo(() => {
    return dynamicKeywordsData?.keywords || [];
  }, [dynamicKeywordsData]);

  // 4. Fetch Available Subclauses when an SOR Clause is selected
  const parentItemCode = selectedSorItem?.itemCode || '';
  const { data: subclausesList = [], isLoading: isSubclausesLoading } = useQuery<SubclauseItem[]>({
    queryKey: ['sorSubclauses', selectedScheduleId, parentItemCode],
    queryFn: async () => {
      if (!selectedScheduleId || !parentItemCode) return [];
      const res = await api.get(
        `/sor/items/subclauses?sorId=${selectedScheduleId}&parentItemCode=${encodeURIComponent(parentItemCode)}`
      );
      return Array.isArray(res.data?.data) ? res.data.data : [];
    },
    enabled: isOpen && !!selectedScheduleId && !!parentItemCode,
  });

  // 5. Fetch Formulas from Quantity Master (/quantity-master/formulas)
  const { data: qmFormulasData } = useQuery<any>({
    queryKey: ['quantityMasterFormulas'],
    queryFn: async () => {
      const res = await api.get('/quantity-master/formulas?limit=200');
      return res.data?.data;
    },
    enabled: isOpen,
  });

  const qmFormulas: any[] = useMemo(() => {
    if (!qmFormulasData) return [];
    if (Array.isArray(qmFormulasData)) return qmFormulasData;
    if (Array.isArray(qmFormulasData.items)) return qmFormulasData.items;
    if (Array.isArray(qmFormulasData.formulas)) return qmFormulasData.formulas;
    return [];
  }, [qmFormulasData]);

  // 6. Fetch Existing Measurements for "Copy from Existing Item"
  const { data: existingMeasurementsData } = useQuery<any>({
    queryKey: ['existingMeasurementsForCopy', projectId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}/measurements?limit=100`);
      return res.data?.data?.measurements || res.data?.data || [];
    },
    enabled: isOpen,
  });

  const existingMeasurements: Measurement[] = useMemo(() => {
    return Array.isArray(existingMeasurementsData) ? existingMeasurementsData : [];
  }, [existingMeasurementsData]);

  // 7. Smart SOR Clause Search
  const searchQueryForSor =
    activeInputTab === 'KEYWORDS'
      ? selectedKeywords.length > 0
        ? selectedKeywords.join(' ')
        : keywordsText
      : clauseSearchTerm || itemHeading;

  const { data: smartSearchData, isLoading: isClausesLoading } = useQuery<{ items: SorItem[] }>({
    queryKey: ['smartSorSearchModal', selectedScheduleId, searchQueryForSor, workCategory],
    queryFn: async () => {
      if (!selectedScheduleId) return { items: [] };
      const params = new URLSearchParams();
      params.append('sorId', selectedScheduleId);
      if (searchQueryForSor) params.append('search', searchQueryForSor);
      if (workCategory) params.append('chapter', workCategory);
      params.append('limit', '40');
      const res = await api.get(`/sor/items/smart-search?${params.toString()}`);
      const raw = res.data?.data;
      const items = Array.isArray(raw) ? raw : (Array.isArray(raw?.items) ? raw.items : []);
      return { items };
    },
    enabled: isOpen && !!selectedScheduleId,
  });
  const sorSearchResults = smartSearchData?.items || [];

  // 7b. Filtered SOR Catalog for "Pick SOR for Measurement Book"
  const filteredSorCatalog = useMemo(() => {
    return allSchedules.filter((sor) => {
      if (sorModalSearch.trim()) {
        const q = sorModalSearch.toLowerCase();
        const matchesName = sor.sorName?.toLowerCase().includes(q);
        const matchesOwner = sor.owningBody?.toLowerCase().includes(q) || sor.authority?.toLowerCase().includes(q);
        const matchesState = sor.state?.toLowerCase().includes(q);
        const matchesType = sor.scheduleType?.toLowerCase().includes(q) || sor.type?.toLowerCase().includes(q);
        if (!matchesName && !matchesOwner && !matchesState && !matchesType) return false;
      }
      if (countryFilter !== 'All Countries' && sor.country && sor.country.toLowerCase() !== countryFilter.toLowerCase()) {
        return false;
      }
      if (stateFilter !== 'All States' && sor.state && sor.state.toLowerCase() !== stateFilter.toLowerCase()) {
        return false;
      }
      if (typeFilter !== 'All Types') {
        const sorType = (sor.type || sor.scheduleType || '').toLowerCase();
        if (typeFilter === 'Govt' && !sorType.includes('govt')) return false;
        if (typeFilter === 'Private' && !sorType.includes('private')) return false;
        if (typeFilter === 'State Govt' && !sorType.includes('state')) return false;
        if (typeFilter === 'Central Govt' && !sorType.includes('central')) return false;
      }
      if (ownerFilter !== 'All Owners') {
        const owner = sor.owningBody || sor.authority || '';
        if (owner.toLowerCase() !== ownerFilter.toLowerCase()) return false;
      }
      if (ownerTypeSegment === 'GOVT') {
        const t = (sor.type || sor.scheduleType || '').toLowerCase();
        if (t.includes('private')) return false;
      } else if (ownerTypeSegment === 'PRIVATE') {
        const t = (sor.type || sor.scheduleType || '').toLowerCase();
        if (!t.includes('private') && sor.authority !== 'Private') return false;
      }
      return true;
    });
  }, [allSchedules, sorModalSearch, countryFilter, stateFilter, typeFilter, ownerFilter, ownerTypeSegment]);

  // Grouped by region / department hierarchy matching screenshot
  const groupedSorHierarchy = useMemo(() => {
    const groups: { [key: string]: ScheduleHierarchyItem[] } = {};
    for (const sor of filteredSorCatalog) {
      const country = (sor.country || 'INDIA').toUpperCase();
      let subGroup = sor.state;
      if (!subGroup || subGroup === 'All India' || subGroup === 'Central') {
        if (sor.type === 'Private' || sor.scheduleType === 'Private') {
          subGroup = '— (Private)';
        } else {
          subGroup = '— (Central Govt)';
        }
      }
      const groupKey = `${country} / ${subGroup}`;
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(sor);
    }
    return groups;
  }, [filteredSorCatalog]);

  // Database Keyword Cards
  const databaseKeywordCards: KeywordClauseCard[] = useMemo(() => {
    if (!sorSearchResults || sorSearchResults.length === 0) return [];
    return sorSearchResults.map((item) => ({
      id: item._id,
      title: item.descriptionEnglish?.split('\n')[0]?.slice(0, 60) || item.itemCode,
      itemCode: item.itemCode,
      subclauseCode: '',
      workCategory: item.chapter || item.workCategory || 'Plaster Work',
      stage: 'Residential Building',
      clauseDesc: item.descriptionEnglish || '',
      subclauseDesc: item.descriptionHindi || item.descriptionEnglish || '',
      rate: item.rate || 0,
      unit: item.unit || 'SQM',
      isSaved: false,
      formula: item.measurementFormula,
    }));
  }, [sorSearchResults]);

  // Combined Keyword Cards for "Pick SOR Clause by Keyword"
  const combinedKeywordCards = useMemo(() => {
    const allCards = [...databaseKeywordCards];
    if (!keywordClauseSearch.trim()) return allCards;
    const q = keywordClauseSearch.toLowerCase();
    return allCards.filter(
      (card) =>
        card.title.toLowerCase().includes(q) ||
        card.itemCode.toLowerCase().includes(q) ||
        (card.subclauseCode && card.subclauseCode.toLowerCase().includes(q)) ||
        card.workCategory.toLowerCase().includes(q) ||
        card.clauseDesc.toLowerCase().includes(q) ||
        (card.subclauseDesc && card.subclauseDesc.toLowerCase().includes(q))
    );
  }, [keywordClauseSearch, databaseKeywordCards]);

  // Select Keyword Card Action
  const handleSelectKeywordCard = (card: KeywordClauseCard) => {
    setItemHeading(card.title);
    setKeywordsText(card.title);
    setSelectedKeywords([card.title]);
    setSorClauseInput(`${card.itemCode} - ${card.clauseDesc}`);
    if (card.subclauseCode && card.subclauseDesc) {
      setSubClause(`${card.subclauseCode} - ${card.subclauseDesc}`);
    } else {
      setSubClause('');
    }
    const cleanCategory = card.workCategory.split('•')[0].trim();
    setWorkCategory(cleanCategory);
    if (card.stage) setStage(card.stage);
    setRate(card.rate);
    setUnit(card.unit.toLowerCase());

    if (card.formula) {
      const f = qmFormulas.find(
        (formula: any) =>
          formula.name.toLowerCase().includes(card.formula!.toLowerCase()) ||
          card.formula!.toLowerCase().includes(formula.name.toLowerCase())
      );
      if (f) setSelectedFormulaId(f._id);
    } else {
      const f = qmFormulas.find(
        (formula: any) =>
          formula.name.toLowerCase().includes('ceiling') ||
          formula.name.toLowerCase().includes('plaster')
      );
      if (f) setSelectedFormulaId(f._id);
    }

    setImportedFormulaNotice(`Selected "${card.title}" (${card.itemCode}) • Rate ₹${card.rate}/${card.unit}`);
    setTimeout(() => setImportedFormulaNotice(null), 4000);
    setIsKeywordsModalOpen(false);
  };

  // AI Match Action
  const handleAiMatch = () => {
    if (combinedKeywordCards.length === 0) {
      setAiMatchMessage('No database clauses available to match.');
      return;
    }
    setIsAiMatching(true);
    setAiMatchMessage('AI Match analyzing query against real schedule clauses...');
    setTimeout(() => {
      setIsAiMatching(false);
      const query = (keywordClauseSearch || keywordsText || itemHeading).toLowerCase();
      const best =
        combinedKeywordCards.find(
          (c) =>
            c.title.toLowerCase().includes(query) ||
            query.split(' ').some((word) => word.length > 3 && c.title.toLowerCase().includes(word))
        ) || combinedKeywordCards[0];

      if (best) {
        setAiMatchMessage(`AI Match found match: "${best.title}"`);
        setTimeout(() => {
          handleSelectKeywordCard(best);
          setAiMatchMessage(null);
        }, 500);
      }
    }, 500);
  };

  // Switch Recent SOR
  const handleSelectRecentSor = (name: string) => {
    const target =
      allSchedules.find((s) => s.sorName.toLowerCase() === name.toLowerCase()) ||
      allSchedules.find((s) => s.sorName.toLowerCase().includes(name.toLowerCase()));
    if (target) {
      handleSwitchSor(target);
      setRecentSorNames((prev) => [target.sorName, ...prev.filter((n) => n !== target.sorName)]);
    }
  };

  // Initialize or populate when editing
  useEffect(() => {
    if (!isOpen) return;

    if (editingMeasurement) {
      const firstEntry = editingMeasurement.entries?.[0];
      const boq = editingMeasurement.boqItemId as any;
      const title = editingMeasurement.sourceItemCode
        ? `${editingMeasurement.sourceItemCode} - ${firstEntry?.description || boq?.description || ''}`
        : firstEntry?.description || boq?.description || '';
      setItemHeading(title);
      setKeywordsText(title);
      setSorClauseInput(editingMeasurement.sourceItemCode ? `${editingMeasurement.sourceItemCode} - ${title}` : title);
      setUnit(firstEntry?.unit || boq?.unit || 'sqm');
      setRate(editingMeasurement.unitRate ?? boq?.rate ?? 0);
      setWorkCategory(boq?.chapter || boq?.workCategory || '');
      setStage(boq?.stage || '');
      setSelectedFormulaId(boq?.formulaId?.toString() || '');
      if (editingMeasurement.sorId) {
        setSelectedScheduleId(editingMeasurement.sorId.toString());
      }

      if (editingMeasurement.entries && editingMeasurement.entries.length > 0) {
        setMeasurementRows(
          editingMeasurement.entries.map((ent, idx) => ({
            id: `row-${idx}-${Date.now()}`,
            description: ent.description || '',
            nos: ent.nos !== undefined ? ent.nos : 1,
            length: ent.length !== undefined ? ent.length : '',
            width: ent.width !== undefined ? ent.width : '',
            heightDepth: ent.heightDepth !== undefined ? ent.heightDepth : (ent.height || ent.depth || ''),
            formula: ent.formula || 'LxWxH',
            remarks: ent.remarks || '',
          }))
        );
      }
    } else if (initialBoqItem) {
      setItemHeading(initialBoqItem.description || '');
      setKeywordsText(initialBoqItem.description || '');
      setSorClauseInput(
        initialBoqItem.itemCode ? `${initialBoqItem.itemCode} - ${initialBoqItem.description}` : initialBoqItem.description || ''
      );
      setUnit(initialBoqItem.unit || 'sqm');
      setRate(initialBoqItem.rate || 0);
      setWorkCategory(initialBoqItem.chapter || '');
      setSelectedFormulaId((initialBoqItem as any).formulaId?.toString() || '');
      setMeasurementRows([
        {
          id: 'row-1',
          description: initialBoqItem.description || '',
          nos: 1,
          length: '',
          width: '',
          heightDepth: '',
          formula: 'LxWxH',
          remarks: '',
        },
      ]);
    }
  }, [isOpen, editingMeasurement, initialBoqItem]);

  // Keyboard shortcut Ctrl+I for Input Sheet
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setIsExcelPasteModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // SWITCH ACTIVE SOR (Completely clears stale data from previous SOR)
  const handleSwitchSor = (sor: ScheduleHierarchyItem) => {
    if (sor._id === selectedScheduleId) {
      setIsSorModalOpen(false);
      return;
    }

    setSelectedScheduleId(sor._id);
    // Reset all fields derived from previous SOR
    setSelectedSorItem(null);
    setSorClauseInput('');
    setSubClause('');
    setWorkCategory('');
    setStage('');
    setUnit('sqm');
    setRate(0);
    setItemHeading('');
    setKeywordsText('');
    setSelectedKeywords([]);
    setMeasurementRows([
      {
        id: 'row-1',
        description: '',
        nos: '',
        length: '',
        width: '',
        heightDepth: '',
        formula: 'LxWxH',
        remarks: '',
      },
    ]);

    setIsSorModalOpen(false);
    setImportedFormulaNotice(`Switched active SOR to "${sor.sorName}". All clauses and rates updated.`);
    setTimeout(() => setImportedFormulaNotice(null), 3500);
  };

  // SELECT SOR CLAUSE
  const handleSelectSorItem = (item: SorItem) => {
    setSelectedSorItem(item);
    const clauseTitle = `${item.itemCode} - ${item.descriptionEnglish}`;
    setItemHeading(item.descriptionEnglish || clauseTitle);
    setSorClauseInput(clauseTitle);
    setSubClause(''); // reset subclause when parent clause changes
    if (item.unit) setUnit(item.unit);
    if (item.rate !== undefined) setRate(item.rate);
    if (item.workCategory || item.chapter) setWorkCategory(item.workCategory || item.chapter || '');

    // Auto-match formula from Quantity Master
    const matchFormula = Array.isArray(qmFormulas)
      ? qmFormulas.find(
          (f: any) =>
            item.descriptionEnglish?.toLowerCase().includes(f?.name?.toLowerCase()) ||
            (f?.code && item.descriptionEnglish?.toLowerCase().includes(f?.code?.toLowerCase())) ||
            (item.workCategory && f?.category?.toLowerCase() === item.workCategory?.toLowerCase())
        )
      : null;
    if (matchFormula) {
      setSelectedFormulaId(matchFormula._id);
    }

    setIsClausePickerOpen(false);
  };

  // SELECT SUBCLAUSE
  const handleSelectSubclause = (sub: SubclauseItem) => {
    setSubClause(`${sub.itemCode} - ${sub.description}`);
    if (sub.unit) setUnit(sub.unit);
    if (sub.rate !== undefined) setRate(sub.rate);
    if (selectedSorItem) {
      setItemHeading(`${selectedSorItem.itemCode} ${selectedSorItem.descriptionEnglish} - ${sub.description}`);
    } else {
      setItemHeading(sub.description);
    }
    setIsSubclausePickerOpen(false);
  };

  // TOGGLE KEYWORD SELECTION
  const handleToggleKeyword = (kw: string) => {
    setSelectedKeywords((prev) => {
      const exists = prev.includes(kw);
      const updated = exists ? prev.filter((k) => k !== kw) : [...prev, kw];
      setKeywordsText(updated.join(', '));
      return updated;
    });
  };

  const handleRemoveKeyword = (kw: string) => {
    setSelectedKeywords((prev) => {
      const updated = prev.filter((k) => k !== kw);
      setKeywordsText(updated.join(', '));
      return updated;
    });
  };

  // Safe arithmetic evaluator for cell formulas (e.g. 10.5 + 2.5, =15*2, 100/4, 2*(5+3))
  const evaluateCellMath = (val: number | string | undefined | null): number => {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const str = String(val).trim().replace(/^=/, '');
    if (!str) return 0;

    const directNum = Number(str);
    if (!isNaN(directNum)) return directNum;

    try {
      const sanitised = str
        .replace(/pi/gi, String(Math.PI))
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/\^/g, '**');

      if (/^[0-9+\-*/().\s*]+$/.test(sanitised)) {
        const result = Function(`"use strict"; return (${sanitised})`)();
        if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
          return Number(result.toFixed(4));
        }
      }
    } catch {
      return 0;
    }
    return 0;
  };

  // Standard civil formulas matching Reference Screenshot 2
  const STANDARD_SLASH_FORMULAS: SlashFormulaDefinition[] = [
    // AREA (Exact match to Reference Screenshot 2)
    {
      command: '/area',
      name: 'Area = L×B',
      code: '/area',
      category: 'AREA',
      expressionDesc: 'Nos × Length × Breadth',
      calculate: ({ nos, l, w, h }) => {
        const dimL = l > 0 ? l : 0;
        const dimW = w > 0 ? w : (h > 0 ? h : 0);
        return nos * dimL * dimW;
      },
      highlightCols: ['NOS', 'L', 'B'],
    },
    {
      command: '/circarea',
      name: 'Circle Area = π/4×D²',
      code: '/circarea',
      category: 'AREA',
      expressionDesc: 'Nos × (π / 4) × D²',
      calculate: ({ nos, l, w, h }) => {
        const d = l > 0 ? l : (w > 0 ? w : h);
        return nos * (Math.PI / 4) * d * d;
      },
      highlightCols: ['NOS', 'L'],
    },
    {
      command: '/cylarea',
      name: 'Cylinder Surface = π×D×H',
      code: '/cylarea',
      category: 'AREA',
      expressionDesc: 'Nos × π × Diameter × Height',
      calculate: ({ nos, l, w, h }) => {
        const d = l > 0 ? l : w;
        return nos * Math.PI * d * h;
      },
      highlightCols: ['NOS', 'L', 'H'],
    },
    {
      command: '/cyltotal',
      name: 'Cylinder Total SA = π×D×H + 2×π/4×D²',
      code: '/cyltotal',
      category: 'AREA',
      expressionDesc: 'Nos × (π×D×H + 2×(π/4)×D²)',
      calculate: ({ nos, l, w, h }) => {
        const d = l > 0 ? l : w;
        const sa = Math.PI * d * h;
        const ends = 2 * (Math.PI / 4) * d * d;
        return nos * (sa + ends);
      },
      highlightCols: ['NOS', 'L', 'H'],
    },
    {
      command: '/spherearea',
      name: 'Sphere Surface = 4×π×R²',
      code: '/spherearea',
      category: 'AREA',
      expressionDesc: 'Nos × 4 × π × R²',
      calculate: ({ nos, l, w, h }) => {
        const r = (l > 0 ? l : (w > 0 ? w : h)) / 2;
        return nos * 4 * Math.PI * r * r;
      },
      highlightCols: ['NOS', 'L'],
    },
    {
      command: '/triarea',
      name: 'Triangle Area = 1/2×B×H',
      code: '/triarea',
      category: 'AREA',
      expressionDesc: 'Nos × 0.5 × Base × Height',
      calculate: ({ nos, l, w, h }) => {
        const b = l > 0 ? l : w;
        const height = h > 0 ? h : (w > 0 ? w : 0);
        return nos * 0.5 * b * height;
      },
      highlightCols: ['NOS', 'L', 'H'],
    },

    // VOLUME
    {
      command: '/vol',
      name: 'Volume = L×B×H',
      code: 'LxWxH',
      category: 'VOLUME',
      expressionDesc: 'Nos × Length × Breadth × Height',
      calculate: ({ nos, l, w, h }) => nos * l * w * h,
      highlightCols: ['NOS', 'L', 'B', 'H'],
    },
    {
      command: '/cylvol',
      name: 'Cylinder Volume = π/4×D²×H',
      code: '/cylvol',
      category: 'VOLUME',
      expressionDesc: 'Nos × (π / 4) × D² × Height',
      calculate: ({ nos, l, w, h }) => {
        const d = l > 0 ? l : w;
        return nos * (Math.PI / 4) * d * d * h;
      },
      highlightCols: ['NOS', 'L', 'H'],
    },
    {
      command: '/spherevol',
      name: 'Sphere Volume = 4/3×π×R³',
      code: '/spherevol',
      category: 'VOLUME',
      expressionDesc: 'Nos × (4 / 3) × π × R³',
      calculate: ({ nos, l, w, h }) => {
        const r = (l > 0 ? l : (w > 0 ? w : h)) / 2;
        return nos * (4 / 3) * Math.PI * Math.pow(r, 3);
      },
      highlightCols: ['NOS', 'L'],
    },
    {
      command: '/cone',
      name: 'Cone Volume = 1/3×π×R²×H',
      code: '/cone',
      category: 'VOLUME',
      expressionDesc: 'Nos × (1 / 3) × π × R² × Height',
      calculate: ({ nos, l, w, h }) => {
        const r = (l > 0 ? l : w) / 2;
        return nos * (1 / 3) * Math.PI * r * r * h;
      },
      highlightCols: ['NOS', 'L', 'H'],
    },

    // PERIMETER / LINEAR
    {
      command: '/perim',
      name: 'Perimeter = 2×(L+B)',
      code: '/perim',
      category: 'PERIMETER',
      expressionDesc: 'Nos × 2 × (Length + Breadth)',
      calculate: ({ nos, l, w }) => nos * 2 * (l + w),
      highlightCols: ['NOS', 'L', 'B'],
    },
    {
      command: '/circperim',
      name: 'Circumference = π×D',
      code: '/circperim',
      category: 'PERIMETER',
      expressionDesc: 'Nos × π × Diameter',
      calculate: ({ nos, l, w, h }) => {
        const d = l > 0 ? l : (w > 0 ? w : h);
        return nos * Math.PI * d;
      },
      highlightCols: ['NOS', 'L'],
    },
    {
      command: '/length',
      name: 'Running Length = L',
      code: '/length',
      category: 'PERIMETER',
      expressionDesc: 'Nos × Length',
      calculate: ({ nos, l }) => nos * l,
      highlightCols: ['NOS', 'L'],
    },

    // DEDUCTIONS & OPENINGS
    {
      command: '/deduct',
      name: 'Deduction = -1 × (L×B)',
      code: '/deduct',
      category: 'DEDUCTIONS',
      expressionDesc: '-1 × Nos × Length × Breadth',
      calculate: ({ nos, l, w }) => -1 * Math.abs(nos * l * w),
      highlightCols: ['NOS', 'L', 'B'],
    },
    {
      command: '/door',
      name: 'Door Deduction = -1 × (W×H)',
      code: '/door',
      category: 'DEDUCTIONS',
      expressionDesc: '-1 × Nos × Width × Height',
      calculate: ({ nos, l, w, h }) => {
        const width = w > 0 ? w : l;
        return -1 * Math.abs(nos * width * h);
      },
      highlightCols: ['NOS', 'B', 'H'],
    },
    {
      command: '/window',
      name: 'Window Deduction = -1 × (W×H)',
      code: '/window',
      category: 'DEDUCTIONS',
      expressionDesc: '-1 × Nos × Width × Height',
      calculate: ({ nos, l, w, h }) => {
        const width = w > 0 ? w : l;
        return -1 * Math.abs(nos * width * h);
      },
      highlightCols: ['NOS', 'B', 'H'],
    },
  ];

  // Combined slash formulas with Quantity Master formulas from DB & custom user formulas
  const allSlashFormulas: SlashFormulaDefinition[] = useMemo(() => {
    const list = [...STANDARD_SLASH_FORMULAS, ...customFormulasList];
    if (Array.isArray(qmFormulas)) {
      for (const f of qmFormulas) {
        if (!f?.name) continue;
        const code = f.code || f.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cmd = `/${code}`;
        if (!list.some((existing) => existing.command.toLowerCase() === cmd.toLowerCase())) {
          const expr = (f.expression || f.formula || '').toUpperCase();
          const cols: ('NOS' | 'L' | 'B' | 'H')[] = ['NOS'];
          if (/\b(L|LEN|LENGTH|DIA|RADIUS|R|BASE)\b/.test(expr)) cols.push('L');
          if (/\b(B|W|WIDTH|BREADTH)\b/.test(expr)) cols.push('B');
          if (/\b(H|D|DEPTH|HEIGHT|THICK)\b/.test(expr)) cols.push('H');
          if (cols.length === 1) cols.push('L', 'B', 'H');

          list.push({
            command: cmd,
            name: `${f.name} = ${f.expression || f.formula || 'Custom'}`,
            code: f.code || f.name,
            category: 'CUSTOM',
            expressionDesc: f.expression || f.formula || 'Custom calculation',
            highlightCols: cols,
            calculate: ({ nos, l, w, h }) => {
              if (f.expression) {
                const exprStr = f.expression
                  .replace(/\bL\b/gi, String(l))
                  .replace(/\bB\b|\bW\b/gi, String(w))
                  .replace(/\bH\b|\bD\b/gi, String(h))
                  .replace(/\bN\b|\bNOS\b/gi, String(nos));
                const res = evaluateCellMath(exprStr);
                return res !== 0 ? res : nos * l * w;
              }
              return nos * l * w * (h > 0 ? h : 1);
            },
          });
        }
      }
    }
    return list;
  }, [qmFormulas, customFormulasList]);

  // Filter slash formulas by query
  const filteredSlashFormulas = useMemo(() => {
    if (!slashQuery.trim()) return allSlashFormulas;
    const q = slashQuery.toLowerCase().replace(/^\//, '').trim();
    return allSlashFormulas.filter(
      (f) =>
        f.command.toLowerCase().includes(q) ||
        f.name.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
    );
  }, [allSlashFormulas, slashQuery]);

  // Group slash formulas by category (e.g. AREA, VOLUME, PERIMETER)
  const groupedSlashFormulas = useMemo(() => {
    const groups: { [cat: string]: typeof allSlashFormulas } = {};
    for (const f of filteredSlashFormulas) {
      const cat = f.category || 'AREA';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(f);
    }
    return groups;
  }, [filteredSlashFormulas]);

  // Interface for row dimension availability and custom headers/placeholders
  interface RowDimensionConfig {
    hasLength: boolean;
    hasBreadth: boolean;
    hasHeight: boolean;
    lengthLabel: string;
    breadthLabel: string;
    heightLabel: string;
    formulaName: string;
  }

  // Determine enabled dimensions and labels for any row based on its active formula
  const getRowDimensionConfig = (formulaStr: string | undefined): RowDimensionConfig => {
    const rawKey = (formulaStr || 'LxWxH').trim();
    const formulaKey = rawKey.toLowerCase();

    // Default cuboid L x W x H
    if (!formulaKey || formulaKey === 'lxwxh' || formulaKey === 'volume' || formulaKey === 'default') {
      return {
        hasLength: true,
        hasBreadth: true,
        hasHeight: true,
        lengthLabel: 'L',
        breadthLabel: 'B',
        heightLabel: 'H',
        formulaName: 'L×B×H',
      };
    }

    // Match in allSlashFormulas (by command, code, or name)
    const match = allSlashFormulas.find(
      (f) =>
        f.command.toLowerCase() === formulaKey ||
        f.code.toLowerCase() === formulaKey ||
        formulaKey.includes(f.command.toLowerCase()) ||
        f.name.toLowerCase() === formulaKey
    );

    if (match) {
      const cols = match.highlightCols || ['NOS', 'L', 'B', 'H'];
      const hasL = cols.includes('L');
      const hasB = cols.includes('B');
      const hasH = cols.includes('H');

      let lengthLabel = 'L';
      let breadthLabel = 'B';
      let heightLabel = 'H';

      const cmd = (match.command || match.code || '').toLowerCase();
      if (cmd.includes('circ') || cmd.includes('cyl')) {
        lengthLabel = 'Dia D';
      } else if (cmd.includes('sphere') || cmd.includes('cone')) {
        lengthLabel = 'Radius R';
      } else if (cmd === '/triarea' || cmd.includes('tri')) {
        lengthLabel = 'Base B';
      }

      if (cmd === '/door' || cmd === '/window') {
        breadthLabel = 'Width W';
      }

      if (cmd.includes('cyl') || cmd.includes('cone') || cmd.includes('tri')) {
        heightLabel = 'Height H';
      }

      return {
        hasLength: hasL,
        hasBreadth: hasB,
        hasHeight: hasH,
        lengthLabel,
        breadthLabel,
        heightLabel,
        formulaName: match.name || match.code,
      };
    }

    // Fallback: check expression tokens
    const upperKey = rawKey.toUpperCase();
    const hasL = /\b(L|LENGTH|DIA|RADIUS|R|BASE)\b/.test(upperKey);
    const hasB = /\b(B|W|WIDTH|BREADTH)\b/.test(upperKey);
    const hasH = /\b(H|D|DEPTH|HEIGHT|THICK)\b/.test(upperKey);

    if (hasL || hasB || hasH) {
      return {
        hasLength: hasL || (!hasB && !hasH),
        hasBreadth: hasB,
        hasHeight: hasH,
        lengthLabel: 'L',
        breadthLabel: 'B',
        heightLabel: 'H',
        formulaName: rawKey,
      };
    }

    return {
      hasLength: true,
      hasBreadth: true,
      hasHeight: true,
      lengthLabel: 'L',
      breadthLabel: 'B',
      heightLabel: 'H',
      formulaName: rawKey,
    };
  };

  // Select Slash Formula Action
  const handleSelectSlashFormula = (formula: SlashFormulaDefinition) => {
    const formulaCode = formula.code || formula.command;
    const formulaName = formula.name || formula.code;

    if (slashTarget === 'HEADING') {
      const current = activeInputTab === 'KEYWORDS' ? keywordsText : itemHeading;
      const clean = current.replace(/\/\S*$/, '').trim();
      const updated = clean ? clean : formulaName;
      if (activeInputTab === 'KEYWORDS') {
        setKeywordsText(updated);
      } else {
        setItemHeading(updated);
      }
    } else {
      const rows = [...measurementRows];
      const targetRow = rows[activeRowIndexForSlash];
      if (targetRow) {
        // Clean trailing slash command from description
        targetRow.description = targetRow.description.replace(/\/\S*$/, '').trim();
        targetRow.formula = formulaCode;

        // Auto-clear dimensions that are not used by the selected formula
        const newDimConfig = getRowDimensionConfig(formulaCode);
        if (!newDimConfig.hasLength) targetRow.length = '';
        if (!newDimConfig.hasBreadth) targetRow.width = '';
        if (!newDimConfig.hasHeight) targetRow.heightDepth = '';

        setMeasurementRows(rows);
      }
    }

    setIsSlashMenuOpen(false);
    setSlashQuery('');
    setImportedFormulaNotice(`Applied formula: "${formulaName}"`);
    setTimeout(() => setImportedFormulaNotice(null), 3000);
  };

  // Monitor text input for slash commands (/)
  const handleTextChangeForSlash = (
    text: string,
    target: 'HEADING' | 'ROW',
    rowIndex: number = 0,
    inputEl?: HTMLInputElement | null
  ) => {
    if (target === 'HEADING') {
      if (activeInputTab === 'KEYWORDS') {
        setKeywordsText(text);
      } else {
        setItemHeading(text);
      }
    }

    const slashIdx = text.lastIndexOf('/');
    if (slashIdx !== -1) {
      const afterSlash = text.slice(slashIdx + 1).split(/\s/)[0];
      setSlashQuery(afterSlash);
      setSlashTarget(target);
      setActiveRowIndexForSlash(rowIndex);
      setHighlightedFormulaIndex(0);

      if (inputEl) {
        const rect = inputEl.getBoundingClientRect();
        setSlashMenuCoords({
          left: Math.max(16, rect.left),
          top: rect.bottom + 4,
          bottom: window.innerHeight - rect.top + 4,
          width: Math.max(390, rect.width),
          placeAbove: rect.top > 260,
        });
      }
      setIsSlashMenuOpen(true);
    } else {
      setIsSlashMenuOpen(false);
    }
  };

  // Open Slash Formula Menu from trigger pill
  const handleOpenSlashMenuForPill = (rowIndex: number, triggerEl: HTMLElement) => {
    setActiveRowIndexForSlash(rowIndex);
    setSlashTarget('ROW');
    setSlashQuery('');
    setHighlightedFormulaIndex(0);

    const inputEl = rowInputRefs.current[rowIndex];
    const rect = inputEl ? inputEl.getBoundingClientRect() : triggerEl.getBoundingClientRect();

    setSlashMenuCoords({
      left: Math.max(16, rect.left),
      top: rect.bottom + 4,
      bottom: window.innerHeight - rect.top + 4,
      width: Math.max(390, rect.width),
      placeAbove: rect.top > 260,
    });
    setIsSlashMenuOpen(true);
  };

  // Selected formula object from Estimation dropdown
  const activeFormulaDoc = useMemo(() => {
    if (!Array.isArray(qmFormulas)) return null;
    return qmFormulas.find((f: any) => f?._id === selectedFormulaId) || null;
  }, [qmFormulas, selectedFormulaId]);

  // Dynamic formula evaluation engine for each measurement row
  const calculateRowQuantity = (row: MeasurementRowItem): number => {
    if (row.isSubheading) return 0;

    const dimConfig = getRowDimensionConfig(row.formula);
    const nosVal = evaluateCellMath(row.nos);
    const nos = nosVal !== 0 ? nosVal : (row.nos === '' ? 1 : 0);
    const l = dimConfig.hasLength ? evaluateCellMath(row.length) : 0;
    const w = dimConfig.hasBreadth ? evaluateCellMath(row.width) : 0;
    const h = dimConfig.hasHeight ? evaluateCellMath(row.heightDepth) : 0;

    const formulaKey = (row.formula || '').toLowerCase().trim();

    // Check custom & standard formulas
    const matchFormula = allSlashFormulas.find(
      (f) =>
        f.command.toLowerCase() === formulaKey ||
        f.code.toLowerCase() === formulaKey ||
        formulaKey.includes(f.command.toLowerCase())
    );

    if (matchFormula && typeof matchFormula.calculate === 'function') {
      const val = matchFormula.calculate({ nos, l, w, h });
      return Number(val.toFixed(3));
    }

    // Default cuboid dimension calculation (L x W x H)
    if (l > 0 && w > 0 && h > 0) {
      return Number((nos * l * w * h).toFixed(3));
    } else if (l > 0 && w > 0) {
      return Number((nos * l * w).toFixed(3));
    } else if (l > 0 && h > 0) {
      return Number((nos * l * h).toFixed(3));
    } else if (l > 0) {
      return Number((nos * l).toFixed(3));
    } else if (nos !== 0 && (row.nos !== '' || l > 0)) {
      return Number(nos.toFixed(3));
    }

    return 0;
  };

  // Calculate Row Quantities using formula engine
  const calculatedRows = useMemo(() => {
    return measurementRows.map((row) => ({
      ...row,
      calculatedQuantity: calculateRowQuantity(row),
    }));
  }, [measurementRows]);

  // Grand Total Quantity
  const totalCalculatedQuantity = useMemo(() => {
    const sum = calculatedRows.reduce((acc, r) => acc + (r.calculatedQuantity || 0), 0);
    return Number(sum.toFixed(3));
  }, [calculatedRows]);

  const activeRateNum = typeof rate === 'number' && rate >= 0 ? rate : 0;
  const totalBoqAmount = CurrencyUtil.calculateAmount(activeRateNum, totalCalculatedQuantity);

  // Live Analysis & Resource Breakdown from Server
  const { data: serverPreview } = useQuery({
    queryKey: [
      'measurementLivePreviewDirect',
      projectId,
      totalCalculatedQuantity,
      activeRateNum,
      selectedFormulaId,
      selectedScheduleId,
      selectedSorItem?._id,
      itemHeading,
    ],
    queryFn: async () => {
      if (totalCalculatedQuantity <= 0) return null;
      const res = await api.post(`/projects/${projectId}/measurements/preview`, {
        sorId: selectedScheduleId || undefined,
        sorItemId: selectedSorItem?._id,
        itemCode: selectedSorItem?.itemCode,
        description: itemHeading.trim() || keywordsText.trim() || 'Measured Item',
        unit,
        rate: activeRateNum,
        formulaId: selectedFormulaId || undefined,
        formulaCode: activeFormulaDoc?.code || undefined,
        entries: calculatedRows
          .filter((r) => !r.isSubheading)
          .map((r) => ({
            description: r.description,
            nos: typeof r.nos === 'number' ? r.nos : 1,
            length: typeof r.length === 'number' ? r.length : 0,
            width: typeof r.width === 'number' ? r.width : 0,
            heightDepth: typeof r.heightDepth === 'number' ? r.heightDepth : 0,
            formula: r.formula,
            remarks: r.remarks,
          })),
      });
      return res.data?.data;
    },
    enabled: isOpen && totalCalculatedQuantity > 0,
  });

  // Add a new measurement sub-row
  const handleAddMeasurementRow = () => {
    setMeasurementRows((prev) => [
      ...prev,
      {
        id: `row-${prev.length + 1}-${Date.now()}`,
        description: '',
        nos: '',
        length: '',
        width: '',
        heightDepth: '',
        formula: 'LxWxH',
        remarks: '',
      },
    ]);
  };

  // Add a sub-heading row
  const handleAddSubheading = () => {
    setMeasurementRows((prev) => [
      ...prev,
      {
        id: `subhead-${Date.now()}`,
        isSubheading: true,
        description: 'New Sub-heading (e.g. Ground Floor / Bed 1)',
        nos: '',
        length: '',
        width: '',
        heightDepth: '',
        formula: '',
        remarks: '',
      },
    ]);
  };

  // Remove a measurement row
  const handleRemoveMeasurementRow = (index: number) => {
    if (measurementRows.length <= 1) {
      setMeasurementRows([
        {
          id: 'row-1',
          description: '',
          nos: '',
          length: '',
          width: '',
          heightDepth: '',
          formula: 'LxWxH',
          remarks: '',
        },
      ]);
      return;
    }
    setMeasurementRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Handle Excel Paste
  const handleApplyExcelPaste = () => {
    if (!excelPasteText.trim()) return;

    const lines = excelPasteText.trim().split(/\r?\n/);
    const newRows: MeasurementRowItem[] = [];

    lines.forEach((line, idx) => {
      const parts = line.split(/\t|,/);
      if (parts.length >= 1) {
        const desc = parts[0]?.trim() || `Sub-item ${idx + 1}`;
        const nosVal = parseFloat(parts[1]?.trim() || '1');
        const lVal = parseFloat(parts[2]?.trim() || '');
        const wVal = parseFloat(parts[3]?.trim() || '');
        const hVal = parseFloat(parts[4]?.trim() || '');
        const rem = parts[5]?.trim() || '';

        newRows.push({
          id: `paste-row-${idx}-${Date.now()}`,
          description: desc,
          nos: !isNaN(nosVal) ? nosVal : '',
          length: !isNaN(lVal) ? lVal : '',
          width: !isNaN(wVal) ? wVal : '',
          heightDepth: !isNaN(hVal) ? hVal : '',
          formula: 'LxWxH',
          remarks: rem,
        });
      }
    });

    if (newRows.length > 0) {
      setMeasurementRows(newRows);
      setIsExcelPasteModalOpen(false);
      setExcelPasteText('');
    }
  };

  // Copy from an existing measurement
  const handleApplyCopyFromExisting = (m: Measurement) => {
    const title = m.entries?.[0]?.description || (m.boqItemId as any)?.description || 'Copied Item';
    setItemHeading(title);
    setKeywordsText(title);
    setSorClauseInput(m.sourceItemCode ? `${m.sourceItemCode} - ${title}` : title);
    setUnit(m.entries?.[0]?.unit || 'sqm');
    setRate(m.unitRate || 0);
    if (m.sorId) setSelectedScheduleId(m.sorId.toString());
    if ((m.boqItemId as any)?.chapter) setWorkCategory((m.boqItemId as any).chapter);

    if (m.entries && m.entries.length > 0) {
      setMeasurementRows(
        m.entries.map((ent, idx) => ({
          id: `copied-row-${idx}-${Date.now()}`,
          description: ent.description || '',
          nos: ent.nos !== undefined ? ent.nos : '',
          length: ent.length !== undefined ? ent.length : '',
          width: ent.width !== undefined ? ent.width : '',
          heightDepth: ent.heightDepth !== undefined ? ent.heightDepth : '',
          formula: ent.formula || 'LxWxH',
          remarks: ent.remarks || '',
        }))
      );
    }
    setIsCopyModalOpen(false);
    setImportedFormulaNotice(`📋 Copied details and rows from "${title}"!`);
    setTimeout(() => setImportedFormulaNotice(null), 3000);
  };

  // Save to Measurement Book Mutation
  const saveToMeasurementBookMutation = useMutation({
    mutationFn: async () => {
      const activeTitle = itemHeading.trim() || keywordsText.trim() || sorClauseInput.trim();
      if (!activeTitle) {
        throw new Error('Please provide an Item Heading or Description.');
      }
      if (totalCalculatedQuantity <= 0) {
        throw new Error('Total calculated quantity must be greater than zero. Please enter dimensions.');
      }

      const payload = {
        sorId: selectedScheduleId || undefined,
        sorItemId: selectedSorItem?._id,
        itemCode: selectedSorItem?.itemCode,
        boqItemId: initialBoqItem?._id || editingMeasurement?.boqItemId?._id,
        description: activeTitle,
        category: workCategory.trim() || 'General Civil Works',
        stage: stage.trim(),
        subClause: subClause.trim(),
        formulaId: selectedFormulaId || undefined,
        formulaCode: activeFormulaDoc?.code || undefined,
        unit,
        rate: activeRateNum,
        formula: 'LxWxH',
        nos: 1,
        entries: calculatedRows
          .filter((r) => !r.isSubheading)
          .map((r) => {
            const dim = getRowDimensionConfig(r.formula);
            const nosVal = evaluateCellMath(r.nos);
            const lVal = dim.hasLength ? (typeof r.length === 'number' ? r.length : evaluateCellMath(r.length)) : 0;
            const wVal = dim.hasBreadth ? (typeof r.width === 'number' ? r.width : evaluateCellMath(r.width)) : 0;
            const hVal = dim.hasHeight ? (typeof r.heightDepth === 'number' ? r.heightDepth : evaluateCellMath(r.heightDepth)) : 0;
            return {
              description: r.description.trim() || activeTitle,
              nos: nosVal !== 0 ? nosVal : 1,
              length: lVal,
              width: wVal,
              breadth: wVal,
              height: hVal,
              heightDepth: hVal,
              remarks: r.remarks.trim(),
              formula: r.formula || 'LxWxH',
            };
          }),
      };

      if (editingMeasurement) {
        return api.put(`/projects/${projectId}/measurements/${editingMeasurement._id}`, payload);
      } else {
        return api.post(`/projects/${projectId}/measurements`, payload);
      }
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || err.message || 'Failed to save measurement');
    },
  });

  // Clear Form
  const handleClearForm = () => {
    setItemHeading('');
    setKeywordsText('');
    setSelectedKeywords([]);
    setSorClauseInput('');
    setSelectedSorItem(null);
    setSubClause('');
    setWorkCategory('');
    setStage('');
    setSelectedFormulaId('');
    setUnit('sqm');
    setRate(0);
    setMeasurementRows([
      {
        id: 'row-1',
        description: '',
        nos: '',
        length: '',
        width: '',
        heightDepth: '',
        formula: 'LxWxH',
        remarks: '',
      },
    ]);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full border-2 border-blue-400 flex items-center justify-center text-blue-400">
            <Plus className="w-3 h-3 stroke-[3]" />
          </div>
          <h3 className="text-sm font-bold text-white tracking-wide">New Item</h3>
        </div>
      }
      maxWidth="7xl"
    >
      <div className="space-y-4 max-h-[82vh] overflow-y-auto pr-1 text-slate-200">
        {/* Floating Notice */}
        {importedFormulaNotice && (
          <div className="p-2.5 bg-blue-500/15 border border-blue-500/40 rounded-xl flex items-center gap-2 text-xs font-semibold text-blue-300 animate-in fade-in slide-in-from-top-2">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{importedFormulaNotice}</span>
          </div>
        )}

        {/* ======================================================================
            SECTION 1: KEYWORDS & ITEM HEADING
           ====================================================================== */}
        <div className="p-3.5 rounded-xl border border-[#1e2433] bg-[#0c1017] space-y-2.5 relative">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>Keyword</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setKeywordClauseSearch(keywordsText || itemHeading || '');
                setIsKeywordsModalOpen(true);
              }}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Pick SOR Clause by Keyword</span>
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              value={activeInputTab === 'ITEM_HEADING' ? itemHeading : (keywordsText || itemHeading)}
              onClick={() => {
                setKeywordClauseSearch(keywordsText || itemHeading || '');
                setIsKeywordsModalOpen(true);
              }}
              onChange={(e) => {
                setKeywordsText(e.target.value);
                setItemHeading(e.target.value);
              }}
              placeholder="Search or click to pick from SOR Keyword Library..."
              className="w-full px-3.5 py-2.5 bg-[#080b11] border border-[#1e2536] border-l-4 border-l-blue-500 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 font-medium placeholder:text-slate-500 cursor-pointer pr-28"
            />
            <button
              type="button"
              onClick={() => {
                setKeywordClauseSearch(keywordsText || itemHeading || '');
                setIsKeywordsModalOpen(true);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 text-xs font-semibold flex items-center gap-1 border border-blue-500/40 transition-colors cursor-pointer"
            >
              <MapPin className="w-3 h-3" />
              <span>Pick Clause</span>
            </button>
          </div>
        </div>

        {/* ======================================================================
            SECTION 2: SOR CLAUSE & CATEGORY (Dynamic Selection)
           ====================================================================== */}
        <div className="p-3.5 rounded-xl border border-[#1e2433] bg-[#0c1017] space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              SOR CLAUSE & CATEGORY
            </h4>

            {/* Dynamic SOR Selection Trigger */}
            <button
              type="button"
              onClick={() => setIsSorModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#0e2a22] text-[#34d399] border border-emerald-500/40 hover:bg-[#143d31] transition-all cursor-pointer tracking-wide shadow-sm"
              title="Click to pick SOR for Measurement Book"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {activeSchedule
                  ? activeSchedule.sorName
                  : 'Select Schedule of Rates'}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* SOR Clause */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  SOR CLAUSE
                </label>
                <button
                  type="button"
                  onClick={() => setIsClausePickerOpen(true)}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                >
                  Browse Clauses
                </button>
              </div>
              <input
                type="text"
                value={sorClauseInput}
                onClick={() => setIsClausePickerOpen(true)}
                onChange={(e) => {
                  setSorClauseInput(e.target.value);
                  setItemHeading(e.target.value);
                }}
                placeholder="Click to pick or search clause..."
                className="w-full px-3 py-2 bg-[#080b11] border border-[#1e2536] border-l-4 border-l-cyan-400 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400 truncate font-medium cursor-pointer"
              />
            </div>

            {/* Subclause */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  SUBCLAUSE
                </label>
                {subclausesList.length > 0 && (
                  <span className="text-[10px] text-purple-400 font-semibold">
                    {subclausesList.length} sub-items
                  </span>
                )}
              </div>
              <input
                type="text"
                value={subClause}
                onClick={() => {
                  if (subclausesList.length > 0) {
                    setIsSubclausePickerOpen(true);
                  }
                }}
                onChange={(e) => setSubClause(e.target.value)}
                placeholder={
                  subclausesList.length > 0
                    ? `Click to pick (${subclausesList.length} subclauses)`
                    : 'Click or type subclause'
                }
                className={cn(
                  'w-full px-3 py-2 bg-[#080b11] border border-[#1e2536] rounded-lg text-xs text-slate-300 focus:outline-none focus:border-blue-500',
                  subclausesList.length > 0 && 'cursor-pointer border-purple-500/40 text-purple-300 font-medium'
                )}
              />
            </div>

            {/* Work Category */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">
                WORK CATEGORY
              </label>
              <select
                value={workCategory}
                onChange={(e) => setWorkCategory(e.target.value)}
                className="w-full px-3 py-2 bg-[#080b11] border border-[#1e2536] border-l-4 border-l-purple-400 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-purple-400"
              >
                <option value="">-- All Categories --</option>
                {availableWorkCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Stage */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wide flex items-center gap-1">
                <Settings className="w-3 h-3 text-blue-400" />
                <span>STAGE</span>
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full px-3 py-2 bg-[#080b11] border border-[#1e2536] border-l-4 border-l-blue-400 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-400"
              >
                <option value="">-- Project Stage --</option>
                <option value="Substructure / Foundation">Substructure / Foundation</option>
                <option value="Superstructure Frame">Superstructure Frame</option>
                <option value="Brickwork & Masonry">Brickwork & Masonry</option>
                <option value="Plastering & Pointing">Plastering & Pointing</option>
                <option value="Flooring & Finishing">Flooring & Finishing</option>
                <option value="Waterproofing & Roofing">Waterproofing & Roofing</option>
                <option value="Plumbing & Drainage">Plumbing & Drainage</option>
                <option value="External Works & Development">External Works & Development</option>
              </select>
            </div>
          </div>
        </div>

        {/* ======================================================================
            SECTION 3: ESTIMATION (FORMULA, UNIT, RATE)
           ====================================================================== */}
        <div className="p-3.5 rounded-xl border border-[#1e2433] bg-[#0c1017] space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5" />
              ESTIMATION
            </h4>
            <a
              href="/planning/quantity-master"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
            >
              <span>Manage Quantity Master</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* FORMULA (FOR BOM CALCULATION) */}
            <div className="md:col-span-6">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wide flex items-center justify-between">
                <span>FORMULA (FOR BOM CALCULATION)</span>
                {selectedFormulaId && (
                  <span className="text-blue-400 font-normal">Active Formula</span>
                )}
              </label>
              <select
                value={selectedFormulaId}
                onChange={(e) => {
                  const fId = e.target.value;
                  setSelectedFormulaId(fId);
                  const f = Array.isArray(qmFormulas) ? qmFormulas.find((item: any) => item._id === fId) : null;
                  if (f) {
                    if (f.unit) setUnit(f.unit);
                    if (f.category && !workCategory) setWorkCategory(f.category);
                    const fCode = f.code || f.name;
                    // Automatically link formula to measurement rows that don't have custom slash formula
                    setMeasurementRows((prev) =>
                      prev.map((r) => {
                        if (!r.formula || r.formula === 'LxWxH') {
                          const updated = { ...r, formula: fCode };
                          const dim = getRowDimensionConfig(fCode);
                          if (!dim.hasLength) updated.length = '';
                          if (!dim.hasBreadth) updated.width = '';
                          if (!dim.hasHeight) updated.heightDepth = '';
                          return updated;
                        }
                        return r;
                      })
                    );
                    setImportedFormulaNotice(`Linked formula "${f.name}" for automated BOM calculations.`);
                    setTimeout(() => setImportedFormulaNotice(null), 3000);
                  } else {
                    // Reset rows that used linked QM formula back to standard LxWxH
                    setMeasurementRows((prev) =>
                      prev.map((r) => (!r.formula?.startsWith('/') ? { ...r, formula: 'LxWxH' } : r))
                    );
                  }
                }}
                className="w-full px-3 py-2 bg-[#080b11] border border-[#1e2536] rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="">-- No Formula / Standard --</option>
                {Array.isArray(qmFormulas) &&
                  qmFormulas.map((f: any) => (
                    <option key={f._id} value={f._id}>
                      [{f.code}] {f.name} ({f.unit}) - {f.category || 'General'}
                    </option>
                  ))}
              </select>
            </div>

            {/* UNIT */}
            <div className="md:col-span-3">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wide flex items-center gap-1">
                <Settings className="w-3 h-3 text-cyan-400" />
                <span>UNIT</span>
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="sqm"
                className="w-full px-3 py-2 bg-[#080b11] border border-[#1e2536] border-l-4 border-l-cyan-400 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400 font-mono font-semibold"
              />
            </div>

            {/* RATE (₹) */}
            <div className="md:col-span-3">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">
                RATE (₹)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={rate}
                onChange={(e) => setRate(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-[#080b11] border border-[#1e2536] border-l-4 border-l-emerald-400 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-400 font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* ======================================================================
            SECTION 4: QUALITY CHECKLIST
           ====================================================================== */}
        <div className="p-3.5 rounded-xl border border-[#1e2433] bg-[#0c1017] space-y-2.5">
          <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            QUALITY CHECKLIST
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">
                QC CHECKLIST
              </label>
              <input
                type="text"
                value={qcChecklist}
                onChange={(e) => setQcChecklist(e.target.value)}
                placeholder="— Select a work category first —"
                className="w-full px-3 py-2 bg-[#080b11] border border-[#1e2536] rounded-lg text-xs text-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">
                QUALITY LEVEL
              </label>
              <select
                value={qualityLevel}
                onChange={(e) => setQualityLevel(e.target.value)}
                className="w-full px-3 py-2 bg-[#080b11] border border-[#1e2536] rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="Project default">Project default</option>
                <option value="Standard checks">Standard checks</option>
                <option value="High precision — critical structural">High precision — critical structural</option>
              </select>
            </div>
          </div>
        </div>

        {/* ======================================================================
            SECTION 5: SUB ITEMS (MEASUREMENTS) - Multi-Row Spreadsheet Table
           ====================================================================== */}
        <div className="p-3.5 rounded-xl border border-[#1e2433] bg-[#0c1017] space-y-3">
          {/* Header & Action Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pb-2 border-b border-[#1e2433]">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5" />
                SUB ITEMS (MEASUREMENTS)
              </h4>
              <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-[#161c28] border border-slate-700 text-slate-300 font-mono">
                ACTIVE UNIT: <strong className="text-white">m (Meters)</strong>
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap text-xs font-medium">
              <button
                type="button"
                onClick={() => setIsExcelPasteModalOpen(true)}
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>PASTE DIRECTLY FROM EXCEL</span>
              </button>

              <span className="text-blue-400/70 flex items-center gap-1 cursor-default">
                <span>◫ RIGHT-CLICK A ROW FOR COPY / PASTE / INSERT</span>
              </span>

              <button
                type="button"
                onClick={() => setIsCellFormulaHelpOpen(true)}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Cell formula help</span>
              </button>

              <button
                type="button"
                onClick={() => setIsManageFormulasModalOpen(true)}
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Manage Formulas</span>
              </button>

              <button
                type="button"
                onClick={() => setIsExcelPasteModalOpen(true)}
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Input Sheet (Ctrl+I)</span>
              </button>
            </div>
          </div>

          {/* Measurement Spreadsheet Table */}
          <div className="overflow-x-auto rounded-lg border border-[#1e2433] bg-[#090c13] relative">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#0b0e16] text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-[#1e2433]">
                <tr>
                  <th className="py-2 px-2 w-10 text-center">#</th>
                  <th className="py-2 px-3 min-w-[260px]">SUB-ITEM NAME</th>
                  <th className="py-2 px-2 w-24 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveColumnDropdown(activeColumnDropdown === 'NOS' ? null : 'NOS');
                      }}
                      className="text-[#22D3EE] hover:text-cyan-200 font-bold inline-flex items-center gap-0.5 cursor-pointer uppercase tracking-wider text-[11px]"
                    >
                      <span>NOS</span>
                      <ChevronDown className="w-3 h-3 text-[#22D3EE]" />
                    </button>
                  </th>
                  <th className="py-2 px-2 w-28 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveColumnDropdown(activeColumnDropdown === 'LENGTH' ? null : 'LENGTH');
                      }}
                      className="text-[#34D399] hover:text-emerald-200 font-bold inline-flex items-center gap-0.5 cursor-pointer uppercase tracking-wider text-[11px]"
                    >
                      <span>LENGTH (M)</span>
                      <ChevronDown className="w-3 h-3 text-[#34D399]" />
                    </button>
                  </th>
                  <th className="py-2 px-2 w-28 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveColumnDropdown(activeColumnDropdown === 'BREADTH' ? null : 'BREADTH');
                      }}
                      className="text-[#FBBF24] hover:text-amber-200 font-bold inline-flex items-center gap-0.5 cursor-pointer uppercase tracking-wider text-[11px]"
                    >
                      <span>BREADTH (M)</span>
                      <ChevronDown className="w-3 h-3 text-[#FBBF24]" />
                    </button>
                  </th>
                  <th className="py-2 px-2 w-28 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveColumnDropdown(activeColumnDropdown === 'H_DEPTH' ? null : 'H_DEPTH');
                      }}
                      className="text-[#A78BFA] hover:text-purple-200 font-bold inline-flex items-center gap-0.5 cursor-pointer uppercase tracking-wider text-[11px]"
                    >
                      <span>H/DEPTH (M)</span>
                      <ChevronDown className="w-3 h-3 text-[#A78BFA]" />
                    </button>
                  </th>
                  <th className="py-2 px-2 w-28 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveColumnDropdown(activeColumnDropdown === 'QTY' ? null : 'QTY');
                      }}
                      className="text-[#60A5FA] hover:text-blue-200 font-bold inline-flex items-center gap-0.5 cursor-pointer uppercase tracking-wider text-[11px]"
                    >
                      <span>QTY</span>
                      <ChevronDown className="w-3 h-3 text-[#60A5FA]" />
                    </button>
                  </th>
                  <th className="py-2 px-3 w-32 text-center text-slate-400">REMARKS</th>
                  <th className="py-2 px-2 w-10 text-center"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#181e2b]">
                {calculatedRows.map((row, idx) => {
                  if (row.isSubheading) {
                    return (
                      <tr key={row.id} className="bg-[#121724] border-y border-blue-500/20">
                        <td className="py-2 px-2 text-center text-slate-500 font-mono text-[11px]">
                          <div className="flex items-center justify-center gap-1">
                            <GripVertical className="w-3.5 h-3.5 text-slate-600" />
                            <span>{idx + 1}</span>
                          </div>
                        </td>
                        <td colSpan={7} className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono tracking-wider">
                              SUB-HEADING
                            </span>
                            <input
                              type="text"
                              value={row.description}
                              onChange={(e) => {
                                const rows = [...measurementRows];
                                rows[idx].description = e.target.value;
                                setMeasurementRows(rows);
                              }}
                              placeholder="Enter sub-heading name..."
                              className="w-full bg-transparent font-bold text-xs text-white focus:outline-none placeholder:text-slate-500"
                            />
                          </div>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveMeasurementRow(idx)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  const dimConfig = getRowDimensionConfig(row.formula);

                  return (
                    <tr
                      key={row.id}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setRowContextMenu({ x: e.clientX, y: e.clientY, rowIndex: idx });
                      }}
                      className="hover:bg-[#121622]/60 group transition-colors"
                    >
                      {/* # and drag handle */}
                      <td className="py-2 px-2 text-center text-slate-500 font-mono text-[11px] align-top pt-3">
                        <div className="flex items-center justify-center gap-1">
                          <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 cursor-grab" />
                          <span>{idx + 1}</span>
                        </div>
                      </td>

                      {/* SUB-ITEM NAME */}
                      <td className="py-2 px-2 align-top relative">
                        <div className="space-y-1.5 relative">
                          <input
                            type="text"
                            ref={(el) => {
                              rowInputRefs.current[idx] = el;
                            }}
                            value={row.description}
                            onChange={(e) => {
                              const val = e.target.value;
                              const rows = [...measurementRows];
                              rows[idx].description = val;
                              setMeasurementRows(rows);
                              handleTextChangeForSlash(val, 'ROW', idx, e.currentTarget);
                            }}
                            onKeyDown={(e) => {
                              if (isSlashMenuOpen && slashTarget === 'ROW' && activeRowIndexForSlash === idx) {
                                if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  setHighlightedFormulaIndex((prev) => (prev + 1) % Math.max(1, filteredSlashFormulas.length));
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  setHighlightedFormulaIndex((prev) => (prev - 1 + filteredSlashFormulas.length) % Math.max(1, filteredSlashFormulas.length));
                                } else if (e.key === 'Enter' || e.key === 'Tab') {
                                  if (filteredSlashFormulas[highlightedFormulaIndex]) {
                                    e.preventDefault();
                                    handleSelectSlashFormula(filteredSlashFormulas[highlightedFormulaIndex]);
                                  }
                                } else if (e.key === 'Escape') {
                                  e.preventDefault();
                                  setIsSlashMenuOpen(false);
                                }
                              }
                            }}
                            placeholder="e.g. Ceiling Plaster -> type / for formula"
                            className={cn(
                              "w-full px-3 py-1.5 bg-[#080b11] border rounded-lg text-xs text-white focus:outline-none transition-all",
                              isSlashMenuOpen && activeRowIndexForSlash === idx && slashTarget === 'ROW'
                                ? "border-purple-500 ring-2 ring-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.35)]"
                                : "border-[#1e2536] focus:border-blue-500"
                            )}
                          />

                          {/* Trigger Pill matching Screenshot 1 */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {row.formula && row.formula !== 'LxWxH' ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-[10px] font-mono text-blue-300">
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenSlashMenuForPill(idx, e.currentTarget)}
                                  className="font-bold text-cyan-300 hover:text-cyan-200 cursor-pointer flex items-center gap-1"
                                  title="Click to change formula"
                                >
                                  <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                                  <span>{dimConfig.formulaName || row.formula}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const rows = [...measurementRows];
                                    rows[idx].formula = 'LxWxH';
                                    setMeasurementRows(rows);
                                  }}
                                  title="Reset formula to standard L×W×H"
                                  className="text-slate-400 hover:text-rose-300 ml-0.5 transition-colors cursor-pointer"
                                >
                                  <RotateCcw className="w-2.5 h-2.5" />
                                </button>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => handleOpenSlashMenuForPill(idx, e.currentTarget)}
                                className="px-2 py-0.5 bg-[#0a0d15] border border-purple-500/40 rounded text-[10px] text-purple-400 font-mono flex items-center gap-1 cursor-pointer hover:border-purple-500/80 hover:bg-purple-950/20 transition-all select-none"
                              >
                                <span>type / for formula</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* NOS */}
                      <td className="py-2 px-1.5 align-top">
                        <input
                          type="text"
                          value={row.nos}
                          onChange={(e) => {
                            const rows = [...measurementRows];
                            rows[idx].nos = e.target.value;
                            setMeasurementRows(rows);
                          }}
                          onBlur={() => {
                            const evaluated = evaluateCellMath(row.nos);
                            if (typeof row.nos === 'string' && row.nos.trim() && evaluated !== 0) {
                              const rows = [...measurementRows];
                              rows[idx].nos = evaluated;
                              setMeasurementRows(rows);
                            }
                          }}
                          placeholder={`N${idx + 1}`}
                          className="w-full px-2 py-1.5 bg-[#080b11] border border-[#22d3ee]/60 focus:border-[#22d3ee] focus:ring-1 focus:ring-[#22d3ee]/50 rounded-lg text-xs text-white text-center focus:outline-none font-mono font-medium placeholder:text-[#22d3ee]/40 transition-colors"
                        />
                      </td>

                      {/* LENGTH (M) */}
                      <td className="py-2 px-1.5 align-top">
                        {dimConfig.hasLength ? (
                          <input
                            type="text"
                            value={row.length}
                            onChange={(e) => {
                              const rows = [...measurementRows];
                              rows[idx].length = e.target.value;
                              setMeasurementRows(rows);
                            }}
                            onBlur={() => {
                              const evaluated = evaluateCellMath(row.length);
                              if (typeof row.length === 'string' && row.length.trim() && evaluated !== 0) {
                                const rows = [...measurementRows];
                                rows[idx].length = evaluated;
                                setMeasurementRows(rows);
                              }
                            }}
                            placeholder={`${dimConfig.lengthLabel}${idx + 1}`}
                            className="w-full px-2 py-1.5 bg-[#080b11] border border-[#34d399]/60 focus:border-[#34d399] focus:ring-1 focus:ring-[#34d399]/50 rounded-lg text-xs text-white text-center focus:outline-none font-mono font-medium placeholder:text-[#34d399]/40 transition-colors"
                          />
                        ) : (
                          <div
                            title={`Length not used by active formula (${dimConfig.formulaName})`}
                            className="w-full px-2 py-1.5 bg-[#06080d]/60 border border-slate-800/40 rounded-lg text-xs text-slate-600 text-center font-mono select-none cursor-not-allowed opacity-40"
                          >
                            —
                          </div>
                        )}
                      </td>

                      {/* BREADTH (M) */}
                      <td className="py-2 px-1.5 align-top">
                        {dimConfig.hasBreadth ? (
                          <input
                            type="text"
                            value={row.width}
                            onChange={(e) => {
                              const rows = [...measurementRows];
                              rows[idx].width = e.target.value;
                              setMeasurementRows(rows);
                            }}
                            onBlur={() => {
                              const evaluated = evaluateCellMath(row.width);
                              if (typeof row.width === 'string' && row.width.trim() && evaluated !== 0) {
                                const rows = [...measurementRows];
                                rows[idx].width = evaluated;
                                setMeasurementRows(rows);
                              }
                            }}
                            placeholder={`${dimConfig.breadthLabel}${idx + 1}`}
                            className="w-full px-2 py-1.5 bg-[#080b11] border border-[#fbbf24]/60 focus:border-[#fbbf24] focus:ring-1 focus:ring-[#fbbf24]/50 rounded-lg text-xs text-white text-center focus:outline-none font-mono font-medium placeholder:text-[#fbbf24]/40 transition-colors"
                          />
                        ) : (
                          <div
                            title={`Breadth not used by active formula (${dimConfig.formulaName})`}
                            className="w-full px-2 py-1.5 bg-[#06080d]/60 border border-slate-800/40 rounded-lg text-xs text-slate-600 text-center font-mono select-none cursor-not-allowed opacity-40"
                          >
                            —
                          </div>
                        )}
                      </td>

                      {/* H/DEPTH (M) */}
                      <td className="py-2 px-1.5 align-top">
                        {dimConfig.hasHeight ? (
                          <input
                            type="text"
                            value={row.heightDepth}
                            onChange={(e) => {
                              const rows = [...measurementRows];
                              rows[idx].heightDepth = e.target.value;
                              setMeasurementRows(rows);
                            }}
                            onBlur={() => {
                              const evaluated = evaluateCellMath(row.heightDepth);
                              if (typeof row.heightDepth === 'string' && row.heightDepth.trim() && evaluated !== 0) {
                                const rows = [...measurementRows];
                                rows[idx].heightDepth = evaluated;
                                setMeasurementRows(rows);
                              }
                            }}
                            placeholder={`${dimConfig.heightLabel}${idx + 1}`}
                            className="w-full px-2 py-1.5 bg-[#080b11] border border-[#a78bfa]/60 focus:border-[#a78bfa] focus:ring-1 focus:ring-[#a78bfa]/50 rounded-lg text-xs text-white text-center focus:outline-none font-mono font-medium placeholder:text-[#a78bfa]/40 transition-colors"
                          />
                        ) : (
                          <div
                            title={`Height/Depth not used by active formula (${dimConfig.formulaName})`}
                            className="w-full px-2 py-1.5 bg-[#06080d]/60 border border-slate-800/40 rounded-lg text-xs text-slate-600 text-center font-mono select-none cursor-not-allowed opacity-40"
                          >
                            —
                          </div>
                        )}
                      </td>

                      {/* QTY */}
                      <td className="py-2 px-1.5 align-top">
                        <div
                          className={cn(
                            "w-full px-2 py-1.5 rounded-lg text-xs font-bold font-mono text-center shadow-inner",
                            typeof row.calculatedQuantity === 'number' && row.calculatedQuantity < 0
                              ? "bg-rose-950/30 border border-rose-500/60 text-rose-300"
                              : "bg-[#080b11] border border-[#60a5fa]/60 text-blue-300"
                          )}
                        >
                          {typeof row.calculatedQuantity === 'number' && row.calculatedQuantity !== 0
                            ? row.calculatedQuantity.toFixed(3)
                            : (row.nos !== '' || row.length !== '' || row.width !== '' || row.heightDepth !== '' ? '0.000' : `Q${idx + 1}`)}
                        </div>
                      </td>

                      {/* REMARKS */}
                      <td className="py-2 px-1.5 align-top">
                        <input
                          type="text"
                          value={row.remarks}
                          onChange={(e) => {
                            const rows = [...measurementRows];
                            rows[idx].remarks = e.target.value;
                            setMeasurementRows(rows);
                          }}
                          placeholder=""
                          className="w-full px-2 py-1.5 bg-[#080b11] border border-[#1e2536] focus:border-slate-500 rounded-lg text-xs text-slate-300 focus:outline-none"
                        />
                      </td>

                      {/* Delete action (red ✕) */}
                      <td className="py-2 px-1 text-center align-top pt-2.5">
                        <button
                          type="button"
                          onClick={() => handleRemoveMeasurementRow(idx)}
                          title="Delete Row"
                          className="text-red-500/80 hover:text-red-400 hover:bg-red-500/10 p-1 rounded transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Floating Slash Formula Popup matching Reference Screenshot 2 */}
          {isSlashMenuOpen && slashMenuCoords && (
            <div
              ref={slashMenuRef}
              style={{
                position: 'fixed',
                left: `${slashMenuCoords.left}px`,
                ...(slashMenuCoords.placeAbove
                  ? { bottom: `${slashMenuCoords.bottom}px` }
                  : { top: `${slashMenuCoords.top}px` }),
                width: `${Math.min(430, slashMenuCoords.width || 430)}px`,
                zIndex: 99999,
              }}
              className="max-h-72 overflow-y-auto bg-[#0d121e] border border-slate-700/90 rounded-xl shadow-2xl p-1.5 space-y-1.5 animate-in fade-in zoom-in-95 duration-100 select-none scrollbar-thin scrollbar-thumb-slate-700"
            >
              {Object.entries(groupedSlashFormulas).length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">
                  No formulas matching "{slashQuery}"
                </div>
              ) : (
                Object.entries(groupedSlashFormulas).map(([cat, formulas]) => (
                  <div key={cat} className="space-y-0.5">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 tracking-wider uppercase bg-[#141a27] rounded">
                      {cat}
                    </div>
                    {formulas.map((f) => {
                      const isHighlighted =
                        filteredSlashFormulas[highlightedFormulaIndex]?.command === f.command;
                      return (
                        <div
                          key={f.command}
                          onMouseEnter={() => {
                            const globalIdx = filteredSlashFormulas.findIndex(
                              (item) => item.command === f.command
                            );
                            if (globalIdx !== -1) setHighlightedFormulaIndex(globalIdx);
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectSlashFormula(f);
                          }}
                          className={cn(
                            "px-2.5 py-1.5 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors group",
                            isHighlighted ? "bg-[#1a233a] text-white" : "hover:bg-[#151c2e] text-slate-300"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-purple-400 group-hover:text-purple-300">
                              {f.command}
                            </span>
                            <span className="text-slate-200 group-hover:text-white font-medium text-[11px]">
                              {f.name.replace(/^[^\s]+\s+/, '')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}

              {/* Bottom Action matching Screenshot 2 */}
              <div
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsSlashMenuOpen(false);
                  setIsManageFormulasModalOpen(true);
                }}
                className="pt-1.5 border-t border-slate-800 px-2 py-1 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1.5 cursor-pointer font-medium"
              >
                <Settings className="w-3.5 h-3.5 text-blue-400" />
                <span>Manage / add custom formulas...</span>
              </div>
            </div>
          )}

          {/* Column Header Dropdown Menu */}
          {activeColumnDropdown && (
            <div
              ref={columnDropdownRef}
              className="absolute bg-[#0f1422] border border-slate-700 rounded-xl shadow-2xl p-2 z-[90] text-xs space-y-1 w-64 animate-in fade-in"
              style={{
                top: '55px',
                left:
                  activeColumnDropdown === 'NOS'
                    ? '320px'
                    : activeColumnDropdown === 'LENGTH'
                    ? '410px'
                    : activeColumnDropdown === 'BREADTH'
                    ? '520px'
                    : activeColumnDropdown === 'H_DEPTH'
                    ? '630px'
                    : '720px',
              }}
            >
              {activeColumnDropdown === 'QTY' && (
                <>
                  <div className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1">Apply Formula to All Rows</div>
                  <button
                    type="button"
                    onClick={() => {
                      setMeasurementRows((prev) => prev.map((r) => ({ ...r, formula: '/area' })));
                      setActiveColumnDropdown(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center justify-between"
                  >
                    <span>Area (L × B)</span>
                    <span className="text-purple-400 font-mono text-[10px]">/area</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMeasurementRows((prev) => prev.map((r) => ({ ...r, formula: 'LxWxH' })));
                      setActiveColumnDropdown(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center justify-between"
                  >
                    <span>Volume (L × B × H)</span>
                    <span className="text-purple-400 font-mono text-[10px]">/vol</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMeasurementRows((prev) => prev.map((r) => ({ ...r, formula: '/circarea' })));
                      setActiveColumnDropdown(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center justify-between"
                  >
                    <span>Circle Area (π/4 × D²)</span>
                    <span className="text-purple-400 font-mono text-[10px]">/circarea</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMeasurementRows((prev) => prev.map((r) => ({ ...r, formula: '/cylarea' })));
                      setActiveColumnDropdown(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center justify-between"
                  >
                    <span>Cylinder Surface (π × D × H)</span>
                    <span className="text-purple-400 font-mono text-[10px]">/cylarea</span>
                  </button>
                  <div className="border-t border-slate-800 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveColumnDropdown(null);
                        setIsManageFormulasModalOpen(true);
                      }}
                      className="w-full text-left px-2.5 py-1 text-blue-400 hover:text-blue-300 flex items-center gap-1.5"
                    >
                      <Settings className="w-3 h-3" />
                      <span>Manage Formulas...</span>
                    </button>
                  </div>
                </>
              )}

              {activeColumnDropdown === 'NOS' && (
                <>
                  <div className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1">Nos Column Tools</div>
                  <button
                    type="button"
                    onClick={() => {
                      setMeasurementRows((prev) => prev.map((r) => ({ ...r, nos: 1 })));
                      setActiveColumnDropdown(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white"
                  >
                    Set all rows Nos = 1
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMeasurementRows((prev) => prev.map((r) => ({ ...r, nos: 2 })));
                      setActiveColumnDropdown(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white"
                  >
                    Set all rows Nos = 2
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMeasurementRows((prev) => prev.map((r) => ({ ...r, nos: '' })));
                      setActiveColumnDropdown(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-rose-400 hover:text-rose-300"
                  >
                    Clear all Nos values
                  </button>
                </>
              )}

              {(activeColumnDropdown === 'LENGTH' || activeColumnDropdown === 'BREADTH' || activeColumnDropdown === 'H_DEPTH') && (
                <>
                  <div className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1">Quick Unit Converter</div>
                  <button
                    type="button"
                    onClick={() => {
                      const col = activeColumnDropdown === 'LENGTH' ? 'length' : activeColumnDropdown === 'BREADTH' ? 'width' : 'heightDepth';
                      setMeasurementRows((prev) =>
                        prev.map((r) => {
                          const val = evaluateCellMath(r[col]);
                          return val > 0 ? { ...r, [col]: Number((val * 0.3048).toFixed(3)) } : r;
                        })
                      );
                      setActiveColumnDropdown(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center justify-between"
                  >
                    <span>Convert Feet → Meters</span>
                    <span className="font-mono text-[10px] text-slate-400">× 0.3048</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const col = activeColumnDropdown === 'LENGTH' ? 'length' : activeColumnDropdown === 'BREADTH' ? 'width' : 'heightDepth';
                      setMeasurementRows((prev) =>
                        prev.map((r) => {
                          const val = evaluateCellMath(r[col]);
                          return val > 0 ? { ...r, [col]: Number((val / 39.37).toFixed(3)) } : r;
                        })
                      );
                      setActiveColumnDropdown(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center justify-between"
                  >
                    <span>Convert Inches → Meters</span>
                    <span className="font-mono text-[10px] text-slate-400">÷ 39.37</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const col = activeColumnDropdown === 'LENGTH' ? 'length' : activeColumnDropdown === 'BREADTH' ? 'width' : 'heightDepth';
                      setMeasurementRows((prev) =>
                        prev.map((r) => {
                          const val = evaluateCellMath(r[col]);
                          return val > 0 ? { ...r, [col]: Number((val / 1000).toFixed(3)) } : r;
                        })
                      );
                      setActiveColumnDropdown(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center justify-between"
                  >
                    <span>Convert mm → Meters</span>
                    <span className="font-mono text-[10px] text-slate-400">÷ 1000</span>
                  </button>
                  <div className="border-t border-slate-800 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const col = activeColumnDropdown === 'LENGTH' ? 'length' : activeColumnDropdown === 'BREADTH' ? 'width' : 'heightDepth';
                        setMeasurementRows((prev) => prev.map((r) => ({ ...r, [col]: '' })));
                        setActiveColumnDropdown(null);
                      }}
                      className="w-full text-left px-2.5 py-1 text-rose-400 hover:text-rose-300"
                    >
                      Clear column values
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Right-Click Row Context Menu */}
          {rowContextMenu && (
            <div
              ref={contextMenuRef}
              style={{
                position: 'fixed',
                top: `${rowContextMenu.y}px`,
                left: `${rowContextMenu.x}px`,
                zIndex: 99999,
              }}
              className="bg-[#0f1422] border border-slate-700 rounded-xl shadow-2xl p-1.5 text-xs space-y-0.5 w-48 animate-in fade-in zoom-in-95 duration-75 select-none"
            >
              <button
                type="button"
                onClick={() => {
                  const newRow: MeasurementRowItem = {
                    id: `row-${Date.now()}`,
                    description: '',
                    nos: 1,
                    length: '',
                    width: '',
                    heightDepth: '',
                    formula: 'LxWxH',
                    remarks: '',
                  };
                  const updated = [...measurementRows];
                  updated.splice(rowContextMenu.rowIndex, 0, newRow);
                  setMeasurementRows(updated);
                  setRowContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5 text-blue-400" />
                <span>Insert Row Above</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const newRow: MeasurementRowItem = {
                    id: `row-${Date.now()}`,
                    description: '',
                    nos: 1,
                    length: '',
                    width: '',
                    heightDepth: '',
                    formula: 'LxWxH',
                    remarks: '',
                  };
                  const updated = [...measurementRows];
                  updated.splice(rowContextMenu.rowIndex + 1, 0, newRow);
                  setMeasurementRows(updated);
                  setRowContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Insert Row Below</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const source = measurementRows[rowContextMenu.rowIndex];
                  if (source) {
                    const cloned: MeasurementRowItem = {
                      ...source,
                      id: `row-clone-${Date.now()}`,
                      description: `${source.description} (Copy)`,
                    };
                    const updated = [...measurementRows];
                    updated.splice(rowContextMenu.rowIndex + 1, 0, cloned);
                    setMeasurementRows(updated);
                  }
                  setRowContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2"
              >
                <Copy className="w-3.5 h-3.5 text-amber-400" />
                <span>Duplicate Row</span>
              </button>
              <div className="border-t border-slate-800 my-1" />
              <button
                type="button"
                onClick={() => {
                  handleRemoveMeasurementRow(rowContextMenu.rowIndex);
                  setRowContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Row</span>
              </button>
            </div>
          )}

          {/* GROUP TOTAL row right-aligned */}
          <div className="flex justify-end items-center px-4 py-1.5 text-xs font-bold text-slate-400">
            <span className="tracking-wider uppercase">GROUP TOTAL =</span>
            <span className="text-white font-mono font-bold text-sm ml-4 min-w-[70px] text-right">
              {totalCalculatedQuantity.toFixed(3)}
            </span>
          </div>

          {/* Sub-row action buttons */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <button
              type="button"
              onClick={handleAddMeasurementRow}
              className="px-3 py-1.5 rounded-lg bg-[#141824] hover:bg-[#1a2030] text-slate-200 border border-slate-700/80 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>Add Sub-row</span>
            </button>

            <button
              type="button"
              onClick={handleAddSubheading}
              className="px-3 py-1.5 rounded-lg bg-[#141824] hover:bg-[#1a2030] text-slate-200 border border-slate-700/80 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="font-bold text-[11px] text-purple-400">H3</span>
              <span>Add Sub-heading</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDrawingNoticeOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-[#141824] hover:bg-[#1a2030] text-slate-200 border border-slate-700/80 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Measure from Drawing</span>
            </button>
          </div>

          {/* Live Summary Bar */}
          <div className="p-3 bg-[#080b11] rounded-xl border border-[#1e2433] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs mt-2">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">TOTAL QUANTITY</span>
                <span className="text-base font-bold text-emerald-400 font-mono">
                  {totalCalculatedQuantity} {unit}
                </span>
              </div>
              <div className="h-7 w-px bg-slate-800 hidden sm:block" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">ESTIMATED RATE</span>
                <span className="text-base font-bold text-white font-mono">
                  {formatCurrency(activeRateNum, 'INR')} / {unit}
                </span>
              </div>
              <div className="h-7 w-px bg-slate-800 hidden sm:block" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">TOTAL ITEM AMOUNT</span>
                <span className="text-base font-bold text-blue-400 font-mono">
                  {formatCurrency(totalBoqAmount, 'INR')}
                </span>
              </div>
            </div>

            {/* Live Automated Breakdown Badge */}
            {serverPreview?.impact && (
              <div className="flex items-center gap-2 bg-[#101420] px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400">Automated Resources:</span>
                <span className="text-[11px] font-semibold text-blue-400">
                  Mat: {formatCurrency(serverPreview.impact.totalMaterialCost || 0, 'INR')}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-[11px] font-semibold text-amber-400">
                  Lab: {formatCurrency(serverPreview.impact.totalLabourCost || 0, 'INR')}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-[11px] font-semibold text-purple-400">
                  Mach: {formatCurrency(serverPreview.impact.totalMachineryCost || 0, 'INR')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================================
            FOOTER ACTIONS: Clear Form & Save to Measurement Book
           ====================================================================== */}
        <div className="flex items-center justify-between pt-3 border-t border-[#1e2433]">
          {/* Left: Copy from Existing Item */}
          <button
            type="button"
            onClick={() => setIsCopyModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-[#141824] hover:bg-[#1a2030] text-slate-200 border border-slate-700/80 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Copy from Existing Item</span>
          </button>

          {/* Right: Clear Form and Save */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleClearForm}
              className="px-4 py-2 rounded-lg bg-[#1e2330] hover:bg-[#252c3c] text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Clear Form
            </button>

            <button
              type="button"
              onClick={() => saveToMeasurementBookMutation.mutate()}
              disabled={
                totalCalculatedQuantity <= 0 ||
                (!itemHeading.trim() && !keywordsText.trim() && !sorClauseInput.trim()) ||
                saveToMeasurementBookMutation.isPending
              }
              className="px-5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {saveToMeasurementBookMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Save to Measurement Book</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================================
          SUB-POPUP 2: "Pick SOR for Measurement Book" matching reference screenshot
         ====================================================================== */}
      <PickSorMeasurementBookModal
        isOpen={isSorModalOpen}
        onClose={() => setIsSorModalOpen(false)}
        schedules={allSchedules}
        selectedScheduleId={selectedScheduleId}
        onSelectSchedule={(sor) => handleSwitchSor(sor)}
      />

      {/* ======================================================================
          SUB-POPUP 1: "Pick SOR Clause by Keyword" matching reference screenshot
         ====================================================================== */}
      <PickSorClauseByKeywordModal
        isOpen={isKeywordsModalOpen}
        onClose={() => setIsKeywordsModalOpen(false)}
        initialSearchQuery={keywordClauseSearch || keywordsText || itemHeading || ''}
        onSelectClause={(card) => handleSelectKeywordCard(card)}
        databaseCards={databaseKeywordCards}
        activeSorId={activeSchedule?._id}
        activeSorName={activeSchedule?.sorName || ''}
      />

      {/* ======================================================================
          DYNAMIC SOR CLAUSE SELECTOR MODAL
         ====================================================================== */}
      {isClausePickerOpen && (
        <Modal
          isOpen={isClausePickerOpen}
          onClose={() => setIsClausePickerOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <span>Select SOR Clause ({activeSchedule?.sorName})</span>
            </div>
          }
          maxWidth="4xl"
        >
          <div className="space-y-3.5">
            {/* Clause Search & Category Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-8 relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={clauseSearchTerm}
                  onChange={(e) => setClauseSearchTerm(e.target.value)}
                  placeholder="Search item code (e.g. 14.78, 2.16) or description..."
                  className="w-full pl-9 pr-3 py-2 bg-[#080b11] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="sm:col-span-4">
                <select
                  value={workCategory}
                  onChange={(e) => setWorkCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-[#080b11] border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- All Categories --</option>
                  {availableWorkCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clauses List */}
            <div className="max-h-96 overflow-y-auto space-y-1.5 pr-1">
              {isClausesLoading ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                  Loading clauses...
                </div>
              ) : sorSearchResults.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No clauses found for {activeSchedule?.sorName} matching "{clauseSearchTerm || searchQueryForSor}".
                </div>
              ) : (
                sorSearchResults.map((item) => {
                  const isSelected = selectedSorItem?._id === item._id;
                  return (
                    <div
                      key={item._id}
                      onClick={() => handleSelectSorItem(item)}
                      className={cn(
                        'p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3',
                        isSelected
                          ? 'bg-cyan-950/30 border-cyan-500/60 shadow-md'
                          : 'bg-[#090c13] hover:bg-[#111726] border-slate-800 hover:border-slate-700'
                      )}
                    >
                      <div className="space-y-1 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-cyan-400 font-bold text-xs">
                            {item.itemCode}
                          </span>
                          {item.chapter && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                              {item.chapter}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-200 line-clamp-2">
                          {item.descriptionEnglish}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-emerald-400 text-xs">
                          {formatCurrency(item.rate, 'INR')}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          per {item.unit || 'unit'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setIsClausePickerOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ======================================================================
          DYNAMIC SUBCLAUSE PICKER MODAL
         ====================================================================== */}
      {isSubclausePickerOpen && (
        <Modal
          isOpen={isSubclausePickerOpen}
          onClose={() => setIsSubclausePickerOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" />
              <span>
                Available Subclauses for Clause {selectedSorItem?.itemCode}
              </span>
            </div>
          }
          maxWidth="2xl"
        >
          <div className="space-y-3.5">
            <p className="text-xs text-slate-400">
              Select an applicable subclause specification. The unit and rate will automatically adjust:
            </p>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {isSubclausesLoading ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                  Loading subclauses...
                </div>
              ) : subclausesList.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No child subclauses found for clause {selectedSorItem?.itemCode}.
                </div>
              ) : (
                subclausesList.map((sub) => (
                  <div
                    key={sub._id}
                    onClick={() => handleSelectSubclause(sub)}
                    className="p-3 rounded-xl bg-[#090c13] hover:bg-purple-950/20 border border-slate-800 hover:border-purple-500/40 cursor-pointer flex items-center justify-between transition-all"
                  >
                    <div className="pr-3">
                      <div className="font-mono text-xs font-bold text-purple-400">
                        {sub.itemCode}
                      </div>
                      <div className="text-xs text-slate-200 mt-0.5">
                        {sub.description}
                      </div>
                    </div>
                    <div className="text-right shrink-0 font-mono">
                      <span className="text-xs font-bold text-emerald-400">
                        {formatCurrency(sub.rate, 'INR')}
                      </span>
                      <span className="text-[10px] text-slate-500 block uppercase">
                        per {sub.unit || 'unit'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setIsSubclausePickerOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Direct Excel Paste Modal */}
      {isExcelPasteModalOpen && (
        <Modal
          isOpen={isExcelPasteModalOpen}
          onClose={() => setIsExcelPasteModalOpen(false)}
          title="Paste Directly from Excel (Ctrl+I)"
          maxWidth="lg"
        >
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Copy rows from Excel or Google Sheets and paste here. Columns should match:
              <br />
              <code className="text-blue-400 font-mono">Description | Nos | Length | Width | Height | Remarks</code>
            </p>
            <textarea
              rows={8}
              value={excelPasteText}
              onChange={(e) => setExcelPasteText(e.target.value)}
              placeholder={"Footing F1\t2\t3.5\t2.0\t0.4\tBase pad\nColumn C1\t4\t0.5\t0.5\t3.2\tLift 1"}
              className="w-full p-3 bg-[#080a0f] border border-slate-750 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-blue-500"
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setIsExcelPasteModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleApplyExcelPaste} disabled={!excelPasteText.trim()}>
                Import Measurement Rows
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Copy from Existing Item Modal */}
      {isCopyModalOpen && (
        <Modal
          isOpen={isCopyModalOpen}
          onClose={() => setIsCopyModalOpen(false)}
          title="Copy from Existing Measurement"
          maxWidth="2xl"
        >
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Select an existing measurement from this project to clone its item description, unit, rate, and dimension rows:
            </p>
            <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
              {existingMeasurements.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No existing measurements found in this project.
                </div>
              ) : (
                existingMeasurements.map((m) => {
                  const mTitle = m.entries?.[0]?.description || (m.boqItemId as any)?.description || 'Measurement Item';
                  const mQty = m.totalQuantity || (m as any).quantity || 0;
                  const mUnit = m.entries?.[0]?.unit || 'sqm';
                  return (
                    <div
                      key={m._id}
                      onClick={() => handleApplyCopyFromExisting(m)}
                      className="p-3 rounded-xl bg-[#090c13] hover:bg-blue-600/20 border border-slate-800 hover:border-blue-500/40 cursor-pointer flex items-center justify-between transition-all"
                    >
                      <div className="pr-3 truncate">
                        <div className="text-xs font-bold text-white truncate">{mTitle}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{m.entries?.length || 1} sub-rows</span>
                          <span>•</span>
                          <span>Unit: {mUnit}</span>
                          {m.unitRate ? (
                            <>
                              <span>•</span>
                              <span className="text-emerald-400">{formatCurrency(m.unitRate, 'INR')}</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold font-mono text-cyan-400">
                          {mQty} {mUnit}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex justify-end pt-2 border-t border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setIsCopyModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Manage Formulas Modal */}
      {isManageFormulasModalOpen && (
        <Modal
          isOpen={isManageFormulasModalOpen}
          onClose={() => setIsManageFormulasModalOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-purple-400" />
              <span>Civil Formulas & Custom Expression Manager</span>
            </div>
          }
          maxWidth="4xl"
        >
          <div className="space-y-4 text-xs text-slate-300">
            {/* Quick explanation banner */}
            <div className="p-3 bg-[#0d1322] border border-blue-500/30 rounded-xl flex items-center justify-between gap-3">
              <div>
                <div className="text-white font-bold text-sm">Interactive Quantity Formulas</div>
                <p className="text-slate-400 text-xs">
                  Formulas automate quantity calculations from your dimensions. Type <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-purple-400 font-mono text-[11px]">/</kbd> in any row to invoke.
                </p>
              </div>
              <a
                href="/planning/quantity-master"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1 shrink-0"
              >
                <span>Quantity Master</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* List of Available Formulas by Category */}
            <div className="space-y-2">
              <div className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                Standard Civil Formulas ({allSlashFormulas.length})
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {allSlashFormulas.map((f) => (
                  <div
                    key={f.command}
                    className="p-2.5 rounded-lg bg-[#0b0f19] border border-slate-800 hover:border-slate-700 space-y-1 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-purple-400 text-xs">{f.command}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                        {f.category}
                      </span>
                    </div>
                    <div className="text-white font-medium text-xs">{f.name}</div>
                    <div className="text-slate-400 font-mono text-[11px]">{f.expressionDesc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* + Add Custom Formula */}
            <div className="p-3.5 bg-[#090d16] border border-slate-800 rounded-xl space-y-3">
              <div className="font-bold text-emerald-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                <span>Add Custom Formula</span>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const name = (form.elements.namedItem('formulaName') as HTMLInputElement).value.trim();
                  let code = (form.elements.namedItem('formulaCode') as HTMLInputElement).value.trim();
                  const expr = (form.elements.namedItem('formulaExpr') as HTMLInputElement).value.trim();
                  const cat = (form.elements.namedItem('formulaCategory') as HTMLSelectElement).value as any;

                  if (!name || !expr) {
                    alert('Please provide formula name and mathematical expression');
                    return;
                  }
                  if (!code.startsWith('/')) {
                    code = `/${code}`;
                  }

                  const exprUpper = expr.toUpperCase();
                  const cols: ('NOS' | 'L' | 'B' | 'H')[] = ['NOS'];
                  if (/\b(L|LEN|LENGTH|DIA|RADIUS|R|BASE)\b/.test(exprUpper)) cols.push('L');
                  if (/\b(B|W|WIDTH|BREADTH)\b/.test(exprUpper)) cols.push('B');
                  if (/\b(H|D|DEPTH|HEIGHT|THICK)\b/.test(exprUpper)) cols.push('H');
                  if (cols.length === 1) cols.push('L', 'B', 'H');

                  const newFormula: SlashFormulaDefinition = {
                    command: code.toLowerCase(),
                    name: `${name} = ${expr}`,
                    code: code.toLowerCase(),
                    category: cat || 'CUSTOM',
                    expressionDesc: expr,
                    highlightCols: cols,
                    calculate: ({ nos, l, w, h }) => {
                      const substituted = expr
                        .replace(/\bL\b/gi, String(l))
                        .replace(/\bB\b|\bW\b/gi, String(w))
                        .replace(/\bH\b|\bD\b/gi, String(h))
                        .replace(/\bN\b|\bNOS\b/gi, String(nos));
                      const res = evaluateCellMath(substituted);
                      return res !== 0 ? res : nos * l * w;
                    },
                  };

                  const updated = [...customFormulasList, newFormula];
                  setCustomFormulasList(updated);
                  try {
                    localStorage.setItem('budgetpilot_custom_formulas', JSON.stringify(updated));
                  } catch {
                    // ignore
                  }
                  form.reset();
                  setImportedFormulaNotice(`Added custom formula "${name}" (${code})!`);
                  setTimeout(() => setImportedFormulaNotice(null), 3000);
                }}
                className="grid grid-cols-1 sm:grid-cols-4 gap-2.5"
              >
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Formula Name</label>
                  <input
                    name="formulaName"
                    required
                    placeholder="e.g. Tile Skirting"
                    className="w-full px-2.5 py-1.5 bg-[#0e1422] border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Slash Command</label>
                  <input
                    name="formulaCode"
                    required
                    placeholder="/skirting"
                    className="w-full px-2.5 py-1.5 bg-[#0e1422] border border-slate-700 rounded-lg text-xs text-purple-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Expression (L, B, H, N)</label>
                  <input
                    name="formulaExpr"
                    required
                    placeholder="2 * (L + B) * H"
                    className="w-full px-2.5 py-1.5 bg-[#0e1422] border border-slate-700 rounded-lg text-xs text-emerald-400 font-mono"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  >
                    + Save Formula
                  </button>
                </div>
              </form>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <Button size="sm" onClick={() => setIsManageFormulasModalOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cell Formula Help Modal */}
      {isCellFormulaHelpOpen && (
        <Modal
          isOpen={isCellFormulaHelpOpen}
          onClose={() => setIsCellFormulaHelpOpen(false)}
          title="Measurement Calculation & Formula Guide"
          maxWidth="lg"
        >
          <div className="space-y-3.5 text-xs text-slate-300">
            <div className="p-3 rounded-lg bg-[#0b0e16] border border-slate-800 space-y-2">
              <div className="font-bold text-white text-sm">Interactive Civil Formulas</div>
              <p className="text-slate-400">
                Type <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-purple-400 font-mono">/</kbd> in the Sub-item description or click <strong className="text-purple-300">type / for formula</strong>:
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 bg-[#121724] rounded border border-slate-800">
                  <span className="text-purple-400 font-bold">/area</span>: L × B
                </div>
                <div className="p-2 bg-[#121724] rounded border border-slate-800">
                  <span className="text-purple-400 font-bold">/circarea</span>: π/4 × D²
                </div>
                <div className="p-2 bg-[#121724] rounded border border-slate-800">
                  <span className="text-purple-400 font-bold">/cylarea</span>: π × D × H
                </div>
                <div className="p-2 bg-[#121724] rounded border border-slate-800">
                  <span className="text-purple-400 font-bold">/vol</span>: L × B × H
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#0b0e16] border border-slate-800 space-y-1.5">
              <div className="font-bold text-emerald-400 text-sm">Math in Any Dimension Cell</div>
              <p className="text-slate-400">
                You can type arithmetic expressions directly into Length, Breadth, Height or Nos cells like in Excel:
              </p>
              <ul className="list-disc pl-5 space-y-1 font-mono text-[11px] text-emerald-300">
                <li><code>10.5 + 2.5</code> → auto-evaluates to 13.000</li>
                <li><code>=15 * 2</code> → auto-evaluates to 30.000</li>
                <li><code>100 / 4</code> → auto-evaluates to 25.000</li>
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-[#0b0e16] border border-slate-800 space-y-1.5">
              <div className="font-bold text-blue-400 text-sm">Column Header Dropdowns & Right-Click</div>
              <p className="text-slate-400">
                Click any column header with <span className="text-cyan-400">▾</span> to convert units (Feet → Meters, Inches → Meters) or apply formulas. Right-click any row for quick copy/insert/delete!
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <Button size="sm" onClick={() => setIsCellFormulaHelpOpen(false)}>
                Got it
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Measure from Drawing Notice */}
      {isDrawingNoticeOpen && (
        <Modal
          isOpen={isDrawingNoticeOpen}
          onClose={() => setIsDrawingNoticeOpen(false)}
          title="Measure from Drawing (CAD / PDF)"
          maxWidth="md"
        >
          <div className="space-y-3 text-xs text-slate-300">
            <div className="p-4 rounded-xl bg-[#090c13] border border-slate-800 text-center space-y-2">
              <Maximize2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <div className="font-bold text-white text-sm">Interactive CAD & Blueprint Scale Tool</div>
              <p className="text-slate-400 text-xs">
                To measure lengths or areas directly from your uploaded architectural floor plans or drawings, visit the Drawings viewer and click the calibrate & measure tool.
              </p>
            </div>
            <div className="flex justify-end pt-2 border-t border-slate-800">
              <Button size="sm" onClick={() => setIsDrawingNoticeOpen(false)}>
                Understood
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
};
