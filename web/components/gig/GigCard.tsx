'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tag } from '@/components/ui/Tag';
import { useToast, Toast } from '@/components/ui/Toast';
import type { Gig } from '@/lib/types';
import {
  formatSalaryRange,
  timeAgo,
  categoryColor,
  categoryLabel,
  jobTypeColor,
  levelLabel,
  levelColor,
  isUrlUnavailable,
  cn,
} from '@/lib/utils';
import { useSavedStore } from '@/lib/store/savedStore';
import { UrlUnavailableBadge } from '@/components/ui/UrlUnavailableBadge';
import { track, AnalyticsEvent } from '@/lib/analytics';

type Props = {
  gig: Gig;
};

export function GigCard({ gig }: Props) {
  const bookmarked = useSavedStore((s) => s.isGigSaved(gig.id));
  const toggleSaveGig = useSavedStore((s) => s.toggleSaveGig);
  const { toast, showToast } = useToast();

  // Seed gigs sometimes carry a fake/placeholder URL — detect once so we can
  // disable "Lamar" and explain why.
  const urlBad = isUrlUnavailable(gig.url);

  // Real gigs live on external platforms (Upwork, LinkedIn, …) — "Lamar" opens
  // the listing in a new tab rather than routing to an internal page.
  const handleApply = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (urlBad) return;
    track(AnalyticsEvent.GigApplyClicked, {
      gig_id: gig.id,
      platform: gig.platform,
      job_type: gig.jobType,
    });
    window.open(gig.url, '_blank', 'noopener,noreferrer');
  };

  // "Simpan" toggles the Zustand store, which optimistically updates local
  // state and then syncs the saved_items row to Supabase.
  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const wasSaved = bookmarked;
    if (!wasSaved) track(AnalyticsEvent.JobSaved, { gig_id: gig.id });
    void toggleSaveGig({
      id: gig.id,
      title: gig.titleId,
      platform: gig.platform,
    });
    showToast(
      wasSaved ? 'Bookmark dihapus' : 'Gig tersimpan',
      wasSaved ? 'info' : 'success',
    );
  };

  // Full-Time salaried roles have no fixed project window — show the job type
  // instead of a misleading "nullw".
  const durationLabel =
    gig.durationWeeks != null ? `${gig.durationWeeks}w` : (gig.jobType ?? 'Full-Time');

  // Synced Remotive gigs often omit salary — both bounds land at 0. Show a
  // "nego" placeholder instead of the meaningless "USD 0–0/bln".
  const salaryMin = gig.salaryMin ?? gig.budgetMin;
  const salaryMax = gig.salaryMax ?? gig.budgetMax;
  const salaryHidden = salaryMin === 0 && salaryMax === 0;

  return (
    <div className="group relative">
      <Card className="h-full flex flex-col hover:border-indigo-300 hover:shadow-md transition group-hover:-translate-y-0.5">
        <div className="px-5 sm:px-6 py-5 space-y-3 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge className={categoryColor(gig.category)}>
                {categoryLabel(gig.category)}
              </Badge>
              {gig.jobType && (
                <Badge className={jobTypeColor(gig.jobType)}>{gig.jobType}</Badge>
              )}
              {gig.isRemote && (
                <Badge className="bg-emerald-100 text-emerald-700">Remote</Badge>
              )}
              {/* Remotive ToS attribution — only on synced Remotive gigs. */}
              {gig.platform === 'Remotive' && (
                <Badge className="bg-teal-100 text-teal-700">via Remotive</Badge>
              )}
            </div>
            <Badge className={levelColor(gig.level)}>
              {levelLabel(gig.level)}
            </Badge>
            {urlBad && <UrlUnavailableBadge />}
          </div>

          <div>
            <Link
              href={`/gigs/${gig.id}`}
              className="font-bold text-slate-900 group-hover:text-indigo-600 transition leading-snug line-clamp-2"
            >
              {gig.titleId}
            </Link>
            {(gig.company || gig.company_logo) && (
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                {gig.company_logo &&
                  (gig.company_logo.startsWith('http') ? (
                    // Remotive sends a logo URL (not an emoji) — render it.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={gig.company_logo}
                      alt=""
                      width={16}
                      height={16}
                      className="h-4 w-4 rounded object-contain"
                    />
                  ) : (
                    // Legacy / seed gigs store an emoji here.
                    <span aria-hidden>{gig.company_logo}</span>
                  ))}
                {gig.company && <span className="font-medium text-slate-600">{gig.company}</span>}
              </p>
            )}
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              {gig.descriptionId}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {gig.skillsRequired.slice(0, 3).map((s) => (
              <Tag key={s}>{s}</Tag>
            ))}
            {gig.skillsRequired.length > 3 && (
              <Tag className="bg-slate-50 text-slate-500">
                +{gig.skillsRequired.length - 3}
              </Tag>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">
                Salary
              </p>
              <p className="font-bold text-slate-900 text-sm truncate">
                {salaryHidden
                  ? 'Gaji nego'
                  : formatSalaryRange(
                      salaryMin,
                      salaryMax,
                      gig.salaryCurrency ?? 'IDR',
                    )}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">
                {durationLabel} · {gig.applicantsCount} applicants
              </p>
              <p className="text-xs text-slate-500">{timeAgo(gig.postedAt)}</p>
            </div>
          </div>

          {/* Action buttons — siblings of the title link (not nested), so they
              stay valid interactive elements while the title still navigates. */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApply}
              disabled={urlBad}
              aria-disabled={urlBad}
              className={cn(
                'flex-1 px-3 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg transition active:scale-[.98]',
                urlBad && 'opacity-50 cursor-not-allowed',
              )}
            >
              Lamar
            </button>
            <button
              type="button"
              onClick={handleToggle}
              aria-pressed={bookmarked}
              aria-label={bookmarked ? 'Hapus bookmark' : 'Simpan gig'}
              className={cn(
                'px-3 py-2 text-sm font-semibold rounded-lg transition active:scale-[.98] flex items-center gap-1',
                bookmarked
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
              )}
            >
              {bookmarked ? '✓ Tersimpan' : 'Simpan'}
            </button>
          </div>
        </div>
      </Card>

      {toast && <Toast message={toast.message} tone={toast.tone} />}
    </div>
  );
}
