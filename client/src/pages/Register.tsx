import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HardHat, Lock, Mail, User, Building, ArrowRight, AlertCircle } from 'lucide-react';
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
      setError(errObj.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
      {/* Background Lighting Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-glow mb-3 text-white">
            <HardHat className="w-7 h-7 text-amber-300" />
          </div>
          <h1 className="text-2xl font-extrabold text-erp-text tracking-tight">
            Register Construction Company
          </h1>
          <p className="text-xs text-erp-text-muted mt-1">
            Setup multi-tenant construction workspace and admin account
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-erp-border shadow-2xl">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-erp-text mb-1">
                Company / Organization Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-erp-text-subtle absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Digi Epitome Technology"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-erp-border rounded-lg text-sm text-erp-text placeholder:text-erp-text-subtle focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-erp-text mb-1">
                Company Code (Optional)
              </label>
              <input
                type="text"
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                placeholder="e.g. APEX-INFR"
                className="w-full px-3 py-2 bg-slate-900 border border-erp-border rounded-lg text-sm text-erp-text uppercase font-mono placeholder:text-erp-text-subtle focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="border-t border-erp-border/60 pt-3">
              <label className="block text-xs font-medium text-erp-text mb-1">
                Admin Full Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-erp-text-subtle absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Er. Rajesh Sharma"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-erp-border rounded-lg text-sm text-erp-text placeholder:text-erp-text-subtle focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-erp-text mb-1">
                Admin Email <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-erp-text-subtle absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-erp-border rounded-lg text-sm text-erp-text placeholder:text-erp-text-subtle focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-erp-text mb-1">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-erp-text-subtle absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-erp-border rounded-lg text-sm text-erp-text placeholder:text-erp-text-subtle focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-3"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Initialize Workspace
            </Button>
          </form>

          <div className="mt-5 text-center text-xs text-erp-text-muted">
            Already registered?{' '}
            <Link to="/login" className="text-blue-400 hover:underline font-medium">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
