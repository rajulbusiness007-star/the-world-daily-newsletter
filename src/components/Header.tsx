import React, { useState, useEffect } from 'react';
import { Search, Moon, Sun, Bookmark, RefreshCw, Activity, Clock, Bell, Globe, Sparkles } from 'lucide-react';
import { MainView } from './Navigation.js';

interface HeaderProps {
  onSearch: (query: string) => void;
  searchQuery: string;
  isDark: boolean;
  onToggleDark: () => void;
  fontSize: 'sm' | 'md' | 'lg';
  onChangeFontSize: (size: 'sm' | 'md' | 'lg') => void;
  savedCount: number;
  onOpenSaved: () => void;
  onOpenHealth: () => void;
  onManualRefresh: () => void;
  isRefreshing: boolean;
  lastUpdate: string;
  currentView: MainView;
  onChangeView: (view: MainView) => void;
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  onOpenNotifications?: () => void;
  isNotificationEnabled?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onSearch,
  searchQuery,
  isDark,
  onToggleDark,
  fontSize,
  onChangeFontSize,
  savedCount,
  onOpenSaved,
  onOpenHealth,
  onManualRefresh,
  isRefreshing,
  lastUpdate,
  currentView,
  onChangeView,
  activeCategory,
  onSelectCategory,
  onOpenNotifications,
  isNotificationEnabled = false
}) => {
  const [istTime, setIstTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };
      setIstTime(new Intl.DateTimeFormat('en-IN', options).format(now));
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const NAV_ITEMS = [
    { id: 'Home', view: 'frontpage' as MainView, filter: 'All', label: 'Home', isSpecial: false },
    { id: 'AINews', view: 'ainews' as MainView, filter: 'AI', label: 'AI News', isSpecial: true },
    { id: 'India', view: 'frontpage' as MainView, filter: 'India', label: 'India', isSpecial: false },
    { id: 'World', view: 'frontpage' as MainView, filter: 'World', label: 'World', isSpecial: false },
    { id: 'Business', view: 'frontpage' as MainView, filter: 'Economy & Business', label: 'Business', isSpecial: false },
    { id: 'Technology', view: 'frontpage' as MainView, filter: 'Technology & AI', label: 'Technology', isSpecial: false },
    { id: 'Newsletter', view: 'newsletter' as MainView, filter: 'All', label: 'Newsletter', isSpecial: false },
    { id: 'Sources', view: 'sources' as MainView, filter: 'All', label: 'Sources', isSpecial: false },
    { id: 'Archive', view: 'archive' as MainView, filter: 'All', label: 'Archive', isSpecial: false }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      {/* Top Utility Ticker Bar */}
      <div className="border-b border-slate-100 dark:border-slate-800/80 text-[11px] px-4 sm:px-8 py-1.5 flex flex-wrap items-center justify-between text-slate-500 dark:text-slate-400 gap-2 min-w-0">
        <div className="flex items-center gap-2 tracking-wide font-sans min-w-0 flex-wrap">
          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shrink-0">
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            {istTime || 'IST Asia/Kolkata'}
          </span>
          <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
          <span className="hidden sm:inline shrink-0">
            Priority: <strong className="text-blue-600 dark:text-blue-400 font-semibold">60% India</strong> / 40% World
          </span>
          <span className="hidden md:inline text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
          <span className="hidden md:inline truncate">
            Daily Automated Briefing: <span className="font-medium text-slate-700 dark:text-slate-300">06:30 AM IST</span>
          </span>
        </div>

        <div className="flex items-center gap-3 ml-auto shrink-0">
          {/* Typographic Font Resizer */}
          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800">
            {(['sm', 'md', 'lg'] as const).map(size => (
              <button
                key={size}
                onClick={() => onChangeFontSize(size)}
                className={`px-2 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                  fontSize === size 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {size === 'sm' ? 'A−' : size === 'md' ? 'A' : 'A+'}
              </button>
            ))}
          </div>

          {/* Sync Ingestion */}
          <button
            onClick={onManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium text-[11px] transition-colors disabled:opacity-50 cursor-pointer"
            title="Ingest fresh feeds and verify stories"
          >
            <RefreshCw className={`w-3 h-3 text-blue-600 dark:text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3 sm:gap-4 min-w-0">
        {/* Left: Brand Logo Wordmark */}
        <div 
          onClick={() => {
            onChangeView('frontpage');
            onSelectCategory('All');
          }}
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer shrink-0 group min-w-0"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-sm group-hover:bg-blue-700 transition-colors shrink-0">
            W
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-extrabold text-base sm:text-xl font-sans tracking-tight text-slate-900 dark:text-white leading-none truncate">
              THE WORLD DAILY
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide truncate">
              Verified Global Briefing
            </span>
          </div>
        </div>

        {/* Center: Desktop Nav Links with horizontal scroll protection */}
        <nav className="hidden xl:flex items-center gap-1 xl:gap-1.5 text-xs font-semibold shrink-0">
          {NAV_ITEMS.map((item) => {
            const isActive = currentView === item.view && (item.view !== 'frontpage' || activeCategory === item.filter);
            return (
              <button
                key={item.id}
                onClick={() => {
                  onChangeView(item.view);
                  if (item.view === 'frontpage') {
                    onSelectCategory(item.filter);
                  }
                }}
                className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap relative flex items-center gap-1 cursor-pointer ${
                  isActive
                    ? item.isSpecial
                    : item.isSpecial
                    ? 'text-purple-700 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-200'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {item.isSpecial && <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
                <span>{item.label}</span>
                {item.isSpecial && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                    Live
                  </span>
                )}
                {isActive && (
                  <span className={`absolute bottom-0 left-2.5 right-2.5 h-0.5 rounded-full ${item.isSpecial ? 'bg-purple-600' : 'bg-blue-600'}`} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Search + Icons */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Rounded Search Bar */}
          <div className="relative w-36 sm:w-48 md:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search news..."
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-blue-400 dark:focus:border-blue-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-semibold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Diagnostics / Health */}
          <button
            onClick={onOpenHealth}
            title="System & Feed Diagnostics"
            className="p-1.5 sm:p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors relative cursor-pointer"
          >
            <Activity className="w-4 h-4" />
          </button>

          {/* Daily Notifications */}
          <button
            onClick={onOpenNotifications}
            title={isNotificationEnabled ? "Daily Briefing Notifications Active (06:30 AM IST)" : "Configure Daily Notifications"}
            className="p-1.5 sm:p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors relative cursor-pointer"
            aria-label="Daily Notifications"
          >
            <Bell className="w-4 h-4" />
            {isNotificationEnabled && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {/* Bookmarks */}
          <button
            onClick={onOpenSaved}
            title="Saved Briefings"
            className="p-1.5 sm:p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors relative cursor-pointer"
          >
            <Bookmark className="w-4 h-4" />
            {savedCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {savedCount}
              </span>
            )}
          </button>

          {/* Dark Mode */}
          <button
            onClick={onToggleDark}
            title={isDark ? "Switch to Daylight Mode" : "Switch to Night Mode"}
            className="p-1.5 sm:p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Nav Row (visible below xl screens) */}
      <div className="xl:hidden flex items-center overflow-x-auto px-4 py-2 border-t border-slate-100 dark:border-slate-800 gap-1.5 no-scrollbar text-xs font-medium">
        {NAV_ITEMS.map((item) => {
          const isActive = currentView === item.view && (item.view !== 'frontpage' || activeCategory === item.filter);
          return (
            <button
              key={item.id}
              onClick={() => {
                onChangeView(item.view);
                if (item.view === 'frontpage') {
                  onSelectCategory(item.filter);
                }
              }}
              className={`px-3 py-1 rounded-full whitespace-nowrap text-xs flex items-center gap-1 shrink-0 cursor-pointer ${
                isActive
                  ? item.isSpecial
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'bg-blue-600 text-white font-semibold'
                  : item.isSpecial
                  ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {item.isSpecial && <Sparkles className="w-3 h-3" />}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};