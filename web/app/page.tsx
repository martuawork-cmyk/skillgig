import Link from 'next/link';
import type { Metadata } from 'next';
import { Briefcase, Users, Wallet, Star } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/Button';
import { GigCard } from '@/components/gig/GigCard';
import { JobCard } from '@/components/job/JobCard';
import { CourseCard } from '@/components/course/CourseCard';
import { NewsletterSection } from '@/components/newsletter/NewsletterSection';
import { getFeaturedCourses, getGigs, getJobs, getHomepageStats, getSkillsForNewsletter, isSupabaseConfigured } from '@/lib/supabase/queries';
import { formatCompact, formatIDR } from '@/lib/utils';
import { buildMetadata } from '@/lib/seo';

const JOURNEY = [
  { icon: '📚', label: 'Learn',  desc: 'Pelajari skill digital dari kursus terstruktur', href: '/learn' },
  { icon: '🛠️', label: 'Build',  desc: 'Bangun portofolio dengan project nyata',        href: '/skills' },
  { icon: '🔍', label: 'Discover', desc: 'Temukan gig yang sesuai skill kamu',          href: '/gigs' },
  { icon: '✉️', label: 'Apply',  desc: 'Kirim proposal & dapatkan pekerjaan',           href: '/applications' },
  { icon: '💰', label: 'Earn',   desc: 'Terima pembayaran & tarik ke rekening',         href: '/earn' },
];

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildMetadata({
  title: 'SkillGig.id — Belajar Skill Digital & Cari Freelance Indonesia',
  description:
    'Platform Indonesia yang menghubungkan perjalanan belajar skill digital, membangun portofolio, menemukan gig, melamar, dan menghasilkan — semuanya untuk freelancer Indonesia.',
  path: '/',
});

export default async function Home() {
  // Featured items — fetched at request time so changes in Supabase appear
  // immediately without a rebuild. If Supabase isn't configured yet, render
  // the static landing without featured sections.
  const ready = isSupabaseConfigured();
  const featuredGigs    = ready ? (await getGigs()).slice(0, 3)    : [];
  const featuredCourses = ready ? await getFeaturedCourses(6) : [];
  // Latest jobs for the "Lowongan Kerja Terbaru" strip — Full-Time & Contract
  // only (the homepage teases employment roles; Part-Time/Internship live on
  // /jobs). getJobs() is cached + newest-first, so this is a cheap filter.
  const featuredJobs = ready
    ? (await getJobs())
        .filter((g) => g.jobType === 'Full-Time' || g.jobType === 'Contract')
        .slice(0, 4)
    : [];
  const stats = ready ? await getHomepageStats() : { totalGigs: 0, totalUsers: 0, avgBudgetMax: null };
  // Newsletter dropdown options. Falls back to an empty list when Supabase
  // isn't reachable — the client component then renders its own error state
  // and asks the visitor to retry later.
  const skills = ready ? await getSkillsForNewsletter() : [];

  const STATS = [
    { value: formatCompact(stats.totalGigs),  label: 'Active gigs',     Icon: Briefcase, accent: 'from-indigo-500 to-violet-500' },
    { value: formatCompact(stats.totalUsers), label: 'Freelancers',     Icon: Users,     accent: 'from-emerald-500 to-teal-500' },
    { value: stats.avgBudgetMax != null ? formatIDR(Math.round(stats.avgBudgetMax)) : '—', label: 'Avg. project', Icon: Wallet, accent: 'from-amber-500 to-orange-500' },
    { value: '4.8★', label: 'Client rating',  Icon: Star,              accent: 'from-rose-500 to-pink-500' },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-white to-violet-50" />
        <div className="absolute inset-0 -z-10 opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]">
          <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-300 rounded-full blur-3xl opacity-20" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-fuchsia-300 rounded-full blur-3xl opacity-20" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              © 2026 SkillGig.id · All rights reserved.
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.05]">
              Belajar skill digital,<br />
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                raup cuan dari karya kamu.
              </span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-2xl">
              SkillGig menghubungkan perjalanan <strong className="text-slate-900">belajar</strong> →{' '}
              <strong className="text-slate-900">membangun skill</strong> →{' '}
              <strong className="text-slate-900">menemukan gig</strong> →{' '}
              <strong className="text-slate-900">melamar</strong> →{' '}
              <strong className="text-slate-900">menghasilkan</strong>.
              Semua dalam satu platform untuk freelancer Indonesia.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink
                href="/learn"
                size="xl"
                className="shadow-lg shadow-indigo-600/25 hover:shadow-xl hover:shadow-indigo-600/30"
              >
                <span aria-hidden>🚀</span> Mulai Belajar
              </ButtonLink>
              <ButtonLink
                href="/gigs"
                variant="secondary"
                size="xl"
                className="shadow-md"
              >
                Cari Gig →
              </ButtonLink>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-3 px-4 py-3.5 bg-white/80 backdrop-blur border border-slate-200 rounded-2xl shadow-md shadow-slate-900/5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/10"
              >
                <span
                  aria-hidden
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${s.accent} shadow-sm`}
                >
                  <s.Icon className="h-5 w-5 text-white" />
                </span>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight truncate">
                    {s.value}
                  </p>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey steps */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Journey kamu di SkillGig
          </h2>
          <p className="text-slate-600 mt-2">
            Lima langkah dari nol sampai cuan pertama.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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

      {/* Featured Gigs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              🔍 Gigs pilihan minggu ini
            </h2>
            <p className="text-sm text-slate-600 mt-1">Peluang terbaru dari klien Indonesia</p>
          </div>
          <Link href="/gigs" className="text-sm font-semibold text-indigo-600 hover:underline">
            Lihat semua →
          </Link>
        </div>
        {featuredGigs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredGigs.map((g) => (
              <GigCard key={g.id} gig={g} />
            ))}
          </div>
        )}
      </section>

      {/* Latest Jobs */}
      {featuredJobs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                💼 Lowongan Kerja Terbaru
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Lowongan Full-Time &amp; Contract dari perusahaan global
              </p>
            </div>
            <Link href="/jobs" className="text-sm font-semibold text-indigo-600 hover:underline">
              Lihat semua lowongan →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredJobs.map((g) => (
              <JobCard key={g.id} gig={g} />
            ))}
          </div>
        </section>
      )}

      {/* Featured Courses */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              📚 Kursus populer
            </h2>
            <p className="text-sm text-slate-600 mt-1">Mulai belajar skill yang paling dicari</p>
          </div>
          <Link href="/learn" className="text-sm font-semibold text-indigo-600 hover:underline">
            Lihat semua →
          </Link>
        </div>
        {featuredCourses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredCourses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        )}
      </section>

      {/* Newsletter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <NewsletterSection skills={skills} />
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 border-0 text-white">
          <CardBody className="py-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Siap mulai journey kamu?
            </h2>
            <p className="mt-3 text-indigo-100 max-w-xl mx-auto">
              Daftar gratis dan akses ribuan kursus, gigs, dan peluang freelance di Indonesia.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button className="px-5 py-3 text-sm font-semibold bg-white text-indigo-700 rounded-lg shadow-soft hover:bg-slate-50 active:scale-[.98] transition">
                Daftar gratis
              </button>
              <Link
                href="/earn"
                className="px-5 py-3 text-sm font-semibold bg-white/10 backdrop-blur border border-white/30 text-white rounded-lg hover:bg-white/20 transition"
              >
                Lihat potensi earnings
              </Link>
            </div>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}