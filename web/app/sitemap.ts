import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

/**
 * Dynamic sitemap for SkillGig.id, served at `/sitemap.xml`.
 *
 * The core public routes are always emitted. Published gig detail pages are
 * pulled from the Supabase REST API at request time; if Supabase is
 * unreachable (e.g. a CI build without secrets) the gig list is empty and only
 * the static routes are emitted — so the build never fails on missing data.
 *
 * This replaces the previous `scripts/build-sitemap.js` post-build step with
 * the native Next.js App Router metadata-route convention. `loc` values are
 * emitted as ABSOLUTE URLs (per the sitemaps.org protocol — Google rejects
 * relative URLs), built from the single canonical origin in lib/seo.ts.
 */

// Normalize a site path into an absolute URL.
const abs = (path: string) => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: abs('/'), changeFrequency: 'daily', priority: 1.0, lastModified: new Date() },
  { url: abs('/learn'), changeFrequency: 'weekly', priority: 0.9, lastModified: new Date() },
  { url: abs('/gigs'), changeFrequency: 'weekly', priority: 0.9, lastModified: new Date() },
  { url: abs('/jobs'), changeFrequency: 'weekly', priority: 0.9, lastModified: new Date() },
  { url: abs('/roadmap'), changeFrequency: 'weekly', priority: 0.8, lastModified: new Date() },
  { url: abs('/skills'), changeFrequency: 'weekly', priority: 0.8, lastModified: new Date() },
  { url: abs('/earn'), changeFrequency: 'monthly', priority: 0.7, lastModified: new Date() },
  { url: abs('/about'), changeFrequency: 'monthly', priority: 0.7, lastModified: new Date() },
  { url: abs('/faq'), changeFrequency: 'monthly', priority: 0.6, lastModified: new Date() },
];

interface GigRow {
  id: string;
  created_at?: string | null;
}

/** Published gig detail pages. Safe-fallback to [] on any failure. */
async function fetchPublishedGigs(): Promise<MetadataRoute.Sitemap> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return [];

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/gigs?status=eq.published&select=id,created_at&order=created_at.desc&limit=5000`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } },
    );
    if (!res.ok) return [];
    const rows: GigRow[] = await res.json();
    return rows.map((row) => ({
      url: abs(`/gigs/${row.id}`),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      lastModified: row.created_at ? new Date(row.created_at) : new Date(),
    }));
  } catch {
    return [];
  }
}

// Regenerate periodically so newly published gigs appear without a full
// redeploy.
export const revalidate = 3600; // 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const gigs = await fetchPublishedGigs();
  return [...STATIC_ROUTES, ...gigs];
}
