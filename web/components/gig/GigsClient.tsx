'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { StatsGrid } from '@/components/ui/StatsGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterPills } from '@/components/ui/FilterPills';
import { GigCard } from '@/components/gig/GigCard';
import { CATEGORIES, LEVELS, type GigCategory, type SkillLevel } from '@/lib/types';
import type { Gig } from '@/lib/types';
import { useSavedStore } from '@/lib/store/savedStore';

type Sort = 'newest' | 'budget-high' | 'budget-low' | 'applicants';

export function GigsClient({ initialGigs }: { initialGigs: Gig[] }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<GigCategory | 'all'>('all');
  const [level, setLevel] = useState<SkillLevel | 'all'>('all');
  const [sort, setSort] = useState<Sort>('newest');
  const [hydrated, setHydrated] = useState(false);
  const savedCount = useSavedStore((s) => s.savedGigs.length);
  const storeHydrated = useSavedStore((s) => s._hasHydrated);

  useEffect(() => {
    setHydrated(true);
  }, []);


  const filtered = useMemo(() => {
    let list = initialGigs.slice();
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
  }, [initialGigs, q, cat, level, sort]);

  function reset() {
    setQ(''); setCat('all'); setLevel('all'); setSort('newest');
  }

  // Stats
  const totalGigs = initialGigs.length;
  const avgBudget =
    initialGigs.length > 0
      ? Math.round(
          initialGigs.reduce((s, g) => s + (g.budgetMin + g.budgetMax) / 2, 0) /
            initialGigs.length,
        )
      : 0;
  const openCategories = new Set(initialGigs.map((g) => g.category)).size;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newThisWeek = initialGigs.filter((g) => +new Date(g.postedAt) >= weekAgo).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <StatsGrid
        cols={4}
        stats={[
          { label: 'Total gigs',  value: totalGigs,      accent: 'from-indigo-500 to-violet-500', icon: '💼' },
          { label: 'Avg budget',  value: 'Rp ' + Math.round(avgBudget / 1_000_000) + ' jt', accent: 'from-emerald-500 to-emerald-600', icon: '💰' },
          { label: 'Kategori',    value: openCategories, accent: 'from-amber-500 to-amber-600', icon: '🏷️' },
          { label: 'Baru 7 hari', value: newThisWeek,    accent: 'from-rose-500 to-rose-600', icon: '🆕' },
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
            {hydrated && storeHydrated && savedCount > 0 && (
              <p className="text-xs text-emerald-700">
                🔖 {savedCount} tersimpan
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
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}