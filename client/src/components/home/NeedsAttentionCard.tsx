import React from 'react';
import { Project } from '../../types';
import { AlertCircle, Calendar, CheckCircle2, FileEdit, HardHat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NeedsAttentionProps {
  projects: Project[];
}

export const NeedsAttentionCard: React.FC<NeedsAttentionProps> = ({ projects }) => {
  const navigate = useNavigate();

  // Dynamically compute real attention items from database project records
  const items = React.useMemo(() => {
    const list: Array<{
      id: string;
      projectId?: string;
      icon: React.ElementType;
      iconBg: string;
      iconColor: string;
      title: string;
      subtitle: string;
      badgeText: string;
    }> = [];

    projects.forEach((p) => {
      // 1. Projects in Draft status requiring setup
      if (p.status === 'draft') {
        list.push({
          id: `draft-${p._id}`,
          projectId: p._id,
          icon: FileEdit,
          iconBg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/40',
          iconColor: 'text-amber-600 dark:text-amber-400',
          title: `Project setup pending: ${p.name}`,
          subtitle: `Draft status — establish BOQ and schedule of rates`,
          badgeText: 'Action Required',
        });
      }

      // 2. Projects with zero progress
      if (p.progress === 0 && p.status !== 'draft') {
        list.push({
          id: `progress-${p._id}`,
          projectId: p._id,
          icon: HardHat,
          iconBg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900/40',
          iconColor: 'text-blue-600 dark:text-blue-400',
          title: `Site execution kickoff: ${p.name}`,
          subtitle: `No measurements logged yet — commence daily logging`,
          badgeText: 'Kickoff',
        });
      }

      // 3. Projects missing timeline / completion dates
      if (!p.startDate || !p.endDate) {
        list.push({
          id: `dates-${p._id}`,
          projectId: p._id,
          icon: Calendar,
          iconBg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/40',
          iconColor: 'text-rose-600 dark:text-rose-400',
          title: `Schedule dates unset: ${p.name}`,
          subtitle: `Define expected start and handover timeline`,
          badgeText: 'Dates Unset',
        });
      }

      // 4. Projects on hold
      if (p.status === 'on_hold') {
        list.push({
          id: `onhold-${p._id}`,
          projectId: p._id,
          icon: AlertCircle,
          iconBg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/40',
          iconColor: 'text-rose-600 dark:text-rose-400',
          title: `Project on hold: ${p.name}`,
          subtitle: `Work stalled — site clearance or client decision pending`,
          badgeText: 'On Hold',
        });
      }
    });

    return list;
  }, [projects]);

  return (
    <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Needs your attention</h3>
        </div>
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Items list */}
      {items.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs">
          <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-2" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">All projects on track</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            No critical warnings or pending actions found
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {items.slice(0, 4).map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => item.projectId && navigate(`/projects/${item.projectId}`)}
                className="py-3 flex items-start gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 px-2 rounded-lg transition-colors cursor-pointer"
              >
                <div
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${item.iconBg}`}
                >
                  <Icon className={`w-4 h-4 ${item.iconColor}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </p>
                    <span className="text-[9.5px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700 shrink-0">
                      {item.badgeText}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
