import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  ShieldCheck,
  KeyRound,
  LogOut,
  ChevronDown,
  Settings,
  Sparkles,
  ExternalLink,
  History,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { UserProfileModal } from './UserProfileModal';

interface UserProfileMenuProps {
  className?: string;
  showRoleBadge?: boolean;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  className = '',
  showRoleBadge = true,
}) => {
  const navigate = useNavigate();
  const { user, company, logout } = useAuth();
  const { roleDisplayName, isMasterAdmin, canAccess } = usePermissions();

  const [isOpen, setIsOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'details' | 'permissions' | 'security' | 'activity'>('details');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const openProfileWithTab = (tab: 'details' | 'permissions' | 'security' | 'activity') => {
    setModalTab(tab);
    setIsModalOpen(true);
    setIsOpen(false);
  };

  const userInitial = (user?.name || user?.email || 'U').charAt(0).toUpperCase();
  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'User');
  const userEmail = user?.email || 'developer@gmail.com';

  const canAccessSettings = isMasterAdmin || canAccess('Admin/Settings');

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      {/* Clickable Profile Capsule Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-[#0E1524]/90 hover:bg-[#152035] border border-white/[0.08] hover:border-amber-500/40 shadow-sm transition-all duration-200 cursor-pointer select-none group"
        title="Click to view profile & options"
      >
        <div className="relative">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 font-black text-xs flex items-center justify-center shadow-md ring-2 ring-amber-500/40 group-hover:ring-amber-400 transition-all">
            {userInitial}
          </div>
          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#070A12] animate-pulse" />
        </div>

        <div className="hidden md:block text-left min-w-0 max-w-[170px]">
          <p className="text-[11px] font-bold text-slate-200 leading-tight truncate group-hover:text-amber-300 transition-colors">
            {displayName}
          </p>
          {showRoleBadge && (
            <p className="text-[9.5px] text-amber-400 font-semibold tracking-wide truncate">
              {roleDisplayName}
            </p>
          )}
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-amber-400' : ''
          }`}
        />
      </button>

      {/* Floating Profile Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-76 rounded-2xl bg-[#0D1424] border border-white/10 shadow-2xl shadow-black/95 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-2xl">
          {/* Header Card */}
          <div className="px-4 py-3 border-b border-slate-800/80 bg-gradient-to-b from-[#141d33] to-[#0f172a]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black text-sm flex items-center justify-center shadow-md ring-2 ring-amber-500/40 shrink-0">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{displayName}</p>
                <p className="text-[11px] text-slate-400 truncate font-mono">{userEmail}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {roleDisplayName}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">● Online</span>
                </div>
              </div>
            </div>

            {company && (
              <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                <span>{company.name}</span>
                <span className="font-mono text-amber-400/90 font-bold">{company.code}</span>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="p-1.5 space-y-0.5">
            <button
              type="button"
              onClick={() => openProfileWithTab('details')}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-xl transition-all cursor-pointer text-left"
            >
              <User className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="block font-semibold">My Profile & Account</span>
                <span className="text-[10px] text-slate-400">Edit name, phone & details</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => openProfileWithTab('permissions')}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-xl transition-all cursor-pointer text-left"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="block font-semibold">My Role & Permissions</span>
                <span className="text-[10px] text-slate-400">View accessible modules</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => openProfileWithTab('security')}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-xl transition-all cursor-pointer text-left"
            >
              <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="block font-semibold">Security & Password</span>
                <span className="text-[10px] text-slate-400">Change password, session</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => openProfileWithTab('activity')}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-xl transition-all cursor-pointer text-left"
            >
              <History className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="block font-semibold">Activity & Audit History</span>
                <span className="text-[10px] text-slate-400">View your session changes</span>
              </div>
            </button>

            {canAccessSettings && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/settings/audit-logs');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-xl transition-all cursor-pointer text-left"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="block font-semibold">Audit Logs Stream</span>
                    <span className="text-[10px] text-slate-400">Company-wide audit records</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/Admin/ManageRoles');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-xl transition-all cursor-pointer text-left"
                >
                  <Settings className="w-4 h-4 text-blue-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="block font-semibold">Role Management (RBAC)</span>
                    <span className="text-[10px] text-slate-400">Configure system authorities</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </button>
              </>
            )}
          </div>

          {/* Sign Out Action */}
          <div className="p-1.5 pt-1 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (window.confirm('Are you sure you want to sign out?')) {
                  logout();
                }
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer text-left"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Full User Profile Modal */}
      <UserProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialTab={modalTab}
      />
    </div>
  );
};
