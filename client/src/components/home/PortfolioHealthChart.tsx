import React, { useState, useMemo } from 'react';
import { Project } from '../../types';
import { ChevronRight, BarChart2 } from 'lucide-react';

interface MonthlyData {
  month: string;
  planned: number; // in Cr or L
  actual: number;
  forecast: number;
  isFuture: boolean;
}

interface PortfolioHealthChartProps {
  projects: Project[];
}

export const PortfolioHealthChart: React.FC<PortfolioHealthChartProps> = ({ projects }) => {
  const [timeRange, setTimeRange] = useState<'6M' | '12M' | '24M' | 'All'>('12M');
  const [hoveredMonth, setHoveredMonth] = useState<MonthlyData | null>(null);

  // Compute total portfolio value and progress dynamically from DB projects
  const totalBudgetValue = useMemo(() => {
    return projects.reduce((sum, p) => sum + (p.contractValue || p.estimatedValue || 0), 0);
  }, [projects]);

  const avgProgress = useMemo(() => {
    if (projects.length === 0) return 0;
    const totalProg = projects.reduce((sum, p) => sum + (p.progress || 0), 0);
    return totalProg / projects.length;
  }, [projects]);

  // Generate 12 months of dynamic data based on current calendar year
  const chartData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const currentMonthIdx = new Date().getMonth(); // 0-indexed (e.g. 8 for Sept)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // In Crores (1 Cr = 10,000,000)
    const budgetInCr = totalBudgetValue / 10000000;
    const actualSpendTotalCr = budgetInCr * (avgProgress / 100);

    return monthNames.map((name, idx) => {
      const isFuture = idx > currentMonthIdx;
      const progressFraction = (idx + 1) / 12;

      // Planned S-curve accumulation
      const planned = budgetInCr > 0 ? Number((budgetInCr * progressFraction).toFixed(2)) : 0;

      // Actual spend accrued up to current month based on actual project progress
      let actual = 0;
      if (!isFuture && actualSpendTotalCr > 0) {
        const monthWeight = (idx + 1) / (currentMonthIdx + 1);
        actual = Number((actualSpendTotalCr * monthWeight).toFixed(2));
      }

      // Forecast curve
      const forecast = budgetInCr > 0 ? Number((budgetInCr * Math.min(1, progressFraction * 0.98)).toFixed(2)) : 0;

      return {
        month: `${name} ${currentYear}`,
        planned,
        actual,
        forecast,
        isFuture,
      };
    });
  }, [totalBudgetValue, avgProgress]);

  // Dynamic max scale calculation
  const maxVal = useMemo(() => {
    const highestVal = Math.max(...chartData.map((d) => Math.max(d.planned, d.actual, d.forecast)));
    return highestVal > 0 ? highestVal * 1.15 : 1.0;
  }, [chartData]);

  const formatYAxis = (fraction: number) => {
    if (totalBudgetValue === 0) {
      return `₹${(fraction * 1).toFixed(1)} Cr`;
    }
    const val = maxVal * fraction;
    return val >= 1 ? `₹${val.toFixed(1)} Cr` : `₹${(val * 100).toFixed(0)} L`;
  };

  return (
    <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm transition-colors">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Portfolio health</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Planned vs actual spend with forecast (Live DB sync)
          </p>
        </div>

        {/* Time range buttons */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg self-start sm:self-auto">
          {(['6M', '12M', '24M', 'All'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                timeRange === range
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="relative pt-4 pb-2">
        {/* Hover Tooltip Popup */}
        {hoveredMonth && totalBudgetValue > 0 && (
          <div className="absolute top-0 right-4 z-20 bg-slate-900/90 dark:bg-slate-800/95 backdrop-blur text-white text-xs px-3 py-1.5 rounded-lg shadow-lg border border-slate-700 pointer-events-none flex items-center gap-3">
            <span className="font-semibold text-blue-300">{hoveredMonth.month}</span>
            <span>Planned: ₹{hoveredMonth.planned} Cr</span>
            {!hoveredMonth.isFuture && (
              <span className="text-teal-400">Actual: ₹{hoveredMonth.actual} Cr</span>
            )}
            <span className="text-amber-300">Forecast: ₹{hoveredMonth.forecast} Cr</span>
          </div>
        )}

        {/* Grid and Bars Area */}
        <div className="relative h-56 flex">
          {/* Y-Axis Labels */}
          <div className="w-14 h-full flex flex-col justify-between text-[10.5px] font-medium text-slate-400 dark:text-slate-500 pr-2 select-none text-right shrink-0">
            <span>{formatYAxis(1.0)}</span>
            <span>{formatYAxis(0.75)}</span>
            <span>{formatYAxis(0.5)}</span>
            <span>{formatYAxis(0.25)}</span>
            <span>₹0.00</span>
          </div>

          {/* Chart Plot Area */}
          <div className="flex-1 relative h-full flex items-end">
            {/* Background Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div className="border-b border-slate-100 dark:border-slate-800/80 w-full h-0" />
              <div className="border-b border-slate-100 dark:border-slate-800/80 w-full h-0" />
              <div className="border-b border-slate-100 dark:border-slate-800/80 w-full h-0" />
              <div className="border-b border-slate-100 dark:border-slate-800/80 w-full h-0" />
              <div className="border-b border-slate-200 dark:border-slate-800 w-full h-0" />
            </div>

            {/* Zero Budget Banner notice if no budget entered yet */}
            {totalBudgetValue === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 z-10 pointer-events-none">
                <div className="px-3.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 shadow-sm">
                  <span>Current portfolio contract value is ₹0.00. S-curve will plot automatically when project budgets or BOQ rates are updated.</span>
                </div>
              </div>
            ) : (
              /* Forecast Dashed Line Overlay */
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible"
                preserveAspectRatio="none"
                viewBox="0 0 100 100"
              >
                <polyline
                  fill="none"
                  stroke="#475569"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  className="dark:stroke-slate-400"
                  points={chartData
                    .map((d, i) => {
                      const x = ((i + 0.5) / chartData.length) * 100;
                      const y = 100 - (d.forecast / maxVal) * 100;
                      return `${x},${Math.max(5, Math.min(95, y))}`;
                    })
                    .join(' ')}
                />
                {chartData.map((d, i) => {
                  const x = ((i + 0.5) / chartData.length) * 100;
                  const y = 100 - (d.forecast / maxVal) * 100;
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={Math.max(5, Math.min(95, y))}
                      r="1.8"
                      className="fill-white stroke-slate-600 dark:stroke-slate-300"
                      strokeWidth="1"
                    />
                  );
                })}
              </svg>
            )}

            {/* Forecast Callout Tag */}
            {totalBudgetValue > 0 && (
              <div className="absolute top-10 right-28 sm:right-36 z-20 pointer-events-none hidden sm:flex items-center text-[10px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded shadow-sm border border-slate-200 dark:border-slate-700">
                Forecast <ChevronRight className="w-3 h-3 ml-0.5 inline text-blue-500" />
              </div>
            )}

            {/* Bars for Each Month */}
            <div className="relative w-full h-full flex justify-between items-end px-1 sm:px-2 z-0">
              {chartData.map((item) => {
                const plannedH = totalBudgetValue > 0 ? `${(item.planned / maxVal) * 100}%` : '2px';
                const actualH = totalBudgetValue > 0 && !item.isFuture ? `${(item.actual / maxVal) * 100}%` : '0px';

                return (
                  <div
                    key={item.month}
                    onMouseEnter={() => setHoveredMonth(item)}
                    onMouseLeave={() => setHoveredMonth(null)}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer px-0.5 sm:px-1"
                  >
                    <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full">
                      {/* Planned Bar (Blue) */}
                      <div
                        style={{ height: plannedH }}
                        className="w-2 sm:w-2.5 bg-blue-600/80 hover:bg-blue-600 rounded-t-sm transition-all duration-300 group-hover:brightness-110 shadow-sm"
                        title={`Planned: ₹${item.planned} Cr`}
                      />

                      {/* Actual Bar (Teal) */}
                      {!item.isFuture && totalBudgetValue > 0 && item.actual > 0 && (
                        <div
                          style={{ height: actualH }}
                          className="w-2 sm:w-2.5 bg-teal-500 hover:bg-teal-400 rounded-t-sm transition-all duration-300 group-hover:brightness-110 shadow-sm"
                          title={`Actual: ₹${item.actual} Cr`}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* X-Axis Month Labels */}
        <div className="flex ml-14 px-1 sm:px-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          {chartData.map((item) => (
            <div
              key={item.month}
              className="flex-1 text-center text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate"
            >
              {item.month.split(' ')[0]}
            </div>
          ))}
        </div>
      </div>

      {/* Legend Footer */}
      <div className="flex items-center justify-center gap-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400 font-medium">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
          <span>Planned Spend</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" />
          <span>Actual Spend</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 border-t-2 border-dashed border-slate-600 dark:border-slate-400 inline-block" />
          <span>Forecast</span>
        </div>
      </div>
    </div>
  );
};
