import React, { useState, useEffect } from 'react';

interface ReadingProgressBarProps {
  /** If reading an article in modal, progress percentage (0-100) */
  articleProgress: number | null;
  /** Whether the user is currently reading an article modal */
  isReadingArticle: boolean;
  /** Headline of the active article if reading */
  articleHeadline?: string;
  /** Active category or page view context */
  currentContext?: string;
}

export const ReadingProgressBar: React.FC<ReadingProgressBarProps> = ({
  articleProgress,
  isReadingArticle,
  articleHeadline,
  currentContext
}) => {
  const [feedProgress, setFeedProgress] = useState<number>(0);
  const [isScrolling, setIsScrolling] = useState<boolean>(false);

  // Track window scroll when not reading an article modal
  useEffect(() => {
    if (isReadingArticle) return;

    let timeoutId: number | null = null;

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const totalScrollable = scrollHeight - clientHeight;

      if (totalScrollable > 0) {
        const pct = Math.min(100, Math.max(0, (scrollTop / totalScrollable) * 100));
        setFeedProgress(pct);
      } else {
        setFeedProgress(0);
      }

      setIsScrolling(true);
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        setIsScrolling(false);
      }, 1200);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [isReadingArticle]);

  const activeProgress = isReadingArticle
    ? (articleProgress !== null ? articleProgress : 0)
    : feedProgress;

  // Do not render anything distracting if at very top and not scrolling
  const isVisible = activeProgress > 0.5;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] pointer-events-none transition-opacity duration-300"
      style={{ opacity: isVisible ? 1 : 0 }}
      aria-hidden="true"
    >
      {/* Background track line */}
      <div className="w-full h-[2.5px] bg-slate-200/40 dark:bg-slate-800/40 backdrop-blur-xs">
        {/* Subtle, glowing gradient progress bar */}
        <div
          className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 dark:from-blue-400 dark:via-indigo-400 dark:to-amber-400 shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-[width] duration-150 ease-out rounded-r-full relative"
          style={{ width: `${Math.min(100, activeProgress)}%` }}
        >
          {/* Leading glow point */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-400 dark:bg-amber-300 shadow-[0_0_6px_rgba(251,191,36,0.9)] opacity-90 -mr-0.5" />
        </div>
      </div>

      {/* Subtle floating badge indicating reading context & percent while scrolling */}
      <div
        className={`fixed top-3.5 right-4 pointer-events-none transition-all duration-300 transform ${
          isScrolling || (isReadingArticle && activeProgress > 5 && activeProgress < 98)
            ? 'opacity-90 translate-y-0 scale-100'
            : 'opacity-0 -translate-y-1 scale-95 pointer-events-none'
        }`}
      >
        <div className="bg-slate-900/85 dark:bg-slate-800/90 text-white text-[10px] font-sans font-medium px-2.5 py-1 rounded-full shadow-md backdrop-blur-md border border-slate-700/50 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span>
            {isReadingArticle ? 'Article' : (currentContext || 'Feed')}:
          </span>
          <span className="font-mono font-bold text-blue-300">
            {Math.round(activeProgress)}%
          </span>
        </div>
      </div>
    </div>
  );
};
