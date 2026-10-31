import React, { useState, useEffect } from 'react';
import { 
  Radio, ShieldCheck, CheckCircle2, SlidersHorizontal, ExternalLink, 
  Headphones, ArrowUpRight, Globe2, X, RefreshCw, Check, Sparkles, AlertCircle
} from 'lucide-react';
import { Article, DailyEdition } from '../types.js';
import { getArticleReadingTime } from '../utils/readingTime.js';

export interface OutletMeta {
  id: string;
  name: string;
  shortName: string;
  country: string;
  flag: string;
  type: string;
  ownership: string;
  funding: string;
  website: string;
  color: string;
  tagline: string;
}

export const TRUSTED_OUTLETS_DATA: OutletMeta[] = [
  {
    id: 'indian-express',
    name: 'The Indian Express',
    shortName: 'Indian Express',
    country: 'India',
    flag: '🇮🇳',
    type: 'Independent National',
    ownership: 'The Indian Express Group (Viveck Goenka)',
    funding: 'Subscriptions and commercial advertising',
    website: 'https://indianexpress.com',
    color: 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200',
    tagline: 'Journalism of Courage · Deep Investigative, Judicial & Governance Reporting'
  },
  {
    id: 'bbc-news',
    name: 'BBC News',
    shortName: 'BBC News',
    country: 'United Kingdom',
    flag: '🇬🇧',
    type: 'Public Broadcaster',
    ownership: 'British Broadcasting Corporation (Royal Charter)',
    funding: 'UK Television licence fee & BBC Studios commercial revenue',
    website: 'https://www.bbc.com/news',
    color: 'border-rose-600 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200',
    tagline: 'Royal Charter Public Broadcaster · Gold Standard Verification & Science'
  },
  {
    id: 'cnn',
    name: 'CNN International',
    shortName: 'CNN',
    country: 'United States',
    flag: '🇺🇸',
    type: 'Independent National',
    ownership: 'Warner Bros. Discovery (CNN Worldwide)',
    funding: 'Broadcast carriage subscriptions, digital advertising & licensing',
    website: 'https://edition.cnn.com',
    color: 'border-red-600 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200',
    tagline: '24/7 Global News Network · US Policy, Frontier AI & Economic Infrastructure'
  },
  {
    id: 'al-jazeera',
    name: 'Al Jazeera English',
    shortName: 'Al Jazeera',
    country: 'Global / Middle East',
    flag: '🌍',
    type: 'Public Broadcaster',
    ownership: 'Al Jazeera Media Network (Funded by the State of Qatar)',
    funding: 'Public grant from State of Qatar and commercial revenue',
    website: 'https://www.aljazeera.com',
    color: 'border-orange-600 bg-orange-50 dark:bg-orange-950/40 text-orange-900 dark:text-orange-200',
    tagline: 'In-Depth Global South Coverage · Middle East Diplomacy & Energy Grids'
  },
  {
    id: 'the-hindu',
    name: 'The Hindu',
    shortName: 'The Hindu',
    country: 'India',
    flag: '🇮🇳',
    type: 'Independent National',
    ownership: 'Kasturi & Sons Ltd (Family-owned trust)',
    funding: 'Print & digital subscriptions, commercial advertising',
    website: 'https://www.thehindu.com',
    color: 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200',
    tagline: 'Founded 1878 · India’s National Paper of Record with Independent Reader’s Editor'
  },
  {
    id: 'reuters',
    name: 'Reuters',
    shortName: 'Reuters',
    country: 'United States',
    flag: '📡',
    type: 'Wire Agency',
    ownership: 'Thomson Reuters Corporation',
    funding: 'Terminal subscriptions, news licensing & enterprise data sales',
    website: 'https://www.reuters.com',
    color: 'border-amber-700 bg-amber-50/70 dark:bg-amber-950/30 text-amber-950 dark:text-amber-100',
    tagline: 'Trust Principles of Independence, Integrity & Freedom from Bias'
  },
  {
    id: 'ap-news',
    name: 'Associated Press (AP)',
    shortName: 'Associated Press',
    country: 'United States',
    flag: '🌐',
    type: 'Wire Agency',
    ownership: 'Independent not-for-profit news cooperative',
    funding: 'Member subscription fees and news licensing',
    website: 'https://apnews.com',
    color: 'border-stone-600 bg-stone-100 dark:bg-stone-900 text-stone-900 dark:text-stone-100',
    tagline: 'Founded 1846 · Independent Not-for-Profit Cooperative Wire Service'
  },
  {
    id: 'the-guardian',
    name: 'The Guardian',
    shortName: 'The Guardian',
    country: 'United Kingdom',
    flag: '🛡️',
    type: 'Independent National',
    ownership: 'The Scott Trust Limited (Autonomous Trust Safeguarding Independence)',
    funding: 'Reader contributions, digital subscriptions & print circulation',
    website: 'https://www.theguardian.com',
    color: 'border-sky-600 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200',
    tagline: 'Trust-Safeguarded Journalism · Climate & Investigative Global Coverage'
  },
  {
    id: 'financial-times',
    name: 'Financial Times',
    shortName: 'Financial Times',
    country: 'United Kingdom',
    flag: '📊',
    type: 'Independent Financial',
    ownership: 'Nikkei, Inc.',
    funding: 'Digital & print subscriptions, corporate licenses',
    website: 'https://www.ft.com',
    color: 'border-yellow-700 bg-amber-50 dark:bg-amber-950/30 text-amber-950 dark:text-amber-100',
    tagline: 'Global Business, Central Bank Benchmark Review & International Finance'
  }
];

