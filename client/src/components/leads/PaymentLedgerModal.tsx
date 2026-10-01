import React, { useState, useEffect } from 'react';
import {
  X,
  Calculator,
  Save,
  Clock,
  History,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Layers,
  ChevronDown,
  ChevronUp,
  Settings,
  Calendar,
} from 'lucide-react';
import { ClientRecord, ClientLedgerStage } from '../../types';
import leadService from '../../services/lead.service';

interface PaymentLedgerModalProps {
  isOpen: boolean;
  client: ClientRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

const DEFAULT_9_STAGES = [
  { stageName: 'Advance', percentage: 20 },
  { stageName: 'Slab', percentage: 20 },
  { stageName: 'Brick Work', percentage: 15 },
  { stageName: 'Electrical Work', percentage: 10 },
  { stageName: 'Plaster', percentage: 10 },
  { stageName: 'Tile Work', percentage: 10 },
  { stageName: 'Bathroom Fitting', percentage: 5 },
  { stageName: 'Painting Work', percentage: 5 },
  { stageName: 'Site Completion', percentage: 5 },
];

export const PaymentLedgerModal: React.FC<PaymentLedgerModalProps> = ({
  isOpen,
  client,
  onClose,
  onSuccess,
}) => {
  const [areaSqft, setAreaSqft] = useState<number>(100);
  const [ratePerSqft, setRatePerSqft] = useState<number>(80);
  const [discountPerSqft, setDiscountPerSqft] = useState<number>(0);

  const [stages, setStages] = useState<ClientLedgerStage[]>([]);
  const [showEstimator, setShowEstimator] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Pay Now Modal state
  const [activePayStage, setActivePayStage] = useState<ClientLedgerStage | null>(null);
  const [payAmountInput, setPayAmountInput] = useState<string>('');
  const [payMode, setPayMode] = useState<string>('UPI');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen && client) {
      const estimator = client.projectEstimator;
      if (estimator && estimator.areaSqft > 0) {
        setAreaSqft(estimator.areaSqft);
        setRatePerSqft(estimator.ratePerSqft);
        setDiscountPerSqft(estimator.discountPerSqft || 0);
      } else {
        const rawArea = parseFloat((client.area || '100').replace(/,/g, '')) || 100;
        setAreaSqft(rawArea);
        const rate = client.agreedAmount && rawArea > 0 ? Math.round(client.agreedAmount / rawArea) : 80;
        setRatePerSqft(rate || 80);
        setDiscountPerSqft(0);
      }

      if (client.ledgerStages && client.ledgerStages.length > 0) {
        setStages(client.ledgerStages);
        // If stages exist, collapse estimator to show the clean table view from screenshot
        setShowEstimator(false);
      } else {
        // Initialize default 9 stages based on agreedAmount or area * rate
        const total = client.agreedAmount || 8000;
        const todayFormatted = '01-10-2026';
        const initialStages: ClientLedgerStage[] = DEFAULT_9_STAGES.map((s) => {
          const amt = Math.round((total * s.percentage) / 100);
          return {
            stageName: s.stageName,
            percentage: s.percentage,
            amount: amt,
            targetDate: todayFormatted,
            paid: 0,
            due: amt,
            status: 'Pending',
          };
        });
        setStages(initialStages);
        setShowEstimator(false);

        // Auto-save schedule to MongoDB so each stage gets an ObjectId and is saved immediately
        const est = client.projectEstimator;
        leadService
          .saveLedgerSchedule(
            client._id,
            {
              areaSqft: est?.areaSqft || 1000,
              ratePerSqft: est?.ratePerSqft || Math.round(total / 1000),
              discountPerSqft: est?.discountPerSqft || 0,
              finalRate: est?.finalRate || Math.round(total / 1000),
              totalAmount: total,
            },
            initialStages
          )
          .then((updated) => {
            if (updated?.ledgerStages && updated.ledgerStages.length > 0) {
              setStages(updated.ledgerStages);
            }
          })
          .catch(() => {});
      }

      setError('');
      setSuccessMsg('');
      setActivePayStage(null);
    }
  }, [isOpen, client]);

  if (!isOpen || !client) return null;

  // Real-time calculation
  const finalRate = Math.max(0, ratePerSqft - discountPerSqft);
  const totalAmount = Math.round(areaSqft * finalRate);

  // Initialize or save schedule
  const handleInitializeSchedule = async () => {
    setIsSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const todayFormatted = '01-10-2026';
      // Compute stages based on calculated totalAmount
      const updatedStages: ClientLedgerStage[] = DEFAULT_9_STAGES.map((s) => {
        const amt = Math.round((totalAmount * s.percentage) / 100);
        return {
          stageName: s.stageName,
          percentage: s.percentage,
          amount: amt,
          targetDate: todayFormatted,
          paid: 0,
          due: amt,
          status: 'Pending',
        };
      });

      const updated = await leadService.saveLedgerSchedule(
        client._id,
        {
          areaSqft,
          ratePerSqft,
          discountPerSqft,
          finalRate,
          totalAmount,
        },
        updatedStages
      );

      setStages(updated.ledgerStages || updatedStages);
      setShowEstimator(false);
      setSuccessMsg('Payment schedule initialized and saved successfully!');
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save schedule');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle stage target date change
  const handleDateChange = async (index: number, newDate: string) => {
    const updatedStages = [...stages];
    updatedStages[index].targetDate = newDate;
    setStages(updatedStages);

    try {
      await leadService.saveLedgerSchedule(
        client._id,
        client.projectEstimator || {
          areaSqft,
          ratePerSqft,
          discountPerSqft,
          finalRate,
          totalAmount,
        },
        updatedStages
      );
    } catch {
      // Background save
    }
  };

  // Open Pay Now Modal for a specific stage
  const openPayModal = (stage: ClientLedgerStage) => {
    setActivePayStage(stage);
    setPayAmountInput(String(stage.due || 0));
    setPayMode('UPI');
    setError('');
  };

  // Submit payment (with cascading to next pending stages)
  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePayStage) return;

    const amount = parseFloat(payAmountInput);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    setIsProcessingPayment(true);
    setError('');

    try {
      const stageIdentifier = activePayStage._id || activePayStage.stageName || 'Advance';
      const updated = await leadService.payLedgerStage(
        client._id,
        stageIdentifier,
        amount,
        payMode
      );

      if (updated.ledgerStages) {
        setStages(updated.ledgerStages);
      }
      setSuccessMsg(`Payment of ₹${amount.toLocaleString()} recorded! Cascaded to pending stages.`);
      setActivePayStage(null);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Payment processing failed');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const totalStageAmount = stages.reduce((acc, s) => acc + (s.amount || 0), 0);
  const totalStagePaid = stages.reduce((acc, s) => acc + (s.paid || 0), 0);
  const totalStageDue = stages.reduce((acc, s) => acc + (s.due || 0), 0);

  const projectName = client.services || 'Renovation';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#12161E] border border-amber-500/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Header: Payment Ledger [ Client Name ] (Matches Screenshot) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2532] bg-[#12161E]">
          <h2 className="text-lg font-black text-amber-400 tracking-wide">
            Payment Ledger [ {client.name} ]
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Container (2 Columns) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar flex flex-col md:flex-row gap-5">
          {/* Left Column: CLIENT'S PROJECTS (Matches Screenshot) */}
          <div className="w-full md:w-56 shrink-0 space-y-2.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              CLIENT'S PROJECTS
            </div>

            {/* Active Project Card */}
            <div className="p-3.5 rounded-xl bg-[#171E2B] border-2 border-amber-400 shadow-md flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white capitalize leading-tight">
                  {projectName}
                </div>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9.5px] font-bold bg-[#20293C] text-slate-400">
                  {totalStageDue <= 0 && totalStageAmount > 0 ? 'Completed' : 'Pending'}
                </span>
              </div>
              <div className="flex items-center gap-1 font-mono text-xs font-bold text-slate-200">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>₹{totalStageDue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Right Column: ESTIMATOR TOGGLE & LEDGER TABLE (Matches Screenshot) */}
          <div className="flex-1 space-y-4">
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

            {/* ESTIMATOR COLLAPSIBLE CONTROLLER */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowEstimator(!showEstimator)}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#1A2232] hover:bg-[#232D42] text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-lg transition-all cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>{showEstimator ? 'Hide Estimator' : 'Modify Cost Estimator'}</span>
                {showEstimator ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* PROJECT COST ESTIMATOR (Only shown when expanded or schedule empty) */}
            {showEstimator && (
              <div className="bg-[#171E2B] border border-[#222B3D] rounded-xl p-4 sm:p-5 space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <Calculator className="w-4 h-4" />
                  <span>PROJECT COST ESTIMATOR</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  {/* Construction Area */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      CONSTRUCTION AREA (SQFT)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={areaSqft}
                      onChange={(e) => setAreaSqft(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#10141D] border border-[#263146] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Rate per sqft */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      RATE PER SQFT (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={ratePerSqft}
                      onChange={(e) => setRatePerSqft(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#10141D] border border-[#263146] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Discount */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      DISCOUNT (₹/SQFT)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={discountPerSqft}
                      onChange={(e) => setDiscountPerSqft(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#10141D] border border-[#263146] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Green Rate Box */}
                  <div className="bg-[#0E1A1A] border border-emerald-500/40 rounded-lg p-2.5 text-right font-mono text-[11px] space-y-0.5">
                    <div className="flex justify-between items-center text-slate-400 text-[10px]">
                      <span>FINAL RATE:</span>
                      <span className="text-emerald-400 font-bold">₹{finalRate.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300 font-bold">
                      <span>TOTAL:</span>
                      <span className="text-emerald-400 text-xs">₹{totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Button */}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleInitializeSchedule}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 stroke-[2.5]" />
                    <span>{isSaving ? 'SAVING...' : 'INITIALIZE / SAVE SCHEDULE'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* LEDGER SECTION (Exact Match to User Screenshot) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white tracking-wide">
                  {projectName} Ledger
                </h3>
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#1C2433] hover:bg-[#253044] text-slate-300 border border-[#2B384E] text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  <span>History</span>
                </button>
              </div>

              {/* Table Container (Matches User Screenshot) */}
              <div className="bg-[#10141D] border border-[#1E2532] rounded-xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-white text-slate-800 text-[10px] font-black uppercase tracking-wider select-none whitespace-nowrap">
                        <th className="py-2.5 px-3 text-center w-8">S.N.</th>
                        <th className="py-2.5 px-3">CONSTRUCTION STAGE</th>
                        <th className="py-2.5 px-3 text-center">PERCENTAGE (%)</th>
                        <th className="py-2.5 px-3 text-right">AMOUNT (₹)</th>
                        <th className="py-2.5 px-3 text-center">TARGET DATE</th>
                        <th className="py-2.5 px-3 text-right text-emerald-600">PAID (₹)</th>
                        <th className="py-2.5 px-3 text-right text-rose-600">DUE (₹)</th>
                        <th className="py-2.5 px-3 text-center">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1B2230] text-slate-200">
                      {stages.map((stage, idx) => (
                        <tr key={stage._id || idx} className="hover:bg-[#161C28] transition-colors">
                          {/* S.N. */}
                          <td className="py-2.5 px-3 text-center font-mono text-slate-400 font-semibold">
                            {idx + 1}
                          </td>

                          {/* CONSTRUCTION STAGE */}
                          <td className="py-2.5 px-3 font-semibold text-white">
                            {stage.stageName}
                          </td>

                          {/* PERCENTAGE (%) */}
                          <td className="py-2.5 px-3 text-center">
                            <span className="font-mono font-bold text-amber-400 bg-[#1A2232] border border-[#263146] px-2 py-0.5 rounded text-[10.5px]">
                              {stage.percentage}%
                            </span>
                          </td>

                          {/* AMOUNT (₹) */}
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                            ₹{(stage.amount || 0).toLocaleString()}
                          </td>

                          {/* TARGET DATE (Dark Input Box) */}
                          <td className="py-2 px-3 text-center">
                            <input
                              type="text"
                              value={stage.targetDate || '01-10-2026'}
                              onChange={(e) => handleDateChange(idx, e.target.value)}
                              className="w-28 bg-[#0D1017] border border-[#232B3B] text-slate-300 font-mono text-center px-2 py-1 rounded text-[11px] focus:outline-none focus:border-amber-400"
                            />
                          </td>

                          {/* PAID (₹) */}
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                            ₹{(stage.paid || 0).toLocaleString()}
                          </td>

                          {/* DUE (₹) */}
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                            ₹{(stage.due || 0).toLocaleString()}
                          </td>

                          {/* ACTION: Pay Now Blue Button */}
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            {stage.due <= 0 && stage.amount > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>PAID</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openPayModal(stage)}
                                className="px-3.5 py-1 bg-[#1D64F2] hover:bg-[#1A56DB] text-white font-bold text-[10.5px] rounded-md shadow-sm transition-all cursor-pointer"
                              >
                                Pay Now
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}

                      {/* TOTAL PROJECT BALANCE ROW (Emerald Green banner in screenshot) */}
                      <tr className="bg-[#0A3326] text-emerald-300 font-bold text-xs">
                        <td colSpan={3} className="py-3 px-4 uppercase tracking-wider font-mono text-emerald-300">
                          TOTAL PROJECT BALANCE
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-300 font-bold">
                          ₹{totalStageAmount.toLocaleString()}
                        </td>
                        <td></td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-300 font-bold">
                          ₹{totalStagePaid.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-rose-400 font-bold">
                          ₹{totalStageDue.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-center text-[10px] text-emerald-300/90 font-medium leading-tight">
                          Payments cascade to next pending stage
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer with Close Button (Matches Screenshot) */}
        <div className="px-6 py-3 border-t border-[#1E2532] bg-[#12161E] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-1.5 bg-[#1B2230] hover:bg-[#252E40] text-slate-300 font-bold text-xs rounded-xl border border-[#2B374C] transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Pay Now Cascading Payment Sub-Modal */}
      {activePayStage && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#141822] border border-blue-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#222B3D]">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Record Payment: <span className="text-amber-400">{activePayStage.stageName}</span>
                </h3>
                <p className="text-[10px] text-slate-400">
                  Payments cascade to next pending stage automatically
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePayStage(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Amount to Pay (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={payAmountInput}
                    onChange={(e) => setPayAmountInput(e.target.value)}
                    className="w-full bg-[#0F131B] border border-[#283244] rounded-xl pl-7 pr-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-blue-400"
                    required
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>Stage Due: ₹{(activePayStage.due || 0).toLocaleString()}</span>
                  <span>Total Project Due: ₹{totalStageDue.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Payment Mode
                </label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value)}
                  className="w-full bg-[#0F131B] border border-[#283244] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="UPI">UPI / QR Code</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer / NEFT / RTGS</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActivePayStage(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  className="px-5 py-2 bg-[#1D64F2] hover:bg-[#1A56DB] text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  {isProcessingPayment ? 'Processing...' : 'Confirm & Cascade Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment History Submodal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#141A26] border border-amber-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#222B3D]">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <History className="w-4 h-4" />
                <span>Payment & Stage Transaction History</span>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
              <div className="p-3 bg-[#10141D] rounded-xl border border-[#1E273A] text-xs space-y-1">
                <div className="flex justify-between font-bold text-white">
                  <span>Advance / Project Booking</span>
                  <span className="text-emerald-400 font-mono">₹{client.paidAmount?.toLocaleString() || 0}</span>
                </div>
                <div className="text-[10px] text-slate-400 flex justify-between">
                  <span>Client Code: {client.clientCode}</span>
                  <span>{new Date(client.registrationDate).toLocaleDateString('en-GB')}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
