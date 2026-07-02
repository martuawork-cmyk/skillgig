'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useToast, Toast } from '@/components/ui/Toast';
import { COURSE_PLATFORMS, coursePlatformIcon, type Course } from '@/lib/types';
import { formatCoursePrice, formatCompact, levelColor, levelLabel, isUrlUnavailable, cn } from '@/lib/utils';
import { useSavedStore } from '@/lib/store/savedStore';
import { UrlUnavailableBadge } from '@/components/ui/UrlUnavailableBadge';
import { track, AnalyticsEvent } from '@/lib/analytics';

type Props = {
  course: Course;
};

export function CourseCard({ course }: Props) {
  const isFree = course.price === 0;
  const saved = useSavedStore((s) => s.isCourseSaved(course.id));
  const toggleSaveCourse = useSavedStore((s) => s.toggleSaveCourse);
  const { toast, showToast } = useToast();

  const handleToggle = async () => {
    const wasSaved = saved;
    void toggleSaveCourse({
      id: course.id,
      title: course.titleId,
      platform: course.platform,
      thumbnail: course.thumbnail,
    });
    showToast(
      wasSaved ? 'Bookmark dihapus' : 'Kursus tersimpan',
      wasSaved ? 'info' : 'success',
    );
  };

  // Affiliate target: admin-set monetised URL wins; otherwise fall back to
  // the plain course URL. If neither exists (or the URL is a fake/placeholder)
  // the "Mulai Belajar" button is disabled so we don't promise an outbound
  // journey we can't deliver.
  const fallbackUrl = (course.url ?? '').trim();
  const affiliateUrl = (course.affiliateUrl ?? '').trim();
  const target = affiliateUrl || fallbackUrl;
  const hasUrl = Boolean(target);
  const urlBad = isUrlUnavailable(target);
  const canStart = hasUrl && !urlBad;

  return (
    <Card className="h-full hover:border-indigo-300 hover:shadow-md transition flex flex-col">
      <div className="px-5 sm:px-6 py-5 flex-1 flex flex-col gap-3">
        {/* Thumbnail + platform / featured badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 grid place-items-center text-3xl shrink-0">
            {course.thumbnail}
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {course.featured && (
              <Badge tone="amber">
                <span aria-hidden>⭐</span> FEATURED
              </Badge>
            )}
            <Badge className={COURSE_PLATFORMS[course.platform]}>
              <span aria-hidden>{coursePlatformIcon(course.platform)}</span>
              {course.platform}
            </Badge>
          </div>
        </div>

        {/* Title + rating + meta */}
        <div className="flex-1">
          <h3 className="font-bold text-slate-900 leading-snug line-clamp-2">
            {course.titleId}
          </h3>
          {course.rating > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-amber-400 text-sm leading-none" aria-hidden>
                ★
              </span>
              <span className="text-xs font-semibold text-slate-700">
                {course.rating.toFixed(1)}
              </span>
            </div>
          )}
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
              <Badge tone="emerald">GRATIS</Badge>
            ) : (
              <span className="text-lg font-extrabold text-slate-900">
                {formatCoursePrice(course.price)}
              </span>
            )}
          </div>
          <SaveButton saved={saved} onClick={handleToggle} />
        </div>

        {/* Primary CTA — P3-C: opens the affiliate target in a NEW TAB and
            logs the click via /api/affiliate-click (fire-and-forget). If the
            course has no real link yet we disable the button and, when the URL
            is a fake/placeholder, surface a "URL tidak tersedia" badge. */}
        {hasUrl && urlBad && <UrlUnavailableBadge className="mt-1" />}
        <StartLearningButton
          courseId={course.id}
          courseTitle={course.titleId}
          platform={course.platform}
          url={target}
          canStart={canStart}
          onError={(msg) => showToast(msg, 'error')}
        />
      </div>

      {toast && <Toast message={toast.message} tone={toast.tone} />}
    </Card>
  );
}

function StartLearningButton({
  courseId,
  courseTitle,
  platform,
  url,
  canStart,
  onError,
}: {
  courseId: string;
  courseTitle: string;
  platform: string;
  url: string;
  canStart: boolean;
  onError: (msg: string) => void;
}) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!canStart) {
      e.preventDefault();
      onError('Kursus ini belum punya tautan tujuan.');
      return;
    }

    track(AnalyticsEvent.CourseStartClicked, {
      course_id: courseId,
      platform,
    });

    // Modifier-keys / middle-click → let the browser open the anchor's href
    // (`target="_blank"`) untouched. We only intercept the primary-click path
    // so power users can still middle-click to background the tab.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    e.preventDefault();

    // Open the course in a NEW TAB. Opening synchronously inside the click
    // handler (rather than after an `await`) keeps us inside the user-gesture
    // window, so popup blockers don't eat the new tab.
    window.open(url, '_blank', 'noopener,noreferrer');

    // Best-effort click log — fire and forget. We open a new tab (the current
    // page stays put), so a normal fetch is fine; `keepalive` covers the case
    // where the user immediately closes the tab.
    void fetch('/api/affiliate-click', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ courseId }),
      keepalive: true,
    }).catch(() => {
      /* analytics is best-effort — never block the user */
    });
  };

  return (
    <a
      href={canStart ? url : '#'}
      onClick={handleClick}
      aria-disabled={!canStart}
      aria-label={`Mulai belajar ${courseTitle}`}
      data-affiliate-cta="true"
      className={cn(
        'mt-1 inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-bold rounded-lg transition active:scale-[.98]',
        canStart
          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
          : 'bg-slate-200 text-slate-500 cursor-not-allowed opacity-50',
      )}
    >
      Mulai Belajar
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M5 12h14M13 5l7 7-7 7" />
      </svg>
    </a>
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
