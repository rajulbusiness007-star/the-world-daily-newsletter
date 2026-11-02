import React, { useState } from 'react';
import { DailyEdition, Article } from '../types.js';
import { ArticleCard } from './ArticleCard.js';
import { Printer, Copy, Check, Sparkles, BookOpen, Layers, ExternalLink, Calendar, MapPin, ShieldCheck, Clock, ArrowUpRight, WifiOff, CheckCircle2, Download, Headphones, Volume2, Play, Pause, Radio, SlidersHorizontal, Filter, Bell, BellRing, Camera } from 'lucide-react';
import { getReadingTime, getArticleReadingTime } from '../utils/readingTime.js';
import { getArticleImageUrl, DEFAULT_FALLBACK_IMAGE, isVerifiedArticleImage } from '../utils/newsImages.js';
import { 
  ConnectedOutletsBar, 
  ConnectedOutletsModal, 
  ConnectedOutletsSpotlight,
  isArticleFromOutlet,
  TRUSTED_OUTLETS_DATA
} from './ConnectedOutletsManager.js';

interface NewsletterViewProps {
  edition: DailyEdition | null;
  onOpenDetail: (article: Article) => void;
  savedArticles: Article[];
  onToggleSave: (article: Article) => void;
  fontSize: 'sm' | 'md' | 'lg';
  isOffline?: boolean;
  isCached?: boolean;
  onPlayEdition?: (edition: DailyEdition) => void;
  onPlayArticle?: (article: Article) => void;
  onPlaySection?: (title: string, subtitle: string, text: string, id: string) => void;
  currentTrackId?: string | null;
  currentArticleId?: string | null;
  isPlaying?: boolean;
  isPaused?: boolean;
  onTogglePlayPause?: () => void;
  onOpenNotifications?: () => void;
  isNotificationEnabled?: boolean;
}

