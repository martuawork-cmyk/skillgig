import Link from 'next/link';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
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

export default function ApplicationsPage() {
  const myApps = applications
    .filter((a) => a.freelancerId === CURRENT_USER_ID)
    .sort((a, b) => +new Date(b.appliedAt) - +new Date(a.appliedAt));

  const stats = {
    total: myApps.length,
    pending: myApps.filter((a) => a.status === 'pending').length,
    accepted: myApps.filter((a) => a.status === 'accepted').length,
    rejected: myApps.filter((a) => a.status === 'rejected').length,
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total"    value={stats.total}    tone="bg-slate-100 text-slate-700" />
        <StatCard label="Pending"  value={stats.pending}  tone="bg-amber-100 text-amber-700" />
        <StatCard label="Accepted" value={stats.accepted} tone="bg-emerald-100 text-emerald-700" />
        <StatCard label="Rejected" value={stats.rejected} tone="bg-rose-100 text-rose-700" />
      </div>

      {/* List */}
      <section>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Riwayat lamaran</h2>

        {myApps.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <p className="text-slate-500">Belum ada lamaran.</p>
              <Link
                href="/gigs"
                className="mt-3 inline-block text-sm text-indigo-600 font-semibold hover:underline"
              >
                Cari gig pertama kamu →
              </Link>
            </CardBody>
          </Card>
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

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="px-4 py-3 bg-white border border-slate-200 rounded-xl">
      <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${tone}`}>
        {label}
      </span>
      <p className="text-2xl font-extrabold text-slate-900 mt-1">{value}</p>
    </div>
  );
}