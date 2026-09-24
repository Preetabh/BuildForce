import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { formatRelativeTime } from '../../utils/formatters';
import { Activity, Clock } from 'lucide-react';

interface AuditLogItem {
  _id: string;
  action: string;
  entity: string;
  entityId: string;
  newValue?: Record<string, any>;
  oldValue?: Record<string, any>;
  userId?: {
    name?: string;
    email?: string;
  };
  timestamp: string;
}

export const RecentActivityCard: React.FC = () => {
  const { data: auditLogs = [], isLoading } = useQuery<AuditLogItem[]>({
    queryKey: ['recentAuditLogs'],
    queryFn: async () => {
      const res = await api.get('/audit/recent?limit=8');
      return res.data?.data || [];
    },
    staleTime: 10000,
  });

  const getLogDisplay = (log: AuditLogItem) => {
    let title = `${log.action} ${log.entity}`;
    let dotColor = 'bg-blue-500 ring-blue-500/20';

    if (log.entity === 'Project') {
      const pName = log.newValue?.name || 'Project';
      if (log.action === 'CREATE') {
        title = `Project "${pName}" created`;
        dotColor = 'bg-emerald-500 ring-emerald-500/20';
      } else if (log.action === 'UPDATE') {
        title = `Project "${pName}" details updated`;
        dotColor = 'bg-blue-500 ring-blue-500/20';
      } else if (log.action === 'DELETE') {
        title = `Project "${pName}" moved to Recycle Bin`;
        dotColor = 'bg-rose-500 ring-rose-500/20';
      }
    } else if (log.entity === 'Measurement') {
      const itemCode = log.newValue?.itemCode || '';
      title = itemCode ? `Measurement entered for item #${itemCode}` : `Measurement record updated`;
      dotColor = 'bg-teal-500 ring-teal-500/20';
    } else if (log.entity === 'SorMaster' || log.entity === 'SorImport') {
      const sName = log.newValue?.sorName || log.newValue?.fileName || 'Schedule of Rates';
      title = `SOR published: ${sName}`;
      dotColor = 'bg-purple-500 ring-purple-500/20';
    } else if (log.entity === 'User') {
      title = `User account updated`;
      dotColor = 'bg-slate-400 ring-slate-400/20';
    }

    const author = log.userId?.name || 'Preetabh Awasthi';
    const timeAgo = formatRelativeTime(log.timestamp) || 'Just now';

    return { title, author, timeAgo, dotColor };
  };

  return (
    <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500" />
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Recent activity</h3>
        </div>
      </div>

      {/* Timeline List */}
      {isLoading ? (
        <div className="py-6 text-center text-xs text-slate-400">
          <div className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-1" />
          <p>Loading activity logs...</p>
        </div>
      ) : auditLogs.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs">
          <Clock className="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
          <p className="font-medium text-slate-600 dark:text-slate-300">No recent activity recorded</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Actions will be logged automatically</p>
        </div>
      ) : (
        <div className="space-y-4">
          {auditLogs.slice(0, 5).map((log) => {
            const { title, author, timeAgo, dotColor } = getLogDisplay(log);
            return (
              <div key={log._id} className="flex items-start gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ring-4 shrink-0 mt-1.5 ${dotColor}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {author} • {timeAgo}
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
