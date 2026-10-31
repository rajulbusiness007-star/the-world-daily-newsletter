import React, { useState, useEffect } from 'react';
import { SystemHealth } from '../types.js';
import { Activity, RefreshCw, AlertTriangle, CheckCircle2, Clock, Server, Database, ShieldAlert } from 'lucide-react';

interface SystemHealthViewProps {
  onTriggerRefresh: () => void;
  isRefreshing: boolean;
}

export const SystemHealthView: React.FC<SystemHealthViewProps> = ({ onTriggerRefresh, isRefreshing }) => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = () => {
    fetch('/api/system/health')
      .then(res => res.json())
      .then(data => {
        setHealth(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load system health:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(new Date(iso)) + ' IST';
    } catch {
      return iso;
    }
  };

  if (loading || !health) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-stone-500 font-serif">
        Loading system telemetry...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b-2 border-stone-800 dark:border-stone-200 pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-red-800 dark:text-red-400">
            Real-Time Diagnostic Monitor
          </div>
          <h2 className="font-editorial text-3xl font-extrabold text-stone-950 dark:text-white mt-1">
            Automated System Health & Feed Reliability
          </h2>
        </div>

        <button
          onClick={() => {
            onTriggerRefresh();
            setTimeout(fetchHealth, 3000);
          }}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 hover:bg-stone-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Testing Ingestion Pipeline...' : 'Test Full Ingestion Now'}</span>
        </button>
      </div>

      {/* Primary Status Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Scheduler Engine</span>
            <Server className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Active (06:30 IST)
          </div>
          <div className="text-[11px] text-stone-400">Node.js Server Cron</div>
        </div>

        <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Last Update</span>
            <Clock className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
            {formatDate(health.lastSuccessfulUpdate)}
          </div>
          <div className="text-[11px] text-stone-400">Verified feeds checked</div>
        </div>

        <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Database Volume</span>
            <Database className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-lg font-bold text-stone-900 dark:text-stone-100">
            {health.totalArticlesInDatabase} Articles
          </div>
          <div className="text-[11px] text-stone-400">Persisted in JSON database</div>
        </div>

        <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Active Feed Channels</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-stone-900 dark:text-stone-100">
            {health.activeFeedCount} of {health.totalSourcesConfigured}
          </div>
          <div className="text-[11px] text-stone-400">Direct RSS / Wire Endpoints</div>
        </div>
      </div>

      {/* Failed Feeds Section if any */}
      {health.failedFeeds && health.failedFeeds.length > 0 && (
        <div className="p-4 rounded-sm bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800 space-y-3">
          <div className="flex items-center gap-2 text-red-900 dark:text-red-300 font-bold text-xs uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            Unreachable or Rate-Limited Feeds ({health.failedFeeds.length})
          </div>
          <p className="text-xs text-red-700 dark:text-red-300">
            The verification pipeline automatically isolates these feeds while continuing ingestion from remaining healthy independent sources.
          </p>
          <div className="divide-y divide-red-200 dark:divide-red-900/60 text-xs">
            {health.failedFeeds.map((f, i) => (
              <div key={i} className="py-2 flex items-center justify-between">
                <span className="font-semibold text-red-900 dark:text-red-200">{f.sourceName}</span>
                <span className="text-red-600 dark:text-red-400 font-mono text-[11px]">{f.error}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ingestion & Verification Logs Stream */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-sm p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
          <h3 className="font-editorial text-base font-bold text-stone-950 dark:text-white uppercase tracking-tight">
            Recent Verification & Ingestion Logs
          </h3>
          <span className="text-[11px] text-stone-400 font-mono">Real-time audit trail</span>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto font-mono text-xs">
          {health.recentIngestionLogs.map((log, i) => (
            <div key={i} className="p-2.5 rounded bg-stone-50 dark:bg-stone-950/80 border border-stone-200/60 dark:border-stone-800 flex items-start gap-2">
              <span className="text-stone-400 text-[10px] whitespace-nowrap pt-0.5">
                {new Date(log.timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })}
              </span>
              <span className={`text-[10px] uppercase font-bold px-1.5 rounded ${
                log.level === 'warn' ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300' :
                log.level === 'error' ? 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-300' :
                'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
              }`}>
                {log.level}
              </span>
              <span className="text-stone-700 dark:text-stone-300 leading-normal">
                {log.message}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
