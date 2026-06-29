'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { COURSE_PLATFORMS, type Course } from '@/lib/types';
import { formatIDR, formatCompact, levelColor, levelLabel, cn } from '@/lib/utils';
import { useSavedStore } from '@/lib/store/savedStore';

type Props = {
  course: Course;
};

export function CourseCard({ course }: Props) {
  const isFree = course.price === 0;
  const saved = useSavedStore((s) => s.isCourseSaved(course.id));
  const toggleSaveCourse = useSavedStore((s) => s.toggleSaveCourse);

  return (
    <Card className="h-full hover:border-indigo-300 hover:shadow-md transition flex flex-col">
      <div className="px-5 sm:px-6 py-5 flex-1 flex flex-col gap-3">
        {/* Thumbnail + platform badge */}
        <div className="flex items-start justify-between">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 grid place-items-center text-3xl shrink-0">
            {course.thumbnail}
          </div>
          <Badge className={COURSE_PLATFORMS[course.platform]}>
            {course.platform}
          </Badge>
        </div>

        {/* Title + meta */}
        <div className="flex-1">
          <h3 className="font-bold text-slate-900 leading-snug line-clamp-2">
            {course.titleId}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {course.durationHours} jam · {formatCompact(course.students)} siswa ·{' '}
            <span className={levelColor(course.level).replace('bg-', 'text-').split(' ')[1]}>
              {levelLabel(course.level)}
            </span>
          </p>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5">
          {course.skillsTaught.slice(0, 3).map((s) => (
            <span
              key={s}
              className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md bg-indigo-50 text-indigo-700"
            >
              {s}
            </span>
          ))}
          {course.skillsTaught.length > 3 && (
            <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-50 text-slate-500">
              +{course.skillsTaught.length - 3}
            </span>
          )}
        </div>

        {/* Footer: price + save */}
        <div className="pt-3 mt-auto border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="min-w-0">
            {isFree ? (
              <span className="text-lg font-extrabold text-emerald-600">Gratis</span>
            ) : (
              <span className="text-lg font-extrabold text-slate-900">
                {formatIDR(course.price)}
              </span>
            )}
          </div>
          <SaveButton
            saved={saved}
            onClick={() =>
              toggleSaveCourse({
                id: course.id,
                title: course.titleId,
                platform: course.platform,
                thumbnail: course.thumbnail,
              })
            }
          />
        </div>
      </div>
    </Card>
  );
}

function SaveButton({ saved, onClick }: { saved: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition active:scale-[.96]',
        saved
          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
      )}
    >
      {saved ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M6 2a2 2 0 0 0-2 2v18l8-5 8 5V4a2 2 0 0 0-2-2H6z" />
          </svg>
          Tersimpan
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          Save
        </>
      )}
    </button>
  );
}
