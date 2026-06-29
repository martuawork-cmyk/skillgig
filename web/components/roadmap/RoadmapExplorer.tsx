'use client';

import { useState, useMemo } from 'react';
import { RoadmapTimeline } from './RoadmapTimeline';
import { roadmaps, getRoadmap } from '@/lib/mock/roadmaps';

export function RoadmapExplorer() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const roadmap = selected ? getRoadmap(selected) : null;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return roadmaps;
    return roadmaps.filter((r) => r.skill.toLowerCase().includes(q));
  }, [query]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const exact = getRoadmap(query);
    if (exact) setSelected(exact.skill);
  }

  function pick(skill: string) {
    setSelected(skill);
    setQuery(skill);
    // Scroll to result on mobile
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 200, behavior: 'smooth' });
    }
  }

  function reset() {
    setSelected(null);
    setQuery('');
  }

  return (
    <div className="space-y-6">
      {/* Sticky search bar */}
      <div className="sticky top-16 z-20 -mx-4 px-4 py-3 bg-slate-50/95 backdrop-blur border-b border-slate-200/50">
        <form onSubmit={onSubmit} className="space-y-2">
          <label htmlFor="roadmap-search" className="sr-only">
            Cari skill
          </label>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              id="roadmap-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari skill, contoh: Video Editing, Web Dev…"
              className="w-full pl-10 pr-24 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Suggestion chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            <span className="text-xs text-slate-500 font-semibold shrink-0">Populer:</span>
            {(query ? matches : roadmaps.slice(0, 4)).map((r) => {
              const isActive = r.skill === selected;
              return (
                <button
                  key={r.skill}
                  type="button"
                  onClick={() => pick(r.skill)}
                  className={
                    'shrink-0 px-3 py-1 text-xs font-semibold rounded-full transition active:scale-[.97] ' +
                    (isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-soft'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300 hover:text-indigo-700')
                  }
                >
                  {r.skill}
                </button>
              );
            })}
            {query && matches.length === 0 && (
              <span className="text-xs text-slate-500 italic">Tidak ada match.</span>
            )}
          </div>
        </form>
      </div>

      {/* Result */}
      {roadmap ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-slate-500">
              Menampilkan roadmap untuk{' '}
              <span className="font-bold text-slate-900">{roadmap.skill}</span>
            </p>
            <button
              onClick={reset}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              ← Coba skill lain
            </button>
          </div>
          <RoadmapTimeline roadmap={roadmap} />
        </div>
      ) : (
        <EmptyPickState />
      )}
    </div>
  );
}

function EmptyPickState() {
  return (
    <div className="text-center py-12 sm:py-16 px-4">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 grid place-items-center text-3xl mb-4">
        🗺️
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">
        Pilih skill untuk lihat roadmap
      </h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
        Dari &ldquo;belum bisa apa-apa&rdquo; sampai &ldquo;bisa menghasilkan&rdquo; &mdash; 4 langkah visual
        dengan skill, kursus, gig, dan estimasi pendapatan.
      </p>
    </div>
  );
}