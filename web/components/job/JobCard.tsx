'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useToast, Toast } from '@/components/ui/Toast';
import { CompanyLogo } from '@/components/job/CompanyLogo';
import type { Gig } from '@/lib/types';
import { formatSalaryRange, timeAgo, jobTypeColor, isUrlUnavailable, cn } from '@/lib/utils';
import { jobLevelLabel, jobCategoryLabel, isSalaryHidden, jobLocation } from '@/lib/job-utils';
import { useSavedStore } from '@/lib/store/savedStore';
import { UrlUnavailableBadge } from '@/components/ui/UrlUnavailableBadge';
import { track, AnalyticsEvent } from '@/lib/analytics';

type Props = {
  gig: Gig;
};

/**
 * Company-focused card for the /jobs board — distinct from GigCard, which is
 * tuned for freelance projects. Leads with the company (logo + name + location)
 * and surfaces salary, employment type, and a "Lamar" CTA that opens the
 * original listing in a new tab.
 */
export function JobCard({ gig }: Props) {
  const bookmarked = useSavedStore((s) => s.isGigSaved(gig.id));
  const toggleSaveGig = useSavedStore((s) => s.toggleSaveGig);
  const { toast, showToast } = useToast();

  // Seed jobs sometimes carry a fake/placeholder URL — detect once so we can
  // disable "Lamar" and explain why.
  const urlBad = isUrlUnavailable(gig.url);

  // Real jobs live on external platforms (Remotive, LinkedIn, …) — "Lamar"
  // opens the listing in a new tab rather than routing to an internal page.
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
  // state and then syncs the saved_items row to Supabase. Jobs are gigs in
  // the same table, so they save as item_type = 'gig'.
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
      wasSaved ? 'Bookmark dihapus' : 'Lowongan tersimpan',
      wasSaved ? 'info' : 'success',
    );
  };

  const salaryMin = gig.salaryMin ?? gig.budgetMin;
  const salaryMax = gig.salaryMax ?? gig.budgetMax;
  const salaryHidden = isSalaryHidden(salaryMin, salaryMax);
  const location = jobLocation(gig.location, gig.isRemote);

  return (
    <div className="group relative h-full">
      <Card className="h-full flex flex-col hover:border-indigo-300 hover:shadow-md transition group-hover:-translate-y-0.5">
        <div className="px-5 sm:px-6 py-5 space-y-3 flex flex-col flex-1">
          {/* Company row — logo + name + location, with posted time on the right */}
          <div className="flex items-center gap-3 min-w-0">
            <CompanyLogo logo={gig.company_logo} name={gig.company} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-700 truncate">
                {gig.company || gig.platform}
              </p>
              <p className="text-xs text-slate-600 truncate flex items-center gap-1">
                <span aria-hidden>📍</span>
                {location}
              </p>
            </div>
            <span className="ml-auto text-xs text-slate-500 shrink-0">
              {timeAgo(gig.postedAt)}
            </span>
          </div>

          {/* Title */}
          <div>
            <Link
              href={`/jobs/${gig.id}`}
              className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition leading-snug line-clamp-2"
            >
              {gig.titleId}
            </Link>
          </div>

          {/* Badges: job type | category | level */}
          <div className="flex flex-wrap items-center gap-1.5">
            {gig.jobType && (
              <Badge className={jobTypeColor(gig.jobType)}>{gig.jobType}</Badge>
            )}
            <Badge className="bg-slate-100 text-slate-700">
              {jobCategoryLabel(gig.category)}
            </Badge>
            <Badge className="bg-violet-100 text-violet-700">
              {jobLevelLabel(gig.level)}
            </Badge>
            {urlBad && <UrlUnavailableBadge />}
          </div>

          {/* Salary */}
          <p className="text-base font-extrabold text-slate-900">
            {salaryHidden
              ? 'Gaji nego'
              : formatSalaryRange(salaryMin, salaryMax, gig.salaryCurrency ?? 'IDR', 'thn')}
          </p>

          {/* Snippet */}
          <p className="text-xs text-slate-600 line-clamp-2">{gig.descriptionId}</p>

          {/* Action buttons — siblings of the title link (not nested) */}
          <div className="pt-3 border-t border-slate-100 mt-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handleApply}
              disabled={urlBad}
              aria-disabled={urlBad}
              className={cn(
                'flex-1 px-3 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition active:scale-[.98]',
                urlBad && 'opacity-50 cursor-not-allowed',
              )}
            >
              Lamar
            </button>
            <button
              type="button"
              onClick={handleToggle}
              aria-pressed={bookmarked}
              aria-label={bookmarked ? 'Hapus bookmark' : 'Simpan lowongan'}
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
