import Link from 'next/link';
import { ErrorState } from '@/components/feedback/ErrorState';
import { MySkillsGrid } from '@/components/skill/MySkillsGrid';
import { AddSkillGrid } from '@/components/skill/AddSkillGrid';
import { SkillProgressList } from '@/components/skill/SkillProgressList';
import {
  getUserSkills,
  getAllSkills,
  getSkillProgressForUser,
  isSupabaseConfigured,
} from '@/lib/supabase/queries';
import { getCurrentUser } from '@/lib/supabase/session';
import type { Skill } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function SkillsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <PageShell>
        <ErrorState
          title="Belum terkoneksi ke Supabase"
          message="Halaman ini butuh data skill dari database."
          hint="Isi .env.local dan jalankan migration SQL."
        />
      </PageShell>
    );
  }

  // Browse is open to everyone; only "Saya" / progress sections need auth.
  const [user, catalog] = await Promise.all([
    getCurrentUser(),
    getAllSkills(),
  ]);

  if (catalog.length === 0) {
    return (
      <PageShell>
        <ErrorState
          title="Belum ada skill"
          message="Tabel skills di Supabase kosong."
          hint="Jalankan migration 003_seed.sql."
        />
      </PageShell>
    );
  }

  const isAuthenticated = Boolean(user);
  const owned: Skill[] = isAuthenticated ? await getUserSkills() : [];
  const ownedIds = owned.map((s) => s.id);
  const progress = isAuthenticated
    ? await getSkillProgressForUser(ownedIds)
    : new Map();

  // "Has any activity" — drive the empty-vs-data EmptyState in the progress
  // section so users see whether /learn or /gigs already feeds the count.
  const hasAnyActivity =
    progress.size > 0 &&
    Array.from(progress.values()).some(
      (e) => e.savedCourses > 0 || e.appliedGigs > 0,
    );

  return (
    <PageShell>
      {!isAuthenticated && (
        <Banner
          title="Login untuk menyimpan skill"
          message="Kamu bisa menjelajah katalog di bawah, tapi tambah/hapus skill butuh akun."
        />
      )}

      {/* Section 1 — Skill Saya (auth-only) */}
      {isAuthenticated && (
        <section aria-labelledby="skill-saya">
          <SectionHeader
            id="skill-saya"
            label="STEP 2 OF 5"
            title="Skill saya"
            subtitle={
              owned.length > 0
                ? `${owned.length} skill sudah masuk profil kamu.`
                : 'Belum ada skill — tambahkan dari katalog di bawah.'
            }
          />
          <MySkillsGrid skills={owned} />
        </section>
      )}

      {/* Section 2 — Tambah Skill (open to everyone) */}
      <section aria-labelledby="tambah-skill">
        <SectionHeader
          id="tambah-skill"
          label="KATALOG"
          title="Tambah skill"
          subtitle="Klik untuk menambah atau menghapus skill dari profil kamu."
        />
        <AddSkillGrid
          catalog={catalog}
          ownedIds={ownedIds}
          isAuthenticated={isAuthenticated}
        />
      </section>

      {/* Section 3 — Progress per Skill (auth-only) */}
      {isAuthenticated && (
        <section aria-labelledby="progress-skill">
          <SectionHeader
            id="progress-skill"
            label="PROGRESS"
            title="Progress per skill"
            subtitle="Jumlah kursus yang kamu simpan + gig yang kamu lamar untuk tiap skill."
          />
          <SkillProgressList
            skills={owned}
            progress={progress}
            hasAnyActivity={hasAnyActivity}
          />
        </section>
      )}
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10">
      <header>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-2">
          <span>🛠️</span> STEP 2 OF 5
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Bangun skill kamu
        </h1>
        <p className="mt-2 text-slate-600 max-w-2xl">
          Track progress skill kamu. Setelah cukup mahir, langsung cari gig
          yang sesuai di step Discover Gig.
        </p>
      </header>
      {children}
    </div>
  );
}

function SectionHeader({
  id,
  label,
  title,
  subtitle,
}: {
  id: string;
  label: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider text-indigo-500 mb-1">
        <span>●</span> {label}
      </div>
      <h2
        id={id}
        className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight"
      >
        {title}
      </h2>
      <p className="mt-1 text-sm text-slate-600 max-w-2xl">{subtitle}</p>
    </div>
  );
}

function Banner({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm flex items-start gap-3">
      <span className="text-base leading-none" aria-hidden>💡</span>
      <div className="min-w-0">
        <p className="font-semibold text-amber-900">{title}</p>
        <p className="text-amber-800 mt-0.5">
          {message}{' '}
          <Link
            href="/login?next=%2Fskills"
            className="font-semibold underline hover:text-amber-900"
          >
            Login →
          </Link>
        </p>
      </div>
    </div>
  );
}
