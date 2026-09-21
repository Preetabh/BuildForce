import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  changeType?: 'positive' | 'neutral' | 'accent';
  colorVariant?: 'blue' | 'emerald' | 'amber' | 'purple' | 'cyan';
  subtext?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  colorVariant = 'blue',
  subtext,
}) => {
  const colorMap = {
    blue: {
      border: 'border-blue-500/20 hover:border-blue-500/40',
      iconBg: 'bg-blue-500/10 text-blue-400',
      glow: 'shadow-[0_0_20px_-5px_rgba(37,99,235,0.15)]',
      valueColor: 'text-blue-400',
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      glow: 'shadow-[0_0_20px_-5px_rgba(16,185,129,0.15)]',
      valueColor: 'text-emerald-400',
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400',
      glow: 'shadow-[0_0_20px_-5px_rgba(245,158,11,0.15)]',
      valueColor: 'text-amber-400',
    },
    purple: {
      border: 'border-purple-500/20 hover:border-purple-500/40',
      iconBg: 'bg-purple-500/10 text-purple-400',
      glow: 'shadow-[0_0_20px_-5px_rgba(168,85,247,0.15)]',
      valueColor: 'text-purple-400',
    },
    cyan: {
      border: 'border-cyan-500/20 hover:border-cyan-500/40',
      iconBg: 'bg-cyan-500/10 text-cyan-400',
      glow: 'shadow-[0_0_20px_-5px_rgba(6,182,212,0.15)]',
      valueColor: 'text-cyan-400',
    },
  };

  const scheme = colorMap[colorVariant];

  return (
    <div
      className={cn(
        'glass-panel rounded-xl p-4 sm:p-5 transition-all duration-300 hover:translate-y-[-2px]',
        scheme.border,
        scheme.glow
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-erp-text-muted uppercase tracking-wider">
          {label}
        </span>
        <div className={cn('p-2.5 rounded-lg', scheme.iconBg)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3">
        <h4 className="text-2xl sm:text-3xl font-bold tracking-tight text-erp-text">
          {value}
        </h4>
        {subtext && (
          <p className="text-xs text-erp-text-subtle mt-1 flex items-center gap-1">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
};
