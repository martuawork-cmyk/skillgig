import type { Metadata } from 'next';
import { JobsClient } from '@/components/job/JobsClient';
import { ErrorState } from '@/components/feedback/ErrorState';
import { getJobs, isSupabaseConfigured } from '@/lib/supabase/queries';
import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildMetadata({
  title: 'Lowongan Kerja Remote untuk Indonesia | SkillGig.id',
  description:
    'Ratusan perusahaan global membuka lowongan remote (Full-Time, Contract, Part-Time, Internship) untuk kandidat Indonesia. Filter berdasarkan tipe, kategori, dan level.',
  path: '/jobs',
});

export default async function JobsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <PageShell>
        <ErrorState
          title="Belum terkoneksi ke Supabase"
          message="Halaman lowongan kerja butuh data jobs dari database Supabase."
          hint="Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di web/.env.local, lalu jalankan migration SQL."
        />
      </PageShell>
    );
  }

  const jobs = await getJobs();

  // Empty table → friendlier than the "no matches" empty state inside JobsClient.
  if (jobs.length === 0) {
    return (
      <PageShell>
        <ErrorState
          title="Belum ada lowongan kerja"
          message="Belum ada baris gig dengan job_type Full-Time/Contract/Part-Time/Internship."
          hint="Jalankan sync Remotive (cron /api/cron/remotive-sync) atau tambahkan data contoh untuk mengisi papan lowongan."
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <JobsClient initialJobs={jobs} />
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <header className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold mb-4">
          <span aria-hidden>💼</span> Lowongan Kerja Remote
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Lowongan Kerja Remote
        </h1>
        <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
          Ratusan perusahaan global membuka lowongan remote untuk kandidat
          Indonesia
        </p>
      </header>
      {children}
    </div>
  );
}
