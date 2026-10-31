import React, { useState, useMemo } from 'react';
import { 
  Sparkles, Cpu, Globe2, ShieldCheck, Headphones, Volume2, 
  Layers, ExternalLink, Clock, ArrowRight, Share2, Bookmark, 
  Terminal, CheckCircle2, TrendingUp, Building2, Zap, Award, Search
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Article } from '../types.js';
import { ArticleCard } from './ArticleCard.js';
import { getArticleReadingTime } from '../utils/readingTime.js';
import { getArticleImageUrl, DEFAULT_FALLBACK_IMAGE } from '../utils/newsImages.js';

interface AINewsViewProps {
  articles: Article[];
  onOpenDetail: (article: Article) => void;
  savedArticles: Article[];
  onToggleSave: (article: Article) => void;
  fontSize: 'sm' | 'md' | 'lg';
  onPlaySection?: (title: string, subtitle: string, text: string, id: string) => void;
  isPlaying?: boolean;
  isPaused?: boolean;
  currentTrackId?: string | null;
  onTogglePlayPause?: () => void;
}

type RegionFilter = 'All' | 'India' | 'United States' | 'United Kingdom' | 'Europe' | 'World';
type TopicFilter = 'All' | 'Models' | 'Compute' | 'Governance' | 'Industry';

const AI_CHART_DATA = [
  { day: '25 Oct', modelsScore: 84, computeIndex: 120, label: 'Frontier Evals & Benchmarks' },
  { day: '26 Oct', modelsScore: 86, computeIndex: 124, label: 'Sovereign Compute Allocations' },
  { day: '27 Oct', modelsScore: 89, computeIndex: 128, label: 'Enterprise Multimodal Rollouts' },
  { day: '28 Oct', modelsScore: 91, computeIndex: 135, label: 'IndiaAI Mission 10k GPU Tender' },
  { day: '29 Oct', modelsScore: 94, computeIndex: 138, label: 'Next-Gen Blackwell Shipments' },
  { day: '30 Oct', modelsScore: 97, computeIndex: 142, label: 'EU AI Act Phase-1 Audit Rules' },
  { day: 'Today',  modelsScore: 99, computeIndex: 148, label: 'Bhashini 22-Language Model Release' },
];

