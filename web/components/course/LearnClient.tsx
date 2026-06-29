'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { StatsGrid } from '@/components/ui/StatsGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { CourseCard } from '@/components/course/CourseCard';
import { CourseFilters, type SortKey } from '@/components/course/CourseFilters';
import { COURSE_PLATFORMS } from '@/lib/types';
import type { Course, CourseCategory } from '@/lib/types';

const SAVED_KEY = 'skillgig.saved_courses.v1';

export function LearnClient({ initialCourses }: { initialCourses: Course[] }) {
  const [category, setCategory] = useState<CourseCategory | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('popular');
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setSavedIds(new Set(arr));
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  function toggleSave(id: string) {
    const course = initialCourses.find((c) => c.id === id);
    setSavedIds((prev) => {
      const next = new Set(prev);
      let msg: string;
      if (next.has(id)) {
        next.delete(id);
        msg = `“${course?.titleId ?? 'Course'}” dihapus dari simpanan`;
      } else {
        next.add(id);
        msg = `“${course?.titleId ?? 'Course'}” disimpan`;
      }
      try {
        localStorage.setItem(SAVED_KEY, JSON.stringify(Array.from(next)));
      } catch { /* ignore quota */ }
      setToast(msg);
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setToast(null), 1800);
      return next;
    });
  }

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
          { label: 'Tersimpan',       value: savedIds.size,         accent: 'from-amber-500 to-amber-600' },
          { label: 'Gratis',          value: freeCount,             accent: 'from-violet-500 to-violet-600' },
        ]}
      />

      {/* Filter bar */}
      <CourseFilters
        active={category}
        onChangeCategory={setCategory}
        sort={sort}
        onChangeSort={setSort}
        resultCount={filtered.length}
      />

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
              saved={savedIds.has(c.id)}
              onToggleSave={toggleSave}
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

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl shadow-2xl bg-slate-900 text-white text-sm font-semibold pointer-events-none">
          ✓ {toast}
        </div>
      )}
    </>
  );
}