'use client';

import { useTransition } from 'react';
import { setGigStatusAction } from './actions';

const STATUSES = [
  { value: 'draft',     label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'expired',   label: 'Expired' },
] as const;

type Status = (typeof STATUSES)[number]['value'];

/**
 * Inline segmented status toggle. Updates the gig's `status` column via the
 * `setGigStatusAction` server action. Each click triggers a revalidation of
 * `/admin` and `/admin/gigs`.
 */
export function GigStatusToggle({ id, status }: { id: string; status: Status }) {
  const [isPending, startTransition] = useTransition();

  const onClick = (next: Status) => {
    if (next === status) return;
    startTransition(async () => {
      await setGigStatusAction(id, next);
    });
  };

  return (
    <div
      className="inline-flex items-center gap-0.5 p-0.5 bg-slate-100 rounded-md"
      role="group"
      aria-label="Toggle status gig"
    >
      {STATUSES.map((s) => {
        const active = s.value === status;
        const tone = active
          ? s.value === 'published'
            ? 'bg-white text-emerald-700 shadow-sm'
            : s.value === 'draft'
              ? 'bg-white text-slate-700 shadow-sm'
              : 'bg-white text-amber-700 shadow-sm'
          : 'text-slate-500 hover:text-slate-700';
        return (
          <button
            key={s.value}
            type="button"
            disabled={isPending}
            onClick={() => onClick(s.value)}
            className={`px-2 py-0.5 text-[11px] font-semibold rounded transition ${tone} ${
              isPending ? 'opacity-60' : ''
            }`}
            aria-pressed={active}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
