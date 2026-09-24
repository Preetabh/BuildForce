import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LucideIcon, ArrowLeft, Clock, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';

export interface ComingSoonProps {
  moduleName: string;
  icon: LucideIcon;
  description?: string;
  features: string[];
  roadmapPhase?: string;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({
  moduleName,
  icon: Icon,
  description,
  features,
  roadmapPhase = 'Phase 2 Planned Release',
  
}) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="glass-panel rounded-2xl p-8 sm:p-10 border border-erp-border relative overflow-hidden shadow-2xl">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider w-fit mb-6">
            <Clock className="w-3.5 h-3.5" />
            <span>{roadmapPhase}</span>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-white flex items-center justify-center shadow-glow">
              <Icon className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-erp-text tracking-tight">
                {moduleName}
              </h1>
              <p className="text-sm text-erp-text-muted mt-0.5">
                {description || `${moduleName} module is currently under active development.`}
              </p>
            </div>
          </div>

          <div className="my-8 p-6 rounded-xl bg-slate-900/60 border border-erp-border/80">
            <h3 className="text-sm font-semibold text-erp-text uppercase tracking-wider flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>This module will include:</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-sm text-erp-text-muted">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-erp-border/60">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Home
            </Button>
            <span className="text-xs text-erp-text-subtle">
              BudgetPilot
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
