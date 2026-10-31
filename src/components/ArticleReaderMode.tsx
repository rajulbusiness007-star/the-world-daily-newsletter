import React, { useState } from 'react';
import { 
  BookOpen, Clock, ArrowUpRight, Minimize2, Sun, Moon, Coffee, 
  X, CheckCircle2, Bookmark, Share2
} from 'lucide-react';
import { Article } from '../types.js';
import { getArticleReadingTime } from '../utils/readingTime.js';

interface ArticleReaderModeProps {
  article: Article;
  onClose: () => void;
  onExitReaderMode: () => void;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  formatFullDate: (iso: string) => string;
}

export const ArticleReaderMode: React.FC<ArticleReaderModeProps> = ({
  article,
  onClose,
  onExitReaderMode,
  onScroll,
  scrollContainerRef,
  formatFullDate,
}) => {
  const [readerFont, setReaderFont] = useState<'serif' | 'sans'>('serif');
  const [readerSize, setReaderSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [readerTheme, setReaderTheme] = useState<'sepia' | 'day' | 'night'>('sepia');

  // Background and text color styles for themes
  const themeClasses = 
    readerTheme === 'sepia'
      ? 'bg-[#fbf7ee] text-[#2c241b] dark:bg-[#181613] dark:text-[#ede3d4]'
      : readerTheme === 'night'
      ? 'bg-[#0b101b] text-slate-200'
      : 'bg-white text-stone-900 dark:bg-slate-900 dark:text-slate-100';

  const toolbarBorderClass =
    readerTheme === 'sepia'
      ? 'bg-[#fbf7ee]/95 border-[#ede4d4] dark:bg-[#181613]/95 dark:border-[#2a241e]'
      : readerTheme === 'night'
      ? 'bg-[#0b101b]/95 border-slate-800'
      : 'bg-white/95 border-stone-200 dark:bg-slate-900/95 dark:border-slate-800';

  const dividerClass =
    readerTheme === 'sepia'
      ? 'border-[#e8dfcf] dark:border-[#2b2520]'
      : readerTheme === 'night'
      ? 'border-slate-800'
      : 'border-stone-200 dark:border-slate-800';

  return (
    <div
      id="article-modal-scroll-container"
      ref={scrollContainerRef}
      onScroll={onScroll}
      className={`max-h-[82vh] overflow-y-auto transition-colors duration-200 ${themeClasses}`}
    >
      {/* ========================================================================= */}
      {/* 1. STICKY READER TOOLBAR (Custom typography & theme controls)             */}
      {/* ========================================================================= */}
      <div className={`sticky top-0 z-20 backdrop-blur-md px-4 sm:px-8 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs transition-colors ${toolbarBorderClass}`}>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Reader Mode</span>
          </span>

          {/* Font switcher (Serif vs Sans) */}
          <div className="flex items-center bg-black/5 dark:bg-white/10 p-0.5 rounded-lg text-[11px]">
            <button
              onClick={() => setReaderFont('serif')}
              className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                readerFont === 'serif' ? 'bg-white dark:bg-slate-700 font-bold shadow-xs' : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              Serif
            </button>
            <button
              onClick={() => setReaderFont('sans')}
              className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                readerFont === 'sans' ? 'bg-white dark:bg-slate-700 font-bold shadow-xs' : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              Sans
            </button>
          </div>

          {/* Font size scaling */}
          <div className="flex items-center bg-black/5 dark:bg-white/10 p-0.5 rounded-lg text-[11px] font-semibold">
            {(['sm', 'md', 'lg'] as const).map(sz => (
              <button
                key={sz}
                onClick={() => setReaderSize(sz)}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  readerSize === sz ? 'bg-white dark:bg-slate-700 font-bold shadow-xs' : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                {sz === 'sm' ? 'A−' : sz === 'md' ? 'A' : 'A+'}
              </button>
            ))}
          </div>
        </div>

        {/* Theme Palette Controls & Exit */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-black/5 dark:bg-white/10 p-0.5 rounded-lg text-[11px]">
            <button
              onClick={() => setReaderTheme('sepia')}
              className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                readerTheme === 'sepia' ? 'bg-[#f4ebd9] dark:bg-[#2c2621] font-bold shadow-xs text-amber-950 dark:text-amber-200' : 'text-stone-600 dark:text-stone-400'
              }`}
              title="Warm Paper (Sepia)"
            >
              <Coffee className="w-3 h-3 text-amber-700 dark:text-amber-400" />
              <span className="hidden sm:inline">Sepia</span>
            </button>

            <button
              onClick={() => setReaderTheme('day')}
              className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                readerTheme === 'day' ? 'bg-white dark:bg-slate-700 font-bold shadow-xs text-slate-900 dark:text-white' : 'text-stone-600 dark:text-stone-400'
              }`}
              title="Daylight White"
            >
              <Sun className="w-3 h-3 text-amber-500" />
              <span className="hidden sm:inline">Day</span>
            </button>

            <button
              onClick={() => setReaderTheme('night')}
              className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                readerTheme === 'night' ? 'bg-slate-800 text-white font-bold shadow-xs' : 'text-stone-600 dark:text-stone-400'
              }`}
              title="Night Dark"
            >
              <Moon className="w-3 h-3 text-blue-400" />
              <span className="hidden sm:inline">Night</span>
            </button>
          </div>

          <button
            onClick={onExitReaderMode}
            className="px-2.5 py-1 rounded-md text-xs font-semibold bg-stone-200/80 hover:bg-stone-300 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center gap-1 transition-colors cursor-pointer"
            title="Exit Reader Mode (Press R)"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-stone-500 dark:text-stone-400 transition-colors"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CENTERED TYPOGRAPHY-FOCUSED READING CANVAS                             */}
      {/* ========================================================================= */}
      <article className={`max-w-2xl mx-auto px-6 sm:px-12 py-10 sm:py-16 space-y-8 ${
        readerFont === 'serif' ? 'font-serif' : 'font-sans'
      }`}>
        {/* Minimalist Dateline */}
        <div className={`flex flex-wrap items-center gap-2 text-xs font-sans tracking-wide border-b pb-4 ${dividerClass} text-stone-500 dark:text-stone-400`}>
          <span className="font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
            {article.publisher}
          </span>
          <span>·</span>
          <span>{formatFullDate(article.publishedAt)}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {getArticleReadingTime(article)}
          </span>
          <span>·</span>
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
            {article.verificationStatus}
          </span>
        </div>

        {/* Centered Editorial Headline */}
        <h1 className={`font-bold tracking-tight text-stone-900 dark:text-white leading-[1.25] ${
          readerSize === 'sm' 
            ? 'text-2xl sm:text-3xl' 
            : readerSize === 'lg' 
            ? 'text-3xl sm:text-5xl' 
            : 'text-2xl sm:text-4xl'
        }`}>
          {article.headline}
        </h1>

        {/* Main Narrative Body */}
        <div className={`space-y-6 max-w-prose ${
          readerSize === 'sm'
            ? 'text-base leading-relaxed'
            : readerSize === 'lg'
            ? 'text-xl sm:text-2xl leading-loose'
            : 'text-lg sm:text-xl leading-relaxed sm:leading-loose'
        }`}>
          {/* First Paragraph with Drop Cap */}
          <p className="first-letter:text-5xl first-letter:font-bold first-letter:float-left first-letter:mr-3.5 first-letter:leading-none text-stone-900 dark:text-stone-100">
            {article.summary}
          </p>

          {/* Strategic Pull Quote */}
          {article.whyItMatters && (
            <blockquote className="my-8 pl-5 border-l-2 border-stone-400 dark:border-stone-600 italic text-stone-700 dark:text-stone-300 not-first-letter">
              "{article.whyItMatters}"
            </blockquote>
          )}

          {/* Verified Facts Pullout */}
          {article.facts && article.facts.length > 0 && (
            <div className={`pt-8 border-t space-y-4 not-italic ${dividerClass}`}>
              <h3 className="text-xs font-mono uppercase tracking-widest text-stone-500 dark:text-stone-400 font-sans">
                Verified Core Facts & Evidence
              </h3>
              <ul className="space-y-3 font-sans text-base sm:text-lg">
                {article.facts.map((fact, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-stone-400 font-bold leading-none mt-1.5">•</span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Minimal Reader Mode Footer */}
        <div className={`pt-10 border-t flex flex-wrap items-center justify-between gap-4 font-sans text-xs ${dividerClass}`}>
          <button
            onClick={onExitReaderMode}
            className="px-4 py-2 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 font-semibold transition-colors cursor-pointer"
          >
            ← Exit Reader Mode
          </button>

          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold hover:opacity-90 transition-opacity"
          >
            Read Original on {article.publisher}
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </article>
    </div>
  );
};
