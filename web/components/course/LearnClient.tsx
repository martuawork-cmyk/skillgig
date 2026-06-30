'use client';

import { useEffect, useMemo, useState } from 'react';
import { StatsGrid } from '@/components/ui/StatsGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { CourseCard } from '@/components/course/CourseCard';
import { CourseFilters, type SortKey } from '@/components/course/CourseFilters';
import { SubscriberForm } from '@/components/subscriber/SubscriberForm';
import { COURSE_PLATFORMS } from '@/lib/types';
import type { Course, CourseCategory } from '@/lib/types';
import { useSavedStore } from '@/lib/store/savedStore';

export function LearnClient({ initialCourses }: { initialCourses: Course[] }) {
  const [category, setCategory] = useState<CourseCategory | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('popular');
  const [hydrated, setHydrated] = useState(false);
  const savedCount = useSavedStore((s) => s.savedCourses.length);
  const storeHydrated = useSavedStore((s) => s._hasHydrated);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const filtered = useMemo(() => {
    let list = initialCourses.slice();
    if (category !== 'all') list = list.filter((c) => c.category === category);
    if (sort === 'popular') list.sort((a, b) => b.students - a.students);
    else list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return list;
  }, [initialCourses, category, sort]);

  const enrolledCount = initialCourses.filter((c) => c.enrolled).length;
  const freeCount = initialCourses.filter((c) => c.price === 0).length;

  return (
    <>
      {/* Stats */}
      <StatsGrid
        stats={[
          { label: 'Total kursus',    value: initialCourses.length, accent: 'from-indigo-500 to-violet-500' },
          { label: 'Lagi dipelajari', value: enrolledCount,         accent: 'from-emerald-500 to-emerald-600' },
          { label: 'Tersimpan',       value: hydrated && storeHydrated ? savedCount : '—', accent: 'from-amber-500 to-amber-600' },
          { label: 'Gratis',          value: freeCount,             accent: 'from-violet-500 to-violet-600' },
        ]}
      />

      {/* Newsletter opt-in */}
      <SubscriberForm />

      {/* Filter bar */}
      <CourseFilters
        active={category}
        onChangeCategory={setCategory}
        sort={sort}
        onChangeSort={setSort}
        resultCount={filtered.length}
      />

      {/* Section heading for the results grid — keeps heading order
          h1 → h2 → h3 (CourseCard titles are h3). Visually hidden, announced
          to assistive tech. */}
      <h2 className="sr-only">Daftar kursus</h2>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="Tidak ada kursus untuk kategori ini."
          action={
            <button
              onClick={() => setCategory('all')}
              className="text-sm text-indigo-600 font-semibold hover:underline"
            >
              Lihat semua kursus →
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
            />
          ))}
        </div>
      )}

      {/* Platform legend */}
      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1 px-1">
        <span className="font-semibold text-slate-700">Platform:</span>
        {Object.entries(COURSE_PLATFORMS).map(([p, color]) => (
          <span key={p} className="inline-flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${color.split(' ')[0]}`} />
            {p}
          </span>
        ))}
      </div>
    </>
  );
}