'use client';

import { useEffect, useRef, useState } from 'react';
import { subscribeEmail } from '@/lib/supabase/actions';

type Status = 'idle' | 'submitting' | 'success' | 'error';

function messageFor(reason: 'invalid-email' | 'network' | 'unknown'): string {
  switch (reason) {
    case 'invalid-email': return 'Format email tidak valid.';
    case 'network':       return 'Belum terkoneksi ke Supabase. Coba lagi nanti.';
    case 'unknown':       return 'Gagal mengirim. Coba lagi nanti.';
  }
}

export function SubscriberForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const successTimer = useRef<number | null>(null);

  // Reset success state after 4s
  useEffect(() => {
    return () => {
      if (successTimer.current) window.clearTimeout(successTimer.current);
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'submitting') return;

    setStatus('submitting');
    setErrorMsg(null);

    const result = await subscribeEmail(email);
    if (result.ok) {
      setStatus('success');
      setEmail('');
      if (successTimer.current) window.clearTimeout(successTimer.current);
      successTimer.current = window.setTimeout(() => {
        setStatus('idle');
      }, 4000);
    } else {
      setStatus('error');
      setErrorMsg(messageFor(result.reason));
    }
  }

  const submitting = status === 'submitting';
  const succeeded = status === 'success';
  const errored = status === 'error';

  return (
    <section
      aria-labelledby="newsletter-heading"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-soft"
    >
      {/* Decorative blur blobs */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative px-6 sm:px-8 py-8 sm:py-10 grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
        {/* Left: copy */}
        <div className="md:col-span-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold mb-3">
            <span aria-hidden>📨</span>
            Newsletter mingguan
          </div>
          <h2
            id="newsletter-heading"
            className="text-2xl sm:text-3xl font-extrabold tracking-tight"
          >
            Update gig &amp; kursus baru, tiap minggu.
          </h2>
          <p className="mt-2 text-indigo-100 text-sm sm:text-base max-w-xl leading-relaxed">
            Tips singkat, lowongan freelance pilihan, dan kursus baru — langsung
            ke inbox kamu. Tanpa spam, berhenti kapan saja.
          </p>
        </div>

        {/* Right: form */}
        <form
          onSubmit={onSubmit}
          className="md:col-span-2 space-y-2"
          noValidate={false}
        >
          <label htmlFor="subscriber-email" className="sr-only">
            Email
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="subscriber-email"
              type="email"
              required
              autoComplete="email"
              placeholder="kamu@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === 'error') setStatus('idle');
              }}
              disabled={submitting}
              aria-invalid={errored}
              aria-describedby={errored ? 'subscriber-error' : undefined}
              className="flex-1 px-4 py-3 text-sm text-slate-900 bg-white rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/70 disabled:opacity-60 transition"
            />
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-indigo-700 bg-white hover:bg-slate-50 rounded-lg shadow-soft active:scale-[.98] disabled:opacity-60 transition"
            >
              {submitting ? (
                <>
                  <Spinner />
                  Mengirim…
                </>
              ) : (
                <>
                  Subscribe
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {/* Status line */}
          <p
            id="subscriber-error"
            role={errored ? 'alert' : 'status'}
            aria-live="polite"
            className={
              succeeded
                ? 'text-sm font-semibold text-emerald-100 pt-1 flex items-center gap-1.5'
                : errored
                  ? 'text-sm font-medium text-rose-100 pt-1 flex items-center gap-1.5'
                  : 'text-xs text-indigo-100/80 pt-1'
            }
          >
            {succeeded && (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Terima kasih! Kamu sudah masuk daftar.
              </>
            )}
            {errored && errorMsg}
            {!succeeded && !errored && (
              <>Dengan Subscribe, kamu setuju menerima email dari kami.</>
            )}
          </p>
        </form>
      </div>
    </section>
  );
}

function Spinner() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-spin"
      aria-hidden
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}