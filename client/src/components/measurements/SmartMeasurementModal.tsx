import React, { useState, useEffect, useMemo } from 'react';
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
  Tag,
  Check,
  Building2,
  BookOpen,
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

interface SmartMeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: () => void;
  editingMeasurement?: Measurement | null;
  initialBoqItem?: BoqItem | null;
}

interface MeasurementRowItem {
  id: string;
  isSubheading?: boolean;
  description: string;
  nos: number | '';
  length: number | '';
  width: number | '';
  heightDepth: number | '';
  formula: string;
  remarks: string;
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

  // Selection Modals State
  const [isSorModalOpen, setIsSorModalOpen] = useState(false);
  const [sorSearchTerm, setSorSearchTerm] = useState('');
  const [isKeywordsModalOpen, setIsKeywordsModalOpen] = useState(false);
  const [keywordSearchTerm, setKeywordSearchTerm] = useState('');
  const [isClausePickerOpen, setIsClausePickerOpen] = useState(false);
  const [clauseSearchTerm, setClauseSearchTerm] = useState('');
  const [isSubclausePickerOpen, setIsSubclausePickerOpen] = useState(false);

  // Aux Modals
  const [isExcelPasteModalOpen, setIsExcelPasteModalOpen] = useState(false);
  const [excelPasteText, setExcelPasteText] = useState('');
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [isCellFormulaHelpOpen, setIsCellFormulaHelpOpen] = useState(false);
  const [isDrawingNoticeOpen, setIsDrawingNoticeOpen] = useState(false);

  // 1. Fetch Dynamic Schedule Hierarchy from Master Database (ONLY uploaded/imported SORs)
  const { data: scheduleList = [], isLoading: isSchedulesLoading } = useQuery<ScheduleHierarchyItem[]>({
    queryKey: ['scheduleHierarchy'],
    queryFn: async () => {
      const res = await api.get('/sor/schedules/hierarchy');
      return Array.isArray(res.data?.data) ? res.data.data : [];
    },
    enabled: isOpen,
  });

