import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Home, ArrowLeft, EyeOff } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { useImpersonation } from '../context/ImpersonationContext';

interface ForbiddenAccessPageProps {
  permissionRequired?: string;
}

export const ForbiddenAccessPage: React.FC<ForbiddenAccessPageProps> = ({
  permissionRequired = 'Admin/Settings',
}) => {
  const navigate = useNavigate();
  const { roleDisplayName, isMasterAdmin } = usePermissions();
  const { isViewing, stopViewing, viewingUser } = useImpersonation();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-[#0D121F] border border-red-500/30 rounded-2xl p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.25)]">
          <ShieldAlert className="w-8 h-8 stroke-[2.2]" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-mono">
            403 • ACCESS RESTRICTED
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight pt-1">
            Permission Required
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
            Your current assigned role ({roleDisplayName}) does not possess authorization to access this feature.
          </p>
        </div>

        {/* Security Meta Card */}
        <div className="p-3 rounded-xl bg-[#141B2D] border border-slate-800 text-[11px] text-left font-mono space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span>Active Persona Role:</span>
            <span className="text-amber-400 font-bold">{roleDisplayName}</span>
          </div>
          {isViewing && viewingUser && (
            <div className="flex items-center justify-between text-slate-400">
              <span>Simulated User:</span>
              <span className="text-amber-300">{viewingUser.name} ({viewingUser.email})</span>
            </div>
          )}
          <div className="flex items-center justify-between text-slate-400">
            <span>Enforced Permission:</span>
            <span className="text-red-400 font-semibold">{permissionRequired}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Return to Allowed Dashboard</span>
          </button>

          {isViewing && (
            <button
              onClick={() => {
                stopViewing();
                navigate('/');
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
            >
              <EyeOff className="w-4 h-4 text-amber-400" />
              <span>Exit Viewing Mode</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
