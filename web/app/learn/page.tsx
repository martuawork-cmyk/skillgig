'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { CourseCard } from '@/components/course/CourseCard';
import { CourseFilters, type SortKey } from '@/components/course/CourseFilters';
import { courses } from '@/lib/mock';
import { COURSE_PLATFORMS } from '@/lib/types';
import type { CourseCategory } from '@/lib/types';

const SAVED_KEY = 'skillgig.saved_courses.v1';

export default function LearnPage() {
  const [category, setCategory] = useState<CourseCategory | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('popular');
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  // Load saved IDs from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setSavedIds(new Set(arr));
      }
    } catch {
      /* ignore */
    }
  }, []);

  function toggleSave(id: string) {
    const course = courses.find((c) => c.id === id);
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
      // Persist + toast
      try {
        localStorage.setItem(SAVED_KEY, JSON.stringify(Array.from(next)));
      } catch {
        /* ignore quota */
      }
      setToast(msg);
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setToast(null), 1800);
      return next;
    });
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  // Filter + sort
  const filtered = useMemo(() => {
    let list = courses.slice();
    if (category !== 'all') list = list.filter((c) => c.category === category);
    if (sort === 'popular') {
      list.sort((a, b) => b.students - a.students);
    } else {
      list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }
    return list;
  }, [category, sort]);

  const enrolledCount = courses.filter((c) => c.enrolled).length;
  const savedCount = savedIds.size;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <header>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-2">
          <span>📚</span> STEP 1 OF 5
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Belajar skill digital
        </h1>
        <p className="mt-2 text-slate-600 max-w-2xl">
          Pilih kursus dari platform favoritmu. Filter berdasarkan kategori dan urutkan
          sesuai kebutuhan.
        </p>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label="Total kursus" value={courses.length} />
        <StatTile label="Lagi dipelajari" value={enrolledCount} accent="from-emerald-500 to-emerald-600" />
        <StatTile label="Tersimpan" value={savedCount} accent="from-amber-500 to-amber-600" />
        <StatTile label="Gratis" value={courses.filter((c) => c.price === 0).length} accent="from-violet-500 to-violet-600" />
      </div>

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
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-slate-500">Tidak ada kursus untuk kategori ini.</p>
            <button
              onClick={() => setCategory('all')}
              className="mt-3 text-sm text-indigo-600 font-semibold hover:underline"
            >
              Lihat semua kursus →
            </button>
          </CardBody>
        </Card>
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

      {/* Platform legend (small helper) */}
      <Card>
        <CardBody className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-semibold text-slate-700">Platform:</span>
          {Object.entries(COURSE_PLATFORMS).map(([p, color]) => (
            <span key={p} className="inline-flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${color.split(' ')[0]}`} />
              {p}
            </span>
          ))}
        </CardBody>
      </Card>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl shadow-2xl bg-slate-900 text-white text-sm font-semibold pointer-events-none">
          ✓ {toast}
        </div>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="px-4 py-3 bg-white border border-slate-200 rounded-xl">
      <div
        className={`w-8 h-8 rounded-lg mb-2 ${accent ? `bg-gradient-to-br ${accent}` : 'bg-gradient-to-br from-indigo-500 to-violet-500'}`}
      />
      <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
        {label}
      </p>
      <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{value}</p>
    </div>
  );
}