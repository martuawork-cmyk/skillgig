'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { StatsGrid } from '@/components/ui/StatsGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterPills } from '@/components/ui/FilterPills';
import { EarnGigCard } from '@/components/earn/EarnGigCard';
import { CATEGORIES, type GigCategory, type GigPlatform } from '@/lib/types';
import { formatIDR } from '@/lib/utils';
import type { Gig } from '@/lib/types';

type BudgetBucket = 'all' | 'under-5' | '5-10' | '10-20' | 'over-20';

const BUDGET_BUCKETS: { value: BudgetBucket; label: string }[] = [
  { value: 'all',      label: 'Semua' },
  { value: 'under-5',  label: '< Rp 5jt' },
  { value: '5-10',     label: '5–10jt' },
  { value: '10-20',    label: '10–20jt' },
  { value: 'over-20',  label: '> 20jt' },
];

const PLATFORM_OPTIONS: { value: GigPlatform | 'all'; label: string }[] = [
  { value: 'all',             label: 'Semua platform' },
  { value: 'Upwork',          label: 'Upwork' },
  { value: 'Fiverr',          label: 'Fiverr' },
  { value: 'Projects.co.id',  label: 'Projects.co.id' },
  { value: 'Sribulancer',     label: 'Sribulancer' },
];

export function EarnClient({ initialGigs }: { initialGigs: Gig[] }) {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<GigCategory | 'all'>('all');
  const [platform, setPlatform] = useState<GigPlatform | 'all'>('all');
  const [budget, setBudget] = useState<BudgetBucket>('all');
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  function handleApply(id: string) {
    const gig = initialGigs.find((g) => g.id === id);
    setToast(`Lamaran untuk “${gig?.titleId ?? 'Gig'}” terkirim!`);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1800);
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return initialGigs.filter((g) => {
      if (needle) {
        const hay =
          g.titleId.toLowerCase() +
          ' ' +
          g.descriptionId.toLowerCase() +
          ' ' +
          g.skillsRequired.join(' ').toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (category !== 'all' && g.category !== category) return false;
      if (platform !== 'all' && g.platform !== platform) return false;
      // Budget bucket matches if any part of the range falls in
      if (budget !== 'all') {
        switch (budget) {
          case 'under-5':  if (g.budgetMin >= 5_000_000) return false; break;
          case '5-10':     if (g.budgetMax < 5_000_000 || g.budgetMin > 10_000_000) return false; break;
          case '10-20':    if (g.budgetMax < 10_000_000 || g.budgetMin > 20_000_000) return false; break;
          case 'over-20':  if (g.budgetMax < 20_000_000) return false; break;
        }
      }
      return true;
    });
  }, [initialGigs, q, category, platform, budget]);

  function reset() {
    setQ(''); setCategory('all'); setPlatform('all'); setBudget('all');
  }

  // Stats
  const totalGigs = initialGigs.length;
  const totalBudget = initialGigs.reduce((s, g) => s + (g.budgetMin + g.budgetMax) / 2, 0);
  const avgBudget = totalGigs > 0 ? totalBudget / totalGigs : 0;
  const platformCount = new Set(initialGigs.map((g) => g.platform)).size;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <StatsGrid
        cols={3}
        stats={[
          { label: 'Gigs tersedia', value: totalGigs,        accent: 'from-indigo-500 to-violet-500', icon: '💼' },
          { label: 'Avg budget',    value: formatIDR(Math.round(avgBudget)), accent: 'from-emerald-500 to-emerald-600', icon: '💰' },
          { label: 'Platform',      value: platformCount,   accent: 'from-amber-500 to-amber-600', icon: '🌐' },
        ]}
      />

      {/* Search bar */}
      <Card>
        <CardBody className="p-3 sm:p-4">
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
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari gig berdasarkan judul, skill, atau deskripsi..."
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
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
        </CardBody>
      </Card>

      {/* Filter rows */}
      <div className="space-y-3">
        {/* Platform pills */}
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-500 font-bold mb-1.5">
            Platform
          </p>
          <FilterPills<GigPlatform | 'all'>
            items={PLATFORM_OPTIONS}
            active={platform}
            onChange={setPlatform}
            ariaLabel="Filter gig berdasarkan platform"
          />
        </div>

        {/* Category pills */}
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-500 font-bold mb-1.5">
            Kategori
          </p>
          <FilterPills<GigCategory | 'all'>
            items={[
              { value: 'all', label: 'Semua' },
              ...CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
            ]}
            active={category}
            onChange={setCategory}
            ariaLabel="Filter gig berdasarkan kategori"
          />
        </div>

        {/* Budget pills */}
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-500 font-bold mb-1.5">
            Budget
          </p>
          <FilterPills<BudgetBucket>
            items={BUDGET_BUCKETS}
            active={budget}
            onChange={setBudget}
            ariaLabel="Filter gig berdasarkan budget"
          />
        </div>
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between pt-1">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{filtered.length}</span> gig ditemukan
        </p>
        {(q || category !== 'all' || platform !== 'all' || budget !== 'all') && (
          <button
            onClick={reset}
            className="text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            Reset filter
          </button>
        )}
      </div>

      {/* Grid */}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((g) => (
            <EarnGigCard
              key={g.id}
              gig={g}
              onApply={handleApply}
            />
          ))}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl shadow-2xl bg-slate-900 text-white text-sm font-semibold pointer-events-none">
          ✓ {toast}
        </div>
      )}
    </div>
  );
}