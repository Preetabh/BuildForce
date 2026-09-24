import React, { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';

interface ClassyAppLoaderProps {
  message?: string;
  isInitialBoot?: boolean;
  minDurationMs?: number;
  onFinish?: () => void;
  fullScreen?: boolean;
}

const DEFAULT_MESSAGES = [
  'Initializing BudgetPilot Engineering Engine...',
  'Connecting Master Schedule of Rates (SOR)...',
  'Calibrating Intelligent Measurement Book...',
  'Synchronizing Real-Time Portfolio Telemetry...',
  'Workspace Ready.',
];

export const ClassyAppLoader: React.FC<ClassyAppLoaderProps> = ({
  message,
  isInitialBoot = false,
  minDurationMs = 1200,
  onFinish,
  fullScreen = true,
}) => {
  const [progress, setProgress] = useState(15);
  const [statusIdx, setStatusIdx] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Progress counter animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        const increment = Math.floor(Math.random() * 18) + 12;
        return Math.min(100, prev + increment);
      });
    }, 180);

    // Status message rotator
    const messageInterval = setInterval(() => {
      setStatusIdx((prev) => (prev + 1) % DEFAULT_MESSAGES.length);
    }, 450);

    // Fade out and finish callback
    const finishTimeout = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        if (onFinish) onFinish();
      }, 400);
    }, minDurationMs);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      clearTimeout(finishTimeout);
    };
  }, [minDurationMs, onFinish]);

  return (
    <div
      className={cn(
        'z-[99999] flex flex-col items-center justify-center select-none overflow-hidden transition-all duration-400',
        fullScreen ? 'fixed inset-0 min-h-screen w-screen bg-[#070A12]' : 'w-full h-full min-h-[350px] bg-[#070A12]/95 rounded-2xl',
        isFadingOut ? 'opacity-0 scale-[1.02] pointer-events-none' : 'opacity-100 scale-100'
      )}
    >
      {/* Ambient Radial Neon Glow Backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-blue-600/15 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-cyan-500/15 rounded-full blur-[90px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[180px] bg-amber-500/10 rounded-full blur-[60px]" />

        {/* Blueprint Grid Lines Accent */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Main Core Container */}
      <div className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center">
        {/* Animated Futuristic Logo Ring */}
        <div className="relative mb-6">
          {/* Outer Rotating Conic Spinner */}
          <div
            className="absolute -inset-3 rounded-full p-[2px] animate-spin"
            style={{
              animationDuration: '3.5s',
              background: 'conic-gradient(from 0deg, transparent, #0284c7, #38bdf8, #f59e0b, transparent)',
            }}
          />

          {/* Secondary Counter-rotating subtle ring */}
          <div
            className="absolute -inset-2 rounded-full border border-dashed border-cyan-500/30 animate-spin"
            style={{ animationDuration: '8s', animationDirection: 'reverse' }}
          />

          {/* Logo Glass Pod */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#0c1220]/90 border border-cyan-500/40 p-3 shadow-2xl shadow-blue-500/30 backdrop-blur-xl flex items-center justify-center overflow-hidden group">
            {/* Shimmer Light Flare */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 animate-pulse pointer-events-none" />

            <img
              src="/logo-dark.png"
              alt="BudgetPilot Logo"
              className="w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(56,189,248,0.65)] transform hover:scale-105 transition-transform"
            />
          </div>

          {/* Rocket Ascent Pulse Dot */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-ping" />
        </div>

        {/* Brand Title with High-End Tracking */}
        <h1 className="text-xl sm:text-2xl font-black tracking-[0.25em] text-white uppercase flex items-center justify-center gap-1 font-mono">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-amber-300">
            BUDGETPILOT
          </span>
        </h1>

        <p className="text-[10px] tracking-[0.3em] uppercase text-cyan-400/80 font-semibold mt-1">
          Precision Construction ERP
        </p>

        {/* Minimalist Futuristic Progress Bar */}
        <div className="w-56 sm:w-64 h-1.5 bg-slate-900 border border-slate-800 rounded-full mt-7 overflow-hidden relative shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-amber-400 rounded-full transition-all duration-300 relative"
            style={{ width: `${progress}%` }}
          >
            {/* High-speed white flare */}
            <div className="absolute right-0 top-0 bottom-0 w-3 bg-white/80 blur-[2px] rounded-full" />
          </div>
        </div>

        {/* Dynamic Status Text & Percentage */}
        <div className="flex items-center justify-between w-56 sm:w-64 text-[11px] font-mono text-slate-400 mt-2.5">
          <span className="truncate pr-2 text-slate-300 animate-pulse">
            {message || DEFAULT_MESSAGES[statusIdx]}
          </span>
          <span className="text-cyan-400 font-bold shrink-0">{progress}%</span>
        </div>
      </div>
    </div>
  );
};
