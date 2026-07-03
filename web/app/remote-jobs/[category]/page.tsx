import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CATEGORIES, type GigCategory } from '@/lib/types';
import { getAllPublishedGigsByCategory } from '@/lib/supabase/queries';
import { JobCard } from '@/components/job/JobCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { buildMetadata, breadcrumbJsonLd, jobItemListJsonLd } from '@/lib/seo';

// =============================================================================
// Programmatic SEO landing pages — /remote-jobs/[category]
// -----------------------------------------------------------------------------
// One static page per gig category, pre-rendered at build (revalidated hourly)
// so each long-tail query ("lowongan web developer remote indonesia") has a
// dedicated, indexable URL. To avoid thin/duplicate content each page carries a
// UNIQUE intro + common-roles line (SEO_INTRO / SEO_ROLES), plus BreadcrumbList
// and ItemList structured data. Empty categories still render (never 404 once
// indexed). Categories come from the fixed enum, so generateStaticParams needs
// no DB.
// =============================================================================

export const revalidate = 3600; // 1h — picks up newly published jobs.

/** Slug → human noun that reads well in "Lowongan <X> Remote Indonesia". */
const SEO_LABEL: Record<GigCategory, string> = {
  'web-dev': 'Web Developer',
  design: 'Desain',
  writing: 'Content & Copywriter',
  marketing: 'Digital Marketing',
  data: 'Data & Analis',
  video: 'Video & Animasi',
  other: 'Tech & Lainnya',
};

/** UNIQUE intro paragraph per category — the anti-thin-content layer. */
const SEO_INTRO: Record<GigCategory, string> = {
  'web-dev':
    'Perusahaan teknologi global rutin merekrut developer Indonesia untuk bekerja remote — frontend, backend, hingga full-stack. Gaji dalam mata uang asing, jam kerja fleksibel, dan bisa dikerjakan dari kota mana pun di Indonesia.',
  design:
    'Peran desain remote — UI/UX, product design, hingga desain grafis — makin terbuka untuk talenta Indonesia. Bangun portofolio, kerja dengan tim internasional, dan dibayar sesuai standar global tanpa harus pindah ke luar negeri.',
  writing:
    'Content writer, copywriter, dan technical writer remote dicari perusahaan berbahasa Inggris di seluruh dunia. Kalau kamu kuat menulis, ini jalur penghasilan global yang bisa dimulai dari rumah.',
  marketing:
    'Digital marketing, SEO, growth, dan social media termasuk peran remote yang paling banyak dibuka. Perusahaan global butuh marketer yang paham audiens lintas negara — dan orang Indonesia punya tempat di sana.',
  data:
    'Data analyst, data scientist, dan data engineer remote makin diminati seiring perusahaan mengambil keputusan berbasis data. Skill SQL, Python, dan analitik membuka lowongan remote bergaji tinggi dari mana saja.',
  video:
    'Video editor, motion graphic, dan animator remote dicari kreator dan brand global. Kalau kamu menguasai editing dan storytelling visual, permintaannya besar dan tidak terikat lokasi.',
  other:
    'Beragam peran tech, operasional, dan dukungan lain juga tersedia remote untuk kandidat Indonesia. Jelajahi lowongan yang terbuka untuk dikerjakan dari mana saja.',
};

const VALID_CATEGORIES = new Set<GigCategory>(CATEGORIES.map((c) => c.value));

function isKnownCategory(slug: string): slug is GigCategory {
  return VALID_CATEGORIES.has(slug as GigCategory);
}

function categorySeoLabel(slug: GigCategory): string {
  return SEO_LABEL[slug] ?? CATEGORIES.find((c) => c.value === slug)?.label ?? slug;
}

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.value }));
}

export async function generateMetadata({
  params,
}: {
  params: { category: string };
}): Promise<Metadata> {
  if (!isKnownCategory(params.category)) {
    return buildMetadata({
      title: 'Lowongan Remote Indonesia',
      description: 'Lowongan kerja remote untuk kandidat Indonesia.',
      path: '/remote-jobs',
    });
  }
  const label = categorySeoLabel(params.category);
  return buildMetadata({
    title: `Lowongan ${label} Remote untuk Indonesia`,
    // Category-specific description (first sentence of the unique intro).
    description: `${SEO_INTRO[params.category].split('. ')[0]}. Lihat lowongan ${label.toLowerCase()} remote terbaru & lamar langsung di SkillGig.`,
    path: `/remote-jobs/${params.category}`,
  });
}

export default async function RemoteJobsCategoryPage({
  params,
}: {
  params: { category: string };
}) {
  if (!isKnownCategory(params.category)) {
    notFound();
  }
  const category = params.category;
  const label = categorySeoLabel(category);
  const gigs = await getAllPublishedGigsByCategory(category);
  const siblings = CATEGORIES.filter((c) => c.value !== category);

  const breadcrumb = breadcrumbJsonLd([
    { name: 'Beranda', path: '/' },
    { name: 'Lowongan', path: '/jobs' },
    { name: `${label} Remote`, path: `/remote-jobs/${category}` },
  ]);
  const itemList = jobItemListJsonLd(
    gigs.slice(0, 20).map((g) => ({ id: g.id, title: g.titleId || g.title })),
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {gigs.length > 0 && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
        />
      )}

      {/* Breadcrumb (visible) */}
      <nav aria-label="Breadcrumb" className="text-xs text-slate-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-indigo-600">Beranda</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/jobs" className="hover:text-indigo-600">Lowongan</Link></li>
          <li aria-hidden>/</li>
          <li className="text-slate-700 font-medium">{label} Remote</li>
        </ol>
      </nav>

      <header>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold mb-4">
          <span aria-hidden>🌍</span> Remote Jobs
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Lowongan {label} Remote untuk Indonesia
        </h1>
        <p className="mt-4 text-slate-600 max-w-3xl leading-relaxed">
          {SEO_INTRO[category]}
        </p>
        <div className="mt-4">
          <Link href="/jobs" className="text-sm font-semibold text-indigo-600 hover:underline">
            Lihat semua lowongan remote →
          </Link>
        </div>
      </header>

      {gigs.length === 0 ? (
        <EmptyState
          icon="📭"
          title={`Belum ada lowongan ${label.toLowerCase()} remote saat ini.`}
          description="Lowongan baru masuk otomatis tiap hari. Cek kategori lain atau papan lowongan utama."
          action={
            <Link href="/jobs" className="text-sm text-indigo-600 font-semibold hover:underline">
              Lihat semua lowongan →
            </Link>
          }
        />
      ) : (
        <>
          <p className="text-sm text-slate-700">
            <span className="font-bold text-slate-900">{gigs.length}</span>{' '}
            lowongan {label.toLowerCase()} remote ditemukan
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {gigs.map((g) => (
              <JobCard key={g.id} gig={g} />
            ))}
          </div>
        </>
      )}

      {/* Sibling category links */}
      <section className="border-t border-slate-200 pt-6">
        <h2 className="text-sm font-bold text-slate-900 mb-3">Jelajahi kategori lain</h2>
        <div className="flex flex-wrap gap-2">
          {siblings.map((c) => (
            <Link
              key={c.value}
              href={`/remote-jobs/${c.value}`}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-700 transition"
            >
              {categorySeoLabel(c.value)}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
