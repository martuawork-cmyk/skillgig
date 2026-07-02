'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tag } from '@/components/ui/Tag';
import { GIG_PLATFORMS } from '@/lib/types';
import type { Gig } from '@/lib/types';
import {
  formatIDR,
  timeAgo,
  categoryColor,
  categoryLabel,
  levelLabel,
  levelColor,
  isUrlUnavailable,
  cn,
} from '@/lib/utils';
import { useSavedStore } from '@/lib/store/savedStore';
import { UrlUnavailableBadge } from '@/components/ui/UrlUnavailableBadge';

type Props = {
  gig: Gig;
  onApply?: (id: string) => void;
};

export function EarnGigCard({ gig, onApply }: Props) {
  const saved = useSavedStore((s) => s.isGigSaved(gig.id));
  const toggleSaveGig = useSavedStore((s) => s.toggleSaveGig);
  const [applied, setApplied] = useState(false);

  // Seed gigs sometimes carry a fake/placeholder URL — detect once so we can
  // disable "Lamar" and explain why.
  const urlBad = isUrlUnavailable(gig.url);

  const handleToggleSave = () => {
    toggleSaveGig({
      id: gig.id,
      title: gig.titleId,
      platform: gig.platform,
    });
  };

  const handleApply = () => {
    if (urlBad) return;
    if (onApply) onApply(gig.id);
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  return (
    <Card className="h-full flex flex-col hover:border-indigo-300 hover:shadow-md transition">
      <div className="px-5 py-4 flex-1 flex flex-col gap-3">
        {/* Top: category + platform + bookmark */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge className={categoryColor(gig.category)}>
              {categoryLabel(gig.category)}
            </Badge>
            <Badge className={GIG_PLATFORMS[gig.platform]}>
              {gig.platform}
            </Badge>
            {urlBad && <UrlUnavailableBadge />}
          </div>
          <button
            type="button"
            onClick={handleToggleSave}
            aria-pressed={saved}
            aria-label={saved ? 'Hapus dari simpanan' : 'Simpan gig'}
            className={cn(
              'shrink-0 w-8 h-8 grid place-items-center rounded-lg transition active:scale-[.94]',
              saved
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
            )}
          >
            {saved ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M6 2a2 2 0 0 0-2 2v18l8-5 8 5V4a2 2 0 0 0-2-2H6z" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            )}
          </button>
        </div>

        {/* Title */}
        <div className="flex-1">
          <h3 className="font-bold text-slate-900 leading-snug line-clamp-2 text-sm sm:text-base">
            {gig.titleId}
          </h3>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1">
          {gig.skillsRequired.slice(0, 3).map((s) => (
            <Tag key={s} className="bg-indigo-50 text-indigo-700">
              {s}
            </Tag>
          ))}
        </div>

        {/* Meta row: budget + level + posted */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">
              Budget
            </p>
            <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">
              {formatIDR(gig.budgetMin)} – {formatIDR(gig.budgetMax)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <Badge className={levelColor(gig.level)}>
              {levelLabel(gig.level)}
            </Badge>
            <p className="text-[10px] text-slate-500 mt-0.5">{timeAgo(gig.postedAt)}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleApply}
            disabled={applied || urlBad}
            aria-disabled={applied || urlBad}
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition active:scale-[.98]',
              applied
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 shadow-soft',
              urlBad && 'opacity-50 cursor-not-allowed',
            )}
          >
            {applied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Terkirim
              </>
            ) : (
              <>✉️ Lamar</>
            )}
          </button>
          <button
            type="button"
            onClick={handleToggleSave}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition active:scale-[.98] border',
              saved
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50',
            )}
          >
            {saved ? '✓ Tersimpan' : '🔖 Simpan'}
          </button>
        </div>
      </div>
    </Card>
  );
}
