import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit2,
  Power,
  Trash2,
  RefreshCw,
  X,
  Save,
  CheckCircle2,
  Layers,
  AlertCircle,
  Search,
} from 'lucide-react';
import catalogService, { ServiceCatalogItem } from '../../services/catalog.service';

export const ServiceCatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceCatalogItem | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const data = await catalogService.getServices(false);
      setServices(data || []);
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingService(null);
    setServiceName('');
    setServiceDesc('');
    setFormError('');
    setIsModalOpen(true);
  };

  const activeCount = useMemo(() => services.filter((s) => s.isActive).length, [services]);
  const inactiveCount = useMemo(() => services.filter((s) => !s.isActive).length, [services]);

  const filteredServices = useMemo(() => {
    return services.filter((srv) => {
      if (statusFilter === 'Active' && !srv.isActive) return false;
      if (statusFilter === 'Inactive' && srv.isActive) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          srv.name.toLowerCase().includes(q) ||
          (srv.description && srv.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [services, statusFilter, searchQuery]);

  const handleOpenEdit = (srv: ServiceCatalogItem) => {
    setEditingService(srv);
    setServiceName(srv.name);
    setServiceDesc(srv.description || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (srv: ServiceCatalogItem) => {
    try {
      const updated = await catalogService.toggleService(srv._id);
      setServices((prev) =>
        prev.map((item) => (item._id === srv._id ? { ...item, isActive: updated.isActive } : item))
      );
      showToast(`"${srv.name}" marked as ${updated.isActive ? 'Active' : 'Inactive'}`);
    } catch (err) {
      console.error('Failed to toggle service:', err);
      alert('Failed to update service status');
    }
  };

  const handleDelete = async (srv: ServiceCatalogItem) => {
    if (!window.confirm(`Are you sure you want to delete service "${srv.name}"?`)) return;
    try {
      await catalogService.deleteService(srv._id);
      setServices((prev) => prev.filter((item) => item._id !== srv._id));
      showToast(`Service "${srv.name}" deleted successfully`);
    } catch (err) {
      console.error('Failed to delete service:', err);
      alert('Failed to delete service');
    }
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) {
      setFormError('Please enter service name');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (editingService) {
        await catalogService.updateService(editingService._id, {
          name: serviceName.trim(),
          description: serviceDesc.trim(),
        });
        showToast('Service updated successfully');
      } else {
        await catalogService.createService({
          name: serviceName.trim(),
          description: serviceDesc.trim(),
          isActive: true,
        });
        showToast('Service category created successfully');
      }

      setIsModalOpen(false);
      fetchServices();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err?.message || 'Failed to save service');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-200 p-4 sm:p-6 space-y-5 max-w-full overflow-x-hidden">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#161D2B] border border-amber-500/40 text-amber-300 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs select-none">
        <span
          className="text-slate-400 hover:text-slate-300 cursor-pointer"
          onClick={() => navigate('/dashboard')}
        >
          Admin
        </span>
        <span className="text-slate-600">/</span>
        <span className="text-[#EAB308] font-medium">Service Catalog</span>
      </div>

      {/* 2. Header: Title & Add Category Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-slate-100">
            MANAGE MAIN SERVICES
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure dynamic services available throughout lead registration & project modules
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#EAB308] hover:bg-yellow-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>ADD CATEGORY</span>
        </button>
      </div>

      {/* 2.5 Filters & Search Toolbar */}
      <div className="bg-[#121622] border border-[#1E2638] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Status Mode Tabs */}
        <div className="flex items-center gap-1 bg-[#0E121A] p-1 rounded-lg border border-[#1E2638]">
          <button
            type="button"
            onClick={() => setStatusFilter('All')}
            className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
              statusFilter === 'All'
                ? 'bg-[#EAB308] text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({services.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Active')}
            className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'Active'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Inactive')}
            className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'Inactive'
                ? 'bg-rose-500 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Deactivated ({inactiveCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#181F2F] border border-[#2B354C] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#EAB308] transition-colors"
          />
        </div>
      </div>

      {/* 3. Services Grid Matching Screenshot 1 */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
          <span>Loading main services...</span>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-16 bg-[#0F1420] border border-[#1A2234] rounded-2xl p-8 space-y-2">
          <Layers className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="font-bold text-slate-200 text-sm">No Services Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {statusFilter === 'Active'
              ? 'No active services found.'
              : statusFilter === 'Inactive'
              ? 'No deactivated services.'
              : 'Click "+ ADD CATEGORY" above to add your first main service.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredServices.map((srv) => (
            <div
              key={srv._id}
              className={`p-3 sm:p-3.5 bg-[#121622] border rounded-xl flex items-center justify-between gap-3 transition-all hover:border-[#EAB308]/40 ${
                srv.isActive ? 'border-[#1E2638]' : 'border-[#1E2638] opacity-60 bg-[#0E121A]'
              }`}
            >
              {/* Left: Service Title */}
              <div className="min-w-0 flex-1">
                <span className="font-bold text-white text-xs sm:text-[13px] block truncate" title={srv.name}>
                  {srv.name}
                </span>
                {srv.description && (
                  <p className="text-[10.5px] text-slate-400 truncate mt-0.5">{srv.description}</p>
                )}
              </div>

              {/* Right: Actions matching Screenshot 1 (Dot + Edit + Power + Trash) */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Active Indicator Dot */}
                <span
                  className={`w-2 h-2 rounded-full mr-1 ${
                    srv.isActive ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-slate-600'
                  }`}
                  title={srv.isActive ? 'Active' : 'Inactive'}
                />

                {/* Edit Button */}
                <button
                  type="button"
                  onClick={() => handleOpenEdit(srv)}
                  className="p-1.5 rounded-lg bg-[#182030] hover:bg-[#222E46] border border-[#28354E] text-slate-300 hover:text-white transition-all cursor-pointer"
                  title="Edit Service"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {/* Power / Toggle Active Button */}
                <button
                  type="button"
                  onClick={() => handleToggleStatus(srv)}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                    srv.isActive
                      ? 'bg-[#182030] hover:bg-emerald-950/40 border-[#28354E] text-slate-300 hover:text-emerald-400'
                      : 'bg-rose-950/40 border-rose-800/50 text-rose-400 hover:bg-rose-900/50'
                  }`}
                  title={srv.isActive ? 'Deactivate Service' : 'Activate Service'}
                >
                  <Power className="w-3.5 h-3.5" />
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleDelete(srv)}
                  className="p-1.5 rounded-lg bg-[#221518] hover:bg-red-950 border border-red-900/40 text-red-400 transition-all cursor-pointer"
                  title="Delete Service"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-[#121622] border border-[#232D42] rounded-2xl shadow-2xl p-5 sm:p-6 text-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#20293D]">
              <h2 className="text-base sm:text-lg font-bold text-white">
                {editingService ? 'Edit Main Service' : 'Add Main Service'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitModal} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Category / Service Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Floor Plan Design, Modular Kitchen Work"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full bg-[#181F2F] border border-[#2B354C] focus:border-[#EAB308] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief description of the service scope"
                  value={serviceDesc}
                  onChange={(e) => setServiceDesc(e.target.value)}
                  className="w-full bg-[#181F2F] border border-[#2B354C] focus:border-[#EAB308] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#20293D]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#1A2234] hover:bg-[#222E46] text-slate-300 text-xs font-semibold border border-[#28354E] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#EAB308] hover:bg-yellow-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Saving...' : editingService ? 'Save Changes' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceCatalogPage;
