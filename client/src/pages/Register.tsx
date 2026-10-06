import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, User, Building, ArrowRight, AlertCircle, ShieldCheck, ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [companyName, setCompanyName] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Setup status check: is registration allowed?
  const [canRegister, setCanRegister] = useState<boolean | null>(null);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);

  useEffect(() => {
    api
      .get('/auth/setup-status')
      .then((res) => {
        setCanRegister(Boolean(res.data?.data?.canRegister));
      })
      .catch(() => {
        setCanRegister(false);
      })
      .finally(() => {
        setIsCheckingSetup(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!companyName || !name || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/register', {
        companyName,
        companyCode: companyCode ? companyCode.toUpperCase() : undefined,
        name,
        email,
        password,
      });

      const { token, user, company } = response.data.data;
      login(token, user, company);
      navigate('/');
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string } } };
      setError(
        errObj.response?.data?.message ||
          'Registration failed. An administrator may have already been configured.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A12] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
      {/* Background Lighting Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#161F30] via-[#0E1528] to-black border border-amber-500/40 shadow-2xl shadow-amber-500/20 mb-3 p-2.5">
            <img
              src="/logo-dark.png"
              alt="InfraPilot Logo"
              className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]"
            />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {canRegister ? 'Initial Administrator Setup' : 'InfraPilot Enterprise'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {canRegister
              ? 'No administrator found in database. Create the primary Master Admin account.'
              : 'Enterprise Construction & Engineering Platform'}
          </p>
        </div>

        {/* Loading State while checking DB status */}
        {isCheckingSetup ? (
          <div className="bg-[#0D1424] border border-white/[0.08] rounded-2xl p-8 text-center space-y-3 shadow-2xl backdrop-blur-xl">
            <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Verifying administrator setup status...</p>
          </div>
        ) : !canRegister ? (
          /* Locked State: An Admin already exists in DB */
          <div className="bg-[#0D1424] border border-white/[0.08] rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-2xl backdrop-blur-xl animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-950/40">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-black text-white">Public Registration Disabled</h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                An active <strong className="text-amber-400">Administrator</strong> account already
                exists in this database. Public signup is strictly disabled for enterprise security.
              </p>
              <p className="text-[11px] text-slate-500 pt-1">
                New user accounts and roles must be provisioned directly by the Administrator inside
                the system.
              </p>
            </div>

            <div className="pt-3 border-t border-white/[0.08]">
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Active Setup State: Zero admins exist in DB -> Initial Setup Form */
          <div className="bg-[#0D1424] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl animate-in fade-in duration-200">
            {/* Master Admin Notice Banner */}
            <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                This account will be designated with the authoritative <strong>ADMIN</strong> post.
              </span>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Company / Organization Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Apex Infrastructure Ltd"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-[#080D18] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/60 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Company Code (Optional)
                </label>
                <input
                  type="text"
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                  placeholder="e.g. APEX-01"
                  className="w-full px-3 py-2 bg-[#080D18] border border-white/[0.08] rounded-xl text-xs text-white uppercase font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/60 transition-all shadow-inner"
                />
              </div>

              <div className="border-t border-white/[0.06] pt-3">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Master Admin Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Er. Rajesh Sharma"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-[#080D18] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/60 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Master Admin Email <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@apexinfra.com"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-[#080D18] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/60 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Master Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-[#080D18] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/60 transition-all shadow-inner"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/25 border border-amber-300/40 transition-all cursor-pointer active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <span>Initialize Master Admin Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-slate-500">
              Already initialized?{' '}
              <Link to="/login" className="text-amber-400 hover:underline font-semibold">
                Sign in here
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
