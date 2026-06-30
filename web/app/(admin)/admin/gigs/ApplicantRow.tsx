'use client';

import { useState, useTransition } from 'react';
import { useToast, Toast } from '@/components/ui/Toast';
import { Avatar } from '@/components/ui/Avatar';
import { timeAgo, statusColor, statusLabel } from '@/lib/utils';
import type { ApplicationStatus } from '@/lib/types';
import type { ApplicantWithUser } from '@/lib/supabase/admin-queries';
import { updateApplicationStatusAction } from './applicants-actions';

const STATUS_OPTIONS: ApplicationStatus[] = [
  'pending',
  'reviewed',
  'accepted',
  'rejected',
];

export function ApplicantRow({ applicant }: { applicant: ApplicantWithUser }) {
  const [status, setStatus] = useState<ApplicationStatus>(applicant.status);
  const [, startTransition] = useTransition();
  const { toast, showToast } = useToast(2000);

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as ApplicationStatus;
    const prev = status;
    // Optimistic UI — flip locally before the server confirms.
    setStatus(next);
    startTransition(async () => {
      const result = await updateApplicationStatusAction(applicant.id, next);
      if (!result.ok) {
        setStatus(prev);
        showToast(result.error || 'Gagal update status.', 'error');
      } else {
        showToast(`Status diubah ke ${statusLabel(next)}.`, 'success');
      }
    });
  }

  return (
    <div className="flex items-start gap-3 px-5 py-3 border-b border-slate-50 last:border-0">
      <Avatar initials={applicant.userInitials} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {applicant.userName}
            </p>
            <p className="text-[11px] text-slate-500">
              Dilamar {timeAgo(applicant.appliedAt)}
            </p>
          </div>
          <select
            value={status}
            onChange={onChange}
            className={`px-2 py-1 text-[11px] font-semibold rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-indigo-100 ${statusColor(status)}`}
            aria-label="Ubah status lamaran"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-slate-600 mt-2 line-clamp-3 whitespace-pre-line">
          {applicant.coverLetter}
        </p>
      </div>
      {toast && <Toast message={toast.message} tone={toast.tone} />}
    </div>
  );
}
