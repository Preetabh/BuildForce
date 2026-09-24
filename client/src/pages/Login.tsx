import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HardHat, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
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
    setEmail('admin@civilguruji.com');
    setPassword('Civil@123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Lighting Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0c1426] via-[#080d19] to-black border border-cyan-500/40 shadow-2xl shadow-blue-500/30 mb-4 p-2.5">
            <img src="/logo-dark.png" alt="BudgetPilot Logo" className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            BudgetPilot
          </h1>
          <p className="text-sm text-erp-text-muted mt-1">
            Construction Project Management & Estimation Platform
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-erp-border shadow-2xl">
          {/* Quick Demo Credentials Pill */}
          <div className="mb-6 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
            <div className="text-xs">
              <span className="font-semibold text-blue-400 block flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Demo Credentials Ready
              </span>
              <span className="text-erp-text-muted">admin@civilguruji.com</span>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-xs font-semibold px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors"
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
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-erp-border rounded-lg text-sm text-erp-text placeholder:text-erp-text-subtle focus:outline-none focus:border-blue-500"
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
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-erp-border rounded-lg text-sm text-erp-text placeholder:text-erp-text-subtle focus:outline-none focus:border-blue-500"
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

          <div className="mt-6 text-center text-xs text-erp-text-muted">
            Don't have an enterprise account?{' '}
            <Link to="/register" className="text-blue-400 hover:underline font-medium">
              Create one now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
