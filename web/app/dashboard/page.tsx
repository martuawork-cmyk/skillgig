import Link from 'next/link';
import type { Metadata } from 'next';
import { JourneyNav } from '@/components/layout/JourneyNav';
import { ButtonLink } from '@/components/ui/Button';
import { getCurrentUser } from '@/lib/supabase/session';
import { getHomepageStats, isSupabaseConfigured } from '@/lib/supabase/queries';
import { formatCompact, formatIDR } from '@/lib/utils';
import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildMetadata({
  title: 'Dashboard — Perjalanan Freelance Kamu | SkillGig.id',
  description:
    'Pusat perjalanan kamu di SkillGig: lacak progres Learn → Build → Discover → Apply → Earn dan lanjutkan dari langkah terakhir.',
  path: '/dashboard',
});

const JOURNEY = [
  { step: 1, icon: '📚', label: 'Learn',    desc: 'Pelajari skill digital dari kursus terstruktur.', href: '/learn' },
  { step: 2, icon: '🛠️', label: 'Build',    desc: 'Bangun portofolio & tambah skill ke profil.',      href: '/skills' },
  { step: 3, icon: '🔍', label: 'Discover', desc: 'Temukan gig & lowongan yang sesuai skill.',        href: '/gigs' },
  { step: 4, icon: '✉️', label: 'Apply',    desc: 'Kirim proposal & lacak lamaran kamu.',             href: '/applications' },
  { step: 5, icon: '💰', label: 'Earn',     desc: 'Terima pembayaran & tarik ke rekening.',           href: '/earn' },
] as const;

export default async function DashboardPage() {
  const ready = isSupabaseConfigured();
  const [user, stats] = await Promise.all([
    getCurrentUser(),
    ready ? getHomepageStats() : { totalGigs: 0, totalUsers: 0, avgBudgetMax: null },
  ]);

  const greeting = user ? `Halo, ${user.name.split(' ')[0]}!` : 'Selamat datang!';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
          <span aria-hidden>🧭</span> PUSAT PERJALANAN
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {greeting}
        </h1>
        <p className="text-slate-600 max-w-2xl">
          Ini peta perjalanan kamu dari belajar sampai menghasilkan. Lanjutkan
          dari langkah terakhir, atau mulai dari awal.
        </p>
      </header>

      {/* Journey progress stepper — relocated here from the global header so the
          main nav stays clean and progress lives where it belongs: your dashboard. */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-soft overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Progres perjalanan kamu</h2>
          <p className="text-xs text-slate-600 mt-0.5">
            5 langkah: Learn → Build → Discover → Apply → Earn.
          </p>
        </div>
        <JourneyNav />
      </div>

      {/* Journey step cards */}
      <section aria-labelledby="journey-cards">
        <h2 id="journey-cards" className="sr-only">
          Langkah perjalanan
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {JOURNEY.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group relative px-5 py-6 bg-white border border-slate-200 rounded-2xl shadow-soft hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition"
            >
              <div className="absolute -top-3 -left-3 w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-xs font-bold grid place-items-center shadow-soft">
                {s.step}
              </div>
              <div className="text-3xl mb-3" aria-hidden>{s.icon}</div>
              <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition">
                {s.label}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{s.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick stats — real Supabase counts */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile
          icon="💼"
          value={formatCompact(stats.totalGigs)}
          label="Gig aktif sekarang"
          accent="from-indigo-500 to-violet-500"
        />
        <StatTile
          icon="👥"
          value={formatCompact(stats.totalUsers)}
          label="Freelancer terdaftar"
          accent="from-emerald-500 to-teal-500"
        />
        <StatTile
          icon="💸"
          value={stats.avgBudgetMax != null ? formatIDR(Math.round(stats.avgBudgetMax)) : '—'}
          label="Rata-rata budget project"
          accent="from-amber-500 to-orange-500"
        />
      </section>

      {/* CTA */}
      {!user && (
        <section className="rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-8 text-center text-white shadow-lg shadow-indigo-600/20">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Buat akun gratis untuk menyimpan progres
          </h2>
          <p className="mt-2 text-indigo-100 max-w-xl mx-auto text-sm">
            Supaya skill, kursus, dan lamaran kamu tersimpan dan bisa dilacak di
            dashboard ini.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/signup?next=%2Fdashboard" className="bg-white text-indigo-700 hover:bg-slate-50">
              Daftar gratis
            </ButtonLink>
            <ButtonLink href="/login?next=%2Fdashboard" className="bg-white/10 backdrop-blur border border-white/30 text-white hover:bg-white/20">
              Sudah punya akun? Masuk
            </ButtonLink>
          </div>
        </section>
      )}
    </div>
  );
}

function StatTile({
  icon,
  value,
  label,
  accent,
}: {
  icon: string;
  value: string;
  label: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-soft">
      <span
        aria-hidden
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${accent} text-lg shadow-sm`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold text-slate-900 leading-tight truncate">{value}</p>
        <p className="text-xs text-slate-600 font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}
