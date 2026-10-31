import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, DollarSign, Percent, BarChart3 } from 'lucide-react';
import { Article } from '../types.js';

interface EconomicTrendSparklineProps {
  article: Article;
  compact?: boolean;
}

export interface EconomicIndicatorProfile {
  name: string;
  ticker: string;
  unit: string;
  currentValue: string;
  changePercent: number;
  isPositive: boolean;
  sentiment: 'Bullish' | 'Cautious' | 'Neutral' | 'Expansionary' | 'Cooling';
  points: { day: string; value: number; formatted: string; sentimentScore: number }[];
  headlineFocus: string;
}

/**
 * Creates a deterministic numeric hash from string for realistic, stable sparkline data
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Derives realistic economic indicator data based on the article's topic
 */
export function getEconomicIndicatorProfile(article: Article): EconomicIndicatorProfile {
  const text = `${article.headline} ${article.summary} ${article.subCategory || ''}`.toLowerCase();
  const seed = hashString(article.id || article.headline);
  const variation = (seed % 20) / 10; // 0.0 to 1.9

  // 1. Stock Markets, Equities, Sensex, Nifty
  if (text.includes('nifty') || text.includes('sensex') || text.includes('stock') || text.includes('equity') || text.includes('market rally') || text.includes('dalal street') || text.includes('shares')) {
    const base = 24750 + (seed % 300);
    const deltas = [-30, 45, 20, -15, 80, 110, 140];
    let running = base;
    const points = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'].map((day, idx) => {
      running += deltas[idx] + ((seed + idx) % 25 - 12);
      return {
        day,
        value: Number(running.toFixed(1)),
        formatted: running.toLocaleString('en-IN', { maximumFractionDigits: 1 }),
        sentimentScore: Math.min(95, Math.max(55, 72 + (idx * 2) + Math.round(variation)))
      };
    });
    const first = points[0].value;
    const last = points[points.length - 1].value;
    const change = Number((((last - first) / first) * 100).toFixed(2));

    return {
      name: 'NIFTY 50 Benchmark',
      ticker: 'NIFTY:IND',
      unit: 'pts',
      currentValue: last.toLocaleString('en-IN', { maximumFractionDigits: 1 }),
      changePercent: change >= 0 ? change : change,
      isPositive: change >= 0,
      sentiment: change >= 0 ? 'Bullish' : 'Cautious',
      points,
      headlineFocus: 'Domestic & FII institutional equity momentum'
    };
  }

  // 2. RBI, Repo Rate, Monetary Policy, Interest Rates
  if (text.includes('rbi') || text.includes('repo') || text.includes('monetary') || text.includes('interest rate') || text.includes('central bank') || text.includes('governor')) {
    const base = 6.50;
    const points = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'].map((day, idx) => {
      const val = base + (idx > 4 ? 0 : 0);
      return {
        day,
        value: val,
        formatted: `${val.toFixed(2)}%`,
        sentimentScore: 78
      };
    });
    return {
      name: 'RBI Policy Repo Rate',
      ticker: 'INTR:RBI',
      unit: '%',
      currentValue: '6.50%',
      changePercent: 0.00,
      isPositive: true,
      sentiment: 'Neutral',
      points,
      headlineFocus: 'Anchor monetary stance supporting 7.2% GDP growth'
    };
  }

  // 3. Inflation, Consumer Prices, CPI, Food Inflation
  if (text.includes('inflation') || text.includes('cpi') || text.includes('price') || text.includes('cost of living')) {
    const deltas = [4.8, 4.75, 4.65, 4.60, 4.52, 4.45, 4.38];
    const points = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'].map((day, idx) => ({
      day,
      value: deltas[idx],
      formatted: `${deltas[idx]}%`,
      sentimentScore: Math.min(90, 60 + idx * 4)
    }));
    return {
      name: 'Retail CPI Inflation Trend',
      ticker: 'IN:CPI',
      unit: '%',
      currentValue: '4.38%',
      changePercent: -0.42,
      isPositive: true, // Inflation cooling is economically positive
      sentiment: 'Cooling',
      points,
      headlineFocus: 'Headline consumer inflation converging to 4% target'
    };
  }

  // 4. Currency, Rupee, Dollar, Forex
  if (text.includes('rupee') || text.includes('dollar') || text.includes('forex') || text.includes('usd') || text.includes('currency')) {
    const base = 84.05;
    const deltas = [0.02, 0.04, -0.01, 0.03, -0.02, 0.01, -0.03];
    let val = base;
    const points = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'].map((day, idx) => {
      val += deltas[idx];
      return {
        day,
        value: Number(val.toFixed(2)),
        formatted: `₹${val.toFixed(2)}`,
        sentimentScore: 68
      };
    });
    return {
      name: 'USD / INR Foreign Exchange',
      ticker: 'USDINR:CUR',
      unit: '₹/$',
      currentValue: `₹${val.toFixed(2)}`,
      changePercent: +0.05,
      isPositive: true,
      sentiment: 'Neutral',
      points,
      headlineFocus: 'RBI reserves at $700B+ providing currency buffer'
    };
  }

  // 5. Default General Business & Market Sentiment Score (0-100)
  const baseScore = 68 + (seed % 16);
  const deltas = [-2, 1, 3, -1, 4, 2, 3];
  let curScore = baseScore;
  const points = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'].map((day, idx) => {
    curScore += deltas[idx] + ((seed + idx) % 5 - 2);
    const bounded = Math.min(94, Math.max(50, curScore));
    return {
      day,
      value: bounded,
      formatted: `${bounded}/100`,
      sentimentScore: bounded
    };
  });
  const first = points[0].value;
  const last = points[points.length - 1].value;
  const change = Number((((last - first) / first) * 100).toFixed(1));

  return {
    name: 'India Business & Market Sentiment',
    ticker: 'IBSI:SENT',
    unit: 'Score',
    currentValue: `${last}/100`,
    changePercent: change,
    isPositive: change >= 0,
    sentiment: change >= 0 ? 'Expansionary' : 'Cautious',
    points,
    headlineFocus: 'Composite manufacturing & corporate earnings outlook'
  };
}

