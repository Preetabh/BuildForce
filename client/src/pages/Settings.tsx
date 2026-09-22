import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Settings as SettingsIcon, Building, User, ShieldCheck, Database, Server } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';

interface OutletContextType {
  setSidebarOpen: (open: boolean) => void;
}

export const Settings: React.FC = () => {
  const { setSidebarOpen } = useOutletContext<OutletContextType>();
  const { user, company } = useAuth();

  return (
    <div>
      <Header
        breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Settings' }]}
        onToggleSidebar={() => setSidebarOpen(true)}
      />

      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-erp-text tracking-tight">System Settings</h1>
          <p className="text-sm text-erp-text-muted mt-1">
            Enterprise configuration, organization profile, and access credentials.
          </p>
        </div>

        {/* Company Profile Card */}
        <div className="glass-panel rounded-xl p-6 border border-erp-border space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-erp-text">Organization Profile</h3>
              <p className="text-xs text-erp-text-muted">Multi-tenant construction enterprise</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-erp-border/80">
            <div>
              <span className="text-xs text-erp-text-subtle block">Company Name</span>
              <span className="text-sm font-medium text-erp-text">{company?.name || 'N/A'}</span>
            </div>
            <div>
              <span className="text-xs text-erp-text-subtle block">Company Code</span>
              <span className="text-sm font-mono text-blue-400 font-semibold">
                {company?.code || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* User Account Card */}
        <div className="glass-panel rounded-xl p-6 border border-erp-border space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-erp-text">Current User Profile</h3>
              <p className="text-xs text-erp-text-muted">Session and role permissions</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-erp-border/80">
            <div>
              <span className="text-xs text-erp-text-subtle block">Full Name</span>
              <span className="text-sm font-medium text-erp-text">{user?.name || 'N/A'}</span>
            </div>
            <div>
              <span className="text-xs text-erp-text-subtle block">Email Address</span>
              <span className="text-sm font-medium text-erp-text">{user?.email || 'N/A'}</span>
            </div>
            <div>
              <span className="text-xs text-erp-text-subtle block">Assigned Role</span>
              <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {user?.role || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Technical Infrastructure Card */}
        <div className="glass-panel rounded-xl p-6 border border-erp-border space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-erp-text">Infrastructure & Storage</h3>
              <p className="text-xs text-erp-text-muted">Node.js + Express + MongoDB architecture</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-erp-border/80 text-xs">
            <div className="p-3 rounded-lg bg-slate-900 border border-erp-border">
              <span className="text-erp-text-subtle block mb-1 font-mono">Backend API Server</span>
              <span className="text-erp-text font-medium">http://localhost:5000/api</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-erp-border">
              <span className="text-erp-text-subtle block mb-1 font-mono">Database Persistence</span>
              <span className="text-erp-text font-medium">MongoDB 127.0.0.1:27017</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
