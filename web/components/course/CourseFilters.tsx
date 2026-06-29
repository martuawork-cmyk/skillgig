'use client';

import { FilterPills } from '@/components/ui/FilterPills';
import { COURSE_CATEGORIES, type CourseCategory } from '@/lib/types';

export type SortKey = 'popular' | 'newest';

type Props = {
  active: CourseCategory | 'all';
  onChangeCategory: (cat: CourseCategory | 'all') => void;
  sort: SortKey;
  onChangeSort: (sort: SortKey) => void;
  resultCount: number;
};

export function CourseFilters({
  active,
  onChangeCategory,
  sort,
  onChangeSort,
  resultCount,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <FilterPills<CourseCategory | 'all'>
        items={COURSE_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
        active={active}
        onChange={onChangeCategory}
        ariaLabel="Filter kursus berdasarkan kategori"
      />

      <div className="flex items-center gap-3 shrink-0">
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-900">{resultCount}</span> course
        </p>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <span className="hidden sm:inline">Sort:</span>
          <select
            value={sort}
            onChange={(e) => onChangeSort(e.target.value as SortKey)}
            className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="popular">Terpopuler</option>
            <option value="newest">Terbaru</option>
          </select>
        </label>
      </div>
    </div>
  );
}