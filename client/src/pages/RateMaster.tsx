import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import {
  FileSpreadsheet,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  History,
  Trash2,
  ExternalLink,
  RotateCw,
  Download,
  Copy,
  Check,
} from 'lucide-react';
import api from '../services/api';
import { SorItem, SorMaster, SorImport, PaginationMeta } from '../types';
import { Header } from '../components/layout/Header';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { SorImportModal } from '../components/sor/SorImportModal';
import { formatCurrency } from '../utils/formatters';
import { useDebounce } from '../hooks/useDebounce';

interface OutletContextType {
  setSidebarOpen: (open: boolean) => void;
}

export const RateMaster: React.FC = () => {
  const { setSidebarOpen } = useOutletContext<OutletContextType>();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [chapter, setChapter] = useState('');
  const [unit, setUnit] = useState('');
  const [selectedSorId, setSelectedSorId] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [resumeImportId, setResumeImportId] = useState<string | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Fetch available SOR schedules
  const { data: sorMasters = [] } = useQuery<SorMaster[]>({
    queryKey: ['sorMasters'],
    queryFn: async () => {
      const res = await api.get('/sor/masters');
      return res.data?.data || [];
    },
  });

  // Fetch Import History
  const {
    data: importsHistory = [],
    refetch: refetchHistory,
    isLoading: isLoadingHistory,
  } = useQuery<SorImport[]>({
    queryKey: ['sorImportsHistory'],
    queryFn: async () => {
      const res = await api.get('/sor/imports?limit=20');
      return res.data?.data || [];
    },
    enabled: isHistoryModalOpen,
  });

  // Fetch Rate Master items from MongoDB
  const {
    data: itemsData,
    isLoading,
    refetch,
    isFetching,
  } = useQuery<{ items: SorItem[]; pagination: PaginationMeta }>({
    queryKey: ['sorItems', { search: debouncedSearch, chapter, unit, sorId: selectedSorId, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (chapter) params.append('chapter', chapter);
      if (unit) params.append('unit', unit);
      if (selectedSorId) params.append('sorId', selectedSorId);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const res = await api.get(`/sor/items?${params.toString()}`);
      return {
        items: res.data?.data || [],
        pagination: res.data?.pagination || { total: 0, page: 1, limit, totalPages: 1 },
      };
    },
  });

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
      link.setAttribute('download', 'CPWD_SOR_2023.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const items = itemsData?.items || [];
  const pagination = itemsData?.pagination;

  return (
    <div>
      <Header
        breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Rate Master (SOR)' }]}
        onToggleSidebar={() => setSidebarOpen(true)}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
      />

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-erp-text tracking-tight">
                Rate Master & Schedule of Rates (SOR)
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {pagination?.total || 0} Standard Items
              </span>
            </div>
            <p className="text-xs sm:text-sm text-erp-text-muted mt-1">
              Centralized Schedule of Rates (CPWD SOR/DSR, State PWD) with multi-version snapshots
              and fast search.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              onClick={handleExportExcel}
              variant="outline"
              size="sm"
              isLoading={isExporting}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Export Excel
            </Button>
            <Button
              onClick={() => setIsHistoryModalOpen(true)}
              variant="outline"
              size="sm"
              leftIcon={<History className="w-4 h-4" />}
            >
              Import History
            </Button>
            <Button
              onClick={() => {
                setResumeImportId(null);
                setIsImportModalOpen(true);
              }}
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Import SOR (Excel/PDF)
            </Button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-erp-border space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-erp-text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search items by SR No (e.g. 2.1.1), description, or type..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-erp-border rounded-lg text-sm text-erp-text placeholder:text-erp-text-subtle focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Schedule Selector */}
            <select
              value={selectedSorId}
              onChange={(e) => {
                setSelectedSorId(e.target.value);
                setPage(1);
              }}
              className="bg-slate-900 border border-erp-border rounded-lg text-xs text-erp-text px-3 py-2 focus:outline-none focus:border-blue-500 min-w-[200px]"
            >
              <option value="">All Schedules & Versions</option>
              {sorMasters.map((m: SorMaster) => (
                <option key={m._id} value={m._id}>
                  {m.authority} - {m.sorName} ({m.version})
                </option>
              ))}
            </select>

            {/* Unit Selector */}
            <select
              value={unit}
              onChange={(e) => {
                setUnit(e.target.value);
                setPage(1);
              }}
              className="bg-slate-900 border border-erp-border rounded-lg text-xs text-erp-text px-3 py-2 focus:outline-none focus:border-blue-500 min-w-[120px]"
            >
              <option value="">All Units</option>
              <option value="CUM">CUM (Cubic Metre)</option>
              <option value="SQM">SQM (Square Metre)</option>
              <option value="METRE">METRE (Linear Metre)</option>
              <option value="KG">KG (Kilogram)</option>
              <option value="TONNE">TONNE (Metric Ton)</option>
              <option value="NOS">NOS (Numbers)</option>
            </select>
          </div>
        </div>

        {/* Rate Master Table: SR | SR NO | WORK DESCRIPTION | UNIT | RATE | TYPE | ACTION */}
        <div className="glass-panel rounded-xl border border-erp-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-erp-text-muted border-b border-erp-border uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-3 font-bold w-12 text-center">SR</th>
                  <th className="py-3 px-4 font-bold w-24">SR NO</th>
                  <th className="py-3 px-4 font-bold">WORK DESCRIPTION</th>
                  <th className="py-3 px-3 font-bold w-16 text-center">UNIT</th>
                  <th className="py-3 px-4 font-bold w-28 text-right">RATE</th>
                  <th className="py-3 px-4 font-bold w-36">TYPE</th>
                  <th className="py-3 px-3 font-bold w-16 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-erp-border/70">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-erp-text-muted">
                      Loading Rate Master items from MongoDB...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-erp-text-muted">
                      No Rate Master items found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  items.map((item: SorItem, idx: number) => {
                    const seqNo = item.srNo ?? ((pagination?.page || 1) - 1) * limit + idx + 1;
                    const isParentHeader = !item.rate || item.rate === 0;

                    return (
                      <tr
                        key={item._id}
                        className={`hover:bg-slate-850/50 transition-colors ${
                          isParentHeader ? 'bg-slate-900/30' : ''
                        }`}
                      >
                        {/* SR Sequence Number */}
                        <td className="py-3 px-3 text-center font-mono text-slate-400 font-semibold">
                          {seqNo}
                        </td>

                        {/* SR NO */}
                        <td className="py-3 px-4 font-mono font-bold text-blue-400 whitespace-nowrap">
                          {item.itemCode}
                        </td>

                        {/* WORK DESCRIPTION */}
                        <td className="py-3 px-4 text-erp-text max-w-lg">
                          <p className={`leading-relaxed ${isParentHeader ? 'font-semibold text-slate-200' : 'font-medium'}`}>
                            {item.descriptionEnglish}
                          </p>
                          {item.descriptionHindi && (
                            <p className="text-[11px] text-erp-text-subtle mt-0.5">
                              {item.descriptionHindi}
                            </p>
                          )}
                        </td>

                        {/* UNIT */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {item.unit ? (
                            <span className="font-mono font-bold uppercase text-slate-200">
                              {item.unit}
                            </span>
                          ) : (
                            <span className="text-slate-600 font-bold">—</span>
                          )}
                        </td>

                        {/* RATE */}
                        <td className="py-3 px-4 text-right font-bold text-sm whitespace-nowrap font-mono">
                          {item.rate && item.rate > 0 ? (
                            <span className="text-emerald-400">
                              {formatCurrency(item.rate, 'INR')}
                            </span>
                          ) : (
                            <span className="text-slate-600 font-bold">—</span>
                          )}
                        </td>

                        {/* TYPE */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-semibold text-[10px] tracking-wide uppercase">
                            {item.workCategory || item.chapter || 'CIVIL WORK'}
                          </span>
                        </td>

                        {/* ACTION */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleCopyCode(item.itemCode)}
                            title="Copy SR No"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          >
                            {copiedCode === item.itemCode ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="p-3.5 bg-slate-900/60 border-t border-erp-border flex items-center justify-between text-xs text-erp-text-muted">
              <span>
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} rate items
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p: number) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                  className="px-2.5 py-1.5 rounded-lg border border-erp-border bg-slate-900 hover:bg-slate-800 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 rounded bg-slate-800 text-erp-text font-medium">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p: number) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-2.5 py-1.5 rounded-lg border border-erp-border bg-slate-900 hover:bg-slate-800 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SOR Import Modal */}
      <SorImportModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setResumeImportId(null);
        }}
        resumeImportId={resumeImportId}
        onPublished={() => {
          refetch();
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
            <p className="text-xs text-erp-text-muted">
              All multi-page SOR imports processed through the asynchronous pipeline.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchHistory()}
              leftIcon={<RotateCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
          </div>

          <div className="border border-erp-border rounded-xl overflow-hidden bg-slate-900/50">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#0E1320] border-b border-erp-border text-erp-text-muted">
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
              <tbody className="divide-y divide-erp-border">
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
                        <p className="font-semibold text-erp-text truncate max-w-xs">{imp.fileName}</p>
                        <p className="text-[10px] text-erp-text-subtle font-mono uppercase">{imp.fileType}</p>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">
                        {(imp.fileSize / (1024 * 1024)).toFixed(1)} MB
                      </td>
                      <td className="py-2.5 px-3">
                        <p className="text-slate-300">{imp.authority}</p>
                        <p className="text-[11px] text-erp-text-subtle">v{imp.version}</p>
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
                        {imp.status === 'Processing' && (
                          <div className="w-24 h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className="h-full bg-blue-500"
                              style={{ width: `${imp.progress.processingPercent}%` }}
                            />
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-400">
                        {imp.progress.rowsExtracted.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                        {new Date(imp.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setResumeImportId(imp._id);
                              setIsHistoryModalOpen(false);
                              setIsImportModalOpen(true);
                            }}
                            className="px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-[11px] font-medium border border-blue-500/30 flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {imp.status === 'Published' ? 'View' : 'Open'}
                          </button>
                        </div>
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
