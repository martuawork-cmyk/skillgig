import { GigsClient } from '@/components/gig/GigsClient';
import { getGigs, isSupabaseConfigured } from '@/lib/supabase/queries';
import { ErrorState } from '@/components/feedback/ErrorState';

export const dynamic = 'force-dynamic';

export default async function GigsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <PageShell>
        <ErrorState
          title="Belum terkoneksi ke Supabase"
          message="Halaman ini butuh data gigs dari database Supabase."
          hint="Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di web/.env.local, lalu jalankan migration SQL."
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
          hint="Jalankan migration 003_seed.sql untuk menambahkan data gigs contoh."
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <GigsClient initialGigs={gigs} />
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <header>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-2">
          <span>🔍</span> STEP 3 OF 5
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Discover Gig
        </h1>
        <p className="mt-2 text-slate-600 max-w-2xl">
          Temukan peluang freelance yang sesuai dengan skill kamu. Filter
          berdasarkan kategori, level, dan budget.
        </p>
      </header>
      {children}
    </div>
  );
}