import React, { useState } from 'react';
import { ShieldCheck, Building2, AlertCircle, Bookmark, Share2, ExternalLink, ChevronRight, Layers, Clock, Camera } from 'lucide-react';
import { Article, VerificationStatus } from '../types.js';
import { getReadingTime, getArticleReadingTime } from '../utils/readingTime.js';
import { getArticleImageUrl, DEFAULT_FALLBACK_IMAGE, isVerifiedArticleImage } from '../utils/newsImages.js';
import { EconomicTrendSparkline } from './EconomicTrendSparkline.js';

interface ArticleCardProps {
  article: Article;
  onOpenDetail: (article: Article) => void;
  isSaved: boolean;
  onToggleSave: (article: Article) => void;
  fontSize: 'sm' | 'md' | 'lg';
  layout?: 'horizontal' | 'vertical';
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  onOpenDetail,
  isSaved,
  onToggleSave,
  fontSize,
  layout = 'horizontal'
}) => {
  const [imgSrc, setImgSrc] = useState<string>(() => getArticleImageUrl(article));
  const [imgLoaded, setImgLoaded] = useState(false);
  const hasVerifiedPhoto = isVerifiedArticleImage(article);

  const isEconomyArticle = 
    article.category === 'Economy & Business' || 
    article.subCategory?.toLowerCase().includes('economy') || 
    article.subCategory?.toLowerCase().includes('finance') || 
    article.subCategory?.toLowerCase().includes('business') ||
    article.subCategory?.toLowerCase().includes('central bank');

  // Status indicator
  const renderVerificationIndicator = (status: VerificationStatus) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 font-semibold text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400 shrink-0">
            <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Verified
          </span>
        );
      case 'OFFICIAL STATEMENT':
        return (
          <span className="inline-flex items-center gap-1 font-semibold text-[10px] uppercase tracking-wider text-blue-700 dark:text-blue-400 shrink-0">
            <Building2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            Official
          </span>
        );
      case 'DEVELOPING':
        return (
          <span className="inline-flex items-center gap-1 font-semibold text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Developing
          </span>
        );
      default:
        return (
          <span className="font-semibold text-[10px] uppercase tracking-wider text-slate-500 shrink-0">
            Unverified
          </span>
        );
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Technology & AI':
        return 'text-indigo-600 dark:text-indigo-400';
      case 'Economy & Business':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'Courts & Legal':
        return 'text-rose-600 dark:text-rose-400';
      case 'Science & Environment':
        return 'text-sky-600 dark:text-sky-400';
      case 'Defence & Security':
        return 'text-amber-600 dark:text-amber-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  const formatTimeAgo = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return 'Just now';
      if (diffHours === 1) return '1h ago';
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Today';
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareData = {
      title: article.headline,
      text: `${article.headline} — Verified news briefing on THE WORLD DAILY`,
      url: article.url
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(`${article.headline}\n${article.url}`);
    }
  };

  const headlineClass = fontSize === 'lg' 
    ? 'text-lg sm:text-xl font-bold leading-snug' 
    : fontSize === 'md' 
    ? 'text-[16px] sm:text-[17px] font-bold leading-snug' 
    : 'text-[15px] sm:text-[16px] font-bold leading-snug';

  const summaryClass = fontSize === 'lg' 
    ? 'text-sm sm:text-base leading-relaxed' 
    : fontSize === 'md' 
    ? 'text-xs sm:text-[13px] leading-relaxed' 
    : 'text-xs leading-normal';

  // HORIZONTAL LAYOUT
  if (layout === 'horizontal') {
    return (
      <article
        onClick={() => onOpenDetail(article)}
        className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 rounded-2xl p-4 transition-all duration-200 hover:shadow-md flex flex-col sm:flex-row gap-4 items-stretch justify-between overflow-hidden min-w-0"
      >
        {/* Left Image Thumbnail */}
        <div className="relative w-full sm:w-44 md:w-48 h-36 sm:h-auto min-h-[7.5rem] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
          <img
            src={imgSrc}
            alt={article.headline}
            loading="lazy"
            onError={() => setImgSrc(DEFAULT_FALLBACK_IMAGE)}
            onLoad={() => setImgLoaded(true)}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
              imgLoaded ? 'opacity-100' : 'opacity-70'
            }`}
          />
          {article.isStateMedia && (
            <span className="absolute top-2 left-2 bg-purple-900/90 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md backdrop-blur-xs">
              State Media
            </span>
          )}
          {hasVerifiedPhoto && (
            <span className="absolute top-2 right-2 bg-emerald-900/90 text-white text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1 shadow-xs">
              <Camera className="w-2.5 h-2.5 text-emerald-400" />
              Verified Photo
            </span>
          )}
        </div>

        {/* Right Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2 overflow-hidden">
          <div className="min-w-0">
            {/* Category dot + Publisher metadata */}
            <div className="flex items-center justify-between gap-2 text-[11px] font-medium mb-1 min-w-0 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <span className={`inline-flex items-center gap-1 font-semibold truncate ${getCategoryColor(article.category)}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0"></span>
                  {article.category}
                </span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[150px]">
                  {article.publisher}
                </span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span className="text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                  {article.country === 'India' ? (article.stateOrRegion ? `India (${article.stateOrRegion})` : 'India') : article.country}
                </span>
              </div>

              <div className="shrink-0">
                {renderVerificationIndicator(article.verificationStatus)}
              </div>
            </div>

            {/* Headline */}
            <h3 className={`font-sans font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 break-words ${headlineClass}`}>
              {article.headline}
            </h3>

            {/* Summary Snippet */}
            <p className={`text-slate-600 dark:text-slate-300 line-clamp-2 mt-1.5 font-sans break-words ${summaryClass}`}>
              {article.summary}
            </p>

            {/* Recharts Economic Trend Line & Sentiment */}
            {isEconomyArticle && (
              <EconomicTrendSparkline article={article} compact={false} />
            )}
          </div>

          {/* Bottom Meta Bar */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80 min-w-0 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-wrap">
              <span className="flex items-center gap-1 shrink-0">
                <Clock className="w-3 h-3 text-slate-400" />
                {formatTimeAgo(article.publishedAt)}
              </span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="inline-flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300 shrink-0">
                <Clock className="w-3 h-3 text-slate-400" />
                {getArticleReadingTime(article)}
              </span>
              {article.corroboratingSources && article.corroboratingSources.length > 0 && (
                <>
                  <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">·</span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium truncate">
                    <Layers className="w-3 h-3 shrink-0" />
                    +{article.corroboratingSources.length} sources
                  </span>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                title="View original publisher report"
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={handleShare}
                title="Share article"
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onToggleSave(article)}
                title={isSaved ? "Saved" : "Save for Later"}
                className={`p-1 rounded-md transition-colors ${
                  isSaved ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
              </button>

              <button
                onClick={() => onOpenDetail(article)}
                className="ml-1 inline-flex items-center gap-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 pl-1 shrink-0"
              >
                Full Story
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // VERTICAL LAYOUT
  return (
    <article
      onClick={() => onOpenDetail(article)}
      className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md flex flex-col justify-between min-w-0"
    >
      <div className="min-w-0">
        {/* Top Image */}
        <div className="relative w-full h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <img
            src={imgSrc}
            alt={article.headline}
            loading="lazy"
            onError={() => setImgSrc(DEFAULT_FALLBACK_IMAGE)}
            onLoad={() => setImgLoaded(true)}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
              imgLoaded ? 'opacity-100' : 'opacity-70'
            }`}
          />
          {article.isStateMedia && (
            <span className="absolute top-2 left-2 bg-purple-900/90 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md backdrop-blur-xs">
              State Media
            </span>
          )}
          {hasVerifiedPhoto && (
            <span className="absolute top-2 left-2 bg-emerald-900/90 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1 shadow-xs">
              <Camera className="w-3 h-3 text-emerald-400" />
              Verified Photo
            </span>
          )}
          <div className="absolute top-2 right-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-2 py-0.5 rounded-md shadow-2xs">
            {renderVerificationIndicator(article.verificationStatus)}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-2 min-w-0">
          {/* Category Dot */}
          <div className="flex items-center justify-between text-[11px] font-medium min-w-0 gap-2">
            <span className={`inline-flex items-center gap-1.5 font-semibold truncate ${getCategoryColor(article.category)}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0"></span>
              {article.category}
            </span>
            <span className="text-slate-500 dark:text-slate-400 truncate max-w-[130px]">
              {article.publisher}
            </span>
          </div>

          {/* Headline */}
          <h4 className={`font-sans font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 break-words ${headlineClass}`}>
            {article.headline}
          </h4>

          {/* Summary */}
          <p className={`text-slate-600 dark:text-slate-300 line-clamp-2 break-words ${summaryClass}`}>
            {article.summary}
          </p>

          {/* Recharts Economic Trend Line & Sentiment */}
          {isEconomyArticle && (
            <EconomicTrendSparkline article={article} compact={true} />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 min-w-0 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="shrink-0">{formatTimeAgo(article.publishedAt)}</span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="inline-flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300 truncate">
            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
            {getArticleReadingTime(article)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onToggleSave(article)}
            title={isSaved ? "Saved" : "Save for Later"}
            className={`p-1 rounded-md transition-colors ${
              isSaved ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </article>
  );
};