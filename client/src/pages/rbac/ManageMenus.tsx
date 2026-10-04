import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import {
  Plus,
  Edit2,
  Trash2,
  CornerDownRight,
  Eye,
  EyeOff,
  Check,
  X,
  Layers,
  Home,
  Users,
  HardHat,
  Briefcase,
  Settings,
  Link as LinkIcon,
  PieChart,
  FileSpreadsheet,
  Coins,
  CreditCard,
  Handshake,
  CalendarRange,
  BookOpen,
  Calculator,
  ClipboardCheck,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/common/Button';
import { rbacService } from '../../services/rbac.service';
import { RbacMenuItem } from '../../types/rbac';

interface OutletContextType {
  setSidebarOpen: (open: boolean) => void;
}

const AVAILABLE_ICONS = [
  'Home',
  'Users',
  'HardHat',
  'Briefcase',
  'Settings',
  'Layers',
  'Link',
  'PieChart',
  'FileSpreadsheet',
  'Coins',
  'CreditCard',
  'Handshake',
  'CalendarRange',
  'BookOpen',
  'Calculator',
  'ClipboardCheck',
];

const renderIcon = (iconName: string) => {
  const iconProps = { className: 'w-4 h-4 text-amber-400' };
  switch (iconName?.toLowerCase()) {
    case 'home':
      return <Home {...iconProps} />;
    case 'users':
      return <Users {...iconProps} />;
    case 'hardhat':
      return <HardHat {...iconProps} />;
    case 'briefcase':
      return <Briefcase {...iconProps} />;
    case 'settings':
      return <Settings {...iconProps} />;
    case 'link':
      return <LinkIcon {...iconProps} />;
    case 'piechart':
    case 'pie':
      return <PieChart {...iconProps} />;
    case 'filespreadsheet':
      return <FileSpreadsheet {...iconProps} />;
    case 'coins':
      return <Coins {...iconProps} />;
    case 'creditcard':
      return <CreditCard {...iconProps} />;
    case 'handshake':
      return <Handshake {...iconProps} />;
    case 'calendarrange':
      return <CalendarRange {...iconProps} />;
    case 'bookopen':
      return <BookOpen {...iconProps} />;
    case 'calculator':
      return <Calculator {...iconProps} />;
    case 'clipboardcheck':
      return <ClipboardCheck {...iconProps} />;
    default:
      return <Layers {...iconProps} />;
  }
};

import { MenuModal } from '../../components/rbac';

export const ManageMenus: React.FC = () => {
  const { setSidebarOpen } = useOutletContext<OutletContextType>();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RbacMenuItem | null>(null);

  const { data: menus = [], isLoading } = useQuery({
    queryKey: ['rbacMenus'],
    queryFn: rbacService.getMenus,
  });

  const createMutation = useMutation({
    mutationFn: rbacService.createMenu,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbacMenus'] });
      setIsModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RbacMenuItem> }) =>
      rbacService.updateMenu(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbacMenus'] });
      setIsModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: rbacService.deleteMenu,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbacMenus'] });
    },
  });

  const openCreateModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: RbacMenuItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleModalSubmit = (payload: Partial<RbacMenuItem>) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const toggleVisibility = (item: RbacMenuItem) => {
    updateMutation.mutate({
      id: item._id,
      data: { isVisible: !item.isVisible },
    });
  };

  // Group menus hierarchically (parents and children)
  const parentMenus = menus.filter((m) => !m.parentId);
  const childMap = new Map<string, RbacMenuItem[]>();

  menus.forEach((m) => {
    if (m.parentId) {
      const pid = String(m.parentId);
      if (!childMap.has(pid)) childMap.set(pid, []);
      childMap.get(pid)!.push(m);
    }
  });

  // Flatten ordered list with hierarchical indicators
  interface DisplayRow {
    item: RbacMenuItem;
    isChild: boolean;
  }

  const flattenedRows: DisplayRow[] = [];
  parentMenus.forEach((parent) => {
    flattenedRows.push({ item: parent, isChild: false });
    const children = childMap.get(parent._id) || [];
    children.forEach((child) => {
      flattenedRows.push({ item: child, isChild: true });
    });
  });

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 flex flex-col">
      <Header
        breadcrumbs={[
          { label: 'Admin', path: '/' },
          { label: 'Navigation Architecture' },
        ]}
        onToggleSidebar={() => setSidebarOpen(true)}
      />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#1A2234] pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  Navigation Architecture
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Customize your portal structure and sidebar flow
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={openCreateModal}
            className="bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Add Menu Item
          </Button>
        </div>

        {/* Navigation Table Container */}
        <div className="bg-[#0C101A] border border-[#182032] rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1B2438] bg-[#0E1526]/80 text-[11px] font-bold uppercase tracking-wider text-amber-400/90">
                  <th className="py-3.5 px-4 sm:px-6">Navigation Title</th>
                  <th className="py-3.5 px-4 sm:px-6">Destination Route</th>
                  <th className="py-3.5 px-4 text-center">Icon</th>
                  <th className="py-3.5 px-4 text-center">Sort</th>
                  <th className="py-3.5 px-4 text-center">Visibility</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#151D2E] text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                        <span>Loading navigation hierarchy...</span>
                      </div>
                    </td>
                  </tr>
                ) : flattenedRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No menu items configured. Click "+ Add Menu Item" to get started.
                    </td>
                  </tr>
                ) : (
                  flattenedRows.map(({ item, isChild }) => (
                    <tr
                      key={item._id}
                      className={`hover:bg-[#121929]/70 transition-colors group ${
                        isChild ? 'bg-[#0A0E18]/40' : 'bg-[#0E1424]/40 font-medium'
                      }`}
                    >
                      {/* Navigation Title */}
                      <td className="py-3 px-4 sm:px-6">
                        <div
                          className={`flex items-center gap-2 ${
                            isChild ? 'pl-6 sm:pl-8 text-slate-300' : 'text-white font-semibold'
                          }`}
                        >
                          {isChild ? (
                            <CornerDownRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                          )}
                          <span className="truncate">{item.title}</span>
                        </div>
                      </td>

                      {/* Destination Route */}
                      <td className="py-3 px-4 sm:px-6">
                        <span className="font-mono text-[11px] px-2.5 py-1 rounded-md bg-[#131B2C] border border-[#222E48] text-slate-300">
                          {item.route}
                        </span>
                      </td>

                      {/* Icon */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center justify-center p-1.5 rounded-lg bg-[#141C2E] border border-slate-800">
                          {renderIcon(item.icon)}
                        </div>
                      </td>

                      {/* Sort */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono text-slate-400 text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                          {item.sort}
                        </span>
                      </td>

                      {/* Visibility (Visible / Draft Toggle Pill) */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleVisibility(item)}
                          title="Click to toggle visibility"
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all border cursor-pointer active:scale-95 ${
                            item.isVisible
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]'
                              : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:bg-slate-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.isVisible
                                ? 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]'
                                : 'bg-slate-500'
                            }`}
                          />
                          {item.isVisible ? 'Visible' : 'Draft'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            title="Edit Menu"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/30 transition-all cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {!item.isSystem && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Delete menu "${item.title}"?`)) {
                                  deleteMutation.mutate(item._id);
                                }
                              }}
                              title="Delete Menu"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all cursor-pointer"
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

      {/* Add / Edit Menu Modal */}
      <MenuModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingItem={editingItem}
        parentMenus={parentMenus}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};
