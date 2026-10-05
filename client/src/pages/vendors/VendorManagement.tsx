import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  Plus,
  Search,
  RotateCcw,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  MapPin,
  Building2,
  Check,
  Edit3,
  Trash2,
  Power,
  Bell,
} from 'lucide-react';
import { VendorItem, VendorType, VendorStatus } from '../../types/vendor';
import vendorService from '../../services/vendor.service';
import { AddVendorModal } from '../../components/vendors/AddVendorModal';
import { UserProfileMenu } from '../../components/profile/UserProfileMenu';

export const VendorManagement: React.FC = () => {
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedStatus, setSelectedStatus] = useState('Active');

  // Modals & Actions
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [vendorToEdit, setVendorToEdit] = useState<VendorItem | null>(null);
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const data = await vendorService.getVendors({
        search: search.trim() || undefined,
        type: selectedType,
        status: selectedStatus,
      });
      setVendors(data);
    } catch (err) {
      console.error('Failed to load vendors', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    fetchVendors();
  };

  const handleReset = () => {
    setSearch('');
    setSelectedType('All Types');
    setSelectedStatus('Active');
    vendorService.getVendors({ status: 'Active' }).then(setVendors).catch(console.error);
  };

  const handleCreateOrUpdate = async (data: Partial<VendorItem>) => {
    if (vendorToEdit) {
      const updated = await vendorService.updateVendor(vendorToEdit._id, data);
      setVendors((prev) => prev.map((v) => (v._id === updated._id ? updated : v)));
    } else {
      const created = await vendorService.createVendor(data);
      setVendors((prev) => [created, ...prev]);
    }
    setVendorToEdit(null);
  };

  const handleToggleStatus = async (vendor: VendorItem) => {
    setActionMenuOpenId(null);
    try {
      const updated = await vendorService.toggleVendorStatus(vendor._id);
      setVendors((prev) => prev.map((v) => (v._id === updated._id ? updated : v)));
    } catch (err) {
      alert('Failed to change status');
    }
  };

  const handleDelete = async (vendor: VendorItem) => {
    setActionMenuOpenId(null);
    if (window.confirm(`Are you sure you want to remove vendor "${vendor.name}"?`)) {
      try {
        await vendorService.deleteVendor(vendor._id);
        setVendors((prev) => prev.filter((v) => v._id !== vendor._id));
      } catch (err) {
        alert('Failed to delete vendor');
      }
    }
  };

  // Close 3-dots action menu when clicking outside
  useEffect(() => {
    const handleDocumentClick = () => setActionMenuOpenId(null);
    if (actionMenuOpenId) {
      document.addEventListener('click', handleDocumentClick);
    }
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [actionMenuOpenId]);

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans">
      {/* Top Header matching Screenshot 1 */}
      <header className="sticky top-0 z-30 bg-[#0A0F1D]/95 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-4 max-w-[1700px] mx-auto">
          {/* Left Brand Title */}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse" />
            <h1 className="text-xs sm:text-sm font-black tracking-widest uppercase font-mono text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
              LEAD FORCE PORTAL
            </h1>
          </div>

          {/* Right Session Active & Profile Menu */}
          <div className="flex items-center gap-3">
            {/* Active Session Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#141B2D] border border-amber-500/30 text-[11px] font-mono text-amber-300 shadow-inner">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>2026–2027 Session Active</span>
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              title="Notifications"
              className="w-8 h-8 rounded-full bg-[#141B2D] border border-slate-800 text-amber-400 hover:text-amber-300 flex items-center justify-center transition-colors"
            >
              <Bell className="w-3.5 h-3.5" />
            </button>

            {/* Interactive User Profile Capsule */}
            <div className="pl-2 border-l border-slate-800">
              <UserProfileMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Main Page Container */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1700px] mx-auto w-full space-y-5">
        {/* Breadcrumb & Title Row matching Screenshot 1 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <span>Admin</span>
              <span className="text-slate-600">/</span>
              <span className="text-amber-400 font-semibold">Vendor Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Vendor Partners
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Manage material suppliers and service providers
            </p>
          </div>

          <button
            onClick={() => {
              setVendorToEdit(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <Truck className="w-4 h-4 fill-slate-950 stroke-none" />
            <span>Add New Vendor</span>
          </button>
        </div>

        {/* Filter Bar Row matching Screenshot 1 */}
        <form
          onSubmit={handleFilter}
          className="bg-[#0D1424] border border-slate-800/90 rounded-2xl p-3.5 flex flex-col md:flex-row items-stretch md:items-center gap-3 shadow-md"
        >
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, mobile or email..."
              className="w-full pl-10 pr-3 py-2 text-xs bg-[#131D31] border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* VENDOR TYPE Dropdown */}
          <div className="w-full md:w-52">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 px-1">
              Vendor Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#131D31] border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-500"
            >
              <option value="All Types">All Types</option>
              <option value="Material">Material</option>
              <option value="Service">Service</option>
              <option value="Equipment">Equipment</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* STATUS Dropdown */}
          <div className="w-full md:w-44">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 px-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#131D31] border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-500"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="All">All</option>
            </select>
          </div>

          {/* Filter & Reset Buttons */}
          <div className="flex items-center gap-2 self-end md:self-auto pt-4 md:pt-0">
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Filter
            </button>
            <button
              type="button"
              onClick={handleReset}
              title="Reset Filters"
              className="p-2 bg-[#131D31] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Vendors Data Table matching Screenshot 1 */}
        <div className="bg-[#0D1424] border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-[#0A0F1D]/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Vendor Name</th>
                  <th className="py-3.5 px-3">Type</th>
                  <th className="py-3.5 px-4">Supplies / Items</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-3 text-center">Delivery</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                  <th className="py-3.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      Loading vendor partners...
                    </td>
                  </tr>
                ) : vendors.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                          <Truck className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-white">No Vendors in Database</p>
                        <p className="text-xs text-slate-400 mt-1 mb-4">
                          No vendor records found in the database. Add your first vendor partner.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setVendorToEdit(null);
                            setIsAddModalOpen(true);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Add New Vendor</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  vendors.map((vendor) => {
                    const initial = vendor.name?.charAt(0).toUpperCase() || 'V';
                    const isService = vendor.type === 'Service';
                    const isMaterial = vendor.type === 'Material';

                    return (
                      <tr
                        key={vendor._id}
                        className="hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* Vendor Name + Circle Avatar */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500/30 to-yellow-400/20 text-amber-300 border border-amber-500/40 font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                              {initial}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white text-xs tracking-tight truncate max-w-[200px]">
                                {vendor.name}
                              </p>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                GST: {vendor.gstNumber || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Type Pill */}
                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              isMaterial
                                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                                : isService
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                            }`}
                          >
                            {vendor.type}
                          </span>
                        </td>

                        {/* Supplies / Items */}
                        <td className="py-3.5 px-4 text-slate-300 font-medium max-w-[220px] truncate">
                          {vendor.supplies || '-'}
                        </td>

                        {/* Contact */}
                        <td className="py-3.5 px-4">
                          <p className="font-mono text-slate-200">{vendor.contactPhone}</p>
                          {vendor.contactEmail && (
                            <p className="text-[10px] text-slate-500 truncate max-w-[180px] mt-0.5">
                              {vendor.contactEmail}
                            </p>
                          )}
                        </td>

                        {/* Location */}
                        <td className="py-3.5 px-4 text-slate-400 max-w-[180px] truncate">
                          {vendor.location || '-'}
                        </td>

                        {/* Delivery */}
                        <td className="py-3.5 px-3 text-center">
                          {vendor.deliveryAvailable ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Yes</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500">No</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              vendor.status === 'Active'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {vendor.status}
                          </span>
                        </td>

                        {/* Actions Menu */}
                        <td className="py-3.5 px-3 text-center relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionMenuOpenId(
                                actionMenuOpenId === vendor._id ? null : vendor._id
                              );
                            }}
                            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Dropdown Menu */}
                          {actionMenuOpenId === vendor._id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-4 mt-1 w-36 bg-[#0F172A] border border-slate-800 rounded-xl shadow-xl py-1 z-30 text-left animate-in fade-in duration-100"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setActionMenuOpenId(null);
                                  setVendorToEdit(vendor);
                                  setIsAddModalOpen(true);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                                <span>Edit Vendor</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleStatus(vendor)}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                              >
                                <Power className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{vendor.status === 'Active' ? 'Deactivate' : 'Activate'}</span>
                              </button>

                              <div className="my-1 border-t border-slate-800" />

                              <button
                                type="button"
                                onClick={() => handleDelete(vendor)}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Vendor Modal */}
      <AddVendorModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setVendorToEdit(null);
        }}
        onSubmit={handleCreateOrUpdate}
        vendorToEdit={vendorToEdit}
      />
    </div>
  );
};

export default VendorManagement;