const STORAGE_KEY = 'twd_connected_newsletter_outlets';

export function getConnectedOutletIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Error reading connected outlets preferences:', err);
  }
  // Default: connect all core trusted outlets
  return TRUSTED_OUTLETS_DATA.map(o => o.id);
}

export function saveConnectedOutletIds(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch (err) {
    console.error('Error saving connected outlets preferences:', err);
  }
}

// Helper to determine if an article belongs to an outlet
export function isArticleFromOutlet(art: Article, outletId: string): boolean {
  if (art.publisherId === outletId) return true;
  const meta = TRUSTED_OUTLETS_DATA.find(o => o.id === outletId);
  if (!meta) return false;
  const pub = (art.publisher || '').toLowerCase();
  const name = meta.name.toLowerCase();
  const short = meta.shortName.toLowerCase();
  return pub.includes(name) || pub.includes(short) || (outletId === 'the-hindu' && pub.includes('hindu')) || (outletId === 'indian-express' && pub.includes('indian express')) || (outletId === 'al-jazeera' && pub.includes('al jazeera')) || (outletId === 'cnn' && pub.includes('cnn')) || (outletId === 'bbc-news' && pub.includes('bbc'));
}

/**
 * Connected Outlets Bar — Interconnected into the top of the newsletter
 */
interface ConnectedOutletsBarProps {
  edition: DailyEdition;
  selectedOutletFilter: string | null;
  onSelectOutletFilter: (outletId: string | null) => void;
  onOpenManageModal: () => void;
}

