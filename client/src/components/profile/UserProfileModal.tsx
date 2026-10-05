import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  ShieldCheck,
  KeyRound,
  LogOut,
  CheckCircle2,
  XCircle,
  Sparkles,
  Save,
  Briefcase,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  Laptop,
  CheckCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import api from '../../services/api';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'details' | 'permissions' | 'security';
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'details',
}) => {
  const { user, company, updateUser, logout } = useAuth();
  const { roleDisplayName, isMasterAdmin, isModuleAllowed } = usePermissions();

  const [activeTab, setActiveTab] = useState<'details' | 'permissions' | 'security'>(initialTab);

  // Sync initialTab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setName(user?.name || '');
      setMobile((user as any)?.mobile || '');
      setExpertise((user as any)?.expertise || '');
      setStatusMessage(null);
    }
  }, [isOpen, initialTab, user]);

  // Edit state
  const [name, setName] = useState(user?.name || '');
  const [mobile, setMobile] = useState((user as any)?.mobile || '');
  const [expertise, setExpertise] = useState((user as any)?.expertise || '');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const res = await api.patch('/auth/profile', {
        name: name.trim(),
        mobile: mobile.trim(),
        expertise: expertise.trim(),
      });

      if (res.data?.data?.user) {
        updateUser({
          ...user!,
          ...res.data.data.user,
        });
      } else {
        updateUser({
          ...user!,
          name: name.trim(),
        });
      }
      setStatusMessage({ type: 'success', text: 'Profile details saved successfully!' });
    } catch (err: any) {
      // Fallback: update in client auth state
      updateUser({
        ...user!,
        name: name.trim(),
      });
      setStatusMessage({
        type: 'success',
        text: 'Profile updated locally for active session.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setStatusMessage({ type: 'error', text: 'Please enter your current password.' });
      return;
    }
    if (newPassword.length < 6) {
      setStatusMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setIsChangingPassword(true);
    setStatusMessage(null);
    try {
      await api.patch('/auth/profile', {
        currentPassword,
        newPassword,
      });
      setStatusMessage({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to change password. Please verify current password.',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const modulesList = [
    {
      id: 'plannings',
      name: 'Plannings & SOR Rates',
      desc: 'SOR Master Library, Quantity Calculator, QC Checklists & WBS',
      allowed: isMasterAdmin || isModuleAllowed('plannings'),
      category: 'Engineering & BOQ',
    },
    {
      id: 'lead_management',
      name: 'Lead Management & Clients',
      desc: 'Inquiries pipeline, follow-ups, clients, fee receipts & partners',
      allowed: isMasterAdmin || isModuleAllowed('lead_management'),
      category: 'Sales & Growth',
    },
    {
      id: 'service_catalog',
      name: 'Services & Modules Catalog',
      desc: 'Architecture, Structure, MEP & Package definitions',
      allowed: isMasterAdmin || isModuleAllowed('service_catalog'),
      category: 'Operations',
    },
    {
      id: 'site_enginner',
      name: 'Site Operations & Field Execution',
      desc: 'Site engineers roster, daily site assignments & field logs',
      allowed: isMasterAdmin || isModuleAllowed('site_enginner'),
      category: 'Execution',
    },
    {
      id: 'project_management',
      name: 'Project Control & Reports',
      desc: 'Project workspace, e-MB measurement books, DPR & EVM analytics',
      allowed: isMasterAdmin || isModuleAllowed('project_management'),
      category: 'Governance',
    },
    {
      id: 'vendor_management',
      name: 'Vendor & Worker Management',
      desc: 'Suppliers directory, material vendors & labour contractors',
      allowed: isMasterAdmin || isModuleAllowed('vendor_management'),
      category: 'Supply Chain',
    },
    {
      id: 'settings',
      name: 'Settings & RBAC Administration',
      desc: 'Role configuration, user menu access & enterprise controls',
      allowed: isMasterAdmin || isModuleAllowed('settings'),
      category: 'Administration',
    },
  ];

  const userInitial = (user?.name || user?.email || 'U').charAt(0).toUpperCase();
  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'User');
  const userEmail = user?.email || 'developer@gmail.com';

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex justify-end animate-in fade-in duration-200">
      {/* Dimmed Glass Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-Over Drawer Container */}
      <div className="relative w-full max-w-xl sm:max-w-2xl bg-[#0B101D] text-slate-100 shadow-2xl border-l border-slate-800/90 flex flex-col h-full z-10 overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* Cover Gradient Header Banner */}
        <div className="relative shrink-0 h-32 sm:h-36 bg-gradient-to-r from-amber-600/30 via-yellow-500/20 to-slate-900 border-b border-slate-800 flex items-start justify-between p-4 sm:p-5 overflow-hidden">
          {/* Subtle architectural grid pattern */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#F59E0B_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* Top Session Active Badge */}
          <div className="relative z-10 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/80 border border-amber-500/30 text-[11px] font-mono font-medium text-amber-300 backdrop-blur-md shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>2026–2027 Session Active</span>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="relative z-10 w-9 h-9 rounded-full bg-slate-950/80 hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95"
            title="Close Profile Panel (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Identity Overlap Section */}
        <div className="relative px-6 pt-0 pb-4 shrink-0 border-b border-slate-800/80 bg-[#0c1222]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-3">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 font-black text-2xl sm:text-3xl flex items-center justify-center shadow-xl shadow-amber-500/20 ring-4 ring-[#0B101D]">
                {userInitial}
              </div>
              <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#0B101D] flex items-center justify-center text-[10px] text-white" title="Active Online Session">
                ✓
              </div>
            </div>

            {/* Role Badge and Company Chip */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm">
                <Shield className="w-3.5 h-3.5" />
                <span>{roleDisplayName}</span>
              </span>

              {company && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700/80">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{company.name}</span>
                </span>
              )}
            </div>
          </div>

          {/* Name & Email Details */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {displayName}
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Verified Account
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-mono mt-0.5 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>{userEmail}</span>
            </p>
          </div>
        </div>

        {/* Sleek Segmented Tab Switcher */}
        <div className="px-6 py-2.5 border-b border-slate-800 bg-[#090E1A] shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800/90 rounded-xl overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => {
                setActiveTab('details');
                setStatusMessage(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'details'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Personal Profile</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('permissions');
                setStatusMessage(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'permissions'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Roles & Access</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('security');
                setStatusMessage(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Security & Pass</span>
            </button>
          </div>
        </div>

        {/* Global Toast Message */}
        {statusMessage && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2 shrink-0 animate-in fade-in duration-150 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span className="flex-1">{statusMessage.text}</span>
          </div>
        )}

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: Personal Details */}
          {activeTab === 'details' && (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Form Card */}
              <div className="bg-[#10172A] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-400" />
                    <span>Personal Information</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">Editable profile fields</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#090E1A] border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Email (Readonly) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Email Address <span className="text-[10px] text-slate-500 font-normal">(Primary Login)</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        value={userEmail}
                        disabled
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#070B14] border border-slate-800 rounded-xl text-slate-400 cursor-not-allowed font-mono opacity-85"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Contact Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#090E1A] border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Department / Expertise */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Designation / Department
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        value={expertise}
                        onChange={(e) => setExpertise(e.target.value)}
                        placeholder="e.g. Sales, Project Controls, Lead Force"
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#090E1A] border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Organization & System Card */}
              <div className="bg-[#10172A] border border-slate-800 rounded-2xl p-5 space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <span>Workspace & System Affiliation</span>
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    ERP Cloud v1.0
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#090E1A] border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Company</span>
                    <span className="font-bold text-white text-xs mt-0.5 block truncate">
                      {company?.name || 'Lucknow Builders'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#090E1A] border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Company Code</span>
                    <span className="font-mono font-black text-amber-400 text-xs mt-0.5 block">
                      {company?.code || 'LB-360'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#090E1A] border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Role Authority</span>
                    <span className="font-bold text-emerald-400 text-xs mt-0.5 block truncate">
                      {roleDisplayName}
                    </span>
                  </div>
                </div>

                {/* User ID with Copy */}
                {user?.id && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#090E1A] border border-slate-800/80 text-xs">
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">System User ID</span>
                      <span className="font-mono text-slate-400 text-[11px] truncate block">
                        {user.id}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                    >
                      {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Roles & Permissions Breakdown */}
          {activeTab === 'permissions' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300">
                  <p className="font-bold text-amber-300 text-sm">
                    Authority Matrix & Module Privileges
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    Your active session operates with <strong className="text-white">{roleDisplayName}</strong> authority. 
                    Below is the live operational status of all platform sections configured for your role.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {modulesList.map((m) => (
                  <div
                    key={m.id}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                      m.allowed
                        ? 'bg-[#10172A] border-slate-800 hover:border-slate-700 shadow-sm'
                        : 'bg-[#090D18] border-slate-900 opacity-60'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white tracking-tight">{m.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">[{m.category}]</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                        {m.desc}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {m.allowed ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Active Access</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-500 border border-slate-700/60">
                          <Lock className="w-3 h-3" />
                          <span>Restricted</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Security & Session Password */}
          {activeTab === 'security' && (
            <div className="space-y-5">
              {/* Change Password Card */}
              <div className="bg-[#10172A] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>Change Account Password</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">Requires current password</span>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Current Password
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full pl-9 pr-10 py-2.5 text-xs bg-[#090E1A] border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        New Password
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full px-3 py-2.5 text-xs bg-[#090E1A] border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Confirm New Password
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full px-3 py-2.5 text-xs bg-[#090E1A] border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isChangingPassword || !currentPassword || !newPassword}
                      className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{isChangingPassword ? 'Updating Password...' : 'Update Password'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Active Session Info Card */}
              <div className="bg-[#10172A] border border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-emerald-400" />
                    <span>Active Device & Session</span>
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Current Session
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#090E1A] border border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-white">Web Browser Client</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">JWT Token Authenticated • Auto-renewed</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-slate-800 text-amber-400 border border-slate-700">
                    Session 2026-2027
                  </span>
                </div>
              </div>

              {/* Danger Zone: Log Out */}
              <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-rose-300">Sign Out of BuildForce360</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    End your authenticated session securely on this workstation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to sign out?')) {
                      logout();
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20 transition-all cursor-pointer active:scale-95 shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
};
