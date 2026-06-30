import Link from 'next/link';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatIDR, formatDate, categoryColor, categoryLabel } from '@/lib/utils';
import {
  adminListGigs,
  adminListApplicantsGrouped,
} from '@/lib/supabase/admin-queries';
import { AddGigForm } from './AddGigForm';
import { GigStatusToggle } from './GigStatusToggle';
import { DeleteGigButton } from './DeleteGigButton';
import { ApplicantsAccordion } from './ApplicantsAccordion';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Kelola Gigs — Admin SkillGig.id',
};

export default async function AdminGigsPage() {
  // Both queries hit the service-role client — fetch in parallel.
  const [gigs, applicantsByGig] = await Promise.all([
    adminListGigs(),
    adminListApplicantsGrouped().catch(() => ({} as Record<string, never[]>)),
  ]);

  const totalApplicants = Object.values(applicantsByGig).reduce(
    (sum, list) => sum + (list?.length ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Kelola Gigs
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Tambah, edit, hapus, dan toggle status gig (draft / published / expired).
            Klik <em>jumlah pelamar</em> untuk membuka daftar pelamar dan ubah
            status tiap lamaran.
          </p>
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-3">
          <span>
            Total gig:{' '}
            <span className="font-bold text-slate-900">{gigs.length}</span>
          </span>
          <span>
            Total pelamar:{' '}
            <span className="font-bold text-slate-900">{totalApplicants}</span>
          </span>
        </div>
      </header>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-bold text-slate-900">Tambah gig</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Listing baru default berstatus <strong>draft</strong>.
          </p>
        </CardHeader>
        <CardBody>
          <AddGigForm />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-bold text-slate-900">Semua gig</h2>
        </CardHeader>
        <CardBody className="p-0">
          {gigs.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="Belum ada gig"
                description="Tambah listing pertama lewat form di atas."
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
                    <th className="px-5 py-3 font-semibold">Pelamar</th>
                    <th className="px-5 py-3 font-semibold">Tanggal</th>
                    <th className="px-5 py-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {gigs.map((gig) => (
                    <tr
                      key={gig.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 align-top"
                    >
                      <td className="px-5 py-3 font-medium text-slate-900 max-w-xs">
                        <div className="truncate" title={gig.title}>
                          {gig.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {gig.platform} · {gig.durationWeeks} minggu
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${categoryColor(gig.category)}`}
                        >
                          {categoryLabel(gig.category)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-700 whitespace-nowrap">
                        {formatIDR(gig.budgetMin)} – {formatIDR(gig.budgetMax)}
                      </td>
                      <td className="px-5 py-3">
                        <GigStatusToggle id={gig.id} status={gig.status} />
                      </td>
                      <td className="px-5 py-3 relative">
                        <ApplicantsAccordion
                          gigId={gig.id}
                          applicants={applicantsByGig[gig.id] ?? []}
                        />
                      </td>
                      <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                        {formatDate(gig.postedAt)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/gigs/${gig.id}`}
                            className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition"
                          >
                            Edit
                          </Link>
                          <DeleteGigButton id={gig.id} title={gig.title} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <p className="text-xs text-slate-500">
        <Badge tone="slate">tip</Badge> Edit mengarahkan ke halaman detail gig;
        status &amp; hapus bisa langsung dari baris tabel ini.
      </p>
    </div>
  );
}
