'use client';

import { useMemo, useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { GigCard } from '@/components/gig/GigCard';
import { gigs } from '@/lib/mock';
import { CATEGORIES, LEVELS, type GigCategory, type SkillLevel } from '@/lib/types';

type Sort = 'newest' | 'budget-high' | 'budget-low' | 'applicants';

export function GigFilters() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<GigCategory | 'all'>('all');
  const [level, setLevel] = useState<SkillLevel | 'all'>('all');
  const [sort, setSort] = useState<Sort>('newest');

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

  return (
    <div className="space-y-6">
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
            <CardBody className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">Kategori</h3>
                <div className="space-y-1.5">
                  <FilterButton active={cat === 'all'} onClick={() => setCat('all')}>
                    Semua
                  </FilterButton>
                  {CATEGORIES.map((c) => (
                    <FilterButton
                      key={c.value}
                      active={cat === c.value}
                      onClick={() => setCat(c.value)}
                    >
                      {c.label}
                    </FilterButton>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Level</h3>
                <div className="space-y-1.5">
                  <FilterButton active={level === 'all'} onClick={() => setLevel('all')}>
                    Semua level
                  </FilterButton>
                  {LEVELS.map((l) => (
                    <FilterButton
                      key={l.value}
                      active={level === l.value}
                      onClick={() => setLevel(l.value)}
                    >
                      {l.label}
                    </FilterButton>
                  ))}
                </div>
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
          </div>
          {filtered.length === 0 ? (
            <Card>
              <CardBody className="text-center py-12">
                <p className="text-slate-500">Tidak ada gig yang cocok dengan filter.</p>
                <button onClick={reset} className="mt-3 text-sm text-indigo-600 hover:underline">
                  Reset filter
                </button>
              </CardBody>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((g) => (
                <GigCard key={g.id} gig={g} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        'w-full text-left px-3 py-1.5 text-sm rounded-lg transition ' +
        (active
          ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold'
          : 'text-slate-700 hover:bg-slate-100')
      }
    >
      {children}
    </button>
  );
}