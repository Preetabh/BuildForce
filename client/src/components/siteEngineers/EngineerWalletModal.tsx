import React, { useState, useEffect } from 'react';
import { Wallet, Coins, X } from 'lucide-react';
import { SiteEngineerItem } from '../../types/rbac';

interface EngineerWalletModalProps {
  engineer: SiteEngineerItem | null;
  onClose: () => void;
  onSubmit: (data: {
    id: string;
    amount: number;
    operation: 'add' | 'deduct' | 'set';
    notes?: string;
  }) => void;
  isSubmitting: boolean;
}

export const EngineerWalletModal: React.FC<EngineerWalletModalProps> = ({
  engineer,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [walletAmount, setWalletAmount] = useState<number>(5000);
  const [walletOperation, setWalletOperation] = useState<'add' | 'deduct' | 'set'>('add');
  const [walletNotes, setWalletNotes] = useState('');

  useEffect(() => {
    if (engineer) {
      setWalletAmount(5000);
      setWalletOperation('add');
      setWalletNotes('');
    }
  }, [engineer]);

  if (!engineer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: engineer._id,
      amount: Number(walletAmount) || 0,
      operation: walletOperation,
      notes: walletNotes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#0D121F] border border-emerald-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-[#1C2538] pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-400" />
              Site Engineer Wallet
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {engineer.name} ({engineer.loginId})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Balance Display */}
        <div className="p-4 rounded-xl bg-[#09151C] border border-emerald-500/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-400/80 tracking-wider block">
              Current Balance
            </span>
            <span className="text-2xl font-black text-white font-mono">
              ₹ {(engineer.walletBalance || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <Coins className="w-8 h-8 text-emerald-400/60" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Operation</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'add', label: '+ Credit' },
                { id: 'deduct', label: '- Debit' },
                { id: 'set', label: '= Set Fixed' },
              ].map((op) => (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => setWalletOperation(op.id as any)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    walletOperation === op.id
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                      : 'bg-[#141B2D] text-slate-400 border-[#232F4A] hover:text-white'
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Amount (₹)</label>
            <input
              type="number"
              min="0"
              step="100"
              required
              value={walletAmount}
              onChange={(e) => setWalletAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Remark / Purpose</label>
            <input
              type="text"
              value={walletNotes}
              onChange={(e) => setWalletNotes(e.target.value)}
              placeholder="e.g. Fuel expense allowance / Site emergency"
              className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#1C2538]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-[#141B2D] hover:bg-[#1A233A] font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            >
              {isSubmitting ? 'Updating...' : 'Confirm Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
