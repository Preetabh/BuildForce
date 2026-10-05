import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HardHat,
  Ruler,
  ClipboardCheck,
  Building,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  MapPin,
  CheckCircle2,
  FileText,
  Plus,
} from 'lucide-react';
import { Project } from '../../types';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface SiteEngineerDashboardProps {
  showWelcomeHeader?: boolean;
}

export const SiteEngineerDashboard: React.FC<SiteEngineerDashboardProps> = ({
  showWelcomeHeader = true,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);

  const greeting = useMemo(() => {
    const currentHour = new Date().getHours();
    if (currentHour >= 4 && currentHour < 12) return 'Good morning';
    if (currentHour >= 12 && currentHour < 17) return 'Good afternoon';
    if (currentHour >= 17 && currentHour < 22) return 'Good evening';
    return 'Good night';
  }, []);

  const displayName = useMemo(() => {
    if (user?.name && user.name.trim()) return user.name.trim().split(' ')[0];
    if (user?.email) {
      const prefix = user.email.split('@')[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return '';
  }, [user]);

  const todayFormatted = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  useEffect(() => {
    fetchSiteData();
  }, []);

  const fetchSiteData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/projects?limit=50');
      const raw = res.data?.data || [];
      const main = raw.filter((p: any) => !p.parentId && !/-SP\d+/i.test(p.code || ''));
      setProjects(main);
    } catch (err) {
      console.error('Failed to load site projects', err);
    } finally {
      setIsLoading(false);
    }
  };

  const activeProjectsCount = projects.filter((p) => p.status !== 'completed' && p.status !== 'archived').length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      {showWelcomeHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse" />
              <span className="text-[11px] font-bold text-orange-400 tracking-wider uppercase">
                Site Operations & Field Execution
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
              {displayName ? `${greeting}, Er. ${displayName}` : greeting}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Field measurements, daily DPR execution logs, and site inspection status.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
            <div className="text-right hidden sm:block mr-1">
              <p className="text-xs font-semibold text-slate-300">{todayFormatted}</p>
              <p className="text-[11px] text-slate-500">Active Site Engineer Portal</p>
            </div>

            <button
              onClick={() => navigate('/planning/qc-master')}
              className="px-4 py-2 bg-[#141C2E] hover:bg-[#1A253E] border border-orange-500/30 text-orange-300 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>QC Checklists</span>
            </button>

            <button
              onClick={() => navigate('/planning/quantity-master')}
              className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all hover:shadow cursor-pointer"
            >
              <Ruler className="w-4 h-4 stroke-[3]" />
              <span>Quantity Master</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Site KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Sites */}
        <div className="bg-[#101625] border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-orange-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Assigned Active Sites</span>
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-white tracking-tight">
              {activeProjectsCount}
            </h2>
            <p className="text-xs text-orange-400 mt-1 font-medium">Ongoing site execution</p>
          </div>
        </div>

        {/* Card 2: Field Measurements */}
        <div className="bg-[#101625] border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">e-MB Measurements</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Ruler className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-blue-400 tracking-tight">Active</h2>
            <p className="text-xs text-slate-400 mt-1">Direct book records</p>
          </div>
        </div>

        {/* Card 3: Quality Control & Inspection */}
        <div className="bg-[#101625] border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">QC & Inspection Standards</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-emerald-400 tracking-tight">IS-Compliant</h2>
            <p className="text-xs text-slate-400 mt-1">Master checklists synchronized</p>
          </div>
        </div>

        {/* Card 4: Rate Master & SOR */}
        <div className="bg-[#101625] border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">SOR Master Rates</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-purple-400 tracking-tight">Published</h2>
            <p className="text-xs text-slate-400 mt-1">Schedule of Rates active</p>
          </div>
        </div>
      </div>

      {/* Two-Column Site Execution Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Assigned Site Projects */}
        <div className="lg:col-span-8 bg-[#0E1424] border border-[#18233A] rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HardHat className="w-4 h-4 text-orange-400" />
                Active Construction Sites & Work Execution
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Current site locations requiring progress tracking and measurement recording
              </p>
            </div>
            <button
              onClick={() => navigate('/planning')}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Project Planning</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-500">Loading site projects...</div>
          ) : projects.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No active site projects assigned to your portfolio yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400">
                    <th className="py-2.5 px-3">Project Code</th>
                    <th className="py-2.5 px-3">Site / Project Name</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Progress</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {projects.slice(0, 6).map((proj) => (
                    <tr key={proj._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-orange-400">
                        {proj.code}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-white block">{proj.name}</span>
                        <span className="text-[10px] text-slate-500">{proj.clientName || 'Civil Works'}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 flex items-center gap-1 mt-2">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate max-w-[120px]">{proj.location || '-'}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="w-24">
                          <div className="flex items-center justify-between text-[10px] mb-1">
                            <span className="font-bold text-white">{proj.progress || 0}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-orange-400 rounded-full"
                              style={{ width: `${proj.progress || 0}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right space-x-1.5">
                        <button
                          onClick={() => navigate(`/projects/${proj._id}`)}
                          className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-lg text-[10.5px] font-bold cursor-pointer"
                        >
                          Workspace
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Quick Operations & Quality Guidelines */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Operations Portal */}
          <div className="bg-[#0E1424] border border-[#18233A] rounded-2xl p-5 shadow-lg space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Ruler className="w-4 h-4 text-orange-400" />
              Field Operations Quick Links
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => navigate('/planning/quantity-master')}
                className="w-full p-3 rounded-xl bg-[#12192B] hover:bg-[#18223B] border border-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer group"
              >
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                    Quantity Master Catalog
                  </p>
                  <p className="text-[10.5px] text-slate-400 mt-0.5">
                    Search standard concrete, brickwork & plaster rates
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => navigate('/planning/qc-master')}
                className="w-full p-3 rounded-xl bg-[#12192B] hover:bg-[#18223B] border border-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer group"
              >
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                    QC Inspection & Checklists
                  </p>
                  <p className="text-[10.5px] text-slate-400 mt-0.5">
                    Pre-pour concrete, steel reinforcement check
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => navigate('/sor')}
                className="w-full p-3 rounded-xl bg-[#12192B] hover:bg-[#18223B] border border-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer group"
              >
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                    Schedule of Rates (SOR)
                  </p>
                  <p className="text-[10.5px] text-slate-400 mt-0.5">
                    CPWD / State PWD specifications & units
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>

          {/* Site Execution Protocols */}
          <div className="bg-[#0E1424] border border-[#18233A] rounded-2xl p-5 shadow-lg space-y-3">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <CheckCircle2 className="w-4 h-4" />
              Daily Field Protocol Checklist
            </h3>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>Verify daily labor attendance & safety equipment on site</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>Record concrete slump test & cube casting for RCC works</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>Log actual measurement entries in e-MB before closing shift</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>Submit daily site kharcha and material receipt vouchers</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
