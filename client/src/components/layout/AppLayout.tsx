import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from './Sidebar';
import { AiAssistantWidget } from '../common/AiAssistantWidget';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  // Sidebar dynamic width with localStorage persistence
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('budgetpilot_sidebar_width');
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
      return localStorage.getItem('budgetpilot_sidebar_minimized') === 'true';
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
        localStorage.setItem('budgetpilot_sidebar_minimized', 'false');
      } catch {
        // ignore
      }
    }
    try {
      localStorage.setItem('budgetpilot_sidebar_width', newWidth.toString());
    } catch {
      // ignore
    }
  };

  const handleToggleMinimize = () => {
    setIsMinimized((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('budgetpilot_sidebar_minimized', next.toString());
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
        <main className="flex-1 pb-16">
          <Outlet context={{ setSidebarOpen, deletedCount }} />
        </main>
      </div>

      {/* Floating AI Copilot Assistant Widget */}
      <AiAssistantWidget />
    </div>
  );
};