export const AINewsView: React.FC<AINewsViewProps> = ({
  articles,
  onOpenDetail,
  savedArticles,
  onToggleSave,
  fontSize,
  onPlaySection,
  isPlaying = false,
  isPaused = false,
  currentTrackId = null,
  onTogglePlayPause
}) => {
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>('All');
  const [selectedTopic, setSelectedTopic] = useState<TopicFilter>('All');
  const [searchFilter, setSearchFilter] = useState('');

  // Filter articles that relate to Artificial Intelligence & Advanced Tech
  const allAiArticles = useMemo(() => {
    const aiRegex = /\b(ai|artificial intelligence|llm|llms|machine learning|deep learning|genai|gpt|neural|semiconductor|blackwell|nvidia|openai|anthropic|deepmind|bhashini|foundation model)\b/i;
    return articles.filter(a => {
      const text = `${a.headline} ${a.summary} ${a.subCategory || ''}`;
      return a.category === 'Technology & AI' || aiRegex.test(text);
    });
  }, [articles]);

  // Regional breakdown counts
  const indiaAiCount = useMemo(() => allAiArticles.filter(a => a.country === 'India').length, [allAiArticles]);
  const usaAiCount = useMemo(() => allAiArticles.filter(a => a.country === 'United States').length, [allAiArticles]);
  const ukAiCount = useMemo(() => allAiArticles.filter(a => a.country === 'United Kingdom').length, [allAiArticles]);
  const europeAiCount = useMemo(() => allAiArticles.filter(a => a.country === 'Europe' || a.country === 'Germany' || a.country === 'France').length, [allAiArticles]);
  const worldAiCount = useMemo(() => allAiArticles.filter(a => !['India', 'United States', 'United Kingdom'].includes(a.country)).length, [allAiArticles]);

  // Apply active filters
  const filteredAiArticles = useMemo(() => {
    return allAiArticles.filter(a => {
      // Region
      let matchesRegion = true;
      if (selectedRegion === 'India') {
        matchesRegion = a.country === 'India';
      } else if (selectedRegion === 'United States') {
        matchesRegion = a.country === 'United States';
      } else if (selectedRegion === 'United Kingdom') {
        matchesRegion = a.country === 'United Kingdom';
      } else if (selectedRegion === 'Europe') {
        matchesRegion = a.country === 'Europe' || a.country === 'Germany' || a.country === 'France';
      } else if (selectedRegion === 'World') {
        matchesRegion = a.country !== 'India';
      }

      // Topic
      let matchesTopic = true;
      const text = `${a.headline} ${a.summary} ${a.subCategory || ''}`.toLowerCase();
      if (selectedTopic === 'Models') {
        matchesTopic = text.includes('model') || text.includes('llm') || text.includes('reasoning') || text.includes('gpt') || text.includes('agent');
      } else if (selectedTopic === 'Compute') {
        matchesTopic = text.includes('gpu') || text.includes('semiconductor') || text.includes('blackwell') || text.includes('chip') || text.includes('hardware') || text.includes('datacenter');
      } else if (selectedTopic === 'Governance') {
        matchesTopic = text.includes('act') || text.includes('rule') || text.includes('law') || text.includes('regulation') || text.includes('governance') || text.includes('safety') || text.includes('policy');
      } else if (selectedTopic === 'Industry') {
        matchesTopic = text.includes('enterprise') || text.includes('manufacturing') || text.includes('startup') || text.includes('investment') || text.includes('healthcare');
      }

      // Search
      let matchesSearch = true;
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        matchesSearch = a.headline.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q) || a.publisher.toLowerCase().includes(q);
      }

      return matchesRegion && matchesTopic && matchesSearch;
    });
  }, [allAiArticles, selectedRegion, selectedTopic, searchFilter]);

  const leadAiStory = filteredAiArticles[0] || allAiArticles[0];
  const feedAiStories = filteredAiArticles.filter(a => a.id !== leadAiStory?.id);

  const isSaved = (art: Article) => savedArticles.some(s => s.id === art.id);

  // Play audio briefing of top AI news
  const handlePlayAiBriefing = () => {
    if (!onPlaySection) return;
    const stories = filteredAiArticles.slice(0, 5);
    const audioText = `Global AI Intelligence Briefing for today. Featuring ${stories.length} priority developments across India, the United States, the United Kingdom, and the world. ` +
      stories.map((s, idx) => `Item ${idx + 1}: ${s.country}. ${s.headline}. ${s.summary}`).join('. ');
    onPlaySection(
      'Daily AI Intelligence Briefing',
      `${selectedRegion === 'All' ? 'Global' : selectedRegion} AI Updates · ${filteredAiArticles.length} Verified Reports`,
      audioText,
      'ai-briefing-track'
    );
  };

  const isBriefingActive = currentTrackId === 'ai-briefing-track' && isPlaying;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16 pt-2">
      {/* ========================================================================= */}
      {/* 1. HERO DESK BANNER WITH PURPLE/INDIGO ACCENT & AUDIO ENGINE              */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-lg border border-purple-800/40">
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 backdrop-blur-md uppercase tracking-wider text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Specialized Desk
            </span>
            <span className="text-purple-300/60">·</span>
            <span className="text-purple-200">
              India · USA · UK · Europe · Global AI
            </span>
            <span className="text-purple-300/60">·</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {allAiArticles.length} Verified AI Reports
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-sans tracking-tight leading-tight">
            AI News & Intelligence Desk
          </h1>

          <p className="text-sm sm:text-base text-purple-200/90 leading-relaxed font-sans max-w-2xl">
            Continuous verified reporting on artificial intelligence breakthroughs, frontier foundation models, sovereign compute clusters, and global AI governance standards.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={handlePlayAiBriefing}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md ${
                isBriefingActive 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white ring-2 ring-emerald-400/40' 
                  : 'bg-white hover:bg-purple-50 text-slate-900'
              }`}
            >
              <Headphones className="w-4 h-4 text-purple-700" />
              <span>{isBriefingActive ? 'Playing AI Briefing...' : "Listen to Daily AI Briefing"}</span>
            </button>

            <span className="text-xs text-purple-300/80 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Independent multi-source corroboration standards applied
            </span>
          </div>
        </div>

        {/* Ambient Decorative Background Glow */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-purple-600/15 to-transparent pointer-events-none" />
        <div className="absolute -right-10 -bottom-10 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* ========================================================================= */}
      {/* 2. REGION SELECTOR BAR (INDIA, USA, UK, EUROPE, WORLD)                   */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {/* Region Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-slate-400 text-xs font-semibold mr-1 flex items-center gap-1">
              <Globe2 className="w-3.5 h-3.5" />
              Region:
            </span>

            {[
              { id: 'All' as RegionFilter, label: 'All AI News', count: allAiArticles.length },
              { id: 'India' as RegionFilter, label: '🇮🇳 India AI', count: indiaAiCount },
              { id: 'United States' as RegionFilter, label: '🇺🇸 USA AI', count: usaAiCount },
              { id: 'United Kingdom' as RegionFilter, label: '🇬🇧 UK AI', count: ukAiCount },
              { id: 'Europe' as RegionFilter, label: '🇪🇺 Europe', count: europeAiCount },
              { id: 'World' as RegionFilter, label: '🌐 Global / Rest of World', count: worldAiCount }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedRegion(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedRegion === tab.id
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedRegion === tab.id 
                    ? 'bg-white/20 text-white' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search within AI Desk */}
          <div className="relative w-full sm:w-56 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search AI models, chips..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-purple-400 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Sub-Topic Filter Ribbon */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
            Focus:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'All' as TopicFilter, label: 'All Topics' },
              { id: 'Models' as TopicFilter, label: '🧠 Frontier LLMs & Agents' },
              { id: 'Compute' as TopicFilter, label: '⚡ GPUs, Blackwell & Chips' },
              { id: 'Governance' as TopicFilter, label: '⚖️ AI Act & Policy' },
              { id: 'Industry' as TopicFilter, label: '🏭 Enterprise & DPI' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTopic(t.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedTopic === t.id
                    ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. RECHARTS GLOBAL AI COMPUTE & ADOPTION VELOCITY CHART                   */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Daily AI Compute & Innovation Index
                <span className="text-[10px] bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-bold px-2 py-0.5 rounded-full">
                  Recharts Analytics
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tracking daily global compute density, benchmark leaps, and sovereign AI initiatives.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
              <span>Model Capability Index: 99/100</span>
            </div>
            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <span>Sovereign Compute: +14.8% WoW</span>
            </div>
          </div>
        </div>

        <div className="w-full h-44 sm:h-52 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={AI_CHART_DATA} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="ai-model-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#9333ea" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.15} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
              <YAxis domain={[70, 105]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-900/95 dark:bg-slate-800/95 text-white px-3 py-2 rounded-xl text-xs border border-purple-800 shadow-xl">
                        <div className="font-bold text-purple-300">{d.day}</div>
                        <div className="text-sm font-bold text-white mt-0.5">Capability Index: {d.modelsScore}/100</div>
                        <div className="text-[10px] text-purple-200 mt-1">{d.label}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="modelsScore" 
                stroke="#9333ea" 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#ai-model-grad)" 
                activeDot={{ r: 5, fill: '#9333ea', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. FEATURED LEAD AI STORY                                                */}
      {/* ========================================================================= */}
      {leadAiStory && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center p-6 sm:p-8">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Lead AI Intelligence Story
                </span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {leadAiStory.publisher}
                </span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span className="font-medium text-purple-600 dark:text-purple-400">
                  {leadAiStory.country === 'India' ? '🇮🇳 India' : leadAiStory.country === 'United States' ? '🇺🇸 United States' : leadAiStory.country === 'United Kingdom' ? '🇬🇧 United Kingdom' : leadAiStory.country}
                </span>
              </div>

              <h2 
                onClick={() => onOpenDetail(leadAiStory)}
                className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer leading-tight"
              >
                {leadAiStory.headline}
              </h2>

              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed line-clamp-3">
                {leadAiStory.summary}
              </p>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {getArticleReadingTime(leadAiStory)}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {leadAiStory.verificationStatus}
                  </span>
                </div>

                <button
                  onClick={() => onOpenDetail(leadAiStory)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 cursor-pointer"
                >
                  Read Full Briefing
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 h-64 sm:h-72 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
              <img
                src={getArticleImageUrl(leadAiStory)}
                alt={leadAiStory.headline}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE;
                }}
              />
              <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-800 dark:text-slate-200 shadow-xs">
                {leadAiStory.country} AI Desk
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 5. FILTERED AI STORIES FEED                                               */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-1">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold font-sans text-slate-900 dark:text-white">
              {selectedRegion === 'All' ? 'All Daily AI Briefings' : `${selectedRegion} AI Briefings`}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Showing {filteredAiArticles.length} verified artificial intelligence updates
            </p>
          </div>

          <div className="text-xs text-slate-400">
            Click any story for 3-Point Gemini TL;DR
          </div>
        </div>

        {filteredAiArticles.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200/80 dark:border-slate-800 space-y-3">
            <Cpu className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">
              No AI articles matched this specific filter
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try switching back to 'All Regions' or clear the search query to view all available artificial intelligence updates.
            </p>
            <button
              onClick={() => {
                setSelectedRegion('All');
                setSelectedTopic('All');
                setSearchFilter('');
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {feedAiStories.map((article, idx) => (
              <ArticleCard
                key={`ai-desk-${article.id}-${idx}`}
                article={article}
                onOpenDetail={onOpenDetail}
                isSaved={isSaved(article)}
                onToggleSave={onToggleSave}
                fontSize={fontSize}
                layout="horizontal"
              />
            ))}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 6. PILLARS OF SOVEREIGN AI COMPARISON MATRIX                              */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-md space-y-6">
        <div>
          <span className="text-[10px] uppercase tracking-wider font-bold text-purple-400 bg-purple-950/80 border border-purple-800/60 px-2.5 py-1 rounded-md">
            Global Strategy Overview
          </span>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight mt-2 text-white">
            How India, USA, UK, and Europe Approach Frontier AI
          </h3>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Key policy, infrastructure, and foundation model postures defining the global intelligence race.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-purple-300">🇮🇳 India</span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">DPI + Compute</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>IndiaAI Mission:</strong> ₹10,372 crore public allocation for 10,000+ GPU sovereign cloud, Bhashini multilingual DPI, and semiconductor fabrication hubs.
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-blue-300">🇺🇸 United States</span>
              <span className="text-[10px] font-mono text-blue-400 font-bold">Frontier Scale</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>Hyperscalers & Silicon:</strong> Leading global LLM architectures (OpenAI, Anthropic, Google DeepMind), Blackwell GPU clusters, and gigawatt datacenters.
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-amber-300">🇬🇧 United Kingdom</span>
              <span className="text-[10px] font-mono text-amber-400 font-bold">Safety Institute</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>Bletchley Accord:</strong> World-first government AI Safety Institute conducting red-teaming and empirical evaluations on advanced autonomous agents.
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-sky-300">🇪🇺 European Union</span>
              <span className="text-[10px] font-mono text-sky-400 font-bold">Statutory Law</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>EU AI Act:</strong> Binding Phase-1 legal enforcement across 27 nations, requiring algorithmic transparency and banning untargeted scraping.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
