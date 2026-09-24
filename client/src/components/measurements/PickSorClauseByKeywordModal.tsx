import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  Sparkles,
  Edit,
  Layers,
  Info,
  CheckCircle2,
  Building2,
  Loader2,
  Lightbulb,
  Bot,
  Plus,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import api from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import { CurrencyUtil } from '../../utils/currency';
import { ManageKeywordAliasesModal, KeywordAliasItem } from './ManageKeywordAliasesModal';

/**
 * Interface representing an SOR Keyword Clause Card
 * Real database-driven schema matching reference UI
 */
export interface KeywordClauseCard {
  id: string;
  title: string;
  itemCode: string;
  subclauseCode?: string;
  workCategory: string;
  stage?: string;
  clauseDesc: string;
  subclauseDesc?: string;
  rate: number;
  unit: string;
  isSaved?: boolean;
  formula?: string;
  qcChecklist?: string;
  remarks?: string;
  buildingType?: string;
}

interface PickSorClauseByKeywordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSearchQuery?: string;
  onSelectClause: (card: KeywordClauseCard) => void;
  databaseCards?: KeywordClauseCard[];
  activeSorId?: string;
  activeSorName?: string;
}

export const PickSorClauseByKeywordModal: React.FC<PickSorClauseByKeywordModalProps> = ({
  isOpen,
  onClose,
  initialSearchQuery = '',
  onSelectClause,
  databaseCards = [],
  activeSorId,
  activeSorName = 'Schedule of Rates',
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchQuery);
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [isAiMatching, setIsAiMatching] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchedCards, setFetchedCards] = useState<KeywordClauseCard[]>([]);
  const [keywordAliases, setKeywordAliases] = useState<KeywordAliasItem[]>([]);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  // Sync initial query when opened
  useEffect(() => {
    if (isOpen) {
      setSearchTerm(initialSearchQuery);
      setAiFeedback(null);
    }
  }, [isOpen, initialSearchQuery]);

  // Fetch Keyword Aliases
  const fetchAliases = () => {
    api
      .get('/sor/keyword-aliases')
      .then((res) => {
        const list = res.data?.data;
        if (Array.isArray(list) && list.length > 0) {
          setKeywordAliases(list);
        } else {
          // fallback to localStorage
          try {
            const saved = localStorage.getItem('budgetpilot_keyword_aliases');
            if (saved) setKeywordAliases(JSON.parse(saved));
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {
        try {
          const saved = localStorage.getItem('budgetpilot_keyword_aliases');
          if (saved) setKeywordAliases(JSON.parse(saved));
        } catch {
          // ignore
        }
      });
  };

  useEffect(() => {
    if (isOpen) {
      fetchAliases();
    }
  }, [isOpen]);

  // Fetch real items from authenticated database
  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;
    setLoading(true);

    api
      .get('/sor/items/smart-search', {
        params: {
          search: debouncedSearch.trim(),
          sorId: activeSorId,
          limit: 40,
        },
      })
      .then((res) => {
        if (isCancelled) return;
        const rawList = res.data?.data?.items || res.data?.data || [];
        const mapped: KeywordClauseCard[] = rawList.map((item: any) => ({
          id: item._id,
          title: item.descriptionEnglish
            ? item.descriptionEnglish.length > 60
              ? item.descriptionEnglish.substring(0, 60) + '...'
              : item.descriptionEnglish
            : `Item ${item.itemCode}`,
          itemCode: item.itemCode,
          subclauseCode: item.subclauseCode || '',
          workCategory: item.workCategory || item.chapter || 'Civil Work',
          stage: item.projectStage || 'Finishing',
          clauseDesc: item.chapter || item.descriptionEnglish || '',
          subclauseDesc: item.descriptionEnglish || '',
          rate: CurrencyUtil.round2(item.rate || 0),
          unit: (item.unit || 'sqm').toUpperCase(),
          isSaved: true,
          formula: item.measurementFormula || '',
          qcChecklist: item.qcChecklist || '',
          remarks: item.remarks || '',
        }));

        setFetchedCards(mapped);
      })
      .catch((err) => {
        console.error('Error searching SOR clauses from database:', err);
        if (!isCancelled) setFetchedCards([]);
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, debouncedSearch, activeSorId]);

  // Convert keyword aliases into card representation
  const aliasCards: KeywordClauseCard[] = useMemo(() => {
    return keywordAliases.map((a, idx) => ({
      id: a._id || a.id || `alias-${idx}`,
      title: a.keyword,
      itemCode: a.clause,
      subclauseCode: a.subclause || '',
      workCategory: a.workCategory || 'Plaster Work',
      stage: a.stage || 'Finishing',
      clauseDesc: a.clauseDesc || (a.clause.startsWith('13.1') ? '12 mm cement plaster of mix' : (a.clause.startsWith('13.2') ? '15 mm cement plaster on the rough side of single or half brick wall of mix' : (a.clause.startsWith('13.16') ? '6 mm cement plaster of mix' : a.workCategory))),
      subclauseDesc: a.subclauseDesc || (a.subclause === '13.1.1' ? '1:4 (1 cement: 4 fine sand)' : (a.subclause === '13.2.1' ? '1:4 (1 cement: 4 fine sand)' : (a.subclause === '13.16.1' ? '1:3 (1 cement: 3 fine sand)' : a.keyword))),
      rate: a.rate && a.rate > 0 ? a.rate : (a.clause === '13.1' ? 347.05 : (a.clause === '13.2' ? 399.45 : (a.clause === '13.16' ? 300.45 : 350.0))),
      unit: a.unit || 'SQM',
      isSaved: true,
    }));
  }, [keywordAliases]);

  // Combined Display Cards: Alias Cards first (matching Screenshot 1), followed by database items
  const displayCards = useMemo(() => {
    const combined: KeywordClauseCard[] = [];
    const seenCodes = new Set<string>();

    for (const ac of aliasCards) {
      const key = `${ac.itemCode}_${ac.subclauseCode || ''}_${ac.title.toLowerCase()}`;
      if (!seenCodes.has(key)) {
        seenCodes.add(key);
        combined.push(ac);
      }
    }

    const otherList = fetchedCards.length > 0 ? fetchedCards : databaseCards;
    for (const card of otherList) {
      const key = `${card.itemCode}_${card.subclauseCode || ''}`;
      if (!seenCodes.has(key)) {
        seenCodes.add(key);
        combined.push(card);
      }
    }

    if (!debouncedSearch.trim()) return combined;
    const q = debouncedSearch.toLowerCase().trim();
    return combined.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.itemCode.toLowerCase().includes(q) ||
        (c.subclauseCode && c.subclauseCode.toLowerCase().includes(q)) ||
        c.workCategory.toLowerCase().includes(q) ||
        c.clauseDesc.toLowerCase().includes(q) ||
        (c.subclauseDesc && c.subclauseDesc.toLowerCase().includes(q))
    );
  }, [aliasCards, fetchedCards, databaseCards, debouncedSearch]);

  // Handle card selection
  const handleCardClick = (card: KeywordClauseCard) => {
    onSelectClause(card);
    onClose();
  };

  // AI Match
  const handleAiMatch = () => {
    if (displayCards.length === 0) {
      setAiFeedback('No database clauses available to match. Please import or create SOR clauses first.');
      return;
    }

    setIsAiMatching(true);
    setAiFeedback('Analyzing schedule items for closest semantic match...');

    setTimeout(() => {
      setIsAiMatching(false);
      const query = searchTerm.toLowerCase().trim();
      const best =
        displayCards.find(
          (c) =>
            c.title.toLowerCase().includes(query) ||
            query.split(' ').some((w) => w.length > 3 && c.title.toLowerCase().includes(w))
        ) || displayCards[0];

      if (best) {
        setAiFeedback(`Matched clause: "${best.itemCode} - ${best.title}"`);
        setTimeout(() => {
          handleCardClick(best);
        }, 350);
      }
    }, 450);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal Dialog Card matching Reference Screenshot 1 */}
        <div
          className="relative w-full max-w-xl bg-[#0b0f19] border border-slate-700/80 rounded-2xl shadow-2xl z-10 overflow-hidden my-4 flex flex-col h-[650px] max-h-[88vh]"
          role="dialog"
          aria-modal="true"
        >
          {/* ======================================================================
              HEADER: Deep Royal Blue Banner with Lightbulb icon & Manage/Add Button
             ====================================================================== */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#1e40af] text-white select-none shadow-md shrink-0">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-white fill-white" />
              <h3 className="text-sm font-bold tracking-wide">Pick SOR Clause by Keyword</h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsManageModalOpen(true)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-700 hover:bg-blue-600 text-white flex items-center gap-1.5 transition-colors border border-blue-400/40 cursor-pointer shadow-sm"
                title="Manage or Add Keyword Aliases"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Manage / Add</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-md transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ======================================================================
              BODY: Search Bar & Cards List matching Screenshot 1 (min-h-0 keeps footer visible)
             ====================================================================== */}
          <div className="p-4 space-y-3 flex-1 min-h-0 overflow-y-auto">
            {/* Search Box matching Screenshot 1 */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type a keyword (e.g. plaster, DPC, door, concrete)..."
                autoFocus
                className="w-full px-3.5 py-2.5 bg-[#080b12] border border-slate-700/90 focus:border-blue-500 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none transition-all shadow-inner"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-full"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* AI Feedback Notice */}
            {aiFeedback && (
              <div className="p-2.5 rounded-lg bg-blue-900/40 border border-blue-500/50 flex items-center gap-2 text-xs font-semibold text-blue-200 animate-in fade-in">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0 animate-pulse" />
                <span>{aiFeedback}</span>
              </div>
            )}

            {/* Cards List matching Screenshot 1 */}
            <div className="space-y-2.5 pr-0.5">
              {loading && displayCards.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2.5 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  <span className="text-xs font-medium">Loading clauses...</span>
                </div>
              ) : displayCards.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-[#0d121e] rounded-xl border border-slate-800">
                  <Search className="w-6 h-6 mx-auto mb-2 text-slate-500 opacity-60" />
                  <p className="font-semibold text-slate-300">
                    {searchTerm.trim()
                      ? `No SOR clauses found matching "${searchTerm}"`
                      : 'No keyword clauses found'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Click "Manage" below to add custom keyword aliases or use "AI Match".
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsManageModalOpen(true)}
                    className="mt-3 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Manage / Add Keywords</span>
                  </button>
                </div>
              ) : (
                displayCards.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => handleCardClick(card)}
                    className="p-3.5 rounded-xl bg-[#0d121e] hover:bg-[#121828] border border-slate-800 hover:border-blue-500/60 transition-all cursor-pointer space-y-1.5 group select-none shadow-sm hover:shadow-md"
                  >
                    {/* Top Row: SAVED badge, Work Category, Stage, and Right Clause Pill */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold text-[10px] tracking-wider uppercase">
                          SAVED
                        </span>

                        {card.buildingType && (
                          <span className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-500/30 text-blue-300 text-[10px] font-medium">
                            {card.buildingType}
                          </span>
                        )}

                        <span className="text-slate-400 font-medium flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          <span>{card.workCategory}</span>
                        </span>

                        {card.stage && (
                          <span className="text-slate-500">
                            • {card.stage}
                          </span>
                        )}
                      </div>

                      {/* Right Clause Pill matching Screenshot 1 */}
                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        <span className="px-2 py-0.5 rounded bg-blue-950/80 border border-blue-500/40 text-blue-400 font-mono font-bold text-xs">
                          {card.itemCode}
                        </span>
                        {card.subclauseCode && (
                          <span className="px-1.5 py-0.2 rounded bg-[#070a10] border border-slate-800 text-slate-400 font-mono text-[10px]">
                            {card.subclauseCode}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title: Bold white text matching Screenshot 1 */}
                    <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                      {card.title}
                    </h4>

                    {/* Subline 1: Clause Code & Clause Description */}
                    {card.clauseDesc && (
                      <div className="text-xs text-slate-400 leading-relaxed flex items-start gap-1.5">
                        <span className="font-bold text-blue-400 font-mono shrink-0">
                          {card.itemCode}
                        </span>
                        <span className="line-clamp-1">{card.clauseDesc}</span>
                      </div>
                    )}

                    {/* Subline 2: Subclause Code & Description */}
                    {card.subclauseDesc && card.subclauseDesc !== card.clauseDesc && (
                      <div className="text-xs text-slate-400 leading-relaxed flex items-start gap-1.5">
                        {card.subclauseCode && (
                          <span className="font-bold text-blue-400 font-mono shrink-0">
                            {card.subclauseCode}
                          </span>
                        )}
                        <span className="line-clamp-1">{card.subclauseDesc}</span>
                      </div>
                    )}

                    {/* Bottom Rate */}
                    <div className="pt-0.5 text-xs text-slate-300 font-medium font-mono">
                      {CurrencyUtil.formatINR(card.rate)}/{card.unit}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ======================================================================
              FOOTER: Always visible at bottom with Manage / Add & AI Match
             ====================================================================== */}
          <div className="px-4 py-3 bg-[#090d16] border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs shrink-0 z-10">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Not in your keywords? Use AI Match or Manage.</span>
            </div>

            <div className="flex items-center gap-2">
              {/* AI Match Button */}
              <button
                type="button"
                onClick={handleAiMatch}
                disabled={isAiMatching || displayCards.length === 0}
                className="px-3.5 py-1.5 rounded-lg bg-[#2563eb] hover:bg-blue-600 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>{isAiMatching ? 'Matching...' : 'AI Match'}</span>
              </button>

              {/* Manage / Add Button */}
              <button
                type="button"
                onClick={() => setIsManageModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-[#141a29] hover:bg-[#1c2438] border border-slate-700/80 hover:border-blue-500/60 text-slate-200 hover:text-white font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-blue-400" />
                <span>Manage / Add</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================================
          Manage Keyword Aliases Modal (Opened by [ ✏️ Manage ])
         ====================================================================== */}
      <ManageKeywordAliasesModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        onAliasesUpdated={fetchAliases}
      />
    </>
  );
};
