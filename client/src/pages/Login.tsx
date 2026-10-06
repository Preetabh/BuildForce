import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HardHat, Lock, Mail, ArrowRight, AlertCircle, Sparkles, Shield, ShieldCheck } from 'lucide-react';
import { Button } from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [canRegister, setCanRegister] = useState(false);

  useEffect(() => {
    // Check if initial admin setup is required (no admin exists in DB)
    api
      .get('/auth/setup-status')
      .then((res) => {
        if (res.data?.data?.canRegister) {
          setCanRegister(true);
        } else {
          setCanRegister(false);
        }
      })
      .catch(() => {
        // Fallback: registration remains closed if API error
        setCanRegister(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user, company } = response.data.data;
      login(token, user, company);
      navigate('/');
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string } } };
      setError(errObj.response?.data?.message || 'Invalid credentials or server unavailable');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@gmail.com');
    setPassword('111111');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#090D16] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Lighting Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#161F30] via-[#0E1528] to-black border border-amber-500/40 shadow-2xl shadow-amber-500/20 mb-4 p-2.5">
            <img src="/logo-dark.png" alt="InfraPilot Logo" className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            InfraPilot
          </h1>
          <p className="text-sm text-erp-text-muted mt-1">
            Construction Project Management & Estimation Platform
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-erp-border shadow-2xl">
          {/* Quick Demo Credentials Pill */}
          <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
            <div className="text-xs">
              <span className="font-semibold text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Demo Credentials Ready
              </span>
              <span className="text-erp-text-muted">admin@civilguruji.com</span>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-xs font-bold px-2.5 py-1 bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 rounded-md transition-colors shadow-sm"
            >
              Fill Demo
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-erp-text mb-1">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-erp-text-subtle absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-erp-border rounded-lg text-sm text-erp-text placeholder:text-erp-text-subtle focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-erp-text mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-erp-text-subtle absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-erp-border rounded-lg text-sm text-erp-text placeholder:text-erp-text-subtle focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to ERP
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/[0.08] text-center space-y-2">
            <p className="text-xs text-slate-400">
              Need to register as an Administrator?{' '}
              <Link
                to="/register"
                className="text-amber-400 hover:text-amber-300 hover:underline font-bold transition-colors"
              >
                Register with Master Key
              </Link>
            </p>
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <Shield className="w-3 h-3 text-amber-500/70" />
              <span>Protected by 6-Character Master Security Key</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
