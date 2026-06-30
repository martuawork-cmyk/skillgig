import { Badge } from '@/components/ui/Badge';
import type { Skill } from '@/lib/types';
import { categoryColor, categoryLabel, levelColor, levelLabel } from '@/lib/utils';

export function SkillProgressBar({ skill }: { skill: Skill }) {
  const pct = Math.max(0, Math.min(100, skill.progress));
  const color =
    pct >= 75 ? 'from-emerald-500 to-emerald-600' :
    pct >= 40 ? 'from-indigo-500 to-violet-500' :
                'from-slate-400 to-slate-500';

  return (
    <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 transition">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <h4 className="font-semibold text-slate-900 truncate">{skill.name}</h4>
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
            {pct}<span className="text-sm text-slate-500">%</span>
          </p>
        </div>
      </div>

      <div className="relative h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${color} rounded-full transition-all`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}