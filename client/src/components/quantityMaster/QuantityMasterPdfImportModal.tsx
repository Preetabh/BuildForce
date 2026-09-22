import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  X,
  Sparkles,
  ArrowRight,
  Boxes,
  Users,
  Truck,
  Calculator,
  Receipt,
  RotateCcw,
  Search,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import api from '../../services/api';
import {
  downloadSamplePdfTemplate,
  downloadSampleExcelTemplate,
} from '../../utils/quantityMasterPdfExport';

export type MasterType = 'materials' | 'manpower' | 'machinery' | 'formulas' | 'rate-lists';

interface QuantityMasterPdfImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: MasterType;
  onImportSuccess: (msg: string) => void;
}

export const QuantityMasterPdfImportModal: React.FC<QuantityMasterPdfImportModalProps> = ({
  isOpen,
  onClose,
  initialType = 'materials',
  onImportSuccess,
}) => {
  const [selectedType, setSelectedType] = useState<MasterType>(initialType);
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parsed Review State
  const [parsedData, setParsedData] = useState<{
    totalDetected: number;
    validCount: number;
    items: any[];
    rawTextPreview?: string;
  } | null>(null);

  const [previewSearch, setPreviewSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when type changes
  const handleTypeChange = (newType: MasterType) => {
    setSelectedType(newType);
    setFile(null);
    setParsedData(null);
    setError(null);
  };

  const handleFileSelect = (selectedFile: File) => {
    const name = selectedFile.name.toLowerCase();
    const isSupported =
      name.endsWith('.pdf') ||
      name.endsWith('.xlsx') ||
      name.endsWith('.xls') ||
      name.endsWith('.csv');

    if (!isSupported) {
      setError('Please select a valid .pdf, .xlsx, .xls, or .csv document');
      return;
    }
    setFile(selectedFile);
    setError(null);
    handleParseFile(selectedFile, selectedType);
  };

  const handleParseFile = async (fileToParse: File, typeToUse: MasterType) => {
    setIsParsing(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', fileToParse);
    formData.append('type', typeToUse);

    try {
      const response = await api.post('/quantity-master/import-pdf/parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data?.success && response.data?.data) {
        setParsedData(response.data.data);
      } else {
        setError('No items could be extracted. Please check the file layout.');
      }
    } catch (err: any) {
      console.error('File Parse failed:', err);
      setError(err?.response?.data?.message || 'Failed to parse document. Ensure it contains text tables.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleCommit = async () => {
    if (!parsedData || !parsedData.items.length) return;

    setIsCommitting(true);
    setError(null);

    try {
      const response = await api.post('/quantity-master/import-pdf/commit', {
        type: selectedType,
        items: parsedData.items,
        fileName: file?.name,
      });

      if (response.data?.success) {
        onImportSuccess(response.data.message || 'Items successfully imported in bulk!');
        onClose();
      } else {
        setError('Bulk commit failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Commit failed:', err);
      setError(err?.response?.data?.message || 'Failed to commit items to database.');
    } finally {
      setIsCommitting(false);
    }
  };

  const filteredPreviewItems = (parsedData?.items || []).filter((item) => {
    if (!previewSearch) return true;
    const s = previewSearch.toLowerCase();
    return (
      (item.name && item.name.toLowerCase().includes(s)) ||
      (item.code && item.code.toLowerCase().includes(s)) ||
      (item.category && item.category.toLowerCase().includes(s))
    );
  });

  const getCatalogIcon = (t: MasterType) => {
    switch (t) {
      case 'materials':
        return <Boxes className="w-4 h-4 text-emerald-400" />;
      case 'manpower':
        return <Users className="w-4 h-4 text-blue-400" />;
      case 'machinery':
        return <Truck className="w-4 h-4 text-amber-400" />;
      case 'formulas':
        return <Calculator className="w-4 h-4 text-purple-400" />;
      case 'rate-lists':
        return <Receipt className="w-4 h-4 text-rose-400" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-glow">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Fast Bulk Import & Extraction (PDF, Excel, CSV)
            </h2>
            <p className="text-xs text-slate-400">
              Import Materials, Manpower, Machinery, Formulas or Rate Lists from PDF, Excel (.xlsx, .xls) or CSV
            </p>
          </div>
        </div>
      }
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Type Selection Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#090D16] border border-slate-800 rounded-xl">
          {(
            [
              { id: 'materials', label: 'Materials' },
              { id: 'manpower', label: 'Manpower' },
              { id: 'machinery', label: 'Machinery' },
              { id: 'formulas', label: 'Formulas' },
              { id: 'rate-lists', label: 'Rate Lists' },
            ] as { id: MasterType; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => handleTypeChange(t.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedType === t.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              {getCatalogIcon(t.id)}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Action helper bar: Download sample templates */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-blue-950/20 border border-blue-800/30 text-xs">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-slate-300">
              Expected layout templates for{' '}
              <strong className="text-white capitalize">{selectedType.replace('-', ' ')}</strong>:
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <button
              onClick={() => downloadSampleExcelTemplate(selectedType)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/25 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/40 text-xs font-medium transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Sample Excel (.xlsx)</span>
            </button>
            <button
              onClick={() => downloadSamplePdfTemplate(selectedType)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/25 hover:bg-blue-600 text-blue-200 hover:text-white border border-blue-500/40 text-xs font-medium transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Sample PDF</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Upload State or Parsed Review State */}
        {!parsedData ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.[0]) {
                handleFileSelect(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
              isParsing
                ? 'border-blue-500/50 bg-blue-500/5'
                : 'border-slate-700/80 hover:border-blue-500 hover:bg-slate-800/30 bg-[#0E1320]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            {isParsing ? (
              <div className="space-y-3">
                <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-semibold text-white">
                  Extracting and structuring data from {file?.name}...
                </p>
                <p className="text-xs text-slate-400">
                  Parsing codes, quantities, descriptions, and Indian Rupee rates
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto shadow-glow">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Drag and drop your file here, or browse
                  </p>
                  <div className="flex items-center justify-center gap-1.5 my-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      PDF
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      EXCEL (.XLSX)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      XLS
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      CSV
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Supports tables, SOR lists, vendor rate cards, BOQs, and spreadsheets up to 50MB
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Staged Items Preview Table */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#0E1320] border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      {parsedData.totalDetected} Items Detected
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                      {parsedData.validCount} Valid
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">File: {file?.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => {
                    setParsedData(null);
                    setFile(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Choose Another File</span>
                </button>
              </div>
            </div>

            {/* Quick Search inside preview */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={previewSearch}
                onChange={(e) => setPreviewSearch(e.target.value)}
                placeholder="Filter extracted items by name, code or category..."
                className="w-full pl-9 pr-3 py-2 bg-[#090D16] border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Table */}
            <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-800 bg-[#0A0D16]">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[#131928] text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">
                      {selectedType === 'formulas' ? 'Formula / Work Item' : 'Item Name'}
                    </th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3 text-center">Unit</th>
                    {selectedType === 'formulas' ? (
                      <th className="py-2.5 px-3 min-w-[260px]">Resources & Factors (Materials / Manpower / Machinery)</th>
                    ) : (
                      <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                    )}
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredPreviewItems.length === 0 ? (
                    <tr>
                      <td colSpan={selectedType === 'formulas' ? 7 : 7} className="py-8 text-center text-slate-400">
                        No items match filter
                      </td>
                    </tr>
                  ) : (
                    filteredPreviewItems.map((it: any, idx: number) => {
                      const rateVal = it.standardRate ?? it.standardDailyRate ?? it.standardHourlyRate ?? 0;
                      return (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="py-2 px-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                          <td className="py-2 px-3 text-white font-medium">
                            <div>
                              <span>{it.name}</span>
                              {it.description && (
                                <p className="text-[10px] text-slate-400 line-clamp-1">{it.description}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-slate-300">{it.category || 'General'}</td>
                          <td className="py-2 px-3 text-blue-400 font-mono text-[11px]">{it.code}</td>
                          <td className="py-2 px-3 text-center text-slate-300 uppercase">{it.unit || '—'}</td>
                          {selectedType === 'formulas' ? (
                            <td className="py-2 px-3">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {it.materialFactors && it.materialFactors.length > 0 && (
                                  <span
                                    title={it.materialFactors.map((m: any) => `${m.name}: ${m.factor} ${m.unit}`).join(', ')}
                                    className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 text-[10px] font-mono border border-blue-500/25"
                                  >
                                    🧱 {it.materialFactors.length} Mat (
                                    {it.materialFactors.slice(0, 2).map((m: any) => `${m.name.split(' ')[0]}: ${m.factor}`).join(', ')}
                                    {it.materialFactors.length > 2 ? '...' : ''})
                                  </span>
                                )}
                                {it.labourFactors && it.labourFactors.length > 0 && (
                                  <span
                                    title={it.labourFactors.map((l: any) => `${l.name}: ${l.factor} ${l.unit}`).join(', ')}
                                    className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[10px] font-mono border border-amber-500/25"
                                  >
                                    👷 {it.labourFactors.length} Lab (
                                    {it.labourFactors.slice(0, 2).map((l: any) => `${l.name.split(' ')[0]}: ${l.factor}`).join(', ')}
                                    {it.labourFactors.length > 2 ? '...' : ''})
                                  </span>
                                )}
                                {it.machineryFactors && it.machineryFactors.length > 0 && (
                                  <span
                                    title={it.machineryFactors.map((m: any) => `${m.name}: ${m.factor} ${m.unit}`).join(', ')}
                                    className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 text-[10px] font-mono border border-purple-500/25"
                                  >
                                    🚜 {it.machineryFactors.length} Mach
                                  </span>
                                )}
                                {(!it.materialFactors || it.materialFactors.length === 0) &&
                                  (!it.labourFactors || it.labourFactors.length === 0) &&
                                  (!it.machineryFactors || it.machineryFactors.length === 0) && (
                                    <span className="text-slate-500 text-[11px] italic">No factors</span>
                                  )}
                              </div>
                            </td>
                          ) : (
                            <td className="py-2 px-3 text-right font-bold text-white font-mono">
                              ₹{Number(rateVal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          )}
                          <td className="py-2 px-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Ready
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>

          {parsedData && (
            <Button
              variant="primary"
              onClick={handleCommit}
              isLoading={isCommitting}
              disabled={parsedData.totalDetected === 0}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Confirm & Bulk Import ({parsedData.totalDetected} Items)
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
