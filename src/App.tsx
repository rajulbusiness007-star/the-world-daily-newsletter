import React, { useState, useEffect } from 'react';
import { Article, DailyEdition, NewsSource } from './types.js';
import { Header } from './components/Header.js';
import { Navigation, MainView } from './components/Navigation.js';
import { FrontPageView } from './components/FrontPageView.js';
import { AINewsView } from './components/AINewsView.js';
import { NewsletterView } from './components/NewsletterView.js';
import { SourcesDirectoryView } from './components/SourcesDirectoryView.js';
import { ArchiveView } from './components/ArchiveView.js';
import { SystemHealthView } from './components/SystemHealthView.js';
import { ArticleModal } from './components/ArticleModal.js';
import { BookmarksDrawer } from './components/BookmarksDrawer.js';
import { DailyNotificationModal } from './components/DailyNotificationModal.js';
import { ReadingProgressBar } from './components/ReadingProgressBar.js';
import { AudioPlayerBar } from './components/AudioPlayerBar.js';
import { useTextToSpeech } from './hooks/useTextToSpeech.js';
import { useDailyNotifications } from './hooks/useDailyNotifications.js';
import { Shield, BookOpen, Globe2, ChevronUp, WifiOff, CheckCircle2, RefreshCw } from 'lucide-react';

