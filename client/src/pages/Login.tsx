import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  HardHat,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Shield,
  ShieldCheck,
  Eye,
  EyeOff,
  Activity,
  CheckCircle2,
  Radio,
  Building2,
  Layers,
  Truck,
  Compass,
  Cpu,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('111111');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'manager' | 'engineer'>('admin');
  const [activeBackdrop, setActiveBackdrop] = useState<'night' | 'dusk'>('night');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Subtle floating ember/spark particle animation on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle spark system
    const particleCount = 45;
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.5 + 0.8,
      speedY: -(Math.random() * 0.8 + 0.3),
      speedX: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.6 + 0.2,
      pulse: Math.random() * 0.02 + 0.01,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.opacity += Math.sin(Date.now() * 0.002) * p.pulse;

        // Reset if goes off screen
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 158, 11, ${Math.max(0.1, Math.min(0.8, p.opacity))})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleRoleSelect = (role: 'admin' | 'manager' | 'engineer') => {
    setSelectedRole(role);
    setError(null);
    if (role === 'admin') {
      setEmail('admin@gmail.com');
      setPassword('111111');
    } else if (role === 'manager') {
      setEmail('manager@gmail.com');
      setPassword('111111');
    } else {
      setEmail('site@gmail.com');
      setPassword('111111');
    }
  };

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

  const bgImage = activeBackdrop === 'night' ? '/construction-night.jpg' : '/construction-bg.jpg';

  return (
    <div className="min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden font-sans bg-[#050811] text-slate-100 select-none">
      
      {/* =========================================
          CINEMATIC BACKDROP & ATMOSPHERE
          ========================================= */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Fullscreen High-Res Construction Visual */}
        <img
          src={bgImage}
          alt="High-Tech Construction Work Site"
          className="w-full h-full object-cover object-center animate-kenburns transition-all duration-1000 filter brightness-[0.7] contrast-[1.15]"
        />

        {/* Ambient Dark Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050811] via-[#050811]/70 to-[#050811]/85" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#050811]/50 to-[#050811]" />

        {/* Blueprint Grid Overlay */}
        <div className="absolute inset-0 blueprint-grid opacity-60" />

        {/* Golden-Amber Work Site Lighting Flares */}
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-amber-500/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-blue-500/10 rounded-full blur-[140px]" />

        {/* Construction Sparks Canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 z-10 pointer-events-none" />
      </div>

      {/* Top Construction Hazard Accent Line */}
      <div className="h-1.5 w-full hazard-bar relative z-30 shadow-lg shadow-amber-500/20" />

      {/* =========================================
          TOP NAVIGATION & TELEMETRY HEADER
          ========================================= */}
      <header className="relative z-20 w-full px-6 py-4 flex items-center justify-between">
        {/* Left: Branding badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900/90 border border-amber-500/40 p-2 shadow-lg shadow-amber-500/20 flex items-center justify-center backdrop-blur-md">
            <img src="/logo-dark.png" alt="InfraPilot" className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-white">InfraPilot</span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">
                360 ERP
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Mega-Infrastructure Command Center</span>
          </div>
        </div>

        {/* Right: Backdrop Theme Switcher & Telematics Status */}
        <div className="flex items-center gap-3">
          {/* Site Backdrop Toggle */}
          <button
            type="button"
            onClick={() => setActiveBackdrop(activeBackdrop === 'night' ? 'dusk' : 'night')}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-amber-500/30 hover:border-amber-500 text-xs text-slate-300 hover:text-white backdrop-blur-md transition-all shadow-md group cursor-pointer"
            title="Toggle between Holographic Night Site and Sunset Dusk Construction Site"
          >
            <ImageIcon className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
            <span>Theme: {activeBackdrop === 'night' ? '🌃 Holographic Night' : '🌆 Sunset Skyline'}</span>
          </button>

          {/* Live Telemetry Ping */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-emerald-500/30 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-mono font-medium text-emerald-400 hidden md:inline">SITE SENSORS ACTIVE</span>
            <span className="text-[11px] font-mono text-slate-400">100% ONLINE</span>
          </div>
        </div>
      </header>

      {/* =========================================
          CENTER HERO AUTHENTICATION POD
          ========================================= */}
      <main className="relative z-20 flex-1 flex flex-col justify-center items-center px-4 py-8">
        
        {/* Holographic Card Container */}
        <div className="w-full max-w-[460px] relative">
          
          {/* Background Ambient Glow Behind Card */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-600/20 blur-xl opacity-75" />

          {/* Main Card */}
          <div className="relative rounded-3xl bg-[#090E1A]/90 border border-amber-500/35 backdrop-blur-2xl p-7 sm:p-9 shadow-2xl shadow-black/90">
            
            {/* Top Amber Light Bar */}
            <div className="absolute top-0 inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_rgba(245,158,11,0.8)]" />

            {/* Header Content */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-amber-500/50 shadow-xl shadow-amber-500/20 mb-3 relative group">
                <HardHat className="w-8 h-8 text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.7)] group-hover:scale-110 transition-transform duration-300" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-ping opacity-75" />
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                InfraPilot Access
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xs mx-auto">
                Sign in to manage projects, rate analyses, site logs & financial ledgers
              </p>
            </div>

            {/* Role Preset Selector Tabs */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Instant Demo Role Access
                </span>
                <span className="text-[10px] text-slate-500 font-mono">1-Click Fill</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800">
                <button
                  type="button"
                  onClick={() => handleRoleSelect('admin')}
                  className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    selectedRole === 'admin'
                      ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <span className="text-xs">👑 Admin</span>
                  <span className={`text-[9px] ${selectedRole === 'admin' ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>Full Master</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleSelect('manager')}
                  className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    selectedRole === 'manager'
                      ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <span className="text-xs">👷 Manager</span>
                  <span className={`text-[9px] ${selectedRole === 'manager' ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>Projects & BOQ</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleSelect('engineer')}
                  className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    selectedRole === 'engineer'
                      ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <span className="text-xs">📐 Engineer</span>
                  <span className={`text-[9px] ${selectedRole === 'engineer' ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>MB & DPR</span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Work Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Work Email</span>
                  <span className="text-[10px] text-slate-500 font-mono">Company ID</span>
                </label>
                <div className="relative group">
                  <Mail className="w-4 h-4 text-slate-500 group-focus-within:text-amber-400 transition-colors absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    autoComplete="email"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">Password</label>
                  <span className="text-[10px] text-slate-500 font-mono">Encrypted</span>
                </div>
                <div className="relative group">
                  <Lock className="w-4 h-4 text-slate-500 group-focus-within:text-amber-400 transition-colors absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full pl-10 pr-11 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none p-1 transition-colors cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* CTA Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-3 py-3 px-4 rounded-xl font-extrabold text-sm text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Connecting to Site Telemetry...</span>
                  </div>
                ) : (
                  <>
                    <span>ENTER COMMAND CENTER</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Registration & Security Footer */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 text-center space-y-2.5">
              <p className="text-xs text-slate-400">
                Setup new organization or administrator?{' '}
                <Link
                  to="/register"
                  className="text-amber-400 hover:text-amber-300 hover:underline font-bold transition-colors ml-1 inline-flex items-center gap-1"
                >
                  Register with Master Key →
                </Link>
              </p>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                <Shield className="w-3.5 h-3.5 text-amber-500/70" />
                <span>Protected by 6-Character Master Security Protocol</span>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* =========================================
          BOTTOM LIVE TELEMETRY & COMPLIANCE BAR
          ========================================= */}
      <footer className="relative z-20 border-t border-slate-800/80 bg-[#06090F]/90 backdrop-blur-md px-6 py-3 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 font-mono gap-3">
        {/* Left Ticker */}
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            18 Tower Cranes Active
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            Skyline Mega-Project Slab 28 Poured (86%)
          </span>
          <span className="text-slate-600 hidden md:inline">•</span>
          <span className="hidden md:flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            CPWD & DSR 2023 Calibrated
          </span>
        </div>

        {/* Right Info */}
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span>TLS 256-Bit</span>
          <span>•</span>
          <span>v2.4.0 Engine</span>
          <span>•</span>
          <span>© {new Date().getFullYear()} BuildForce 360</span>
        </div>
      </footer>

    </div>
  );
};
