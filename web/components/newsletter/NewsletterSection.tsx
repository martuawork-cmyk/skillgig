'use client';

import { useEffect, useState } from 'react';

/**
 * NewsletterSection — homepage hero CTA for email + skill subscription.
 *
 * Behaviour:
 *   - Email + skill dropdown + submit
 *   - Validates email format (basic regex)
 *   - On submit: stores to localStorage (`skillgig.newsletter.v1`) and
 *     transitions to a "sukses" state. No backend wiring for now
 *     (mock-first, as the user asked).
 *   - Persists across reloads (the success badge stays on if already
 *     subscribed, otherwise the form re-renders)
 *
 * The dropdown options are hard-coded for now. Could be wired to a Supabase
 * `skills` table later via getSkills() if needed.
 */

const SKILL_OPTIONS = [
  { value: 'video-editing', label: 'Video Editing',  icon: '🎬' },
  { value: 'web-dev',       label: 'Web Dev',        icon: '💻' },
  { value: 'copywriting',   label: 'Copywriting',    icon: '✍️' },
  { value: 'design',        label: 'Design',         icon: '🎨' },
  { value: 'data-analysis', label: 'Data Analysis',  icon: '📊' },
  { value: 'marketing',     label: 'Marketing',      icon: '📈' },
  { value: 'video-motion',  label: 'Motion / 3D',     icon: '🌀' },
  { value: 'ai-ml',         label: 'AI / ML',        icon: '🤖' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STORAGE_KEY = 'skillgig.newsletter.v1';

type Status = 'idle' | 'submitting' | 'success' | 'error';

type SavedSub = {
  email: string;
  skill: string;
  subscribedAt: number;
};

function loadSaved(): SavedSub | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.email === 'string' && typeof parsed.skill === 'string') {
      return parsed as SavedSub;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function persist(sub: SavedSub) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sub));
  } catch {
    /* ignore quota */
  }
}

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [skill, setSkill] = useState<string>(SKILL_OPTIONS[0].value);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedSub | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Read previously-saved sub on mount (client-only)
  useEffect(() => {
    setSaved(loadSaved());
    setHydrated(true);
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'submitting') return;

    const trimmedEmail = email.trim();
    if (!EMAIL_RE.test(trimmedEmail)) {
      setStatus('error');
      setErrorMsg('Format email tidak valid.');
      return;
    }

    setStatus('submitting');
    setErrorMsg(null);

    // Mock submit: persist locally, then transition to success.
    // (No backend wiring — user said "simpan ke localStorage sementara".)
    const sub: SavedSub = {
      email: trimmedEmail,
      skill,
      subscribedAt: Date.now(),
    };

    // Simulate brief delay for nicer UX
    setTimeout(() => {
      persist(sub);
      setSaved(sub);
      setStatus('success');
      setEmail('');
    }, 400);
  }

  function onUnsubscribe() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setSaved(null);
    setStatus('idle');
  }

  const selectedSkill = SKILL_OPTIONS.find((s) => s.value === skill);

  return (
    <section
      aria-labelledby="newsletter-section-heading"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-soft"
    >
      {/* Decorative blur blobs */}
      <div className="absolute -top-16 -left-12 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-16 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-pink-300/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative px-6 sm:px-10 lg:px-14 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
          {/* Left: copy */}
          <div className="lg:col-span-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-white text-xs font-semibold mb-3">
              <span aria-hidden>📨</span> Newsletter mingguan
            </div>
            <h2
              id="newsletter-section-heading"
              className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.1]"
            >
              Update skill baru, langsung ke inbox.
            </h2>
            <p className="mt-3 text-indigo-100 text-sm sm:text-base max-w-md leading-relaxed">
              Pilih skill yang kamu minati. Kami kirim tips, lowongan, dan kursus
              pilihan setiap minggu — tanpa spam.
            </p>
            <ul className="mt-5 space-y-1.5 text-sm text-indigo-100">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 grid place-items-center rounded-full bg-emerald-400/30 text-emerald-100 text-[10px] font-bold">
                  ✓
                </span>
                Gratis selamanya
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 grid place-items-center rounded-full bg-emerald-400/30 text-emerald-100 text-[10px] font-bold">
                  ✓
                </span>
                Berhenti kapan saja
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 grid place-items-center rounded-full bg-emerald-400/30 text-emerald-100 text-[10px] font-bold">
                  ✓
                </span>
                Personal sesuai skill kamu
              </li>
            </ul>
          </div>

          {/* Right: form / success */}
          <div className="lg:col-span-3">
            {status === 'success' && saved ? (
              <SuccessState saved={saved} onUnsubscribe={onUnsubscribe} />
            ) : (
              <form
                onSubmit={onSubmit}
                className="bg-white rounded-2xl p-5 sm:p-6 shadow-lg space-y-4"
                noValidate
              >
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <div className="sm:col-span-3">
                    <label
                      htmlFor="newsletter-email"
                      className="block text-[10px] uppercase tracking-wide font-bold text-slate-500 mb-1"
                    >
                      Email
                    </label>
                    <input
                      id="newsletter-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="kamu@email.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (status === 'error') setStatus('idle');
                      }}
                      disabled={status === 'submitting'}
                      aria-invalid={status === 'error'}
                      className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60 transition"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="newsletter-skill"
                      className="block text-[10px] uppercase tracking-wide font-bold text-slate-500 mb-1"
                    >
                      Skill
                    </label>
                    <div className="relative">
                      <select
                        id="newsletter-skill"
                        value={skill}
                        onChange={(e) => setSkill(e.target.value)}
                        disabled={status === 'submitting'}
                        className="w-full pl-9 pr-8 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60 appearance-none cursor-pointer transition"
                      >
                        {SKILL_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.icon}  {s.label}
                          </option>
                        ))}
                      </select>
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none">
                        {selectedSkill?.icon}
                      </span>
                      <svg
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round" aria-hidden
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>
                </div>

                {status === 'error' && errorMsg && (
                  <p
                    role="alert"
                    className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2"
                  >
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 rounded-lg shadow-soft active:scale-[.98] disabled:opacity-60 transition"
                >
                  {status === 'submitting' ? (
                    <>
                      <Spinner />
                      Memproses…
                    </>
                  ) : (
                    <>
                      🚀 Langganan Gratis
                    </>
                  )}
                </button>

                <p className="text-[10px] text-slate-500 text-center pt-1">
                  Dengan berlangganan, kamu setuju menerima email mingguan dari kami.
                </p>
              </form>
            )}

            {/* Hydration: jika user sudah subscribe dari sesi sebelumnya */}
            {hydrated && status !== 'success' && saved && (
              <div className="mt-3 text-center">
                <p className="text-xs text-indigo-100">
                  Kamu sudah berlangganan sebagai{' '}
                  <span className="font-semibold">{saved.email}</span>.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- helpers ---------- */

function SuccessState({
  saved,
  onUnsubscribe,
}: {
  saved: SavedSub;
  onUnsubscribe: () => void;
}) {
  const skillMeta = SKILL_OPTIONS.find((s) => s.value === saved.skill);
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg text-center space-y-3"
    >
      <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 grid place-items-center text-3xl">
        ✓
      </div>
      <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
        Berhasil berlangganan!
      </h3>
      <p className="text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
        Kami akan mengirim update mingguan tentang{' '}
        <span className="font-semibold text-slate-900">
          {skillMeta?.icon} {skillMeta?.label ?? saved.skill}
        </span>{' '}
        ke <span className="font-semibold text-slate-900">{saved.email}</span>.
      </p>
      <button
        type="button"
        onClick={onUnsubscribe}
        className="text-xs text-slate-500 hover:text-rose-600 underline mt-2"
      >
        Berhenti berlangganan
      </button>
    </div>
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