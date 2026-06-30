import Link from 'next/link';
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildMetadata({
  title: 'Tentang SkillGig.id',
  description:
    'SkillGig.id adalah platform Indonesia yang menghubungkan belajar skill digital, membangun portofolio, menemukan gig, melamar, dan menghasilkan — dalam satu perjalanan untuk freelancer Indonesia.',
  path: '/about',
});

const VALUES = [
  {
    icon: '🇮🇩',
    title: 'Untuk freelancer Indonesia',
    desc: 'Konteks lokal: gig dalam Rupiah, kursus yang relevan, dan komunitas yang ngerti tantangan kamu.',
  },
  {
    icon: '🛤️',
    title: 'Satu perjalanan utuh',
    desc: 'Dari belajar sampai dibayar — tidak loncat-loncat antar platform. Tiap langkah saling menyambung.',
  },
  {
    icon: '🔓',
    title: 'Transparan & gratis mulai',
    desc: 'Daftar gratis, lihat gig tanpa paywall, dan tahu budget proyek sejak awal. Tidak ada biaya tersembunyi.',
  },
];

const JOURNEY = [
  { icon: '📚', label: 'Learn',   desc: 'Pelajari skill digital dari kursus terstruktur',     href: '/learn' },
  { icon: '🛠️', label: 'Build',   desc: 'Bangun portofolio dengan project nyata',            href: '/skills' },
  { icon: '🔍', label: 'Discover', desc: 'Temukan gig yang sesuai skill kamu',              href: '/gigs' },
  { icon: '✉️', label: 'Apply',   desc: 'Kirim proposal & dapatkan pekerjaan',              href: '/applications' },
  { icon: '💰', label: 'Earn',    desc: 'Terima pembayaran & tarik ke rekening',            href: '/earn' },
];

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      {/* Heading */}
      <header className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold mb-4">
          <span className="w-2 h-2 rounded-full bg-indigo-500" /> Tentang kami
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Dari belajar sampai{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
            menghasilkan
          </span>{' '}
          — dalam satu platform.
        </h1>
        <p className="mt-5 text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
          SkillGig.id dibangun untuk freelancer Indonesia. Kami
          menghubungkan perjalanan <strong className="text-slate-900">belajar</strong>,{' '}
          <strong className="text-slate-900">membangun skill</strong>,{' '}
          <strong className="text-slate-900">menemukan gig</strong>,{' '}
          <strong className="text-slate-900">melamar</strong>, dan{' '}
          <strong className="text-slate-900">menghasilkan</strong> — agar kamu tidak
          perlu lagi berpindah-pindah platform untuk memulai karier digital.
        </p>
      </header>

      {/* Values */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {VALUES.map((v) => (
          <div
            key={v.title}
            className="px-5 py-6 bg-white border border-slate-200 rounded-2xl shadow-soft"
          >
            <div className="text-3xl mb-3">{v.icon}</div>
            <h2 className="font-bold text-slate-900">{v.title}</h2>
            <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{v.desc}</p>
          </div>
        ))}
      </section>

      {/* Journey */}
      <section>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight text-center">
          Perjalanan kamu di SkillGig
        </h2>
        <p className="text-slate-600 mt-2 text-center">
          Lima langkah dari nol sampai cuan pertama.
        </p>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {JOURNEY.map((s, i) => (
            <Link
              key={s.label}
              href={s.href}
              className="group relative px-5 py-6 bg-white border border-slate-200 rounded-2xl shadow-soft hover:border-indigo-300 hover:shadow-md transition"
            >
              <div className="absolute -top-3 -left-3 w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-xs font-bold grid place-items-center shadow-soft">
                {i + 1}
              </div>
              <div className="text-3xl mb-3">{s.icon}</div>
              <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition">
                {s.label}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{s.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-10 text-center text-white">
        <h2 className="text-2xl font-extrabold tracking-tight">Ada pertanyaan?</h2>
        <p className="mt-2 text-indigo-100 max-w-lg mx-auto">
          Kami senang dengar dari kamu — masukan, kerja sama, atau sekadar menyapa.
        </p>
        <a
          href="mailto:hello@skillgig.id"
          className="inline-block mt-6 px-5 py-3 text-sm font-semibold bg-white text-indigo-700 rounded-lg shadow-soft hover:bg-slate-50 active:scale-[.98] transition"
        >
          ✉️ hello@skillgig.id
        </a>
      </section>
    </div>
  );
}
