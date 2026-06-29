'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardBody } from '@/components/ui/Card';
import { signInWithPassword, type AuthResult } from '@/lib/supabase/actions';

export function LoginForm() {
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setErrorMsg(null);

    const result: AuthResult = await signInWithPassword(email, password);
    if (result.ok) {
      // Hard navigation so server components re-fetch with the new cookie
      window.location.href = nextUrl;
    } else {
      setErrorMsg(result.message ?? 'Gagal masuk. Coba lagi.');
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        <form onSubmit={onSubmit} className="space-y-3" noValidate>
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 mb-1">
              Email
            </label>
            <input
              id="login-email"
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
            <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
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
            {submitting ? 'Memproses…' : 'Masuk'}
          </button>
        </form>

        <p className="text-xs text-slate-500 text-center pt-2 border-t border-slate-100">
          Belum punya akun?{' '}
          <Link
            href={{ pathname: '/signup', query: { next: nextUrl } } as never}
            className="text-indigo-600 font-semibold hover:underline"
          >
            Daftar di sini
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}