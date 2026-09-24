import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  Search,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  FileSpreadsheet,
  Upload,
  Check,
  AlertCircle,
  HelpCircle,
  Layers,
  Wand2,
  Bot,
  RefreshCw,
} from 'lucide-react';
import api from '../../services/api';
import { cn } from '../../utils/cn';

export interface KeywordAliasItem {
  _id?: string;
  id?: string;
  keyword: string;
  clause: string;
  subclause: string;
  extra?: string;
  workCategory: string;
  stage?: string;
  rate?: number;
  unit?: string;
  clauseDesc?: string;
  subclauseDesc?: string;
}

interface ManageKeywordAliasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAliasesUpdated?: () => void;
}

const DEFAULT_ALIASES: KeywordAliasItem[] = [
  { keyword: 'Site Cleaning / Clearing & Gn', clause: '2.28', subclause: '2.28.1', extra: '', workCategory: 'Earth Work / Excavation', stage: 'Site Preparation', rate: 14.5, unit: 'SQM' },
  { keyword: 'Site Cleaning and Grubbing', clause: '2.28', subclause: '2.28.1', extra: '', workCategory: 'Earth Work / Excavation', stage: 'Site Preparation', rate: 18.2, unit: 'SQM' },
  { keyword: 'Excavation for Foundation', clause: '2.8', subclause: '2.8.1', extra: '', workCategory: 'Earth Work / Excavation', stage: 'Foundation', rate: 245.5, unit: 'CUM' },
  { keyword: 'Sand Filling in Plinth Foundat', clause: '2.27', subclause: '', extra: '', workCategory: 'Earth Work / Excavation', stage: 'Foundation', rate: 890.0, unit: 'CUM' },
  { keyword: 'PCC 1:4:8 Below Footing (M10)', clause: '4.1', subclause: '4.1.6', extra: '', workCategory: 'Concrete Work', stage: 'Foundation', rate: 5420.0, unit: 'CUM' },
  { keyword: 'RCC M25 for Footing', clause: '5.33', subclause: '5.33.1', extra: '5.33.1.1', workCategory: 'Concrete Work', stage: 'Foundation', rate: 7120.0, unit: 'CUM' },
  { keyword: '12mm Internal Plaster (12 mm 1:4)', clause: '13.1', subclause: '13.1.1', extra: '', workCategory: 'Plaster Work', stage: 'Finishing', rate: 347.05, unit: 'SQM', clauseDesc: '12 mm cement plaster of mix', subclauseDesc: '1:4 (1 cement: 4 fine sand)' },
  { keyword: '15mm External Plaster (15 mm 1:4)', clause: '13.2', subclause: '13.2.1', extra: '', workCategory: 'Plaster Work', stage: 'Finishing', rate: 399.45, unit: 'SQM', clauseDesc: '15 mm cement plaster on the rough side of single or half brick wall of mix', subclauseDesc: '1:4 (1 cement: 4 fine sand)' },
  { keyword: '6mm Plaster Ceiling (6 mm 1:3)', clause: '13.16', subclause: '13.16.1', extra: '', workCategory: 'Plaster Work', stage: 'Finishing', rate: 300.45, unit: 'SQM', clauseDesc: '6 mm cement plaster of mix', subclauseDesc: '1:3 (1 cement: 3 fine sand)' },
  { keyword: 'White Washing with Lime', clause: '13.37', subclause: '13.37.1', extra: '', workCategory: 'Painting', stage: 'Finishing', rate: 28.5, unit: 'SQM' },
  { keyword: 'Distempering with Oil Bound Washable', clause: '13.41', subclause: '13.41.1', extra: '', workCategory: 'Painting', stage: 'Finishing', rate: 85.0, unit: 'SQM' },
  { keyword: 'Painting Two or More Coats (Synthetic Enamel)', clause: '13.61', subclause: '13.61.1', extra: '', workCategory: 'Painting', stage: 'Finishing', rate: 112.0, unit: 'SQM' },
  { keyword: 'Brick Work with Common Burnt Clay F.P.S.', clause: '6.1', subclause: '6.1.1', extra: '', workCategory: 'Brick Work', stage: 'Superstructure', rate: 5850.0, unit: 'CUM' },
  { keyword: 'Damp Proof Course (DPC) 50mm thick', clause: '4.11', subclause: '4.11.1', extra: '', workCategory: 'Concrete Work', stage: 'Plinth', rate: 420.0, unit: 'SQM' },
  { keyword: 'Thermo-Mechanically Treated bars (TMT Fe 500D)', clause: '5.22', subclause: '5.22.6', extra: '', workCategory: 'Steel Work', stage: 'Superstructure', rate: 78.5, unit: 'KG' },
  { keyword: 'Vitrified Tile Flooring 600x600 mm', clause: '11.41', subclause: '11.41.2', extra: '', workCategory: 'Flooring', stage: 'Finishing', rate: 1250.0, unit: 'SQM' },
  { keyword: 'Ceramic Glazed Wall Tiles', clause: '11.36', subclause: '', extra: '', workCategory: 'Flooring', stage: 'Finishing', rate: 980.0, unit: 'SQM' },
  { keyword: 'Aluminium Sliding Doors / Windows (3 Track)', clause: '21.1', subclause: '21.1.1', extra: '', workCategory: 'Aluminium Work', stage: 'Finishing', rate: 4500.0, unit: 'SQM' },
  { keyword: 'Flush Door Shutters 35mm thick', clause: '9.21', subclause: '9.21.1', extra: '', workCategory: 'Wood Work', stage: 'Finishing', rate: 2400.0, unit: 'SQM' },
  { keyword: 'Structural Steel Work in Beams & Columns', clause: '10.1', subclause: '10.1.1', extra: '', workCategory: 'Steel Work', stage: 'Superstructure', rate: 92.0, unit: 'KG' },
];

