import { EarnClient } from '@/components/earn/EarnClient';
import { ErrorState } from '@/components/feedback/ErrorState';
import { getGigs, isSupabaseConfigured } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Earn — Gig Berduit · SkillGig.id',
  description:
    'Browse gigs dengan budget tertinggi, filter by platform dan kategori, langsung Lamar dari sini.',
};

export default async function EarnPage() {
  if (!isSupabaseConfigured()) {
    return (
      <PageShell>
        <ErrorState
          title="Belum terkoneksi ke Supabase"
          message="Halaman ini butuh data gigs dari database."
          hint="Isi .env.local dan jalankan migration SQL."
        />
      </PageShell>
    );
  }

  const gigs = await getGigs();

  if (gigs.length === 0) {
    return (
      <PageShell>
        <ErrorState
          title="Belum ada gigs"
          message="Tabel gigs di Supabase kosong."
          hint="Jalankan migration 003_seed.sql."
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <EarnClient initialGigs={gigs} />
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <header>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
          <span>💰</span> STEP 5 OF 5
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Earn — Gig berduit menunggu
        </h1>
        <p className="mt-1 text-sm text-slate-600 max-w-2xl">
          Pilih gig yang sesuai skill kamu, Lamar langsung, dan mulai menghasilkan.
        </p>
      </header>
      {children}
    </div>
  );
}