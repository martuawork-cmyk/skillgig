import Link from 'next/link';
import type { Metadata } from 'next';
import { FaqAccordion, type FaqItem } from '@/components/layout/FaqAccordion';
import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildMetadata({
  title: 'FAQ — Pertanyaan yang Sering Diajukan | SkillGig.id',
  description:
    'Jawaban atas pertanyaan umum seputar SkillGig.id: apakah gratis, beda gig vs lowongan, cara melamar, kursus, fitur Roadmap, keamanan data, dan SkillGig Pro.',
  path: '/faq',
});

const FAQS: FaqItem[] = [
  {
    question: 'Apakah SkillGig gratis digunakan?',
    answer:
      'Ya. Kamu bisa mendaftar, menjelajahi ribuan kursus, menemukan gig, dan melamar pekerjaan tanpa biaya. Tidak ada paywall untuk membuka detail lowongan atau melihat budget proyek — semuanya transparan sejak awal.',
  },
  {
    question: 'Apa bedanya "Gig" dan "Lowongan Kerja" di SkillGig?',
    answer:
      '“Gig” adalah pekerjaan freelance berbasis proyek dengan budget dan durasi tertentu, misalnya mendesain logo selama dua minggu. “Lowongan Kerja” adalah posisi yang lebih tetap — Full-Time, Contract, Part-Time, atau Internship — biasanya dari perusahaan yang merekrut karyawan remote. Gig ada di /gigs, lowongan kerja ada di /jobs.',
  },
  {
    question: 'Bagaimana cara melamar pekerjaan di SkillGig?',
    answer:
      'Buka halaman /jobs atau /gigs, pilih lowongan yang sesuai dengan skill kamu, lalu klik tombol lamar. Untuk lowongan dari platform agregator (mis. Remotive, Wellfound), kamu akan diarahkan ke platform sumber untuk menyelesaikan aplikasi. Untuk gig lokal, kamu bisa mengirim proposal langsung lewat SkillGig.',
  },
  {
    question: 'Apakah kursus di SkillGig gratis?',
    answer:
      'SkillGig mengagregasi kursus dari berbagai platform — Udemy, Coursera, Dicoding, edX, dan LinkedIn Learning. Sebagian kursus benar-benar gratis (mis. dari Dicoding atau YouTube), sementara sebagian lain berbayar di platform sumbernya. Harga tiap kursus selalu ditampilkan jelas di kartu kursus, ditandai “Gratis” jika tidak ada biaya.',
  },
  {
    question: 'Bagaimana cara menyimpan gig atau kursus favorit?',
    answer:
      'Klik ikon bookmark pada kartu gig atau kursus untuk menyimpannya ke daftar favorit. Item yang disimpan tersimpan otomatis dan bisa kamu akses kembali kapan saja untuk dibandingkan atau dilamar nanti.',
  },
  {
    question: 'Apa itu fitur Roadmap di SkillGig?',
    answer:
      'Roadmap adalah panduan belajar terstruktur untuk sebuah karier skill, misalnya “Menjadi Web Developer”. Roadmap merekomendasikan kursus yang relevan, gig yang cocok dengan level kamu, dan estimasi potensi penghasilan di tiap jenjang — dari Pemula sampai Expert — agar kamu selalu tahu langkah berikutnya.',
  },
  {
    question: 'Apakah SkillGig tersedia dalam bentuk aplikasi mobile?',
    answer:
      'Saat ini SkillGig adalah aplikasi web yang responsif dan nyaman dipakai dari browser di ponsel maupun desktop. Aplikasi mobile native belum tersedia, tetapi kamu bisa menambahkan SkillGig ke layar utama (Add to Home Screen) agar terasa seperti aplikasi.',
  },
  {
    question: 'Bagaimana cara menghubungi tim SkillGig?',
    answer:
      'Kamu bisa menghubungi kami melalui email di hello@skillgig.id untuk pertanyaan, masukan, atau peluang kerja sama. Kami juga senang mendengar masukan dari kamu melalui formulir feedback yang tersedia di situs.',
  },
  {
    question: 'Apakah data saya aman di SkillGig?',
    answer:
      'Ya. SkillGig dibangun di atas Supabase dengan autentikasi yang aman dan kebijakan Row Level Security di setiap tabel, sehingga data hanya dapat diakses oleh pemiliknya. Data disimpan dengan enkripsi dan tidak dibagikan ke pihak ketiga — kami hanya menyimpan data yang diperlukan untuk menjalankan layanan.',
  },
  {
    question: 'Apa itu SkillGig Pro?',
    answer:
      'SkillGig Pro adalah rencana premium masa depan yang direncanakan membuka fitur tambahan, seperti prioritas lamaran, analitik portofolio, kursus eksklusif, dan dukungan prioritas. Saat ini semua fitur inti dapat dinikmati gratis, dan kami akan mengumumkan Pro begitu sudah siap.',
  },
];

export default function FaqPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      {/* Header */}
      <header className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold mb-4">
          <span className="w-2 h-2 rounded-full bg-indigo-500" /> Bantuan
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Pertanyaan yang sering diajukan
        </h1>
        <p className="mt-4 text-slate-600 leading-relaxed">
          Semua yang perlu kamu tahu tentang SkillGig.id — dari cara memulai
          hingga keamanan data kamu. Tidak menemukan jawabannya?{' '}
          <a
            href="mailto:hello@skillgig.id"
            className="font-semibold text-indigo-600 hover:underline"
          >
            Hubungi kami
          </a>
          .
        </p>
      </header>

      {/* Accordion */}
      <FaqAccordion items={FAQS} />

      {/* CTA */}
      <section className="mt-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-10 text-center text-white">
        <h2 className="text-xl font-extrabold tracking-tight">
          Siap memulai perjalanan kamu?
        </h2>
        <p className="mt-2 text-indigo-100 max-w-md mx-auto text-sm">
          Jelajahi kursus atau cari lowongan remote pertama kamu sekarang.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/learn"
            className="px-5 py-3 text-sm font-semibold bg-white text-indigo-700 rounded-lg shadow-soft hover:bg-slate-50 active:scale-[.98] transition"
          >
            📚 Jelajahi Kursus
          </Link>
          <Link
            href="/jobs"
            className="px-5 py-3 text-sm font-semibold bg-white/10 backdrop-blur border border-white/30 text-white rounded-lg hover:bg-white/20 transition"
          >
            💼 Cari Lowongan
          </Link>
        </div>
      </section>
    </div>
  );
}
