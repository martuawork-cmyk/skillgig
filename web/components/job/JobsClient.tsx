'use client';

import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { JobCard } from '@/components/job/JobCard';
import type { Gig, GigCategory, GigJobType, SkillLevel } from '@/lib/types';
import { JOB_BOARD_TYPES, JOB_LEVELS, JOB_CATEGORIES } from '@/lib/job-utils';
import { cn } from '@/lib/utils';

type CatFilter = GigCategory | 'all';
type TypeFilter = GigJobType | 'all';
type LevelFilter = SkillLevel | 'all';

type ChipItem<V extends string> = { value: V; label: string };

/**
 * Client-side controller for the /jobs board. Owns the centered search input,
 * the three horizontal-scroll filter chip rows (Tipe / Kategori / Level), and
 * the results grid. All filtering is in-memory on the server-fetched list —
 * job_type is already constrained server-side via getJobs(), so the chips just
 * narrow the visible set further.
 */
export function JobsClient({ initialJobs }: { initialJobs: Gig[] }) {
  const [q, setQ] = useState('');
  const [type, setType] = useState<TypeFilter>('all');
  const [cat, setCat] = useState<CatFilter>('all');
  const [level, setLevel] = useState<LevelFilter>('all');

  const typeItems: ChipItem<TypeFilter>[] = [
    { value: 'all', label: 'Semua' },
    ...JOB_BOARD_TYPES.map((t) => ({ value: t, label: t })),
  ];
  const catItems: ChipItem<CatFilter>[] = [
    { value: 'all', label: 'Semua' },
    ...JOB_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
  ];
  const levelItems: ChipItem<LevelFilter>[] = [
    { value: 'all', label: 'Semua' },
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

  const reset = () => {
    setQ('');
    setType('all');
    setCat('all');
    setLevel('all');
  };

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

      {/* Filter chip rows — horizontal scroll on narrow screens */}
      <div className="space-y-3">
        <ChipRow label="Tipe" items={typeItems} active={type} onChange={setType} />
        <ChipRow label="Kategori" items={catItems} active={cat} onChange={setCat} />
        <ChipRow label="Level" items={levelItems} active={level} onChange={setLevel} />
      </div>

      {/* Result count */}
      <p className="text-sm text-slate-600">
        <span className="font-semibold text-slate-900">{filtered.length}</span> lowongan ditemukan
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="Tidak ada lowongan yang cocok dengan filter."
          action={
            <button
              onClick={reset}
              className="text-sm text-indigo-600 font-semibold hover:underline"
            >
              Reset filter
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((g) => (
            <JobCard key={g.id} gig={g} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * A single labelled row of selectable chips. Wraps horizontally with a hidden
 * scrollbar so it reads as a clean strip on mobile and a normal wrap on wider
 * screens. Built locally (rather than reusing FilterPills) because FilterPills
 * hard-codes `flex-wrap`, which conflicts with the horizontal-scroll layout
 * the spec calls for.
 */
function ChipRow<V extends string>({
  label,
  items,
  active,
  onChange,
}: {
  label: string;
  items: ChipItem<V>[];
  active: V;
  onChange: (value: V) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 mb-1.5 px-1">{label}</p>
      <div
        role="group"
        aria-label={`Filter lowongan berdasarkan ${label.toLowerCase()}`}
        className="flex gap-2 overflow-x-auto pb-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => {
          const isActive = item.value === active;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange(item.value)}
              aria-pressed={isActive}
              className={cn(
                'shrink-0 whitespace-nowrap px-3.5 py-1.5 text-sm font-semibold rounded-full transition active:scale-[.97]',
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-soft'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300 hover:text-indigo-700',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
