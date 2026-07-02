import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CATEGORIES, type GigCategory } from '@/lib/types';
import { getAllPublishedGigsByCategory } from '@/lib/supabase/queries';
import { GigCard } from '@/components/gig/GigCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { buildMetadata } from '@/lib/seo';

// =============================================================================
// Programmatic SEO landing pages — /remote-jobs/[category]
// -----------------------------------------------------------------------------
// One static page per gig category, pre-rendered at build (and revalidated
// hourly) so each long-tail query ("lowongan web developer remote indonesia")
// has a dedicated, indexable URL in the sitemap. Content is the published gigs
// in that category; when the category is empty the page still renders (with an
// empty state + cross-links) so the URL never 404s once indexed.
//
// Categories come from the fixed GigCategory enum (lib/types.ts), so
// generateStaticParams is independent of the DB — a CI build without Supabase
// secrets still emits every category page. Unknown / garbage slugs hit
// notFound() rather than rendering a thin page.
// =============================================================================

export const revalidate = 3600; // 1h — picks up newly published gigs.

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

const VALID_CATEGORIES = new Set<GigCategory>(
  CATEGORIES.map((c) => c.value),
);

function isKnownCategory(slug: string): slug is GigCategory {
  return VALID_CATEGORIES.has(slug as GigCategory);
}

/** Resolve the human label for a category slug (falls back to the enum label). */
function categorySeoLabel(slug: GigCategory): string {
  return SEO_LABEL[slug] ?? CATEGORIES.find((c) => c.value === slug)?.label ?? slug;
}

/** Pre-render one page per known category. */
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
    title: `Lowongan ${label} Remote Indonesia`,
    description: `Lowongan ${label.toLowerCase()} remote terbaru untuk kandidat Indonesia. Lamar posisi ${label.toLowerCase()} full-time, contract, dan freelance dari perusahaan global dan lokal.`,
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

  // Cross-links to sibling category pages — keeps the section interlinked for
  // crawlers and gives users a way to browse related verticals. Excludes the
  // current category.
  const siblings = CATEGORIES.filter((c) => c.value !== category);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <header>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold mb-4">
          <span aria-hidden>🌍</span> Remote Jobs
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Lowongan {label} Remote Indonesia
        </h1>
        <p className="mt-3 text-slate-600 max-w-2xl">
          Temukan lowongan {label.toLowerCase()} remote terbaru untuk kandidat
          Indonesia. Semua posisi di bawah ini terbuka untuk dikerjakan secara
          remote — pilih, lamar, dan mulai bekerja dari mana saja.
        </p>
      </header>

      {gigs.length === 0 ? (
        <EmptyState
          icon="📭"
          title={`Belum ada lowongan ${label.toLowerCase()} remote.`}
          description="Cek kategori lain atau kembali ke papan lowongan utama."
          action={
            <Link
              href="/jobs"
              className="text-sm text-indigo-600 font-semibold hover:underline"
            >
              Lihat semua lowongan →
            </Link>
          }
        />
      ) : (
        <>
          <p className="text-sm text-slate-700">
            <span className="font-bold text-slate-900">{gigs.length}</span>{' '}
            lowongan {label.toLowerCase()} ditemukan
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {gigs.map((g) => (
              <GigCard key={g.id} gig={g} />
            ))}
          </div>
        </>
      )}

      {/* Sibling category links */}
      <section className="border-t border-slate-200 pt-6">
        <h2 className="text-sm font-bold text-slate-900 mb-3">
          Jelajahi kategori lain
        </h2>
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
