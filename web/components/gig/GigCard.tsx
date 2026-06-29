import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tag } from '@/components/ui/Tag';
import type { Gig } from '@/lib/types';
import {
  formatIDR,
  timeAgo,
  categoryColor,
  categoryLabel,
  levelLabel,
  levelColor,
} from '@/lib/utils';

export function GigCard({ gig }: { gig: Gig }) {
  return (
    <Link href={`/gigs/${gig.id}`} className="group block">
      <Card className="h-full hover:border-indigo-300 hover:shadow-md transition group-hover:-translate-y-0.5">
        <div className="px-5 sm:px-6 py-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <Badge className={categoryColor(gig.category)}>
              {categoryLabel(gig.category)}
            </Badge>
            <Badge className={levelColor(gig.level)}>
              {levelLabel(gig.level)}
            </Badge>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition leading-snug line-clamp-2">
              {gig.titleId}
            </h3>
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

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
                Budget
              </p>
              <p className="font-bold text-slate-900 text-sm">
                {formatIDR(gig.budgetMin)} – {formatIDR(gig.budgetMax)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
                {gig.durationWeeks}w · {gig.applicantsCount} applicants
              </p>
              <p className="text-xs text-slate-500">{timeAgo(gig.postedAt)}</p>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}