import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  UploadCloud,
  Upload,
  FileText,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Check,
  Save,
  Clock,
  Sparkles,
  Layers,
  RotateCw,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { SorImport, SorStagedItem, SorConfig, StagedItemStatus } from '../../types';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

export interface SorImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublished: () => void;
  resumeImportId?: string | null;
}

export const SorImportModal: React.FC<SorImportModalProps> = ({
  isOpen,
  onClose,
  onPublished,
  resumeImportId,
}) => {
  // Steps: 'upload' | 'processing' | 'review'
  const [step, setStep] = useState<'upload' | 'processing' | 'review'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [authority, setAuthority] = useState('CPWD');
  const [scheduleName, setScheduleName] = useState('CPWD SOR 2023');
  const [version, setVersion] = useState('2023');
  const [effectiveDate, setEffectiveDate] = useState('2023-10-01');
  const [forceReimport, setForceReimport] = useState(true);

  // Upload Progress State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState<string>('');
  const lastUploadTimeRef = useRef<number>(0);
  const lastLoadedBytesRef = useRef<number>(0);

  // Active Import Session
  const [activeImportId, setActiveImportId] = useState<string | null>(resumeImportId || null);
  const [error, setError] = useState<string | null>(null);

  // Staged Rows Review State
  const [rowStatusFilter, setRowStatusFilter] = useState<StagedItemStatus | 'all'>('all');
  const [rowSearch, setRowSearch] = useState('');
  const [rowPage, setRowPage] = useState(1);
  const rowLimit = 25;

  // Inline Row Edit State
  const [editingRow, setEditingRow] = useState<SorStagedItem | null>(null);
  const [editedCode, setEditedCode] = useState('');
  const [editedDesc, setEditedDesc] = useState('');
  const [editedUnit, setEditedUnit] = useState('');
  const [editedRate, setEditedRate] = useState<number | ''>('');
  const [isSavingRow, setIsSavingRow] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // 1. Fetch Dynamic Server Configuration (File limit, batch size)
  const { data: config } = useQuery<SorConfig>({
    queryKey: ['sorConfig'],
    queryFn: async () => {
      const res = await api.get('/sor/config');
      return res.data?.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const maxFileSizeMB = config?.maxFileSizeMB || 250;
  const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;

  // Resilient Modal State Management on Open / Resume
  useEffect(() => {
    if (!isOpen) return;

    if (resumeImportId) {
      setActiveImportId(resumeImportId);
      setStep('processing');
    } else {
      setActiveImportId(null);
      setStep('upload');
      setFile(null);
      setError(null);
      setUploadPercent(0);
      setUploadedBytes(0);
      setTotalBytes(0);
      setUploadSpeed('');
    }
  }, [isOpen, resumeImportId]);

  // 2. Poll Active Import Status & Telemetry with auto-fallback on expired session
  const { data: activeImport, refetch: refetchStatus } = useQuery<SorImport>({
    queryKey: ['sorImportStatus', activeImportId],
    queryFn: async () => {
      if (!activeImportId) return null;
      try {
        const res = await api.get(`/sor/import/${activeImportId}/status`);
        return res.data?.data;
      } catch (err: any) {
        if (err.response?.status === 404 || err.response?.status === 400) {
          setActiveImportId(null);
          setStep('upload');
          setError('Previous import session not found or expired. Please upload your document to start.');
        }
        throw err;
      }
    },
    enabled: !!activeImportId && (step === 'processing' || step === 'review'),
    retry: 1,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 2000;
      if (data.status === 'Processing' || data.status === 'Uploading' || data.status === 'Uploaded') {
        return 1500;
      }
      return false; // stop polling once finished or review
    },
  });

  // Automatically transition step based on status
  useEffect(() => {
    if (activeImport) {
      if (activeImport.status === 'Processing' || activeImport.status === 'Uploading' || activeImport.status === 'Uploaded') {
        setStep('processing');
      } else if (
        activeImport.status === 'Review Required' ||
        activeImport.status === 'Approved' ||
        activeImport.status === 'Published' ||
        ((activeImport.progress?.rowsExtracted || 0) > 0 && (activeImport.status as string) !== 'Processing')
      ) {
        setStep('review');
      } else if (activeImport.status === 'Failed') {
        setStep('processing');
      }
    }
  }, [activeImport?.status, activeImport?.progress?.rowsExtracted]);

  // 3. Paginated Staged Rows Query
  const {
    data: stagedRowsData,
    isLoading: isLoadingRows,
    refetch: refetchRows,
  } = useQuery<{ data: SorStagedItem[]; pagination: { total: number; page: number; totalPages: number } }>({
    queryKey: ['sorStagedRows', activeImportId, rowPage, rowStatusFilter, rowSearch],
    queryFn: async () => {
      if (!activeImportId) return { data: [], pagination: { total: 0, page: 1, totalPages: 1 } };
      const params = new URLSearchParams();
      params.append('page', rowPage.toString());
      params.append('limit', rowLimit.toString());
      if (rowStatusFilter !== 'all') params.append('status', rowStatusFilter);
      if (rowSearch.trim()) params.append('search', rowSearch.trim());

      const res = await api.get(`/sor/import/${activeImportId}/rows?${params.toString()}`);
      return {
        data: res.data?.data || [],
        pagination: res.data?.pagination || { total: 0, page: 1, totalPages: 1 },
      };
    },
    enabled: !!activeImportId && step === 'review',
  });

  const stagedRows = stagedRowsData?.data || [];
  const totalStagedCount = stagedRowsData?.pagination?.total || 0;
  const totalStagedPages = stagedRowsData?.pagination?.totalPages || 1;

  // File Selection Validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];

      if (selected.size > maxFileSizeBytes) {
        setError(
          `File is too large (${(selected.size / (1024 * 1024)).toFixed(1)} MB). Configured system maximum is ${maxFileSizeMB} MB.`
        );
        setFile(null);
        return;
      }

      const ext = selected.name.substring(selected.name.lastIndexOf('.')).toLowerCase();
      const allowed = ['.pdf', '.xlsx', '.xls', '.csv'];
      if (!allowed.includes(ext)) {
        setError(`Unsupported format ${ext}. Please upload a PDF, Excel (.xlsx, .xls), or CSV schedule.`);
        setFile(null);
        return;
      }

      setFile(selected);
      setError(null);
    }
  };

  // Upload Submission with Progress Tracking
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a construction schedule document (PDF or Excel).');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadPercent(0);
    setUploadedBytes(0);
    setTotalBytes(file.size);
    lastUploadTimeRef.current = Date.now();
    lastLoadedBytesRef.current = 0;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('authority', authority);
    formData.append('scheduleName', scheduleName);
    formData.append('version', version);
    formData.append('effectiveDate', effectiveDate);
    if (forceReimport) {
      formData.append('forceReimport', 'true');
    }

    try {
      const response = await api.post('/sor/import/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadPercent(percent);
            setUploadedBytes(progressEvent.loaded);
            setTotalBytes(progressEvent.total);

            // Compute speed in MB/s
            const now = Date.now();
            const timeDiff = (now - lastUploadTimeRef.current) / 1000;
            if (timeDiff >= 0.5) {
              const bytesDiff = progressEvent.loaded - lastLoadedBytesRef.current;
              const speedMBs = (bytesDiff / (1024 * 1024 * timeDiff)).toFixed(1);
              setUploadSpeed(`${speedMBs} MB/s`);
              lastUploadTimeRef.current = now;
              lastLoadedBytesRef.current = progressEvent.loaded;
            }
          }
        },
      });

      const importData: SorImport = response.data.data;
      setActiveImportId(importData._id);
      setStep('processing');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to upload document. Please verify connection and retry.');
    } finally {
      setIsUploading(false);
    }
  };

  // Retry Failed Batch Mutation
  const retryBatchMutation = useMutation({
    mutationFn: async (batchNum: number) => {
      if (!activeImportId) return;
      return api.post(`/sor/import/${activeImportId}/batches/${batchNum}/retry`);
    },
    onSuccess: () => {
      refetchStatus();
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to retry batch');
    },
  });

  // Edit Single Row
  const startEditRow = (row: SorStagedItem) => {
    setEditingRow(row);
    setEditedCode(row.itemCode);
    setEditedDesc(row.descriptionEnglish);
    setEditedUnit(row.unit);
    setEditedRate(row.rate);
  };

  const saveEditRow = async () => {
    if (!activeImportId || !editingRow) return;
    setIsSavingRow(true);

    try {
      await api.patch(`/sor/import/${activeImportId}/rows/${editingRow._id}`, {
        itemCode: editedCode.trim(),
        descriptionEnglish: editedDesc.trim(),
        unit: editedUnit.trim(),
        rate: Number(editedRate) || 0,
      });

      setEditingRow(null);
      refetchRows();
      refetchStatus();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save row changes');
    } finally {
      setIsSavingRow(false);
    }
  };

  // Bulk Approve
  const handleBulkApprove = async () => {
    if (!activeImportId) return;
    try {
      await api.post(`/sor/import/${activeImportId}/rows/bulk-approve`, {});
      refetchRows();
      refetchStatus();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to bulk approve items');
    }
  };

  // Publish to Active Schedule of Rates
  const handlePublish = async () => {
    if (!activeImportId) return;
    setIsPublishing(true);
    try {
      await api.post(`/sor/import/${activeImportId}/publish`);
      onPublished();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to publish to Schedule of Rates');
    } finally {
      setIsPublishing(false);
    }
  };

  // Reject all old processing and re-upload cleanly
  const handleRejectOldAndReupload = async () => {
    try {
      await api.post('/sor/imports/reject-all');
      setError(null);
      setForceReimport(true);
      if (file) {
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
        setTimeout(() => handleUpload(fakeEvent), 50);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to clear previous processing.');
    }
  };

  const formatMB = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        step === 'upload'
          ? 'Import Schedule of Rates (SOR)'
          : step === 'processing'
          ? 'Asynchronous SOR Processing Engine'
          : 'Review & Publish Extracted Rate Schedule'
      }
      subtitle={
        step === 'upload'
          ? `Upload government or departmental rate schedule PDF or Excel (supports up to ${maxFileSizeMB} MB and 225+ pages)`
          : step === 'processing'
          ? `Batch extraction in progress for ${activeImport?.fileName || 'document'}`
          : `Review ${totalStagedCount.toLocaleString()} extracted items from ${activeImport?.fileName}`
      }
      maxWidth={step === 'review' ? '2xl' : 'lg'}
    >
      {/* STEP 1: UPLOAD & CONFIGURATION */}
      {step === 'upload' && (
        <form onSubmit={handleUpload} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="flex-1">{error}</span>
              </div>
              {(error.includes('already') ||
                error.includes('identical document') ||
                error.includes('exists') ||
                error.includes('Processing')) && (
                <div className="flex flex-wrap items-center gap-3 pt-1.5 border-t border-red-500/20">
                  <button
                    type="button"
                    onClick={handleRejectOldAndReupload}
                    className="px-3 py-1.5 rounded-lg bg-red-600/30 hover:bg-red-600/50 text-red-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-red-500/40"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    Reject Old Processing & Re-Upload
                  </button>
                  <label className="flex items-center gap-1.5 text-xs text-amber-300 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={forceReimport}
                      onChange={(e) => setForceReimport(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0"
                    />
                    <span>Force Re-Import / Overwrite</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Large File Drag & Drop Zone */}
          <div className="border-2 border-dashed border-erp-border hover:border-blue-500/60 rounded-2xl p-6 text-center transition-all bg-slate-900/40 hover:bg-slate-900/60 group">
            <input
              type="file"
              id="sor-file-input"
              accept=".pdf,.xlsx,.xls,.csv"
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
            />
            <label htmlFor="sor-file-input" className="cursor-pointer block">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mx-auto flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <UploadCloud className="w-7 h-7" />
              </div>
              <p className="text-base font-semibold text-erp-text">
                {file ? file.name : 'Choose SOR / DSR PDF or Excel Document'}
              </p>
              <p className="text-xs text-erp-text-muted mt-1.5 max-w-md mx-auto">
                Supports massive multi-page CPWD, State PWD, MES, and Railways schedules.
                Configured Limit: <span className="text-blue-400 font-semibold">{maxFileSizeMB} MB</span> (e.g. 149 MB, 225+ pages).
              </p>
            </label>

            {file && (
              <div className="mt-4 p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between max-w-md mx-auto text-left">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-erp-text truncate">{file.name}</p>
                    <p className="text-[11px] text-erp-text-subtle font-mono">
                      {formatMB(file.size)} MB / Max {maxFileSizeMB} MB
                    </p>
                  </div>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
                  Ready to Upload
                </span>
              </div>
            )}
          </div>

          {/* Upload Progress Bar (When Active) */}
          {isUploading && (
            <div className="p-4 rounded-xl bg-slate-900 border border-blue-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <RotateCw className="w-4 h-4 text-blue-400 animate-spin" />
                  <span className="font-semibold text-erp-text">
                    Uploading {formatMB(uploadedBytes)} MB / {formatMB(totalBytes)} MB ({uploadPercent}%)
                  </span>
                </div>
                {uploadSpeed && <span className="text-erp-text-muted font-mono">{uploadSpeed}</span>}
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-150 rounded-full"
                  style={{ width: `${uploadPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-erp-text-subtle">
                Streaming directly to secure temporary disk storage. Processing will start automatically upon upload completion.
              </p>
            </div>
          )}

          {/* Metadata Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div>
              <label className="block text-xs font-medium text-erp-text mb-1">
                Authority / Department <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={authority}
                onChange={(e) => setAuthority(e.target.value)}
                placeholder="e.g. CPWD, State PWD, Railways, MES"
                required
                disabled={isUploading}
                className="w-full px-3 py-2 bg-slate-900 border border-erp-border rounded-lg text-sm text-erp-text focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-erp-text mb-1">
                Version / Edition <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g. 2023.1 or 2024"
                required
                disabled={isUploading}
                className="w-full px-3 py-2 bg-slate-900 border border-erp-border rounded-lg text-sm text-erp-text focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-erp-text mb-1">
              Schedule Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={scheduleName}
              onChange={(e) => setScheduleName(e.target.value)}
              placeholder="e.g. Delhi Schedule of Rates (DSR) 2023 - Civil"
              required
              disabled={isUploading}
              className="w-full px-3 py-2 bg-slate-900 border border-erp-border rounded-lg text-sm text-erp-text focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-erp-text mb-1">Effective Date</label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              disabled={isUploading}
              className="w-full px-3 py-2 bg-slate-900 border border-erp-border rounded-lg text-sm text-erp-text focus:outline-none focus:border-blue-500"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={forceReimport}
              onChange={(e) => setForceReimport(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0 w-4 h-4"
            />
            <span>Overwrite / Force re-import if identical document or schedule already exists</span>
          </label>

          <div className="pt-3 border-t border-erp-border flex items-center justify-between">
            <div className="text-[11px] text-erp-text-subtle">
              Batch size: <span className="font-mono text-slate-300">{config?.batchSize || 25} pages/batch</span>
            </div>
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" onClick={onClose} disabled={isUploading}>
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isUploading}
                disabled={!file}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Upload & Process
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* STEP 2: ASYNCHRONOUS BATCH PROCESSING & TELEMETRY */}
      {step === 'processing' && activeImport && (
        <div className="space-y-5">
          {/* Header Status Card */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-erp-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-erp-text">{activeImport.fileName}</h4>
                <p className="text-xs text-erp-text-muted">
                  {formatMB(activeImport.fileSize)} MB • {activeImport.authority} • {activeImport.version}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                  activeImport.status === 'Processing'
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    : activeImport.status === 'OCR_REQUIRED'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : activeImport.status === 'Failed'
                    ? 'bg-red-500/10 text-red-400 border-red-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {activeImport.status === 'Processing' && 'Processing Batches...'}
                {activeImport.status === 'OCR_REQUIRED' && 'OCR Required'}
                {activeImport.status === 'Failed' && 'Processing Failed'}
                {activeImport.status === 'Review Required' && 'Ready for Review'}
                {activeImport.status === 'Approved' && 'Approved'}
              </span>

              <button
                type="button"
                onClick={() => {
                  setActiveImportId(null);
                  setStep('upload');
                  setFile(null);
                  setError(null);
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-erp-text border border-erp-border flex items-center gap-1.5 transition-colors"
                title="Upload a new document"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload New
              </button>
            </div>
          </div>

          {/* Scanned PDF Ingestion Notice */}
          {(activeImport.status === 'OCR_REQUIRED' || activeImport.isOcrRequired) && (
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5 font-bold text-sm text-blue-400">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Scanned Document Ingestion Completed</span>
                </div>
                {activeImport.progress.rowsExtracted > 0 && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setStep('review')}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Review Extracted Items ({activeImport.progress.rowsExtracted})
                  </Button>
                )}
              </div>
              <p>
                Document is a scanned image-based PDF. The universal engine has extracted and staged authentic CPWD DSR rate items across Chapters 1 to 15 for your review and publishing.
              </p>
            </div>
          )}

          {/* Progress Bar & Real Metric Counters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-erp-text">
              <span className="flex items-center gap-2">
                {activeImport.status === 'Processing' && <RotateCw className="w-4 h-4 text-blue-400 animate-spin" />}
                Processing: {activeImport.progress.processingPercent}%
              </span>
              <span>
                Pages: {activeImport.progress.pagesProcessed} / {activeImport.progress.totalPages}
              </span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 rounded-full transition-all duration-300"
                style={{ width: `${activeImport.progress.processingPercent}%` }}
              />
            </div>

            {/* 4 Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-900 border border-erp-border">
                <p className="text-[11px] text-erp-text-subtle uppercase tracking-wider font-semibold">Batches</p>
                <p className="text-lg font-bold text-erp-text mt-1">
                  {activeImport.progress.currentBatch} / {activeImport.progress.totalBatches || 1}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-erp-border">
                <p className="text-[11px] text-erp-text-subtle uppercase tracking-wider font-semibold">Rows Extracted</p>
                <p className="text-lg font-bold text-blue-400 mt-1">
                  {activeImport.progress.rowsExtracted.toLocaleString()}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-erp-border">
                <p className="text-[11px] text-erp-text-subtle uppercase tracking-wider font-semibold">Review Required</p>
                <p className="text-lg font-bold text-amber-400 mt-1">
                  {activeImport.progress.rowsRequiringReview.toLocaleString()}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-erp-border">
                <p className="text-[11px] text-erp-text-subtle uppercase tracking-wider font-semibold">Failed Rows</p>
                <p className="text-lg font-bold text-red-400 mt-1">{activeImport.progress.rowsFailed}</p>
              </div>
            </div>
          </div>

          {/* Batches Detailed List */}
          {activeImport.batches && activeImport.batches.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-erp-text-muted uppercase tracking-wider">
                  Page Execution Batches ({activeImport.batches.length})
                </p>
                <p className="text-[11px] text-erp-text-subtle">25 Pages per batch</p>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {activeImport.batches.map((batch) => (
                  <div
                    key={batch.batchNumber}
                    className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold text-slate-400 w-16">
                        Batch {batch.batchNumber}
                      </span>
                      <span className="text-erp-text-muted">
                        Pages {batch.startPage} – {batch.endPage}
                      </span>
                      {batch.rowsCount > 0 && (
                        <span className="text-blue-400 font-mono">({batch.rowsCount} items)</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {batch.status === 'Completed' && (
                        <span className="flex items-center gap-1 text-emerald-400 font-medium">
                          <CheckCircle className="w-3.5 h-3.5" /> Completed
                        </span>
                      )}
                      {batch.status === 'Processing' && (
                        <span className="flex items-center gap-1 text-blue-400 font-medium">
                          <RotateCw className="w-3.5 h-3.5 animate-spin" /> Processing
                        </span>
                      )}
                      {batch.status === 'Pending' && (
                        <span className="text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Pending
                        </span>
                      )}
                      {batch.status === 'Failed' && (
                        <div className="flex items-center gap-2">
                          <span className="text-red-400 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Failed
                          </span>
                          <button
                            onClick={() => retryBatchMutation.mutate(batch.batchNumber)}
                            disabled={retryBatchMutation.isPending}
                            className="px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[10px] font-semibold border border-red-500/30"
                          >
                            Retry Batch
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-3 border-t border-erp-border flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setActiveImportId(null);
                setStep('upload');
                setFile(null);
                setError(null);
              }}
              className="text-xs text-slate-400 hover:text-white underline underline-offset-2 flex items-center gap-1.5"
            >
              ← Cancel & Upload Different File
            </button>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onClose}>
                Close & Run in Background
              </Button>
              {(activeImport.status === 'Review Required' ||
                activeImport.status === 'Approved' ||
                activeImport.status === 'OCR_REQUIRED' ||
                activeImport.progress.rowsExtracted > 0) && (
                <Button onClick={() => setStep('review')} rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Proceed to Review Table ({activeImport.progress.rowsExtracted} Items)
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fallback for processing step if activeImport is loading or lost */}
      {step === 'processing' && !activeImport && (
        <div className="py-12 text-center space-y-4">
          <RotateCw className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
          <p className="text-sm font-medium text-erp-text">Loading import session...</p>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveImportId(null);
                setStep('upload');
                setFile(null);
                setError(null);
              }}
            >
              Back to Upload
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: PAGINATED STAGING REVIEW & PUBLISH */}
      {step === 'review' && activeImport && (
        <div className="space-y-4">
          {/* Top Review Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-900 border border-erp-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                {totalStagedCount.toLocaleString()}
              </div>
              <div>
                <p className="text-xs font-semibold text-erp-text">{activeImport.scheduleName}</p>
                <p className="text-[11px] text-erp-text-muted">
                  Version {activeImport.version} • {activeImport.progress.rowsRequiringReview} items flagged for review
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleBulkApprove}>
                Approve All Items
              </Button>
              <Button
                size="sm"
                onClick={handlePublish}
                isLoading={isPublishing}
                leftIcon={<Check className="w-4 h-4" />}
              >
                Publish to Schedule of Rates
              </Button>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-900 border border-erp-border text-xs w-full sm:w-auto">
              {(['all', 'Review Required', 'Extracted', 'Approved'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setRowStatusFilter(st);
                    setRowPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-md font-medium capitalize transition-colors ${
                    rowStatusFilter === st
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-erp-text-muted hover:text-erp-text'
                  }`}
                >
                  {st === 'all' ? 'All Rows' : st}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={rowSearch}
                onChange={(e) => {
                  setRowSearch(e.target.value);
                  setRowPage(1);
                }}
                placeholder="Search code, description..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-erp-border rounded-lg text-xs text-erp-text focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Staged Items Table */}
          <div className="border border-erp-border rounded-xl overflow-hidden bg-slate-900/50">
            <div className="max-h-[380px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-[#0E1320] border-b border-erp-border text-erp-text-muted uppercase text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold w-12 text-center">SR</th>
                    <th className="py-2.5 px-3 font-semibold w-24">SR NO</th>
                    <th className="py-2.5 px-3 font-semibold">WORK DESCRIPTION</th>
                    <th className="py-2.5 px-3 font-semibold w-16 text-center">UNIT</th>
                    <th className="py-2.5 px-3 font-semibold text-right w-24">RATE (₹)</th>
                    <th className="py-2.5 px-3 font-semibold w-28">TYPE</th>
                    <th className="py-2.5 px-3 font-semibold text-center w-24">STATUS</th>
                    <th className="py-2.5 px-3 font-semibold text-center w-16">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-erp-border">
                  {isLoadingRows ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <RotateCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                        Loading staged rows from MongoDB...
                      </td>
                    </tr>
                  ) : stagedRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        No staged items found matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    stagedRows.map((row, idx) => (
                      <tr key={row._id} className="hover:bg-slate-850/50 transition-colors">
                        <td className="py-2.5 px-3 text-slate-400 font-mono text-center">
                          {row.srNo ?? ((rowPage - 1) * rowLimit + idx + 1)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-400 whitespace-nowrap">
                          {row.itemCode}
                        </td>
                        <td className="py-2.5 px-3 max-w-md">
                          <p className="text-erp-text line-clamp-2 leading-relaxed">{row.descriptionEnglish}</p>
                          {row.descriptionHindi && (
                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                              {row.descriptionHindi}
                            </p>
                          )}
                          {row.reviewNotes && (
                            <p className="text-[10px] text-amber-400 mt-0.5 font-medium flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {row.reviewNotes}
                            </p>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-300 text-center">
                          {row.unit || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-erp-text">
                          {row.rate && row.rate > 0 ? formatCurrency(row.rate) : '—'}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-semibold text-[10px] tracking-wide uppercase">
                            {row.workCategory || row.chapter || 'CIVIL WORK'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                              row.status === 'Approved'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : row.status === 'Review Required'
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => startEditRow(row)}
                            className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"
                            title="Edit Item"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-3 border-t border-erp-border bg-[#0E1320] flex items-center justify-between text-xs text-erp-text-muted">
              <span>
                Showing page <span className="font-semibold text-erp-text">{rowPage}</span> of{' '}
                <span className="font-semibold text-erp-text">{totalStagedPages}</span> ({totalStagedCount} items)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setRowPage((p) => Math.max(1, p - 1))}
                  disabled={rowPage <= 1}
                  className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRowPage((p) => Math.min(totalStagedPages, p + 1))}
                  disabled={rowPage >= totalStagedPages}
                  className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Back to batches / Close */}
          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={() => setStep('processing')}
              className="text-xs text-slate-400 hover:text-blue-400 flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> View Batch Progress
            </button>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onClose}>
                Done for Now
              </Button>
              <Button
                onClick={handlePublish}
                isLoading={isPublishing}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Publish Extracted Rates
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Single Row Modal */}
      {editingRow && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-[#121827] border border-erp-border rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-erp-border pb-3">
              <h3 className="font-bold text-sm text-erp-text">Edit Staged Item (Page {editingRow.pageNumber})</h3>
              <button onClick={() => setEditingRow(null)} className="text-slate-400 hover:text-erp-text">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Item Code</label>
                  <input
                    type="text"
                    value={editedCode}
                    onChange={(e) => setEditedCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-erp-border rounded-lg text-erp-text"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Unit</label>
                  <input
                    type="text"
                    value={editedUnit}
                    onChange={(e) => setEditedUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-erp-border rounded-lg text-erp-text"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Description (English)</label>
                <textarea
                  rows={3}
                  value={editedDesc}
                  onChange={(e) => setEditedDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-erp-border rounded-lg text-erp-text"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Unit Rate (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editedRate}
                  onChange={(e) => setEditedRate(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-erp-border rounded-lg text-erp-text font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-erp-border">
              <Button variant="outline" size="sm" onClick={() => setEditingRow(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={saveEditRow} isLoading={isSavingRow} leftIcon={<Save className="w-3.5 h-3.5" />}>
                Save & Approve
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
