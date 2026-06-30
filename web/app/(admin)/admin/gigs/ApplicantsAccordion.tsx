'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ApplicantRow } from './ApplicantRow';
import type { ApplicantWithUser } from '@/lib/supabase/admin-queries';

export function ApplicantsAccordion({
  gigId,
  applicants,
}: {
  gigId: string;
  applicants: ApplicantWithUser[];
}) {
  // Single-open accordion: only one gig row shows its applicants at a time.
  // We're not using native <details> because we need cross-row coordination.
  const [openId, setOpenId] = useState<string | null>(null);
  const isOpen = openId === gigId;

  // Empty-state for gigs with no applicants — render a non-clickable chip.
  if (applicants.length === 0) {
    return (
      <Badge tone="slate">
        0 pelamar
      </Badge>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpenId(isOpen ? null : gigId)}
        className="inline-flex items-center gap-2 px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md transition"
        aria-expanded={isOpen}
        aria-controls={`applicants-${gigId}`}
      >
        {applicants.length} pelamar
        <span aria-hidden className="text-[10px]">
          {isOpen ? '▴' : '▾'}
        </span>
      </button>

      {isOpen && (
        <div
          id={`applicants-${gigId}`}
          className="absolute z-20 mt-2 w-[420px] max-w-[80vw] bg-white border border-slate-200 rounded-xl shadow-xl"
        >
          <div className="px-5 py-2.5 border-b border-slate-100 bg-slate-50 rounded-t-xl">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Daftar pelamar · {applicants.length}
            </p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {applicants.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  title="Belum ada pelamar"
                  description="Belum ada yang melamar gig ini."
                  icon="📭"
                />
              </div>
            ) : (
              applicants.map((a) => <ApplicantRow key={a.id} applicant={a} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}
