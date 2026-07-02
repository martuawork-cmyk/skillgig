import Link from 'next/link';
import type { Metadata } from 'next';
import { Briefcase, Globe, RefreshCw, BadgeCheck, Sparkles } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/Button';
import { JobCard } from '@/components/job/JobCard';
import { NewsletterSection } from '@/components/newsletter/NewsletterSection';
import {
  getJobs,
  getHomepageStats,
  getSkillsForNewsletter,
  isSupabaseConfigured,
} from '@/lib/supabase/queries';
import { formatCompact } from '@/lib/utils';
import { buildMetadata } from '@/lib/seo';

// Why-SkillGig value props — reframed for the wedge (job seekers), replacing the
// old Learn→Build→Earn journey. Every card reinforces "relevant remote jobs for
// Indonesians", which is where we beat LokerRemote (relevance, not volume).
const WHY = [
  {
    Icon: Globe,
    title: 'Perusahaan global',
    desc: 'Lowongan remote dari perusahaan di seluruh dunia — dikumpulkan dari Remotive, Jobicy, RemoteOK, dan lainnya.',
    accent: 'from-indigo-500 to-violet-500',
  },
  {
    Icon: BadgeCheck,
    title: 'Dikurasi untuk Indonesia',
    desc: 'Fokus ke lowongan yang terbuka untuk kandidat Indonesia — tak buang waktu melamar yang menolak WNI.',
    accent: 'from-emerald-500 to-teal-500',
  },
  {
    Icon: RefreshCw,
    title: 'Diperbarui otomatis',
    desc: 'Lowongan baru masuk setiap hari secara otomatis. Yang kamu lihat selalu segar.',
    accent: 'from-sky-500 to-blue-500',
  },
  {
    Icon: Sparkles,
    title: 'Alert & CV tools (segera)',
    desc: 'Alert keyword lowongan + review CV bertenaga AI yang dioptimalkan untuk tiap lowongan. Segera hadir.',
    accent: 'from-amber-500 to-orange-500',
  },
];

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildMetadata({
  title: 'SkillGig.id — Lowongan Kerja Remote Global untuk Indonesia',
  description:
    'Ratusan lowongan kerja remote dari perusahaan global, dikurasi khusus yang terbuka untuk pelamar Indonesia. Cari, filter, dan lamar — gratis. Diperbarui setiap hari.',
  path: '/',
});

export default async function Home() {
  // Featured items fetched at request time so Supabase changes appear without a
  // rebuild. Without Supabase configured, render the static landing.
  const ready = isSupabaseConfigured();
  // Latest remote jobs — the centerpiece of the page (the wedge). Newest-first
  // and cached in getJobs(); take the freshest 8.
  const featuredJobs = ready ? (await getJobs()).slice(0, 8) : [];
  const stats = ready
    ? await getHomepageStats()
    : { totalGigs: 0, totalUsers: 0, avgBudgetMax: null };
  // Newsletter dropdown options (skill preference) — this is the alert opt-in.
  const skills = ready ? await getSkillsForNewsletter() : [];

  // Honest, job-board-framed stats. Only `Lowongan remote` is dynamic; the rest
  // are truthful value props, not invented numbers.
  const STATS = [
    { value: formatCompact(stats.totalGigs), label: 'Lowongan remote', Icon: Briefcase, accent: 'from-indigo-500 to-violet-500' },
    { value: 'Harian',  label: 'Update otomatis',   Icon: RefreshCw,  accent: 'from-emerald-500 to-teal-500' },
    { value: '100%',    label: 'Remote global',     Icon: Globe,      accent: 'from-sky-500 to-blue-500' },
    { value: 'Gratis',  label: 'Mulai cari kerja',  Icon: BadgeCheck, accent: 'from-amber-500 to-orange-500' },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Living-aurora background (pure CSS, GPU transforms only) */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-white to-violet-50" />
        <div className="absolute inset-0 -z-10 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]">
          <div className="animate-sg-float absolute top-0 left-8 w-80 h-80 bg-indigo-300 rounded-full blur-3xl opacity-25" />
          <div className="animate-sg-float-2 absolute bottom-0 right-4 w-[26rem] h-[26rem] bg-fuchsia-300 rounded-full blur-3xl opacity-20" />
          <div className="animate-sg-float absolute top-24 right-1/3 w-72 h-72 bg-sky-300 rounded-full blur-3xl opacity-20" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              🌏 Remote job global · terbuka untuk pelamar Indonesia
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.05]">
              Kerja remote global,<br />
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                dari Indonesia.
              </span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-2xl">
              Ratusan lowongan remote dari perusahaan global — dikurasi khusus
              yang <strong className="text-slate-900">terbuka untuk kandidat Indonesia</strong>.
              Cari, filter, dan lamar. Diperbarui setiap hari, gratis.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink
                href="/jobs"
                size="xl"
                className="shadow-lg shadow-indigo-600/25 hover:shadow-xl hover:shadow-indigo-600/30"
              >
                <span aria-hidden>💼</span> Lihat Lowongan
              </ButtonLink>
              <ButtonLink
                href="/roadmap"
                variant="secondary"
                size="xl"
                className="shadow-md"
              >
                Roadmap Skill →
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

      {/* Why SkillGig */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Kenapa cari kerja remote lewat SkillGig
          </h2>
          <p className="text-slate-600 mt-2">
            Bukan yang terbanyak — tapi yang paling relevan untuk kamu.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {WHY.map((w) => (
            <div
              key={w.title}
              className="px-5 py-6 bg-white border border-slate-200 rounded-2xl shadow-soft hover:border-indigo-300 hover:shadow-md transition"
            >
              <span
                aria-hidden
                className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${w.accent} shadow-sm mb-4`}
              >
                <w.Icon className="h-5 w-5 text-white" />
              </span>
              <h3 className="font-bold text-slate-900">{w.title}</h3>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{w.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Latest remote jobs — centerpiece */}
      {featuredJobs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                💼 Lowongan remote terbaru
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Baru masuk dari perusahaan global — remote, terbuka untuk Indonesia
              </p>
            </div>
            <Link href="/jobs" className="text-sm font-semibold text-indigo-600 hover:underline shrink-0">
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

      {/* Newsletter / alert opt-in */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <NewsletterSection skills={skills} />
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 border-0 text-white">
          <CardBody className="py-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Siap kerja remote?
            </h2>
            <p className="mt-3 text-indigo-100 max-w-xl mx-auto">
              Jelajahi ratusan lowongan remote global yang terbuka untuk pelamar
              Indonesia. Gratis, tanpa ribet.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <ButtonLink
                href="/jobs"
                variant="secondary"
                size="lg"
                className="bg-white text-indigo-700 hover:bg-slate-50 border-0"
              >
                Lihat semua lowongan
              </ButtonLink>
              <Link
                href="/signup"
                className="px-5 py-3 text-sm font-semibold bg-white/10 backdrop-blur border border-white/30 text-white rounded-lg hover:bg-white/20 transition"
              >
                Daftar gratis
              </Link>
            </div>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
