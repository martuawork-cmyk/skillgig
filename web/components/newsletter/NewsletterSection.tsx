'use client';

import { useEffect, useState } from 'react';
import type { NewsletterSkillOption } from '@/lib/supabase/queries';

/**
 * NewsletterSection — homepage hero CTA for email + skill subscription.
 *
 * Behaviour (P2-A):
 *   - Email + skill dropdown sourced from Supabase `skills` table.
 *     When no skills load (offline / Supabase unreachable) we render a
 *     minimal "email only" form rather than blocking the entire section.
 *   - POSTs to /api/subscribe, which validates, dedupes (via UNIQUE on
 *     email+skill_id), inserts, and fires a welcome email via Resend.
 *   - Loading / success / error states are explicit so the visitor always
 *     sees what's happening.
 *
 * Props: `skills` is hydrated by the server component (page.tsx) — keeping
 * the data fetch on the server means the dropdown renders instantly with
 * no client-side waterfall.
 */

type Skill = NewsletterSkillOption;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = 'idle' | 'submitting' | 'success' | 'error';

type SubscribeResponse =
  | { ok: true; alreadySubscribed: boolean; emailSent: boolean }
  | { ok: false; error: string; message?: string };

export function NewsletterSection({ skills }: { skills: Skill[] }) {
  const [email, setEmail] = useState('');
  const [skill, setSkill] = useState<string>('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [submittedSkillId, setSubmittedSkillId] = useState<string | null>(null);

  // Pick a sensible default skill once the list hydrates. Don't overwrite
  // a value the user already chose.
  useEffect(() => {
    if (!skill && skills.length > 0) setSkill(skills[0].id);
  }, [skill, skills]);

  const submitting = status === 'submitting';
  const succeeded  = status === 'success';
  const errored    = status === 'error';

  async function onSubmit(e: React.FormEvent) {
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

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          skillId: skill || null,
        }),
      });

      const data = (await res.json()) as SubscribeResponse;

      if (!res.ok || !data.ok) {
        const msg = friendlySubscribeError(data);
        setStatus('error');
        setErrorMsg(msg);
        return;
      }

      setSubmittedEmail(trimmedEmail);
      setSubmittedSkillId(skill || null);
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
      setErrorMsg('Gagal terhubung ke server. Periksa koneksi kamu.');
    }
  }

  function onResubscribe() {
    setSubmittedEmail(null);
    setSubmittedSkillId(null);
    setStatus('idle');
    setErrorMsg(null);
  }

  const submittedSkill =
    skills.find((s) => s.id === submittedSkillId) ?? null;

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
                <span className="w-5 h-5 grid place-items-center rounded-full bg-emerald-400/30 text-emerald-100 text-[10px] font-bold">✓</span>
                Gratis selamanya
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 grid place-items-center rounded-full bg-emerald-400/30 text-emerald-100 text-[10px] font-bold">✓</span>
                Berhenti kapan saja
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 grid place-items-center rounded-full bg-emerald-400/30 text-emerald-100 text-[10px] font-bold">✓</span>
                Personal sesuai skill kamu
              </li>
            </ul>
          </div>

          {/* Right: form / success */}
          <div className="lg:col-span-3">
            {succeeded && submittedEmail ? (
              <SuccessState
                email={submittedEmail}
                skillName={submittedSkill?.name ?? null}
                skillIcon={submittedSkill?.icon ?? null}
                onResubscribe={onResubscribe}
              />
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
                      disabled={submitting}
                      aria-invalid={errored}
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
                    {skills.length > 0 ? (
                      <SkillSelect
                        skills={skills}
                        value={skill}
                        onChange={setSkill}
                        disabled={submitting}
                      />
                    ) : (
                      // Skills list didn't hydrate (offline / no Supabase).
                      // We still allow email-only opt-in via the API.
                      <p className="text-xs text-slate-500 bg-slate-50 border border-dashed border-slate-300 rounded-lg px-3 py-2.5">
                        Daftar skill belum tersedia — kamu tetap bisa
                        subscribe dengan email saja.
                      </p>
                    )}
                  </div>
                </div>

                {errored && errorMsg && (
                  <p
                    role="alert"
                    className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2"
                  >
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 rounded-lg shadow-soft active:scale-[.98] disabled:opacity-60 transition"
                >
                  {submitting ? (
                    <>
                      <Spinner />
                      Mengirim…
                    </>
                  ) : (
                    <>🚀 Langganan Gratis</>
                  )}
                </button>

                <p className="text-[10px] text-slate-500 text-center pt-1">
                  Dengan berlangganan, kamu setuju menerima email mingguan dari kami.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- helpers ---------- */

function SkillSelect({
  skills,
  value,
  onChange,
  disabled,
}: {
  skills: Skill[];
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  const selected = skills.find((s) => s.id === value);
  return (
    <div className="relative">
      <select
        id="newsletter-skill"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full pl-9 pr-8 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60 appearance-none cursor-pointer transition"
      >
        {skills.map((s) => (
          <option key={s.id} value={s.id}>
            {s.icon ? `${s.icon}  ${s.name}` : s.name}
          </option>
        ))}
      </select>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none">
        {selected?.icon ?? '•'}
      </span>
      <svg
        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}

function SuccessState({
  email,
  skillName,
  skillIcon,
  onResubscribe,
}: {
  email: string;
  skillName: string | null;
  skillIcon: string | null;
  onResubscribe: () => void;
}) {
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
        Kami akan mengirim update mingguan
        {skillName ? (
          <>
            {' '}tentang{' '}
            <span className="font-semibold text-slate-900">
              {skillIcon ? `${skillIcon} ` : ''}{skillName}
            </span>
          </>
        ) : null}
        {' '}ke <span className="font-semibold text-slate-900">{email}</span>.
      </p>
      <p className="text-xs text-slate-500">
        Cek inbox kamu — kami sudah kirim email konfirmasi.
      </p>
      <button
        type="button"
        onClick={onResubscribe}
        className="text-xs text-slate-500 hover:text-rose-600 underline mt-2"
      >
        Pakai email lain
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

function friendlySubscribeError(data: SubscribeResponse): string {
  if (data.ok) return 'Berhasil.';
  const errCode = !data.ok ? data.error : 'unknown';
  const msg = !data.ok ? data.message : '';
  if (errCode === 'invalid-email')  return msg || 'Format email tidak valid.';
  if (errCode === 'invalid-skill')  return msg || 'Skill yang dipilih tidak dikenal.';
  if (errCode === 'network')        return msg || 'Belum terkoneksi ke server. Coba lagi nanti.';
  return msg || 'Gagal mengirim. Coba lagi nanti.';
}