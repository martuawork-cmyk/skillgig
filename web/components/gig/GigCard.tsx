'use client';

import Link from 'next/link';
import { useState } from 'react';
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
  cn,
} from '@/lib/utils';

type Props = {
  gig: Gig;
  /** Optional controlled bookmark state. If omitted, internal state. */
  bookmarked?: boolean;
  onToggleBookmark?: (id: string) => void;
};

export function GigCard({ gig, bookmarked: bookmarkedProp, onToggleBookmark }: Props) {
  const isControlled = bookmarkedProp !== undefined && onToggleBookmark !== undefined;
  const [internal, setInternal] = useState(false);
  const bookmarked = isControlled ? (bookmarkedProp as boolean) : internal;

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isControlled) {
      (onToggleBookmark as (id: string) => void)(gig.id);
    } else {
      setInternal((v) => !v);
    }
  };

  return (
    <div className="group relative">
      <Link href={`/gigs/${gig.id}`} className="block">
        <Card className="h-full hover:border-indigo-300 hover:shadow-md transition group-hover:-translate-y-0.5">
          <div className="px-5 sm:px-6 py-5 space-y-3">
            <div className="flex items-start justify-between gap-3 pr-8">
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

      {/* Bookmark button — positioned absolute top-right, outside the Link */}
      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={bookmarked}
        aria-label={bookmarked ? 'Hapus bookmark' : 'Simpan gig'}
        className={cn(
          'absolute top-3 right-3 w-9 h-9 grid place-items-center rounded-lg transition active:scale-[.94]',
          bookmarked
            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
            : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200 opacity-0 group-hover:opacity-100 focus:opacity-100',
        )}
      >
        {bookmarked ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M6 2a2 2 0 0 0-2 2v18l8-5 8 5V4a2 2 0 0 0-2-2H6z" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </div>
  );
}