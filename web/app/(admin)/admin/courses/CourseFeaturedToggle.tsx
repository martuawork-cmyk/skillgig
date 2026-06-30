'use client';

import { useTransition } from 'react';
import { toggleCourseFeaturedAction } from './actions';

/**
 * Star toggle for the `featured` boolean. Off by default; on → gives the
 * course a "featured" badge on /learn.
 */
export function CourseFeaturedToggle({
  id,
  featured,
}: {
  id: string;
  featured: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const onToggle = () => {
    const next = !featured;
    startTransition(async () => {
      await toggleCourseFeaturedAction(id, next);
    });
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isPending}
      aria-pressed={featured}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
        featured
          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      } ${isPending ? 'opacity-60' : ''}`}
    >
      <span aria-hidden>{featured ? '★' : '☆'}</span>
      <span>{featured ? 'Featured' : 'Set featured'}</span>
    </button>
  );
}
