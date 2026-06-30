'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { FilterPills } from '@/components/ui/FilterPills';
import { EmptyState } from '@/components/ui/EmptyState';
import { timeAgo, statusColor, statusLabel } from '@/lib/utils';
import type { Application, ApplicationStatus, Gig, User } from '@/lib/types';

type AppSort = 'newest' | 'oldest';
type AppFilter = ApplicationStatus | 'all';

const STATUS_PILLS: { value: AppFilter; label: string }[] = [
  { value: 'all',      label: 'Semua' },
  { value: 'pending',  label: 'Pending' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
];

export function ApplicationsClient({
  initialApps,
  gigsById,
  usersById,
}: {
  initialApps: Application[];
  gigsById: Record<string, Gig>;
  usersById: Record<string, User>;
}) {
  const [statusFilter, setStatusFilter] = useState<AppFilter>('all');
  const [sort, setSort] = useState<AppSort>('newest');

  // Always pre-sorted by created_at DESC on the server; resort here only when
  // the user toggles "oldest".
  const filtered = useMemo(() => {
    return initialApps
      .filter((a) => statusFilter === 'all' || a.status === statusFilter)
      .sort((a, b) => {
        const diff = +new Date(b.appliedAt) - +new Date(a.appliedAt);
        return sort === 'newest' ? diff : -diff;
      });
  }, [initialApps, statusFilter, sort]);

  return (
    <>
      {/* Filter + sort */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <FilterPills<AppFilter>
          items={STATUS_PILLS}
          active={statusFilter}
          onChange={setStatusFilter}
          ariaLabel="Filter lamaran berdasarkan status"
        />
        <label className="flex items-center gap-2 text-sm text-slate-600 shrink-0">
          <span>Sort:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as AppSort)}
            className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
          </select>
        </label>
      </div>

      {/* List */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Riwayat lamaran</h2>
          <span className="text-xs text-slate-500">{filtered.length} lamaran</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon="📭"
            title={initialApps.length === 0 ? 'Belum ada lamaran.' : 'Tidak ada lamaran dengan status ini.'}
            description={initialApps.length === 0 ? 'Cari gig pertamamu dan kirim proposal.' : undefined}
            cta={initialApps.length === 0 ? { label: 'Cari gig pertama', href: '/earn' } : undefined}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((app) => {
              const gig = gigsById[app.gigId];
              if (!gig) return null;
              const client = usersById[gig.clientId];
              return (
                <Card key={app.id} className="hover:border-indigo-300 transition">
                  <CardBody>
                    <div className="flex items-start gap-4">
                      {client && <Avatar initials={client.initials} size="md" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="min-w-0">
                            <Link
                              href={`/gigs/${gig.id}`}
                              className="font-bold text-slate-900 hover:text-indigo-600 transition line-clamp-2"
                            >
                              {gig.titleId}
                            </Link>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Dilamar {timeAgo(app.appliedAt)}
                            </p>
                          </div>
                          <Badge className={statusColor(app.status)}>
                            {statusLabel(app.status)}
                          </Badge>
                        </div>

                        <p className="text-sm text-slate-600 mt-3 line-clamp-3 whitespace-pre-line">
                          <span className="font-semibold text-slate-700">Cover letter:</span>{' '}
                          {app.coverLetter}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
