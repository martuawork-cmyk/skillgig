'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterPills } from '@/components/ui/FilterPills';
import { CATEGORIES, type GigCategory } from '@/lib/types';
import { categoryColor, categoryLabel, cn } from '@/lib/utils';
import { addUserSkill, removeUserSkill } from '@/lib/supabase/actions';
import type { CatalogSkill } from '@/lib/supabase/queries';

/**
 * "Tambah Skill" section of /skills.
 *
 * Renders the full skills catalog as a searchable, category-filterable grid.
 * Clicking a card adds (or removes) the skill from the current user's bag:
 *   - Already-in-bag cards show a ✓ "Sudah ditambah" state instead of a plus.
 *   - Anonymous visitors are sent through /login?next=/skills via the
 *     "Login dulu" CTA on each card (browsing itself still works).
 *
 * The grid is purely client-side: data is fetched once on the server and
 * diffed against the user's bag locally. Mutations go through the
 * `addUserSkill` / `removeUserSkill` server actions so RLS stays the source
 * of truth for who can add what.
 */
export function AddSkillGrid({
  catalog,
  ownedIds,
  isAuthenticated,
}: {
  catalog: CatalogSkill[];
  ownedIds: string[];
  isAuthenticated: boolean;
}) {
  const owned = useMemo(() => new Set(ownedIds), [ownedIds]);
  const [bag, setBag] = useState<Set<string>>(owned);
  const [category, setCategory] = useState<GigCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // 300ms debounce on the search input so we don't re-filter on every keystroke.
  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(query.trim()), 300);
    return () => window.clearTimeout(handle);
  }, [query]);

  const visible = useMemo(() => {
    const needle = debounced.toLowerCase();
    return catalog.filter((s) => {
      const matchesCategory = category === 'all' || s.category === category;
      const matchesQuery =
        !needle ||
        s.name.toLowerCase().includes(needle) ||
        categoryLabel(s.category).toLowerCase().includes(needle);
      return matchesCategory && matchesQuery;
    });
  }, [catalog, category, debounced]);

  const searching = debounced.length > 0;

  function toggle(skillId: string) {
    if (!isAuthenticated) return; // CTA button handles redirect
    setError(null);
    setPendingId(skillId);

    const isOwned = bag.has(skillId);
    const next = new Set(bag);
    if (isOwned) next.delete(skillId);
    else next.add(skillId);
    setBag(next); // optimistic

    startTransition(async () => {
      const res = isOwned
        ? await removeUserSkill(skillId)
        : await addUserSkill(skillId, 'beginner');
      setPendingId(null);
      if (!res.ok) {
        // Rollback + surface message.
        setBag(bag);
        setError(res.message);
      }
    });
  }

  if (catalog.length === 0) {
    return (
      <EmptyState
        icon="📚"
        title="Katalog skill masih kosong"
        description="Hubungkan Supabase dan jalankan migration 003_seed.sql."
      />
    );
  }

  return (
    <>
      {/* Search — client-side filter over the catalog (no refetch). */}
      <div className="relative mb-4">
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
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari skill..."
          aria-label="Cari skill"
          className={cn(
            'w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl',
            'focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition',
          )}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <FilterPills<GigCategory | 'all'>
          items={[
            { value: 'all', label: 'Semua' },
            ...CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
          ]}
          active={category}
          onChange={setCategory}
          ariaLabel="Filter katalog skill berdasarkan kategori"
        />
        <span className="text-xs text-slate-500">
          {visible.length} dari {catalog.length} skill
        </span>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-3 px-3 py-2 text-xs font-medium rounded-lg bg-rose-50 text-rose-700 border border-rose-200"
        >
          {error}
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyState
          icon="🔍"
          title={searching ? 'Skill tidak ditemukan' : 'Tidak ada skill di kategori ini'}
          description={
            searching
              ? `Tidak ada skill yang cocok dengan "${debounced}". Coba kata kunci lain.`
              : undefined
          }
          action={
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setCategory('all');
              }}
              className="text-sm text-indigo-600 font-semibold hover:underline"
            >
              {searching ? 'Reset pencarian' : 'Lihat semua skill'} →
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {visible.map((s) => {
            const ownedNow = bag.has(s.id);
            const pending = pendingId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle(s.id)}
                disabled={!isAuthenticated || pending}
                aria-pressed={ownedNow}
                aria-label={
                  ownedNow ? `Hapus ${s.name} dari profil` : `Tambah ${s.name} ke profil`
                }
                className={[
                  'group p-3 rounded-xl border text-left transition',
                  ownedNow
                    ? 'bg-indigo-50 border-indigo-300'
                    : 'bg-white border-slate-200 hover:border-indigo-300',
                  !isAuthenticated || pending ? 'opacity-70 cursor-not-allowed' : '',
                ].join(' ')}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl" aria-hidden>
                    {s.icon ?? '🛠️'}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate text-sm">
                      {s.name}
                    </p>
                    <Badge className={`${categoryColor(s.category)} mt-0.5`}>
                      {categoryLabel(s.category)}
                    </Badge>
                  </div>
                </div>
                <div className="mt-3 text-xs font-semibold">
                  {ownedNow ? (
                    <span className="text-indigo-700">✓ Sudah ditambah</span>
                  ) : isAuthenticated ? (
                    <span className="text-slate-600 group-hover:text-indigo-600">
                      + Tambah ke profil
                    </span>
                  ) : (
                    <span className="text-slate-500">Login dulu untuk tambah</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {!isAuthenticated && (
        <div className="mt-6 text-center">
          <ButtonLink href="/login?next=%2Fskills" variant="primary" size="md">
            Login untuk menambah skill
          </ButtonLink>
        </div>
      )}
    </>
  );
}
