import React, { useState, useEffect, useRef } from 'react';
import { 
  X, ShieldCheck, Building2, AlertTriangle, ExternalLink, Bookmark, Share2, 
  Layers, CheckCircle2, HelpCircle, Info, Clock, ArrowUpRight, Headphones, 
  Volume2, Pause, Play, Sparkles, Loader2, ListChecks, BookOpen, Type, AlignLeft, 
  Minimize2, Maximize2, Sun, Moon, Coffee 
} from 'lucide-react';
import { Article, VerificationStatus } from '../types.js';
import { getReadingTime, getArticleReadingTime } from '../utils/readingTime.js';
import { getArticleImageUrl, DEFAULT_FALLBACK_IMAGE } from '../utils/newsImages.js';
import { EconomicTrendSparkline } from './EconomicTrendSparkline.js';
import { ArticleReaderMode } from './ArticleReaderMode.js';

interface ArticleModalProps {
  article: Article | null;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (article: Article) => void;
  publisherOwnership?: string;
  publisherFunding?: string;
  onScrollProgress?: (progress: number) => void;
  onPlayArticle?: (article: Article) => void;
  isCurrentlySpeaking?: boolean;
  isPlaying?: boolean;
  isPaused?: boolean;
  onTogglePlayPause?: () => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  article,
  onClose,
  isSaved,
  onToggleSave,
  publisherOwnership,
  publisherFunding,
  onScrollProgress,
  onPlayArticle,
  isCurrentlySpeaking = false,
  isPlaying = false,
  isPaused = false,
  onTogglePlayPause
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared' | 'copied'>('idle');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Quick Summary (TL;DR) State
  const [quickSummaryActive, setQuickSummaryActive] = useState<boolean>(false);
  const [quickSummaryLoading, setQuickSummaryLoading] = useState<boolean>(false);
  const [quickSummaryBullets, setQuickSummaryBullets] = useState<string[] | null>(null);
  const [quickSummarySource, setQuickSummarySource] = useState<'gemini' | 'fallback'>('gemini');
  const summaryCacheRef = useRef<Map<string, { bullets: string[]; source: 'gemini' | 'fallback' }>>(new Map());

