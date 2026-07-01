import type { Metadata } from 'next';
import { GigsClient } from '@/components/gig/GigsClient';
import { getGigs, isSupabaseConfigured } from '@/lib/supabase/queries';
import { ErrorState } from '@/components/feedback/ErrorState';
import { buildMetadata } from '@/lib/seo';
import { JOB_TYPES, type GigJobType } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildMetadata({
  title: 'Lowongan Freelance Indonesia | SkillGig.id',
  description:
    'Temukan lowongan freelance terbaru dari klien Indonesia. Filter berdasarkan kategori, level, dan budget — langsung lamar dan mulai menghasilkan.',
  path: '/gigs',
});

/**
 * Validate the ?job_type= search param against the known set so an unknown /
 * garbage value can't be passed straight into the Supabase `.eq()` filter.
 * Returns the validated job type or undefined (no filter).
 */
function readJobType(raw: string | string[] | undefined): GigJobType | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== 'string') return undefined;
  return JOB_TYPES.some((j) => j.value === value) ? (value as GigJobType) : undefined;
}

export default async function GigsPage({
  searchParams,
}: {
  searchParams: { job_type?: string | string[] };
}) {
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

  const jobType = readJobType(searchParams.job_type);
  const gigs = await getGigs(jobType);

  // Only treat an empty table as an error when no filter is active — an empty
  // *filtered* result is handled by GigsClient's "no matches" empty state.
  if (!jobType && gigs.length === 0) {
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
      <GigsClient initialGigs={gigs} activeJobType={jobType ?? 'all'} />
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