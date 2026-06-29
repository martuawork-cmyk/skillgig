import { LearnClient } from '@/components/course/LearnClient';
import { getCourses, isSupabaseConfigured } from '@/lib/supabase/queries';
import { ErrorState } from '@/components/feedback/ErrorState';

export const dynamic = 'force-dynamic';

export default async function LearnPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
        <PageHeader />
        <ErrorState
          title="Belum terkoneksi ke Supabase"
          message="Halaman ini butuh data kursus dari database Supabase."
          hint="Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di web/.env.local, lalu jalankan migration SQL."
        />
      </div>
    );
  }

  const courses = await getCourses();

  if (courses.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
        <PageHeader />
        <ErrorState
          title="Belum ada kursus"
          message="Tabel courses di Supabase kosong."
          hint="Jalankan migration 003_seed.sql untuk menambahkan data kursus contoh."
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <PageHeader />
      <LearnClient initialCourses={courses} />
    </div>
  );
}

function PageHeader() {
  return (
    <header>
      <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-2">
        <span>📚</span> STEP 1 OF 5
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
        Belajar skill digital
      </h1>
      <p className="mt-2 text-slate-600 max-w-2xl">
        Pilih kursus dari platform favoritmu. Filter berdasarkan kategori dan
        urutkan sesuai kebutuhan.
      </p>
    </header>
  );
}