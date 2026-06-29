import { StatsGrid } from '@/components/ui/StatsGrid';
import { SkillsClient } from '@/components/skill/SkillsClient';
import { ErrorState } from '@/components/feedback/ErrorState';
import {
  getUserSkills,
  getRecommendedSkills,
  isSupabaseConfigured,
} from '@/lib/supabase/queries';

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

  const [userSkills, recommendedSkills] = await Promise.all([
    getUserSkills(),
    getRecommendedSkills(),
  ]);

  if (userSkills.length === 0) {
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

  const avgProgress = Math.round(
    userSkills.reduce((sum, s) => sum + s.progress, 0) / userSkills.length,
  );
  const mastered = userSkills.filter((s) => s.progress >= 75).length;
  const learning = userSkills.filter(
    (s) => s.progress > 0 && s.progress < 75,
  ).length;

  return (
    <PageShell>
      <StatsGrid
        cols={3}
        stats={[
          { label: 'Rata-rata progress', value: `${avgProgress}%`, accent: 'from-indigo-500 to-violet-500', icon: '📈' },
          { label: 'Skill dikuasai',     value: mastered,         accent: 'from-emerald-500 to-emerald-600', icon: '🏆' },
          { label: 'Sedang dipelajari',  value: learning,         accent: 'from-amber-500 to-amber-600',   icon: '📖' },
        ]}
      />
      <SkillsClient
        userSkills={userSkills}
        recommendedSkills={recommendedSkills}
      />
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
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