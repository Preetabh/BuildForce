import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  User,
  ArrowLeft,
  Building2,
  HardHat,
  Briefcase,
  Sparkles,
  Handshake,
  Clock,
  ShieldCheck,
  Search,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import api from '../services/api';
import { Header } from '../components/layout/Header';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { formatDate } from '../utils/formatters';

interface OutletContextType {
  setSidebarOpen: (open: boolean) => void;
}

export interface RecycleBinItem {
  _id: string;
  companyId: string;
  entityType: 'Project' | 'SiteEngineer' | 'Lead' | 'Client' | 'Partner' | 'User' | 'Service' | string;
  originalId: string;
  title: string;
  code?: string;
  subtitle?: string;
  data?: any;
  deletedBy?: { _id: string; name: string; email: string } | string;
  deletedByName?: string;
  deletedAt: string;
  retentionDays: number;
  expiresAt: string;
  daysRemaining: number;
  status: 'active' | 'restored' | 'purged';
}

type EntityCategory = 'ALL' | 'SiteEngineer' | 'Client' | 'Lead' | 'Project' | 'Partner' | 'User' | 'Service';

export const RecycleBin: React.FC = () => {
  const { setSidebarOpen } = useOutletContext<OutletContextType>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState<EntityCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<RecycleBinItem | null>(null);
  const [isDeletingPermanently, setIsDeletingPermanently] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Fetch all recycle bin items across all modules
  const {
    data: items = [],
    isLoading,
    refetch,
  } = useQuery<RecycleBinItem[]>({
    queryKey: ['recycleBinItems'],
    queryFn: async () => {
      const res = await api.get('/recycle-bin');
      return res.data?.data || [];
    },
  });

  // Restore item mutation
  const restoreMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await api.post(`/recycle-bin/${itemId}/restore`);
      return res.data;
    },
    onSuccess: (data) => {
      setActionSuccessMsg(data?.message || 'Item restored successfully!');
      setTimeout(() => setActionSuccessMsg(null), 4000);
      queryClient.invalidateQueries({ queryKey: ['recycleBinItems'] });
      queryClient.invalidateQueries({ queryKey: ['recycleBinCount'] });
      queryClient.invalidateQueries({ queryKey: ['recycleBinProjects'] });
      queryClient.invalidateQueries({ queryKey: ['siteEngineers'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projectStats'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['rbacUsers'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['serviceCatalog'] });
    },
  });

  // Permanent delete mutation
  const permanentDeleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await api.delete(`/recycle-bin/${itemId}/permanent`);
      return res.data;
    },
    onSuccess: (data) => {
      setActionSuccessMsg(data?.message || 'Item permanently deleted');
      setTimeout(() => setActionSuccessMsg(null), 4000);
      queryClient.invalidateQueries({ queryKey: ['recycleBinItems'] });
      queryClient.invalidateQueries({ queryKey: ['recycleBinCount'] });
      queryClient.invalidateQueries({ queryKey: ['recycleBinProjects'] });
      queryClient.invalidateQueries({ queryKey: ['siteEngineers'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projectStats'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['rbacUsers'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['serviceCatalog'] });
      setPermanentDeleteTarget(null);
    },
  });

  const handleRestore = (item: RecycleBinItem) => {
    restoreMutation.mutate(item._id);
  };

  const handleConfirmPermanentDelete = async () => {
    if (!permanentDeleteTarget) return;
    setIsDeletingPermanently(true);
    try {
      await permanentDeleteMutation.mutateAsync(permanentDeleteTarget._id);
    } finally {
      setIsDeletingPermanently(false);
    }
  };

  // Filter items by category and search term
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory !== 'ALL' && item.entityType !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = item.title?.toLowerCase().includes(query);
        const matchCode = item.code?.toLowerCase().includes(query);
        const matchSubtitle = item.subtitle?.toLowerCase().includes(query);
        const matchType = item.entityType?.toLowerCase().includes(query);
        return matchTitle || matchCode || matchSubtitle || matchType;
      }
      return true;
    });
  }, [items, selectedCategory, searchQuery]);

  // Counts by category
  const categoryCounts = useMemo(() => {
    const counts = {
      ALL: items.length,
      SiteEngineer: 0,
      Client: 0,
      Lead: 0,
      Project: 0,
      Partner: 0,
      User: 0,
      Service: 0,
    };
    for (const item of items) {
      if (item.entityType in counts) {
        counts[item.entityType as keyof typeof counts]++;
      }
    }
    return counts;
  }, [items]);

  const getEntityConfig = (type: string) => {
    switch (type) {
      case 'Service':
        return {
          label: 'Service',
          icon: Layers,
          colorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
          badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        };
      case 'User':
        return {
          label: 'User / Staff',
          icon: User,
          colorClass: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
          badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
        };
      case 'SiteEngineer':
        return {
          label: 'Site Engineer',
          icon: HardHat,
          colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
          badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        };
      case 'Client':
        return {
          label: 'Client Account',
          icon: Briefcase,
          colorClass: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
          badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
        };
      case 'Lead':
        return {
          label: 'Lead',
          icon: Sparkles,
          colorClass: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
          badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        };
      case 'Project':
        return {
          label: 'Project',
          icon: Building2,
          colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
          badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        };
      case 'Partner':
        return {
          label: 'Reference Partner',
          icon: Handshake,
          colorClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
          badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        };
      default:
        return {
          label: type,
          icon: Trash2,
          colorClass: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
          badgeClass: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
        };
    }
  };

  return (
    <div>
      <Header
        breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Recycle Bin' }]}
        onToggleSidebar={() => setSidebarOpen(true)}
      />

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Top Info Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-erp-text tracking-tight">
                Recycle Bin
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                {items.length} Deleted Items
              </span>
            </div>
            <p className="text-xs sm:text-sm text-erp-text-muted mt-1">
              Soft-deleted records across Site Engineers, Leads, Clients, Projects &amp; Partners are safely preserved here.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Dashboard
          </Button>
        </div>

        {/* 60-Day Safe Retention Policy Hero Card */}
        <div className="rounded-xl p-4 sm:p-5 bg-gradient-to-r from-emerald-950/40 via-cyan-950/30 to-slate-900 border border-emerald-500/20 shadow-lg relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-emerald-200">
                    60-Day Safe Retention &amp; Recovery Guarantee
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                    60 Days Active
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
                  Koi bhi record delete hone par turant permanent delete nahi hota—seedhe Recycle Bin me safe rehta hai. 
                  Recycle bin 60 dino tak empty nahi hota. Aap kisi bhi samay 1-click se use wapas restore kar sakte hain.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900/80 border border-slate-700/60 text-xs text-slate-300">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Retention Period: <strong className="text-emerald-300">60 Days</strong></span>
            </div>
          </div>
        </div>

        {/* Action success alert */}
        {actionSuccessMsg && (
          <div className="p-3.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Filter Tabs & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory === 'ALL'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-900/70 text-slate-400 hover:text-slate-200 border border-erp-border'
              }`}
            >
              All Items
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedCategory === 'ALL' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                {categoryCounts.ALL}
              </span>
            </button>

            <button
              onClick={() => setSelectedCategory('SiteEngineer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory === 'SiteEngineer'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-900/70 text-slate-400 hover:text-slate-200 border border-erp-border'
              }`}
            >
              <HardHat className="w-3.5 h-3.5" />
              Site Engineers
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedCategory === 'SiteEngineer' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                {categoryCounts.SiteEngineer}
              </span>
            </button>

            <button
              onClick={() => setSelectedCategory('Client')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory === 'Client'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-900/70 text-slate-400 hover:text-slate-200 border border-erp-border'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              Clients
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedCategory === 'Client' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                {categoryCounts.Client}
              </span>
            </button>

            <button
              onClick={() => setSelectedCategory('Lead')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory === 'Lead'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-900/70 text-slate-400 hover:text-slate-200 border border-erp-border'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Leads
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedCategory === 'Lead' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                {categoryCounts.Lead}
              </span>
            </button>

            <button
              onClick={() => setSelectedCategory('Project')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory === 'Project'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-900/70 text-slate-400 hover:text-slate-200 border border-erp-border'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Projects
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedCategory === 'Project' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                {categoryCounts.Project}
              </span>
            </button>

            <button
              onClick={() => setSelectedCategory('Partner')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory === 'Partner'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-900/70 text-slate-400 hover:text-slate-200 border border-erp-border'
              }`}
            >
              <Handshake className="w-3.5 h-3.5" />
              Partners
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedCategory === 'Partner' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                {categoryCounts.Partner}
              </span>
            </button>

            <button
              onClick={() => setSelectedCategory('User')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory === 'User'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-900/70 text-slate-400 hover:text-slate-200 border border-erp-border'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Users / Staff
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedCategory === 'User' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                {categoryCounts.User}
              </span>
            </button>

            <button
              onClick={() => setSelectedCategory('Service')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory === 'Service'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-900/70 text-slate-400 hover:text-slate-200 border border-erp-border'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Services
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedCategory === 'Service' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                {categoryCounts.Service}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deleted items..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900/80 border border-erp-border rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition-colors"
            />
          </div>
        </div>

        {/* Item List / Empty State */}
        {isLoading ? (
          <div className="py-20 text-center text-sm text-erp-text-muted">
            Loading recycle bin items...
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={Trash2}
            title={selectedCategory === 'ALL' ? 'Recycle Bin is Empty' : `No deleted ${selectedCategory} found`}
            description="Whenever any Site Engineer, Client, Lead, Project, or Partner is deleted, it is safely retained here for 60 days before any automatic cleanup."
            actionLabel="Return to Dashboard"
            onAction={() => navigate('/')}
          />
        ) : (
          <div className="glass-panel rounded-xl border border-erp-border overflow-hidden">
            <div className="divide-y divide-erp-border/80">
              {filteredItems.map((item) => {
                const config = getEntityConfig(item.entityType);
                const IconComponent = config.icon;
                const daysRemaining = item.daysRemaining !== undefined ? item.daysRemaining : 60;
                const isUrgent = daysRemaining <= 5;
                const isWarning = daysRemaining <= 20 && !isUrgent;

                return (
                  <div
                    key={item._id}
                    className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors"
                  >
                    {/* Left: Item Details */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${config.colorClass}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-erp-text text-base truncate">
                            {item.title}
                          </h4>
                          {item.code && (
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {item.code}
                            </span>
                          )}
                          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${config.badgeClass}`}>
                            {config.label}
                          </span>
                        </div>

                        {item.subtitle && (
                          <p className="text-xs text-slate-300">
                            {item.subtitle}
                          </p>
                        )}

                        <div className="flex items-center gap-4 pt-0.5 flex-wrap text-xs text-erp-text-muted">
                          <span className="flex items-center gap-1 text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Deleted: {formatDate(item.deletedAt)}</span>
                          </span>

                          {item.deletedByName && (
                            <span className="flex items-center gap-1 text-slate-400">
                              <User className="w-3.5 h-3.5" />
                              <span>By: {item.deletedByName}</span>
                            </span>
                          )}

                          {/* 60-Day Retention Countdown Badge */}
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                              isUrgent
                                ? 'bg-red-500/15 text-red-300 border-red-500/30'
                                : isWarning
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            }`}
                          >
                            <span>⏳</span>
                            <span>{daysRemaining} days remaining in 60-day safety period</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Actions: Restore & Permanent Delete */}
                    <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(item)}
                        isLoading={restoreMutation.isPending && restoreMutation.variables === item._id}
                        leftIcon={<RotateCcw className="w-4 h-4 text-emerald-400" />}
                      >
                        Restore {config.label}
                      </Button>

                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setPermanentDeleteTarget(item)}
                        leftIcon={<Trash2 className="w-4 h-4" />}
                      >
                        Purge
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Permanent Delete */}
      <Modal
        isOpen={!!permanentDeleteTarget}
        onClose={() => setPermanentDeleteTarget(null)}
        title="Permanently Purge Item"
        subtitle="This action is irreversible and bypasses the 60-day safety period."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Irrevocable Permanent Deletion</p>
              <p className="mt-1 text-erp-text-muted leading-relaxed">
                You are about to permanently purge{' '}
                <strong className="text-erp-text">{permanentDeleteTarget?.title}</strong>{' '}
                ({permanentDeleteTarget?.entityType}). It will be completely removed from the database and cannot be restored.
              </p>
            </div>
          </div>

          <p className="text-xs text-erp-text-subtle">
            Normally, all deleted items remain safely in the Recycle Bin for 60 days before any purge. Proceed only if you are certain this record is no longer needed.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-erp-border">
            <Button
              variant="outline"
              onClick={() => setPermanentDeleteTarget(null)}
              disabled={isDeletingPermanently}
            >
              Cancel (Keep in 60-day bin)
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmPermanentDelete}
              isLoading={isDeletingPermanently}
            >
              Confirm Permanent Purge
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
