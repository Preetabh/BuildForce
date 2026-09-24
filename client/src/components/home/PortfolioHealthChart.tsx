import React, { useState, useMemo } from 'react';
import { Project } from '../../types';
import { ChevronRight, BarChart2 } from 'lucide-react';

interface MonthlyData {
  month: string;
  planned: number;
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
    return Math.min(100, Math.max(0, totalProg / projects.length));
  }, [projects]);

  // Dynamic Scale: Cr (>=1Cr), L (>=1L), k (>=1k), or raw INR
  const scaleConfig = useMemo(() => {
    if (totalBudgetValue >= 10000000) {
      return { divisor: 10000000, unit: 'Cr', decimals: 2 };
    }
    if (totalBudgetValue >= 100000) {
      return { divisor: 100000, unit: 'L', decimals: 2 };
    }
    if (totalBudgetValue >= 1000) {
      return { divisor: 1000, unit: 'k', decimals: 1 };
    }
    return { divisor: 1, unit: '', decimals: 0 };
  }, [totalBudgetValue]);

  const formatTooltipVal = (val: number) => {
    const rawNum = val * scaleConfig.divisor;
    if (scaleConfig.unit === 'Cr') return `₹${val.toFixed(2)} Cr`;
    if (scaleConfig.unit === 'L') return `₹${val.toFixed(2)} L`;
    if (scaleConfig.unit === 'k') return `₹${val.toFixed(1)}k (₹${Math.round(rawNum).toLocaleString('en-IN')})`;
    return `₹${Math.round(rawNum).toLocaleString('en-IN')}`;
  };

  // Generate dynamic data based on selected timeRange
  const chartData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIdx = now.getMonth(); // 0-indexed (e.g. 8 for Sept)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const scaledBudget = totalBudgetValue > 0 ? totalBudgetValue / scaleConfig.divisor : 0;
    const actualSpendTotalScaled = scaledBudget * (avgProgress / 100);

    const monthsList: { name: string; year: number; isFuture: boolean; progressFraction: number; monthWeight: number }[] = [];

    if (timeRange === '6M') {
      const startIdx = Math.max(0, Math.min(6, currentMonthIdx - 3));
      for (let i = startIdx; i < startIdx + 6; i++) {
        const isFuture = i > currentMonthIdx;
        const progressFraction = (i + 1) / 12;
        const monthWeight = (i + 1) / (currentMonthIdx + 1);
        monthsList.push({
          name: monthNames[i % 12],
          year: currentYear,
          isFuture,
          progressFraction,
          monthWeight: Math.min(1, Math.max(0, monthWeight)),
        });
      }
    } else if (timeRange === '24M') {
      for (let i = 0; i < 12; i++) {
        monthsList.push({
          name: monthNames[i],
          year: currentYear - 1,
          isFuture: false,
          progressFraction: ((i + 1) / 24),
          monthWeight: (i + 1) / (12 + currentMonthIdx + 1),
        });
      }
      for (let i = 0; i < 12; i++) {
        const isFuture = i > currentMonthIdx;
        monthsList.push({
          name: monthNames[i],
          year: currentYear,
          isFuture,
          progressFraction: ((12 + i + 1) / 24),
          monthWeight: Math.min(1, (12 + i + 1) / (12 + currentMonthIdx + 1)),
        });
      }
    } else {
      for (let i = 0; i < 12; i++) {
        const isFuture = i > currentMonthIdx;
        const progressFraction = (i + 1) / 12;
        const monthWeight = Math.min(1, (i + 1) / (currentMonthIdx + 1));
        monthsList.push({
          name: monthNames[i],
          year: currentYear,
          isFuture,
          progressFraction,
          monthWeight,
        });
      }
    }

    return monthsList.map((m) => {
      const planned = scaledBudget > 0 ? Number((scaledBudget * m.progressFraction).toFixed(scaleConfig.decimals)) : 0;

      let actual = 0;
      if (!m.isFuture && actualSpendTotalScaled > 0) {
        actual = Number((actualSpendTotalScaled * m.monthWeight).toFixed(scaleConfig.decimals));
      }

      const forecast = scaledBudget > 0 ? Number((scaledBudget * Math.min(1, m.progressFraction * 0.98)).toFixed(scaleConfig.decimals)) : 0;

      return {
        month: `${m.name} ${m.year}`,
        planned,
        actual,
        forecast,
        isFuture: m.isFuture,
      };
    });
  }, [totalBudgetValue, avgProgress, timeRange, scaleConfig]);

  // Dynamic max scale calculation
  const maxVal = useMemo(() => {
    const highestVal = Math.max(...chartData.map((d) => Math.max(d.planned, d.actual, d.forecast)));
    return highestVal > 0 ? highestVal * 1.15 : 1.0;
  }, [chartData]);

  const formatYAxis = (fraction: number) => {
    if (totalBudgetValue === 0) {
      return `₹0.00`;
    }
    const val = maxVal * fraction;
    if (scaleConfig.unit) {
      return `₹${val.toFixed(val >= 10 ? 1 : scaleConfig.decimals)} ${scaleConfig.unit}`;
    }
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
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
            <span>Planned: {formatTooltipVal(hoveredMonth.planned)}</span>
            {!hoveredMonth.isFuture && (
              <span className="text-teal-400">Actual: {formatTooltipVal(hoveredMonth.actual)}</span>
            )}
            <span className="text-amber-300">Forecast: {formatTooltipVal(hoveredMonth.forecast)}</span>
          </div>
        )}

        {/* Grid and Bars Area */}
        <div className="relative h-56 flex">
          {/* Y-Axis Labels */}
          <div className="w-16 h-full flex flex-col justify-between text-[10.5px] font-medium text-slate-400 dark:text-slate-500 pr-2 select-none text-right shrink-0">
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
                const plannedH = totalBudgetValue > 0 && item.planned > 0
                  ? `${Math.max(4, (item.planned / maxVal) * 100)}%`
                  : '2px';
                const actualH = totalBudgetValue > 0 && !item.isFuture && item.actual > 0
                  ? `${Math.max(4, (item.actual / maxVal) * 100)}%`
                  : '0px';

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
                        title={`Planned: ${formatTooltipVal(item.planned)}`}
                      />

                      {/* Actual Bar (Teal) */}
                      {!item.isFuture && totalBudgetValue > 0 && item.actual > 0 && (
                        <div
                          style={{ height: actualH }}
                          className="w-2 sm:w-2.5 bg-teal-500 hover:bg-teal-400 rounded-t-sm transition-all duration-300 group-hover:brightness-110 shadow-sm"
                          title={`Actual: ${formatTooltipVal(item.actual)}`}
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
        <div className="flex ml-16 px-1 sm:px-2 pt-2 border-t border-slate-200 dark:border-slate-800">
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
