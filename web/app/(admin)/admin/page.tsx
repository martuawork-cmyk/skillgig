import Link from 'next/link';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { StatsGrid } from '@/components/ui/StatsGrid';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatIDR, formatDate, categoryColor, categoryLabel } from '@/lib/utils';
import {
  adminCounts,
  adminCountPublishedGigs,
  adminLatestGigs,
} from '@/lib/supabase/admin-queries';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin Dashboard — SkillGig.id',
};

export default async function AdminDashboardPage() {
  // Counts run in parallel — they hit Supabase with separate count queries.
  const [counts, publishedGigs, latest] = await Promise.all([
    adminCounts(),
    adminCountPublishedGigs(),
    adminLatestGigs(5),
  ]);

  const stats = [
    {
      label: 'Total users',
      value: counts.users.toLocaleString('id-ID'),
      icon: '👥',
      accent: 'from-indigo-500 to-violet-500',
    },
    {
      label: 'Gigs published',
      value: publishedGigs.toLocaleString('id-ID'),
      icon: '🛠️',
      accent: 'from-emerald-500 to-teal-500',
    },
    {
      label: 'Kursus',
      value: counts.courses.toLocaleString('id-ID'),
      icon: '📚',
      accent: 'from-amber-500 to-orange-500',
    },
    {
      label: 'Subscribers',
      value: counts.subscribers.toLocaleString('id-ID'),
      icon: '✉️',
      accent: 'from-rose-500 to-pink-500',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Ringkasan data SkillGig.id. Server-rendered setiap request.
        </p>
      </header>

      <StatsGrid stats={stats} />

      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Gig terbaru</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              5 listing paling baru dibuat, semua status.
            </p>
          </div>
          <Link
            href="/admin/gigs"
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            Kelola gigs →
          </Link>
        </CardHeader>
        <CardBody className="p-0">
          {latest.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="Belum ada gig"
                description="Tambah listing pertama dari halaman Kelola Gigs."
                icon="🛠️"
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-100">
                    <th className="px-5 py-3 font-semibold">Judul</th>
                    <th className="px-5 py-3 font-semibold">Kategori</th>
                    <th className="px-5 py-3 font-semibold">Budget</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {latest.map((gig) => (
                    <tr key={gig.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-3 font-medium text-slate-900 max-w-md truncate">
                        {gig.title}
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone="slate" className={categoryColor(gig.category)}>
                          {categoryLabel(gig.category)}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-slate-700 whitespace-nowrap">
                        {formatIDR(gig.budgetMin)} – {formatIDR(gig.budgetMax)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={gig.status} />
                      </td>
                      <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                        {formatDate(gig.postedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: 'draft' | 'published' | 'expired' }) {
  switch (status) {
    case 'published':
      return <Badge tone="emerald">Published</Badge>;
    case 'draft':
      return <Badge tone="slate">Draft</Badge>;
    case 'expired':
      return <Badge tone="amber">Expired</Badge>;
  }
}
