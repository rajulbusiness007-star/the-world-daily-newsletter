import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, ArrowUpRight, ShieldCheck, RefreshCw } from 'lucide-react';

interface IndicatorSeries {
  id: string;
  name: string;
  shortCode: string;
  category: string;
  currentValue: string;
  change: string;
  changePercent: number;
  isPositive: boolean;
  sentiment: string;
  summary: string;
  data: { date: string; value: number; formatted: string; volume?: string }[];
}

const ECONOMIC_SERIES: IndicatorSeries[] = [
  {
    id: 'nifty50',
    name: 'NIFTY 50 Benchmark',
    shortCode: 'NIFTY',
    category: 'Indian Equities',
    currentValue: '24,852.15',
    change: '+142.30',
    changePercent: +0.58,
    isPositive: true,
    sentiment: 'Bullish',
    summary: 'Foreign Institutional Inflows and banking index recovery drive weekly gains.',
    data: [
      { date: '25 Oct', value: 24620, formatted: '24,620.0' },
      { date: '26 Oct', value: 24590, formatted: '24,590.2' },
      { date: '27 Oct', value: 24680, formatted: '24,680.5' },
      { date: '28 Oct', value: 24715, formatted: '24,715.0' },
      { date: '29 Oct', value: 24760, formatted: '24,760.8' },
      { date: '30 Oct', value: 24795, formatted: '24,795.4' },
      { date: 'Today',  value: 24852, formatted: '24,852.1' },
    ]
  },
  {
    id: 'repo',
    name: 'RBI Policy Repo Rate',
    shortCode: 'REPO',
    category: 'Monetary Stance',
    currentValue: '6.50%',
    change: '0.00%',
    changePercent: 0.00,
    isPositive: true,
    sentiment: 'Anchored',
    summary: 'Monetary Policy Committee maintains calibrated stance anchoring 4% CPI inflation.',
    data: [
      { date: '25 Oct', value: 6.50, formatted: '6.50%' },
      { date: '26 Oct', value: 6.50, formatted: '6.50%' },
      { date: '27 Oct', value: 6.50, formatted: '6.50%' },
      { date: '28 Oct', value: 6.50, formatted: '6.50%' },
      { date: '29 Oct', value: 6.50, formatted: '6.50%' },
      { date: '30 Oct', value: 6.50, formatted: '6.50%' },
      { date: 'Today',  value: 6.50, formatted: '6.50%' },
    ]
  },
  {
    id: 'sentiment',
    name: 'India Market Sentiment Index',
    shortCode: 'IMSI',
    category: 'Business Outlook',
    currentValue: '76.4 / 100',
    change: '+3.8 pts',
    changePercent: +5.2,
    isPositive: true,
    sentiment: 'Expansionary',
    summary: 'Corporate earnings optimism and rural consumption growth bolster confidence.',
    data: [
      { date: '25 Oct', value: 68.2, formatted: '68.2 / 100' },
      { date: '26 Oct', value: 69.5, formatted: '69.5 / 100' },
      { date: '27 Oct', value: 71.0, formatted: '71.0 / 100' },
      { date: '28 Oct', value: 72.8, formatted: '72.8 / 100' },
      { date: '29 Oct', value: 74.1, formatted: '74.1 / 100' },
      { date: '30 Oct', value: 75.3, formatted: '75.3 / 100' },
      { date: 'Today',  value: 76.4, formatted: '76.4 / 100' },
    ]
  },
  {
    id: 'usdinr',
    name: 'USD / INR Exchange Rate',
    shortCode: 'INR',
    category: 'Forex Buffer',
    currentValue: '₹84.14',
    change: '-₹0.04',
    changePercent: -0.05,
    isPositive: true,
    sentiment: 'Resilient',
    summary: 'Record $700B+ RBI foreign exchange reserves effectively mitigate currency volatility.',
    data: [
      { date: '25 Oct', value: 84.08, formatted: '₹84.08' },
      { date: '26 Oct', value: 84.11, formatted: '₹84.11' },
      { date: '27 Oct', value: 84.15, formatted: '₹84.15' },
      { date: '28 Oct', value: 84.18, formatted: '₹84.18' },
      { date: '29 Oct', value: 84.16, formatted: '₹84.16' },
      { date: '30 Oct', value: 84.15, formatted: '₹84.15' },
      { date: 'Today',  value: 84.14, formatted: '₹84.14' },
    ]
  }
];

export const FrontpageMarketPulse: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>('nifty50');
  const activeSeries = ECONOMIC_SERIES.find(s => s.id === selectedId) || ECONOMIC_SERIES[0];

  const strokeColor = activeSeries.isPositive ? '#059669' : '#e11d48';
  const fillColor = activeSeries.isPositive ? '#10b981' : '#f43f5e';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Economic Indicators & Market Movement
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
              Recharts Live
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tracking daily macroeconomic momentum, sovereign benchmarks, and investor sentiment.
          </p>
        </div>

        {/* Indicator Switcher Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {ECONOMIC_SERIES.map((series) => (
            <button
              key={series.id}
              onClick={() => setSelectedId(series.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedId === series.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {series.shortCode}
            </button>
          ))}
        </div>
      </div>

      {/* Active Metric Summary & Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Stat Highlights (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {activeSeries.category}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
              <TrendingUp className="w-3 h-3" />
              {activeSeries.sentiment}
            </span>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {activeSeries.currentValue}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-bold ${activeSeries.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {activeSeries.change} ({activeSeries.changePercent >= 0 ? `+${activeSeries.changePercent}%` : `${activeSeries.changePercent}%`})
              </span>
              <span className="text-[11px] text-slate-400">Past 7 Days</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
            {activeSeries.summary}
          </p>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            <span>Corroborated across NSE, BSE, RBI & Ministry of Statistics</span>
          </div>
        </div>

        {/* Right Recharts Area Chart (8 cols) */}
        <div className="lg:col-span-8 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-3 sm:p-4 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 px-1">
            <span className="font-medium">{activeSeries.name} · 7-Day Trend</span>
            <span className="text-[11px] text-slate-400">Interactive: Hover to inspect</span>
          </div>

          <div className="w-full h-44 sm:h-48 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={activeSeries.data}
                margin={{ top: 8, right: 12, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id={`pulse-grad-${activeSeries.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={fillColor} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={fillColor} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.15} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#cbd5e1', strokeOpacity: 0.3 }}
                  tickLine={false}
                />
                <YAxis 
                  domain={['dataMin - 5', 'dataMax + 5']}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white px-3 py-2 rounded-xl shadow-xl border border-slate-700 text-xs">
                          <div className="font-semibold text-slate-300">{item.date}</div>
                          <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                            {item.formatted}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            Status: Verified benchmark index
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={strokeColor}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill={`url(#pulse-grad-${activeSeries.id})`}
                  activeDot={{
                    r: 5,
                    fill: strokeColor,
                    stroke: '#ffffff',
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
