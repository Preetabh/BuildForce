import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Search,
  Sparkles,
  AlertTriangle,
  Layers,
  Ruler,
  Package,
  Users2,
  Truck,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  X,
  FileSpreadsheet,
  Info,
  Scale,
  Calculator,
  RefreshCw,
} from 'lucide-react';
import api from '../../services/api';
import {
  SorItem,
  ScheduleHierarchyItem,
  Measurement,
  BoqItem,
  MeasurementFormula,
  RateAnalysisComponent,
} from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formatCurrency } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import { UnitDimensionEngine } from '../../utils/unitEngine';

interface SmartMeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: () => void;
  editingMeasurement?: Measurement | null;
  initialBoqItem?: BoqItem | null;
}

const QUICK_KEYWORDS = [
  'RCC footing',
  'PCC',
  'Brick masonry',
  'Earthwork excavation',
  'Plaster',
  'Flooring',
  'Reinforcement',
  'Concrete',
];

const REBAR_DIAMETERS = [
  { dia: 8, weightPerMeter: 0.395 },
  { dia: 10, weightPerMeter: 0.617 },
  { dia: 12, weightPerMeter: 0.888 },
  { dia: 16, weightPerMeter: 1.58 },
  { dia: 20, weightPerMeter: 2.47 },
  { dia: 25, weightPerMeter: 3.85 },
  { dia: 32, weightPerMeter: 6.31 },
];

