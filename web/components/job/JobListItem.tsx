'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { useToast, Toast } from '@/components/ui/Toast';
import { CompanyLogo } from '@/components/job/CompanyLogo';
import type { Gig } from '@/lib/types';
import { formatSalaryRange, timeAgo, jobTypeColor, cn } from '@/lib/utils';
import { jobLevelLabel, jobCategoryLabel, isSalaryHidden, jobLocation } from '@/lib/job-utils';
import { useSavedStore } from '@/lib/store/savedStore';
import { track, AnalyticsEvent } from '@/lib/analytics';

type Props = {
  gig: Gig;
};

/**
 * Compact single-row variant of JobCard for the /jobs "List View" toggle. The
 * horizontal layout fits ~12 rows per screen (vs ~6 grid cards) so power users
 * scanning a long board get density without losing the essentials: company,
 * title, salary, type, and the Lamar / Simpan actions.
 */
export function JobListItem({ gig }: Props) {
  const bookmarked = useSavedStore((s) => s.isGigSaved(gig.id));
  const toggleSaveGig = useSavedStore((s) => s.toggleSaveGig);
  const { toast, showToast } = useToast();

  const handleApply = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    track(AnalyticsEvent.GigApplyClicked, {
      gig_id: gig.id,
      platform: gig.platform,
      job_type: gig.jobType,
    });
    window.open(gig.url, '_blank', 'noopener,noreferrer');
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const wasSaved = bookmarked;
    if (!wasSaved) track(AnalyticsEvent.JobSaved, { gig_id: gig.id });
    void toggleSaveGig({ id: gig.id, title: gig.titleId, platform: gig.platform });
    showToast(wasSaved ? 'Bookmark dihapus' : 'Lowongan tersimpan', wasSaved ? 'info' : 'success');
  };

  const salaryMin = gig.salaryMin ?? gig.budgetMin;
  const salaryMax = gig.salaryMax ?? gig.budgetMax;
  const salaryHidden = isSalaryHidden(salaryMin, salaryMax);
  const location = jobLocation(gig.location, gig.isRemote);

  return (
    <div className="group relative">
      <div className="flex flex-col gap-3 px-4 sm:px-5 py-4 bg-white border border-slate-200 rounded-xl shadow-soft transition hover:border-indigo-300 hover:shadow-md sm:flex-row sm:items-center">
        {/* Company + title */}
        <div className="flex items-start gap-3 min-w-0 sm:flex-1">
          <CompanyLogo logo={gig.company_logo} name={gig.company} />
          <div className="min-w-0">
            <Link
              href={`/jobs/${gig.id}`}
              className="font-bold text-slate-900 group-hover:text-indigo-600 transition leading-snug line-clamp-1"
            >
              {gig.titleId}
            </Link>
            <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span className="font-medium text-slate-700">{gig.company || gig.platform}</span>
              <span aria-hidden>·</span>
              <span aria-hidden>📍</span>
              <span className="truncate">{location}</span>
            </p>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {gig.jobType && (
                <Badge className={cn(jobTypeColor(gig.jobType), 'text-[10px]')}>{gig.jobType}</Badge>
              )}
              <Badge className="bg-slate-100 text-slate-700 text-[10px]">
                {jobCategoryLabel(gig.category)}
              </Badge>
              <Badge className="bg-violet-100 text-violet-700 text-[10px]">
                {jobLevelLabel(gig.level)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Salary + meta (right-aligned on desktop) */}
        <div className="flex items-center justify-between gap-4 sm:justify-end sm:shrink-0 border-t border-slate-100 pt-3 sm:border-0 sm:pt-0">
          <div className="text-left sm:text-right">
            <p className="font-extrabold text-slate-900 text-sm">
              {salaryHidden
                ? 'Gaji nego'
                : formatSalaryRange(salaryMin, salaryMax, gig.salaryCurrency ?? 'IDR')}
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">{timeAgo(gig.postedAt)}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApply}
              className="px-3 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition active:scale-[.98]"
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
              {bookmarked ? '✓' : 'Simpan'}
            </button>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} tone={toast.tone} />}
    </div>
  );
}
