import React from 'react';
import { Newspaper, BookOpen, Database, Archive, Activity, Sparkles, Cpu } from 'lucide-react';

export type MainView = 'frontpage' | 'newsletter' | 'ainews' | 'sources' | 'archive' | 'health';

interface NavigationProps {
  currentView: MainView;
  onChangeView: (view: MainView) => void;
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onChangeView,
  activeFilter,
  onSelectFilter
}) => {
  const categoryLinks = [
    { label: 'All News', value: 'All' },
    { label: 'AI News (India & World)', value: 'Technology & AI' },
    { label: 'India', value: 'India' },
    { label: 'World', value: 'World' },
    { label: 'USA', value: 'United States' },
    { label: 'UK', value: 'United Kingdom' },
    { label: 'Europe', value: 'Europe' },
    { label: 'China', value: 'China' },
    { label: 'Australia', value: 'Australia' },
    { label: 'Business & Economy', value: 'Economy & Business' },
    { label: 'Science & Environment', value: 'Science & Environment' },
    { label: 'Fact Checks', value: 'Fact-Check' }
  ];

  return (
    <nav className="sticky top-0 z-30 bg-[#fbf9f5]/95 dark:bg-stone-950/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 shadow-2xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Top View Mode Switcher (Clean Segmented Desk) */}
        <div className="flex items-center justify-between border-b border-stone-200/70 dark:border-stone-800/70 py-2.5 overflow-x-auto no-scrollbar gap-4 text-xs">
          <div className="flex items-center gap-1 sm:gap-1.5 p-0.5 rounded-sm bg-stone-200/50 dark:bg-stone-900 border border-stone-300/60 dark:border-stone-800">
            <button
              onClick={() => onChangeView('frontpage')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm transition-all whitespace-nowrap text-xs font-semibold ${
                currentView === 'frontpage'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Newspaper className="w-3.5 h-3.5" />
              Front Page Broadsheet
            </button>

            <button
              onClick={() => onChangeView('ainews')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm transition-all whitespace-nowrap text-xs font-semibold ${
                currentView === 'ainews'
                  ? 'bg-purple-700 text-white shadow-2xs'
                  : 'text-purple-700 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              AI News Desk
              <span className="bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                Live
              </span>
            </button>

            <button
              onClick={() => onChangeView('newsletter')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm transition-all whitespace-nowrap text-xs font-semibold ${
                currentView === 'newsletter'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Daily Newsletter (06:30 AM IST)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onChangeView('sources')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm transition-colors whitespace-nowrap text-xs font-medium ${
                currentView === 'sources'
                  ? 'font-bold text-stone-950 dark:text-white border-b-2 border-stone-900 dark:border-white'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-stone-400" />
              Source Directory
            </button>

            <button
              onClick={() => onChangeView('archive')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm transition-colors whitespace-nowrap text-xs font-medium ${
                currentView === 'archive'
                  ? 'font-bold text-stone-950 dark:text-white border-b-2 border-stone-900 dark:border-white'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Archive className="w-3.5 h-3.5 text-stone-400" />
              Archive
            </button>

            <button
              onClick={() => onChangeView('health')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm transition-colors whitespace-nowrap text-xs font-medium ${
                currentView === 'health'
                  ? 'font-bold text-stone-950 dark:text-white border-b-2 border-stone-900 dark:border-white'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-stone-400" />
              Telemetry
            </button>
          </div>
        </div>

        {/* Clean Typographic Categories Ribbon */}
        {currentView === 'frontpage' && (
          <div className="flex items-center justify-start sm:justify-center overflow-x-auto py-2.5 gap-2 sm:gap-4 text-[11px] uppercase tracking-wider font-semibold no-scrollbar">
            {categoryLinks.map((item) => {
              const isSelected = activeFilter === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() => onSelectFilter(item.value)}
                  className={`pb-1 transition-all whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'text-stone-950 dark:text-white font-bold border-b-2 border-stone-900 dark:border-stone-100'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 border-b-2 border-transparent'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
};
