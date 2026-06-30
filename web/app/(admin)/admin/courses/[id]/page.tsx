import Link from 'next/link';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { adminListCourses } from '@/lib/supabase/admin-queries';
import { EditCourseForm } from './EditCourseForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Edit Kursus — Admin SkillGig.id',
};

type Props = { params: { id: string } };

export default async function EditCoursePage({ params }: Props) {
  const courses = await adminListCourses();
  const course = courses.find((c) => c.id === params.id);

  if (!course) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/courses"
          className="text-sm text-indigo-600 hover:underline"
        >
          ← Kembali ke daftar kursus
        </Link>
        <EmptyState
          title="Kursus tidak ditemukan"
          description="Mungkin sudah dihapus atau ID-nya salah."
          icon="🔎"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <Link
          href="/admin/courses"
          className="text-xs text-indigo-600 hover:underline"
        >
          ← Kembali ke daftar kursus
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          Edit Kursus
        </h1>
        <p className="text-sm text-slate-600 mt-1 truncate">
          {course.thumbnail} {course.title}
        </p>
      </header>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-bold text-slate-900">Detail kursus</h2>
        </CardHeader>
        <CardBody>
          <EditCourseForm course={course} />
        </CardBody>
      </Card>
    </div>
  );
}
