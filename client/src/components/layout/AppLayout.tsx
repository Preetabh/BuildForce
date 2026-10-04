import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { AiAssistantWidget } from '../common/AiAssistantWidget';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useImpersonation } from '../../context/ImpersonationContext';

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { viewingUser, stopViewing, isViewing } = useImpersonation();

  const handleStopViewing = () => {
    stopViewing();
    if (location.pathname.startsWith('/leads')) {
      navigate('/leads', { replace: true });
    }
  };

  // Sidebar dynamic width with localStorage persistence
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('infrapilot_sidebar_width') || localStorage.getItem('budgetpilot_sidebar_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 210 && parsed <= 500) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return 260;
  });

  // Sidebar minimized state (collapsed to 68px rail) with localStorage persistence
  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    try {
      return (localStorage.getItem('infrapilot_sidebar_minimized') ?? localStorage.getItem('budgetpilot_sidebar_minimized')) === 'true';
    } catch {
      return false;
    }
  });

  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 768 : true;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSidebarWidthChange = (newWidth: number) => {
    setSidebarWidth(newWidth);
    if (isMinimized) {
      setIsMinimized(false);
      try {
        localStorage.setItem('infrapilot_sidebar_minimized', 'false');
      } catch {
        // ignore
      }
    }
    try {
      localStorage.setItem('infrapilot_sidebar_width', newWidth.toString());
    } catch {
      // ignore
    }
  };

  const handleToggleMinimize = () => {
    setIsMinimized((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('infrapilot_sidebar_minimized', next.toString());
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Effective sidebar width depending on whether it's minimized
  const effectiveWidth = isMinimized ? 68 : sidebarWidth;

  // Query recycle bin count for sidebar badge
  const { data: recycleBinData } = useQuery({
    queryKey: ['recycleBinCount'],
    queryFn: async () => {
      const res = await api.get('/projects/recycle-bin');
      return res.data?.data || [];
    },
    enabled: isAuthenticated,
    staleTime: 30000,
  });

  const deletedCount = Array.isArray(recycleBinData) ? recycleBinData.length : 0;

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex relative">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        deletedCount={deletedCount}
        width={sidebarWidth}
        onWidthChange={handleSidebarWidthChange}
        isMinimized={isMinimized}
        onToggleMinimize={handleToggleMinimize}
      />

      {/* Main Content Area */}
      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-200"
        style={{ paddingLeft: isDesktop ? `${effectiveWidth}px` : undefined }}
      >
        {/* Mobile Sticky Header (< md screens) */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-3.5 py-2.5 bg-[#0A0D14]/95 backdrop-blur-md border-b border-[#1A2234]">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl bg-[#141B2D] border border-[#222E48] text-amber-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse" />
              <span className="text-xs font-black tracking-widest uppercase font-mono text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
                BUILDFORCE 360
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
              A
            </div>
          </div>
        </header>

        {/* Data Scope Filter Banner: Viewing leads/records for a specific user */}
        {isViewing && viewingUser && (
          <div className="sticky top-0 z-40 bg-[#161B28]/95 backdrop-blur-md border-b border-amber-500/40 px-4 py-2 flex items-center justify-between text-xs shadow-lg animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="text-amber-300 font-bold flex items-center gap-1.5 flex-wrap">
                Filtered Data for User: <span className="text-white font-extrabold underline underline-offset-2">{viewingUser.name}</span>
                {viewingUser.role && (
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {viewingUser.role}
                  </span>
                )}
                <span className="text-[11px] text-slate-400 font-normal">
                  (Admin full permissions active)
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={handleStopViewing}
              className="px-2.5 py-1 rounded text-[11px] font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-white border border-amber-500/40 flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
            >
              ✕ Clear Filter (Show All Data)
            </button>
          </div>
        )}

        <main className="flex-1 pb-16">
          <Outlet context={{ setSidebarOpen, deletedCount }} />
        </main>
      </div>

      {/* Floating AI Copilot Assistant Widget */}
      <AiAssistantWidget />
    </div>
  );
};
