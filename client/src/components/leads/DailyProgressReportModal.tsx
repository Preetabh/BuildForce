import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Clock,
  History,
  Send,
  Camera,
  Coins,
  HardHat,
  Package,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { ClientRecord, ClientDprReport } from '../../types';
import leadService from '../../services/lead.service';

interface DailyProgressReportModalProps {
  isOpen: boolean;
  client: ClientRecord | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DailyProgressReportModal: React.FC<DailyProgressReportModalProps> = ({
  isOpen,
  client,
  onClose,
  onSuccess,
}) => {
  const [workCompletedToday, setWorkCompletedToday] = useState('');
  const [materialsUsed, setMaterialsUsed] = useState('');
  const [nextDayPlan, setNextDayPlan] = useState('');
  const [labourCost, setLabourCost] = useState<number>(0);
  const [materialCost, setMaterialCost] = useState<number>(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [reports, setReports] = useState<ClientDprReport[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen && client) {
      setWorkCompletedToday('');
      setMaterialsUsed('');
      setNextDayPlan('');
      setLabourCost(0);
      setMaterialCost(0);
      setPhotos([]);
      setError('');
      setSuccessMsg('');
      setReports(client.dailyProgressReports || []);
    }
  }, [isOpen, client]);

  if (!isOpen || !client) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files).slice(0, 5);
      const fileNames = filesArray.map((f) => f.name);
      setPhotos(fileNames);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workCompletedToday.trim()) {
      setError('Please describe what tasks were accomplished today.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const updated = await leadService.submitDpr(client._id, {
        workCompletedToday: workCompletedToday.trim(),
        materialsUsed: materialsUsed.trim(),
        nextDayPlan: nextDayPlan.trim(),
        siteKharcha: {
          labourCost: Number(labourCost) || 0,
          materialCost: Number(materialCost) || 0,
        },
        sitePhotos: photos,
      });

      setReports(updated.dailyProgressReports || []);
      setWorkCompletedToday('');
      setMaterialsUsed('');
      setNextDayPlan('');
      setLabourCost(0);
      setMaterialCost(0);
      setPhotos([]);
      setSuccessMsg("Today's Progress Report submitted successfully!");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#14161D] border border-amber-500/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Header (Matches Screenshot 2) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F2430] bg-[#14161D]">
          <div>
            <h2 className="text-xl font-black text-amber-400 tracking-wide">
              Daily Progress Report
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Reporting for:{' '}
              <strong className="text-white font-bold">{client.name}</strong>
              <span className="text-amber-400 font-semibold ml-1">
                | History on the right →
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Container (2 Columns: Form on Left, History on Right) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar flex flex-col md:flex-row gap-6">
          {/* LEFT COLUMN: Report Form */}
          <form onSubmit={handleSubmit} className="flex-1 space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* 1. WORK COMPLETED TODAY */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wide">
                <span>1. WORK COMPLETED TODAY</span>
              </label>
              <textarea
                rows={4}
                value={workCompletedToday}
                onChange={(e) => setWorkCompletedToday(e.target.value)}
                placeholder="Describe what tasks were accomplished today..."
                className="w-full bg-[#181B24] border border-[#252A38] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors resize-none leading-relaxed"
                required
              />
            </div>

            {/* 2. MATERIALS USED & 3. NEXT DAY PLAN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wide">
                  2. MATERIALS USED
                </label>
                <input
                  type="text"
                  value={materialsUsed}
                  onChange={(e) => setMaterialsUsed(e.target.value)}
                  placeholder="Pipes, Cement, etc."
                  className="w-full bg-[#181B24] border border-[#252A38] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wide">
                  3. NEXT DAY PLAN
                </label>
                <input
                  type="text"
                  value={nextDayPlan}
                  onChange={(e) => setNextDayPlan(e.target.value)}
                  placeholder="What's the goal for tomorrow?"
                  className="w-full bg-[#181B24] border border-[#252A38] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            {/* 5. AAJ KA SITE KHARCHA (OPTIONAL) - Green Border Card */}
            <div className="bg-[#121B1B] border border-emerald-500/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-emerald-400 font-black text-xs uppercase tracking-wide">
                <span>₹ 5. AAJ KA SITE KHARCHA (OPTIONAL)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 uppercase tracking-wide">
                    <HardHat className="w-3.5 h-3.5" />
                    <span>LABOUR COST (₹)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={labourCost || ''}
                      onChange={(e) => setLabourCost(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full bg-[#152323] border border-emerald-500/30 rounded-xl pl-8 pr-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 uppercase tracking-wide">
                    <Package className="w-3.5 h-3.5" />
                    <span>MATERIAL COST (₹)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={materialCost || ''}
                      onChange={(e) => setMaterialCost(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full bg-[#152323] border border-emerald-500/30 rounded-xl pl-8 pr-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 flex items-center gap-1 pt-1">
                <span>ℹ</span>
                <span>Ye optional hai — sirf tab bharein jab koi kharcha hua ho aaj.</span>
              </p>
            </div>

            {/* SITE PHOTOS (BEFORE & AFTER) - Dotted Border Box */}
            <div className="border border-dashed border-[#31394D] bg-[#161922] rounded-2xl p-4 space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wide cursor-pointer">
                <Camera className="w-4 h-4" />
                <span>SITE PHOTOS (BEFORE & AFTER)</span>
              </label>

              <div className="flex items-center gap-3">
                <label className="px-3.5 py-1.5 bg-[#222838] hover:bg-[#2C344A] text-slate-200 text-xs font-semibold rounded-lg border border-[#353E58] cursor-pointer transition-colors inline-block">
                  Choose files
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-slate-400 font-mono truncate">
                  {photos.length > 0 ? `${photos.length} files selected (${photos.join(', ')})` : 'No file chosen'}
                </span>
              </div>

              <p className="text-[10px] text-slate-500">
                Max 5 photos recommended for faster submission.
              </p>
            </div>

            {/* Submit Today's Progress Report (Golden Button) */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
              <span>{isSubmitting ? 'Submitting Report...' : "Submit Today's Progress Report"}</span>
            </button>
          </form>

          {/* RIGHT COLUMN: REPORT HISTORY */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-[#1F2430] pt-4 md:pt-0 md:pl-6 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F2430]">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>REPORT HISTORY</span>
              </span>
              <History className="w-4 h-4 text-slate-500" />
            </div>

            <div className="flex-1 py-4 flex flex-col justify-center overflow-y-auto max-h-[500px] custom-scrollbar">
              {reports.length === 0 ? (
                <div className="text-center py-16 text-slate-600 text-xs font-medium">
                  No reports found.
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map((rep, idx) => (
                    <div
                      key={rep._id || idx}
                      className="p-3.5 bg-[#171A24] border border-[#232938] rounded-xl space-y-2 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-amber-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(rep.reportDate).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-[10px] text-slate-400">By {rep.reportedBy || 'Admin'}</span>
                      </div>

                      <p className="text-xs text-white leading-relaxed font-medium">
                        {rep.workCompletedToday}
                      </p>

                      {rep.materialsUsed && (
                        <div className="text-[10.5px] text-slate-400">
                          <strong className="text-slate-300">Materials:</strong> {rep.materialsUsed}
                        </div>
                      )}

                      {rep.nextDayPlan && (
                        <div className="text-[10.5px] text-slate-400">
                          <strong className="text-slate-300">Next Plan:</strong> {rep.nextDayPlan}
                        </div>
                      )}

                      {rep.siteKharcha && (rep.siteKharcha.labourCost > 0 || rep.siteKharcha.materialCost > 0) && (
                        <div className="p-2 bg-[#101C1A] border border-emerald-500/20 rounded-lg text-[10.5px] text-emerald-300 flex justify-between font-mono">
                          <span>Labour: ₹{rep.siteKharcha.labourCost.toLocaleString()}</span>
                          <span>Material: ₹{rep.siteKharcha.materialCost.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
