'use client';

import { useEffect } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastTone = 'success' | 'error';

type Props = {
  open: boolean;
  tone?: ToastTone;
  message: string;
  /** Auto-dismiss delay in ms. 0 = stay until closed. */
  duration?: number;
  onClose: () => void;
};

/**
 * Tiny fixed-position toast for admin actions (save/delete confirmation etc.).
 * Rendered bottom-right, auto-dismisses after `duration` ms, and can be closed
 * manually. Stateless beyond the timer — the parent owns `open`/`message`.
 */
export function Toast({ open, tone = 'success', message, duration = 3200, onClose }: Props) {
  useEffect(() => {
    if (!open || !duration) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [open, duration, onClose]);

  if (!open) return null;

  const error = tone === 'error';
  const Icon = error ? AlertCircle : CheckCircle2;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xl"
    >
      <Icon
        className={cn('h-5 w-5 shrink-0', error ? 'text-rose-500' : 'text-emerald-500')}
        aria-hidden
      />
      <p className="text-sm font-semibold text-slate-800">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="ml-1 rounded p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        aria-label="Tutup notifikasi"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
