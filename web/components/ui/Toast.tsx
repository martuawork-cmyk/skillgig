'use client';

import { useEffect, useRef, useState } from 'react';

export type ToastTone = 'success' | 'error' | 'info';

/**
 * Tiny self-contained toast for ephemeral confirmations ("Tersimpan",
 * "Gagal menghapus", etc). Renders into a fixed slot at the bottom of the
 * viewport. Auto-dismisses after `duration` ms.
 *
 * Usage:
 *   const { toast, showToast } = useToast();
 *   showToast('Tersimpan', 'success');
 *   ...
 *   {toast && <Toast message={toast.message} tone={toast.tone} />}
 *
 * Kept as a hook + presentational pair so cards don't need to manage the
 * setTimeout themselves.
 */
export function useToast(durationMs = 1800) {
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  function showToast(message: string, tone: ToastTone = 'info') {
    setToast({ message, tone });
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), durationMs);
  }

  return { toast, showToast };
}

export function Toast({
  message,
  tone = 'info',
}: {
  message: string;
  tone?: ToastTone;
}) {
  const icon = tone === 'success' ? '✓' : tone === 'error' ? '⚠' : 'ℹ';
  const color =
    tone === 'success'
      ? 'bg-emerald-600 text-white'
      : tone === 'error'
        ? 'bg-rose-600 text-white'
        : 'bg-slate-900 text-white';
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl shadow-2xl ${color} text-sm font-semibold pointer-events-none animate-[fadeIn_.15s_ease-out]`}
    >
      {icon} {message}
    </div>
  );
}