import React from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import {
  PauseCircle,
  Clock,
  ShieldAlert,
  ArrowRight,
  Users,
  Briefcase,
  HardHat,
  ChevronRight,
  BookOpen,
  Calculator,
  ClipboardCheck,
  Layers,
  Home,
} from 'lucide-react';
import { Header } from '../components/layout/Header';

interface OutletContextType {
  setSidebarOpen: (open: boolean) => void;
}

interface TempHoldConfig {
  title: string;
  category: string;
  icon: React.ElementType;
  description: string;
  pausedFeatures: string[];
}

export const TempHoldModule: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setSidebarOpen } = useOutletContext<OutletContextType>();

  const featureConfigs: Record<string, TempHoldConfig> = {
    '/': {
      title: 'Home & Projects Portfolio',
      category: 'EXECUTIVE & PORTFOLIO',
      icon: Home,
      description:
        'The main Executive Dashboard and Project Portfolio management features are currently placed on temporary hold by administration.',
      pausedFeatures: [
        'Live Project Creation & Portfolio Cards',
        'Budget Allocation & Revenue Tracking',
        'Project Progress Milestone Analytics',
        'Direct Workspace Deep-dive Links',
      ],
    },
    '/home': {
      title: 'Home & Projects Portfolio',
      category: 'EXECUTIVE & PORTFOLIO',
      icon: Home,
      description:
        'The main Executive Dashboard and Project Portfolio management features are currently placed on temporary hold by administration.',
      pausedFeatures: [
        'Live Project Creation & Portfolio Cards',
        'Budget Allocation & Revenue Tracking',
        'Project Progress Milestone Analytics',
        'Direct Workspace Deep-dive Links',
      ],
    },
    '/sor': {
      title: 'Schedule of Rates (SOR)',
      category: 'PLANNING & ENGINEERING',
      icon: BookOpen,
      description:
        'Schedule of Rates library, DSR rate revisions, and master item catalogs are temporarily paused.',
      pausedFeatures: [
        'SOR Item Rate Catalog',
        'Master Material Cost Index',
        'Labor & Machinery Base Rates',
        'Custom Rate Analysis Worksheets',
      ],
    },
    '/planning/quantity-master': {
      title: 'Quantity Master & Estimator',
      category: 'PLANNING & ESTIMATION',
      icon: Calculator,
      description:
        'Automated quantity takeoff, BOQ computation, and material estimation are currently on temporary hold.',
      pausedFeatures: [
        'BOQ Formula Calculations',
        'Civil & Structural Takeoff Sheets',
        'Dimensional Formula Mapping',
        'Export to Cost Summary',
      ],
    },
    '/quantity-master': {
      title: 'Quantity Master & Estimator',
      category: 'PLANNING & ESTIMATION',
      icon: Calculator,
      description:
        'Automated quantity takeoff, BOQ computation, and material estimation are currently on temporary hold.',
      pausedFeatures: [
        'BOQ Formula Calculations',
        'Civil & Structural Takeoff Sheets',
        'Dimensional Formula Mapping',
        'Export to Cost Summary',
      ],
    },
    '/planning/qc-master': {
      title: 'QC Master & Inspection Checklists',
      category: 'QUALITY & ASSURANCE',
      icon: ClipboardCheck,
      description:
        'Quality control standard operating procedures and site audit inspection forms are temporarily on hold.',
      pausedFeatures: [
        'Site Quality Inspection Checklists',
        'Concrete Pour & Reinforcement Verification',
        'Snag List & Defect Logging',
        'Compliance Certificate Workflows',
      ],
    },
    '/planning': {
      title: 'Project Schedule & WBS',
      category: 'PLANNING & GANTT',
      icon: Layers,
      description:
        'Gantt scheduling, Work Breakdown Structure (WBS), and critical path timeline controls are temporarily on hold.',
      pausedFeatures: [
        'Work Breakdown Structure Hierarchy',
        'Gantt Baseline vs Actual Tracking',
        'Critical Path Analysis (CPM)',
        'Milestone Resource Leveling',
      ],
    },
  };

  const currentConfig = featureConfigs[location.pathname] || {
    title: 'Planning & Operations Module',
    category: 'TEMPORARY HOLD',
    icon: PauseCircle,
    description:
      'This feature and all related actions are currently on temporary hold as requested by administration.',
    pausedFeatures: [
      'Master Records & Editing',
      'Computation & Analytics',
      'Project Linking & Reports',
    ],
  };

  const FeatureIcon = currentConfig.icon;

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col">
      {/* Top Header */}
      <Header
        breadcrumbs={[
          { label: currentConfig.category },
          { label: currentConfig.title },
          { label: 'Temp Hold' },
        ]}
        onToggleSidebar={() => setSidebarOpen(true)}
      />

      {/* Main Hold Banner / Card Container */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        <div className="relative rounded-2xl border border-amber-500/30 bg-gradient-to-b from-[#131B2E] via-[#0E1526] to-[#0A0E1A] p-6 sm:p-10 shadow-2xl overflow-hidden backdrop-blur-sm">
          {/* Ambient Amber Glow in background */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-orange-600/10 blur-3xl pointer-events-none" />

          {/* Top Pill & Category */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Temp Hold</span>
            </div>

            <span className="text-xs font-mono text-slate-400 font-semibold tracking-wider uppercase">
              {currentConfig.category}
            </span>
          </div>

          {/* Hero Content */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 mb-6 relative z-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10">
              <FeatureIcon className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400" />
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {currentConfig.title}
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                {currentConfig.description}
              </p>
            </div>
          </div>

          {/* Status Alert Box */}
          <div className="relative z-10 mb-8 rounded-xl bg-amber-950/20 border border-amber-500/20 p-4 sm:p-5 flex items-start gap-3.5">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-slate-300 space-y-1">
              <p className="font-semibold text-amber-200">
                Notice: All features of this module are temporarily paused
              </p>
              <p className="text-slate-400 leading-normal">
                No data has been removed. All modules, database tables, and configurations remain intact and will be re-enabled upon administrative update.
              </p>
            </div>
          </div>

          {/* Paused Features list */}
          <div className="relative z-10 mb-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Features on Hold</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentConfig.pausedFeatures.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 shrink-0" />
                  <span className="truncate">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Navigation to Active Modules */}
          <div className="relative z-10 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-400 font-medium">
              You can continue working on active operational modules:
            </p>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/leads')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
              >
                <Users className="w-4 h-4" />
                <span>Go to Lead Management</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/services')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs border border-slate-700 transition-all cursor-pointer"
              >
                <Briefcase className="w-4 h-4" />
                <span>Services</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/admin/site-engineers')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs border border-slate-700 transition-all cursor-pointer"
              >
                <HardHat className="w-4 h-4" />
                <span>Site Engineers</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
