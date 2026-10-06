import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import {
  LayoutDashboard,
  HardHat,
  Users,
  Layers,
  Wallet,
  CreditCard,
  Wrench,
  FileSpreadsheet,
  Truck,
  Clock,
  BookOpen,
  Settings,
  CalendarRange,
  FolderKanban,
  Circle,
  Edit2,
  ChevronRight,
  Plus,
  Search,
  Check,
  X,
  CheckCircle2,
  Sparkles,
  Shield,
  Trash2,
  SlidersHorizontal,
  History,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/common/Button';
import { GoldToggleSwitch } from '../../components/common/GoldToggleSwitch';
import { rbacService } from '../../services/rbac.service';
import { RbacRole } from '../../types/rbac';
import { RoleModal } from '../../components/rbac';
import { EntityAuditHistoryModal } from '../../components/audit/EntityAuditHistoryModal';
import {
  ROLE_PERMISSION_MODULES,
  PermissionModuleConfig,
} from '../../config/rolePermissions.config';

interface OutletContextType {
  setSidebarOpen: (open: boolean) => void;
}

export const ManageRoles: React.FC = () => {
  const { setSidebarOpen } = useOutletContext<OutletContextType>();
  const queryClient = useQueryClient();

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RbacRole | null>(null);

  // Local state of permissions for the active role: key -> boolean
  const [permMap, setPermMap] = useState<Record<string, boolean>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [auditRole, setAuditRole] = useState<{ id: string; name: string } | null>(null);

  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ['rbacRoles'],
    queryFn: rbacService.getRoles,
  });

  // Default active role to Master Admin or first role
  const activeRole: RbacRole | null =
    roles.find((r) => r._id === selectedRoleId) ||
    roles.find((r) => r.code === 'MASTER_ADMIN' || r.name.toLowerCase().includes('master admin')) ||
    roles[0] ||
    null;

  // Initialize permission toggles whenever active role changes
  useEffect(() => {
    if (activeRole) {
      const map: Record<string, boolean> = {};
      const isMasterAdmin =
        activeRole.name.toLowerCase().includes('master admin') ||
        activeRole.code === 'MASTER_ADMIN';

      ROLE_PERMISSION_MODULES.forEach((mod) => {
        // Module entry point
        const epFound = activeRole.permissions?.find((p) => p.menuRoute === mod.entryPoint.route);
        map[mod.entryPoint.route] =
          epFound !== undefined ? epFound.allow : isMasterAdmin ? true : false;

        // Sub items
        mod.items.forEach((item) => {
          const itemFound = activeRole.permissions?.find(
            (p) => p.menuRoute === item.route || p.menuRoute === item.key
          );
          map[item.key] = itemFound !== undefined ? itemFound.allow : isMasterAdmin ? true : false;
        });
      });

      setPermMap(map);
      setHasUnsavedChanges(false);
    }
  }, [activeRole?._id, activeRole?.permissions]);

  // Mutations
  const createRoleMutation = useMutation({
    mutationFn: rbacService.createRole,
    onSuccess: (newRole) => {
      queryClient.invalidateQueries({ queryKey: ['rbacRoles'] });
      setIsRoleModalOpen(false);
      setSelectedRoleId(newRole._id);
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RbacRole> }) =>
      rbacService.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbacRoles'] });
      setIsRoleModalOpen(false);
      setEditingRole(null);
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: rbacService.deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbacRoles'] });
      setSelectedRoleId(null);
    },
  });

  const applyChangesMutation = useMutation({
    mutationFn: async () => {
      if (!activeRole) return;
      return rbacService.batchUpdateRolePermissions(activeRole._id, {
        permissions: permMap,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbacRoles'] });
      setHasUnsavedChanges(false);
      setSaveSuccessMsg(`Permissions saved for ${activeRole?.name}!`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    },
  });

  // Toggles
  const handleToggle = (key: string, nextVal: boolean) => {
    setPermMap((prev) => ({
      ...prev,
      [key]: nextVal,
    }));
    setHasUnsavedChanges(true);
  };

  const handleToggleModule = (module: PermissionModuleConfig, nextVal: boolean) => {
    setPermMap((prev) => {
      const updated = { ...prev, [module.entryPoint.route]: nextVal };
      module.items.forEach((item) => {
        updated[item.key] = nextVal;
      });
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const handleAllowAll = () => {
    const updated: Record<string, boolean> = {};
    ROLE_PERMISSION_MODULES.forEach((mod) => {
      updated[mod.entryPoint.route] = true;
      mod.items.forEach((item) => {
        updated[item.key] = true;
      });
    });
    setPermMap(updated);
    setHasUnsavedChanges(true);
  };

  const handleDeclineAll = () => {
    const updated: Record<string, boolean> = {};
    ROLE_PERMISSION_MODULES.forEach((mod) => {
      updated[mod.entryPoint.route] = false;
      mod.items.forEach((item) => {
        updated[item.key] = false;
      });
    });
    setPermMap(updated);
    setHasUnsavedChanges(true);
  };

  const handleOpenAddRole = () => {
    setEditingRole(null);
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = (e: React.MouseEvent, role: RbacRole) => {
    e.stopPropagation();
    setEditingRole(role);
    setIsRoleModalOpen(true);
  };

  const handleRoleModalSubmit = (data: {
    name: string;
    code: string;
    description: string;
    color: string;
  }) => {
    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole._id, data });
    } else {
      createRoleMutation.mutate(data);
    }
  };

  const getModuleIcon = (iconName: string) => {
    switch (iconName) {
      case 'LayoutDashboard':
        return LayoutDashboard;
      case 'HardHat':
        return HardHat;
      case 'Users':
        return Users;
      case 'Layers':
        return Layers;
      case 'Wallet':
        return Wallet;
      case 'CreditCard':
        return CreditCard;
      case 'Wrench':
        return Wrench;
      case 'FileSpreadsheet':
        return FileSpreadsheet;
      case 'Truck':
        return Truck;
      case 'Clock':
        return Clock;
      case 'BookOpen':
        return BookOpen;
      case 'CalendarRange':
        return CalendarRange;
      case 'FolderKanban':
        return FolderKanban;
      case 'Settings':
        return Settings;
      default:
        return Layers;
    }
  };

  // Filter modules based on search
  const filteredModules = ROLE_PERMISSION_MODULES.map((mod) => {
    if (!searchTerm.trim()) return mod;
    const searchLower = searchTerm.toLowerCase();
    const modMatches =
      mod.name.toLowerCase().includes(searchLower) ||
      mod.entryPoint.title.toLowerCase().includes(searchLower);
    const filteredItems = mod.items.filter(
      (item) =>
        item.title.toLowerCase().includes(searchLower) ||
        item.route.toLowerCase().includes(searchLower)
    );
    if (modMatches) return mod;
    if (filteredItems.length > 0) {
      return { ...mod, items: filteredItems };
    }
    return null;
  }).filter(Boolean) as PermissionModuleConfig[];

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 flex flex-col font-sans">
      <Header
        breadcrumbs={[{ label: 'Admin', path: '/' }, { label: 'Manage Roles' }]}
        onToggleSidebar={() => setSidebarOpen(true)}
      />

      {/* Main Workspace */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
        {/* ========================================================= */}
        {/* LEFT COLUMN: SYSTEM ROLES LIST                            */}
        {/* ========================================================= */}
        <div className="w-full lg:w-80 shrink-0 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              System Roles
            </span>
            <button
              type="button"
              onClick={handleOpenAddRole}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Role</span>
            </button>
          </div>

          <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1 custom-scrollbar">
            {isLoadingRoles ? (
              <div className="p-4 text-center text-xs text-slate-500">Loading roles...</div>
            ) : (
              roles.map((role) => {
                const isActive = activeRole?._id === role._id;
                const roleColor = role.color || '#F59E0B';

                return (
                  <div
                    key={role._id}
                    onClick={() => setSelectedRoleId(role._id)}
                    className={`w-full group rounded-xl px-4 py-3 flex items-center justify-between transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'font-bold shadow-lg text-slate-950 scale-[1.01]'
                        : 'bg-[#0E1424] hover:bg-[#141E34] text-slate-200 border border-[#1A253B]'
                    }`}
                    style={
                      isActive
                        ? {
                            backgroundColor: roleColor,
                            boxShadow: `0 0 20px ${roleColor}55`,
                            color: '#070A10',
                          }
                        : {
                            borderLeft: `4px solid ${roleColor}`,
                          }
                    }
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                        style={{
                          backgroundColor: isActive ? '#070A10' : roleColor,
                        }}
                      />
                      <span className="text-sm tracking-wide truncate">{role.name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditRole(e, role)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isActive
                            ? 'text-slate-950 hover:bg-black/15'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                        title="Edit Role details & Color Accent"
                      >
                        <Edit2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>

                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          isActive ? 'text-slate-950 stroke-[3]' : 'text-slate-500'
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: ROLE PERMISSIONS MATRIX                     */}
        {/* ========================================================= */}
        <div className="flex-1 bg-[#090D17] border border-[#151E30] rounded-2xl p-5 sm:p-7 shadow-2xl flex flex-col min-w-0">
          {/* Top Bar: Title & Apply Changes */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#18233A]">
            <div>
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0 shadow-md ring-2 ring-white/20"
                  style={{
                    backgroundColor: activeRole?.color || '#F59E0B',
                    boxShadow: `0 0 12px ${activeRole?.color || '#F59E0B'}80`,
                  }}
                />
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  {activeRole ? activeRole.name : 'Select a Role'}
                </h1>
                {activeRole && (
                  <span
                    className="text-[10.5px] font-mono px-2 py-0.5 rounded-md font-bold tracking-wider"
                    style={{
                      backgroundColor: `${activeRole.color || '#F59E0B'}22`,
                      color: activeRole.color || '#F59E0B',
                      border: `1px solid ${activeRole.color || '#F59E0B'}55`,
                    }}
                  >
                    {activeRole.code}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {activeRole?.description || 'Configure granular module access and operational authorities'}
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
              {/* Session Active Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#121929] border border-amber-500/25 text-[11px] font-semibold text-amber-300/90 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>2026–2027 Session Active</span>
              </div>

              {/* Role Audit Trail Button */}
              {activeRole && (
                <button
                  type="button"
                  onClick={() => setAuditRole({ id: activeRole._id, name: activeRole.name })}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#0D1526] hover:bg-[#152038] text-slate-300 hover:text-white border border-[#1E293B] shadow-sm active:scale-95 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                  title="View full audit trail and historical changes for this role"
                >
                  <History className="w-3.5 h-3.5 text-amber-400" />
                  <span>Audit Trail</span>
                </button>
              )}

              {/* Apply Changes Button */}
              <button
                type="button"
                onClick={() => applyChangesMutation.mutate()}
                disabled={applyChangesMutation.isPending}
                className="bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 font-bold px-5 py-2 rounded-xl text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                {applyChangesMutation.isPending ? 'Saving...' : 'Apply Changes'}
              </button>
            </div>
          </div>

          {/* Quick Toolbar: Search, Allow All, Decline All, Status Message */}
          <div className="py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-[#151F33]">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search module or permission..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-[#0D1322] border border-[#1C273E] text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
              />
            </div>

            {/* Bulk actions & status */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {saveSuccessMsg && (
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  {saveSuccessMsg}
                </span>
              )}
              {hasUnsavedChanges && !saveSuccessMsg && (
                <span className="text-[11px] text-amber-400 font-semibold px-2">
                  Unsaved changes
                </span>
              )}
              <button
                type="button"
                onClick={handleAllowAll}
                className="px-3 py-1 text-[11px] font-bold rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 transition-all cursor-pointer"
              >
                Allow All
              </button>
              <button
                type="button"
                onClick={handleDeclineAll}
                className="px-3 py-1 text-[11px] font-bold rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 transition-all cursor-pointer"
              >
                Decline All
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* PERMISSIONS MATRIX LIST (Matching Screenshots 1-4)       */}
          {/* ========================================================= */}
          <div className="flex-1 overflow-y-auto max-h-[calc(100vh-320px)] space-y-6 pt-5 pr-2 custom-scrollbar">
            {filteredModules.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                No permissions match your search query.
              </div>
            ) : (
              filteredModules.map((mod) => {
                const ModuleIcon = getModuleIcon(mod.iconName);
                const isModuleEnabled = permMap[mod.entryPoint.route] ?? false;

                return (
                  <div key={mod.id} className="space-y-2">
                    {/* Section Header */}
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider px-1">
                      <ModuleIcon className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{mod.name}</span>
                    </div>

                    <div className="bg-[#0C111E] border border-[#162035] rounded-xl overflow-hidden divide-y divide-[#141C2E]">
                      {/* Master Module Entry Point Row */}
                      <div className="px-4 py-3 flex items-center justify-between bg-[#0F1628]/70 hover:bg-[#121A30] transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                            <ModuleIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-white text-xs sm:text-sm block truncate">
                              {mod.entryPoint.title}
                            </span>
                            <span className="text-[10.5px] text-slate-400 block">
                              {mod.entryPoint.description}
                            </span>
                          </div>
                        </div>

                        <GoldToggleSwitch
                          checked={isModuleEnabled}
                          onChange={(val) => handleToggleModule(mod, val)}
                          ariaLabel={mod.entryPoint.title}
                        />
                      </div>

                      {/* Sub-permission items */}
                      {mod.items.map((item) => {
                        const isAllowed = permMap[item.key] ?? false;

                        return (
                          <div
                            key={item.key}
                            className="px-4 py-2.5 flex items-center justify-between hover:bg-[#11182C]/60 transition-colors pl-8 sm:pl-10"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />
                              <div className="min-w-0">
                                <span className="font-medium text-slate-200 text-xs block truncate">
                                  {item.title}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 block truncate">
                                  {item.route}
                                </span>
                              </div>
                            </div>

                            <GoldToggleSwitch
                              checked={isAllowed}
                              onChange={(val) => handleToggle(item.key, val)}
                              ariaLabel={item.title}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Role Creation / Editing Modal */}
      <RoleModal
        isOpen={isRoleModalOpen}
        onClose={() => {
          setIsRoleModalOpen(false);
          setEditingRole(null);
        }}
        editingRole={editingRole}
        onSubmit={handleRoleModalSubmit}
        isSubmitting={createRoleMutation.isPending || updateRoleMutation.isPending}
      />

      {/* Role Audit Trail Modal */}
      {auditRole && (
        <EntityAuditHistoryModal
          isOpen={!!auditRole}
          onClose={() => setAuditRole(null)}
          entity="Role"
          entityId={auditRole.id}
          entityTitle={`Role: ${auditRole.name}`}
        />
      )}
    </div>
  );
};