export const NewsletterView: React.FC<NewsletterViewProps> = ({
  edition,
  onOpenDetail,
  savedArticles,
  onToggleSave,
  fontSize,
  isOffline = false,
  isCached = false,
  onPlayEdition,
  onPlayArticle,
  onPlaySection,
  currentTrackId = null,
  currentArticleId = null,
  isPlaying = false,
  isPaused = false,
  onTogglePlayPause,
  onOpenNotifications,
  isNotificationEnabled = false
}) => {
  const [copied, setCopied] = useState(false);
  const [cachedConfirmed, setCachedConfirmed] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('politicsAndGovernment');
  const [selectedOutletFilter, setSelectedOutletFilter] = useState<string | null>(null);
  const [isOutletModalOpen, setIsOutletModalOpen] = useState(false);
  const [, setOutletTick] = useState(0);

  if (!edition) {
    return (
      <div className="max-w-4xl mx-auto py-24 px-4 text-center">
        <div className="animate-spin w-6 h-6 border-2 border-stone-800 dark:border-stone-200 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-stone-600 dark:text-stone-300 font-serif italic">Compiling Today's Morning Edition...</p>
      </div>
    );
  }

  const handleCacheOffline = async () => {
    try {
      if ('caches' in window && edition) {
        const cache = await caches.open('twd-edition-twd-v1');
        const res = new Response(JSON.stringify(edition), {
          headers: { 'Content-Type': 'application/json' }
        });
        await cache.put('/api/newsletter/today', res.clone());
        await cache.put('/api/newsletter/latest', res.clone());
      }
      localStorage.setItem('twd_cached_daily_edition', JSON.stringify(edition));
      setCachedConfirmed(true);
      setTimeout(() => setCachedConfirmed(false), 3000);
    } catch (err) {
      console.error('Failed to cache edition offline:', err);
    }
  };

  const isSaved = (art: Article) => savedArticles.some(s => s.id === art.id);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyBriefing = () => {
    let text = `THE WORLD DAILY — DAILY GLOBAL BRIEFING\n`;
    text += `${edition.formattedDate} • 06:30 AM IST Edition\n\n`;
    text += `FIVE THINGS TO REMEMBER TODAY:\n`;
    edition.sectionH_FiveThingsToRemember.forEach((item, i) => {
      text += `${i + 1}. ${item}\n`;
    });
    text += `\nTHE BIGGER PICTURE:\n${edition.sectionG_TheBiggerPicture.headline}\n${edition.sectionG_TheBiggerPicture.whatHappened}\n\n`;
    text += `INDIA TOP NEWS:\n`;
    edition.sectionA_IndiaTop10.forEach((art, i) => {
      text += `${i + 1}. [${art.publisher}] ${art.headline}\nSummary: ${art.summary}\nWhy it matters: ${art.whyItMatters}\nLink: ${art.url}\n\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const sectionAHeadlineClass = fontSize === 'lg' 
    ? 'text-xl sm:text-2xl font-black' 
    : fontSize === 'md' 
    ? 'text-lg sm:text-xl font-bold' 
    : 'text-base sm:text-lg font-bold';

  const sectionASummaryClass = fontSize === 'lg' 
    ? 'text-base sm:text-lg leading-relaxed' 
    : fontSize === 'md' 
    ? 'text-[15px] sm:text-base leading-relaxed' 
    : 'text-sm leading-normal';

  const detailedCategories = [
    { key: 'politicsAndGovernment', label: 'Politics & Government', count: edition.sectionB_IndiaDetailed.politicsAndGovernment.length },
    { key: 'economyAndBusiness', label: 'Economy & Business', count: edition.sectionB_IndiaDetailed.economyAndBusiness.length },
    { key: 'technologyAndAI', label: 'Technology & AI', count: edition.sectionB_IndiaDetailed.technologyAndAI.length },
    { key: 'courtsAndLegal', label: 'Courts & Legal', count: edition.sectionB_IndiaDetailed.courtsAndLegal.length },
    { key: 'educationAndEmployment', label: 'Education & Jobs', count: edition.sectionB_IndiaDetailed.educationAndEmployment.length },
    { key: 'defenceAndSecurity', label: 'Defence & Security', count: edition.sectionB_IndiaDetailed.defenceAndSecurity.length },
    { key: 'scienceAndHealthcare', label: 'Science & Healthcare', count: edition.sectionB_IndiaDetailed.scienceAndHealthcare.length },
    { key: 'statesAndRegional', label: 'States & Regional', count: edition.sectionB_IndiaDetailed.statesAndRegional.length }
  ];

  const filterByOutlet = (list: Article[] | undefined): Article[] => {
    if (!list) return [];
    if (!selectedOutletFilter) return list;
    return list.filter(a => isArticleFromOutlet(a, selectedOutletFilter));
  };

  const rawCategoryArticles = (edition.sectionB_IndiaDetailed as any)[activeCategoryTab] || [];
  const activeCategoryArticles = filterByOutlet(rawCategoryArticles);
  const displaySectionA = filterByOutlet(edition.sectionA_IndiaTop10);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-14 pb-20 overflow-hidden">
      {/* Top Edition Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-stone-900 dark:border-stone-100 pb-5 min-w-0">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-600 dark:text-stone-400 font-sans">
              Automated Daily Briefing · Asia/Kolkata 06:30 AM IST
            </span>
            {(isOffline || isCached) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                <WifiOff className="w-3 h-3" /> Cached Edition
              </span>
            )}
          </div>
          <h2 className="font-editorial text-3xl sm:text-4xl font-black text-stone-950 dark:text-stone-50 break-words">
            Daily Newsletter — {edition.formattedDate}
          </h2>
          <div className="text-xs text-stone-500 font-sans flex items-center gap-2 flex-wrap min-w-0">
            <span>Edition #{edition.editionNumber}</span>
            <span aria-hidden="true">·</span>
            <span>{edition.totalArticles} Verified Stories</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-stone-800 dark:text-stone-200">
              {(edition.indiaRatio * 100).toFixed(0)}% India / {(edition.worldRatio * 100).toFixed(0)}% World Weighting
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Available Offline
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 no-print font-sans flex-wrap shrink-0">
          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-sm transition-colors cursor-pointer border ${
                isNotificationEnabled
                  ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
                  : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700'
              }`}
              title="Daily Morning Briefing Notifications (06:30 AM IST)"
            >
              <Bell className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{isNotificationEnabled ? 'Daily Alert On (06:30)' : 'Enable Daily Alert'}</span>
            </button>
          )}

          <button
            onClick={() => setIsOutletModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-sm bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
            title="Configure trusted news channels connected to your daily newsletter"
          >
            <Radio className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Connected Outlets</span>
          </button>

          <button
            onClick={handleCacheOffline}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-sm bg-stone-100 hover:bg-stone-200 text-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-200 border border-stone-300 dark:border-stone-700 transition-colors cursor-pointer"
            title="Download or re-verify this edition in browser service worker cache"
          >
            {cachedConfirmed ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Download className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
            )}
            <span>{cachedConfirmed ? 'Saved Offline!' : 'Cached Offline'}</span>
          </button>

          <button
            onClick={handleCopyBriefing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-sm bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Briefing' : 'Copy Briefing'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-sm bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Edition</span>
          </button>
        </div>
      </div>

      {/* CONNECTED TRUSTED OUTLETS RIBBON */}
      <ConnectedOutletsBar
        edition={edition}
        selectedOutletFilter={selectedOutletFilter}
        onSelectOutletFilter={setSelectedOutletFilter}
        onOpenManageModal={() => setIsOutletModalOpen(true)}
      />

      {/* HERO AUDIO BRIEFING BANNER */}
      {onPlayEdition && (
        <div className="rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-stone-900 via-stone-850 to-stone-900 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950 text-stone-100 shadow-xl border border-stone-750 dark:border-stone-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 no-print min-w-0">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <Headphones className="w-6 h-6" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
                  Audio Briefing Edition
                </span>
                <span className="text-stone-500">·</span>
                <span className="text-[11px] text-stone-400 font-sans">
                  ~12 min narration · Hands-Free
                </span>
              </div>
              <h3 className="font-editorial text-xl sm:text-2xl font-black text-white break-words">
                Listen to Today's Morning Edition
              </h3>
              <p className="text-xs text-stone-300 font-sans max-w-xl leading-relaxed break-words">
                Automated audio narration powered by Web Speech Synthesis. Reads Five Things to Remember, The Bigger Picture explainer, and top verified dispatches in sequence.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={() => {
                if (isPlaying && onTogglePlayPause) {
                  onTogglePlayPause();
                } else {
                  onPlayEdition(edition);
                }
              }}
              className="flex-1 md:flex-none px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              {isPlaying && !isPaused ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause Briefing</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>{isPaused ? 'Resume Briefing' : "Listen to Edition"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* SECTION H: FIVE THINGS TO REMEMBER TODAY */}
      <section className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-800 p-6 sm:p-7 rounded-sm shadow-2xs space-y-4 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2.5 flex-wrap gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-stone-600 dark:text-stone-400 shrink-0" />
            <h3 className="font-editorial text-lg sm:text-xl font-bold text-stone-950 dark:text-stone-100 uppercase tracking-tight break-words">
              Section H · Five Things to Remember Today
            </h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onPlaySection && (
              <button
                onClick={() => {
                  const fiveThingsText = edition.sectionH_FiveThingsToRemember
                    .map((item, idx) => `Point ${idx + 1}: ${item}`)
                    .join('. ');
                  onPlaySection(
                    'Five Things to Remember Today',
                    'Section H · Executive Summary',
                    `Here are the five key things to remember today. ${fiveThingsText}`,
                    'section-h'
                  );
                }}
                className="px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-colors cursor-pointer"
                title="Listen to Section H (approx. 90 seconds)"
              >
                <Headphones className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
                <span>Listen (1.5 min)</span>
              </button>
            )}
            <span className="text-[10px] uppercase font-bold tracking-widest text-stone-500 font-sans hidden sm:inline">
              Executive Summary
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 pt-1">
          {edition.sectionH_FiveThingsToRemember.map((takeaway, idx) => (
            <div 
              key={idx}
              className="p-3.5 rounded-xs bg-[#fbf9f5] dark:bg-stone-950/80 border border-stone-200/90 dark:border-stone-800 space-y-1.5 min-w-0"
            >
              <div className="font-editorial font-bold text-sm text-stone-900 dark:text-stone-100">
                0{idx + 1}.
              </div>
              <p className="text-xs text-stone-700 dark:text-stone-300 font-sans leading-relaxed break-words">
                {takeaway}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION G: THE BIGGER PICTURE */}
      <section className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-800 p-6 sm:p-8 rounded-sm space-y-6 shadow-2xs overflow-hidden min-w-0">
        <div className="paper-border-double pb-2.5 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-stone-700 dark:text-stone-300 shrink-0" />
            <h3 className="font-editorial text-2xl font-black text-stone-950 dark:text-stone-50 uppercase tracking-tight break-words">
              Section G · The Bigger Picture
            </h3>
          </div>
          <span className="text-xs text-stone-500 uppercase font-sans font-semibold shrink-0">
            Daily In-Depth Explainer
          </span>
        </div>

        <div className="space-y-4 min-w-0">
          <h4 className="font-editorial text-2xl sm:text-3xl font-black text-stone-950 dark:text-stone-50 leading-tight break-words">
            {edition.sectionG_TheBiggerPicture.headline}
          </h4>

          <div className="prose dark:prose-invert max-w-none text-stone-800 dark:text-stone-200 font-sans text-sm sm:text-base leading-relaxed space-y-4">
            <div className="p-4 rounded bg-[#fbf9f5] dark:bg-stone-950/80 border border-stone-200 dark:border-stone-800 min-w-0">
              <strong className="block text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 mb-1">
                What Happened:
              </strong>
              <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed break-words">
                {edition.sectionG_TheBiggerPicture.whatHappened}
              </p>
            </div>

            <div className="p-4 rounded bg-[#fbf9f5] dark:bg-stone-950/80 border border-stone-200 dark:border-stone-800 min-w-0">
              <strong className="block text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 mb-1">
                Why Did It Happen:
              </strong>
              <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed break-words">
                {edition.sectionG_TheBiggerPicture.whyDidItHappen}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 min-w-0">
                <strong className="block text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 mb-2">
                  ✓ What Is Confirmed:
                </strong>
                <ul className="text-xs text-emerald-950 dark:text-emerald-200 space-y-1.5 list-disc list-inside">
                  {edition.sectionG_TheBiggerPicture.whatIsConfirmed.map((c, i) => (
                    <li key={i} className="break-words">{c}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 min-w-0">
                <strong className="block text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 mb-2">
                  ⚠ What Is Still Uncertain:
                </strong>
                <ul className="text-xs text-amber-950 dark:text-amber-200 space-y-1.5 list-disc list-inside">
                  {edition.sectionG_TheBiggerPicture.whatIsStillUncertain.map((u, i) => (
                    <li key={i} className="break-words">{u}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-4 rounded bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-950 dark:text-blue-200 min-w-0">
              <strong className="block font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 mb-1">
                Why Readers Care:
              </strong>
              <p className="break-words">{edition.sectionG_TheBiggerPicture.whyIndianReadersCare}</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION A: INDIA — TOP 10 DEVELOPMENTS */}
      <section className="space-y-6 min-w-0">
        <div className="paper-border-double pb-2.5 flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-editorial text-2xl font-black text-stone-950 dark:text-stone-50 uppercase tracking-tight break-words">
            Section A · India — Top 10 Developments
          </h3>
          <span className="text-xs text-stone-500 font-semibold uppercase font-sans shrink-0">National Record</span>
        </div>

        <div className="space-y-6 min-w-0">
          {displaySectionA.map((article, idx) => {
            const isSpeakingThis = currentArticleId === article.id && isPlaying;
            const hasVerifiedPhoto = isVerifiedArticleImage(article);

            return (
              <div 
                key={`secA-${article.id}-${idx}`}
                onClick={() => onOpenDetail(article)}
                className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-800 p-5 sm:p-6 rounded-sm space-y-3.5 hover:border-stone-500 transition-all cursor-pointer shadow-2xs overflow-hidden min-w-0"
              >
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2.5 flex-wrap gap-2 text-xs font-sans text-stone-500">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <span className="font-editorial font-bold text-base text-stone-900 dark:text-stone-100">
                      #{idx + 1}
                    </span>
                    <span aria-hidden="true" className="text-stone-300">·</span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100 truncate">
                      {article.publisher}
                    </span>
                    <span aria-hidden="true" className="text-stone-300">·</span>
                    <span className="text-stone-500 truncate">{article.location || 'New Delhi'}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {hasVerifiedPhoto && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        <Camera className="w-3 h-3 text-emerald-500" /> Photo
                      </span>
                    )}
                    <span className="font-semibold text-xs text-stone-700 dark:text-stone-300">
                      [{article.verificationStatus}]
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-start min-w-0">
                  <div className="relative w-full sm:w-44 sm:h-28 rounded-xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
                    <img
                      src={getArticleImageUrl(article)}
                      alt={article.headline}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE;
                      }}
                    />
                  </div>
                  <div className="space-y-2 flex-1 min-w-0">
                    <h4 className={`font-editorial text-stone-950 dark:text-stone-50 leading-snug break-words ${sectionAHeadlineClass}`}>
                      {article.headline}
                    </h4>

                    <p className={`text-stone-600 dark:text-stone-300 font-sans break-words ${sectionASummaryClass}`}>
                      {article.summary}
                    </p>
                  </div>
                </div>

                {article.whyItMatters && (
                  <div className="p-3 rounded-xs bg-[#fbf9f5] dark:bg-stone-950/80 border border-stone-200 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300 font-sans leading-relaxed break-words">
                    <strong className="text-stone-950 dark:text-stone-100 uppercase tracking-wider block mb-0.5">
                      Why this news matters:
                    </strong>
                    {article.whyItMatters}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800/80 text-xs text-stone-500 font-sans flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                  <span className="text-[11px] truncate">
                    {article.corroboratingSources?.length ? `Corroborated by ${article.corroboratingSources.length} organisations` : 'Primary wire source'}
                  </span>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    {onPlayArticle && (
                      <button
                        onClick={() => onPlayArticle(article)}
                        className={`px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                          isSpeakingThis
                            ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                            : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                        }`}
                        title="Listen to this article"
                      >
                        <Headphones className="w-3.5 h-3.5 text-stone-500" />
                        <span>{isSpeakingThis ? 'Playing' : 'Listen'}</span>
                      </button>
                    )}
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-stone-900 dark:text-stone-100 hover:underline inline-flex items-center gap-1"
                    >
                      Read on {article.publisher} <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}

          {displaySectionA.length === 0 && (
            <div className="p-8 text-center bg-stone-100 dark:bg-stone-900 rounded-sm text-stone-500 text-sm font-sans space-y-1.5">
              <p>No Section A articles match the active outlet filter.</p>
              <button
                onClick={() => setSelectedOutletFilter(null)}
                className="text-xs font-bold text-blue-700 dark:text-blue-400 underline cursor-pointer"
              >
                Clear outlet filter to view all top stories
              </button>
            </div>
          )}
        </div>
      </section>

      {/* SECTION I: CONNECTED NEWSROOMS WIRE & EDITORIAL DESKS */}
      <ConnectedOutletsSpotlight
        edition={edition}
        onOpenDetail={onOpenDetail}
        onPlaySection={onPlaySection}
      />

      {/* SECTION B: INDIA — DETAILED COVERAGE */}
      <section className="space-y-6 min-w-0">
        <div className="paper-border-double pb-2.5 flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-editorial text-2xl font-black text-stone-950 dark:text-stone-50 uppercase tracking-tight break-words">
            Section B · India — Detailed Coverage by Category
          </h3>
          <span className="text-xs text-stone-500 font-semibold uppercase font-sans shrink-0">8 Core Domains</span>
        </div>

        {/* Category Segmented Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar text-xs font-semibold font-sans">
          {detailedCategories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategoryTab(cat.key)}
              className={`px-3 py-1.5 rounded-sm transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeCategoryTab === cat.key
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-2xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
          {activeCategoryArticles.map((article: Article, idx: number) => (
            <ArticleCard
              key={`secB-${article.id}-${idx}`}
              article={article}
              onOpenDetail={onOpenDetail}
              isSaved={isSaved(article)}
              onToggleSave={onToggleSave}
              fontSize={fontSize}
            />
          ))}

          {activeCategoryArticles.length === 0 && (
            <div className="col-span-1 md:col-span-2 p-8 text-center bg-stone-100 dark:bg-stone-900 rounded-sm text-stone-500 text-sm font-sans">
              No articles currently filed under this specific subcategory for today's edition.
            </div>
          )}
        </div>
      </section>

      {/* SECTION C: WORLD — TOP INTERNATIONAL NEWS */}
      <section className="space-y-6 min-w-0">
        <div className="paper-border-double pb-2.5 flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-editorial text-2xl font-black text-stone-950 dark:text-stone-50 uppercase tracking-tight break-words">
            Section C · World — Top International News
          </h3>
          <span className="text-xs text-stone-500 font-semibold uppercase font-sans shrink-0">
            US (CNN, NYT, WaPo) · UK (BBC, Sky News) · Europe · China · Australia · Asia-Pacific
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">
          {/* US & UK */}
          <div className="space-y-4 min-w-0">
            <h4 className="font-editorial text-base font-bold text-stone-800 dark:text-stone-200 border-b border-stone-200 dark:border-stone-800 pb-1.5 break-words">
              United States & United Kingdom (CNN, NYT, BBC, Sky News, Reuters)
            </h4>
            {filterByOutlet([...edition.sectionC_WorldTop.unitedStates, ...edition.sectionC_WorldTop.unitedKingdom]).slice(0, 4).map((art, idx) => (
              <ArticleCard
                key={`secC-usuk-${art.id}-${idx}`}
                article={art}
                onOpenDetail={onOpenDetail}
                isSaved={isSaved(art)}
                onToggleSave={onToggleSave}
                fontSize={fontSize}
              />
            ))}
          </div>

          {/* Europe, Asia-Pacific, Middle East, China */}
          <div className="space-y-4 min-w-0">
            <h4 className="font-editorial text-base font-bold text-stone-800 dark:text-stone-200 border-b border-stone-200 dark:border-stone-800 pb-1.5 break-words">
              Europe, China, Middle East & Asia-Pacific (SCMP, CNA, DW, Al Jazeera)
            </h4>
            {filterByOutlet([...edition.sectionC_WorldTop.europe, ...edition.sectionC_WorldTop.middleEast, ...edition.sectionC_WorldTop.china, ...edition.sectionC_WorldTop.australia]).slice(0, 4).map((art, idx) => (
              <ArticleCard
                key={`secC-eurasia-${art.id}-${idx}`}
                article={art}
                onOpenDetail={onOpenDetail}
                isSaved={isSaved(art)}
                onToggleSave={onToggleSave}
                fontSize={fontSize}
              />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION D: WORLD ECONOMY AND BUSINESS */}
      <section className="space-y-6 min-w-0">
        <div className="paper-border-double pb-2.5 flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-editorial text-2xl font-black text-stone-950 dark:text-stone-50 uppercase tracking-tight break-words">
            Section D · World Economy and Business
          </h3>
          <span className="text-xs text-stone-500 uppercase font-sans shrink-0">Global Macro & Central Banks</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
          {filterByOutlet(edition.sectionD_WorldEconomy).slice(0, 4).map((art, idx) => (
            <ArticleCard
              key={`secD-${art.id}-${idx}`}
              article={art}
              onOpenDetail={onOpenDetail}
              isSaved={isSaved(art)}
              onToggleSave={onToggleSave}
              fontSize={fontSize}
            />
          ))}
        </div>
      </section>

      {/* SECTION E: TECHNOLOGY AND AI */}
      <section className="space-y-6 min-w-0">
        <div className="paper-border-double pb-2.5 flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-editorial text-2xl font-black text-stone-950 dark:text-stone-50 uppercase tracking-tight break-words">
            Section E · Technology and AI
          </h3>
          <span className="text-xs text-stone-500 uppercase font-sans shrink-0">Frontier Models, Hardware & Policy</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
          {filterByOutlet(edition.sectionE_TechAndAI).slice(0, 4).map((art, idx) => (
            <ArticleCard
              key={`secE-${art.id}-${idx}`}
              article={art}
              onOpenDetail={onOpenDetail}
              isSaved={isSaved(art)}
              onToggleSave={onToggleSave}
              fontSize={fontSize}
            />
          ))}
        </div>
      </section>

      {/* SECTION F: SCIENCE, CLIMATE AND ENVIRONMENT */}
      <section className="space-y-6 min-w-0">
        <div className="paper-border-double pb-2.5 flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-editorial text-2xl font-black text-stone-950 dark:text-stone-50 uppercase tracking-tight break-words">
            Section F · Science, Climate and Environment
          </h3>
          <span className="text-xs text-stone-500 uppercase font-sans shrink-0">Space, Energy & Peer-Reviewed Science</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
          {filterByOutlet(edition.sectionF_ScienceAndClimate).slice(0, 4).map((art, idx) => (
            <ArticleCard
              key={`secF-${art.id}-${idx}`}
              article={art}
              onOpenDetail={onOpenDetail}
              isSaved={isSaved(art)}
              onToggleSave={onToggleSave}
              fontSize={fontSize}
            />
          ))}
        </div>
      </section>

      {/* Customize Connected Outlets Modal */}
      <ConnectedOutletsModal
        isOpen={isOutletModalOpen}
        onClose={() => setIsOutletModalOpen(false)}
        onUpdated={() => setOutletTick(t => t + 1)}
      />
    </div>
  );
};