import Link from 'next/link';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatIDR } from '@/lib/utils';
import { adminListCourses } from '@/lib/supabase/admin-queries';
import { AddCourseForm } from './AddCourseForm';
import { CourseFeaturedToggle } from './CourseFeaturedToggle';
import { DeleteCourseButton } from './DeleteCourseButton';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Kelola Kursus — Admin SkillGig.id',
};

export default async function AdminCoursesPage() {
  const courses = await adminListCourses();

  // Total klik affiliate = sum across courses. Used as a KPI chip in the
  // header so the admin gets an at-a-glance view of monetisation traction.
  const totalClicks = courses.reduce(
    (sum, c) => sum + (c.affiliateClicks ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Kelola Kursus
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Tambah, edit, hapus kursus, toggle <em>featured</em>, dan atur URL
            affiliate (P3-C).
          </p>
        </div>
        <div className="text-xs text-slate-500">
          Total: <span className="font-bold text-slate-900">{courses.length}</span> ·
          Featured:{' '}
          <span className="font-bold text-slate-900">
            {courses.filter((c) => c.featured).length}
          </span>{' '}
          · Klik affiliate:{' '}
          <span className="font-bold text-slate-900">{totalClicks}</span>
        </div>
      </header>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-bold text-slate-900">Tambah kursus</h2>
        </CardHeader>
        <CardBody>
          <AddCourseForm />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-bold text-slate-900">Semua kursus</h2>
        </CardHeader>
        <CardBody className="p-0">
          {courses.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="Belum ada kursus"
                description="Tambah kursus pertama lewat form di atas."
                icon="📚"
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Daftar semua kursus beserta platform, kategori, harga, dan status affiliate</caption>
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-100">
                    <th className="px-5 py-3 font-semibold">Judul</th>
                    <th className="px-5 py-3 font-semibold">Platform</th>
                    <th className="px-5 py-3 font-semibold">Kategori</th>
                    <th className="px-5 py-3 font-semibold">Harga</th>
                    <th className="px-5 py-3 font-semibold">Affiliate</th>
                    <th className="px-5 py-3 font-semibold">Klik</th>
                    <th className="px-5 py-3 font-semibold">Featured</th>
                    <th className="px-5 py-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr
                      key={course.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                    >
                      <td className="px-5 py-3 font-medium text-slate-900 max-w-xs">
                        <div className="truncate" title={course.title}>
                          {course.thumbnail} {course.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {course.durationHours} jam · {course.level}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone="slate">{course.platform}</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone="violet">{course.category}</Badge>
                      </td>
                      <td className="px-5 py-3 text-slate-700 whitespace-nowrap">
                        {course.price === 0 ? (
                          <Badge tone="emerald">Gratis</Badge>
                        ) : (
                          formatIDR(course.price)
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {course.affiliateUrl ? (
                          <Badge tone="amber">Aktif</Badge>
                        ) : (
                          <Badge tone="slate">—</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-700 whitespace-nowrap tabular-nums">
                        {(course.affiliateClicks ?? 0).toLocaleString('id-ID')}
                      </td>
                      <td className="px-5 py-3">
                        <CourseFeaturedToggle
                          id={course.id}
                          featured={course.featured}
                        />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/courses/${course.id}`}
                            className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition"
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
        </CardBody>
      </Card>
    </div>
  );
}
