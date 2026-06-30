import { RoadmapStep } from './RoadmapStep';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatIDR, categoryColor, categoryLabel, levelColor, levelLabel } from '@/lib/utils';
import type { Roadmap } from '@/lib/types';

export function RoadmapTimeline({ roadmap }: { roadmap: Roadmap }) {
  const totalSteps = 4;
  const totalMax = roadmap.incomeTiers.reduce((s, t) => s + t.max, 0);

  return (
    <ol className="space-y-0" aria-label={`Roadmap untuk ${roadmap.skill}`}>
      {/* Header card */}
      <li className="mb-6">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 overflow-hidden">
          <div className="px-5 sm:px-6 py-5 sm:py-6 space-y-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
                  Roadmap
                </p>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {roadmap.skill}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${categoryColor(roadmap.category)} bg-white/10 text-white border border-white/20`}>
                  {categoryLabel(roadmap.category)}
                </Badge>
                <Badge className={`${levelColor(roadmap.difficulty)} bg-white/10 text-white border border-white/20`}>
                  {levelLabel(roadmap.difficulty)}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Stat label="Estimasi waktu" value={`${roadmap.durationWeeks} minggu`} />
              <Stat
                label="Potensi (Expert)"
                value={`${formatIDR(roadmap.estimatedIncome.min)} – ${formatIDR(roadmap.estimatedIncome.max)}`}
              />
            </div>
          </div>
        </Card>
      </li>

      {/* Step 1 — Skills */}
      <RoadmapStep
        index={1}
        totalSteps={totalSteps}
        icon="📚"
        title="Skill yang perlu dipelajari"
        kind="skills"
      >
        <ul className="space-y-1.5">
          {roadmap.skills.map((s) => (
            <li key={s} className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
              <span className="text-slate-700">{s}</span>
            </li>
          ))}
        </ul>
      </RoadmapStep>

      {/* Step 2 — Courses */}
      <RoadmapStep
        index={2}
        totalSteps={totalSteps}
        icon="📖"
        title="Kursus yang direkomendasikan"
        kind="courses"
      >
        <ul className="space-y-2">
          {roadmap.courses.map((c) => (
            <li key={c.title}>
              <a
                href={c.url}
                className="block px-3 py-2.5 bg-white border border-slate-200 rounded-lg hover:border-pink-300 hover:shadow-sm transition group"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900 text-sm leading-snug group-hover:text-pink-600 transition">
                    {c.title}
                  </p>
                  <Badge className="bg-pink-100 text-pink-700 shrink-0">{c.platform}</Badge>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </RoadmapStep>

      {/* Step 3 — Gigs */}
      <RoadmapStep
        index={3}
        totalSteps={totalSteps}
        icon="💼"
        title="Gig yang bisa dilamar"
        kind="gigs"
      >
        <ul className="space-y-2">
          {roadmap.gigs.map((g) => (
            <li
              key={g.title}
              className="flex items-start justify-between gap-3 px-3 py-2.5 bg-white border border-slate-200 rounded-lg"
            >
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 text-sm leading-snug">
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
      </RoadmapStep>

      {/* Step 4 — Income */}
      <RoadmapStep
        index={4}
        totalSteps={totalSteps}
        icon="💰"
        title="Estimasi pendapatan"
        kind="income"
      >
        <ul className="space-y-1.5">
          {roadmap.incomeTiers.map((t) => (
            <li
              key={t.level}
              className="flex items-center justify-between gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg"
            >
              <span className="text-sm font-semibold text-emerald-800">{t.level}</span>
              <span className="text-sm font-bold text-emerald-700 tabular-nums">
                {formatIDR(t.min)} – {formatIDR(t.max)} <span className="text-[10px] font-normal text-emerald-600">/bulan</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-slate-500">
          Total estimasi {roadmap.incomeTiers.length} level · Potensi puncak {formatIDR(totalMax)}/bulan saat Expert
        </p>
      </RoadmapStep>
    </ol>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2 bg-white/10 rounded-lg border border-white/10">
      <p className="text-[10px] uppercase tracking-wide text-slate-300 font-bold">{label}</p>
      <p className="text-sm font-extrabold text-white mt-0.5 break-words">{value}</p>
    </div>
  );
}