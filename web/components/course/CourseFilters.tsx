'use client';

import { COURSE_CATEGORIES, type CourseCategory } from '@/lib/types';
import { cn } from '@/lib/utils';

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
      {/* Category pills */}
      <div className="flex flex-wrap items-center gap-2">
        {COURSE_CATEGORIES.map((c) => {
          const isActive = c.value === active;
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => onChangeCategory(c.value)}
              className={cn(
                'px-3.5 py-1.5 text-sm font-semibold rounded-full transition active:scale-[.97]',
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-soft'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300 hover:text-indigo-700',
              )}
              aria-pressed={isActive}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Sort + count */}
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