import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400">
      <Link
        to="/"
        className="flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-white transition-colors"
      >
        <Home className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
        <span className="font-medium text-slate-700 dark:text-slate-300">BudgetPilot</span>
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const targetUrl = item.path || item.href;
        return (
          <React.Fragment key={index}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
            {isLast || !targetUrl ? (
              <span className="text-slate-900 dark:text-white font-medium truncate max-w-[200px] sm:max-w-xs">
                {item.label}
              </span>
            ) : (
              <Link
                to={targetUrl}
                className="hover:text-slate-800 dark:hover:text-white transition-colors truncate max-w-[150px]"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
