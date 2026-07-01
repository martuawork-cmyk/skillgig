'use client';

import { useTransition, useState } from 'react';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { deleteGigAction } from './actions';

type Props = {
  id: string;
  title: string;
  /** Optional size tweak; the dashboard + list both want a compact pill. */
  className?: string;
};

/**
 * Delete control for a gig row: a compact "Hapus" pill that opens the shared
 * `ConfirmModal` (danger tone) before invoking the server action. The modal
 * calls out the affected gig by title so the admin can double-check.
 */
export function DeleteGigButton({ id, title, className }: Props) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const onConfirm = () => {
    startTransition(async () => {
      await deleteGigAction(id);
      setOpen(false);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition'
        }
      >
        Hapus
      </button>

      <ConfirmModal
        open={open}
        tone="danger"
        title="Hapus gig?"
        confirmLabel={isPending ? 'Menghapus…' : 'Hapus'}
        message={
          <>
            Gig <strong className="text-slate-900">“{title}”</strong> akan dihapus
            permanen beserta semua data pelamarnya. Tindakan ini tidak bisa
            dibatalkan.
          </>
        }
        onConfirm={onConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
