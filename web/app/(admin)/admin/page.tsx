import Link from 'next/link';
import { BookOpen, Briefcase, Mail, Users } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { StatusBadge } from '@/components/admin/Badge';
import { formatIDR, formatDate, categoryColor, categoryLabel } from '@/lib/utils';
import {
  adminCounts,
  adminCountPublishedGigs,
  adminLatestGigs,
  adminLatestCourses,
  adminLatestSubscribers,
} from '@/lib/supabase/admin-queries';
import { DeleteGigButton } from './gigs/DeleteGigButton';
import { ApproveGigButton } from './gigs/ApproveGigButton';
import { DeleteCourseButton } from './courses/DeleteCourseButton';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Dashboard — Admin SkillGig.id',
};

// Course categories are a different taxonomy from gigs (design/tech/marketing),
// so the gig `categoryColor`/`categoryLabel` helpers don't apply. Tiny inline
// map keeps the "Kursus Terbaru" table readable without touching shared utils.
const COURSE_CATEGORY_LABEL: Record<string, string> = {
  design: 'Design',
  tech: 'Tech',
  marketing: 'Marketing',
};

/**
 * Admin dashboard. Fetches counts + the 5 newest gigs / courses / subscribers
 * server-side every request (force-dynamic), then renders a KPI row and three
 * "terbaru" preview tables. Destructive actions on the gig table go through the
 * shared ConfirmModal-backed DeleteGigButton; course rows reuse the existing
 * DeleteCourseButton.
 */
export default async function AdminDashboardPage() {
  const [counts, publishedGigs, latestGigs, latestCourses, latestSubscribers] =
    await Promise.all([
      adminCounts(),
      adminCountPublishedGigs(),
      adminLatestGigs(5),
      adminLatestCourses(5),
      adminLatestSubscribers(5),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Ringkasan data SkillGig.id. Diperbarui setiap request."
      />

      {/* KPI row ----------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          value={counts.users.toLocaleString('id-ID')}
          label="Total Users"
          accent="from-indigo-500 to-violet-500"
          trend={{ value: '+12% minggu ini', direction: 'up' }}
        />
        <StatCard
          icon={Briefcase}
          value={publishedGigs.toLocaleString('id-ID')}
          label="Gigs Published"
          accent="from-emerald-500 to-teal-500"
          trend={{ value: '+8% minggu ini', direction: 'up' }}
        />
        <StatCard
          icon={BookOpen}
          value={counts.courses.toLocaleString('id-ID')}
          label="Kursus"
          accent="from-amber-500 to-orange-500"
          trend={{ value: '+15% minggu ini', direction: 'up' }}
        />
        <StatCard
          icon={Mail}
          value={counts.subscribers.toLocaleString('id-ID')}
          label="Subscribers"
          accent="from-rose-500 to-pink-500"
          trend={{ value: '+23% minggu ini', direction: 'up' }}
        />
      </div>

      {/* Gig Terbaru ------------------------------------------------------- */}
      <SectionCard
        title="Gig Terbaru"
        subtitle="5 listing paling baru, semua status."
        viewHref="/admin/gigs"
        viewLabel="Kelola gigs →"
      >
        {latestGigs.length === 0 ? (
          <EmptyRow text="Belum ada gig." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <Th>Judul</Th>
                  <Th>Kategori</Th>
                  <Th>Budget</Th>
                  <Th>Status</Th>
                  <Th>Tanggal</Th>
                  <Th className="text-right">Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {latestGigs.map((gig) => (
                  <tr key={gig.id} className="border-b border-slate-50 last:border-0">
                    <td className="max-w-xs truncate px-5 py-3 font-medium text-slate-900" title={gig.title}>
                      {gig.title}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${categoryColor(gig.category)}`}
                      >
                        {categoryLabel(gig.category)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-700">
                      {formatIDR(gig.budgetMin)} – {formatIDR(gig.budgetMax)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={gig.status} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                      {formatDate(gig.postedAt)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <ApproveGigButton id={gig.id} status={gig.status} />
                        <Link
                          href={`/admin/gigs/${gig.id}`}
                          className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
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
      </SectionCard>

      {/* Kursus Terbaru ---------------------------------------------------- */}
      <SectionCard
        title="Kursus Terbaru"
        subtitle="5 kursus paling baru ditambahkan."
        viewHref="/admin/courses"
        viewLabel="Kelola kursus →"
      >
        {latestCourses.length === 0 ? (
          <EmptyRow text="Belum ada kursus." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <Th>Judul</Th>
                  <Th>Platform</Th>
                  <Th>Kategori</Th>
                  <Th>Harga</Th>
                  <Th>Tanggal</Th>
                  <Th className="text-right">Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {latestCourses.map((course) => (
                  <tr key={course.id} className="border-b border-slate-50 last:border-0">
                    <td className="max-w-xs truncate px-5 py-3 font-medium text-slate-900" title={course.title}>
                      {course.title}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                      {course.platform}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {COURSE_CATEGORY_LABEL[course.category] ?? course.category}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-700">
                      {course.price === 0 ? (
                        <span className="font-semibold text-emerald-600">Gratis</span>
                      ) : (
                        formatIDR(course.price)
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                      {formatDate(course.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/courses/${course.id}`}
                          className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                        >
                          Edit
                        </Link>
                        <DeleteCourseButton id={course.id} title={course.title} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Subscriber Terbaru ----------------------------------------------- */}
      <SectionCard
        title="Subscriber Terbaru"
        subtitle="5 subscriber paling baru, beserta minat skill-nya."
        viewHref="/admin/subscribers"
        viewLabel="Kelola subscribers →"
      >
        {latestSubscribers.length === 0 ? (
          <EmptyRow text="Belum ada subscriber." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <Th>Email</Th>
                  <Th>Skill</Th>
                  <Th>Tanggal</Th>
                </tr>
              </thead>
              <tbody>
                {latestSubscribers.map((sub) => (
                  <tr key={sub.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-3 font-medium text-slate-900">{sub.email}</td>
                    <td className="px-5 py-3">
                      {sub.skillName ? (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                          {sub.skillName}
                        </span>
                      ) : (
                        <span className="text-xs italic text-slate-400">Newsletter saja</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                      {formatDate(sub.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

/* ----------------------------- small layout helpers ----------------------- */

function SectionCard({
  title,
  subtitle,
  viewHref,
  viewLabel,
  children,
}: {
  title: string;
  subtitle?: string;
  viewHref: string;
  viewLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <Link
          href={viewHref}
          className="shrink-0 text-xs font-semibold text-indigo-600 transition hover:underline"
        >
          {viewLabel}
        </Link>
      </div>
      {children}
    </section>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-5 py-3 font-semibold ${className ?? ''}`}>{children}</th>;
}

function EmptyRow({ text }: { text: string }) {
  return <p className="px-5 py-6 text-center text-sm text-slate-400">{text}</p>;
}