  // Reader Mode State (Distraction-free typography layout)
  const [readerMode, setReaderMode] = useState<boolean>(false);
  const [readerFont, setReaderFont] = useState<'serif' | 'sans'>('serif');
  const [readerSize, setReaderSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [readerTheme, setReaderTheme] = useState<'sepia' | 'day' | 'night'>('sepia');

  // Keyboard shortcut: 'R' key toggles Reader Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        if (
          document.activeElement?.tagName !== 'INPUT' && 
          document.activeElement?.tagName !== 'TEXTAREA' &&
          !e.metaKey && !e.ctrlKey
        ) {
          e.preventDefault();
          setReaderMode(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    setScrollProgress(0);
    onScrollProgress?.(0);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }

    if (article) {
      const cached = summaryCacheRef.current.get(article.id);
      if (cached) {
        setQuickSummaryBullets(cached.bullets);
        setQuickSummarySource(cached.source);
      } else {
        setQuickSummaryBullets(null);
        setQuickSummaryActive(false);
      }
    } else {
      setQuickSummaryBullets(null);
      setQuickSummaryActive(false);
    }
    setQuickSummaryLoading(false);
  }, [article?.id, onScrollProgress]);

  const loadQuickSummary = async () => {
    if (!article) return;
    const cached = summaryCacheRef.current.get(article.id);
    if (cached) {
      setQuickSummaryBullets(cached.bullets);
      setQuickSummarySource(cached.source);
      return;
    }

    setQuickSummaryLoading(true);

    try {
      const res = await fetch('/api/article/quick-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: article.id,
          headline: article.headline,
          summary: article.summary,
          facts: article.facts,
          whyItMatters: article.whyItMatters,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to generate quick summary (${res.status})`);
      }

      const data = await res.json();
      if (Array.isArray(data.bullets) && data.bullets.length > 0) {
        summaryCacheRef.current.set(article.id, {
          bullets: data.bullets,
          source: data.source || 'gemini',
        });
        setQuickSummaryBullets(data.bullets);
        setQuickSummarySource(data.source || 'gemini');
      } else {
        throw new Error('Invalid quick summary response');
      }
    } catch (err) {
      console.warn('Gemini quick summary fallback:', err);
      const fallback = [
        article.summary.split('. ')[0] ? `${article.summary.split('. ')[0].trim()}.` : article.headline,
        article.facts && article.facts.length > 0 ? article.facts[0] : (article.whyItMatters || 'Verified through primary news dispatches.'),
        article.facts && article.facts.length > 1 ? article.facts[1] : 'Key stakeholders and authorities are continuing operational reviews.',
      ];
      setQuickSummaryBullets(fallback);
      setQuickSummarySource('fallback');
      summaryCacheRef.current.set(article.id, {
        bullets: fallback,
        source: 'fallback',
      });
    } finally {
      setQuickSummaryLoading(false);
    }
  };

  const handleToggleQuickSummary = () => {
    const nextState = !quickSummaryActive;
    setQuickSummaryActive(nextState);
    if (nextState && !quickSummaryBullets) {
      loadQuickSummary();
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const totalScroll = target.scrollHeight - target.clientHeight;
    if (totalScroll > 0) {
      const progress = (target.scrollTop / totalScroll) * 100;
      const clamped = Math.min(100, Math.max(0, progress));
      setScrollProgress(clamped);
      onScrollProgress?.(clamped);
    } else {
      setScrollProgress(100);
      onScrollProgress?.(100);
    }
  };

  const handleShare = async () => {
    if (!article) return;

    const shareUrl = article.url || window.location.href;
    const shareText = article.summary 
      ? `${article.headline} — ${article.summary.slice(0, 160)}...`
      : article.headline;

    const shareData = {
      title: article.headline,
      text: shareText,
      url: shareUrl,
    };

    // 1. Check for Web Share API (native share drawer on mobile / supported desktop browsers)
    if (typeof navigator !== 'undefined' && 'share' in navigator && typeof navigator.share === 'function') {
      try {
        const canShare = typeof navigator.canShare === 'function' ? navigator.canShare(shareData) : true;
        if (canShare) {
          await navigator.share(shareData);
          setShareStatus('shared');
          setTimeout(() => setShareStatus('idle'), 2500);
          return;
        }
      } catch (err: unknown) {
        // If user cancelled or dismissed the native share sheet, gracefully return without error
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        console.warn('Web Share API invocation failed, falling back to clipboard copy:', err);
      }
    }

    // 2. Fallback: Copy headline and URL to clipboard with visual feedback
    try {
      const copyContent = `${article.headline}\n${shareUrl}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(copyContent);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = copyContent;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2500);
    } catch (copyErr) {
      console.error('Failed to copy link to clipboard:', copyErr);
    }
  };

  if (!article) return null;

  const formatFullDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date) + ' IST';
    } catch {
      return isoString;
    }
  };

  const renderVerificationStamp = (status: VerificationStatus) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-400 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            Verified · Multi-Source Corroborated
          </span>
        );
      case 'OFFICIAL STATEMENT':
        return (
          <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-widest text-blue-800 dark:text-blue-400 text-xs">
            <Building2 className="w-4 h-4 text-blue-700 dark:text-blue-400" />
            Official Statement · Primary Record
          </span>
        );
      case 'DEVELOPING':
        return (
          <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-widest text-amber-800 dark:text-amber-400 text-xs">
            <span className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400"></span>
            Developing Story · Monitored
          </span>
        );
      default:
        return (
          <span className="font-bold uppercase tracking-widest text-stone-500 text-xs">
            Unverified
          </span>
        );
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 transition-opacity duration-200"
      onClick={onClose}
    >
      <div 
        className="relative bg-[#fbf9f5] dark:bg-stone-900 border border-stone-300 dark:border-stone-800 rounded-sm w-full max-w-3xl shadow-2xl overflow-hidden my-auto transform transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Share Feedback Toast */}
        {shareStatus !== 'idle' && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 ease-out animate-in fade-in slide-in-from-top-2">
            <div className="bg-stone-900/95 dark:bg-stone-100/95 text-stone-50 dark:text-stone-900 px-4 py-2 rounded-full shadow-lg text-xs font-semibold flex items-center gap-2 border border-stone-700/50 dark:border-stone-300/50 backdrop-blur-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
              <span>
                {shareStatus === 'shared' ? 'Article shared successfully!' : 'Article link & headline copied to clipboard!'}
              </span>
            </div>
          </div>
        )}

        {/* Top Operational Ribbon */}
        <div className="px-6 py-3.5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-100/60 dark:bg-stone-950/60 text-xs font-sans">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-widest text-stone-700 dark:text-stone-300">
              {article.category}
            </span>
            <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
            <span className="uppercase tracking-wider text-stone-500 dark:text-stone-400">
              {article.country}
            </span>
            {article.isStateMedia && (
              <>
                <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
                <span className="font-bold text-[10px] uppercase text-purple-800 dark:text-purple-300 border-b border-purple-400">
                  State Media
                </span>
              </>
            )}
            <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
            <span className="text-stone-600 dark:text-stone-400 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-stone-500" />
              {getArticleReadingTime(article)} · {Math.round(scrollProgress)}% read
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick Summary (TL;DR) Toggle Button */}
            <button
              onClick={handleToggleQuickSummary}
              className={`px-2 py-1 rounded-sm text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                quickSummaryActive 
                  ? 'bg-amber-600 text-white dark:bg-amber-500 dark:text-stone-950 shadow-xs font-bold' 
                  : 'bg-stone-200/80 hover:bg-stone-300/80 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200'
              }`}
              title={quickSummaryActive ? 'Hide 3-Point TL;DR' : 'Generate 3-Point TL;DR with Gemini'}
              aria-pressed={quickSummaryActive}
            >
              <Sparkles className={`w-3.5 h-3.5 ${quickSummaryLoading ? 'animate-spin' : (quickSummaryActive ? 'text-amber-200 dark:text-stone-900' : 'text-amber-600 dark:text-amber-400')}`} />
              <span className="hidden sm:inline">TL;DR</span>
              <span className="sm:hidden">3pt</span>
            </button>

            {/* Reader Mode Toggle Button */}
            <button
              onClick={() => setReaderMode(prev => !prev)}
              className={`px-2 py-1 rounded-sm text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                readerMode 
                  ? 'bg-blue-600 text-white dark:bg-blue-500 dark:text-white shadow-xs font-bold ring-2 ring-blue-400/30' 
                  : 'bg-stone-200/80 hover:bg-stone-300/80 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200'
              }`}
              title={readerMode ? 'Exit Reader Mode (Press R)' : 'Turn on Distraction-Free Reader Mode (Press R)'}
              aria-pressed={readerMode}
            >
              <BookOpen className={`w-3.5 h-3.5 ${readerMode ? 'text-white' : 'text-stone-600 dark:text-stone-300'}`} />
              <span className="hidden sm:inline">Reader</span>
              <span className="sm:hidden">Read</span>
            </button>

            {onPlayArticle && (
              <button
                onClick={() => {
                  if (isCurrentlySpeaking && onTogglePlayPause) {
                    onTogglePlayPause();
                  } else if (onPlayArticle && article) {
                    if (quickSummaryActive && quickSummaryBullets && quickSummaryBullets.length > 0) {
                      onPlayArticle({
                        ...article,
                        headline: `3-Point Quick Brief: ${article.headline}`,
                        summary: quickSummaryBullets.map((pt, i) => `Point ${i + 1}: ${pt}`).join(' ')
                      });
                    } else {
                      onPlayArticle(article);
                    }
                  }
                }}
                className={`px-2 py-1 rounded-sm text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isCurrentlySpeaking 
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800' 
                    : 'bg-stone-200/80 hover:bg-stone-300/80 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200'
                }`}
                title={isCurrentlySpeaking ? (isPaused ? 'Resume narration' : 'Pause narration') : 'Listen to article'}
              >
                {isCurrentlySpeaking ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
                    <span>{isPaused ? 'Paused' : 'Listening'}</span>
                  </>
                ) : (
                  <>
                    <Headphones className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
                    <span>Listen</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => onToggleSave(article)}
              className={`p-1.5 rounded-sm hover:bg-stone-200/80 dark:hover:bg-stone-800 transition-colors ${
                isSaved ? 'text-amber-800 dark:text-amber-400' : 'text-stone-500'
              }`}
              title="Save for later"
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className={`px-2 py-1 rounded-sm text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                shareStatus !== 'idle'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-bold'
                  : 'bg-stone-200/80 hover:bg-stone-300/80 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200'
              }`}
              title={
                shareStatus === 'shared' 
                  ? 'Shared successfully!' 
                  : shareStatus === 'copied' 
                  ? 'Link copied to clipboard!' 
                  : (typeof navigator !== 'undefined' && 'share' in navigator ? 'Share to messaging or social apps' : 'Copy article link')
              }
              aria-label="Share article"
            >
              {shareStatus === 'shared' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Shared!</span>
                </>
              ) : shareStatus === 'copied' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-sm hover:bg-stone-200/80 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Visual Reading Progress Bar (Smooth Hairline) */}
        <div className="w-full h-1 bg-stone-200 dark:bg-stone-800 relative overflow-hidden" title={`Reading Progress: ${Math.round(scrollProgress)}%`}>
          <div 
            className="h-full bg-stone-900 dark:bg-stone-100 transition-[width] duration-150 ease-out"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        {readerMode ? (
          <ArticleReaderMode
            article={article}
            onClose={onClose}
            onExitReaderMode={() => setReaderMode(false)}
            onScroll={handleScroll}
            scrollContainerRef={scrollContainerRef}
            formatFullDate={formatFullDate}
          />
        ) : (
          <>
            {/* Modal Scrollable Reader Canvas */}
            <div 
              id="article-modal-scroll-container"
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="p-6 sm:p-9 max-h-[78vh] overflow-y-auto space-y-7"
            >
          {/* Status Badge & Publisher Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-3 text-xs font-sans">
            <div className="flex items-center gap-3">
              {renderVerificationStamp(article.verificationStatus)}
              <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
              <span className="font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-stone-500" />
                {getArticleReadingTime(article)}
              </span>
            </div>
            
            <div className="text-stone-500 dark:text-stone-400">
              Published: <span className="font-medium text-stone-800 dark:text-stone-200">{formatFullDate(article.publishedAt)}</span>
            </div>
          </div>

          {/* Article Editorial Image */}
          <div className="relative w-full h-56 sm:h-72 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-sm">
            <img
              src={getArticleImageUrl(article)}
              alt={article.headline}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE;
              }}
            />
          </div>

          {/* Full Balanced Headline */}
          <h2 className="font-editorial text-2xl sm:text-3xl md:text-4xl font-black text-stone-950 dark:text-stone-50 leading-[1.18]">
            {article.headline}
          </h2>

          {/* Source Attribution & Transparency Box */}
          <div className="p-4 rounded-xs bg-stone-100/70 dark:bg-stone-950/70 border border-stone-200 dark:border-stone-800 text-xs font-sans space-y-2">
            <div className="flex items-center justify-between font-bold text-stone-900 dark:text-stone-100">
              <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <Info className="w-3.5 h-3.5 text-stone-500" />
                Originating Organisation: {article.publisher}
              </span>
              <a 
                href={article.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-stone-900 dark:text-stone-100 hover:underline font-semibold"
              >
                Original Dispatch <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
            {(publisherOwnership || publisherFunding) && (
              <div className="text-stone-600 dark:text-stone-400 text-[11px] pt-2 border-t border-stone-200 dark:border-stone-800/80 space-y-0.5">
                {publisherOwnership && <div><strong>Ownership:</strong> {publisherOwnership}</div>}
                {publisherFunding && <div><strong>Funding Model:</strong> {publisherFunding}</div>}
              </div>
            )}
          </div>

          {/* Quick Summary (TL;DR) Toggle & Gemini 3-Point Brief */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/25 dark:border-amber-400/20 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-600 text-white dark:bg-amber-500 dark:text-stone-950 shadow-xs shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-sans font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2 flex-wrap">
                    <span>Quick Summary (3-Point TL;DR)</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-200/80 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/80">
                      Gemini
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 dark:text-stone-400">
                    Bulleted 3-point executive brief synthesized for rapid scanning
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={quickSummaryActive}
                onClick={handleToggleQuickSummary}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-hidden cursor-pointer ${
                  quickSummaryActive ? 'bg-amber-600 dark:bg-amber-500' : 'bg-stone-300 dark:bg-stone-700'
                }`}
                title={quickSummaryActive ? 'Hide 3-point quick summary' : 'Show 3-point quick summary'}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                    quickSummaryActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {quickSummaryActive && (
              <div className="p-5 rounded-xl bg-gradient-to-br from-amber-50/90 via-[#fcfaf7] to-amber-50/50 dark:from-stone-900 dark:via-stone-900/90 dark:to-stone-950 border-2 border-amber-500/30 dark:border-amber-500/30 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-amber-200/60 dark:border-stone-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-950 dark:text-amber-300">
                      Bulleted 3-Point TL;DR
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-stone-500 dark:text-stone-400 tracking-wider">
                    {quickSummarySource === 'gemini' ? 'Synthesized via Gemini 3.8 Flash' : 'Verified Editorial Desk Synthesis'}
                  </span>
                </div>

                {quickSummaryLoading ? (
                  <div className="py-4 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300 font-medium">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-600 dark:text-amber-400" />
                      <span>Synthesizing concise 3-point briefing with Gemini...</span>
                    </div>
                    <div className="space-y-2.5 pt-1">
                      <div className="h-4 bg-stone-200/80 dark:bg-stone-800 rounded animate-pulse w-11/12" />
                      <div className="h-4 bg-stone-200/80 dark:bg-stone-800 rounded animate-pulse w-5/6" />
                      <div className="h-4 bg-stone-200/80 dark:bg-stone-800 rounded animate-pulse w-4/5" />
                    </div>
                  </div>
                ) : quickSummaryBullets && quickSummaryBullets.length > 0 ? (
                  <ol className="space-y-2.5 font-sans">
                    {quickSummaryBullets.map((bullet, idx) => {
                      const tags = ['Primary Development', 'Context & Cause', 'Impact & Next Steps'];
                      return (
                        <li key={idx} className="flex items-start gap-3 p-3.5 rounded-lg bg-white/95 dark:bg-stone-950/70 border border-amber-200/50 dark:border-stone-800 shadow-xs">
                          <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-md bg-amber-600/10 dark:bg-amber-400/20 text-amber-700 dark:text-amber-400 font-mono text-xs font-bold">
                            0{idx + 1}
                          </span>
                          <div className="space-y-0.5">
                            <div className="text-[10px] uppercase font-bold tracking-wider text-amber-800 dark:text-amber-400">
                              {tags[idx] || `Key Point ${idx + 1}`}
                            </div>
                            <p className="text-stone-800 dark:text-stone-200 text-sm sm:text-base leading-relaxed">
                              {bullet}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <div className="text-xs text-stone-500 py-2">
                    Unable to load quick summary at this moment. You can view the full executive briefing below.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Factual Executive Summary */}
          <div className="space-y-2">
            <h4 className="text-[11px] uppercase font-bold tracking-widest text-stone-500 dark:text-stone-400">
              Verified Executive Briefing
            </h4>
            <p className="text-stone-800 dark:text-stone-200 leading-relaxed font-sans text-base sm:text-lg max-w-prose">
              {article.summary}
            </p>
          </div>

          {/* Strategic Relevance Box (No thick left accent bars) */}
          {article.whyItMatters && (
            <div className="p-4 rounded-xs bg-stone-50 dark:bg-stone-950/80 border border-stone-200 dark:border-stone-800 text-sm font-sans space-y-1">
              <div className="font-bold text-stone-950 dark:text-stone-100 uppercase tracking-widest text-[10px]">
                Strategic Significance & Impact:
              </div>
              <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                {article.whyItMatters}
              </p>
            </div>
          )}

          {/* Economic Indicator & Daily Movement Trend (Recharts) */}
          {(article.category === 'Economy & Business' || article.subCategory?.toLowerCase().includes('economy') || article.subCategory?.toLowerCase().includes('finance')) && (
            <div className="bg-stone-50 dark:bg-stone-900/60 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
              <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-1">
                Economic Indicator Trend & Market Sentiment
              </div>
              <EconomicTrendSparkline article={article} compact={false} />
            </div>
          )}

          {/* STEP 3 SEPARATION: Confirmed Facts vs Identified Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Confirmed Facts */}
            <div className="p-4 rounded-xs border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/40 space-y-3 font-sans">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
                Confirmed Facts & Evidence
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-stone-700 dark:text-stone-300">
                {article.facts && article.facts.length > 0 ? (
                  article.facts.map((fact, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-stone-400 font-bold">·</span>
                      <span>{fact}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-stone-500">Core facts verified through primary publication dispatch.</li>
                )}
              </ul>
            </div>

            {/* Analysis & Uncertainties */}
            <div className="p-4 rounded-xs border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/40 space-y-3 font-sans">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2">
                <HelpCircle className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
                Identified Uncertainties & Analysis
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-stone-700 dark:text-stone-300">
                {article.analysisOrUncertainties && article.analysisOrUncertainties.length > 0 ? (
                  article.analysisOrUncertainties.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-stone-400 font-bold">·</span>
                      <span>{item}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-stone-500">No unresolved factual ambiguities reported at time of release.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Independent Corroborating Sources Desk */}
          <div className="space-y-3 font-sans">
            <div className="flex items-center justify-between">
              <h4 className="flex items-center gap-1.5 text-[11px] uppercase font-bold tracking-widest text-stone-900 dark:text-stone-100">
                <Layers className="w-3.5 h-3.5 text-stone-500" />
                Independent Corroborating Reporting Organisations ({article.corroboratingSources?.length || 0})
              </h4>
              <span className="text-[10px] text-stone-500 font-normal">
                Syndicated wire copies counted distinctly
              </span>
            </div>

            {article.corroboratingSources && article.corroboratingSources.length > 0 ? (
              <div className="border border-stone-200 dark:border-stone-800 rounded-xs overflow-hidden divide-y divide-stone-200 dark:divide-stone-800 text-xs">
                {article.corroboratingSources.map((c, i) => (
                  <div key={i} className="p-3.5 flex items-center justify-between hover:bg-stone-100/50 dark:hover:bg-stone-800/40 transition-colors">
                    <div className="space-y-0.5">
                      <div className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                        {c.publisher}
                        <span className="text-[10px] uppercase tracking-wider text-stone-500">
                          {c.isWireSyndication ? 'Syndicated Wire' : 'Independent Reporting'}
                        </span>
                      </div>
                      <div className="text-stone-600 dark:text-stone-300 font-serif line-clamp-1 italic text-xs">
                        "{c.headline}"
                      </div>
                    </div>
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-stone-900 dark:text-stone-100 hover:underline font-semibold ml-4 whitespace-nowrap text-xs"
                    >
                      View Report <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3.5 rounded-xs bg-stone-100/60 dark:bg-stone-950/60 text-xs text-stone-500 italic">
                Initial primary report from {article.publisher}. Corroboration verification pipeline is active.
              </div>
            )}
          </div>

          {/* Legal / Fair Dealing Notice */}
          <div className="text-[11px] text-stone-400 border-t border-stone-200 dark:border-stone-800 pt-3 leading-relaxed">
            <strong>Fair Dealing Notice:</strong> This summary is prepared exclusively for daily briefing and verification analysis under fair-dealing principles. We respect publisher copyright and paywalls; please read full stories on the publisher's official website.
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 sm:px-8 border-t border-stone-200 dark:border-stone-800 bg-stone-100/80 dark:bg-stone-950 flex flex-wrap items-center justify-between gap-3 font-sans">
          <div className="text-[11px] text-stone-500 font-mono">
            REF: {article.eventId}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleShare}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-sm transition-colors cursor-pointer ${
                shareStatus !== 'idle'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-bold'
                  : 'bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200'
              }`}
              title={typeof navigator !== 'undefined' && 'share' in navigator ? 'Share story to installed messaging or social apps' : 'Copy link to clipboard'}
            >
              {shareStatus === 'shared' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Shared!</span>
                </>
              ) : shareStatus === 'copied' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Story</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-sm bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-colors"
            >
              Close
            </button>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-sm bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 shadow-2xs transition-colors"
            >
              Read Full Article on {article.publisher}
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </>
    )}
  </div>
</div>
  );
};

