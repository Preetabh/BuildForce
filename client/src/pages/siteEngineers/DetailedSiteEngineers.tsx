import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { HardHat, Plus, Search, UserPlus } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/common/Button';
import { rbacService } from '../../services/rbac.service';
import { SiteEngineerItem } from '../../types/rbac';
import { useImpersonation } from '../../context/ImpersonationContext';
import {
  EngineerTableRow,
  EngineerFormModal,
  EngineerWalletModal,
} from '../../components/siteEngineers';

interface OutletContextType {
  setSidebarOpen: (open: boolean) => void;
}

export const DetailedSiteEngineers: React.FC = () => {
  const { setSidebarOpen } = useOutletContext<OutletContextType>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { startViewing } = useImpersonation();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEngineer, setEditingEngineer] = useState<SiteEngineerItem | null>(null);
  const [walletModalEngineer, setWalletModalEngineer] = useState<SiteEngineerItem | null>(null);

  // Automatically trigger Add Engineer modal if user navigated to /admin/add-site-engineer
  useEffect(() => {
    if (
      location.pathname.toLowerCase().includes('add-site-engineer') ||
      location.search.includes('action=add')
    ) {
      setEditingEngineer(null);
      setIsAddModalOpen(true);
    }
  }, [location.pathname, location.search]);

  const { data: engineers = [], isLoading } = useQuery({
    queryKey: ['siteEngineers'],
    queryFn: rbacService.getSiteEngineers,
  });

  const createEngineerMutation = useMutation({
    mutationFn: rbacService.createSiteEngineer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteEngineers'] });
      queryClient.invalidateQueries({ queryKey: ['rbacUsers'] });
      setIsAddModalOpen(false);
      setEditingEngineer(null);
    },
  });

  const updateEngineerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SiteEngineerItem> }) =>
      rbacService.updateSiteEngineer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteEngineers'] });
      queryClient.invalidateQueries({ queryKey: ['rbacUsers'] });
      setIsAddModalOpen(false);
      setEditingEngineer(null);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => rbacService.toggleEngineerStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteEngineers'] });
      queryClient.invalidateQueries({ queryKey: ['rbacUsers'] });
    },
  });

  const updateWalletMutation = useMutation({
    mutationFn: ({
      id,
      amount,
      operation,
      notes,
    }: {
      id: string;
      amount: number;
      operation: 'add' | 'deduct' | 'set';
      notes?: string;
    }) => rbacService.updateEngineerWallet(id, amount, operation, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteEngineers'] });
      setWalletModalEngineer(null);
    },
  });

  const deleteEngineerMutation = useMutation({
    mutationFn: (id: string) => rbacService.deleteSiteEngineer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteEngineers'] });
      queryClient.invalidateQueries({ queryKey: ['rbacUsers'] });
    },
  });

  const handleOpenAddModal = () => {
    setEditingEngineer(null);
    setIsAddModalOpen(true);
  };

  const handleEdit = (eng: SiteEngineerItem) => {
    setEditingEngineer(eng);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingEngineer(null);
    if (location.pathname.toLowerCase().includes('add-site-engineer')) {
      navigate('/admin/site-engineers', { replace: true });
    }
  };

  const handleFormSubmit = (data: Partial<SiteEngineerItem>) => {
    if (editingEngineer) {
      updateEngineerMutation.mutate({ id: editingEngineer._id, data });
    } else {
      createEngineerMutation.mutate(data);
    }
  };

  const handleViewAs = (eng: SiteEngineerItem) => {
    startViewing({
      id: eng._id,
      name: eng.name,
      email: eng.loginId,
      role: 'SITE_ENGINEER',
      mobile: eng.mobile,
    });
    navigate('/leads');
  };

  const filteredEngineers = engineers.filter(
    (eng) =>
      eng.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eng.loginId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eng.expertise.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eng.mobile.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 flex flex-col">
      <Header
        breadcrumbs={[
          { label: 'Admin', path: '/' },
          { label: 'Manage Site Engineers' },
        ]}
        onToggleSidebar={() => setSidebarOpen(true)}
      />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#1A2234] pb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Detailed Site Engineers
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage field staff accounts and monitor project assignments
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search engineer..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-[#0D121F] border border-[#1C2538] text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
              />
            </div>

            <Button
              onClick={handleOpenAddModal}
              className="bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Add New Engineer
            </Button>
          </div>
        </div>

        {/* Site Engineers Table Container */}
        <div className="bg-[#0C101A] border border-[#182032] rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1B2438] bg-[#0E1526]/80 text-[11px] font-bold uppercase tracking-wider text-amber-400/90">
                  <th className="py-3.5 px-4 sm:px-6">Engineer Name</th>
                  <th className="py-3.5 px-4">Expertise</th>
                  <th className="py-3.5 px-4">Login ID</th>
                  <th className="py-3.5 px-4">Mobile</th>
                  <th className="py-3.5 px-4 text-center">Projects</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#151D2E] text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading site engineers...
                    </td>
                  </tr>
                ) : filteredEngineers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400">
                      <div className="max-w-xs mx-auto space-y-3">
                        <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                          <HardHat className="w-6 h-6" />
                        </div>
                        <p className="font-semibold text-white text-sm">No site engineers found</p>
                        <p className="text-xs text-slate-400">
                          Create your first site engineer account to assign projects and manage field operations.
                        </p>
                        <Button
                          onClick={handleOpenAddModal}
                          className="bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                          Create Engineer Now
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEngineers.map((eng) => (
                    <EngineerTableRow
                      key={eng._id}
                      engineer={eng}
                      onOpenWallet={setWalletModalEngineer}
                      onEdit={handleEdit}
                      onToggleStatus={(id) => toggleStatusMutation.mutate(id)}
                      onViewAs={handleViewAs}
                      onDelete={(id) => deleteEngineerMutation.mutate(id)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <EngineerFormModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        editingEngineer={editingEngineer}
        onSubmit={handleFormSubmit}
        isSubmitting={createEngineerMutation.isPending || updateEngineerMutation.isPending}
      />

      {/* Wallet Management Modal */}
      <EngineerWalletModal
        engineer={walletModalEngineer}
        onClose={() => setWalletModalEngineer(null)}
        onSubmit={(data) => updateWalletMutation.mutate(data)}
        isSubmitting={updateWalletMutation.isPending}
      />
    </div>
  );
};