  // Filtered SORs for Modal
  const filteredScheduleList = useMemo(() => {
    if (!sorSearchTerm.trim()) return scheduleList;
    const q = sorSearchTerm.toLowerCase();
    return scheduleList.filter(
      (s) =>
        s.sorName?.toLowerCase().includes(q) ||
        s.authority?.toLowerCase().includes(q) ||
        s.version?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q)
    );
  }, [scheduleList, sorSearchTerm]);

  // Current Active Schedule
  const activeSchedule = useMemo(() => {
    return scheduleList.find((s) => s._id === selectedScheduleId) || scheduleList[0] || null;
  }, [scheduleList, selectedScheduleId]);

  // Auto-select first schedule on initial load if none set
  useEffect(() => {
    if (scheduleList.length > 0 && !selectedScheduleId) {
      setSelectedScheduleId(scheduleList[0]._id);
    }
  }, [scheduleList, selectedScheduleId]);

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

  // Import Formula from Quantity Master
  const handleImportFormula = (formula: any) => {
    setSelectedFormulaId(formula._id);
    if (formula.unit) setUnit(formula.unit);
    if (formula.category && !workCategory) setWorkCategory(formula.category);

    if (slashTarget === 'HEADING') {
      const queryPart = `/${slashQuery}`;
      if (itemHeading.includes(queryPart)) {
        setItemHeading(itemHeading.replace(queryPart, formula.name));
      } else if (!itemHeading.trim()) {
        setItemHeading(formula.name);
      } else {
        setItemHeading(`${itemHeading} (${formula.name})`);
      }
    } else if (slashTarget === 'ROW') {
      const rows = [...measurementRows];
      const targetRow = rows[activeRowIndexForSlash];
      if (targetRow) {
        const queryPart = `/${slashQuery}`;
        if (targetRow.description.includes(queryPart)) {
          targetRow.description = targetRow.description.replace(queryPart, formula.name);
        } else if (!targetRow.description.trim()) {
          targetRow.description = formula.name;
        } else {
          targetRow.description = `${targetRow.description} - ${formula.name}`;
        }
        targetRow.formula = formula.code || 'LxWxH';
        setMeasurementRows(rows);
      }
    }

    setIsSlashMenuOpen(false);
    setSlashQuery('');
    setImportedFormulaNotice(`✨ Linked Quantity Master formula: "${formula.name}"`);
    setTimeout(() => setImportedFormulaNotice(null), 3500);
  };

  // Monitor text input for slash commands (/)
  const handleTextChangeForSlash = (
    text: string,
    target: 'HEADING' | 'ROW',
    rowIndex: number = 0,
    cursorPos?: number
  ) => {
    if (target === 'HEADING') {
      if (activeInputTab === 'KEYWORDS') {
        setKeywordsText(text);
      } else {
        setItemHeading(text);
      }
    }

    const slashIdx = text.lastIndexOf('/');
    if (slashIdx !== -1 && (cursorPos === undefined || cursorPos > slashIdx)) {
      const afterSlash = text.slice(slashIdx + 1).split(/\s/)[0];
      setSlashQuery(afterSlash);
      setSlashTarget(target);
      setActiveRowIndexForSlash(rowIndex);
      setIsSlashMenuOpen(true);
    } else {
      setIsSlashMenuOpen(false);
    }
  };

  // Filter Quantity Master formulas by slash query
  const filteredQmFormulas = useMemo(() => {
    if (!Array.isArray(qmFormulas)) return [];
    if (!slashQuery.trim()) return qmFormulas.slice(0, 15);
    const q = slashQuery.toLowerCase();
    return qmFormulas
      .filter(
        (f: any) =>
          f?.name?.toLowerCase().includes(q) ||
          f?.code?.toLowerCase().includes(q) ||
          f?.category?.toLowerCase().includes(q)
      )
      .slice(0, 15);
  }, [qmFormulas, slashQuery]);

  // Selected formula object
  const activeFormulaDoc = useMemo(() => {
    if (!Array.isArray(qmFormulas)) return null;
    return qmFormulas.find((f: any) => f?._id === selectedFormulaId) || null;
  }, [qmFormulas, selectedFormulaId]);

  // Calculate Row Quantities
  const calculatedRows = useMemo(() => {
    return measurementRows.map((row) => {
      if (row.isSubheading) {
        return {
          ...row,
          calculatedQuantity: 0,
        };
      }

      const nos = typeof row.nos === 'number' && row.nos > 0 ? row.nos : 1;
      const l = typeof row.length === 'number' ? row.length : 0;
      const w = typeof row.width === 'number' ? row.width : 0;
      const h = typeof row.heightDepth === 'number' ? row.heightDepth : 0;

      let qty = 0;
      if (l > 0 && w > 0 && h > 0) {
        qty = nos * l * w * h;
      } else if (l > 0 && w > 0) {
        qty = nos * l * w;
      } else if (l > 0) {
        qty = nos * l;
      } else {
        qty = typeof row.nos === 'number' && row.nos > 0 ? row.nos : 0;
      }

      return {
        ...row,
        calculatedQuantity: Number(qty.toFixed(3)),
      };
    });
  }, [measurementRows]);

  // Grand Total Quantity
  const totalCalculatedQuantity = useMemo(() => {
    const sum = calculatedRows.reduce((acc, r) => acc + (r.calculatedQuantity || 0), 0);
    return Number(sum.toFixed(3));
  }, [calculatedRows]);

  const activeRateNum = typeof rate === 'number' && rate >= 0 ? rate : 0;
  const totalBoqAmount = Number((totalCalculatedQuantity * activeRateNum).toFixed(2));

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
          .map((r) => ({
            description: r.description.trim() || activeTitle,
            nos: typeof r.nos === 'number' ? r.nos : 1,
            length: typeof r.length === 'number' ? r.length : 0,
            width: typeof r.width === 'number' ? r.width : 0,
            breadth: typeof r.width === 'number' ? r.width : 0,
            height: typeof r.heightDepth === 'number' ? r.heightDepth : 0,
            heightDepth: typeof r.heightDepth === 'number' ? r.heightDepth : 0,
            remarks: r.remarks.trim(),
            formula: r.formula || 'LxWxH',
          })),
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
          {/* Top Tabs */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveInputTab('KEYWORDS');
                  setIsKeywordsModalOpen(true);
                }}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border',
                  activeInputTab === 'KEYWORDS'
                    ? 'border-blue-500/60 bg-blue-600/20 text-blue-300 shadow-sm'
                    : 'border-slate-700 bg-[#161d2b] text-slate-300 hover:text-white'
                )}
              >
                <span>💡 Keywords</span>
                {selectedKeywords.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-blue-500 text-white text-[10px] font-bold">
                    {selectedKeywords.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveInputTab('ITEM_HEADING')}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border',
                  activeInputTab === 'ITEM_HEADING'
                    ? 'border-blue-500/60 bg-blue-600/20 text-blue-300 shadow-sm'
                    : 'border-slate-700 bg-[#161d2b] text-slate-300 hover:text-white'
                )}
              >
                <span>ITEM HEADING</span>
              </button>
            </div>

            {/* Hint for Slash Command */}
            <div className="flex items-center gap-1.5 text-[11px] text-blue-400/90 font-medium">
              <Code2 className="w-3.5 h-3.5" />
              <span>
                Type <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-white font-mono border border-slate-700">/</kbd> to import Quantity Master formula
              </span>
            </div>
          </div>

          {/* Active Selected Keyword Chips Bar */}
          {selectedKeywords.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap p-2 bg-[#080b11] border border-[#1e2433] rounded-lg">
              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                <Tag className="w-3 h-3 text-blue-400" />
                Active Keywords:
              </span>
              {selectedKeywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/40"
                >
                  <span>{kw}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(kw)}
                    className="hover:text-white cursor-pointer ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => setIsKeywordsModalOpen(true)}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer underline ml-1"
              >
                + Manage Keywords
              </button>
            </div>
          )}

          {/* Text Area */}
          <div className="relative">
            <textarea
              rows={2}
              value={activeInputTab === 'ITEM_HEADING' ? itemHeading : keywordsText}
              onChange={(e) =>
                handleTextChangeForSlash(
                  e.target.value,
                  'HEADING',
                  0,
                  e.target.selectionStart
                )
              }
              placeholder={
                activeInputTab === 'ITEM_HEADING'
                  ? 'e.g. Cleaning of under ground sump, Over Head R.C.C. Tank (type / for formulas)...'
                  : 'Search keywords e.g. excavation, concrete, plaster, RCC (or click Keywords tab above)...'
              }
              className="w-full px-3.5 py-2.5 bg-[#080b11] border border-[#1e2536] border-l-4 border-l-blue-500 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 resize-none font-medium placeholder:text-slate-500"
            />

            {/* Slash Command Floating Popover Menu */}
            {isSlashMenuOpen && (
              <div className="absolute left-0 top-full mt-1 z-50 w-full max-w-md bg-[#11141f] border border-blue-500/50 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md animate-in fade-in zoom-in-95">
                <div className="p-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Quantity Master Formulas {slashQuery && `matching "/${slashQuery}"`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSlashMenuOpen(false)}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-800/60 p-1">
                  {filteredQmFormulas.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No matching formulas found in Quantity Master.
                    </div>
                  ) : (
                    filteredQmFormulas.map((formula: any) => (
                      <button
                        key={formula._id}
                        type="button"
                        onClick={() => handleImportFormula(formula)}
                        className="w-full text-left p-2 rounded-lg hover:bg-blue-600/20 transition-all flex flex-col gap-1 cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white group-hover:text-blue-300">
                            {formula.name}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                            {formula.code}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span>Unit: <strong className="text-slate-200">{formula.unit}</strong></span>
                          <span>•</span>
                          <span>Category: <strong className="text-slate-200">{formula.category || 'Standard'}</strong></span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Instant SOR Auto-Suggestions dropdown if searching */}
          {sorSearchResults.length > 0 && !selectedSorItem && (
            <div className="bg-[#090c13] border border-[#1e2536] rounded-xl p-2.5 space-y-1.5 animate-in fade-in">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center justify-between">
                <span>Matching Clauses in {activeSchedule?.sorName || 'Selected SOR'} ({sorSearchResults.length})</span>
                <button
                  type="button"
                  onClick={() => setIsClausePickerOpen(true)}
                  className="text-blue-400 hover:text-blue-300 font-normal lowercase cursor-pointer"
                >
                  view all
                </button>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1">
                {sorSearchResults.slice(0, 5).map((item) => (
                  <div
                    key={item._id}
                    onClick={() => handleSelectSorItem(item)}
                    className="p-2 rounded-lg bg-[#111622] hover:bg-blue-600/20 border border-slate-800 hover:border-blue-500/40 cursor-pointer flex items-center justify-between text-xs transition-all"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="font-mono text-cyan-400 font-bold shrink-0">{item.itemCode}</span>
                      <span className="text-slate-200 truncate">{item.descriptionEnglish}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 font-medium">
                      <span className="text-slate-400">{item.unit}</span>
                      <span className="text-emerald-400 font-bold">{formatCurrency(item.rate, 'INR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
              className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-md bg-[#0e2a22] text-[#34d399] border border-emerald-500/40 hover:bg-[#143d31] transition-all cursor-pointer tracking-wide"
              title="Click to switch or select active Schedule of Rates (SOR)"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {activeSchedule
                  ? `${activeSchedule.sorName} (${activeSchedule.authority})`
                  : 'Select SOR Schedule'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
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
                    setImportedFormulaNotice(`Linked formula "${f.name}" for automated BOM calculations.`);
                    setTimeout(() => setImportedFormulaNotice(null), 3000);
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

              <a
                href="/planning/quantity-master"
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Manage Formulas</span>
              </a>

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
          <div className="overflow-x-auto rounded-lg border border-[#1e2433] bg-[#090c13]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#0b0e16] text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-[#1e2433]">
                <tr>
                  <th className="py-2 px-2 w-10 text-center">#</th>
                  <th className="py-2 px-3 min-w-[260px]">SUB-ITEM NAME</th>
                  <th className="py-2 px-2 w-24 text-center text-[#22D3EE]">NOS ▾</th>
                  <th className="py-2 px-2 w-28 text-center text-[#34D399]">LENGTH (M) ▾</th>
                  <th className="py-2 px-2 w-28 text-center text-[#FBBF24]">BREADTH (M) ▾</th>
                  <th className="py-2 px-2 w-28 text-center text-[#A78BFA]">H/DEPTH (M) ▾</th>
                  <th className="py-2 px-2 w-28 text-center text-[#60A5FA]">QTY ▾</th>
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

                  return (
                    <tr key={row.id} className="hover:bg-[#121622]/60 group transition-colors">
                      {/* # and drag handle */}
                      <td className="py-2 px-2 text-center text-slate-500 font-mono text-[11px] align-top pt-3">
                        <div className="flex items-center justify-center gap-1">
                          <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 cursor-grab" />
                          <span>{idx + 1}</span>
                        </div>
                      </td>

                      {/* SUB-ITEM NAME */}
                      <td className="py-2 px-2 align-top">
                        <div className="space-y-1.5">
                          <input
                            type="text"
                            value={row.description}
                            onChange={(e) => {
                              const val = e.target.value;
                              const rows = [...measurementRows];
                              rows[idx].description = val;
                              setMeasurementRows(rows);
                              handleTextChangeForSlash(val, 'ROW', idx, e.target.selectionStart || 0);
                            }}
                            placeholder="e.g. Bedroom X -> or type @ to pick a saved item"
                            className="w-full px-3 py-1.5 bg-[#080b11] border border-[#1e2536] focus:border-blue-500 rounded-lg text-xs text-white focus:outline-none transition-colors"
                          />
                          <div
                            onClick={() => {
                              setActiveRowIndexForSlash(idx);
                              setSlashTarget('ROW');
                              setSlashQuery('');
                              setIsSlashMenuOpen(true);
                            }}
                            className="px-2 py-0.5 bg-[#0a0d15] border border-purple-500/30 rounded text-[10px] text-purple-400 font-mono flex items-center justify-between cursor-pointer hover:border-purple-500/60 transition-colors w-fit"
                          >
                            <span>type / for formula</span>
                            {row.formula && row.formula !== 'LxWxH' && (
                              <span className="ml-2 font-bold text-blue-400">[{row.formula}]</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* NOS */}
                      <td className="py-2 px-1.5 align-top">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={row.nos}
                          onChange={(e) => {
                            const rows = [...measurementRows];
                            rows[idx].nos = e.target.value === '' ? '' : parseFloat(e.target.value);
                            setMeasurementRows(rows);
                          }}
                          placeholder="N1"
                          className="w-full px-2 py-1.5 bg-[#080b11] border border-[#1e2536] focus:border-cyan-400 rounded-lg text-xs text-white text-center focus:outline-none font-mono font-medium"
                        />
                      </td>

                      {/* LENGTH (M) */}
                      <td className="py-2 px-1.5 align-top">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={row.length}
                          onChange={(e) => {
                            const rows = [...measurementRows];
                            rows[idx].length = e.target.value === '' ? '' : parseFloat(e.target.value);
                            setMeasurementRows(rows);
                          }}
                          placeholder="L1"
                          className="w-full px-2 py-1.5 bg-[#080b11] border border-[#1e2536] border-l-2 border-l-emerald-400 focus:border-emerald-400 rounded-lg text-xs text-white text-center focus:outline-none font-mono font-medium"
                        />
                      </td>

                      {/* BREADTH (M) */}
                      <td className="py-2 px-1.5 align-top">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={row.width}
                          onChange={(e) => {
                            const rows = [...measurementRows];
                            rows[idx].width = e.target.value === '' ? '' : parseFloat(e.target.value);
                            setMeasurementRows(rows);
                          }}
                          placeholder="B1"
                          className="w-full px-2 py-1.5 bg-[#080b11] border border-[#1e2536] border-l-2 border-l-amber-400 focus:border-amber-400 rounded-lg text-xs text-white text-center focus:outline-none font-mono font-medium"
                        />
                      </td>

                      {/* H/DEPTH (M) */}
                      <td className="py-2 px-1.5 align-top">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={row.heightDepth}
                          onChange={(e) => {
                            const rows = [...measurementRows];
                            rows[idx].heightDepth = e.target.value === '' ? '' : parseFloat(e.target.value);
                            setMeasurementRows(rows);
                          }}
                          placeholder="H1"
                          className="w-full px-2 py-1.5 bg-[#080b11] border border-[#1e2536] border-l-2 border-l-purple-400 focus:border-purple-400 rounded-lg text-xs text-white text-center focus:outline-none font-mono font-medium"
                        />
                      </td>

                      {/* QTY */}
                      <td className="py-2 px-1.5 align-top">
                        <div className="w-full px-2 py-1.5 bg-[#080b11] border border-blue-500/60 rounded-lg text-xs text-blue-300 font-bold font-mono text-center">
                          {typeof row.calculatedQuantity === 'number' && row.calculatedQuantity > 0
                            ? row.calculatedQuantity.toFixed(3)
                            : 'Q1'}
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
                          className="text-red-500/80 hover:text-red-400 hover:bg-red-500/10 p-1 rounded transition-colors"
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
          DYNAMIC SOR SELECTION MODAL (Zero Hardcoding)
         ====================================================================== */}
      {isSorModalOpen && (
        <Modal
          isOpen={isSorModalOpen}
          onClose={() => setIsSorModalOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              <span>Select Schedule of Rates (SOR)</span>
            </div>
          }
          maxWidth="2xl"
        >
          <div className="space-y-3.5">
            <p className="text-xs text-slate-400">
              Choose an active Schedule of Rates from the database. All clauses, subclauses, categories, and rates will update dynamically:
            </p>

            {/* Search filter */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={sorSearchTerm}
                onChange={(e) => setSorSearchTerm(e.target.value)}
                placeholder="Search by schedule name, authority (CPWD, State PWD), version..."
                className="w-full pl-9 pr-3 py-2 bg-[#080b11] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* SOR List */}
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {isSchedulesLoading ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                  Loading uploaded SOR schedules...
                </div>
              ) : filteredScheduleList.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No imported SOR schedules found in database matching "{sorSearchTerm}".
                </div>
              ) : (
                filteredScheduleList.map((sor) => {
                  const isSelected = sor._id === selectedScheduleId;
                  return (
                    <div
                      key={sor._id}
                      onClick={() => handleSwitchSor(sor)}
                      className={cn(
                        'p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between',
                        isSelected
                          ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg shadow-emerald-950/50'
                          : 'bg-[#0a0d15] hover:bg-[#111724] border-slate-800 hover:border-slate-700'
                      )}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white tracking-wide">
                            {sor.sorName}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                            {sor.authority} {sor.version}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-3">
                          <span>Department: <strong className="text-slate-300">{sor.department || 'Civil'}</strong></span>
                          <span>•</span>
                          <span>Category: <strong className="text-slate-300">{sor.category || 'Standard'}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right font-mono">
                          <span className="text-xs font-bold text-emerald-400">
                            {sor.itemCount ? sor.itemCount.toLocaleString() : 0}
                          </span>
                          <span className="text-[10px] text-slate-500 block uppercase">items</span>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setIsSorModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ======================================================================
          DYNAMIC KEYWORDS MULTI-SELECTOR MODAL
         ====================================================================== */}
      {isKeywordsModalOpen && (
        <Modal
          isOpen={isKeywordsModalOpen}
          onClose={() => setIsKeywordsModalOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-blue-400" />
              <span>Select Construction Keywords</span>
            </div>
          }
          maxWidth="2xl"
        >
          <div className="space-y-3.5">
            <p className="text-xs text-slate-400">
              Select keywords derived dynamically from the database for <strong>{activeSchedule?.sorName}</strong> to filter matching clauses and auto-complete headings:
            </p>

            {/* Keyword Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={keywordSearchTerm}
                onChange={(e) => setKeywordSearchTerm(e.target.value)}
                placeholder="Search keywords (e.g. concrete, excavation, shuttering, beam)..."
                className="w-full pl-9 pr-3 py-2 bg-[#080b11] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Selected Chips */}
            {selectedKeywords.length > 0 && (
              <div className="p-2.5 bg-[#090c13] border border-blue-500/30 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Selected Keywords ({selectedKeywords.length}):</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedKeywords([]);
                      setKeywordsText('');
                    }}
                    className="text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {selectedKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-md bg-blue-600 text-white font-medium"
                    >
                      <span>{kw}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(kw)}
                        className="hover:text-blue-200 cursor-pointer ml-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Available Keywords Grid */}
            <div className="max-h-72 overflow-y-auto p-1 pr-2">
              {isKeywordsLoading ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                  Loading keywords from database...
                </div>
              ) : availableKeywords.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No keywords found matching "{keywordSearchTerm}".
                </div>
              ) : (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {availableKeywords.map((k) => {
                    const isSelected = selectedKeywords.includes(k.label);
                    return (
                      <button
                        key={k.label}
                        type="button"
                        onClick={() => handleToggleKeyword(k.label)}
                        className={cn(
                          'px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer border',
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                            : 'bg-[#10141f] hover:bg-[#161c2b] text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
                        )}
                      >
                        <span>{k.label}</span>
                        {k.count > 1 && (
                          <span
                            className={cn(
                              'text-[10px] px-1.5 py-0.2 rounded-full font-mono',
                              isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-800 text-slate-400'
                            )}
                          >
                            {k.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-500">
                {selectedKeywords.length} selected
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsKeywordsModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setIsKeywordsModalOpen(false);
                    if (selectedKeywords.length > 0) {
                      setKeywordsText(selectedKeywords.join(', '));
                    }
                  }}
                >
                  Apply Keywords
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

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

      {/* Cell Formula Help Modal */}
      {isCellFormulaHelpOpen && (
        <Modal
          isOpen={isCellFormulaHelpOpen}
          onClose={() => setIsCellFormulaHelpOpen(false)}
          title="Measurement Calculation & Formula Guide"
          maxWidth="lg"
        >
          <div className="space-y-3.5 text-xs text-slate-300">
            <div className="p-3 rounded-lg bg-[#0b0e16] border border-slate-800 space-y-1.5">
              <div className="font-bold text-white text-sm">Standard Formulas</div>
              <p className="text-slate-400">
                The spreadsheet table automatically computes quantities based on your input dimensions:
              </p>
              <ul className="list-disc pl-5 space-y-1 font-mono text-[11px] text-emerald-400">
                <li>Volume: Nos × Length × Breadth × Height/Depth</li>
                <li>Area: Nos × Length × Breadth</li>
                <li>Length / Linear: Nos × Length</li>
                <li>Count: Nos</li>
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-[#0b0e16] border border-slate-800 space-y-1.5">
              <div className="font-bold text-blue-400 text-sm">Slash (/) Commands</div>
              <p className="text-slate-400">
                Type <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-white font-mono border border-slate-700">/</kbd> in the Item Heading or any Sub-item row to search and import formulas directly from Quantity Master.
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