export const EconomicTrendSparkline: React.FC<EconomicTrendSparklineProps> = ({
  article,
  compact = false
}) => {
  const profile = React.useMemo(() => getEconomicIndicatorProfile(article), [article]);
  const uniqueId = `eco-grad-${article.id || Math.random().toString(36).substring(2, 7)}`;

  // Eye-soothing palettes
  const isUp = profile.isPositive;
  const strokeColor = isUp ? '#059669' : '#e11d48'; // emerald-600 or rose-600
  const fillColor = isUp ? '#10b981' : '#f43f5e';
  const badgeBg = isUp 
    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-900/50'
    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200/80 dark:border-rose-900/50';

  const chartHeight = compact ? 42 : 54;

  return (
    <div 
      onClick={(e) => e.stopPropagation()} 
      className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 w-full"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-5 h-5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Activity className="w-3 h-3" />
          </span>
          <span className="font-semibold text-[11px] text-slate-800 dark:text-slate-200 truncate">
            {profile.name}
          </span>
          <span className="text-[10px] text-slate-400 hidden sm:inline">
            ({profile.ticker})
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-bold text-[11px] text-slate-900 dark:text-slate-100">
            {profile.currentValue}
          </span>
          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${badgeBg}`}>
            {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
            {profile.changePercent >= 0 ? `+${profile.changePercent}%` : `${profile.changePercent}%`}
          </span>
        </div>
      </div>

      {/* Sparkline Chart Container */}
      <div className="w-full relative min-w-0" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={profile.points} 
            margin={{ top: 2, right: 4, left: 4, bottom: 0 }}
          >
            <defs>
              <linearGradient id={uniqueId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={fillColor} stopOpacity={0.28} />
                <stop offset="95%" stopColor={fillColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" hide />
            <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white text-[10px] px-2.5 py-1.5 rounded-lg shadow-lg border border-slate-700/80 pointer-events-none">
                      <div className="font-bold text-slate-200 flex items-center justify-between gap-3">
                        <span>{data.day}</span>
                        <span className="text-emerald-400 font-mono">{data.formatted}</span>
                      </div>
                      <div className="text-slate-400 text-[9px] mt-0.5">
                        Sentiment: {data.sentimentScore}/100 · {profile.sentiment}
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
              strokeWidth={1.75}
              fillOpacity={1}
              fill={`url(#${uniqueId})`}
              dot={false}
              activeDot={{
                r: 3.5,
                fill: strokeColor,
                stroke: '#ffffff',
                strokeWidth: 1.5,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Micro-label footer */}
      <div className="flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-500 mt-1">
        <span>7-Day Movement: {profile.points[0].day} → Today</span>
        <span className="font-medium text-slate-500 dark:text-slate-400">
          Sentiment: <strong className="text-slate-700 dark:text-slate-300">{profile.sentiment}</strong>
        </span>
      </div>
    </div>
  );
};
