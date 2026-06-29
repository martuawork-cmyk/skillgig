import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import type { Course } from '@/lib/types';
import { levelColor, levelLabel } from '@/lib/utils';

export function CourseCard({ course }: { course: Course }) {
  return (
    <Card className="h-full hover:border-indigo-300 hover:shadow-md transition overflow-hidden">
      <div className="px-5 sm:px-6 py-5 space-y-3">
        <div className="flex items-start justify-between">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 grid place-items-center text-3xl">
            {course.thumbnail}
          </div>
          <Badge className={levelColor(course.level)}>
            {levelLabel(course.level)}
          </Badge>
        </div>

        <div>
          <h3 className="font-bold text-slate-900 leading-snug">
            {course.titleId}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            by {course.provider} · {course.durationHours}h
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {course.skillsTaught.slice(0, 4).map((s) => (
            <span
              key={s}
              className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md bg-indigo-50 text-indigo-700"
            >
              {s}
            </span>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-100">
          {course.enrolled ? (
            <ButtonLink href="/learn" variant="secondary" size="sm" className="w-full">
              Continue Learning →
            </ButtonLink>
          ) : (
            <ButtonLink href="/learn" variant="primary" size="sm" className="w-full">
              Mulai Belajar
            </ButtonLink>
          )}
        </div>
      </div>
    </Card>
  );
}