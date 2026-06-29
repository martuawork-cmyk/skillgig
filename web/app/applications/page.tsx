'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { StatsGrid } from '@/components/ui/StatsGrid';
import { FilterPills } from '@/components/ui/FilterPills';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  applications,
  CURRENT_USER_ID,
  getGig,
  getUser,
} from '@/lib/mock';
import {
  formatIDR,
  timeAgo,
  statusColor,
  statusLabel,
} from '@/lib/utils';
import type { ApplicationStatus } from '@/lib/types';

type AppSort = 'newest' | 'oldest';
type AppFilter = ApplicationStatus | 'all';

const STATUS_PILLS: { value: AppFilter; label: string }[] = [
  { value: 'all',      label: 'Semua' },
  { value: 'pending',  label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
];

export default function ApplicationsPage() {
  const [statusFilter, setStatusFilter] = useState<AppFilter>('all');
  const [sort, setSort] = useState<AppSort>('newest');

  const myApps = useMemo(() => {
    return applications
      .filter((a) => a.freelancerId === CURRENT_USER_ID)
      .filter((a) => statusFilter === 'all' || a.status === statusFilter)
      .sort((a, b) => {
        const diff = +new Date(b.appliedAt) - +new Date(a.appliedAt);
        return sort === 'newest' ? diff : -diff;
      });
  }, [statusFilter, sort]);

  // Stats (computed from ALL my apps, not filtered)
  const allMyApps = applications.filter((a) => a.freelancerId === CURRENT_USER_ID);
  const stats = {
    total:    allMyApps.length,
    pending:  allMyApps.filter((a) => a.status === 'pending').length,
    accepted: allMyApps.filter((a) => a.status === 'accepted').length,
    rejected: allMyApps.filter((a) => a.status === 'rejected').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <header>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-2">
          <span>✉️</span> STEP 4 OF 5
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Lamaran kamu
        </h1>
        <p className="mt-2 text-slate-600 max-w-2xl">
          Track semua proposal yang sudah kamu kirim. Klien biasanya merespons dalam
          2-5 hari kerja.
        </p>
      </header>

      {/* Stats */}
      <StatsGrid
        cols={4}
        stats={[
          { label: 'Total',    value: stats.total,    accent: 'from-indigo-500 to-violet-500', icon: '📨' },
          { label: 'Pending',  value: stats.pending,  accent: 'from-amber-500 to-amber-600',   icon: '⏳' },
          { label: 'Accepted', value: stats.accepted, accent: 'from-emerald-500 to-emerald-600', icon: '✅' },
          { label: 'Rejected', value: stats.rejected, accent: 'from-rose-500 to-rose-600',     icon: '❌' },
        ]}
      />

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
          <span className="text-xs text-slate-500">{myApps.length} lamaran</span>
        </div>

        {myApps.length === 0 ? (
          <EmptyState
            icon="📭"
            title={allMyApps.length === 0 ? 'Belum ada lamaran.' : 'Tidak ada lamaran dengan status ini.'}
            description={allMyApps.length === 0 ? 'Cari gig pertamamu dan kirim proposal.' : undefined}
            cta={allMyApps.length === 0 ? { label: 'Cari gig pertama', href: '/gigs' } : undefined}
          />
        ) : (
          <div className="space-y-3">
            {myApps.map((app) => {
              const gig = getGig(app.gigId);
              if (!gig) return null;
              const client = getUser(gig.clientId);
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

                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
                              Rate diajukan
                            </p>
                            <p className="font-bold text-slate-900">{formatIDR(app.proposedRate)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
                              Durasi
                            </p>
                            <p className="font-bold text-slate-900">{app.proposedDurationWeeks} minggu</p>
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
                              Klien
                            </p>
                            <p className="font-bold text-slate-900 truncate">
                              {client?.name}
                            </p>
                          </div>
                        </div>

                        <p className="text-sm text-slate-600 mt-3 line-clamp-2">
                          <span className="font-semibold">Cover:</span> {app.coverLetter}
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
    </div>
  );
}