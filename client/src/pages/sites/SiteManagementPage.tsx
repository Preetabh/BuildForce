import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  HardHat,
  MapPin,
  Calendar,
  User,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Layers,
  X,
  Check,
  ChevronDown,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/common/Button';
import { siteService } from '../../services/site.service';
import { rbacService } from '../../services/rbac.service';
import { Project, ProjectStatus } from '../../types';
import { SiteEngineerItem } from '../../types/rbac';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface OutletContextType {
  setSidebarOpen: (open: boolean) => void;
}

export const SiteManagementPage: React.FC = () => {
  const { setSidebarOpen } = useOutletContext<OutletContextType>();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Project | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formClientName, setFormClientName] = useState('');
  const [formProjectType, setFormProjectType] = useState('Residential Building');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formStatus, setFormStatus] = useState<ProjectStatus>('active');
  const [formDescription, setFormDescription] = useState('');
  const [formAssignedEngineers, setFormAssignedEngineers] = useState<string[]>([]);

  useEscapeKey(() => setIsModalOpen(false), isModalOpen);

  // Fetch sites
  const { data: sitesData, isLoading } = useQuery({
    queryKey: ['adminSitesList'],
    queryFn: () => siteService.getSites({ limit: 100 }),
  });

  // Fetch all site engineers for assignment
  const { data: engineers = [] } = useQuery({
    queryKey: ['siteEngineersListForAssignment'],
    queryFn: rbacService.getSiteEngineers,
  });

  const sites = sitesData?.projects || [];

  const createSiteMutation = useMutation({
    mutationFn: siteService.createSite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSitesList'] });
      queryClient.invalidateQueries({ queryKey: ['siteEngineers'] });
      queryClient.invalidateQueries({ queryKey: ['headerProjectsList'] });
      setIsModalOpen(false);
      resetForm();
    },
  });

  const updateSiteMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> & { assignedEngineers?: string[] } }) =>
      siteService.updateSite(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSitesList'] });
      queryClient.invalidateQueries({ queryKey: ['siteEngineers'] });
      queryClient.invalidateQueries({ queryKey: ['headerProjectsList'] });
      setIsModalOpen(false);
      resetForm();
    },
  });

  const deleteSiteMutation = useMutation({
    mutationFn: siteService.deleteSite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSitesList'] });
      queryClient.invalidateQueries({ queryKey: ['siteEngineers'] });
      queryClient.invalidateQueries({ queryKey: ['headerProjectsList'] });
    },
  });

  const resetForm = () => {
    setEditingSite(null);
    setFormName('');
    setFormCode('');
    setFormLocation('');
    setFormClientName('');
    setFormProjectType('Residential Building');
    setFormStartDate('');
    setFormEndDate('');
    setFormStatus('active');
    setFormDescription('');
    setFormAssignedEngineers([]);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (site: Project) => {
    setEditingSite(site);
    setFormName(site.name);
    setFormCode(site.code);
    setFormLocation(site.location || '');
    setFormClientName(site.clientName || '');
    setFormProjectType(site.projectType || 'Residential Building');
    setFormStartDate(site.startDate ? new Date(site.startDate).toISOString().slice(0, 10) : '');
    setFormEndDate(site.endDate ? new Date(site.endDate).toISOString().slice(0, 10) : '');
    setFormStatus(site.status);
    setFormDescription(site.description || '');

    const assignedIds = Array.isArray(site.assignedEngineers)
      ? site.assignedEngineers.map((e: any) => (typeof e === 'string' ? e : e._id))
      : [];
    setFormAssignedEngineers(assignedIds);
    setIsModalOpen(true);
  };

  const toggleEngineer = (engId: string) => {
    setFormAssignedEngineers((prev) =>
      prev.includes(engId) ? prev.filter((id) => id !== engId) : [...prev, engId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const payload: any = {
      name: formName.trim(),
      code: formCode.trim() || undefined,
      location: formLocation.trim() || undefined,
      clientName: formClientName.trim() || undefined,
      projectType: formProjectType,
      status: formStatus,
      description: formDescription.trim() || undefined,
      startDate: formStartDate || undefined,
      endDate: formEndDate || undefined,
      assignedEngineers: formAssignedEngineers,
    };

    if (editingSite) {
      updateSiteMutation.mutate({ id: editingSite._id, data: payload });
    } else {
      createSiteMutation.mutate(payload);
    }
  };

  // Stats calculation
  const totalCount = sites.length;
  const activeCount = sites.filter((s) => s.status === 'active').length;
  const draftCount = sites.filter((s) => s.status === 'draft' || s.status === 'on_hold').length;
  const completedCount = sites.filter((s) => s.status === 'completed').length;

  // Filtered sites
  const filteredSites = sites.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.location && s.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.clientName && s.clientName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 flex flex-col">
      <Header
        breadcrumbs={[{ label: 'Admin' }, { label: 'Site Management & Assignments' }]}
        onToggleSidebar={() => setSidebarOpen(true)}
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-6">
        {/* Title Bar & Add Site Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[11px] font-bold text-amber-400 tracking-wider uppercase">
                Field Operations & Site Assignment
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1 flex items-center gap-2.5">
              <Building2 className="w-7 h-7 text-amber-400" />
              <span>Construction Sites & Engineer Assignment</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Create and manage construction sites, configure project scopes, and assign authorized site engineers with restricted access permissions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleOpenAdd}
              className="bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Construction Site</span>
            </Button>
          </div>
        </div>

        {/* Top Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#0C101A] border border-[#182032] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Total Sites</span>
              <Building2 className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-white mt-2">{totalCount}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Projects registered</p>
          </div>

          <div className="bg-[#0C101A] border border-[#182032] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Active Execution</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <p className="text-2xl font-black text-emerald-400 mt-2">{activeCount}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Under ongoing work</p>
          </div>

          <div className="bg-[#0C101A] border border-[#182032] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Draft & On-Hold</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-amber-400 mt-2">{draftCount}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Planning & pending</p>
          </div>

          <div className="bg-[#0C101A] border border-[#182032] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Completed</span>
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-black text-blue-400 mt-2">{completedCount}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Successfully handed over</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-[#0C101A] border border-[#182032] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by site name, code, location..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white text-xs placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <span className="text-xs text-slate-400 font-semibold">Status:</span>
            {['all', 'active', 'draft', 'on_hold', 'completed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-[#141B2D] text-slate-400 hover:text-white hover:bg-[#1A243D]'
                }`}
              >
                {st === 'on_hold' ? 'On Hold' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Sites Table */}
        <div className="bg-[#0C101A] border border-[#182032] rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1B2438] bg-[#0E1526]/80 text-[11px] font-bold uppercase tracking-wider text-amber-400/90">
                  <th className="py-3.5 px-4 sm:px-6">Site Details</th>
                  <th className="py-3.5 px-4">Location & Client</th>
                  <th className="py-3.5 px-4">Assigned Site Engineers</th>
                  <th className="py-3.5 px-4">Timeline</th>
                  <th className="py-3.5 px-4">Progress</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#151D2E] text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading construction sites...
                    </td>
                  </tr>
                ) : filteredSites.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400">
                      <div className="max-w-xs mx-auto space-y-3">
                        <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <p className="font-semibold text-white text-sm">No construction sites found</p>
                        <p className="text-xs text-slate-400">
                          Add your project sites and assign site engineers to begin field operations.
                        </p>
                        <Button
                          onClick={handleOpenAdd}
                          className="bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add New Site</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSites.map((site) => {
                    const assignedList = Array.isArray(site.assignedEngineers)
                      ? site.assignedEngineers
                      : [];

                    return (
                      <tr key={site._id} className="hover:bg-[#121929]/70 transition-colors">
                        {/* Site Name & Code */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2D200E] via-[#1F170B] to-[#120F08] border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 shadow-md">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-semibold text-white block text-xs">{site.name}</span>
                              <span className="text-[10.5px] font-mono text-amber-400/90 block">
                                {site.code} • {site.projectType || 'Residential'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Location & Client */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[140px]">{site.location || 'Site Location'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <User className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[140px] text-[11px]">{site.clientName || 'Direct'}</span>
                            </div>
                          </div>
                        </td>

                        {/* Assigned Site Engineers */}
                        <td className="py-3.5 px-4">
                          {assignedList.length === 0 ? (
                            <span className="text-[11px] text-slate-400 italic">No engineer assigned</span>
                          ) : (
                            <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                              {assignedList.map((eng: any, i: number) => {
                                const engName = typeof eng === 'string' ? 'Engineer' : eng.name;
                                return (
                                  <span
                                    key={i}
                                    title={typeof eng === 'object' ? `${eng.name} (${eng.loginId})` : undefined}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#18233C] border border-amber-500/30 text-amber-300 text-[10.5px] font-semibold"
                                  >
                                    <HardHat className="w-3 h-3 text-amber-400" />
                                    <span className="truncate max-w-[90px]">{engName}</span>
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </td>

                        {/* Timeline */}
                        <td className="py-3.5 px-4">
                          <div className="text-[11px] font-mono text-slate-300">
                            {site.startDate ? new Date(site.startDate).toLocaleDateString('en-GB') : 'Start TBD'}
                            <span className="text-slate-400 mx-1">→</span>
                            {site.endDate ? new Date(site.endDate).toLocaleDateString('en-GB') : 'End TBD'}
                          </div>
                        </td>

                        {/* Progress */}
                        <td className="py-3.5 px-4">
                          <div className="w-28 space-y-1">
                            <div className="flex items-center justify-between text-[10.5px]">
                              <span className="font-bold text-white">{site.progress || 0}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                                style={{ width: `${Math.min(100, site.progress || 0)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold capitalize ${
                              site.status === 'active'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : site.status === 'completed'
                                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {site.status === 'on_hold' ? 'On Hold' : site.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(site)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all active:scale-95 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit / Assign</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Delete site "${site.name}"?`)) {
                                  deleteSiteMutation.mutate(site._id);
                                }
                              }}
                              title="Delete Site"
                              className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add / Edit Site Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#0D121F] border border-amber-500/30 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-[#1C2538] pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-400" />
                  {editingSite ? 'Edit Construction Site & Assignments' : 'Create New Construction Site'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Specify site details, timeline, and assign authorized site engineers.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Site / Project Name <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Shalimar Grand Tower"
                    className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Site Code (Auto if blank)
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="e.g. SHAL-1001"
                    className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Site Location / Address <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Vibhuti Khand, Gomti Nagar, Lucknow"
                    className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Client Name</label>
                  <input
                    type="text"
                    value={formClientName}
                    onChange={(e) => setFormClientName(e.target.value)}
                    placeholder="e.g. Client Name / Company"
                    className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Project Type</label>
                  <select
                    value={formProjectType}
                    onChange={(e) => setFormProjectType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Residential Building">Residential Building</option>
                    <option value="Commercial Complex">Commercial Complex</option>
                    <option value="Infrastructure Road/Highway">Infrastructure Road/Highway</option>
                    <option value="Industrial Shed">Industrial Shed</option>
                    <option value="Interior Fitout">Interior Fitout</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Expected Completion</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Site Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white focus:outline-none focus:border-amber-500 font-semibold"
                  >
                    <option value="active">Active Execution</option>
                    <option value="draft">Draft / Planning</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Site Description / Scope</label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="e.g. G+14 structure with basement parking"
                    className="w-full px-3 py-2 rounded-xl bg-[#141B2D] border border-[#232F4A] text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Assign Authorized Site Engineers */}
              <div className="space-y-2 pt-2 border-t border-[#1C2538]">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-300 font-semibold flex items-center gap-1.5">
                    <HardHat className="w-4 h-4 text-amber-400" />
                    <span>Assign Authorized Site Engineers ({formAssignedEngineers.length} selected)</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Engineers will only see sites explicitly assigned to them
                  </span>
                </div>

                <div className="border border-[#232F4A] bg-[#121929] rounded-xl p-3 max-h-48 overflow-y-auto custom-scrollbar space-y-1.5">
                  {engineers.length === 0 ? (
                    <p className="text-center text-slate-400 py-3">No site engineers registered yet</p>
                  ) : (
                    engineers.map((eng: SiteEngineerItem) => {
                      const isChecked = formAssignedEngineers.includes(eng._id);
                      return (
                        <div
                          key={eng._id}
                          onClick={() => toggleEngineer(eng._id)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-amber-500/15 border border-amber-500/30 text-white'
                              : 'bg-[#161F33] hover:bg-[#1B2742] text-slate-300 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                                isChecked ? 'bg-amber-500 text-slate-950 font-bold' : 'border border-slate-600'
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div className="truncate">
                              <p className="font-semibold text-xs truncate leading-tight">{eng.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {eng.loginId} • {eng.expertise || 'Common'}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              eng.status === 'Active'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {eng.status}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#1C2538]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-[#141B2D] hover:bg-[#1A233A] font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSiteMutation.isPending || updateSiteMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {createSiteMutation.isPending || updateSiteMutation.isPending
                    ? 'Saving Site...'
                    : editingSite
                    ? 'Save Changes'
                    : 'Create Construction Site'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