export default function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [todayEdition, setTodayEdition] = useState<DailyEdition | null>(null);
  const [activeEdition, setActiveEdition] = useState<DailyEdition | null>(null);
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [currentView, setCurrentView] = useState<MainView>('frontpage');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [articleScrollProgress, setArticleScrollProgress] = useState<number | null>(null);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [isServingFromOfflineCache, setIsServingFromOfflineCache] = useState<boolean>(false);

  // Daily browser notifications manager
  const notifications = useDailyNotifications();

  // Text-To-Speech engine
  const tts = useTextToSpeech();

  // Font sizing: sm, md, lg
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');

  // Dark mode
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('twd_theme') === 'dark';
  });

  // Saved articles
  const [savedArticles, setSavedArticles] = useState<Article[]>(() => {
    try {
      const stored = localStorage.getItem('twd_saved_articles');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Update theme class on HTML element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('twd_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('twd_theme', 'light');
    }
  }, [isDark]);

  // Save articles to local storage
  useEffect(() => {
    localStorage.setItem('twd_saved_articles', JSON.stringify(savedArticles));
  }, [savedArticles]);

  // Helper for static fallback when running in serverless / static hosts like Vercel
  const fetchStaticDb = async () => {
    const res = await fetch('/data/news_db.json');
    if (!res.ok) throw new Error(`Static DB fetch failed: ${res.status}`);
    return await res.json();
  };

  // Load sources list
  useEffect(() => {
    fetch('/api/sources')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => setSources(data.sources || []))
      .catch(async (err) => {
        console.warn('API sources fetch failed, falling back to static database:', err);
        try {
          const db = await fetchStaticDb();
          const uniqueNames = Array.from(new Set(db.articles.map((a: any) => a.publisher)));
          const fallbackSources = uniqueNames.map(name => ({
            id: String(name).toLowerCase().replace(/[^a-z0-9]/g, '-'),
            name: String(name),
            country: 'Global',
            category: 'General',
            biasRating: 'Neutral'
          }));
          setSources(fallbackSources as any);
        } catch (e) {
          console.error('Sources static fallback error:', e);
        }
      });
  }, []);

  // Fetch articles feed
  const loadArticles = () => {
    let url = `/api/news?limit=300`;
    if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
    if (activeCategory !== 'All') {
      if (activeCategory === 'India') url += `&country=India`;
      else if (activeCategory === 'World') url += `&country=World`;
      else if (['United States', 'United Kingdom', 'Europe', 'China', 'Australia'].includes(activeCategory)) {
        url += `&country=${encodeURIComponent(activeCategory)}`;
      } else if (activeCategory === 'AI' || activeCategory === 'Technology & AI') {
        url += `&category=Technology`;
      } else {
        url += `&category=${encodeURIComponent(activeCategory)}`;
      }
    }

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setArticles(data.articles || []);
      })
      .catch(async (err) => {
        console.warn('API articles fetch failed, falling back to static database:', err);
        try {
          const db = await fetchStaticDb();
          let items: Article[] = db.articles || [];
          if (searchQuery) {
            const q = searchQuery.toLowerCase();
            items = items.filter(a =>
              a.headline.toLowerCase().includes(q) ||
              a.summary.toLowerCase().includes(q) ||
              a.publisher.toLowerCase().includes(q)
            );
          }
          if (activeCategory !== 'All') {
            if (activeCategory === 'India') {
              items = items.filter(a => a.country === 'India');
            } else if (activeCategory === 'World') {
              items = items.filter(a => a.country !== 'India');
            } else {
              items = items.filter(a => (a.category || '').toLowerCase().includes(activeCategory.toLowerCase()));
            }
          }
          setArticles(items.slice(0, 300));
        } catch (e) {
          console.error('Static articles fallback error:', e);
        }
      });
  };

  useEffect(() => {
    loadArticles();
  }, [activeCategory, searchQuery]);

  // Fetch today's edition with service worker cache and localStorage fallback
  const loadTodayEdition = async () => {
    try {
      const res = await fetch('/api/newsletter/today');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data && data.formattedDate) {
        setTodayEdition(data);
        setActiveEdition(data);
        if (data.generatedAt) {
          setLastUpdate(data.generatedAt);
        }
        setIsServingFromOfflineCache(false);
        // Persist to local storage for instant offline availability
        try {
          localStorage.setItem('twd_cached_daily_edition', JSON.stringify(data));
          localStorage.setItem('twd_cached_daily_edition_time', data.generatedAt || new Date().toISOString());
        } catch (e) {
          console.warn('localStorage caching failed:', e);
        }
        // Also persist to Cache Storage
        if ('caches' in window) {
          caches.open('twd-edition-twd-v1').then(cache => {
            cache.put('/api/newsletter/today', new Response(JSON.stringify(data), {
              headers: { 'Content-Type': 'application/json' }
            }));
            cache.put('/api/newsletter/latest', new Response(JSON.stringify(data), {
              headers: { 'Content-Type': 'application/json' }
            }));
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.warn('Network fetch for daily newsletter failed, retrieving from offline cache:', err);
      let cachedEdition: DailyEdition | null = null;
      // 1. Try Service Worker Cache Storage first
      if ('caches' in window) {
        try {
          const cache = await caches.open('twd-edition-twd-v1');
          const matched = (await cache.match('/api/newsletter/today')) || (await cache.match('/api/newsletter/latest'));
          if (matched) {
            cachedEdition = await matched.json();
          }
        } catch (cErr) {
          console.warn('Cache API lookup error:', cErr);
        }
      }
      // 2. Fallback to localStorage
      if (!cachedEdition) {
        try {
          const stored = localStorage.getItem('twd_cached_daily_edition');
          if (stored) {
            cachedEdition = JSON.parse(stored);
          }
        } catch (lsErr) {
          console.warn('localStorage lookup error:', lsErr);
        }
      }

      // 3. Fallback to bundled static database (for static hosts like Vercel)
      if (!cachedEdition) {
        try {
          const db = await fetchStaticDb();
          const editionDates = Object.keys(db.editions || {}).sort().reverse();
          if (editionDates.length > 0 && db.editions[editionDates[0]]) {
            cachedEdition = db.editions[editionDates[0]];
          }
        } catch (sErr) {
          console.warn('Static newsletter lookup error:', sErr);
        }
      }

      if (cachedEdition) {
        setTodayEdition(cachedEdition);
        setActiveEdition(cachedEdition);
        setIsServingFromOfflineCache(true);
        if (cachedEdition.generatedAt) {
          setLastUpdate(cachedEdition.generatedAt);
        }
      }
    }
  };

  // Online / Offline network event listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      loadTodayEdition();
      loadArticles();
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    loadTodayEdition();
  }, []);

  // Handle direct navigation to newsletter from browser notification click
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#newsletter') {
        setCurrentView('newsletter');
        setActiveEdition(todayEdition);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);

    // Listen for Service Worker postMessage on notification click
    if ('serviceWorker' in navigator) {
      const handleSwMessage = (event: MessageEvent) => {
        if (event.data?.type === 'NAVIGATE_TO_VIEW' && event.data?.view === 'newsletter') {
          setCurrentView('newsletter');
          setActiveEdition(todayEdition);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      };
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
      return () => {
        window.removeEventListener('hashchange', handleHash);
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      };
    }

    return () => {
      window.removeEventListener('hashchange', handleHash);
    };
  }, [todayEdition]);

  // Manual refresh feed
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/news/refresh', { method: 'POST' });
      const data = await res.json();
      console.log('Ingestion response:', data);
      setLastUpdate(new Date().toISOString());
      loadArticles();
      loadTodayEdition();
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Toggle save article
  const handleToggleSave = (article: Article) => {
    setSavedArticles(prev => {
      const exists = prev.some(a => a.id === article.id);
      if (exists) {
        return prev.filter(a => a.id !== article.id);
      } else {
        return [article, ...prev];
      }
    });
  };

  // Select historical edition from archive
  const handleSelectArchiveDate = (date: string) => {
    fetch(`/api/newsletter/edition/${date}`)
      .then(res => res.json())
      .then(data => {
        setActiveEdition(data);
        setCurrentView('newsletter');
      })
      .catch(err => console.error('Error loading historical edition:', err));
  };

  // Get selected article's publisher metadata
  const selectedPublisherSource = selectedArticle 
    ? sources.find(s => s.name === selectedArticle.publisher || s.id === selectedArticle.publisherId)
    : undefined;

  return (
    <div className="min-h-screen bg-[#f4f6fb] dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors">
      {/* Subtle Top Screen Reading Progress Bar tracking feed & active article scroll */}
      <ReadingProgressBar
        articleProgress={articleScrollProgress}
        isReadingArticle={Boolean(selectedArticle)}
        articleHeadline={selectedArticle?.headline}
        currentContext={
          currentView === 'frontpage'
            ? (activeCategory === 'All' ? 'Front Page' : activeCategory)
            : currentView === 'ainews'
            ? 'AI Intelligence Desk'
            : currentView === 'newsletter'
            ? 'Daily Edition'
            : currentView === 'sources'
            ? 'Sources'
            : currentView === 'archive'
            ? 'Archive'
            : 'Diagnostics'
        }
      />

      <div>
        {/* Modern Header with Wordmark, Nav Links, Search & Controls */}
        <Header
          onSearch={(q) => setSearchQuery(q)}
          searchQuery={searchQuery}
          isDark={isDark}
          onToggleDark={() => setIsDark(!isDark)}
          fontSize={fontSize}
          onChangeFontSize={(s) => setFontSize(s)}
          savedCount={savedArticles.length}
          onOpenSaved={() => setIsBookmarksOpen(true)}
          onOpenHealth={() => setCurrentView('health')}
          onManualRefresh={handleManualRefresh}
          isRefreshing={isRefreshing}
          lastUpdate={lastUpdate}
          currentView={currentView}
          onChangeView={(v) => {
            setCurrentView(v);
            if (v === 'newsletter') {
              setActiveEdition(todayEdition);
            }
          }}
          activeCategory={activeCategory}
          onSelectCategory={(cat) => {
            setActiveCategory(cat);
            setCurrentView('frontpage');
          }}
          onOpenNotifications={() => setIsNotificationModalOpen(true)}
          isNotificationEnabled={notifications.isEnabled}
        />

        {/* Offline / Cached Edition Notification Banner */}
        {(isOffline || isServingFromOfflineCache) && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 px-4 py-2.5 text-xs sm:text-sm font-sans flex items-center justify-between no-print transition-all animate-fadeIn">
            <div className="max-w-7xl mx-auto w-full flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>
                    <strong>Offline Mode:</strong> Reading the latest downloaded Daily Edition {todayEdition ? `(${todayEdition.formattedDate})` : ''} from local device cache.
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    loadTodayEdition();
                    loadArticles();
                  }}
                  className="inline-flex items-center gap-1 font-semibold text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-amber-100 underline cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Check Network</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="py-6">
          {currentView === 'frontpage' && (
            <FrontPageView
              articles={articles}
              onOpenDetail={(art) => setSelectedArticle(art)}
              savedArticles={savedArticles}
              onToggleSave={handleToggleSave}
              fontSize={fontSize}
              activeCategory={activeCategory}
            />
          )}

          {currentView === 'ainews' && (
            <AINewsView
              articles={articles}
              onOpenDetail={(art) => setSelectedArticle(art)}
              savedArticles={savedArticles}
              onToggleSave={handleToggleSave}
              fontSize={fontSize}
              onPlaySection={tts.playSection}
              isPlaying={tts.isPlaying}
              isPaused={tts.isPaused}
              currentTrackId={tts.currentTrack?.id}
              onTogglePlayPause={tts.togglePlayPause}
            />
          )}

          {currentView === 'newsletter' && (
            <NewsletterView
              edition={activeEdition}
              onOpenDetail={(art) => setSelectedArticle(art)}
              savedArticles={savedArticles}
              onToggleSave={handleToggleSave}
              fontSize={fontSize}
              isOffline={isOffline}
              isCached={isServingFromOfflineCache}
              onPlayEdition={tts.playEdition}
              onPlayArticle={tts.playArticle}
              onPlaySection={tts.playSection}
              currentTrackId={tts.currentTrack?.id}
              currentArticleId={tts.currentTrack?.articleId}
              isPlaying={tts.isPlaying}
              isPaused={tts.isPaused}
              onTogglePlayPause={tts.togglePlayPause}
              onOpenNotifications={() => setIsNotificationModalOpen(true)}
              isNotificationEnabled={notifications.isEnabled}
            />
          )}

          {currentView === 'sources' && (
            <SourcesDirectoryView />
          )}

          {currentView === 'archive' && (
            <ArchiveView onSelectDate={handleSelectArchiveDate} />
          )}

          {currentView === 'health' && (
            <SystemHealthView
              onTriggerRefresh={handleManualRefresh}
              isRefreshing={isRefreshing}
            />
          )}
        </main>
      </div>

      {/* Floating Audio Player Bar */}
      <AudioPlayerBar
        isPlaying={tts.isPlaying}
        isPaused={tts.isPaused}
        currentTrack={tts.currentTrack}
        currentIndex={tts.currentIndex}
        playlistLength={tts.playlist.length}
        playbackRate={tts.playbackRate}
        availableVoices={tts.availableVoices}
        selectedVoiceURI={tts.selectedVoiceURI}
        progress={tts.currentSentenceProgress}
        onTogglePlayPause={tts.togglePlayPause}
        onStop={tts.stop}
        onSkipNext={tts.skipNext}
        onSkipPrevious={tts.skipPrevious}
        onSetRate={tts.setRate}
        onSetVoice={tts.setVoice}
      />

      {/* Article Detail Reader Modal */}
      <ArticleModal
        article={selectedArticle}
        onClose={() => {
          setSelectedArticle(null);
          setArticleScrollProgress(null);
        }}
        isSaved={selectedArticle ? savedArticles.some(s => s.id === selectedArticle.id) : false}
        onToggleSave={handleToggleSave}
        publisherOwnership={selectedPublisherSource?.ownership}
        publisherFunding={selectedPublisherSource?.funding}
        onScrollProgress={(progress) => setArticleScrollProgress(progress)}
        onPlayArticle={tts.playArticle}
        isCurrentlySpeaking={tts.currentTrack?.articleId === selectedArticle?.id && tts.isPlaying}
        isPlaying={tts.isPlaying}
        isPaused={tts.isPaused}
        onTogglePlayPause={tts.togglePlayPause}
      />

      {/* Saved Bookmarks Drawer */}
      <BookmarksDrawer
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
        savedArticles={savedArticles}
        onRemoveSave={handleToggleSave}
        onClearAll={() => setSavedArticles([])}
        onOpenDetail={(art) => setSelectedArticle(art)}
      />

      {/* Daily Newsletter Browser Notifications Modal */}
      <DailyNotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        permission={notifications.permission}
        isEnabled={notifications.isEnabled}
        scheduledTime={notifications.scheduledTime}
        topics={notifications.topics}
        onRequestPermission={notifications.requestPermissionAndEnable}
        onDisable={notifications.disableNotifications}
        onSetScheduledTime={notifications.setScheduledTime}
        onToggleTopic={notifications.toggleTopic}
        onSendTest={notifications.sendTestNotification}
      />

      {/* Clean Modern Footer matching template screenshot */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 py-12 px-4 sm:px-8 mt-16 no-print transition-colors">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-xs font-sans">
            {/* Column 1: Brand & Slogan */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                  W
                </div>
                <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">
                  THE WORLD DAILY
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-xs">
                Your world. In one place. An independent, automated daily briefing prioritizing Indian national, economic, and regional developments (60%) followed by verified global events (40%).
              </p>
              <div className="flex items-center gap-3 text-slate-400">
                <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold hover:text-blue-600 cursor-pointer">X</span>
                <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold hover:text-blue-600 cursor-pointer">f</span>
                <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold hover:text-blue-600 cursor-pointer">in</span>
                <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold hover:text-blue-600 cursor-pointer">yt</span>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                Quick Links
              </h4>
              <ul className="space-y-2 text-slate-500 dark:text-slate-400">
                <li><button onClick={() => { setCurrentView('frontpage'); setActiveCategory('All'); }} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home Briefing</button></li>
                <li><button onClick={() => setCurrentView('newsletter')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Daily Newsletter (06:30 AM IST)</button></li>
                <li><button onClick={() => setCurrentView('sources')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Sources & Transparency</button></li>
                <li><button onClick={() => setCurrentView('archive')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Past Editions Archive</button></li>
                <li><button onClick={() => setCurrentView('health')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">System Diagnostics</button></li>
              </ul>
            </div>

            {/* Column 3: Categories */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                Categories
              </h4>
              <ul className="space-y-2 text-slate-500 dark:text-slate-400">
                <li><button onClick={() => { setCurrentView('frontpage'); setActiveCategory('India'); }} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">India First</button></li>
                <li><button onClick={() => { setCurrentView('frontpage'); setActiveCategory('World'); }} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">World News</button></li>
                <li><button onClick={() => { setCurrentView('frontpage'); setActiveCategory('Economy & Business'); }} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Business & Economy</button></li>
                <li><button onClick={() => { setCurrentView('frontpage'); setActiveCategory('Technology & AI'); }} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Technology & AI</button></li>
                <li><button onClick={() => { setCurrentView('frontpage'); setActiveCategory('Courts & Legal'); }} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Courts & Law</button></li>
                <li><button onClick={() => { setCurrentView('frontpage'); setActiveCategory('Science & Environment'); }} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Science & Space</button></li>
              </ul>
            </div>

            {/* Column 4: Legal & Standards */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                Legal & Governance
              </h4>
              <ul className="space-y-2 text-slate-500 dark:text-slate-400">
                <li><button onClick={() => setCurrentView('sources')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left">Editorial Guidelines</button></li>
                <li><button onClick={() => setCurrentView('sources')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left">Fact-Checking Policy</button></li>
                <li><button onClick={() => setCurrentView('sources')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left">Privacy Policy & Non-Telemetry</button></li>
                <li><button onClick={() => setCurrentView('sources')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left">Terms of Service</button></li>
                <li><button onClick={() => setCurrentView('sources')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left">Cookie & Local Storage Settings</button></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div>
              © 2026 THE WORLD DAILY. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <span>Timezone: Asia/Kolkata (IST)</span>
              <span>•</span>
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 font-semibold cursor-pointer">
                Back to Top <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
