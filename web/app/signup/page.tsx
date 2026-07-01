import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { SignupForm } from '@/components/auth/SignupForm';
import { ErrorState } from '@/components/feedback/ErrorState';
import { isSupabaseConfigured } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Daftar — SkillGig.id',
};

export default function SignupPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <PageHeading />
        <ErrorState
          title="Belum terkoneksi ke Supabase"
          message="Signup tidak bisa diaktifkan tanpa env vars Supabase."
          hint="Isi .env.local lalu restart dev server."
        />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <PageHeading />
      <SignupForm />
    </div>
  );
}

function PageHeading() {
  return (
    <header className="text-center space-y-2">
      <Link href="/" aria-label="SkillGig.id — beranda" className="inline-flex items-center group">
        <Logo size="lg" className="transition-opacity group-hover:opacity-90" />
      </Link>
      <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight pt-2">
        Buat akun baru
      </h1>
      <p className="text-sm text-slate-600">
        Mulai journey kamu — gratis, 30 detik.
      </p>
    </header>
  );
}