import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from './Sidebar';
import { AiAssistantWidget } from '../common/AiAssistantWidget';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();

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
    <div className="min-h-screen bg-erp-bg flex relative">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        deletedCount={deletedCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <main className="flex-1 pb-16">
          <Outlet context={{ setSidebarOpen, deletedCount }} />
        </main>
      </div>

      {/* Floating AI Copilot Assistant Widget */}
      <AiAssistantWidget />
    </div>
  );
};
