'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardBody } from '@/components/ui/Card';
import { signUpWithPassword, type AuthRole, type AuthResult } from '@/lib/supabase/actions';

export function SignupForm() {
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AuthRole>('freelancer');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setErrorMsg(null);

    const result: AuthResult = await signUpWithPassword(name, email, password, role);
    if (result.ok) {
      setSuccess(true);
      // If email confirmation is OFF in Supabase, session is created immediately.
      // If email confirmation is ON, the user must check their inbox first.
      // Either way, we redirect to the user's profile after a short pause.
      // If a `next` was explicitly provided we honor it, otherwise we go to /profile/[userId].
      const redirectTo = nextUrl !== '/' ? nextUrl : `/profile/${result.userId}`;
      setTimeout(() => {
        window.location.href = redirectTo;
      }, 1200);
    } else {
      setErrorMsg(result.message ?? 'Gagal daftar. Coba lagi.');
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <Card>
        <CardBody className="text-center py-10 space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 grid place-items-center text-2xl">
            ✓
          </div>
          <p className="font-bold text-slate-900">Akun berhasil dibuat!</p>
          <p className="text-sm text-slate-600">
            Mengarahkan ke dashboard…
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        <form onSubmit={onSubmit} className="space-y-3" noValidate>
          <div>
            <label htmlFor="su-name" className="block text-xs font-semibold text-slate-700 mb-1">
              Nama lengkap
            </label>
            <input
              id="su-name"
              type="text"
              required
              autoComplete="name"
              placeholder="Nama kamu"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              disabled={submitting}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
            />
          </div>

          <div>
            <label htmlFor="su-email" className="block text-xs font-semibold text-slate-700 mb-1">
              Email
            </label>
            <input
              id="su-email"
              type="email"
              required
              autoComplete="email"
              placeholder="kamu@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              disabled={submitting}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
            />
          </div>

          <div>
            <label htmlFor="su-password" className="block text-xs font-semibold text-slate-700 mb-1">
              Password <span className="text-slate-400 font-normal">(min. 6 karakter)</span>
            </label>
            <input
              id="su-password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              disabled={submitting}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
            />
          </div>

          <fieldset>
            <legend className="block text-xs font-semibold text-slate-700 mb-1.5">
              Saya ingin
            </legend>
            <div className="grid grid-cols-2 gap-2">
              <RoleOption
                active={role === 'freelancer'}
                onClick={() => setRole('freelancer')}
                emoji="💼"
                label="Cari gig"
                desc="Sebagai freelancer"
                disabled={submitting}
              />
              <RoleOption
                active={role === 'client'}
                onClick={() => setRole('client')}
                emoji="📣"
                label="Post gig"
                desc="Sebagai klien"
                disabled={submitting}
              />
            </div>
          </fieldset>

          {errorMsg && (
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
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 rounded-lg shadow-soft active:scale-[.98] disabled:opacity-60 transition"
          >
            {submitting ? 'Membuat akun…' : 'Buat akun'}
          </button>
        </form>

        <p className="text-xs text-slate-500 text-center pt-2 border-t border-slate-100">
          Sudah punya akun?{' '}
          <Link
            href={{ pathname: '/login', query: { next: nextUrl } } as never}
            className="text-indigo-600 font-semibold hover:underline"
          >
            Masuk di sini
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}

function RoleOption({
  active,
  onClick,
  emoji,
  label,
  desc,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  emoji: string;
  label: string;
  desc: string;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={
        'p-3 text-left rounded-lg border transition active:scale-[.98] disabled:opacity-60 ' +
        (active
          ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100'
          : 'border-slate-200 hover:border-indigo-300 bg-white')
      }
    >
      <div className="text-xl mb-1">{emoji}</div>
      <p className="font-semibold text-sm text-slate-900">{label}</p>
      <p className="text-[11px] text-slate-500">{desc}</p>
    </button>
  );
}