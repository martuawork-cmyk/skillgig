import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tag } from '@/components/ui/Tag';
import { LamarButton } from '@/components/gig/LamarButton';
import { SaveJobButton } from '@/components/job/SaveJobButton';
import { JobCard } from '@/components/job/JobCard';
import { CompanyLogo } from '@/components/job/CompanyLogo';
import { ErrorState } from '@/components/feedback/ErrorState';
import { getGig, getJobs, isSupabaseConfigured } from '@/lib/supabase/queries';
import { formatBudget, timeAgo, jobTypeColor } from '@/lib/utils';
import {
  jobLevelLabel,
  jobCategoryLabel,
  isSalaryHidden,
  jobLocation,
} from '@/lib/job-utils';
import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

/**
 * Dynamic metadata for individual job pages. Fetches the gig so the title
 * reflects the actual role + company. Falls back to a generic title if the
 * gig isn't found or Supabase isn't configured (Next still renders
 * `notFound()` for the missing case — this is just a safety net).
 */
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const fallback = buildMetadata({
    title: 'Detail Lowongan Kerja Remote | SkillGig.id',
    description:
      'Lihat detail lowongan kerja remote: gaji, skill yang dibutuhkan, dan perusahaan. Lamar langsung dari SkillGig.id.',
    path: `/jobs/${params.id}`,
  });

  if (!isSupabaseConfigured()) return fallback;

  try {
    const gig = await getGig(params.id);
    if (!gig) return fallback;

    const company = gig.company ? `${gig.company} — ` : '';
    const description =
      gig.descriptionId && gig.descriptionId.length > 0
        ? gig.descriptionId.slice(0, 160)
        : `Lowongan kerja remote: ${gig.titleId}`;

    return buildMetadata({
      title: `${company}${gig.titleId} | SkillGig.id`,
      description,
      path: `/jobs/${params.id}`,
    });
  } catch {
    return fallback;
  }
}

export default async function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <ErrorState
          title="Belum terkoneksi ke Supabase"
          message="Halaman detail lowongan butuh data dari database."
          hint="Isi .env.local dan jalankan migration SQL."
        />
      </div>
    );
  }

  const gig = await getGig(params.id);
  if (!gig) notFound();

  // "Lowongan Serupa" — same category, exclude the current role, board types
  // only, newest first. getJobs() is cached + already ordered + filtered to
  // employment roles, so this is one cheap in-memory pass.
  const allJobs = await getJobs();
  const related = allJobs
    .filter((j) => j.id !== gig.id && j.category === gig.category)
    .slice(0, 3);

  const salaryMin = gig.salaryMin ?? gig.budgetMin;
  const salaryMax = gig.salaryMax ?? gig.budgetMax;
  const salaryHidden = isSalaryHidden(salaryMin, salaryMax);
  const salaryLabel = salaryHidden
    ? 'Negotiable'
    : formatBudget(salaryMin, salaryMax, gig.salaryCurrency ?? 'IDR');
  const location = jobLocation(gig.location, gig.isRemote);
  const companyName = gig.company || gig.platform;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-indigo-600 mb-4"
      >
        ← Kembali ke Lowongan Kerja
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (70%) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardBody className="space-y-5">
              {/* Company header */}
              <div className="flex items-center gap-4">
                <CompanyLogo logo={gig.company_logo} name={gig.company} size="lg" />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-700 truncate">{companyName}</p>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <span aria-hidden>📍</span>
                    {location}
                  </p>
                </div>
              </div>

              {/* Title + info row */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {gig.titleId}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {gig.jobType && (
                    <Badge className={jobTypeColor(gig.jobType)}>{gig.jobType}</Badge>
                  )}
                  <Badge className="bg-slate-100 text-slate-700">
                    {jobCategoryLabel(gig.category)}
                  </Badge>
                  <Badge className="bg-violet-100 text-violet-700">
                    {jobLevelLabel(gig.level)}
                  </Badge>
                  <span className="text-xs text-slate-500 ml-auto">
                    Diposting {timeAgo(gig.postedAt)}
                  </span>
                </div>
              </div>

              {/* Salary */}
              <div className="bg-slate-50 rounded-xl border border-slate-100 px-4 py-3">
                <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">
                  Gaji
                </p>
                <p className="text-lg font-bold text-slate-900">{salaryLabel}</p>
              </div>
            </CardBody>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <h2 className="font-bold text-slate-900">Deskripsi Lowongan</h2>
            </CardHeader>
            <CardBody>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                {gig.descriptionId || gig.description || 'Deskripsi belum tersedia.'}
              </p>
            </CardBody>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <h2 className="font-bold text-slate-900">Skill yang dibutuhkan</h2>
            </CardHeader>
            <CardBody>
              <div className="flex flex-wrap gap-2">
                {gig.skillsRequired.length > 0 ? (
                  gig.skillsRequired.map((s) => (
                    <Tag key={s} className="bg-indigo-50 text-indigo-700">
                      {s}
                    </Tag>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">Skill belum ditentukan.</p>
                )}
              </div>
            </CardBody>
          </Card>

          {/* About company */}
          <Card>
            <CardHeader>
              <h2 className="font-bold text-slate-900">Tentang Perusahaan</h2>
            </CardHeader>
            <CardBody className="flex items-center gap-4">
              <CompanyLogo logo={gig.company_logo} name={gig.company} size="lg" />
              <div>
                <p className="font-bold text-slate-900">{gig.company || 'Perusahaan'}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sumber lowongan: {gig.platform}
                </p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right sticky sidebar (30%) */}
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-32 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">
                  Gaji
                </p>
                <p className="text-xl font-extrabold text-slate-900">{salaryLabel}</p>
              </div>

              <LamarButton url={gig.url} label="Lamar Sekarang" />
              <SaveJobButton gig={gig} />

              <p className="text-xs text-slate-500 text-center">
                Diposting {timeAgo(gig.postedAt)} di {gig.platform}
              </p>
            </div>

            {related.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 px-1">Lowongan Serupa</h3>
                <div className="space-y-4">
                  {related.map((j) => (
                    <JobCard key={j.id} gig={j} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
