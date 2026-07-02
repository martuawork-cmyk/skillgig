'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Tag } from '@/components/ui/Tag';
import { CompanyLogo } from '@/components/job/CompanyLogo';
import type { Gig } from '@/lib/types';
import {
  formatSalaryRange,
  timeAgo,
  categoryColor,
  categoryLabel,
  jobTypeColor,
  levelColor,
  levelLabel,
  cn,
} from '@/lib/utils';

type Props = {
  gig: Gig;
};

/**
 * Compact single-row variant of GigCard for the /gigs "List View" toggle. Same
 * information density rationale as JobListItem: a horizontal row fits ~3× the
 * cards per screen so users scanning a long freelance board get density
 * without losing the essentials — title, category, salary, skills, and the
 * Lamar / Simpan actions.
 */
export function GigListItem({ gig }: Props) {
  // Full-Time salaried roles have no fixed project window — show the job type
  // instead of a misleading "nullw".
  const durationLabel =
    gig.durationWeeks != null ? `${gig.durationWeeks}w` : (gig.jobType ?? 'Full-Time');

  // Synced Remotive gigs often omit salary — both bounds land at 0. Show a
  // "nego" placeholder instead of the meaningless "Rp 0".
  const salaryMin = gig.salaryMin ?? gig.budgetMin;
  const salaryMax = gig.salaryMax ?? gig.budgetMax;
  const salaryHidden = salaryMin === 0 && salaryMax === 0;

  return (
    <div className="group relative">
      <div className="flex flex-col gap-3 px-4 sm:px-5 py-4 bg-white border border-slate-200 rounded-xl shadow-soft transition hover:border-indigo-300 hover:shadow-md sm:flex-row sm:items-center">
        {/* Title + company + skills */}
        <div className="flex items-start gap-3 min-w-0 sm:flex-1">
          <CompanyLogo logo={gig.company_logo} name={gig.company} />
          <div className="min-w-0">
            <Link
              href={`/gigs/${gig.id}`}
              className="font-bold text-slate-900 group-hover:text-indigo-600 transition leading-snug line-clamp-1"
            >
              {gig.titleId}
            </Link>
            <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{gig.descriptionId}</p>
            {gig.skillsRequired.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                {gig.skillsRequired.slice(0, 4).map((s) => (
                  <Tag key={s} className="text-[10px]">
                    {s}
                  </Tag>
                ))}
                {gig.skillsRequired.length > 4 && (
                  <Tag className="bg-slate-50 text-slate-500 text-[10px]">
                    +{gig.skillsRequired.length - 4}
                  </Tag>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Badges (middle, hidden on mobile to keep the row tight) */}
        <div className="hidden md:flex flex-wrap items-center gap-1.5 lg:shrink-0">
          <Badge className={cn(categoryColor(gig.category), 'text-[10px]')}>
            {categoryLabel(gig.category)}
          </Badge>
          {gig.jobType && (
            <Badge className={cn(jobTypeColor(gig.jobType), 'text-[10px]')}>{gig.jobType}</Badge>
          )}
          <Badge className={cn(levelColor(gig.level), 'text-[10px]')}>{levelLabel(gig.level)}</Badge>
        </div>

        {/* Salary + meta (right-aligned on desktop) */}
        <div className="flex items-center justify-between gap-4 sm:justify-end sm:shrink-0 border-t border-slate-100 pt-3 sm:border-0 sm:pt-0">
          <div className="text-left sm:text-right">
            <p className="font-extrabold text-slate-900 text-sm">
              {salaryHidden
                ? 'Gaji nego'
                : formatSalaryRange(salaryMin, salaryMax, gig.salaryCurrency ?? 'IDR')}
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              {durationLabel} · {gig.applicantsCount} applicants · {timeAgo(gig.postedAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
