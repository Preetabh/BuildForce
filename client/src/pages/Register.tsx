import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Lock,
  Mail,
  User,
  Building,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  ArrowLeft,
  KeyRound,
  Fingerprint,
  Zap,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Multi-step flow: 1 = Details, 2 = VIP Key Verification
  const [step, setStep] = useState<1 | 2>(1);

  // Form Fields (Full original fields)
  const [companyName, setCompanyName] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 6-character VIP verification key slots
  const [keySlots, setKeySlots] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // Focus the first key input when switching to step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 200);
    }
  }, [step]);

  // Handle Step 1: Validate original fields & proceed to Step 2
  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!companyName.trim() || !name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setStep(2);
  };

  // Handle discrete key slot changes
  const handleKeySlotChange = (index: number, val: string) => {
    const char = val.slice(-1).toUpperCase();
    const newSlots = [...keySlots];
    newSlots[index] = char;
    setKeySlots(newSlots);
    setError(null);

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !keySlots[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle clipboard paste (e.g. Z5K9N2)
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!pasted) return;

    const newSlots = [...keySlots];
    for (let i = 0; i < 6; i++) {
      newSlots[i] = pasted[i] || '';
    }
    setKeySlots(newSlots);

    const nextIdx = Math.min(pasted.length, 5);
    inputRefs.current[nextIdx]?.focus();
  };

  const triggerError = (msg: string) => {
    setError(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  // Final Step 2 submission
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const fullKey = keySlots.join('').trim();
    if (fullKey.length < 6) {
      triggerError('Please enter all 6 characters of the Admin Verification Key.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/register-admin', {
        companyName: companyName.trim(),
        companyCode: companyCode.trim() ? companyCode.toUpperCase() : undefined,
        name: name.trim(),
        email: email.trim(),
        password,
        adminKey: fullKey,
      });

      const { token, user, company } = response.data.data;
      login(token, user, company);
      navigate('/');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Invalid Admin Verification Key. Authorization denied.';
      triggerError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A12] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-10 relative overflow-hidden select-none">
      {/* Background Lighting Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#161F30] via-[#0E1528] to-black border border-amber-500/40 shadow-2xl shadow-amber-500/25 mb-3 p-2.5 relative group">
            <img
              src="/logo-dark.png"
              alt="InfraPilot Logo"
              className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]"
            />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 ring-2 ring-[#070A12] animate-pulse" />
          </div>

          {/* Stepper Indicator */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <span
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === 1 ? 'w-8 bg-amber-400' : 'w-3 bg-amber-400/40'
              }`}
            />
            <span
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === 2 ? 'w-8 bg-amber-400' : 'w-3 bg-white/20'
              }`}
            />
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight">
            {step === 1 ? 'Administrator Registration' : 'VIP Security Verification'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {step === 1
              ? 'Stage 1: Enter company & administrator profile details'
              : 'Stage 2: Enter Master Verification Key to unlock Admin post'}
          </p>
        </div>

        {/* ========================================================= */}
        {/* STAGE 1: FULL REGISTRATION FORM (OLD FIELDS RESTORED)     */}
        {/* ========================================================= */}
        {step === 1 && (
          <div className="bg-[#0D1424] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-left duration-300">
            {/* VIP Guarantee Banner */}
            <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Account will be provisioned directly with privileged <strong>ADMIN</strong> post.
              </span>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleProceedToStep2} className="space-y-3.5">
              {/* Company / Organization Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Company / Organization Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Apex Infrastructure Ltd"
                    required
                    className="w-full pl-10 pr-3 py-2.5 bg-[#080D18] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/60 transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Company Code (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Company Code (Optional)
                </label>
                <input
                  type="text"
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                  placeholder="e.g. APEX-01"
                  className="w-full px-3.5 py-2.5 bg-[#080D18] border border-white/[0.08] rounded-xl text-xs text-white uppercase font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/60 transition-all shadow-inner"
                />
              </div>

              {/* Divider */}
              <div className="border-t border-white/[0.06] pt-3">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Admin Full Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Er. Rajesh Sharma"
                    required
                    className="w-full pl-10 pr-3 py-2.5 bg-[#080D18] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/60 transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Admin Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Admin Email <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@buildforce.com"
                    required
                    className="w-full pl-10 pr-3 py-2.5 bg-[#080D18] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/60 transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Master Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Master Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    className="w-full pl-10 pr-3 py-2.5 bg-[#080D18] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/60 transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Next Step CTA */}
              <button
                type="submit"
                className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/25 border border-amber-300/40 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2 group"
              >
                <span>Continue to VIP Key Verification</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-amber-400 hover:underline font-semibold">
                Sign in here
              </Link>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STAGE 2: VIP PATTERN & FULL ANIMATION KEY VAULT           */}
        {/* ========================================================= */}
        {step === 2 && (
          <div
            className={`bg-[#0D1424] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-400 ${
              isShaking ? 'animate-shake' : ''
            }`}
          >
            {/* VIP Golden Scanline Effect */}
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-30 vip-scanline pointer-events-none" />

            {/* Glowing Shield VIP Vault Avatar */}
            <div className="text-center relative mb-5">
              <div className="relative inline-flex items-center justify-center">
                <div className="absolute w-20 h-20 rounded-full bg-amber-500/20 animate-ping opacity-60 pointer-events-none" />
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 p-0.5 shadow-xl shadow-amber-500/40 vip-glow-box">
                  <div className="w-full h-full rounded-[14px] bg-[#0A0F1D] flex items-center justify-center text-amber-400">
                    <Fingerprint className="w-8 h-8" />
                  </div>
                </div>
              </div>

              {/* VIP Clearance Pill */}
              <div className="mt-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-black uppercase tracking-widest shadow-inner">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>VIP SECURITY CLEARANCE LEVEL 1</span>
                </span>
              </div>

              {/* User / Company Capsule */}
              <div className="mt-2 text-center text-xs text-slate-400">
                <span className="text-white font-semibold">{companyName}</span> •{' '}
                <span className="text-slate-300">{name}</span>
                <div className="font-mono text-amber-400/90 text-[11px] mt-0.5">{email}</div>
              </div>
            </div>

            {/* ERROR DISPLAY */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            <form onSubmit={handleFinalSubmit} className="space-y-5">
              {/* EXACT PROMPT AS REQUESTED */}
              <div className="text-center space-y-1">
                <p className="text-sm sm:text-base font-extrabold text-white flex items-center justify-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>You are admin, please enter the key</span>
                </p>
                <p className="text-[11px] text-slate-400">
                  Enter the 6-character secret verification key from your backend configuration
                </p>
              </div>

              {/* VIP 6-SLOT DISCRETE PIN INPUT */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                {keySlots.map((slot, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    maxLength={1}
                    value={slot}
                    onChange={(e) => handleKeySlotChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-lg sm:text-xl font-mono font-black uppercase rounded-2xl border transition-all duration-200 focus:outline-none shadow-lg ${
                      slot
                        ? 'bg-amber-500/15 border-amber-400 text-amber-300 shadow-amber-500/20 scale-105'
                        : 'bg-[#080D18] border-white/[0.1] text-white hover:border-white/20'
                    } focus:border-amber-400 focus:ring-4 focus:ring-amber-500/30 focus:scale-110`}
                  />
                ))}
              </div>

              {/* Paste helper note */}
              <div className="text-center">
                <span className="text-[10px] text-slate-500 font-mono">
                  Tip: You can paste the full 6-character key directly
                </span>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-amber-500/30 border border-amber-300/40 transition-all cursor-pointer active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                    <span>Verifying Security Clearance...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                    <span>Unlock & Initialize Master Admin</span>
                  </>
                )}
              </button>

              {/* Back to Step 1 Button */}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep(1);
                }}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer py-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Profile Details</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
