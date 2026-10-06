import React, { useState } from 'react';
import { ArrowRight, Code2, LayoutList, Columns, Copy, Check } from 'lucide-react';
import { AuditFieldDiff } from '../../types/audit';

interface AuditDiffViewerProps {
  diff?: AuditFieldDiff[];
  oldValue?: Record<string, any> | null;
  newValue?: Record<string, any> | null;
  className?: string;
}

export const AuditDiffViewer: React.FC<AuditDiffViewerProps> = ({
  diff = [],
  oldValue,
  newValue,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'side-by-side' | 'raw'>('cards');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // If diff is empty but oldValue and newValue exist, compute fields dynamically
  const computedDiffs: AuditFieldDiff[] = React.useMemo(() => {
    if (diff && diff.length > 0) return diff;
    if (!oldValue && !newValue) return [];

    const keys = new Set([
      ...Object.keys(oldValue || {}),
      ...Object.keys(newValue || {}),
    ]);
    const list: AuditFieldDiff[] = [];

    for (const key of keys) {
      if (['__v', '_id', 'createdAt', 'updatedAt', 'password', 'passwordHash'].includes(key)) {
        continue;
      }
      const v1 = oldValue?.[key];
      const v2 = newValue?.[key];
      if (JSON.stringify(v1) !== JSON.stringify(v2)) {
        list.push({
          field: key,
          label: key
            .replace(/([A-Z])/g, ' $1')
            .replace(/_/g, ' ')
            .replace(/^\w/, (c) => c.toUpperCase()),
          oldValue: v1 !== undefined ? v1 : null,
          newValue: v2 !== undefined ? v2 : null,
        });
      }
    }
    return list;
  }, [diff, oldValue, newValue]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const formatValue = (val: any) => {
    if (val === null || val === undefined) {
      return <span className="text-slate-500 italic">null</span>;
    }
    if (typeof val === 'boolean') {
      return (
        <span className={val ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
          {val ? 'TRUE' : 'FALSE'}
        </span>
      );
    }
    if (typeof val === 'object') {
      return <code className="text-amber-300 font-mono text-[11px]">{JSON.stringify(val)}</code>;
    }
    return <span>{String(val)}</span>;
  };

  if (computedDiffs.length === 0 && !oldValue && !newValue) {
    return (
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
        No state changes recorded for this entry.
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Diff Header Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Changed Properties
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            {computedDiffs.length} field{computedDiffs.length !== 1 ? 's' : ''} modified
          </span>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-[#080D18] border border-white/[0.08] rounded-xl text-xs shadow-inner">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[11px] font-semibold transition-all cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
            title="Field-by-field diff cards"
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span>Cards</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('side-by-side')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[11px] font-semibold transition-all cursor-pointer ${
              viewMode === 'side-by-side'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
            title="Side-by-side Before & After comparison"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Side-by-Side</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('raw')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[11px] font-semibold transition-all cursor-pointer ${
              viewMode === 'raw'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
            title="Inspect raw JSON object"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* MODE 1: Field Difference Cards */}
      {viewMode === 'cards' && (
        <div className="space-y-2">
          {computedDiffs.map((item, idx) => (
            <div
              key={item.field || idx}
              className="p-3.5 rounded-2xl bg-[#090D18] border border-white/[0.08] hover:border-amber-500/30 transition-all text-xs shadow-md"
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="font-bold text-slate-100 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {item.label || item.field}
                </span>
                <span className="font-mono text-[10.5px] px-2 py-0.5 rounded-md bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                  {item.field}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] items-center gap-2.5">
                {/* Before Value (Red removal box) */}
                <div className="p-3 rounded-xl bg-rose-950/25 border border-rose-500/25 text-rose-300 font-mono text-[11px] break-all flex items-start justify-between gap-2 shadow-inner">
                  <div>
                    <span className="text-[9px] font-sans font-extrabold uppercase tracking-wider text-rose-400/90 block mb-1">
                      Previous Value
                    </span>
                    {formatValue(item.oldValue)}
                  </div>
                </div>

                {/* Transition Arrow */}
                <div className="hidden sm:flex items-center justify-center text-slate-500 p-1 rounded-full bg-white/[0.03]">
                  <ArrowRight className="w-4 h-4 text-amber-400 shrink-0" />
                </div>

                {/* After Value (Green addition box) */}
                <div className="p-3 rounded-xl bg-emerald-950/25 border border-emerald-500/25 text-emerald-300 font-mono text-[11px] break-all flex items-start justify-between gap-2 shadow-inner">
                  <div>
                    <span className="text-[9px] font-sans font-extrabold uppercase tracking-wider text-emerald-400/90 block mb-1">
                      Updated Value
                    </span>
                    {formatValue(item.newValue)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODE 2: Side-by-Side Dual Column Panels */}
      {viewMode === 'side-by-side' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Old State Panel */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-rose-900/40">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-rose-900/30">
              <span className="font-bold text-rose-300 text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Prior State (Before)
              </span>
              <button
                type="button"
                onClick={() => handleCopy(JSON.stringify(oldValue, null, 2), 'old')}
                className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
              >
                {copiedKey === 'old' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copy</span>
              </button>
            </div>
            <pre className="font-mono text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-64 custom-scrollbar">
              {JSON.stringify(oldValue || {}, null, 2)}
            </pre>
          </div>

          {/* New State Panel */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-900/40">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-900/30">
              <span className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Updated State (After)
              </span>
              <button
                type="button"
                onClick={() => handleCopy(JSON.stringify(newValue, null, 2), 'new')}
                className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
              >
                {copiedKey === 'new' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copy</span>
              </button>
            </div>
            <pre className="font-mono text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-64 custom-scrollbar">
              {JSON.stringify(newValue || {}, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* MODE 3: Raw Full JSON Explorer */}
      {viewMode === 'raw' && (
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="text-[11px] text-slate-400">Complete Mutation Payload Diff</span>
            <button
              type="button"
              onClick={() =>
                handleCopy(JSON.stringify({ diff: computedDiffs, oldValue, newValue }, null, 2), 'raw')
              }
              className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
            >
              {copiedKey === 'raw' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>Copy JSON</span>
            </button>
          </div>
          <pre className="text-[11px] text-amber-300/90 overflow-x-auto max-h-72 custom-scrollbar">
            {JSON.stringify({ diff: computedDiffs, oldValue, newValue }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
