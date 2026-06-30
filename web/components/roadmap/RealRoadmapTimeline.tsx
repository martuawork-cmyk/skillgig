// Real-data variant of the Roadmap timeline. Renders course + gig lists
// fetched from Supabase, plus an AVG-budget estimate row. The header still
// uses the existing category / level badges so the visual language matches
// the rest of the app.
//
// Layout follows the same 4-step shape as RoadmapTimeline:
//   1. Skills   — derived from the skill's name + category badge
//   2. Courses  — top 3 by students DESC
//   3. Gigs     — top 3 published by budget_max DESC
//   4. Income   — AVG(budget_min) / AVG(budget_max) estimate

import { RoadmapStep } from './RoadmapStep';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatIDR, formatCompact, categoryColor, categoryLabel } from '@/lib/utils';
import { COURSE_PLATFORMS } from '@/lib/types';
import type { Course, Gig, GigCategory } from '@/lib/types';

export interface RealRoadmapSkill {
  id: string;
  name: string;
  category: GigCategory;
  icon: string | null;
}

export interface RealRoadmapEstimate {
  avgBudgetMin: number | null;
  avgBudgetMax: number | null;
  sampleSize: number;
}

type Props = {
  skill: RealRoadmapSkill;
  courses: Course[];
  gigs: Gig[];
  estimate: RealRoadmapEstimate;
};

const TOTAL_STEPS = 4;

export function RealRoadmapTimeline({ skill, courses, gigs, estimate }: Props) {
  return (
    <ol className="space-y-0" aria-label={`Roadmap untuk ${skill.name}`}>
      {/* Header */}
      <li className="mb-6">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 overflow-hidden">
          <div className="px-5 sm:px-6 py-5 sm:py-6 space-y-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 grid place-items-center text-2xl shrink-0">
                  {skill.icon ?? '✨'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
                    Roadmap
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight truncate">
                    {skill.name}
                  </h2>
                </div>
              </div>
              <Badge className={`${categoryColor(skill.category)} bg-white/10 text-white border border-white/20`}>
                {categoryLabel(skill.category)}
              </Badge>
            </div>
          </div>
        </Card>
      </li>

      {/* Step 1 — Skills (derived) */}
      <RoadmapStep
        index={1}
        totalSteps={TOTAL_STEPS}
        icon="📚"
        title="Skill yang perlu dipelajari"
        kind="skills"
      >
        <p className="text-slate-700 leading-relaxed">
          Fokus utama:{' '}
          <span className="font-bold text-slate-900">{skill.name}</span>. Kategori{' '}
          <Badge className={categoryColor(skill.category)}>
            {categoryLabel(skill.category)}
          </Badge>{' '}
          biasanya mencakup tools, workflow, dan studi kasus terkait.
        </p>
      </RoadmapStep>

      {/* Step 2 — Courses */}
      <RoadmapStep
        index={2}
        totalSteps={TOTAL_STEPS}
        icon="📖"
        title="Kursus yang direkomendasikan"
        kind="courses"
      >
        {courses.length === 0 ? (
          <EmptyMini
            label="Belum ada kursus untuk kategori ini."
            hint="Coba pilih skill dengan kategori lain."
          />
        ) : (
          <ul className="space-y-2">
            {courses.map((c) => (
              <li key={c.id}>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-3 py-2.5 bg-white border border-slate-200 rounded-lg hover:border-pink-300 hover:shadow-sm transition group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900 text-sm leading-snug group-hover:text-pink-600 transition truncate">
                      {c.title}
                    </p>
                    <Badge className={`${COURSE_PLATFORMS[c.platform]} shrink-0`}>
                      {c.platform}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {c.durationHours} jam · {formatCompact(c.students)} siswa
                    {c.price === 0 ? ' · Gratis' : ` · ${formatIDR(c.price)}`}
                  </p>
                </a>
              </li>
            ))}
          </ul>
        )}
      </RoadmapStep>

      {/* Step 3 — Gigs */}
      <RoadmapStep
        index={3}
        totalSteps={TOTAL_STEPS}
        icon="💼"
        title="Gig yang bisa dilamar"
        kind="gigs"
      >
        {gigs.length === 0 ? (
          <EmptyMini
            label="Belum ada gig published untuk kategori ini."
            hint="Cek lagi nanti — admin terus mem-publish gig baru."
          />
        ) : (
          <ul className="space-y-2">
            {gigs.map((g) => (
              <li
                key={g.id}
                className="flex items-start justify-between gap-3 px-3 py-2.5 bg-white border border-slate-200 rounded-lg"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 text-sm leading-snug truncate">
                    {g.title}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{g.platform}</p>
                </div>
                <p className="text-sm font-bold text-amber-700 tabular-nums shrink-0">
                  {formatIDR(g.budgetMin)} – {formatIDR(g.budgetMax)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </RoadmapStep>

      {/* Step 4 — Estimate */}
      <RoadmapStep
        index={4}
        totalSteps={TOTAL_STEPS}
        icon="💰"
        title="Estimasi pendapatan (rata-rata gig)"
        kind="income"
      >
        {estimate.avgBudgetMin === null || estimate.avgBudgetMax === null ? (
          <EmptyMini
            label="Belum cukup data untuk estimasi."
            hint="Butuh minimal satu gig published di kategori ini."
          />
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg">
              <span className="text-sm font-semibold text-emerald-800">
                Rata-rata budget
              </span>
              <span className="text-sm font-bold text-emerald-700 tabular-nums">
                {formatIDR(estimate.avgBudgetMin)} – {formatIDR(estimate.avgBudgetMax)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Dihitung dari {estimate.sampleSize} gig published di kategori{' '}
              <span className="font-semibold">{categoryLabel(skill.category)}</span>.
              Bukan jaminan — pasar riil bervariasi.
            </p>
          </div>
        )}
      </RoadmapStep>
    </ol>
  );
}

function EmptyMini({ label, hint }: { label: string; hint?: string }) {
  // Inline empty state — lighter than the full <EmptyState> card because
  // it's nested inside a Roadmap step, which already supplies framing.
  return (
    <div className="px-3 py-3 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
      <p className="text-sm text-slate-600">{label}</p>
      {hint && <p className="text-[11px] text-slate-500 mt-0.5">{hint}</p>}
    </div>
  );
}