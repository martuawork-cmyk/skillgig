'use client';

import { useTransition, useState } from 'react';
import { deleteGigAction } from './actions';

/**
 * Delete button with a native `confirm()` to prevent accidental clicks.
 * The server action does the actual delete + path revalidation.
 */
export function DeleteGigButton({ id, title }: { id: string; title: string }) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition"
      >
        Hapus
      </button>
    );
  }

  const onConfirm = () => {
    startTransition(async () => {
      await deleteGigAction(id);
      setOpen(false);
    });
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onConfirm}
        disabled={isPending}
        className="px-2.5 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition disabled:opacity-50"
      >
        {isPending ? '…' : 'Konfirmasi'}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        disabled={isPending}
        className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition"
      >
        Batal
      </button>
      <span className="sr-only">{`Hapus gig "${title}"`}</span>
    </div>
  );
}
