import React from 'react';

export const ProjectSkeletonCard: React.FC = () => {
  return (
    <div className="glass-panel rounded-xl p-5 border border-erp-border/80 animate-pulse space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-800" />
          <div className="space-y-1.5">
            <div className="h-4 w-32 bg-slate-800 rounded" />
            <div className="h-3 w-20 bg-slate-850 rounded" />
          </div>
        </div>
        <div className="h-6 w-16 bg-slate-800 rounded-full" />
      </div>

      <div className="space-y-2 pt-2">
        <div className="h-3 w-40 bg-slate-800/80 rounded" />
        <div className="h-3 w-28 bg-slate-800/60 rounded" />
      </div>

      <div className="pt-2">
        <div className="flex justify-between text-xs mb-1.5">
          <div className="h-3 w-16 bg-slate-800 rounded" />
          <div className="h-3 w-8 bg-slate-800 rounded" />
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full" />
      </div>

      <div className="pt-3 border-t border-erp-border/60 flex items-center justify-between">
        <div className="h-5 w-24 bg-slate-800 rounded" />
        <div className="h-4 w-16 bg-slate-850 rounded" />
      </div>
    </div>
  );
};

export const LoadingGrid: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, index) => (
        <ProjectSkeletonCard key={index} />
      ))}
    </div>
  );
};
