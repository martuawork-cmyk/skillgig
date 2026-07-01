'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  title: string;
  /** Body text, or any node (e.g. to call out the affected item by name). */
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` turns the confirm button + icon red — use for destructive actions. */
  tone?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Reusable confirmation dialog. Controlled by the parent via `open` +
 * `onConfirm`/`onCancel`. Closes on Escape, backdrop click, or either button;
 * also locks body scroll while open. Renders nothing when closed.
 */
export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  tone = 'default',
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onCancel]);

  if (!open) return null;

  const danger = tone === 'danger';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'grid h-11 w-11 shrink-0 place-items-center rounded-full',
              danger ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600',
            )}
          >
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 id="confirm-title" className="text-base font-bold text-slate-900">
              {title}
            </h2>
            <div className="mt-1 text-sm text-slate-600">{message}</div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-semibold text-white transition active:scale-[.98]',
              danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700',
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
