import Link from 'next/link';
import type { Metadata } from 'next';
import { getAboutStats, isSupabaseConfigured } from '@/lib/supabase/queries';
import { formatCompact } from '@/lib/utils';
import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildMetadata({
  title: 'Tentang SkillGig.id',
  description:
    'SkillGig.id adalah platform terbaik untuk freelancer dan pencari kerja remote Indonesia — satu tempat untuk belajar skill, membangun portofolio, menemukan gig, dan melamar pekerjaan.',
  path: '/about',
});

const CORE_JOURNEY = [
  { icon: '📚', label: 'Learn',   desc: 'Pelajari skill digital dari kursus terstruktur' },
  { icon: '🛠️', label: 'Build',   desc: 'Bangun portofolio dengan project nyata' },
  { icon: '🔍', label: 'Discover', desc: 'Temukan gig yang sesuai skill kamu' },
  { icon: '✉️', label: 'Apply',   desc: 'Kirim proposal & dapatkan pekerjaan' },
  { icon: '💰', label: 'Earn',    desc: 'Terima pembayaran & tarik ke rekening' },
];

const COURSE_PLATFORMS = [
  { name: 'Udemy',              emoji: '🟣', desc: 'Marketplace kursus terbesar di dunia' },
  { name: 'Coursera',           emoji: '🎓', desc: 'Kursus dari universitas & perusahaan top' },
  { name: 'Dicoding',           emoji: '🇮🇩', desc: 'Academy & bootcamp teknologi Indonesia' },
  { name: 'edX',                emoji: '⚡', desc: 'Kursus dari Harvard, MIT & lainnya' },
  { name: 'LinkedIn Learning',  emoji: '💼', desc: 'Skill profesional bersertifikat' },
];

const JOB_PLATFORMS = [
  { name: 'Upwork',          emoji: '🌐', desc: 'Marketplace freelancer global' },
  { name: 'Sribulancer',     emoji: '🇮🇩', desc: 'Platform freelancer Indonesia' },
  { name: 'Projects.co.id',  emoji: '📋', desc: 'Proyek & lelang klien lokal' },
  { name: 'Remotive',        emoji: '🌍', desc: 'Lowongan kerja remote dunia' },
  { name: 'Wellfound',       emoji: '🚀', desc: 'Lowongan startup & tech' },
];

export default async function AboutPage() {
  const ready = isSupabaseConfigured();
  const stats = ready
    ? await getAboutStats()
    : { totalCourses: 0, totalGigs: 0, totalUsers: 0 };

  const STATS = [
    { value: `${formatCompact(stats.totalCourses)}+`, label: 'Kursus' },
    { value: `${formatCompact(stats.totalGigs)}+`,    label: 'Lowongan' },
    { value: `${formatCompact(stats.totalUsers)}+`,   label: 'Freelancer Terdaftar' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
      {/* Hero */}
      <header className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold mb-4">
          <span className="w-2 h-2 rounded-full bg-indigo-500" /> Tentang kami
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Platform terbaik untuk{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
            freelancer dan pencari kerja remote
          </span>{' '}
          Indonesia
        </h1>
        <p className="mt-5 text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Misi SkillGig.id sederhana: menyingkirkan kebingungan saat memulai
          karier digital. Kami menyatukan{' '}
          <strong className="text-slate-900">belajar skill</strong>,{' '}
          <strong className="text-slate-900">membangun portofolio</strong>,{' '}
          <strong className="text-slate-900">menemukan gig</strong>, dan{' '}
          <strong className="text-slate-900">melamar pekerjaan remote</strong>{' '}
          dalam satu perjalanan yang utuh — agar kamu fokus berkembang, bukan
          berpindah-pindah platform.
        </p>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="px-6 py-8 bg-white border border-slate-200 rounded-2xl shadow-soft text-center"
          >
            <p className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              {s.value}
            </p>
            <p className="text-sm text-slate-500 mt-2">{s.label}</p>
          </div>
        ))}
      </section>

      {/* Story — Kenapa SkillGig? */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Kenapa SkillGig?
          </h2>
          <p className="text-slate-600 mt-2 max-w-2xl mx-auto">
            Kami memulai dari satu pertanyaan sederhana dari banyak orang
            Indonesia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="px-6 py-7 bg-rose-50/60 border border-rose-100 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🤔</span>
              <h3 className="font-bold text-slate-900">Masalahnya</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Banyak orang ingin mulai kerja remote atau freelance, tapi tidak
              tahu harus mulai dari mana. Kursus tersebar di mana-mana, gig
              tersembunyi di belakang paywall, dan lowongan kerja ada di situs
              lain lagi — akhirnya niat kendur sebelum sempat dimulai.
            </p>
          </div>

          <div className="px-6 py-7 bg-emerald-50/60 border border-emerald-100 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">✅</span>
              <h3 className="font-bold text-slate-900">Solusinya</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Satu platform untuk <strong className="text-slate-900">belajar
              skill</strong>, <strong className="text-slate-900">menemukan
              gig</strong>, dan <strong className="text-slate-900">melamar
              pekerjaan</strong>. Kami agregasi kursus dan lowongan terbaik,
              lalu susun jadi perjalanan yang jelas — dari nol sampai cuan
              pertama, tanpa berpindah-pindah tempat.
            </p>
          </div>
        </div>

        {/* Core journey */}
        <div>
          <p className="text-center text-sm font-semibold text-slate-500 uppercase tracking-wide mb-5">
            Perjalanan inti kami
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {CORE_JOURNEY.map((s, i) => (
              <div
                key={s.label}
                className="relative px-4 py-5 bg-white border border-slate-200 rounded-2xl shadow-soft text-center"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-xs font-bold grid place-items-center shadow-soft">
                  {i + 1}
                </div>
                <div className="text-3xl mb-2">{s.icon}</div>
                <h3 className="font-bold text-slate-900">{s.label}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Aggregated platforms */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Platform yang kami agregasi
          </h2>
          <p className="text-slate-600 mt-2 max-w-2xl mx-auto">
            Kami mengumpulkan kursus dan lowongan terbaik dari sumber tepercaya
            agar kamu tidak perlu memeriksa satu per satu.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
            📚 Sumber Kursus
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {COURSE_PLATFORMS.map((p) => (
              <div
                key={p.name}
                className="px-4 py-5 bg-white border border-slate-200 rounded-2xl shadow-soft text-center hover:border-indigo-300 hover:shadow-md transition"
              >
                <div className="text-3xl mb-2">{p.emoji}</div>
                <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
            💼 Sumber Lowongan
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {JOB_PLATFORMS.map((p) => (
              <div
                key={p.name}
                className="px-4 py-5 bg-white border border-slate-200 rounded-2xl shadow-soft text-center hover:border-indigo-300 hover:shadow-md transition"
              >
                <div className="text-3xl mb-2">{p.emoji}</div>
                <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-12 text-center text-white">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Mulai perjalanan freelance kamu hari ini
        </h2>
        <p className="mt-3 text-indigo-100 max-w-lg mx-auto">
          Gratis mulai. Pilih langkah pertama kamu — belajar skill baru atau
          langsung cari lowongan yang cocok.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
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

      {/* Contact */}
      <section className="text-center">
        <p className="text-sm text-slate-500">
          Ada pertanyaan atau ingin bekerja sama?{' '}
          <a
            href="mailto:hello@skillgig.id"
            className="font-semibold text-indigo-600 hover:underline"
          >
            hubungi tim SkillGig →
          </a>
        </p>
      </section>
    </div>
  );
}