export const ManageKeywordAliasesModal: React.FC<ManageKeywordAliasesModalProps> = ({
  isOpen,
  onClose,
  onAliasesUpdated,
}) => {
  const [aliases, setAliases] = useState<KeywordAliasItem[]>(() => {
    try {
      const saved = localStorage.getItem('budgetpilot_keyword_aliases');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_ALIASES;
  });

  const [filterQuery, setFilterQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // New Keyword Form State
  const [newKeyword, setNewKeyword] = useState('');
  const [newClause, setNewClause] = useState('');
  const [newSubclause, setNewSubclause] = useState('');
  const [newExtra, setNewExtra] = useState('');
  const [newWorkCategory, setNewWorkCategory] = useState('');
  const [newStage, setNewStage] = useState('');

  // Inline editing state: { rowIdx: number, field: keyof KeywordAliasItem } | null
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; field: keyof KeywordAliasItem } | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const editInputRef = useRef<HTMLInputElement | null>(null);

  // AI Import Sub-modal State
  const [isAiImportModalOpen, setIsAiImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [isParsingImport, setIsParsingImport] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<KeywordAliasItem[]>([]);

  // Fetch from server on open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);

    api
      .get('/sor/keyword-aliases')
      .then((res) => {
        if (!isMounted) return;
        const list = res.data?.data;
        if (Array.isArray(list) && list.length > 0) {
          const mapped: KeywordAliasItem[] = list.map((item: any) => ({
            _id: item._id,
            id: item._id,
            keyword: item.keyword,
            clause: item.clause,
            subclause: item.subclause || '',
            extra: item.extra || '',
            workCategory: item.workCategory || '',
            stage: item.stage || '',
            rate: item.rate,
            unit: item.unit,
            clauseDesc: item.clauseDesc,
            subclauseDesc: item.subclauseDesc,
          }));
          setAliases(mapped);
          try {
            localStorage.setItem('budgetpilot_keyword_aliases', JSON.stringify(mapped));
          } catch {
            // ignore
          }
        }
      })
      .catch((err) => {
        console.warn('Using local keyword aliases:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Sync to localStorage
  const persistAliases = (updated: KeywordAliasItem[]) => {
    setAliases(updated);
    try {
      localStorage.setItem('budgetpilot_keyword_aliases', JSON.stringify(updated));
    } catch {
      // ignore
    }
    if (onAliasesUpdated) onAliasesUpdated();
  };

  // Add new keyword alias
  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim() || !newClause.trim()) {
      alert('Please provide both Keyword and Clause number.');
      return;
    }

    const payload: KeywordAliasItem = {
      keyword: newKeyword.trim(),
      clause: newClause.trim(),
      subclause: newSubclause.trim(),
      extra: newExtra.trim(),
      workCategory: newWorkCategory.trim() || 'General Civil Works',
      stage: newStage.trim() || 'Construction',
      rate: 0,
      unit: 'SQM',
    };

    try {
      const res = await api.post('/sor/keyword-aliases', payload);
      const created = res.data?.data;
      if (created?._id) {
        payload._id = created._id;
        payload.id = created._id;
      }
    } catch (err) {
      // Fallback local ID
      payload._id = `alias-${Date.now()}`;
      payload.id = payload._id;
    }

    const updated = [payload, ...aliases];
    persistAliases(updated);

    // Reset inputs
    setNewKeyword('');
    setNewClause('');
    setNewSubclause('');
    setNewExtra('');
    setNewWorkCategory('');
    setNewStage('');

    setNotice(`Added keyword alias "${payload.keyword}"!`);
    setTimeout(() => setNotice(null), 3000);
  };

  // Delete keyword alias
  const handleDeleteAlias = async (row: KeywordAliasItem, index: number) => {
    const updated = aliases.filter((_, idx) => idx !== index);
    persistAliases(updated);

    if (row._id && !row._id.startsWith('alias-')) {
      try {
        await api.delete(`/sor/keyword-aliases/${row._id}`);
      } catch {
        // ignore
      }
    }

    setNotice(`Deleted alias "${row.keyword}"`);
    setTimeout(() => setNotice(null), 2500);
  };

  // Start inline editing
  const handleCellClick = (rowIdx: number, field: keyof KeywordAliasItem, currentVal: any) => {
    setEditingCell({ rowIdx, field });
    setEditingValue(currentVal || '');
    setTimeout(() => {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }, 10);
  };

  // Commit inline edit
  const handleSaveInlineEdit = async () => {
    if (!editingCell) return;
    const { rowIdx, field } = editingCell;
    const target = aliases[rowIdx];
    if (!target) {
      setEditingCell(null);
      return;
    }

    const updatedValue = editingValue.trim();
    if (target[field] !== updatedValue) {
      const updatedList = [...aliases];
      (updatedList[rowIdx] as any)[field] = updatedValue;
      persistAliases(updatedList);

      if (target._id && !target._id.startsWith('alias-')) {
        try {
          await api.patch(`/sor/keyword-aliases/${target._id}`, {
            [field]: updatedValue,
          });
        } catch {
          // ignore
        }
      }
    }

    setEditingCell(null);
  };

  // Filtered list
  const filteredAliases = useMemo(() => {
    if (!filterQuery.trim()) return aliases;
    const q = filterQuery.toLowerCase().trim();
    return aliases.filter(
      (a) =>
        a.keyword.toLowerCase().includes(q) ||
        a.clause.toLowerCase().includes(q) ||
        (a.subclause && a.subclause.toLowerCase().includes(q)) ||
        (a.extra && a.extra.toLowerCase().includes(q)) ||
        (a.workCategory && a.workCategory.toLowerCase().includes(q)) ||
        (a.stage && a.stage.toLowerCase().includes(q))
    );
  }, [aliases, filterQuery]);

  // AI Import Parser
  const handleParseImportText = () => {
    if (!importText.trim()) return;
    setIsParsingImport(true);

    try {
      const lines = importText.trim().split(/\r?\n/);
      const parsed: KeywordAliasItem[] = [];

      for (const line of lines) {
        if (!line.trim()) continue;
        const parts = line.split(/\t|,|;/);

        if (parts.length >= 2) {
          const kw = parts[0]?.trim();
          const cl = parts[1]?.trim();
          const sub = parts[2]?.trim() || '';
          const ext = parts[3]?.trim() || '';
          const cat = parts[4]?.trim() || 'General Civil Works';
          const stg = parts[5]?.trim() || 'Finishing';

          if (kw && cl) {
            parsed.push({
              keyword: kw,
              clause: cl,
              subclause: sub,
              extra: ext,
              workCategory: cat,
              stage: stg,
              rate: 0,
              unit: 'SQM',
            });
          }
        } else {
          // Try regex parse from free text
          // Example: "12mm Internal Plaster - Clause 13.1.1 (Plastering)"
          const match = line.match(/^([^-–:]+)[-–:]?\s*(?:Clause\s*)?([0-9]+(?:\.[0-9]+)*)(?:\s*\(([^\)]+)\))?/i);
          if (match) {
            const kw = match[1].trim();
            const fullCode = match[2].trim();
            const cat = match[3]?.trim() || 'Civil Work';

            const codeParts = fullCode.split('.');
            const clause = codeParts.slice(0, 2).join('.');
            const subclause = codeParts.length > 2 ? fullCode : '';

            parsed.push({
              keyword: kw,
              clause,
              subclause,
              extra: '',
              workCategory: cat,
              stage: 'Finishing',
              rate: 0,
              unit: 'SQM',
            });
          }
        }
      }

      setParsedPreview(parsed);
    } catch {
      // ignore
    } finally {
      setIsParsingImport(false);
    }
  };

  // Commit AI Import
  const handleCommitImport = async () => {
    if (parsedPreview.length === 0) return;

    try {
      await api.post('/sor/keyword-aliases/bulk-import', {
        items: parsedPreview,
      });
    } catch {
      // offline fallback
    }

    const merged = [...parsedPreview, ...aliases];
    persistAliases(merged);

    setIsAiImportModalOpen(false);
    setImportText('');
    setParsedPreview([]);
    setNotice(`Successfully imported ${parsedPreview.length} keyword aliases!`);
    setTimeout(() => setNotice(null), 3500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Dialog Card matching Reference Screenshot 2 */}
      <div
        className="relative w-full max-w-4xl bg-[#0b0f19] border border-slate-700/80 rounded-2xl shadow-2xl z-10 overflow-hidden my-auto flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* ======================================================================
            HEADER: Deep Royal Blue Banner matching reference screenshot 2
           ====================================================================== */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#1e40af] text-white select-none shadow-md">
          <div className="flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-white" />
            <h3 className="text-sm font-bold tracking-wide">Manage Keyword Aliases</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-md transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Floating Notice */}
        {notice && (
          <div className="mx-4 mt-3 p-2 bg-emerald-500/15 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-300 animate-in fade-in slide-in-from-top-2">
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* ======================================================================
            BODY: Add Form + Filter + Table
           ====================================================================== */}
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          {/* SECTION: ADD NEW KEYWORD */}
          <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                ADD NEW KEYWORD
              </span>

              {/* AI Import Button matching Reference Screenshot 2 */}
              <button
                type="button"
                onClick={() => setIsAiImportModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-[#151c2c] hover:bg-[#1c263c] border border-slate-700 hover:border-blue-500/60 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>AI Import (Text / PDF / Excel)</span>
              </button>
            </div>

            {/* Inputs Form matching Screenshot 2 */}
            <form onSubmit={handleAddKeyword} className="space-y-2.5">
              {/* Row 1: Keyword, Clause, Subclause, Extra */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    required
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="Keyword (e.g. Plaster 20mm)"
                    className="w-full px-3 py-1.5 bg-[#0e1422] border border-slate-700/80 focus:border-blue-500 rounded-lg text-xs text-white focus:outline-none placeholder:text-slate-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    required
                    value={newClause}
                    onChange={(e) => setNewClause(e.target.value)}
                    placeholder="Clause (e.g. 2.28)"
                    className="w-full px-3 py-1.5 bg-[#0e1422] border border-slate-700/80 focus:border-blue-500 rounded-lg text-xs text-white focus:outline-none placeholder:text-slate-500 font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={newSubclause}
                    onChange={(e) => setNewSubclause(e.target.value)}
                    placeholder="Subclause"
                    className="w-full px-3 py-1.5 bg-[#0e1422] border border-slate-700/80 focus:border-blue-500 rounded-lg text-xs text-white focus:outline-none placeholder:text-slate-500 font-mono"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    value={newExtra}
                    onChange={(e) => setNewExtra(e.target.value)}
                    placeholder="Extra (optional)"
                    className="w-full px-3 py-1.5 bg-[#0e1422] border border-slate-700/80 focus:border-blue-500 rounded-lg text-xs text-white focus:outline-none placeholder:text-slate-500 font-mono"
                  />
                </div>
              </div>

              {/* Row 2: Work Category, Stage, + Add Button */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-6">
                  <input
                    type="text"
                    value={newWorkCategory}
                    onChange={(e) => setNewWorkCategory(e.target.value)}
                    placeholder="Work Category (e.g. Earth Work / Excavation)"
                    className="w-full px-3 py-1.5 bg-[#0e1422] border border-slate-700/80 focus:border-blue-500 rounded-lg text-xs text-white focus:outline-none placeholder:text-slate-500"
                  />
                </div>
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value)}
                    placeholder="Stage Category (optional)"
                    className="w-full px-3 py-1.5 bg-[#0e1422] border border-slate-700/80 focus:border-blue-500 rounded-lg text-xs text-white focus:outline-none placeholder:text-slate-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full py-1.5 px-3 bg-[#2563eb] hover:bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Filter Bar & Count Row matching Screenshot 2 */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter keywords..."
                className="w-full pl-3 pr-8 py-1.5 bg-[#080b12] border border-slate-700/80 focus:border-blue-500 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none"
              />
              {filterQuery && (
                <button
                  type="button"
                  onClick={() => setFilterQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="text-[11px] font-mono font-semibold text-slate-400 shrink-0">
              <span className="text-blue-400">{filteredAliases.length}</span> of {aliases.length}
            </div>
          </div>

          {/* Table Spreadsheet matching Reference Screenshot 2 */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#080b11]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#0e1320] text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3 min-w-[200px]">KEYWORD</th>
                  <th className="py-2 px-2.5 w-20 text-center">CLAUSE</th>
                  <th className="py-2 px-2.5 w-24 text-center">SUBCLAUSE</th>
                  <th className="py-2 px-2.5 w-24 text-center">EXTRA</th>
                  <th className="py-2 px-3 min-w-[150px]">WORK CATEGORY</th>
                  <th className="py-2 px-3 min-w-[130px]">STAGE</th>
                  <th className="py-2 px-2 w-10 text-center"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/70">
                {filteredAliases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                      No keyword aliases matching "{filterQuery}"
                    </td>
                  </tr>
                ) : (
                  filteredAliases.map((row, idx) => {
                    const isCellActive = (field: keyof KeywordAliasItem) =>
                      editingCell?.rowIdx === idx && editingCell?.field === field;

                    return (
                      <tr
                        key={row._id || row.id || `row-${idx}`}
                        className="hover:bg-[#101524] transition-colors group"
                      >
                        {/* KEYWORD */}
                        <td
                          className="py-2 px-3 cursor-pointer text-slate-100 font-medium"
                          onClick={() => handleCellClick(idx, 'keyword', row.keyword)}
                        >
                          {isCellActive('keyword') ? (
                            <input
                              ref={editInputRef}
                              type="text"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onBlur={handleSaveInlineEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveInlineEdit();
                                if (e.key === 'Escape') setEditingCell(null);
                              }}
                              className="w-full px-2 py-0.5 bg-[#0a0f1d] border border-blue-500 rounded text-xs text-white focus:outline-none"
                            />
                          ) : (
                            <span className="group-hover:text-blue-300 transition-colors">
                              {row.keyword}
                            </span>
                          )}
                        </td>

                        {/* CLAUSE */}
                        <td
                          className="py-2 px-2.5 text-center font-mono font-bold text-blue-400 cursor-pointer"
                          onClick={() => handleCellClick(idx, 'clause', row.clause)}
                        >
                          {isCellActive('clause') ? (
                            <input
                              ref={editInputRef}
                              type="text"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onBlur={handleSaveInlineEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveInlineEdit();
                                if (e.key === 'Escape') setEditingCell(null);
                              }}
                              className="w-full px-1 py-0.5 bg-[#0a0f1d] border border-blue-500 rounded text-xs text-center font-mono text-white focus:outline-none"
                            />
                          ) : (
                            <span>{row.clause}</span>
                          )}
                        </td>

                        {/* SUBCLAUSE */}
                        <td
                          className="py-2 px-2.5 text-center font-mono text-slate-300 cursor-pointer"
                          onClick={() => handleCellClick(idx, 'subclause', row.subclause)}
                        >
                          {isCellActive('subclause') ? (
                            <input
                              ref={editInputRef}
                              type="text"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onBlur={handleSaveInlineEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveInlineEdit();
                                if (e.key === 'Escape') setEditingCell(null);
                              }}
                              className="w-full px-1 py-0.5 bg-[#0a0f1d] border border-blue-500 rounded text-xs text-center font-mono text-white focus:outline-none"
                            />
                          ) : (
                            <span>{row.subclause || '—'}</span>
                          )}
                        </td>

                        {/* EXTRA */}
                        <td
                          className="py-2 px-2.5 text-center font-mono text-slate-400 cursor-pointer"
                          onClick={() => handleCellClick(idx, 'extra', row.extra)}
                        >
                          {isCellActive('extra') ? (
                            <input
                              ref={editInputRef}
                              type="text"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onBlur={handleSaveInlineEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveInlineEdit();
                                if (e.key === 'Escape') setEditingCell(null);
                              }}
                              className="w-full px-1 py-0.5 bg-[#0a0f1d] border border-blue-500 rounded text-xs text-center font-mono text-white focus:outline-none"
                            />
                          ) : (
                            <span>{row.extra || ''}</span>
                          )}
                        </td>

                        {/* WORK CATEGORY */}
                        <td
                          className="py-2 px-3 text-slate-300 cursor-pointer"
                          onClick={() => handleCellClick(idx, 'workCategory', row.workCategory)}
                        >
                          {isCellActive('workCategory') ? (
                            <input
                              ref={editInputRef}
                              type="text"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onBlur={handleSaveInlineEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveInlineEdit();
                                if (e.key === 'Escape') setEditingCell(null);
                              }}
                              className="w-full px-2 py-0.5 bg-[#0a0f1d] border border-blue-500 rounded text-xs text-white focus:outline-none"
                            />
                          ) : (
                            <span>{row.workCategory}</span>
                          )}
                        </td>

                        {/* STAGE */}
                        <td
                          className="py-2 px-3 text-slate-300 cursor-pointer"
                          onClick={() => handleCellClick(idx, 'stage', row.stage)}
                        >
                          {isCellActive('stage') ? (
                            <input
                              ref={editInputRef}
                              type="text"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onBlur={handleSaveInlineEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveInlineEdit();
                                if (e.key === 'Escape') setEditingCell(null);
                              }}
                              className="w-full px-2 py-0.5 bg-[#0a0f1d] border border-blue-500 rounded text-xs text-white focus:outline-none"
                            />
                          ) : (
                            <span>{row.stage || '—'}</span>
                          )}
                        </td>

                        {/* DELETE ACTION */}
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteAlias(row, idx)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete Alias"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ======================================================================
            FOOTER matching Screenshot 2: Click any cell to edit inline + Close button
           ====================================================================== */}
        <div className="px-4 py-3 bg-[#0d121e] border-t border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Click any cell in the table to edit inline</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#1e2330] hover:bg-[#252c3c] text-slate-200 hover:text-white font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* ======================================================================
          AI IMPORT SUB-MODAL (Text / PDF / Excel)
         ====================================================================== */}
      {isAiImportModalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-100">
          <div
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
            onClick={() => setIsAiImportModalOpen(false)}
          />

          <div className="relative w-full max-w-2xl bg-[#0e1320] border border-slate-700 rounded-2xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-4 py-3 bg-[#1e3a8a] text-white">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-cyan-300" />
                <h4 className="text-sm font-bold">AI Import Keyword Aliases (Text / PDF / Excel)</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsAiImportModalOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 flex-1 overflow-y-auto text-xs text-slate-200">
              <p className="text-slate-400">
                Paste tabular data directly from Excel, CSV, or extract lines from PDF/tender specs:
                <br />
                <code className="text-cyan-300 font-mono text-[11px]">
                  Keyword [Tab] Clause [Tab] Subclause [Tab] Extra [Tab] Category [Tab] Stage
                </code>
              </p>

              <textarea
                rows={6}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={"12mm Plaster\t13.1\t13.1.1\t\tPlaster Work\tFinishing\nFlush Door 35mm\t9.21\t9.21.1\t\tWood Work\tFinishing\nExcavation\t2.8\t2.8.1\t\tEarth Work\tFoundation"}
                className="w-full p-3 bg-[#080b12] border border-slate-700 rounded-xl font-mono text-xs text-white focus:outline-none focus:border-cyan-500 placeholder:text-slate-600"
              />

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleParseImportText}
                  disabled={!importText.trim() || isParsingImport}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Parse & Preview</span>
                </button>

                {parsedPreview.length > 0 && (
                  <span className="text-emerald-400 font-mono font-semibold">
                    ✓ {parsedPreview.length} aliases detected
                  </span>
                )}
              </div>

              {/* Preview Table */}
              {parsedPreview.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-800 bg-[#080a10]">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-[#121726] text-slate-400 font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-1.5">Keyword</th>
                        <th className="p-1.5">Clause</th>
                        <th className="p-1.5">Subclause</th>
                        <th className="p-1.5">Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {parsedPreview.map((item, i) => (
                        <tr key={i} className="hover:bg-slate-900/40">
                          <td className="p-1.5 text-white">{item.keyword}</td>
                          <td className="p-1.5 text-cyan-400 font-bold">{item.clause}</td>
                          <td className="p-1.5 text-slate-400">{item.subclause || '—'}</td>
                          <td className="p-1.5 text-slate-400">{item.workCategory}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="px-4 py-3 bg-[#090d16] border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAiImportModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCommitImport}
                disabled={parsedPreview.length === 0}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Import {parsedPreview.length} Aliases</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
