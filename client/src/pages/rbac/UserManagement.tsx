import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Check,
  X,
  Search,
  Shield,
  Phone,
  Mail,
  UserPlus,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/common/Button';
import { rbacService } from '../../services/rbac.service';
import { RbacUserItem, RbacRole } from '../../types/rbac';
import { useImpersonation } from '../../context/ImpersonationContext';
import { useAuth } from '../../context/AuthContext';

interface OutletContextType {
  setSidebarOpen: (open: boolean) => void;
}

export const UserManagement: React.FC = () => {
  const { setSidebarOpen } = useOutletContext<OutletContextType>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { startViewing } = useImpersonation();
  const { user: currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<RbacUserItem | null>(null);

  // Form State for Edit
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState('MASTER_ADMIN');
  const [formMobile, setFormMobile] = useState('');

  // Form State for Add
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('password123');
  const [addRole, setAddRole] = useState('MASTER_ADMIN');
  const [addMobile, setAddMobile] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['rbacUsers'],
    queryFn: rbacService.getUsers,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['rbacRoles'],
    queryFn: rbacService.getRoles,
  });

  const availableRoles = useMemo(() => {
    if (roles && roles.length > 0) return roles;
    return [
      { _id: '1', name: 'Master Admin', code: 'MASTER_ADMIN' },
      { _id: '2', name: 'Counsellor', code: 'COUNSELLOR' },
      { _id: '3', name: 'Accountant', code: 'ACCOUNTANT' },
      { _id: '4', name: 'Employee', code: 'EMPLOYEE' },
      { _id: '5', name: 'Developer', code: 'DEVELOPER' },
      { _id: '6', name: 'Site Engineer', code: 'SITE_ENGINEER' },
      { _id: '7', name: 'Interior Designer', code: 'INTERIOR_DESIGNER' },
      { _id: '8', name: 'Project Manager', code: 'PROJECT_MANAGER' },
      { _id: '9', name: 'Architect', code: 'ARCHITECT' },
      { _id: '10', name: 'Estimate Engineer', code: 'ESTIMATE_ENGINEER' },
      { _id: '11', name: 'BDM', code: 'BDM' },
    ];
  }, [roles]);

  const getRoleDisplayName = (roleStr: string) => {
    if (!roleStr) return 'Master Admin';
    if (roleStr === 'ADMIN') return 'Master Admin';
    const found = availableRoles.find(
      (r: any) => r.code.toUpperCase() === roleStr.toUpperCase() || r.name.toLowerCase() === roleStr.toLowerCase()
    );
    return found ? found.name : roleStr;
  };

  const toggleStatusMutation = useMutation({
    mutationFn: (userId: string) => rbacService.toggleUserStatus(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbacUsers'] });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: { role?: string; mobile?: string };
    }) => rbacService.updateUserRoleAndPermissions(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbacUsers'] });
      closeModal();
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (data: any) => rbacService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbacUsers'] });
      queryClient.invalidateQueries({ queryKey: ['siteEngineers'] });
      closeAddModal();
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => rbacService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbacUsers'] });
      queryClient.invalidateQueries({ queryKey: ['siteEngineers'] });
    },
  });

  const openAddModal = () => {
    setAddName('');
    setAddEmail('');
    setAddPassword('password123');
    setAddRole('MASTER_ADMIN');
    setAddMobile('');
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };

  const openEditModal = (user: RbacUserItem) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role === 'ADMIN' ? 'MASTER_ADMIN' : user.role);
    setFormMobile(user.mobile || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateUserMutation.mutate({
        userId: editingUser._id,
        data: {
          role: formRole,
          mobile: formMobile,
        },
      });
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addEmail.trim()) return;

    createUserMutation.mutate({
      name: addName.trim(),
      email: addEmail.trim().toLowerCase(),
      password: addPassword || 'password123',
      role: addRole,
      mobile: addMobile.trim(),
    });
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
        breadcrumbs={[{ label: 'Admin', path: '/' }, { label: 'User Management' }]}
        onToggleSidebar={() => setSidebarOpen(true)}
      />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#1A2234] pb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                User Management
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Staff accounts directory, role assignments, and authorization status
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search user..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#0D121F] border border-[#1C2538] text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
              />
            </div>

            <Button
              onClick={openAddModal}
              className="bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 stroke-[2.5]" />
              Add User
            </Button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-[#0C101A] border border-[#182032] rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1B2438] bg-[#0E1526]/80 text-[11px] font-bold uppercase tracking-wider text-amber-400/90">
                  <th className="py-3.5 px-4 sm:px-6">Name</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4 text-center">Status (Allow / Decline)</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#151D2E] text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      Loading users...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-500">
                      No staff users found. Click "+ Add User" to register team members.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-[#121929]/70 transition-colors">
                      {/* Name */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0 shadow-md">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">{user.name}</span>
                              {currentUser?.email === user.email && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-[#141C2E] border border-amber-500/30 text-amber-400">
                          <Shield className="w-3 h-3 text-amber-400" />
                          <span>{getRoleDisplayName(user.role)}</span>
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-[11px] font-mono text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{user.mobile || '-'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Status Toggle (Allow / Decline) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center p-0.5 rounded-xl bg-[#090D16] border border-[#1C2538]">
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

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              startViewing({
                                id: user._id,
                                name: user.name,
                                email: user.email,
                                role: user.role,
                                mobile: user.mobile,
                              });
                              navigate('/leads');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[11px] font-bold transition-all active:scale-95 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View As</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit User"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {currentUser?.email !== user.email && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Delete user account ${user.name}?`)) {
                                  deleteUserMutation.mutate(user._id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#0D121F] border border-amber-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#1C2538] pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  Add Team User
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Create a new staff account with system role
                </p>
              </div>
              <button
                onClick={closeAddModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Full Name <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Email Address <span className="text-amber-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="e.g. ramesh@company.com"
                  className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Role *</label>
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white focus:outline-none focus:border-amber-500 font-medium"
                  >
                    {availableRoles.map((r: any) => (
                      <option key={r._id || r.code} value={r.code}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Mobile Phone</label>
                  <input
                    type="text"
                    value={addMobile}
                    onChange={(e) => setAddMobile(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Initial Password</label>
                <input
                  type="text"
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  placeholder="password123"
                  className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#1C2538]">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-[#141B2D] hover:bg-[#1A233A] font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#0D121F] border border-amber-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#1C2538] pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-amber-400" />
                  Edit User: {editingUser.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{editingUser.email}</p>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Assigned Role</label>
                <select
                  value={formRole === 'ADMIN' ? 'MASTER_ADMIN' : formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white focus:outline-none focus:border-amber-500 font-medium"
                >
                  {availableRoles.map((r: any) => (
                    <option key={r._id || r.code} value={r.code}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mobile Phone</label>
                <input
                  type="text"
                  value={formMobile}
                  onChange={(e) => setFormMobile(e.target.value)}
                  placeholder="e.g. 9616533535"
                  className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#1C2538]">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-[#141B2D] hover:bg-[#1A233A] font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateUserMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
