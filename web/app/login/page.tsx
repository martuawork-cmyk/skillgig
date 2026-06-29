import Link from 'next/link';
import { LoginForm } from '@/components/auth/LoginForm';
import { ErrorState } from '@/components/feedback/ErrorState';
import { isSupabaseConfigured } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Masuk — SkillGig.id',
};

export default function LoginPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <PageHeading />
        <ErrorState
          title="Belum terkoneksi ke Supabase"
          message="Auth tidak bisa diaktifkan tanpa env vars Supabase."
          hint="Isi .env.local lalu restart dev server."
        />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <PageHeading />
      <LoginForm />
    </div>
  );
}

function PageHeading() {
  return (
    <header className="text-center space-y-2">
      <Link href="/" className="inline-flex items-center gap-2 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 grid place-items-center shadow-soft group-hover:scale-105 transition">
          <span className="text-white font-extrabold text-sm">SG</span>
        </div>
        <span className="font-extrabold text-slate-900 tracking-tight text-lg">
          SkillGig<span className="text-indigo-600">.id</span>
        </span>
      </Link>
      <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight pt-2">
        Masuk ke SkillGig
      </h1>
      <p className="text-sm text-slate-600">
        Lanjutkan journey belajar dan menghasilkan kamu.
      </p>
    </header>
  );
}