export const SmartMeasurementModal: React.FC<SmartMeasurementModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onSuccess,
  editingMeasurement,
  initialBoqItem,
}) => {
  // Step State (1: Schedule -> 2: Search -> 3: Selected Item -> 4: Measurement -> 5: Impact Preview)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form states
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSorItem, setSelectedSorItem] = useState<SorItem | null>(null);

  // Measurement dimensions
  const [mbDescription, setMbDescription] = useState<string>('');
  const [mbLocation, setMbLocation] = useState<string>('');
  const [mbLevel, setMbLevel] = useState<string>('');
  const [mbFormula, setMbFormula] = useState<MeasurementFormula | string>('LxWxH');
  const [mbNos, setMbNos] = useState<number | ''>(1);
  const [mbLength, setMbLength] = useState<number | ''>('');
  const [mbWidth, setMbWidth] = useState<number | ''>('');
  const [mbDepth, setMbDepth] = useState<number | ''>('');
  const [mbHeight, setMbHeight] = useState<number | ''>('');
  const [mbThickness, setMbThickness] = useState<number | ''>('');
  const [mbWeight, setMbWeight] = useState<number | ''>('');
  const [mbUnitWeight, setMbUnitWeight] = useState<number | ''>('');
  const [mbSelectedRebarDia, setMbSelectedRebarDia] = useState<number | ''>('');
  const [mbCustomRate, setMbCustomRate] = useState<number | ''>('');
  const [mbRemarks, setMbRemarks] = useState<string>('');

  // 1. Fetch Dynamic Schedule Hierarchy from Master Database
  const {
    data: scheduleList = [],
    isLoading: isLoadingSchedules,
    isError: isScheduleError,
    refetch: refetchSchedules,
  } = useQuery<ScheduleHierarchyItem[]>({
    queryKey: ['scheduleHierarchy'],
    queryFn: async () => {
      const res = await api.get('/sor/schedules/hierarchy');
      return res.data?.data || [];
    },
    enabled: isOpen,
  });

  // Selected schedule object
  const selectedSchedule = useMemo(() => {
    return scheduleList.find((s) => s._id === selectedScheduleId) || scheduleList[0] || null;
  }, [scheduleList, selectedScheduleId]);

  // Set default schedule once loaded (prioritize schedule with largest item count)
  useEffect(() => {
    if (scheduleList.length > 0 && !selectedScheduleId) {
      setSelectedScheduleId(scheduleList[0]._id);
    }
  }, [scheduleList, selectedScheduleId]);

  // 2. Fetch Smart SOR Items
  const { data: smartSearchData, isFetching: isSearching } = useQuery<{ items: SorItem[] }>({
    queryKey: ['smartSorSearch', selectedScheduleId, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedScheduleId) params.append('sorId', selectedScheduleId);
      if (searchQuery) params.append('search', searchQuery);
      params.append('limit', '30');

      const res = await api.get(`/sor/items/smart-search?${params.toString()}`);
      return { items: res.data?.data || [] };
    },
    enabled: isOpen && (currentStep === 2 || currentStep === 1 || !!searchQuery),
  });

  const searchedItems = smartSearchData?.items || [];

  // Reset or initialize on modal open/editing state change
  useEffect(() => {
    if (!isOpen) return;

    if (editingMeasurement) {
      const entry = editingMeasurement.entries[0] || {};
      const boqItem = editingMeasurement.boqItemId;
      setMbDescription(entry.description || '');
      setMbLocation(entry.location || '');
      setMbLevel(entry.levelFloor || '');
      setMbFormula(entry.formula || 'LxWxH');
      setMbNos(entry.nos || 1);
      setMbLength(entry.length || '');
      setMbWidth(entry.width || '');
      setMbDepth(entry.depth || '');
      setMbHeight(entry.height || entry.heightDepth || '');
      setMbThickness(entry.thickness || '');
      setMbWeight(entry.weight || '');
      setMbUnitWeight(entry.unitWeight || '');
      setMbCustomRate(editingMeasurement.unitRate || (boqItem ? boqItem.rate : ''));
      setMbRemarks(entry.remarks || '');

      if (editingMeasurement.sorItemId && typeof editingMeasurement.sorItemId === 'object') {
        setSelectedSorItem(editingMeasurement.sorItemId as SorItem);
      }
      setCurrentStep(4);
    } else if (initialBoqItem) {
      setMbDescription(initialBoqItem.description);
      setMbCustomRate(initialBoqItem.rate);
      // Auto deduce formula matching the BOQ item's configured unit
      const dim = UnitDimensionEngine.getPhysicalDimension(initialBoqItem.unit);
      if (dim === 'AREA') setMbFormula('LxW');
      else if (dim === 'WEIGHT') setMbFormula('Weight');
      else if (dim === 'COUNT') setMbFormula('Count');
      else if (dim === 'LENGTH') setMbFormula('Length');
      else setMbFormula('LxWxH');
      setCurrentStep(4);
    } else {
      // Clean create mode
      setCurrentStep(1);
      setSelectedSorItem(null);
      setSearchQuery('');
      setMbDescription('');
      setMbLocation('');
      setMbLevel('');
      setMbFormula('LxWxH');
      setMbNos(1);
      setMbLength('');
      setMbWidth('');
      setMbDepth('');
      setMbHeight('');
      setMbThickness('');
      setMbWeight('');
      setMbUnitWeight('');
      setMbSelectedRebarDia('');
      setMbCustomRate('');
      setMbRemarks('');
    }
  }, [isOpen, editingMeasurement, initialBoqItem]);

  // When an item is selected, configure formula and default fields
  const handleSelectItem = (item: SorItem) => {
    setSelectedSorItem(item);
    setMbDescription(item.descriptionEnglish);
    setMbCustomRate(item.rate);
    
    // Choose formula dimensionally matching the item
    let form = item.measurementFormula;
    if (!form) {
      const dim = UnitDimensionEngine.getPhysicalDimension(item.unit);
      if (dim === 'AREA') form = 'LxW';
      else if (dim === 'WEIGHT') form = 'Weight';
      else if (dim === 'COUNT') form = 'Count';
      else if (dim === 'LENGTH') form = 'Length';
      else form = 'LxWxH';
    }
    setMbFormula(form);

    // If steel/reinforcement, auto detect dia if in description
    if (form === 'Weight' || item.workCategory?.includes('Steel')) {
      const match = item.descriptionEnglish.match(/(\d+)\s*mm/i);
      if (match) {
        const dia = parseInt(match[1], 10);
        const standard = REBAR_DIAMETERS.find((r) => r.dia === dia);
        if (standard) {
          setMbSelectedRebarDia(dia);
          setMbUnitWeight(standard.weightPerMeter);
        }
      }
    }
    setCurrentStep(4);
  };

  // Rebar diameter selection change
  const handleRebarDiaChange = (diaVal: number | '') => {
    setMbSelectedRebarDia(diaVal);
    if (diaVal) {
      const found = REBAR_DIAMETERS.find((r) => r.dia === diaVal);
      if (found) {
        setMbUnitWeight(found.weightPerMeter);
      }
    }
  };

  // Strict Dimensional Validation
  const rawItemUnit = selectedSorItem?.unit || initialBoqItem?.unit || '';
  const itemCode = selectedSorItem?.itemCode || initialBoqItem?.itemCode || '';
  const dimensionalValidation = useMemo(() => {
    return UnitDimensionEngine.validateDimensionalCompatibility(mbFormula, rawItemUnit, itemCode);
  }, [mbFormula, rawItemUnit, itemCode]);

  // Canonical unit for display
  const canonicalUnit = dimensionalValidation.canonicalUnit || UnitDimensionEngine.getCanonicalUnit(rawItemUnit, mbFormula);

  // Live Quantity Calculation Engine (runs on keystroke)
  const { calculatedQuantity, formulaExpression } = useMemo(() => {
    const nos = typeof mbNos === 'number' && mbNos > 0 ? mbNos : 1;
    const l = typeof mbLength === 'number' ? mbLength : 0;
    const w = typeof mbWidth === 'number' ? mbWidth : 0;
    const h = typeof mbHeight === 'number' ? mbHeight : (typeof mbDepth === 'number' ? mbDepth : 0);
    const thk = typeof mbThickness === 'number' ? mbThickness : 0;
    const wt = typeof mbWeight === 'number' ? mbWeight : 0;
    const uWt = typeof mbUnitWeight === 'number' ? mbUnitWeight : 0;

    const form = (mbFormula || 'LxWxH').toUpperCase();
    const expDim = UnitDimensionEngine.getExpectedDimensionForFormula(form);

    let qty = 0;
    let expr = '';

    if (
      form.includes('LXWXD') ||
      form === 'LXWXD' ||
      form === 'LXWXH' ||
      form === 'VOLUME' ||
      expDim === 'VOLUME'
    ) {
      // 3D Volume -> Evaluates to m³ (or cum)
      const depthVal = h > 0 ? h : (thk > 0 ? thk : 1);
      qty = nos * (l || 0) * (w || 0) * depthVal;
      expr = `${nos > 1 ? nos + ' × ' : ''}${l}m × ${w}m × ${depthVal}m`;
    } else if (
      form.includes('LXW') ||
      form.includes('LXH') ||
      form === 'AREA' ||
      expDim === 'AREA'
    ) {
      // 2D Area -> Evaluates to m² (or sqm)
      const dim2 = w > 0 ? w : (h > 0 ? h : 1);
      qty = nos * (l || 0) * dim2;
      expr = `${nos > 1 ? nos + ' × ' : ''}${l}m × ${dim2}m`;
    } else if (form === 'WEIGHT' || form.includes('STEEL') || expDim === 'WEIGHT') {
      // Weight (kg or tonne)
      if (uWt > 0) {
        qty = nos * (l || 1) * uWt;
        expr = `${nos} nos × ${l}m × ${uWt} kg/m`;
      } else if (wt > 0) {
        qty = nos * wt;
        expr = `${nos > 1 ? nos + ' × ' : ''}${wt} ${canonicalUnit}`;
      } else {
        qty = nos * (l || 1);
        expr = `${nos > 1 ? nos + ' × ' : ''}${l} ${canonicalUnit}`;
      }
    } else if (form === 'COUNT' || form === 'NOSXQTY' || expDim === 'COUNT') {
      // Count
      qty = nos;
      expr = `${nos} ${canonicalUnit}`;
    } else {
      // Linear or custom
      const dimW = w > 0 ? w : 1;
      const dimH = h > 0 ? h : 1;
      qty = nos * (l || 1) * dimW * dimH;
      expr = `${nos > 1 ? nos + ' × ' : ''}${l || 1}m`;
    }

    if (isNaN(qty) || !isFinite(qty)) qty = 0;
    const rounded = Number(qty.toFixed(3));

    return {
      calculatedQuantity: rounded,
      formulaExpression: `${expr} = ${rounded} ${canonicalUnit}`,
    };
  }, [mbNos, mbLength, mbWidth, mbHeight, mbDepth, mbThickness, mbWeight, mbUnitWeight, mbFormula, canonicalUnit]);

  // Live Rate & Amount Preview
  const activeRate = typeof mbCustomRate === 'number' && mbCustomRate >= 0 ? mbCustomRate : (selectedSorItem?.rate || initialBoqItem?.rate || 0);
  const liveAmount = Number((calculatedQuantity * activeRate).toFixed(2));
  const formattedRateDisplay = UnitDimensionEngine.formatRateWithUnit(activeRate, rawItemUnit, mbFormula);

  // Live Resource Breakdown Preview (Derived from Rate Analysis)
  const resourcePreview = useMemo(() => {
    const analysis = selectedSorItem?.rateAnalysis;
    if (!analysis) return null;

    const materials = (analysis.materials || []).map((m) => {
      const reqQty = Number((calculatedQuantity * m.coefficient).toFixed(3));
      const cost = Number((reqQty * m.unitRate).toFixed(2));
      return { ...m, requiredQuantity: reqQty, amount: cost };
    });

    const labour = (analysis.labour || []).map((l) => {
      const reqMandays = Number((calculatedQuantity * l.coefficient).toFixed(2));
      const cost = Number((reqMandays * l.unitRate).toFixed(2));
      return { ...l, requiredQuantity: reqMandays, amount: cost };
    });

    const machinery = (analysis.machinery || []).map((mac) => {
      const reqHours = Number((calculatedQuantity * mac.coefficient).toFixed(2));
      const cost = Number((reqHours * mac.unitRate).toFixed(2));
      return { ...mac, requiredQuantity: reqHours, amount: cost };
    });

    const matTotal = materials.reduce((s, m) => s + m.amount, 0);
    const labTotal = labour.reduce((s, l) => s + l.amount, 0);
    const macTotal = machinery.reduce((s, mac) => s + mac.amount, 0);

    return {
      materials,
      labour,
      machinery,
      matTotal,
      labTotal,
      macTotal,
      grandResourceCost: matTotal + labTotal + macTotal,
      hasAnalysis: materials.length > 0 || labour.length > 0 || machinery.length > 0,
    };
  }, [calculatedQuantity, selectedSorItem]);

  // Save / Submit Mutation
  const saveMeasurementMutation = useMutation({
    mutationFn: async () => {
      if (calculatedQuantity <= 0) {
        throw new Error('Calculated quantity must be greater than zero.');
      }

      const payload = {
        sorItemId: selectedSorItem?._id,
        itemCode: selectedSorItem?.itemCode || initialBoqItem?.itemCode,
        boqItemId: initialBoqItem?._id || editingMeasurement?.boqItemId?._id,
        description: mbDescription.trim() || selectedSorItem?.descriptionEnglish || 'Measured Item',
        location: mbLocation.trim(),
        levelFloor: mbLevel.trim(),
        formula: mbFormula,
        nos: typeof mbNos === 'number' ? mbNos : 1,
        length: typeof mbLength === 'number' ? mbLength : 0,
        width: typeof mbWidth === 'number' ? mbWidth : 0,
        breadth: typeof mbWidth === 'number' ? mbWidth : 0,
        depth: typeof mbDepth === 'number' ? mbDepth : 0,
        height: typeof mbHeight === 'number' ? mbHeight : 0,
        heightDepth: typeof mbHeight === 'number' ? mbHeight : (typeof mbDepth === 'number' ? mbDepth : 0),
        thickness: typeof mbThickness === 'number' ? mbThickness : 0,
        weight: typeof mbWeight === 'number' ? mbWeight : 0,
        unitWeight: typeof mbUnitWeight === 'number' ? mbUnitWeight : 0,
        unit: selectedSorItem?.unit || initialBoqItem?.unit || 'cum',
        rate: activeRate,
        remarks: mbRemarks.trim(),
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
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      alert(e.response?.data?.message || e.message || 'Failed to save measurement');
    },
  });

  const isFormValid = calculatedQuantity > 0 && activeRate > 0 && dimensionalValidation.isValid;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-glow">
            <Ruler className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-erp-text">
              {editingMeasurement ? 'Edit Measurement Book Entry' : 'Smart Measurement Entry'}
            </h2>
            <p className="text-[11px] text-erp-text-muted">
              Measurement-Driven Automated Civil Estimation & BOQ Engine
            </p>
          </div>
        </div>
      }
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Progress Step Indicator */}
        {!editingMeasurement && (
          <div className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 rounded-xl border border-erp-border text-[11px] font-medium">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={cn(
                'py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all',
                currentStep === 1
                  ? 'bg-blue-600 text-white shadow font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <span>1. Schedule</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className={cn(
                'py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all',
                currentStep === 2
                  ? 'bg-blue-600 text-white shadow font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <span>2. Search</span>
            </button>
            <button
              type="button"
              onClick={() => selectedSorItem && setCurrentStep(3)}
              disabled={!selectedSorItem}
              className={cn(
                'py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all disabled:opacity-40',
                currentStep === 3
                  ? 'bg-blue-600 text-white shadow font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <span>3. Item</span>
            </button>
            <button
              type="button"
              onClick={() => selectedSorItem && setCurrentStep(4)}
              disabled={!selectedSorItem}
              className={cn(
                'py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all disabled:opacity-40',
                currentStep === 4
                  ? 'bg-blue-600 text-white shadow font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <span>4. Dimensions</span>
            </button>
            <button
              type="button"
              onClick={() => selectedSorItem && setCurrentStep(5)}
              disabled={!selectedSorItem || calculatedQuantity <= 0}
              className={cn(
                'py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all disabled:opacity-40',
                currentStep === 5
                  ? 'bg-blue-600 text-white shadow font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <span>5. Impact</span>
            </button>
          </div>
        )}

        {/* ======================================================================
            STEP 1 & 2: SCHEDULE SELECTOR & SEARCH
           ====================================================================== */}
        {(currentStep === 1 || currentStep === 2) && !editingMeasurement && (
          <div className="space-y-4">
            {/* Schedule Selector */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-erp-border space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-erp-text uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-400" />
                  STEP 1: Select Master Schedule (DSR / SOR)
                </label>
                {scheduleList.length > 0 && (
                  <span className="text-[11px] text-blue-400 font-medium">
                    {scheduleList.length} Active Master {scheduleList.length === 1 ? 'Schedule' : 'Schedules'}
                  </span>
                )}
              </div>

              {/* Loading State */}
              {isLoadingSchedules ? (
                <div className="p-4 bg-slate-950 rounded-xl border border-erp-border flex items-center justify-center gap-2 text-xs text-slate-400">
                  <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                  <span>Loading available DSR / SOR schedules from master database...</span>
                </div>
              ) : isScheduleError ? (
                /* Error State */
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-between gap-3 text-xs text-rose-300">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Failed to load DSR/SOR schedules from server.</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => refetchSchedules()} className="text-xs">
                    Retry
                  </Button>
                </div>
              ) : scheduleList.length === 0 ? (
                /* Empty State */
                <div className="p-6 bg-slate-950/80 rounded-xl border border-dashed border-erp-border text-center space-y-2">
                  <Package className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-xs font-semibold text-slate-300">No DSR/SOR master data available.</p>
                  <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                    Import a DSR/SOR dataset (CPWD DSR, CGPWD, Maharashtra PWD, etc.) from Admin → DSR/SOR Master to enable measurement-driven estimations.
                  </p>
                </div>
              ) : (
                /* Dynamic Schedule Dropdown */
                <div className="space-y-3">
                  <select
                    value={selectedScheduleId}
                    onChange={(e) => {
                      setSelectedScheduleId(e.target.value);
                      setSelectedSorItem(null);
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-erp-border rounded-xl text-xs text-erp-text font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  >
                    {scheduleList.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.authority} {s.scheduleType} {s.version} — {s.sorName} ({s.itemCount.toLocaleString('en-IN')} items{s.rateAnalysisStatus === 'Available' ? ' | Rate Analysis Available' : s.rateAnalysisStatus === 'Partial' ? ' | Partial Analysis' : ''})
                      </option>
                    ))}
                  </select>

                  {/* Dynamic Active Schedule Details Card */}
                  {selectedSchedule && (
                    <div className="p-3.5 bg-slate-950/90 rounded-xl border border-blue-500/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-medium">Authority & Type</span>
                        <span className="font-bold text-blue-300">
                          {selectedSchedule.authority} ({selectedSchedule.scheduleType})
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-medium">Version / Year</span>
                        <span className="font-bold text-erp-text">
                          v{selectedSchedule.version} {selectedSchedule.volume ? `• ${selectedSchedule.volume}` : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-medium">Category / Items</span>
                        <span className="font-bold text-emerald-400">
                          {selectedSchedule.itemCount.toLocaleString('en-IN')} items
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-medium">Rate Analysis</span>
                        <span
                          className={cn(
                            'font-bold text-[11px] px-2 py-0.5 rounded-full inline-block mt-0.5',
                            selectedSchedule.rateAnalysisStatus === 'Available'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : selectedSchedule.rateAnalysisStatus === 'Partial'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          )}
                        >
                          {selectedSchedule.rateAnalysisStatus === 'Available'
                            ? 'Available'
                            : selectedSchedule.rateAnalysisStatus === 'Partial'
                            ? 'Partial DAR'
                            : 'Not Available'}
                        </span>
                      </div>

                      {/* Source Document File Metadata */}
                      {selectedSchedule.documentName && (
                        <div className="col-span-2 sm:col-span-4 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1.5 truncate">
                            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            Source Document: <strong className="text-slate-300 truncate">{selectedSchedule.documentName}</strong>
                          </span>
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {selectedSchedule.category || selectedSchedule.department}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* STEP 2: Keyword Quick Chips & Search */}
            <div className={cn('space-y-3 transition-opacity', !selectedScheduleId ? 'opacity-50 pointer-events-none' : 'opacity-100')}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-erp-text uppercase tracking-wider flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-blue-400" />
                    STEP 2: Search Work Item by Keyword
                  </label>
                  {selectedSchedule && (
                    <span className="text-[10px] text-slate-400">
                      Searching in <strong className="text-blue-300">{selectedSchedule.sorName}</strong>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {QUICK_KEYWORDS.map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      disabled={!selectedScheduleId}
                      onClick={() => {
                        setSearchQuery(kw);
                        setCurrentStep(2);
                      }}
                      className={cn(
                        'px-2.5 py-1 text-xs rounded-lg border transition-all',
                        searchQuery.toLowerCase() === kw.toLowerCase()
                          ? 'bg-blue-600 text-white border-blue-500 shadow'
                          : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                      )}
                    >
                      {kw}
                    </button>
                  ))}
                </div>

                {/* Search Box */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    disabled={!selectedScheduleId}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      selectedSchedule
                        ? `Search across ${selectedSchedule.itemCount.toLocaleString('en-IN')} items in ${selectedSchedule.sorName} (e.g. 4.1.3, PCC, Plaster, Concrete)...`
                        : 'Select a schedule in Step 1 first...'
                    }
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-erp-border rounded-xl text-xs text-erp-text placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:opacity-50"
                    autoFocus
                  />
                  {isSearching && (
                    <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                  )}
                </div>
              </div>

              {/* Search Results List */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {searchedItems.length === 0 ? (
                  <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-dashed border-erp-border text-xs text-slate-400">
                    {searchQuery
                      ? `No matching items found for "${searchQuery}" in ${selectedSchedule?.sorName || 'selected schedule'}. Try another keyword or item code.`
                      : 'Type a keyword or select one from the quick chips above to search items.'}
                  </div>
                ) : (
                  searchedItems.map((item) => (
                    <div
                      key={item._id}
                      onClick={() => handleSelectItem(item)}
                      className={cn(
                        'p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 group',
                        selectedSorItem?._id === item._id
                          ? 'bg-blue-600/15 border-blue-500/50 shadow-md'
                          : 'bg-slate-900/60 border-erp-border hover:border-blue-500/30 hover:bg-slate-850'
                      )}
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                            {item.itemCode}
                          </span>
                          {item.workCategory && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                              {item.workCategory}
                            </span>
                          )}
                          {item.rateAnalysisStatus === 'AVAILABLE' ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-800 flex items-center gap-1 font-medium">
                              <Sparkles className="w-2.5 h-2.5" />
                              DAR Composition Available
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/50 text-amber-300 border border-amber-800/70">
                              Analysis Not Configured
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-erp-text font-medium line-clamp-2">
                          {item.descriptionEnglish}
                        </p>
                        <div className="text-[10px] text-slate-400 flex items-center gap-3">
                          <span>Unit: <strong className="text-slate-300">{item.unit}</strong></span>
                          <span>Rate: <strong className="text-emerald-400">₹{item.rate.toLocaleString('en-IN')}/{item.unit}</strong></span>
                          {item.measurementFormula && (
                            <span>Formula: <strong className="font-mono text-blue-300">{item.measurementFormula}</strong></span>
                          )}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="shrink-0 group-hover:translate-x-1 transition-transform">
                        <ChevronRight className="w-4 h-4 text-blue-400" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================
            STEP 3: SELECTED ITEM DETAILS CARD
           ====================================================================== */}
        {(currentStep === 3 || currentStep === 4 || currentStep === 5) && selectedSorItem && (
          <div className="p-3.5 bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 rounded-xl border border-blue-500/30 flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-600 text-white">
                  {selectedSorItem.itemCode}
                </span>
                <span className="text-[10px] text-slate-300 font-semibold px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                  {typeof selectedSorItem.sorId === 'object' ? selectedSorItem.sorId.sorName : 'SOR Item'}
                </span>
                {selectedSorItem.rateAnalysisStatus === 'AVAILABLE' ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> DAR Available
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Analysis Not Configured
                  </span>
                )}
              </div>
              <p className="text-xs text-erp-text font-medium line-clamp-2">
                {selectedSorItem.descriptionEnglish}
              </p>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="text-slate-400">
                  Unit: <strong className="text-erp-text font-mono">{selectedSorItem.unit}</strong>
                </span>
                <span className="text-emerald-400">
                  Rate: <strong>₹{activeRate.toLocaleString('en-IN')}/{selectedSorItem.unit}</strong>
                </span>
              </div>
            </div>

            {!editingMeasurement && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentStep(2)}
                className="text-xs text-blue-400 hover:text-blue-300 shrink-0"
              >
                Change Item
              </Button>
            )}
          </div>
        )}

        {/* ======================================================================
            STEP 4: MEASUREMENT DIMENSIONS ENTRY (MEASUREMENT-FIRST UI)
           ====================================================================== */}
        {currentStep === 4 && (
          <div className="space-y-4">
            {/* Strict Dimensional Compatibility Warning Banner */}
            {!dimensionalValidation.isValid && (
              <div className="p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5 flex-1">
                  <strong className="font-bold text-rose-200">DATA CONFIGURATION ERROR:</strong>
                  <p className="text-[11px] text-rose-300/90 leading-relaxed">
                    {dimensionalValidation.errorMessage}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-erp-text uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-blue-400" />
                Measurement Dimensions & Formula
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Formula:</span>
                <select
                  value={mbFormula}
                  onChange={(e) => setMbFormula(e.target.value as MeasurementFormula)}
                  className="px-2.5 py-1 bg-slate-900 border border-erp-border rounded-lg text-xs font-mono text-blue-300"
                >
                  <option value="LxWxH">Length × Width × Height / Depth (Volume - m³)</option>
                  <option value="LxW">Length × Width (Area - m²)</option>
                  <option value="Weight">Weight / Steel Reinforcement (kg / tonne)</option>
                  <option value="Count">Count / Numbers (Nos)</option>
                  <option value="Length">Running Length (m)</option>
                  <option value="Custom">Custom Formula</option>
                </select>
              </div>
            </div>

            {/* Location & Floor */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Location / Grid Reference
                </label>
                <input
                  type="text"
                  value={mbLocation}
                  onChange={(e) => setMbLocation(e.target.value)}
                  placeholder="e.g. Footing F1-F8 / Tower A"
                  className="w-full px-3 py-2 bg-slate-950 border border-erp-border rounded-lg text-xs text-erp-text"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Level / Floor
                </label>
                <input
                  type="text"
                  value={mbLevel}
                  onChange={(e) => setMbLevel(e.target.value)}
                  placeholder="e.g. Foundation Level -3.5m"
                  className="w-full px-3 py-2 bg-slate-950 border border-erp-border rounded-lg text-xs text-erp-text"
                />
              </div>
            </div>

            {/* Dynamic Dimension Inputs */}
            <div className="p-3.5 bg-slate-900/70 rounded-xl border border-erp-border space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Nos */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Nos (Members) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={mbNos}
                    onChange={(e) => setMbNos(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-erp-border rounded-lg text-xs text-erp-text font-bold"
                  />
                </div>

                {/* Length (shown for all except pure count) */}
                {mbFormula !== 'Count' && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Length (m) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      value={mbLength}
                      onChange={(e) => setMbLength(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-slate-950 border border-erp-border rounded-lg text-xs text-erp-text"
                    />
                  </div>
                )}

                {/* Width / Breadth (shown for LxWxH, LxW, LxWxD) */}
                {(mbFormula === 'LxWxH' || mbFormula === 'LxW' || mbFormula === 'LxWxD' || mbFormula === 'Custom') && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Width / Breadth (m) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      value={mbWidth}
                      onChange={(e) => setMbWidth(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-slate-950 border border-erp-border rounded-lg text-xs text-erp-text"
                    />
                  </div>
                )}

                {/* Depth / Height / Thickness (shown for 3D formulas) */}
                {(mbFormula === 'LxWxH' || mbFormula === 'LxWxD' || mbFormula === 'Custom') && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      {selectedSorItem?.workCategory?.includes('Earthwork') ? 'Depth / Cut (m) *' : 'Height / Depth (m) *'}
                    </label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      value={mbHeight}
                      onChange={(e) => {
                        setMbHeight(e.target.value === '' ? '' : Number(e.target.value));
                        setMbDepth(e.target.value === '' ? '' : Number(e.target.value));
                      }}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-slate-950 border border-erp-border rounded-lg text-xs text-erp-text"
                    />
                  </div>
                )}

                {/* Steel Rebar Diameter / Unit Weight Selector */}
                {(mbFormula === 'Weight' || selectedSorItem?.workCategory?.includes('Steel')) && (
                  <>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Bar Dia (mm)
                      </label>
                      <select
                        value={mbSelectedRebarDia}
                        onChange={(e) => handleRebarDiaChange(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-950 border border-erp-border rounded-lg text-xs text-erp-text"
                      >
                        <option value="">Custom Weight</option>
                        {REBAR_DIAMETERS.map((r) => (
                          <option key={r.dia} value={r.dia}>
                            {r.dia} mm ({r.weightPerMeter} kg/m)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Unit Weight (kg/m)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min={0}
                        value={mbUnitWeight}
                        onChange={(e) => setMbUnitWeight(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="e.g. 0.888"
                        className="w-full px-3 py-2 bg-slate-950 border border-erp-border rounded-lg text-xs text-erp-text font-mono"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* LIVE COMPUTATION PREVIEW BOX */}
              <div className="p-3 bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Live Formula Evaluation:
                  </span>
                  <span className="font-mono text-xs text-emerald-300">
                    {formulaExpression}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-500/20 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Calculated Quantity</span>
                    <span className="text-base font-bold text-emerald-400">
                      {calculatedQuantity.toLocaleString('en-IN')} {canonicalUnit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">DSR/SOR Rate</span>
                    <span className="text-sm font-bold text-erp-text">
                      {formattedRateDisplay}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">BOQ Amount</span>
                    <span className="text-base font-bold text-blue-400">
                      ₹{liveAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================
            STEP 5: LIVE IMPACT PREVIEW (BOQ, MATERIALS, MANPOWER, MACHINERY)
           ====================================================================== */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-900 rounded-xl border border-erp-border space-y-3">
              <h3 className="text-xs font-bold text-erp-text uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Live Automated Execution Impact Preview
              </h3>
              <p className="text-[11px] text-erp-text-muted">
                Saving this measurement will automatically create/update the BOQ and derive the following resource requirements without manual entry:
              </p>

              {/* BOQ Summary Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-950 rounded-xl border border-erp-border text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Measured Quantity</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {calculatedQuantity} {canonicalUnit}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Item Rate</span>
                  <span className="text-sm font-bold text-erp-text">{formattedRateDisplay}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">BOQ Amount</span>
                  <span className="text-sm font-bold text-blue-400">₹{liveAmount.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Rate Analysis</span>
                  <span className={cn('text-xs font-bold', resourcePreview?.hasAnalysis ? 'text-emerald-400' : 'text-amber-400')}>
                    {resourcePreview?.hasAnalysis ? 'Official CPWD DAR' : 'Not Configured'}
                  </span>
                </div>
              </div>

              {/* Resource Breakdown Tables */}
              {resourcePreview?.hasAnalysis ? (
                <div className="space-y-3 pt-2">
                  {/* Bill of Materials Preview */}
                  {resourcePreview.materials.length > 0 && (
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-erp-border space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-erp-text">
                        <span className="flex items-center gap-1.5 text-blue-400">
                          <Package className="w-3.5 h-3.5" />
                          Bill of Materials (BOM) Auto-Calculated
                        </span>
                        <span className="text-blue-300">₹{resourcePreview.matTotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="divide-y divide-slate-800 text-[11px]">
                        {resourcePreview.materials.map((m, idx) => (
                          <div key={idx} className="py-1 flex items-center justify-between text-slate-300">
                            <span>{m.name} ({m.coefficient} {m.unit}/{selectedSorItem?.unit})</span>
                            <span className="font-mono font-semibold text-emerald-400">
                              {m.requiredQuantity} {m.unit} @ ₹{m.unitRate} = ₹{m.amount.toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bill of Manpower Preview */}
                  {resourcePreview.labour.length > 0 && (
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-erp-border space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-erp-text">
                        <span className="flex items-center gap-1.5 text-purple-400">
                          <Users2 className="w-3.5 h-3.5" />
                          Bill of Manpower Auto-Calculated
                        </span>
                        <span className="text-purple-300">₹{resourcePreview.labTotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="divide-y divide-slate-800 text-[11px]">
                        {resourcePreview.labour.map((l, idx) => (
                          <div key={idx} className="py-1 flex items-center justify-between text-slate-300">
                            <span>{l.name} ({l.coefficient} Day/{selectedSorItem?.unit})</span>
                            <span className="font-mono font-semibold text-purple-300">
                              {l.requiredQuantity} Mandays @ ₹{l.unitRate} = ₹{l.amount.toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bill of Machinery Preview */}
                  {resourcePreview.machinery.length > 0 && (
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-erp-border space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-erp-text">
                        <span className="flex items-center gap-1.5 text-amber-400">
                          <Truck className="w-3.5 h-3.5" />
                          Bill of Machinery Auto-Calculated
                        </span>
                        <span className="text-amber-300">₹{resourcePreview.macTotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="divide-y divide-slate-800 text-[11px]">
                        {resourcePreview.machinery.map((mac, idx) => (
                          <div key={idx} className="py-1 flex items-center justify-between text-slate-300">
                            <span>{mac.name} ({mac.coefficient} Hr/{selectedSorItem?.unit})</span>
                            <span className="font-mono font-semibold text-amber-300">
                              {mac.requiredQuantity} Hours @ ₹{mac.unitRate} = ₹{mac.amount.toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-xs text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Rate Analysis Not Configured:</strong>
                    <p className="text-[11px] text-amber-200/80 mt-0.5">
                      BOQ item amount will be updated automatically. To generate granular material, labour, and machinery requirements, configure custom rate analysis from the BOQ tab.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Navigation Buttons */}
        <div className="pt-3 border-t border-erp-border flex items-center justify-between gap-3">
          <div>
            {currentStep > 1 && !editingMeasurement && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>

            {currentStep === 4 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentStep(5)}
                disabled={calculatedQuantity <= 0}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Preview Impact
              </Button>
            )}

            {(currentStep === 4 || currentStep === 5 || editingMeasurement) && (
              <Button
                size="sm"
                onClick={() => saveMeasurementMutation.mutate()}
                disabled={!isFormValid}
                isLoading={saveMeasurementMutation.isPending}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg"
              >
                {editingMeasurement ? 'Update & Recalculate' : 'Save Measurement & Sync All'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
