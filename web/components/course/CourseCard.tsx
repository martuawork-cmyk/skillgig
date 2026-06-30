'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useToast, Toast } from '@/components/ui/Toast';
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
  // the plain course URL. If neither exists the "Mulai Belajar" button is
  // disabled so we don't promise an outbound journey we can't deliver.
  const fallbackUrl = (course.url ?? '').trim();
  const affiliateUrl = (course.affiliateUrl ?? '').trim();
  const canStart = Boolean(affiliateUrl || fallbackUrl);

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
          <SaveButton saved={saved} onClick={handleToggle} />
        </div>

        {/* Primary CTA — P3-C: routes through /api/affiliate-click so each
            tap is logged. We fall back to opening the plain course.url in a
            new tab when JS isn't available (no-preflight fallback). */}
        <StartLearningButton
          courseId={course.id}
          courseTitle={course.titleId}
          fallbackUrl={fallbackUrl || '#'}
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
  fallbackUrl,
  canStart,
  onError,
}: {
  courseId: string;
  courseTitle: string;
  fallbackUrl: string;
  canStart: boolean;
  onError: (msg: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!canStart) {
      e.preventDefault();
      onError('Kursus ini belum punya tautan tujuan.');
      return;
    }

    // Modifier-keys / middle-click → let the browser open in a new tab
    // untouched. We only intercept the "primary click" path so power users
    // can still middle-click to background the click while we log it.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    e.preventDefault();

    setLoading(true);
    try {
      const res = await fetch('/api/affiliate-click', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });
      const data = (await res.json()) as
        | { ok: true; redirectUrl: string }
        | { ok: false; message?: string };

      if (!res.ok || !data.ok) {
        // Click logging failed — still send the user somewhere sensible.
        window.location.replace(fallbackUrl);
        return;
      }
      // `replace` keeps the back-button clean — the click-redirect hop
      // doesn't appear in the history stack.
      window.location.replace(data.redirectUrl);
    } catch {
      // Network down (offline, CORS, etc.) — fall back to the plain URL.
      window.location.replace(fallbackUrl);
    } finally {
      // We don't flip `loading` back to false here because the page is
      // about to navigate away. Resetting on the off chance the redirect
      // takes a moment keeps the UI honest.
      setTimeout(() => setLoading(false), 1500);
    }
  };

  return (
    <a
      href={fallbackUrl}
      onClick={handleClick}
      rel="noopener noreferrer sponsored"
      target="_blank"
      aria-label={`Mulai belajar ${courseTitle}`}
      data-affiliate-cta="true"
      className={cn(
        'mt-1 inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-bold rounded-lg transition active:scale-[.98]',
        canStart
          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
          : 'bg-slate-200 text-slate-500 cursor-not-allowed',
        loading && 'opacity-70 pointer-events-none',
      )}
    >
      {loading ? (
        <>
          <span
            className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin"
            aria-hidden
          />
          Membuka…
        </>
      ) : (
        <>
          Mulai Belajar
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </>
      )}
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
