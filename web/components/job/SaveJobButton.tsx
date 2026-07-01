'use client';

import type { Gig } from '@/lib/types';
import { useSavedStore } from '@/lib/store/savedStore';
import { useToast, Toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

type Props = {
  gig: Gig;
};

/**
 * Outline "Simpan Lowongan" CTA for the /jobs detail sidebar. Client component
 * because it reads / writes the Zustand saved-items store. Toggles the same
 * saved_items row a GigCard would (jobs are gigs in the same table).
 */
export function SaveJobButton({ gig }: Props) {
  const bookmarked = useSavedStore((s) => s.isGigSaved(gig.id));
  const toggleSaveGig = useSavedStore((s) => s.toggleSaveGig);
  const { toast, showToast } = useToast();

  const handleToggle = () => {
    const wasSaved = bookmarked;
    void toggleSaveGig({
      id: gig.id,
      title: gig.titleId,
      platform: gig.platform,
    });
    showToast(
      wasSaved ? 'Bookmark dihapus' : 'Lowongan tersimpan',
      wasSaved ? 'info' : 'success',
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={bookmarked}
        className={cn(
          'w-full px-4 py-2.5 text-sm font-bold rounded-lg border-2 transition active:scale-[.98]',
          bookmarked
            ? 'border-emerald-600 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
            : 'border-indigo-600 text-indigo-600 hover:bg-indigo-50',
        )}
      >
        {bookmarked ? '✓ Tersimpan' : 'Simpan Lowongan'}
      </button>
      {toast && <Toast message={toast.message} tone={toast.tone} />}
    </>
  );
}
