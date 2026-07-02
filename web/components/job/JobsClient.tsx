'use client';

import { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { ViewToggle } from '@/components/ui/ViewToggle';
import { JobCard } from '@/components/job/JobCard';
import { JobListItem } from '@/components/job/JobListItem';
import { useViewPreference, limitForView } from '@/lib/hooks/useViewPreference';
import type { Gig, GigCategory, GigJobType, SkillLevel } from '@/lib/types';
import { JOB_BOARD_TYPES, JOB_LEVELS, JOB_CATEGORIES } from '@/lib/job-utils';
import { cn } from '@/lib/utils';

type CatFilter = GigCategory | 'all';
type TypeFilter = GigJobType | 'all';
type LevelFilter = SkillLevel | 'all';

type Option<V extends string> = { value: V; label: string };

const selectCls =
  'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 font-medium ' +
  'outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition cursor-pointer';

/**
 * Client-side controller for the /jobs board. Owns the centered search input, a
 * compact dropdown filter bar (Tipe / Kategori / Level), a List ⇄ Grid view
 * toggle, and the results. All filtering is in-memory on the server-fetched
 * list — job_type is already constrained server-side via getJobs(), so the
 * dropdowns just narrow the visible set further.
 */
export function JobsClient({ initialJobs }: { initialJobs: Gig[] }) {
  const [q, setQ] = useState('');
  const [type, setType] = useState<TypeFilter>('all');
  const [cat, setCat] = useState<CatFilter>('all');
  const [level, setLevel] = useState<LevelFilter>('all');
  const { view, setView } = useViewPreference();

  const typeOptions: Option<TypeFilter>[] = [
    { value: 'all', label: 'Semua tipe' },
    ...JOB_BOARD_TYPES.map((t) => ({ value: t, label: t })),
  ];
  const catOptions: Option<CatFilter>[] = [
    { value: 'all', label: 'Semua kategori' },
    ...JOB_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
  ];
  const levelOptions: Option<LevelFilter>[] = [
    { value: 'all', label: 'Semua level' },
    ...JOB_LEVELS.map((l) => ({ value: l.value, label: l.label })),
  ];

  const filtered = useMemo(() => {
    let list = initialJobs.slice();
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter(
        (g) =>
          g.titleId.toLowerCase().includes(needle) ||
          g.descriptionId.toLowerCase().includes(needle) ||
          g.skillsRequired.some((s) => s.toLowerCase().includes(needle)) ||
          (g.company ?? '').toLowerCase().includes(needle),
      );
    }
    if (type !== 'all') list = list.filter((g) => g.jobType === type);
    if (cat !== 'all') list = list.filter((g) => g.category === cat);
    if (level !== 'all') list = list.filter((g) => g.level === level);
    return list;
  }, [initialJobs, q, type, cat, level]);

  // Per-mode item cap: grid shows 12, list shows 15 (see useViewPreference).
  const shown = limitForView(filtered, view);

  const reset = () => {
    setQ('');
    setType('all');
    setCat('all');
    setLevel('all');
  };

  const hasActiveFilter = q.trim() !== '' || type !== 'all' || cat !== 'all' || level !== 'all';

  return (
    <div className="space-y-6">
      {/* Centered search */}
      <div className="relative max-w-2xl mx-auto">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
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
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Cari lowongan berdasarkan judul, perusahaan, atau skill"
          placeholder="Cari lowongan, perusahaan, atau skill..."
          className="w-full pl-12 pr-4 py-3.5 text-sm bg-white border border-slate-200 rounded-2xl shadow-soft focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition"
        />
      </div>

      {/* Compact dropdown filter bar + view toggle */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as TypeFilter)}
            aria-label="Filter tipe lowongan"
            className={cn(selectCls, type !== 'all' && 'border-indigo-300 ring-1 ring-indigo-200')}
          >
            {typeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value as CatFilter)}
            aria-label="Filter kategori lowongan"
            className={cn(selectCls, cat !== 'all' && 'border-indigo-300 ring-1 ring-indigo-200')}
          >
            {catOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as LevelFilter)}
            aria-label="Filter level lowongan"
            className={cn(selectCls, level !== 'all' && 'border-indigo-300 ring-1 ring-indigo-200')}
          >
            {levelOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-indigo-700"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Reset
            </button>
          )}
        </div>

        {/* View toggle — preference is persisted via useViewPreference */}
        <ViewToggle view={view} onChange={setView} />
      </div>

      {/* Result count */}
      <p className="text-sm text-slate-700">
        <span className="font-bold text-slate-900">{filtered.length}</span> lowongan ditemukan
      </p>

      {/* Results */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="Tidak ada lowongan yang cocok dengan filter."
          description="Coba ubah atau reset filter untuk melihat lebih banyak lowongan."
          action={
            <button
              onClick={reset}
              className="text-sm text-indigo-600 font-semibold hover:underline"
            >
              Reset filter
            </button>
          }
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {shown.map((g) => (
            <JobCard key={g.id} gig={g} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {shown.map((g) => (
            <JobListItem key={g.id} gig={g} />
          ))}
        </div>
      )}
    </div>
  );
}
