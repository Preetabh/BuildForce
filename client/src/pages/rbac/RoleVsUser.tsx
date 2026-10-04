import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  UserCheck,
  Shield,
  Search,
  Check,
  X,
  Eye,
  Sliders,
  CheckCircle2,
  XCircle,
  Users,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { rbacService } from '../../services/rbac.service';
import { RbacUserItem, RbacRole, RbacMenuItem } from '../../types/rbac';
import { useImpersonation } from '../../context/ImpersonationContext';
import { UserOverrideModal } from '../../components/rbac';

interface OutletContextType {
  setSidebarOpen: (open: boolean) => void;
}

export const RoleVsUser: React.FC = () => {
  const { setSidebarOpen } = useOutletContext<OutletContextType>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { startViewing } = useImpersonation();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserForOverride, setSelectedUserForOverride] = useState<RbacUserItem | null>(null);
  const [userOverrides, setUserOverrides] = useState<Record<string, boolean>>({});

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['rbacUsers'],
    queryFn: rbacService.getUsers,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['rbacRoles'],
    queryFn: rbacService.getRoles,
  });

  const { data: menus = [] } = useQuery({
    queryKey: ['rbacMenus'],
    queryFn: rbacService.getMenus,
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      rbacService.updateUserRoleAndPermissions(userId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbacUsers'] });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (userId: string) => rbacService.toggleUserStatus(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbacUsers'] });
    },
  });

  const saveOverridesMutation = useMutation({
    mutationFn: ({
      userId,
      permissions,
    }: {
      userId: string;
      permissions: Record<string, boolean>;
    }) => rbacService.updateUserRoleAndPermissions(userId, { permissions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbacUsers'] });
      setSelectedUserForOverride(null);
    },
  });

  const handleOpenOverrides = (user: RbacUserItem) => {
    setSelectedUserForOverride(user);
    setUserOverrides(user.permissions || {});
  };

  const handleToggleOverride = (route: string, currentVal: boolean) => {
    setUserOverrides((prev) => ({
      ...prev,
      [route]: !currentVal,
    }));
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 flex flex-col">
      <Header
        breadcrumbs={[{ label: 'Admin', path: '/' }, { label: 'Role Vs User' }]}
        onToggleSidebar={() => setSidebarOpen(true)}
      />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#1A2234] pb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Role Vs User Assignment
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Map organization roles to staff accounts and configure individual Allow & Decline overrides
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search user by name, email or role..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#0D121F] border border-[#1C2538] text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
            />
          </div>
        </div>

        {/* User Table Container */}
        <div className="bg-[#0C101A] border border-[#182032] rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1B2438] bg-[#0E1526]/80 text-[11px] font-bold uppercase tracking-wider text-amber-400/90">
                  <th className="py-3.5 px-4 sm:px-6">User Account</th>
                  <th className="py-3.5 px-4">Assigned Role</th>
                  <th className="py-3.5 px-4 text-center">Access Status (Allow / Decline)</th>
                  <th className="py-3.5 px-4 text-center">Granular Overrides</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">View Portal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#151D2E] text-xs">
                {isLoadingUsers ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      Loading users list...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      No users match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-[#121929]/70 transition-colors">
                      {/* User Account */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0 shadow-md">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-white block">{user.name}</span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Assigned Role Dropdown */}
                      <td className="py-3.5 px-4">
                        <select
                          value={user.role}
                          onChange={(e) =>
                            updateRoleMutation.mutate({
                              userId: user._id,
                              role: e.target.value,
                            })
                          }
                          className="px-3 py-1.5 rounded-xl bg-[#131B2D] border border-[#232F4A] text-white text-xs font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                          {roles.map((r) => (
                            <option key={r._id} value={r.code}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Status Allow / Decline Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center rounded-xl p-0.5 bg-[#121828] border border-slate-800">
                          {/* ALLOW / ACTIVE */}
                          <button
                            type="button"
                            onClick={() => {
                              if (!user.isActive) toggleStatusMutation.mutate(user._id);
                            }}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                              user.isActive
                                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                                : 'text-slate-400 hover:text-emerald-300'
                            }`}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>ALLOWED</span>
                          </button>

                          {/* DECLINE / INACTIVE */}
                          <button
                            type="button"
                            onClick={() => {
                              if (user.isActive) toggleStatusMutation.mutate(user._id);
                            }}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                              !user.isActive
                                ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                                : 'text-slate-400 hover:text-red-300'
                            }`}
                          >
                            <X className="w-3 h-3 stroke-[3]" />
                            <span>DECLINED</span>
                          </button>
                        </div>
                      </td>

                      {/* Custom Overrides button */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenOverrides(user)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141C2E] hover:bg-[#1A253D] border border-slate-700/70 text-slate-300 hover:text-amber-300 transition-all font-medium active:scale-95"
                        >
                          <Sliders className="w-3.5 h-3.5 text-amber-400" />
                          <span>Customize Access</span>
                        </button>
                      </td>

                      {/* View As Impersonate */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            startViewing({
                              id: user._id,
                              name: user.name,
                              email: user.email,
                              role: user.role,
                            });
                            navigate('/leads');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[11px] font-bold transition-all active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View As</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Granular Overrides Modal */}
      <UserOverrideModal
        user={selectedUserForOverride}
        menus={menus}
        overrides={userOverrides}
        onClose={() => setSelectedUserForOverride(null)}
        onToggleOverride={handleToggleOverride}
        onSave={() => {
          if (selectedUserForOverride) {
            saveOverridesMutation.mutate({
              userId: selectedUserForOverride._id,
              permissions: userOverrides,
            });
          }
        }}
        isSaving={saveOverridesMutation.isPending}
      />
    </div>
  );
};
