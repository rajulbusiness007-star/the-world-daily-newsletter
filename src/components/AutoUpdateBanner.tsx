import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, Clock, Sparkles, Sliders, ShieldCheck, Zap, Info, Calendar } from 'lucide-react';
import { AutoUpdateCadence } from '../hooks/useAutoUpdate.js';

interface AutoUpdateBannerProps {
  isEnabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  cadence: AutoUpdateCadence;
  onChangeCadence: (cadence: AutoUpdateCadence) => void;
  isChecking: boolean;
  lastChecked: string;
  nextUpdateText: string;
  onCheckNow: () => void;
  editionDate?: string;
  editionNumber?: number;
}

export const AutoUpdateBanner: React.FC<AutoUpdateBannerProps> = ({
  isEnabled,
  onToggleEnabled,
  cadence,
  onChangeCadence,
  isChecking,
  lastChecked,
  nextUpdateText,
  onCheckNow,
  editionDate,
  editionNumber
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const formatLastChecked = (iso: string) => {
    try {
      const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      return `${Math.floor(diffSec / 3600)}h ago`;
    } catch {
      return 'Today';
    }
  };

  return (
    <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-blue-50/80 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-blue-950/30 border border-emerald-200/90 dark:border-emerald-800/60 rounded-xl p-4 sm:p-5 space-y-3.5 shadow-xs overflow-hidden transition-all min-w-0">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-200/60 dark:border-emerald-800/40 pb-3 min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <span className="relative flex h-3 w-3 shrink-0">
            {isEnabled ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-3 w-3 bg-stone-400"></span>
            )}
          </span>

          <span className="font-sans text-xs font-bold uppercase tracking-wider text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5 shrink-0">
            <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            Autonomous Daily Auto-Update Engine
          </span>

          <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
            {isEnabled ? '● Active — Zero Manual Maintenance' : 'Paused'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
            <span>{showDetails ? 'Hide Policy' : 'How It Works'}</span>
          </button>

          {/* Check for updates now */}
          <button
            onClick={onCheckNow}
            disabled={isChecking}
            className="px-3 py-1 rounded-lg text-xs font-semibold bg-white dark:stone-900 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-50 dark:hover:bg-stone-800 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
            title="Check immediately for newly compiled editions"
          >
            <RefreshCw className={`w-3 h-3 text-emerald-600 dark:text-emerald-400 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Checking...' : 'Check Live'}</span>
          </button>

          {/* Master Enable/Disable Toggle */}
          <button
            onClick={() => onToggleEnabled(!isEnabled)}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
              isEnabled
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isEnabled ? 'Auto-Update ON' : 'Auto-Update OFF'}</span>
          </button>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-emerald-950/80 dark:text-emerald-200/90 font-sans leading-relaxed break-words">
        <strong>No manual editing required:</strong> The newsletter pipeline is fully automated. Every morning at <strong>06:30 AM IST (Asia/Kolkata)</strong>, the cloud engine crawls 46 verified national and international newsrooms (CNN, Indian Express, The Hindu, Times of India, US News, Sky News, SCMP, BBC, Reuters), verifies cross-claim corroboration, extracts verified editorial photos, and generates today's daily briefing automatically.
      </p>

      {/* Schedule & Timing Indicators Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1 text-xs font-sans">
        {/* Next Scheduled Edition */}
        <div className="p-2.5 rounded-lg bg-white/80 dark:bg-stone-900/80 border border-emerald-200/70 dark:border-emerald-900/40 flex items-center gap-2 min-w-0">
          <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400 block truncate">
              Next Daily Edition
            </span>
            <span className="font-bold text-stone-900 dark:text-stone-100 truncate block">
              {nextUpdateText || '06:30 AM IST'}
            </span>
          </div>
        </div>

        {/* Current Edition Loaded */}
        <div className="p-2.5 rounded-lg bg-white/80 dark:bg-stone-900/80 border border-emerald-200/70 dark:border-emerald-900/40 flex items-center gap-2 min-w-0">
          <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400 block truncate">
              Active Edition Date
            </span>
            <span className="font-bold text-stone-900 dark:text-stone-100 truncate block">
              {editionDate ? `${editionDate} (#${editionNumber || 1})` : 'Today'}
            </span>
          </div>
        </div>

        {/* Last Checked */}
        <div className="p-2.5 rounded-lg bg-white/80 dark:bg-stone-900/80 border border-emerald-200/70 dark:border-emerald-900/40 flex items-center gap-2 min-w-0">
          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400 block truncate">
              Feed Ingestion Status
            </span>
            <span className="font-bold text-stone-900 dark:text-stone-100 truncate block">
              Checked {formatLastChecked(lastChecked)}
            </span>
          </div>
        </div>

        {/* Background Cadence Selector */}
        <div className="p-2.5 rounded-lg bg-white/80 dark:bg-stone-900/80 border border-emerald-200/70 dark:border-emerald-900/40 flex items-center justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400 block truncate">
              Auto-Sync Cadence
            </span>
            <select
              value={cadence}
              onChange={(e) => onChangeCadence(e.target.value as AutoUpdateCadence)}
              className="font-bold text-stone-900 dark:text-stone-100 bg-transparent text-xs focus:outline-none cursor-pointer"
            >
              <option value="daily">Daily at 06:30 AM IST</option>
              <option value="15m">Every 15 Minutes</option>
              <option value="30m">Every 30 Minutes</option>
              <option value="60m">Every 60 Minutes</option>
            </select>
          </div>
          <Sliders className="w-3.5 h-3.5 text-stone-400 shrink-0" />
        </div>
      </div>

      {/* Expandable How It Works Details */}
      {showDetails && (
        <div className="p-4 rounded-lg bg-white dark:bg-stone-900 border border-emerald-200 dark:border-emerald-800 text-xs font-sans space-y-2 mt-2 min-w-0">
          <div className="font-bold text-stone-900 dark:text-stone-100 text-sm">
            Autonomous Daily Publishing Architecture:
          </div>
          <ul className="list-disc list-inside space-y-1 text-stone-600 dark:text-stone-300">
            <li><strong>Cloud Scheduler:</strong> A GitHub Actions cron trigger executes automatically every day at 01:00 UTC (06:30 AM IST).</li>
            <li><strong>Automated Ingestion:</strong> Gathers news items from 46 verified outlets, executes claim corroboration across 2+ sources, and filters out clickbait and rumors.</li>
            <li><strong>Verified Photo Extraction:</strong> Extracts high-resolution newsroom editorial photos directly from source RSS enclosures and media tags.</li>
            <li><strong>Zero Manual Input:</strong> The updated edition is compiled, saved to the database, and deployed to production automatically without human intervention.</li>
            <li><strong>Client-Side Live Polling:</strong> While you browse, this tab automatically checks for newer editions on schedule and updates your view seamlessly.</li>
          </ul>
        </div>
      )}
    </div>
  );
};
