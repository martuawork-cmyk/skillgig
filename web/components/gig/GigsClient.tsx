'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody } from '@/components/ui/Card';
import { StatsGrid } from '@/components/ui/StatsGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterPills } from '@/components/ui/FilterPills';
import { ViewToggle } from '@/components/ui/ViewToggle';
import { GigCard } from '@/components/gig/GigCard';
import { GigListItem } from '@/components/gig/GigListItem';
import { useViewPreference, limitForView } from '@/lib/hooks/useViewPreference';
import {
  CATEGORIES,
  LEVELS,
  JOB_TYPES,
  type GigCategory,
  type GigJobType,
  type SkillLevel,
} from '@/lib/types';
import type { Gig } from '@/lib/types';
import { useSavedStore } from '@/lib/store/savedStore';
import { cn } from '@/lib/utils';

type Sort = 'newest' | 'budget-high' | 'budget-low' | 'applicants';

// Shared styling for the mobile dropdown selects (mirrors /jobs). Active
// filters get an indigo ring so the user can see what's applied at a glance.
const gigSelectCls =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 font-medium ' +
  'outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition cursor-pointer';

export function GigsClient({
  initialGigs,
  activeJobType = 'all',
}: {
  initialGigs: Gig[];
  /** Server-driven (URL ?job_type=) job-type filter — see /gigs page. */
  activeJobType?: GigJobType | 'all';
}) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<GigCategory | 'all'>('all');
  const [level, setLevel] = useState<SkillLevel | 'all'>('all');
  const [sort, setSort] = useState<Sort>('newest');
  const [hydrated, setHydrated] = useState(false);
  // List ⇄ Grid view — shared preference persisted to localStorage.
  const { view, setView } = useViewPreference();
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

  // Per-mode item cap: grid shows 12, list shows 15 (see useViewPreference).
  const shown = limitForView(filtered, view);

  // The job-type filter is URL-driven (shareable ?job_type=) and resolved
  // server-side, so changing it navigates rather than mutating local state.
  // 'all' clears the param.
  function onChangeJobType(value: GigJobType | 'all') {
    router.push(value === 'all' ? '/gigs' : `/gigs?job_type=${encodeURIComponent(value)}`);
  }

  function reset() {
    setQ(''); setCat('all'); setLevel('all'); setSort('newest');
    if (activeJobType !== 'all') router.push('/gigs');
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
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Cari gigs berdasarkan judul, skill, atau deskripsi"
              placeholder="Cari gigs berdasarkan judul, skill, atau deskripsi..."
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            aria-label="Urutkan gigs"
            className="px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="newest">Terbaru</option>
            <option value="budget-high">Budget tertinggi</option>
            <option value="budget-low">Budget terendah</option>
            <option value="applicants">Paling banyak pelamar</option>
          </select>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* MOBILE filters — compact <select> dropdowns (below md / 768px).
            A wall of chips wraps awkwardly on phones, so on small screens we
            swap the chip sidebar for three tidy dropdowns. Desktop keeps the
            chip sidebar further below. */}
        <Card className="md:hidden">
          <CardBody className="space-y-3">
            <div>
              <label htmlFor="gig-filter-cat" className="block text-xs font-bold text-slate-900 mb-1.5">
                Kategori
              </label>
              <select
                id="gig-filter-cat"
                value={cat}
                onChange={(e) => setCat(e.target.value as GigCategory | 'all')}
                aria-label="Filter gigs berdasarkan kategori"
                className={cn(gigSelectCls, cat !== 'all' && 'border-indigo-300 ring-1 ring-indigo-200')}
              >
                <option value="all">Semua</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="gig-filter-level" className="block text-xs font-bold text-slate-900 mb-1.5">
                Level
              </label>
              <select
                id="gig-filter-level"
                value={level}
                onChange={(e) => setLevel(e.target.value as SkillLevel | 'all')}
                aria-label="Filter gigs berdasarkan level"
                className={cn(gigSelectCls, level !== 'all' && 'border-indigo-300 ring-1 ring-indigo-200')}
              >
                <option value="all">Semua level</option>
                {LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="gig-filter-type" className="block text-xs font-bold text-slate-900 mb-1.5">
                Tipe Kerja
              </label>
              <select
                id="gig-filter-type"
                value={activeJobType}
                onChange={(e) => onChangeJobType(e.target.value as GigJobType | 'all')}
                aria-label="Filter gigs berdasarkan tipe kerja"
                className={cn(gigSelectCls, activeJobType !== 'all' && 'border-indigo-300 ring-1 ring-indigo-200')}
              >
                <option value="all">Semua</option>
                {JOB_TYPES.map((j) => (
                  <option key={j.value} value={j.value}>{j.label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={reset}
              className="w-full text-xs font-medium text-slate-500 hover:text-slate-700 py-1.5"
            >
              Reset filter
            </button>
          </CardBody>
        </Card>

        {/* DESKTOP filters — chip sidebar (md and up). Pills stay as-is. */}
        <aside className="hidden md:block md:col-span-1">
          <Card>
            <CardBody className="space-y-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900 mb-2">Kategori</h2>
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
                <h2 className="text-sm font-bold text-slate-900 mb-2">Level</h2>
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

              <div className="pt-4 border-t border-slate-100">
                <h2 className="text-sm font-bold text-slate-900 mb-2">Tipe Kerja</h2>
                <FilterPills<GigJobType | 'all'>
                  items={[
                    { value: 'all', label: 'Semua' },
                    ...JOB_TYPES.map((j) => ({ value: j.value, label: j.label })),
                  ]}
                  active={activeJobType}
                  onChange={onChangeJobType}
                  ariaLabel="Filter gigs berdasarkan tipe kerja"
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
        <div className="md:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{filtered.length}</span> gigs ditemukan
            </p>
            <div className="flex items-center gap-3">
              {hydrated && storeHydrated && savedCount > 0 && (
                <p className="text-xs text-emerald-700">
                  🔖 {savedCount} tersimpan
                </p>
              )}
              <ViewToggle view={view} onChange={setView} />
            </div>
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
          ) : view === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {shown.map((g) => (
                <GigCard
                  key={g.id}
                  gig={g}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {shown.map((g) => (
                <GigListItem key={g.id} gig={g} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}