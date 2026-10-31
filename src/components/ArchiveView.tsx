import React, { useState, useEffect } from 'react';
import { ArchiveItem } from '../types.js';
import { Calendar, ArrowRight, BookOpen, Layers } from 'lucide-react';

interface ArchiveViewProps {
  onSelectDate: (date: string) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({ onSelectDate }) => {
  const [archives, setArchives] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/newsletter/archive')
      .then(res => res.json())
      .then(data => {
        setArchives(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load archives:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      <div className="border-b-2 border-stone-800 dark:border-stone-200 pb-4">
        <div className="text-xs font-bold uppercase tracking-widest text-red-800 dark:text-red-400">
          Permanent Historical Records
        </div>
        <h2 className="font-editorial text-3xl font-extrabold text-stone-950 dark:text-white mt-1">
          Daily Editions Archive
        </h2>
        <p className="text-stone-600 dark:text-stone-300 font-sans text-sm mt-1">
          Every dated edition generated at 06:30 AM IST is preserved permanently in this digital record.
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-stone-500 font-serif">Loading historical archive...</div>
      ) : archives.length === 0 ? (
        <div className="p-8 text-center bg-stone-100 dark:bg-stone-900 rounded border border-stone-200 dark:border-stone-800 text-stone-500">
          No archived past editions found. Today's edition is active on the Daily Newsletter view.
        </div>
      ) : (
        <div className="space-y-4">
          {archives.map(item => (
            <div
              key={item.date}
              onClick={() => onSelectDate(item.date)}
              className="p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-stone-400 rounded-sm cursor-pointer transition-colors shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{item.formattedDate}</span>
                  <span className="text-stone-400">•</span>
                  <span className="text-stone-500 font-normal">Edition #{item.editionNumber}</span>
                </div>

                <h4 className="font-editorial font-bold text-lg text-stone-950 dark:text-white">
                  {item.leadHeadline}
                </h4>

                <div className="flex items-center gap-3 text-xs text-stone-500">
                  <span>{item.totalArticles} Verified Stories</span>
                  <span>•</span>
                  <span>{(item.indiaRatio * 100).toFixed(0)}% India / {(item.worldRatio * 100).toFixed(0)}% World</span>
                </div>
              </div>

              <button className="flex items-center gap-1 text-xs font-bold text-stone-800 dark:text-stone-200 hover:text-amber-700 whitespace-nowrap">
                Open Edition <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
