import React, { useState, useEffect } from 'react';
import { NewsSource } from '../types.js';
import { ShieldCheck, ExternalLink, Search, Filter, AlertTriangle, CheckCircle, Info, Database } from 'lucide-react';

export const SourcesDirectoryView: React.FC = () => {
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => {
    fetch('/api/sources')
      .then(res => res.json())
      .then(data => {
        setSources(data.sources || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load sources:', err);
        setLoading(false);
      });
  }, []);

  const filteredSources = sources.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.ownership.toLowerCase().includes(search.toLowerCase());
    const matchesCountry = countryFilter === 'All' || s.country === countryFilter;
    const matchesType = typeFilter === 'All' || s.sourceType === typeFilter;
    return matchesSearch && matchesCountry && matchesType;
  });

  const countries = ['All', 'India', 'United States', 'United Kingdom', 'Europe', 'Australia', 'China', 'Singapore', 'Japan', 'Russia', 'Global'];
  const types = [
    'All',
    'Independent National',
    'Independent Financial',
    'Wire Agency',
    'Public Broadcaster',
    'Government Official',
    'Fact Checker',
    'State-Controlled Media'
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-10 overflow-hidden">
      {/* Page Masthead */}
      <div className="border-b-2 border-stone-800 dark:border-stone-200 pb-5 min-w-0">
        <div className="text-xs font-bold uppercase tracking-widest text-red-800 dark:text-red-400">
          Source Credibility, Governance & Open Attribution
        </div>
        <h2 className="font-editorial text-3xl sm:text-4xl font-extrabold text-stone-950 dark:text-white mt-1 break-words">
          Source Directory & Editorial Transparency
        </h2>
        <p className="text-stone-600 dark:text-stone-300 font-sans text-sm sm:text-base mt-2 max-w-3xl leading-relaxed break-words">
          Every story published on THE WORLD DAILY is collected strictly from approved news organisations with audited editorial charters. We disclose ownership, funding structures, and editorial standards for every reporting partner.
        </p>
      </div>

      {/* 5-Step Verification Methodology Card */}
      <div className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-800 rounded-sm p-6 sm:p-8 space-y-5 shadow-xs overflow-hidden min-w-0">
        <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-3">
          <ShieldCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
          <h3 className="font-editorial text-xl font-bold text-stone-950 dark:text-white uppercase tracking-tight break-words">
            The Multi-Step News Verification Pipeline
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-xs font-sans">
          <div className="p-3.5 rounded bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 space-y-1.5 min-w-0">
            <span className="font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider block">
              Step 1: Source Validation
            </span>
            <p className="text-stone-600 dark:text-stone-300 leading-relaxed break-words">
              Feeds are restricted to pre-approved organisations with transparent ownership and verifiable editorial codes.
            </p>
          </div>

          <div className="p-3.5 rounded bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 space-y-1.5 min-w-0">
            <span className="font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider block">
              Step 2: Corroboration
            </span>
            <p className="text-stone-600 dark:text-stone-300 leading-relaxed break-words">
              Significant events require reporting across 2+ independent outlets. Syndicated wire duplicates (e.g. PTI/Reuters copies) are recognized and not double-counted.
            </p>
          </div>

          <div className="p-3.5 rounded bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 space-y-1.5 min-w-0">
            <span className="font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider block">
              Step 3: Fact/Opinion Split
            </span>
            <p className="text-stone-600 dark:text-stone-300 leading-relaxed break-words">
              Strictly segregates verifiable empirical facts from op-eds, political claims, allegations, and editorial predictions.
            </p>
          </div>

          <div className="p-3.5 rounded bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 space-y-1.5 min-w-0">
            <span className="font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider block">
              Step 4: Anti-Misinfo Shield
            </span>
            <p className="text-stone-600 dark:text-stone-300 leading-relaxed break-words">
              Rejects unverified viral claims, anonymous screenshots, unbacked rumors, and sensational clickbait.
            </p>
          </div>

          <div className="p-3.5 rounded bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 space-y-1.5 min-w-0">
            <span className="font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider block">
              Step 5: Status Assignment
            </span>
            <p className="text-stone-600 dark:text-stone-300 leading-relaxed break-words">
              Labels stories as <strong>VERIFIED</strong>, <strong>OFFICIAL STATEMENT</strong>, or <strong>DEVELOPING</strong>. Unverified stories are quarantined.
            </p>
          </div>
        </div>
      </div>

      {/* Directory Search & Filters */}
      <div className="space-y-4 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search source name, owner, or trust..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Country Selector */}
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white"
            >
              {countries.map(c => <option key={c} value={c}>{c === 'All' ? 'All Regions' : c}</option>)}
            </select>

            {/* Type Selector */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white"
            >
              {types.map(t => <option key={t} value={t}>{t === 'All' ? 'All Source Types' : t}</option>)}
            </select>
          </div>
        </div>

        <div className="text-xs text-stone-500">
          Showing <strong>{filteredSources.length}</strong> of <strong>{sources.length}</strong> vetted sources in the directory
        </div>

        {/* Sources Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSources.map(source => (
            <div
              key={source.id}
              className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-sm space-y-3 flex flex-col justify-between shadow-2xs overflow-hidden min-w-0"
            >
              <div className="space-y-2 min-w-0">
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <h4 className="font-editorial font-bold text-base text-stone-950 dark:text-white break-words">
                    {source.name}
                  </h4>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 uppercase shrink-0">
                    {source.country}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-200/80 dark:bg-stone-800 text-stone-800 dark:text-stone-200">
                    {source.sourceType}
                  </span>
                  {source.isStateControlled && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                      State-Controlled
                    </span>
                  )}
                  {source.active && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40">
                      Active Ingestion
                    </span>
                  )}
                </div>

                <div className="text-xs text-stone-600 dark:text-stone-300 space-y-1 pt-1 border-t border-stone-100 dark:border-stone-800 min-w-0">
                  <div className="break-words"><strong>Ownership:</strong> {source.ownership}</div>
                  <div className="break-words"><strong>Funding:</strong> {source.funding}</div>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs gap-2">
                <a
                  href={source.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-amber-800 dark:text-amber-400 hover:underline shrink-0"
                >
                  Official Site <ExternalLink className="w-3 h-3" />
                </a>

                {source.editorialStandardsUrl && (
                  <a
                    href={source.editorialStandardsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:underline truncate"
                  >
                    Standards Code
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};