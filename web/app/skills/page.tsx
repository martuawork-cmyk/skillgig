import { Card, CardBody } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/Button';
import { SkillProgressBar } from '@/components/skill/SkillProgressBar';
import { userSkills, recommendedSkills } from '@/lib/mock';

export default function SkillsPage() {
  const avgProgress = Math.round(
    userSkills.reduce((sum, s) => sum + s.progress, 0) / userSkills.length,
  );
  const mastered = userSkills.filter((s) => s.progress >= 75).length;
  const learning = userSkills.filter((s) => s.progress > 0 && s.progress < 75).length;

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
          Track progress skill kamu. Setelah cukup mahir, langsung cari gig yang
          sesuai di step Discover Gig.
        </p>
      </header>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="Rata-rata progress" value={`${avgProgress}%`} accent="from-indigo-500 to-violet-500" />
        <SummaryCard label="Skill dikuasai"     value={`${mastered}`}     accent="from-emerald-500 to-emerald-600" />
        <SummaryCard label="Sedang dipelajari"  value={`${learning}`}     accent="from-amber-500 to-amber-600" />
      </div>

      {/* Current skills */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Skill kamu</h2>
          <span className="text-xs text-slate-500">{userSkills.length} skill dilacak</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {userSkills.map((s) => (
            <SkillProgressBar key={s.id} skill={s} />
          ))}
        </div>
      </section>

      {/* Recommended */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Rekomendasi skill berikutnya</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendedSkills.map((s) => (
            <Card key={s.id} className="hover:border-indigo-300 transition">
              <CardBody className="space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-slate-900">{s.name}</h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-indigo-100 text-indigo-700">
                    New
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Pelajari skill ini untuk membuka lebih banyak peluang gig dan meningkatkan
                  nilai kamu di pasar.
                </p>
                <ButtonLink href="/learn" variant="secondary" size="sm" className="w-full">
                  Mulai belajar
                </ButtonLink>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <Card>
      <CardBody className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accent} grid place-items-center text-white text-xl font-bold`}>
          {label.charAt(0)}
        </div>
        <div>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
            {label}
          </p>
          <p className="text-2xl font-extrabold text-slate-900">{value}</p>
        </div>
      </CardBody>
    </Card>
  );
}