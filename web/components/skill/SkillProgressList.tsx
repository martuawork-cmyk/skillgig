import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { categoryColor, categoryLabel, levelColor, levelLabel } from '@/lib/utils';
import type { Skill } from '@/lib/types';
import type { SkillProgressEntry } from '@/lib/supabase/queries';

/**
 * "Progress per Skill" section of /skills.
 *
 * For each of the user's skills, shows a small row with:
 *   - course count: courses the user has saved that teach this skill
 *   - application count: gigs the user has applied to that require it
 *   - a 0–100 progress bar (sum of the two counts, capped at 100)
 *
 * Renders an EmptyState when the user hasn't added any skills yet, or when
 * none of the owned skills have activity yet. Activity-only skills
 * (owned but no saved courses / applications) are listed with a "0%"
 * progress bar so users can see what's still missing.
 */

interface RowProps {
  skill: Skill;
  entry: SkillProgressEntry | undefined;
}

function ProgressRow({ skill, entry }: RowProps) {
  const savedCourses = entry?.savedCourses ?? 0;
  const appliedGigs = entry?.appliedGigs ?? 0;
  const pct = entry?.progress ?? 0;
  const color =
    pct >= 75
      ? 'from-emerald-500 to-emerald-600'
      : pct >= 40
        ? 'from-indigo-500 to-violet-500'
        : 'from-slate-400 to-slate-500';

  return (
    <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-xl">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">{skill.name}</h3>
          <div className="flex items-center gap-1.5 mt-1">
            <Badge className={categoryColor(skill.category)}>
              {categoryLabel(skill.category)}
            </Badge>
            <Badge className={levelColor(skill.level)}>
              {levelLabel(skill.level)}
            </Badge>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-extrabold text-slate-900 leading-none">
            {pct}
            <span className="text-sm text-slate-500">%</span>
          </p>
        </div>
      </div>

      <div className="relative h-2 rounded-full bg-slate-100 overflow-hidden mb-3">
        <div
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${color} rounded-full transition-all`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      <div className="flex items-center gap-3 text-xs">
        <span className="inline-flex items-center gap-1.5 text-slate-700">
          <span className="text-base leading-none" aria-hidden>📚</span>
          <span className="font-semibold">{savedCourses}</span>
          kursus disimpan
        </span>
        <span className="inline-flex items-center gap-1.5 text-slate-700">
          <span className="text-base leading-none" aria-hidden>📨</span>
          <span className="font-semibold">{appliedGigs}</span>
          gig dilamar
        </span>
      </div>
    </div>
  );
}

export function SkillProgressList({
  skills,
  progress,
  hasAnyActivity,
}: {
  skills: Skill[];
  progress: Map<string, SkillProgressEntry>;
  hasAnyActivity: boolean;
}) {
  if (skills.length === 0) {
    return (
      <EmptyState
        icon="📊"
        title="Belum ada progress untuk ditampilkan"
        description="Tambah skill dan mulai belajar / melamar gig untuk melihat progress kamu."
      />
    );
  }

  if (!hasAnyActivity) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-600">
          Belum ada aktivitas tersimpan. Simpan kursus di{' '}
          <a href="/learn" className="text-indigo-600 font-semibold hover:underline">/learn</a>{' '}
          atau Lamar gig di{' '}
          <a href="/gigs" className="text-indigo-600 font-semibold hover:underline">/gigs</a>{' '}
          untuk mengisi progress.
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {skills.map((s) => (
            <ProgressRow key={s.id} skill={s} entry={progress.get(s.id)} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {skills.map((s) => (
        <ProgressRow key={s.id} skill={s} entry={progress.get(s.id)} />
      ))}
    </div>
  );
}