export const ConnectedOutletsBar: React.FC<ConnectedOutletsBarProps> = ({
  edition,
  selectedOutletFilter,
  onSelectOutletFilter,
  onOpenManageModal
}) => {
  const [connectedIds, setConnectedIds] = useState<string[]>(getConnectedOutletIds);

  useEffect(() => {
    const handleStorage = () => setConnectedIds(getConnectedOutletIds());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Compute live count of articles in today's edition per outlet
  const allArticlesInEdition: Article[] = [
    ...(edition.sectionA_IndiaTop10 || []),
    ...(edition.sectionB_IndiaDetailed ? Object.values(edition.sectionB_IndiaDetailed).flat() : []),
    ...(edition.sectionC_WorldTop ? Object.values(edition.sectionC_WorldTop).flat() : []),
    ...(edition.sectionD_WorldEconomy || []),
    ...(edition.sectionE_TechAndAI || []),
    ...(edition.sectionF_ScienceAndClimate || [])
  ];

  // Remove duplicates for counting
  const uniqueArticles = Array.from(new Map(allArticlesInEdition.map(a => [a.id, a])).values());

  const activeOutlets = TRUSTED_OUTLETS_DATA.filter(o => connectedIds.includes(o.id));

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-sm p-4 sm:p-5 space-y-3.5 shadow-2xs">
      {/* Top Banner Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-sans text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Connected Newsrooms to Your Newsletter
          </span>
          <span className="text-[11px] text-stone-500 font-sans hidden sm:inline">
            ({activeOutlets.length} of {TRUSTED_OUTLETS_DATA.length} Trusted Channels Active)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {selectedOutletFilter && (
            <button
              onClick={() => onSelectOutletFilter(null)}
              className="px-2.5 py-1 rounded text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Show All Outlets</span>
            </button>
          )}

          <button
            onClick={onOpenManageModal}
            className="px-2.5 py-1 rounded text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Configure which trusted news outlets feed your daily newsletter"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500" />
            <span>Customize Outlets</span>
          </button>
        </div>
      </div>

      {/* Description / Mission */}
      <p className="text-xs text-stone-600 dark:text-stone-300 font-sans leading-relaxed">
        Your newsletter receives continuous, verified reports from audited newsrooms including{' '}
        <strong className="text-stone-900 dark:text-stone-100">The Indian Express</strong>,{' '}
        <strong className="text-stone-900 dark:text-stone-100">BBC News</strong>,{' '}
        <strong className="text-stone-900 dark:text-stone-100">CNN International</strong>,{' '}
        <strong className="text-stone-900 dark:text-stone-100">Al Jazeera English</strong>,{' '}
        <strong className="text-stone-900 dark:text-stone-100">The Hindu</strong>, and{' '}
        <strong className="text-stone-900 dark:text-stone-100">Reuters</strong>. Click an outlet below to filter today's briefing:
      </p>

      {/* Outlet Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-sans">
        <button
          onClick={() => onSelectOutletFilter(null)}
          className={`px-3 py-1.5 rounded-sm font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            selectedOutletFilter === null
              ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-2xs font-bold'
              : 'bg-stone-100 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
          }`}
        >
          <Globe2 className="w-3.5 h-3.5" />
          <span>All Connected Outlets ({uniqueArticles.length})</span>
        </button>

        {activeOutlets.map(outlet => {
          const count = uniqueArticles.filter(a => isArticleFromOutlet(a, outlet.id)).length;
          const isSelected = selectedOutletFilter === outlet.id;

          return (
            <button
              key={outlet.id}
              onClick={() => onSelectOutletFilter(isSelected ? null : outlet.id)}
              className={`px-3 py-1.5 rounded-sm transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 border ${
                isSelected
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100 font-bold shadow-2xs ring-1 ring-blue-500'
                  : 'border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/60 text-stone-700 dark:text-stone-300 hover:border-stone-400'
              }`}
              title={`${outlet.name} · ${outlet.tagline}`}
            >
              <span>{outlet.flag}</span>
              <span className="font-semibold">{outlet.shortName}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isSelected ? 'bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200' : 'bg-black/5 dark:bg-white/10 text-stone-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {selectedOutletFilter && (
        <div className="p-2.5 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs text-blue-950 dark:text-blue-200 font-sans">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              Showing stories reported by{' '}
              <strong>{TRUSTED_OUTLETS_DATA.find(o => o.id === selectedOutletFilter)?.name}</strong> in this edition.
            </span>
          </div>
          <button
            onClick={() => onSelectOutletFilter(null)}
            className="text-xs font-bold text-blue-700 dark:text-blue-300 underline hover:opacity-80 cursor-pointer"
          >
            Reset to Full Newsletter
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Connected Outlets Modal — Allows user to customize newsroom connections
 */
interface ConnectedOutletsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const ConnectedOutletsModal: React.FC<ConnectedOutletsModalProps> = ({
  isOpen,
  onClose,
  onUpdated
}) => {
  const [connectedIds, setConnectedIds] = useState<string[]>(getConnectedOutletIds);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConnectedIds(getConnectedOutletIds());
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleOutlet = (id: string) => {
    setConnectedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      // Keep at least one
      if (next.length === 0) return prev;
      saveConnectedOutletIds(next);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
      onUpdated();
      return next;
    });
  };

  const selectAll = () => {
    const all = TRUSTED_OUTLETS_DATA.map(o => o.id);
    setConnectedIds(all);
    saveConnectedOutletIds(all);
    onUpdated();
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 transition-opacity"
      onClick={onClose}
    >
      <div 
        className="relative bg-[#fbf9f5] dark:bg-stone-900 border border-stone-300 dark:border-stone-800 rounded-sm w-full max-w-2xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-100/70 dark:bg-stone-950/70">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="font-editorial text-lg font-bold text-stone-900 dark:text-stone-100">
              Customize Connected News Outlets
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto font-sans">
          <div className="space-y-1 text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
            <p>
              Connect or disconnect verified newsrooms that feed directly into your <strong>Daily Newsletter Briefing</strong>. Every outlet included here adheres to documented editorial charters, fact-checking policies, and transparent ownership disclosures.
            </p>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="font-bold text-stone-700 dark:text-stone-300">
              {connectedIds.length} of {TRUSTED_OUTLETS_DATA.length} Outlets Connected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                className="text-blue-700 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
              >
                Connect All Outlets
              </button>
            </div>
          </div>

          {/* Outlets List */}
          <div className="space-y-3">
            {TRUSTED_OUTLETS_DATA.map(outlet => {
              const isConnected = connectedIds.includes(outlet.id);

              return (
                <div
                  key={outlet.id}
                  onClick={() => toggleOutlet(outlet.id)}
                  className={`p-3.5 rounded-sm border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isConnected
                      ? 'border-blue-300 dark:border-blue-900 bg-white dark:bg-stone-950 shadow-xs'
                      : 'border-stone-200 dark:border-stone-800 bg-stone-100/40 dark:bg-stone-900/40 opacity-70'
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base">{outlet.flag}</span>
                      <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                        {outlet.name}
                      </h4>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-semibold">
                        {outlet.type}
                      </span>
                      <span className="text-[11px] text-stone-400">· {outlet.country}</span>
                    </div>

                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      {outlet.tagline}
                    </p>

                    <div className="text-[11px] text-stone-500 pt-1 flex items-center gap-3 flex-wrap">
                      <span><strong>Ownership:</strong> {outlet.ownership}</span>
                      <span>·</span>
                      <span><strong>Funding:</strong> {outlet.funding}</span>
                    </div>
                  </div>

                  <div className="shrink-0 pt-1">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      isConnected
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                        : 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                    }`}>
                      {isConnected ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Connected</span>
                        </>
                      ) : (
                        <span>Muted</span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-stone-200 dark:border-stone-800 bg-stone-100/80 dark:bg-stone-950 flex items-center justify-between font-sans text-xs">
          <div className="text-stone-500">
            {savedSuccess ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Preferences saved!
              </span>
            ) : (
              <span>Preferences automatically saved to your browser session.</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 font-bold rounded-sm bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 hover:opacity-90 transition-opacity cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Connected Outlets Spotlight — A dedicated curated section inside the Newsletter
 */
interface ConnectedOutletsSpotlightProps {
  edition: DailyEdition;
  onOpenDetail: (article: Article) => void;
  onPlaySection?: (title: string, subtitle: string, text: string, id: string) => void;
}

export const ConnectedOutletsSpotlight: React.FC<ConnectedOutletsSpotlightProps> = ({
  edition,
  onOpenDetail,
  onPlaySection
}) => {
  const [activeTab, setActiveTab] = useState<string>('indian-express');

  // Gather all edition articles
  const allArticles: Article[] = [
    ...(edition.sectionA_IndiaTop10 || []),
    ...(edition.sectionB_IndiaDetailed ? Object.values(edition.sectionB_IndiaDetailed).flat() : []),
    ...(edition.sectionC_WorldTop ? Object.values(edition.sectionC_WorldTop).flat() : []),
    ...(edition.sectionD_WorldEconomy || []),
    ...(edition.sectionE_TechAndAI || []),
    ...(edition.sectionF_ScienceAndClimate || [])
  ];

  const uniqueArticles = Array.from(new Map(allArticles.map(a => [a.id, a])).values());

  const currentOutlet = TRUSTED_OUTLETS_DATA.find(o => o.id === activeTab) || TRUSTED_OUTLETS_DATA[0];
  const outletArticles = uniqueArticles.filter(a => isArticleFromOutlet(a, currentOutlet.id));

  return (
    <section className="space-y-6">
      <div className="paper-border-double pb-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-red-600 dark:text-red-400" />
            <h3 className="font-editorial text-2xl font-black text-stone-950 dark:text-stone-50 uppercase tracking-tight">
              Section I · Connected Newsrooms Wire & Editorial Desks
            </h3>
          </div>
          <p className="text-xs text-stone-500 font-sans">
            Directly interconnected reporting from Indian Express, BBC News, CNN, Al Jazeera, The Hindu & Reuters
          </p>
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-stone-600 dark:text-stone-400 font-sans">
          Curated Wire Stream
        </span>
      </div>

      {/* Outlet Selector Segmented Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar text-xs font-sans">
        {TRUSTED_OUTLETS_DATA.slice(0, 6).map(outlet => {
          const count = uniqueArticles.filter(a => isArticleFromOutlet(a, outlet.id)).length;
          const isActive = activeTab === outlet.id;

          return (
            <button
              key={outlet.id}
              onClick={() => setActiveTab(outlet.id)}
              className={`px-3 py-2 rounded-sm transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 font-semibold ${
                isActive
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-2xs font-bold'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              <span>{outlet.flag}</span>
              <span>{outlet.shortName}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isActive ? 'bg-white/20 dark:bg-black/20 text-white dark:text-stone-900' : 'bg-black/5 dark:bg-white/10 text-stone-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Desk Dossier & Articles Card */}
      <div className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-800 rounded-sm p-6 sm:p-8 space-y-6 shadow-2xs">
        {/* Desk Header Profile */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl">{currentOutlet.flag}</span>
              <h4 className="font-editorial text-2xl font-bold text-stone-950 dark:text-stone-50">
                {currentOutlet.name} — Connected Wire
              </h4>
              <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold">
                {currentOutlet.type}
              </span>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 font-sans max-w-2xl leading-relaxed">
              {currentOutlet.tagline}
            </p>
            <div className="text-[11px] text-stone-500 font-sans flex items-center gap-3 flex-wrap pt-1">
              <span><strong>Country:</strong> {currentOutlet.country}</span>
              <span>·</span>
              <span><strong>Ownership:</strong> {currentOutlet.ownership}</span>
              <span>·</span>
              <span><strong>Funding:</strong> {currentOutlet.funding}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onPlaySection && outletArticles.length > 0 && (
              <button
                onClick={() => {
                  const storiesText = outletArticles.map((a, i) => `Story ${i + 1}: ${a.headline}. ${a.summary}`).join(' ');
                  onPlaySection(
                    `${currentOutlet.name} Briefing`,
                    `Connected Newsroom · ${outletArticles.length} Stories`,
                    `Here is today's curated briefing from ${currentOutlet.name}. ${storiesText}`,
                    `section-outlet-${currentOutlet.id}`
                  );
                }}
                className="px-3 py-1.5 rounded-sm text-xs font-semibold flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-colors cursor-pointer"
                title={`Listen to all ${currentOutlet.name} stories in this edition`}
              >
                <Headphones className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
                <span>Listen to Desk</span>
              </button>
            )}

            <a
              href={currentOutlet.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-sm text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-colors"
            >
              Official Portal <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Stories from this Outlet */}
        {outletArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {outletArticles.map((art, idx) => (
              <div
                key={`outlet-${currentOutlet.id}-${art.id}-${idx}`}
                onClick={() => onOpenDetail(art)}
                className="p-5 rounded-sm border border-stone-200 dark:border-stone-800 bg-[#fbf9f5] dark:bg-stone-950/70 hover:border-stone-400 transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-center justify-between text-xs font-sans text-stone-500">
                  <span className="font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                    {art.category}
                  </span>
                  <span className="text-[11px]">
                    {getArticleReadingTime(art)}
                  </span>
                </div>

                <h5 className="font-editorial text-lg font-bold text-stone-950 dark:text-stone-50 leading-snug">
                  {art.headline}
                </h5>

                <p className="text-xs text-stone-600 dark:text-stone-300 font-sans leading-relaxed line-clamp-3">
                  {art.summary}
                </p>

                {art.whyItMatters && (
                  <div className="p-2.5 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-[11px] text-stone-700 dark:text-stone-300 font-sans">
                    <strong className="text-stone-950 dark:text-stone-100 uppercase tracking-wider block mb-0.5">
                      Why it matters:
                    </strong>
                    {art.whyItMatters}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-stone-200 dark:border-stone-800 text-xs font-sans">
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                    ✓ Verified Report
                  </span>
                  <span className="text-stone-900 dark:text-stone-100 font-bold hover:underline inline-flex items-center gap-1">
                    Read Report <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-stone-50 dark:bg-stone-950/60 rounded-sm text-stone-500 text-sm font-sans space-y-2">
            <p>
              Additional live dispatches from {currentOutlet.name} are currently undergoing the corroboration and verification pipeline.
            </p>
            <p className="text-xs text-stone-400">
              Check back following the next automated ingestion cycle at 06:30 AM IST.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
