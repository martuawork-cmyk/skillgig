import Link from 'next/link';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { CourseCard } from '@/components/course/CourseCard';
import { courses } from '@/lib/mock';

export default function LearnPage() {
  const enrolled = courses.filter((c) => c.enrolled);
  const available = courses.filter((c) => !c.enrolled);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10">
      <header>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-2">
          <span>📚</span> STEP 1 OF 5
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Belajar skill digital
        </h1>
        <p className="mt-2 text-slate-600 max-w-2xl">
          Mulai dari course terstruktur. Lanjutkan sesuai ritme kamu, dan langsung praktek
          lewat gig di step berikutnya.
        </p>
      </header>

      {/* Continue Learning */}
      {enrolled.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Lanjut Belajar</h2>
            <span className="text-xs text-slate-500">{enrolled.length} course aktif</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolled.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </section>
      )}

      {/* Available courses */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Jelajahi Course</h2>
          <span className="text-xs text-slate-500">{available.length} tersedia</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {available.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      </section>

      {/* Info card */}
      <Card>
        <CardHeader>
          <h3 className="font-bold text-slate-900">💡 Tips untuk fase Learn</h3>
        </CardHeader>
        <CardBody className="text-sm text-slate-600 space-y-2 leading-relaxed">
          <p>
            Pilih 1-2 skill yang ingin kamu kuasai dulu, bukan semua sekaligus.
            Fokus 30-60 menit per hari lebih efektif daripada 4 jam di akhir pekan.
          </p>
          <p>
            Setelah selesai course, langsung praktek di step berikutnya —{' '}
            <Link href="/skills" className="text-indigo-600 font-semibold hover:underline">
              Build Skill
            </Link>{' '}
            — dengan project nyata.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}