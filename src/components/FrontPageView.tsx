import React, { useState } from 'react';
import { Article, VerificationStatus } from '../types.js';
import { ArticleCard } from './ArticleCard.js';
import { 
  Sparkles, TrendingUp, Cpu, Globe2, Landmark, Clock, ArrowRight, 
  ShieldCheck, Scale, Compass, CheckCircle2, ChevronLeft, ChevronRight,
  Flame, Mail, Send, Eye, Check, ExternalLink, Camera
} from 'lucide-react';
import { getReadingTime, getArticleReadingTime } from '../utils/readingTime.js';
import { getArticleImageUrl, DEFAULT_FALLBACK_IMAGE, isVerifiedArticleImage } from '../utils/newsImages.js';
import { FrontpageMarketPulse } from './FrontpageMarketPulse.js';

interface FrontPageViewProps {
  articles: Article[];
  onOpenDetail: (article: Article) => void;
  savedArticles: Article[];
  onToggleSave: (article: Article) => void;
  fontSize: 'sm' | 'md' | 'lg';
  activeCategory: string;
}

export const FrontPageView: React.FC<FrontPageViewProps> = ({
  articles,
  onOpenDetail,
  savedArticles,
  onToggleSave,
  fontSize,
  activeCategory
}) => {
  const [statusFilter, setStatusFilter] = useState<'All' | VerificationStatus>('All');
  const [heroIndex, setHeroIndex] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [activeQuickCategory, setActiveQuickCategory] = useState<string>('All');

  // Filter articles
  const filteredArticles = articles.filter(a => {
    const matchesStatus = statusFilter === 'All' || a.verificationStatus === statusFilter;
    const matchesQuick = activeQuickCategory === 'All' || a.category.toLowerCase().includes(activeQuickCategory.toLowerCase());
    return matchesStatus && matchesQuick;
  });

  const indiaArticles = filteredArticles.filter(a => a.country === 'India');
  const worldArticles = filteredArticles.filter(a => a.country !== 'India');

  // Top candidate stories for the Hero Slider
  const heroCandidates = filteredArticles.slice(0, 5);
  const currentHeroArticle = heroCandidates[heroIndex % (heroCandidates.length || 1)] || articles[0];

  const handleNextHero = () => {
    if (heroCandidates.length > 0) {
      setHeroIndex((prev) => (prev + 1) % heroCandidates.length);
    }
  };

  const handlePrevHero = () => {
    if (heroCandidates.length > 0) {
      setHeroIndex((prev) => (prev - 1 + heroCandidates.length) % heroCandidates.length);
    }
  };

  // Remaining articles for sections
  const heroIds = new Set(heroCandidates.map(a => a.id));
  const latestNewsArticles = filteredArticles.filter(a => a.id !== currentHeroArticle?.id).slice(0, 6);
  const featuredArticles = filteredArticles.filter(a => !heroIds.has(a.id) && !latestNewsArticles.some(l => l.id === a.id)).slice(0, 3);
  const mostViewedArticles = articles.slice(0, 5);

  const isSaved = (art: Article) => savedArticles.some(s => s.id === art.id);

  // Quick navigation categories matching the 6 tiles in the template screenshot
  const QUICK_CATEGORIES = [
    { id: 'All', label: 'All Briefings', icon: Globe2, bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/40' },
    { id: 'Economy', label: 'Business', icon: TrendingUp, bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40' },
    { id: 'Technology', label: 'AI & Tech', icon: Cpu, bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/40' },
    { id: 'Courts', label: 'Courts & Law', icon: Scale, bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/40' },
    { id: 'Science', label: 'Science & Space', icon: Sparkles, bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40' },
    { id: 'Fact', label: 'Fact Checks', icon: ShieldCheck, bg: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-900/40' },
  ];

  // Simulated curated trending items with corroborated metrics
  const TRENDING_TOPICS = [
    { rank: 1, title: 'Supreme Court Quota Empirical Review', reads: '245K reads', category: 'Courts & Legal' },
    { rank: 2, title: 'RBI Monetary Policy & 4% Inflation Anchor', reads: '198K reads', category: 'Economy & Business' },
    { rank: 3, title: 'Semiconductor Hubs in Gujarat & Assam', reads: '176K reads', category: 'Technology & AI' },
    { rank: 4, title: 'ISRO Shukrayaan Venus Mission 2028', reads: '142K reads', category: 'Science & Environment' },
    { rank: 5, title: 'Frontier AI Governance & Global Standards', reads: '128K reads', category: 'Technology & AI' },
  ];

  // Most viewed view counts for the sidebar/bottom section
  const VIEW_COUNTS = ['1.2M views', '890K views', '873K views', '640K views', '521K views'];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail && newsletterEmail.includes('@')) {
      setNewsletterSubscribed(true);
      setTimeout(() => {
        setNewsletterEmail('');
      }, 3000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16 overflow-hidden">
      {/* Verification Desk Filter Strip */}
      <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs min-w-0">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5 shrink-0">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            Verification Desk:
          </span>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl flex-wrap">
            {(['All', 'VERIFIED', 'OFFICIAL STATEMENT', 'DEVELOPING'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-lg font-medium text-xs transition-all ${
                  statusFilter === status
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {status === 'OFFICIAL STATEMENT' ? 'Official' : status === 'All' ? 'All Verified' : status}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-xs flex-wrap">
          <span><strong>{filteredArticles.length}</strong> reports in edition</span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            {indiaArticles.length} India ({(articles.length > 0 ? (indiaArticles.length / articles.length * 100).toFixed(0) : 60)}%)
          </span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span>{worldArticles.length} World</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. HERO TOP STORY CARD WITH SPLIT LAYOUT & RIGHT CAROUSEL CONTROLS       */}
      {/* ========================================================================= */}
      {currentHeroArticle && (
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 lg:p-9 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all min-w-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-w-0">
            {/* Left Content Column (7 cols) */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-5 min-w-0">
              <div className="space-y-4 min-w-0">
                {/* Top Story Badge */}
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/50 shrink-0">
                    <Flame className="w-3.5 h-3.5 fill-current text-amber-500" />
                    Top Story
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                    {currentHeroArticle.publisher} · {currentHeroArticle.location || 'New Delhi, India'}
                  </span>
                  {isVerifiedArticleImage(currentHeroArticle) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                      <Camera className="w-3 h-3 text-emerald-500" />
                      Verified Photo
                    </span>
                  )}
                </div>

                {/* Main Hero Headline */}
                <h1 
                  onClick={() => onOpenDetail(currentHeroArticle)}
                  className="font-sans font-extrabold text-2xl sm:text-3xl md:text-4xl text-slate-900 dark:text-white leading-[1.2] tracking-tight hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer break-words"
                >
                  {currentHeroArticle.headline}
                </h1>

                {/* Hero Summary */}
                <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed line-clamp-3 break-words">
                  {currentHeroArticle.summary}
                </p>

                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1 min-w-0">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-blue-600 dark:text-blue-400 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    {currentHeroArticle.country === 'India' ? 'India' : currentHeroArticle.country}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <span className="flex items-center gap-1 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    2h ago
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {getArticleReadingTime(currentHeroArticle)}
                  </span>
                  {currentHeroArticle.corroboratingSources && currentHeroArticle.corroboratingSources.length > 0 && (
                    <>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium truncate">
                        +{currentHeroArticle.corroboratingSources.length} verified confirmations
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div>
                <button
                  onClick={() => onOpenDetail(currentHeroArticle)}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer text-sm shrink-0"
                >
                  Read Full Story
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Image Column (5 cols) with Floating Carousel Controls */}
            <div className="lg:col-span-5 relative group min-w-0">
              <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-md">
                <img
                  src={getArticleImageUrl(currentHeroArticle)}
                  alt={currentHeroArticle.headline}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
                
                {/* Floating Bottom-Right Carousel Nav Controls */}
                <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full shadow-md px-2.5 py-1.5 flex items-center gap-1.5 border border-slate-200/50 dark:border-slate-700">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevHero();
                    }}
                    title="Previous Story"
                    className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 px-1">
                    {(heroIndex % heroCandidates.length) + 1} / {heroCandidates.length}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextHero();
                    }}
                    title="Next Story"
                    className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 2. SIX CATEGORY QUICK-NAV TILES                                           */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {QUICK_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = activeQuickCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveQuickCategory(cat.id)}
              className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center gap-2.5 transition-all text-center cursor-pointer hover:shadow-md ${
                isSelected 
                  ? 'border-blue-500 shadow-sm ring-2 ring-blue-500/20' 
                  : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${cat.bg}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-200 truncate max-w-full">
                {cat.label}
              </span>
            </button>
          );
        })}
      </section>

      {/* ========================================================================= */}
      {/* 2b. INTERACTIVE RECHARTS ECONOMIC INDICATORS & MARKET MOVEMENT WIDGET     */}
      {/* ========================================================================= */}
      <FrontpageMarketPulse />

      {/* ========================================================================= */}
      {/* 3. LATEST NEWS (2-COLUMN SPLIT: LEFT 65% / RIGHT 35%)                     */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start min-w-0">
        {/* LEFT COLUMN: Latest News List (~65% width) */}
        <div className="lg:col-span-8 space-y-4 min-w-0">
          <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
            <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-900 dark:text-white tracking-tight">
              Latest News
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Showing {latestNewsArticles.length} recent verified updates
            </span>
          </div>

          <div className="space-y-4 min-w-0">
            {latestNewsArticles.map((article, idx) => (
              <ArticleCard
                key={`latest-${article.id}-${idx}`}
                article={article}
                onOpenDetail={onOpenDetail}
                isSaved={isSaved(article)}
                onToggleSave={onToggleSave}
                fontSize={fontSize}
                layout="horizontal"
              />
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Trending Now + Newsletter Subscription (~35% width) */}
        <div className="lg:col-span-4 space-y-6 min-w-0">
          {/* CARD 1: Trending Now / Most Corroborated */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Trending Now
                </h3>
              </div>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 cursor-pointer hover:underline shrink-0">
                View All <ArrowRight className="w-3 h-3" />
              </span>
            </div>

            {/* 1-5 Numbered List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {TRENDING_TOPICS.map((topic) => (
                <div
                  key={topic.rank}
                  onClick={() => {
                    const matched = articles.find(a => 
                      a.headline.toLowerCase().includes(topic.title.toLowerCase().slice(0, 10)) ||
                      a.category === topic.category
                    );
                    if (matched) onOpenDetail(matched);
                  }}
                  className="py-3 flex items-start justify-between gap-3 group cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/40 rounded-xl px-2 transition-colors min-w-0"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span className="font-bold text-sm text-slate-400 dark:text-slate-500 w-4 pt-0.5 shrink-0">
                      {topic.rank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 break-words">
                        {topic.title}
                      </h4>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block">
                        {topic.category}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap pt-0.5 shrink-0">
                    {topic.reads}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CARD 2: Get the Top Stories in Your Inbox (Newsletter Box) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4 min-w-0 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>

            <div className="space-y-1 min-w-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug break-words">
                Get the Top Stories in Your Inbox
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed break-words">
                Stay informed with verified news and deep analysis, delivered straight to your email every morning at 06:30 IST.
              </p>
            </div>

            {newsletterSubscribed ? (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-semibold break-words">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                Subscribed! You will receive the next 06:30 AM IST briefing.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-3">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. FEATURED STORIES (3 VERTICAL CARDS WITH TOP PHOTO)                     */}
      {/* ========================================================================= */}
      {featuredArticles.length > 0 && (
        <section className="space-y-4 pt-4 min-w-0">
          <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
            <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-900 dark:text-white tracking-tight">
              Featured Stories
            </h2>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 cursor-pointer hover:underline shrink-0">
              View All <ArrowRight className="w-3 h-3" />
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-w-0">
            {featuredArticles.map((article, idx) => (
              <ArticleCard
                key={`featured-${article.id}-${idx}`}
                article={article}
                onOpenDetail={onOpenDetail}
                isSaved={isSaved(article)}
                onToggleSave={onToggleSave}
                fontSize={fontSize}
                layout="vertical"
              />
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 5. MOST VIEWED / EDITORIAL HIGHLIGHTS                                     */}
      {/* ========================================================================= */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-sans text-slate-900 dark:text-white tracking-tight">
            Most Viewed
          </h2>
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 cursor-pointer hover:underline shrink-0">
            View All <ArrowRight className="w-3 h-3" />
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {mostViewedArticles.map((art, idx) => (
            <div
              key={`mostviewed-${art.id}-${idx}`}
              onClick={() => onOpenDetail(art)}
              className="py-3.5 flex items-center justify-between gap-4 group cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 rounded-xl px-2 transition-colors min-w-0"
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <span className="font-bold text-sm text-slate-400 dark:text-slate-500 w-4 text-center shrink-0">
                  {idx + 1}
                </span>
                
                <img
                  src={getArticleImageUrl(art)}
                  alt={art.headline}
                  className="w-14 h-14 rounded-xl object-cover shrink-0 bg-slate-100 dark:bg-slate-800"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE;
                  }}
                />

                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 break-words">
                    {art.headline}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    <span className="truncate">{art.publisher}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300 shrink-0">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {getArticleReadingTime(art)}
                    </span>
                  </div>
                </div>
              </div>

              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
                {VIEW_COUNTS[idx] || '450K views'}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. "REAL NEWS. REAL IMPACT." BANNER CARD                                   */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-100/70 dark:from-slate-900 dark:via-blue-950/40 dark:to-slate-900 rounded-3xl p-8 sm:p-10 border border-blue-100 dark:border-blue-900/40 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 min-w-0">
        <div className="space-y-3 max-w-lg z-10 min-w-0">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight break-words">
            Real News. Real Impact.
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed break-words">
            THE WORLD DAILY brings you trusted, unbiased, and up-to-the-minute coverage from across India and around the world, verified with rigorous multi-source corroboration standards.
          </p>
          <div className="pt-2">
            <a
              href="#methodology"
              onClick={(e) => {
                e.preventDefault();
                alert('THE WORLD DAILY Editorial Policy:\n• 60% Indian national, economic, legal, and state coverage\n• 40% Global developments\n• No clickbait, anonymous gossip, or uncorroborated single-source claims\n• Two syndications of the same wire do not count as separate verification');
              }}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Learn More
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* 3D Earth Globe Graphic */}
        <div className="relative shrink-0 flex items-center justify-center">
          <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-full overflow-hidden shadow-2xl relative border-4 border-white/60 dark:border-slate-800">
            <img
              src="https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?auto=format&fit=crop&w=600&q=80"
              alt="Global News Coverage Globe"
              className="w-full h-full object-cover scale-110"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80';
              }}
            />
          </div>
          {/* Subtle glowing ring aura */}
          <div className="absolute inset-0 rounded-full bg-blue-400/20 blur-xl pointer-events-none -z-10" />
        </div>
      </section>
    </div>
  );
};