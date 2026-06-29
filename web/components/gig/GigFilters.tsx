'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { StatsGrid } from '@/components/ui/StatsGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterPills } from '@/components/ui/FilterPills';
import { GigCard } from '@/components/gig/GigCard';
import { gigs } from '@/lib/mock';
import { CATEGORIES, LEVELS, type GigCategory, type SkillLevel } from '@/lib/types';

type Sort = 'newest' | 'budget-high' | 'budget-low' | 'applicants';

const SAVED_GIGS_KEY = 'skillgig.saved_gigs.v1';

export function GigFilters() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<GigCategory | 'all'>('all');
  const [level, setLevel] = useState<SkillLevel | 'all'>('all');
  const [sort, setSort] = useState<Sort>('newest');
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => new Set());
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_GIGS_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setBookmarkedIds(new Set(arr));
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  function toggleBookmark(id: string) {
    const gig = gigs.find((g) => g.id === id);
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      let msg: string;
      if (next.has(id)) {
        next.delete(id);
        msg = `“${gig?.titleId ?? 'Gig'}” dihapus dari bookmark`;
      } else {
        next.add(id);
        msg = `“${gig?.titleId ?? 'Gig'}” disimpan`;
      }
      try {
        localStorage.setItem(SAVED_GIGS_KEY, JSON.stringify(Array.from(next)));
      } catch { /* ignore quota */ }
      setToast(msg);
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setToast(null), 1800);
      return next;
    });
  }

  const filtered = useMemo(() => {
    let list = [...gigs];
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter(
        (g) =>
          g.titleId.toLowerCase().includes(needle) ||
          g.descriptionId.toLowerCase().includes(needle) ||
          g.skillsRequired.some((s) => s.toLowerCase().includes(needle)),
      );
    }
    if (cat !== 'all') list = list.filter((g) => g.category === cat);
    if (level !== 'all') list = list.filter((g) => g.level === level);

    switch (sort) {
      case 'budget-high': list.sort((a, b) => b.budgetMax - a.budgetMax); break;
      case 'budget-low':  list.sort((a, b) => a.budgetMin - b.budgetMin); break;
      case 'applicants':  list.sort((a, b) => b.applicantsCount - a.applicantsCount); break;
      default:            list.sort((a, b) => +new Date(b.postedAt) - +new Date(a.postedAt));
    }
    return list;
  }, [q, cat, level, sort]);

  function reset() {
    setQ(''); setCat('all'); setLevel('all'); setSort('newest');
  }

  // Stats
  const totalGigs = gigs.length;
  const avgBudget = Math.round(
    gigs.reduce((s, g) => s + (g.budgetMin + g.budgetMax) / 2, 0) / gigs.length,
  );
  const openCategories = new Set(gigs.map((g) => g.category)).size;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newThisWeek = gigs.filter((g) => +new Date(g.postedAt) >= weekAgo).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <StatsGrid
        cols={4}
        stats={[
          { label: 'Total gigs',    value: totalGigs,       accent: 'from-indigo-500 to-violet-500', icon: '💼' },
          { label: 'Avg budget',    value: 'Rp ' + Math.round(avgBudget / 1_000_000) + ' jt', accent: 'from-emerald-500 to-emerald-600', icon: '💰' },
          { label: 'Kategori',      value: openCategories,  accent: 'from-amber-500 to-amber-600', icon: '🏷️' },
          { label: 'Baru 7 hari',   value: newThisWeek,     accent: 'from-rose-500 to-rose-600', icon: '🆕' },
        ]}
      />

      {/* Search + Sort bar */}
      <Card>
        <CardBody className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari gigs berdasarkan judul, skill, atau deskripsi..."
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="newest">Terbaru</option>
            <option value="budget-high">Budget tertinggi</option>
            <option value="budget-low">Budget terendah</option>
            <option value="applicants">Paling banyak pelamar</option>
          </select>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <aside className="lg:col-span-1 space-y-4">
          <Card>
            <CardBody className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">Kategori</h3>
                <FilterPills<GigCategory | 'all'>
                  items={[
                    { value: 'all', label: 'Semua' },
                    ...CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
                  ]}
                  active={cat}
                  onChange={setCat}
                  ariaLabel="Filter gigs berdasarkan kategori"
                  className="flex-col items-stretch [&>button]:w-full [&>button]:text-left"
                />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Level</h3>
                <FilterPills<SkillLevel | 'all'>
                  items={[
                    { value: 'all', label: 'Semua level' },
                    ...LEVELS.map((l) => ({ value: l.value, label: l.label })),
                  ]}
                  active={level}
                  onChange={setLevel}
                  ariaLabel="Filter gigs berdasarkan level"
                  className="flex-col items-stretch [&>button]:w-full [&>button]:text-left"
                />
              </div>

              <button
                onClick={reset}
                className="w-full text-xs font-medium text-slate-500 hover:text-slate-700 py-2"
              >
                Reset filter
              </button>
            </CardBody>
          </Card>
        </aside>

        {/* Results */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{filtered.length}</span> gigs ditemukan
            </p>
            {bookmarkedIds.size > 0 && (
              <p className="text-xs text-emerald-700">
                🔖 {bookmarkedIds.size} tersimpan
              </p>
            )}
          </div>
          {filtered.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="Tidak ada gig yang cocok dengan filter."
              action={
                <button onClick={reset} className="text-sm text-indigo-600 font-semibold hover:underline">
                  Reset filter
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((g) => (
                <GigCard
                  key={g.id}
                  gig={g}
                  bookmarked={bookmarkedIds.has(g.id)}
                  onToggleBookmark={toggleBookmark}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl shadow-2xl bg-slate-900 text-white text-sm font-semibold pointer-events-none">
          ✓ {toast}
        </div>
      )}
    </div>
  );
}