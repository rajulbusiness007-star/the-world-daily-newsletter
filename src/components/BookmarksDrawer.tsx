import React from 'react';
import { Article } from '../types.js';
import { X, Trash2, Bookmark, ExternalLink } from 'lucide-react';

interface BookmarksDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedArticles: Article[];
  onRemoveSave: (article: Article) => void;
  onClearAll: () => void;
  onOpenDetail: (article: Article) => void;
}

export const BookmarksDrawer: React.FC<BookmarksDrawerProps> = ({
  isOpen,
  onClose,
  savedArticles,
  onRemoveSave,
  onClearAll,
  onOpenDetail
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/50 backdrop-blur-2xs flex justify-end">
      <div 
        className="w-full max-w-md bg-[#faf8f5] dark:bg-stone-900 border-l border-stone-300 dark:border-stone-800 h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-100/60 dark:bg-stone-950/60">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <h3 className="font-editorial text-lg font-bold text-stone-950 dark:text-white">
              Saved Briefings ({savedArticles.length})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {savedArticles.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-xs text-red-700 dark:text-red-400 hover:underline flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer List */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3">
          {savedArticles.length === 0 ? (
            <div className="py-20 text-center text-stone-500 font-sans text-xs space-y-2">
              <Bookmark className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-700" />
              <p>No articles saved yet.</p>
              <p className="text-stone-400">Click the bookmark icon on any card to save it for later review.</p>
            </div>
          ) : (
            savedArticles.map((art, idx) => (
              <div
                key={`bm-${art.id}-${idx}`}
                onClick={() => {
                  onOpenDetail(art);
                  onClose();
                }}
                className="p-3.5 bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-sm hover:border-stone-400 cursor-pointer space-y-2 transition-colors relative group shadow-2xs"
              >
                <div className="flex items-center justify-between text-[11px] text-stone-500">
                  <span className="font-bold text-stone-800 dark:text-stone-200">{art.publisher}</span>
                  <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-700">
                    {art.country}
                  </span>
                </div>

                <h4 className="font-editorial font-bold text-sm text-stone-900 dark:text-white leading-snug">
                  {art.headline}
                </h4>

                <div className="flex items-center justify-between pt-1 text-[11px] text-stone-400">
                  <span>{new Date(art.publishedAt).toLocaleDateString()}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveSave(art);
                    }}
                    className="text-stone-400 hover:text-red-700 text-xs"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 text-[11px] text-stone-500 bg-stone-100 dark:bg-stone-950 text-center">
          Saved articles are stored locally in your browser session.
        </div>
      </div>
    </div>
  );
};
