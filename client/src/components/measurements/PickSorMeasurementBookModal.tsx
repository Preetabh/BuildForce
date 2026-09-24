import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Search,
  BookOpen,
  MapPin,
  Building2,
  Clock,
  Plus,
  RotateCcw,
  Check,
  ChevronDown,
  Globe,
  Loader2,
  Upload,
} from 'lucide-react';
import { ScheduleHierarchyItem } from '../../types';
import { cn } from '../../utils/cn';
import api from '../../services/api';
import { CreateSorModal } from '../sor/CreateSorModal';

interface PickSorMeasurementBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedules?: ScheduleHierarchyItem[];
  selectedScheduleId?: string;
  onSelectSchedule: (schedule: ScheduleHierarchyItem) => void;
  onAddNewSor?: () => void;
  onOpenImport?: () => void;
}

export const PickSorMeasurementBookModal: React.FC<PickSorMeasurementBookModalProps> = ({
  isOpen,
  onClose,
  schedules = [],
  selectedScheduleId,
  onSelectSchedule,
  onAddNewSor,
  onOpenImport,
}) => {
  const queryClient = useQueryClient();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [tabFilter, setTabFilter] = useState<'All' | 'Govt' | 'Private'>('All');
  const [countryFilter, setCountryFilter] = useState('All Countries');
  const [stateFilter, setStateFilter] = useState('All States');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [ownerFilter, setOwnerFilter] = useState('All Owners');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // 1. Fetch Real Database Schedule Hierarchy
  const { data: dbSchedules = [], isLoading: isLoadingSchedules } = useQuery<ScheduleHierarchyItem[]>({
    queryKey: ['scheduleHierarchy'],
    queryFn: async () => {
      const res = await api.get('/sor/schedules/hierarchy');
      return Array.isArray(res.data?.data) ? res.data.data : [];
    },
    enabled: isOpen,
    initialData: schedules.length > 0 ? schedules : undefined,
  });

  const allSchedules = useMemo(() => {
    return dbSchedules;
  }, [dbSchedules]);

  // 2. Fetch User's Real Recent SORs from Database
  const { data: recentSors = [] } = useQuery<any[]>({
    queryKey: ['userRecentSors'],
    queryFn: async () => {
      const res = await api.get('/sor/recents');
      return Array.isArray(res.data?.data) ? res.data.data : [];
    },
    enabled: isOpen,
  });

  // Record user's recently opened SOR to database
  const recordRecentMutation = useMutation({
    mutationFn: async (sorId: string) => {
      await api.post(`/sor/recent/${sorId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userRecentSors'] });
    },
  });

  // Dynamic filter lists derived from real database records
  const countries = useMemo(() => {
    const set = new Set<string>();
    allSchedules.forEach((s) => s.country && set.add(s.country));
    return Array.from(set).sort();
  }, [allSchedules]);

  const states = useMemo(() => {
    const set = new Set<string>();
    allSchedules.forEach((s) => s.state && set.add(s.state));
    return Array.from(set).sort();
  }, [allSchedules]);

  const types = useMemo(() => {
    const set = new Set<string>();
    allSchedules.forEach((s) => (s.type || s.scheduleType) && set.add(s.type || s.scheduleType));
    return Array.from(set).sort();
  }, [allSchedules]);

  const owners = useMemo(() => {
    const set = new Set<string>();
    allSchedules.forEach((s) => (s.owningBody || s.authority) && set.add(s.owningBody || s.authority));
    return Array.from(set).sort();
  }, [allSchedules]);

  // Filtered List
  const filteredSchedules = useMemo(() => {
    return allSchedules.filter((sor) => {
      // 1. Text Search across name, owner, state, country, type
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = sor.sorName?.toLowerCase().includes(q);
        const matchesOwner =
          sor.owningBody?.toLowerCase().includes(q) || sor.authority?.toLowerCase().includes(q);
        const matchesState = sor.state?.toLowerCase().includes(q);
        const matchesCountry = sor.country?.toLowerCase().includes(q);
        const matchesType =
          sor.scheduleType?.toLowerCase().includes(q) || sor.type?.toLowerCase().includes(q);
        if (!matchesName && !matchesOwner && !matchesState && !matchesCountry && !matchesType) {
          return false;
        }
      }

      // 2. Tab Filter (All, Govt, Private)
      if (tabFilter === 'Govt') {
        const t = (sor.type || sor.scheduleType || '').toLowerCase();
        if (t.includes('private')) return false;
      } else if (tabFilter === 'Private') {
        const t = (sor.type || sor.scheduleType || '').toLowerCase();
        if (!t.includes('private') && sor.authority !== 'Private') return false;
      }

      // 3. Dropdown Filters
      if (countryFilter !== 'All Countries' && sor.country !== countryFilter) return false;
      if (stateFilter !== 'All States' && sor.state !== stateFilter) return false;
      if (typeFilter !== 'All Types' && (sor.type || sor.scheduleType) !== typeFilter) return false;
      if (ownerFilter !== 'All Owners' && (sor.owningBody || sor.authority) !== ownerFilter) return false;

      return true;
    });
  }, [allSchedules, searchQuery, tabFilter, countryFilter, stateFilter, typeFilter, ownerFilter]);

  // Grouped by hierarchy matching reference UI:
  // e.g. "INDIA / State Name", "INDIA / — (Central Govt)", "INDIA / — (Private)"
  const groupedHierarchy = useMemo(() => {
    const groups: { [key: string]: ScheduleHierarchyItem[] } = {};

    for (const sor of filteredSchedules) {
      const country = (sor.country || 'INDIA').toUpperCase();
      let region = sor.state;
      if (!region || region === 'All India' || region === 'Central') {
        if (
          (sor.type || sor.scheduleType || '').toLowerCase().includes('private') ||
          sor.authority === 'Private'
        ) {
          region = '— (Private)';
        } else {
          region = '— (Central Govt)';
        }
      }
      const groupKey = `${country} / ${region}`;
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(sor);
    }

    return groups;
  }, [filteredSchedules]);

  // Handle Schedule Selection
  const handleSelect = (item: ScheduleHierarchyItem) => {
    recordRecentMutation.mutate(item._id);
    onSelectSchedule(item);
    onClose();
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setTabFilter('All');
    setCountryFilter('All Countries');
    setStateFilter('All States');
    setTypeFilter('All Types');
    setOwnerFilter('All Owners');
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

        {/* Modal Dialog Card */}
        <div
          className="relative w-full max-w-4xl bg-[#0c1017] border border-slate-700/80 rounded-2xl shadow-2xl z-10 overflow-hidden my-4 flex flex-col max-h-[90vh]"
          role="dialog"
          aria-modal="true"
        >
          {/* ======================================================================
              HEADER: Title, Search, Filter Tabs & Close matching screenshot
             ====================================================================== */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-[#090d14] border-b border-slate-800 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
              <h3 className="text-sm font-bold text-white tracking-wide">
                Pick SOR for Measurement Book
              </h3>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Search Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, owner, state..."
                  className="pl-8 pr-3 py-1.5 bg-[#080b11] border border-slate-700/80 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 w-56 sm:w-64"
                />
              </div>

              {/* Segmented Tabs: All | Govt | Private */}
              <div className="flex items-center bg-[#111724] border border-slate-800 rounded-lg p-0.5 text-xs">
                {(['All', 'Govt', 'Private'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setTabFilter(tab)}
                    className={cn(
                      'px-3 py-1 rounded-md transition-all font-semibold cursor-pointer',
                      tabFilter === tab
                        ? 'bg-slate-700 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ======================================================================
              ROW 2: Filter Selectors (Countries, States, Types, Owners)
             ====================================================================== */}
          <div className="px-5 py-2.5 bg-[#0a0e16] border-b border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            {/* Countries Dropdown */}
            <div className="relative">
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#0e1320] border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500 appearance-none font-medium cursor-pointer"
              >
                <option value="All Countries">All Countries ({countries.length || 0})</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* States Dropdown */}
            <div className="relative">
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#0e1320] border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500 appearance-none font-medium cursor-pointer"
              >
                <option value="All States">All States ({states.length || 0})</option>
                {states.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Types Dropdown */}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#0e1320] border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500 appearance-none font-medium cursor-pointer"
              >
                <option value="All Types">All Types ({types.length || 0})</option>
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Owners Dropdown */}
            <div className="relative">
              <select
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#0e1320] border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500 appearance-none font-medium cursor-pointer"
              >
                <option value="All Owners">All Owners ({owners.length || 0})</option>
                {owners.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* ======================================================================
              ROW 3: Real Database Recent Clickable Chips
             ====================================================================== */}
          {recentSors.length > 0 && (
            <div className="px-5 py-2 bg-[#090d14] border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[11px] select-none">
              <div className="flex items-center gap-1 text-slate-500 font-semibold shrink-0">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>Recent:</span>
              </div>

              <div className="flex items-center gap-2">
                {recentSors.map((recentItem) => {
                  const sor = recentItem.sor || recentItem;
                  const sorName = sor.sorName || recentItem.sorName;
                  const sorId = sor._id || recentItem.sorId;
                  const fullMatch = allSchedules.find((s) => s._id === sorId) || sor;

                  return (
                    <button
                      key={sorId}
                      type="button"
                      onClick={() => {
                        if (fullMatch && fullMatch._id) handleSelect(fullMatch);
                      }}
                      className={cn(
                        'px-2 py-0.5 rounded border transition-colors whitespace-nowrap cursor-pointer text-xs',
                        selectedScheduleId === sorId
                          ? 'bg-blue-600/30 border-blue-500 text-blue-200 font-semibold'
                          : 'bg-[#131926] hover:bg-[#1e2638] text-slate-300 hover:text-white border-slate-800'
                      )}
                    >
                      {sorName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================================
              BODY: Grouped Hierarchical SOR List / Polished Empty State
             ====================================================================== */}
          <div className="p-5 space-y-4 flex-1 overflow-y-auto">
            {isLoadingSchedules ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
                <span className="text-xs font-medium">Loading organization Schedule of Rates...</span>
              </div>
            ) : allSchedules.length === 0 ? (
              /* Polished empty state when DB has no records for this org */
              <div className="p-12 text-center text-xs text-slate-400 bg-[#090d14] rounded-2xl border border-slate-800 space-y-3">
                <BookOpen className="w-10 h-10 mx-auto text-slate-600" />
                <h4 className="text-sm font-bold text-white">No Schedule of Rates Configured</h4>
                <p className="text-slate-400 max-w-md mx-auto text-xs leading-relaxed">
                  Your organization has not created or imported any Schedule of Rates yet. Create your first SOR or import from an Excel/CSV/PDF document.
                </p>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20 text-xs cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create First SOR</span>
                  </button>
                  {onOpenImport && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenImport();
                      }}
                      className="px-4 py-2 rounded-xl bg-[#141a27] hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold flex items-center gap-2 text-xs cursor-pointer transition-all"
                    >
                      <Upload className="w-4 h-4 text-slate-400" />
                      <span>Import SOR Document</span>
                    </button>
                  )}
                </div>
              </div>
            ) : Object.keys(groupedHierarchy).length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 bg-[#090d14] rounded-xl border border-slate-800">
                <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="font-semibold text-slate-300">No matching SOR departments found</p>
                <p className="text-slate-500 text-[11px] mt-1">
                  Try clearing your search keyword or resetting filter dropdowns.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-blue-600/30 text-blue-300 hover:bg-blue-600/50 text-xs font-semibold cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              Object.entries(groupedHierarchy).map(([groupTitle, items]) => (
                <div key={groupTitle} className="space-y-1.5">
                  {/* Hierarchy Group Header */}
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 tracking-wider pb-1 border-b border-slate-800/60 uppercase">
                    <span>{groupTitle}</span>
                    <span className="text-[11px] font-mono text-slate-500 font-semibold px-2 py-0.2 rounded bg-[#10141f]">
                      {items.length}
                    </span>
                  </div>

                  {/* Items in this region/group */}
                  <div className="space-y-2">
                    {items.map((sor) => {
                      const isSelected = sor._id === selectedScheduleId;
                      const isStateGovt = (sor.type || sor.scheduleType)?.toLowerCase().includes('state');
                      const isCentralGovt = (sor.type || sor.scheduleType)?.toLowerCase().includes('central');
                      const isPrivate =
                        (sor.type || sor.scheduleType)?.toLowerCase().includes('private') ||
                        sor.authority === 'Private';

                      // Dot color according to authority type
                      let dotColor = 'bg-amber-400';
                      if (isStateGovt) dotColor = 'bg-emerald-400';
                      else if (isCentralGovt) dotColor = 'bg-blue-400';
                      else if (isPrivate) dotColor = 'bg-purple-400';

                      return (
                        <div
                          key={sor._id}
                          onClick={() => handleSelect(sor)}
                          className={cn(
                            'p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group select-none',
                            isSelected
                              ? 'bg-[#0e1626] border-blue-500/60 shadow-md'
                              : 'bg-[#090d14] hover:bg-[#111726] border-slate-800 hover:border-slate-700'
                          )}
                        >
                          <div className="space-y-1.5">
                            {/* Title with bullet indicator dot */}
                            <div className="flex items-center gap-2">
                              <span className={cn('w-2 h-2 rounded-full shrink-0', dotColor)} />
                              <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors tracking-wide">
                                {sor.sorName}
                              </h4>
                            </div>

                            {/* Badges Row matching screenshot */}
                            <div className="flex items-center gap-1.5 flex-wrap pl-4">
                              {/* Type Badge */}
                              {isStateGovt ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  State Govt
                                </span>
                              ) : isCentralGovt ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                  Central Govt
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                  Private
                                </span>
                              )}

                              {/* Location Badge */}
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#141a27] text-slate-300 flex items-center gap-1 border border-slate-800">
                                {sor.state === 'All India' ? (
                                  <Globe className="w-2.5 h-2.5 text-slate-400" />
                                ) : (
                                  <MapPin className="w-2.5 h-2.5 text-slate-400" />
                                )}
                                <span>{sor.state || sor.country || 'Region'}</span>
                              </span>

                              {/* Owning Authority Badge */}
                              {(sor.owningBody || sor.authority) && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#141a27] text-slate-300 flex items-center gap-1 border border-slate-800">
                                  <Building2 className="w-2.5 h-2.5 text-slate-400" />
                                  <span>{sor.owningBody || sor.authority}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right: Real Item Count Badge */}
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right font-mono">
                              <span className="text-xs font-bold text-blue-400">
                                {typeof sor.itemCount === 'number' ? sor.itemCount.toLocaleString() : 0}
                              </span>
                              <span className="text-[10px] text-slate-500 block uppercase">items</span>
                            </div>

                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500 flex items-center justify-center text-blue-400 shrink-0">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ======================================================================
              FOOTER: Clear Button, Status Counter & "+ New SOR..." matching screenshot
             ====================================================================== */}
          <div className="px-5 py-3 bg-[#090d14] border-t border-slate-800 flex items-center justify-between text-xs select-none">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-1.5 rounded-lg bg-[#111724] hover:bg-[#182133] text-slate-400 hover:text-white border border-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>

            <span className="text-slate-500 font-mono text-[11px]">
              {filteredSchedules.length} of {allSchedules.length} SOR departments
            </span>

            <button
              type="button"
              onClick={() => {
                if (onAddNewSor) {
                  onAddNewSor();
                } else {
                  setIsCreateModalOpen(true);
                }
              }}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New SOR...</span>
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Create SOR Modal */}
      {isCreateModalOpen && (
        <CreateSorModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={(newSor) => {
            queryClient.invalidateQueries({ queryKey: ['scheduleHierarchy'] });
            if (newSor && newSor._id) {
              handleSelect(newSor);
            }
          }}
        />
      )}
    </>
  );
};
