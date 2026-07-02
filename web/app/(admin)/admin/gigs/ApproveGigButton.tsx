'use client';

import { useTransition } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { approveGigAction, setGigStatusAction } from './actions';
import type { GigStatus } from '@/lib/types';

/**
 * One-click moderation action. Flips a gig to `published` ("Approve") or back
 * to `draft` ("Unpublish"). Uses the same `setGigStatusAction` server action as
 * the segmented toggle — the dashboard "Gig Terbaru" preview surfaces this as a
 * quick Approve so admins don't have to open the edit form just to publish a
 * synced listing.
 */
export function ApproveGigButton({ id, status }: { id: string; status: GigStatus }) {
  const [isPending, startTransition] = useTransition();
  const published = status === 'published';

  const onClick = () => {
    startTransition(async () => {
      // Approve goes through the dedicated approveGigAction (publishes + pings
      // Telegram); unpublish falls back to the generic status setter.
      if (published) {
        await setGigStatusAction(id, 'draft');
      } else {
        await approveGigAction(id);
      }
    });
  };

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={onClick}
      aria-pressed={published}
      title={published ? 'Kembalikan ke Draft' : 'Setujui & publikasikan'}
      className={
        'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition active:scale-[.98] disabled:opacity-50 ' +
        (published
          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          : 'bg-emerald-600 text-white hover:bg-emerald-700')
      }
    >
      {published ? (
        <>
          <RotateCcw className="h-3 w-3" aria-hidden />
          Unpublish
        </>
      ) : (
        <>
          <Check className="h-3 w-3" aria-hidden />
          Approve
        </>
      )}
    </button>
  );
}
