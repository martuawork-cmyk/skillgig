/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Post-build sitemap writer for SkillGig.id.
 *
 * next-sitemap's automatic discovery reads the Next.js build manifest and
 * only includes static routes. Every page in the app uses `force-dynamic`,
 * so the auto-generated sitemap is empty. We work around that by:
 *
 *   1. Letting next-sitemap generate a sitemap for what it does find.
 *   2. Reading the env vars directly from .env.local (next-sitemap's CLI
 *      doesn't auto-load Next.js env files).
 *   3. Hitting the Supabase REST API for published gig IDs and merging
 *      them into sitemap.xml.
 *   4. Always seeding the four known public routes (/, /learn, /gigs,
 *      /roadmap) so the sitemap is non-empty even when Supabase isn't
 *      reachable (e.g. CI build without secrets).
 *
 * Run automatically via the `postbuild` script after `next build`.
 */

const fs = require('fs');
const path = require('path');

// --- Load .env.local so SUPABASE_URL/KEY are available to the script ---
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  }
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://skillgig.id';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const PUBLIC_ROUTES = [
  { loc: '/',        priority: 1.0 },
  { loc: '/learn',   priority: 0.9 },
  { loc: '/gigs',    priority: 0.9 },
  { loc: '/roadmap', priority: 0.9 },
  { loc: '/about',   priority: 0.7 },
];

function toUrlXml(entry) {
  const url = entry.loc.startsWith('http') ? entry.loc : `${SITE_URL}${entry.loc}`;
  const lastmod = entry.lastmod || new Date().toISOString();
  return (
    `  <url>\n` +
    `    <loc>${url}</loc>\n` +
    `    <lastmod>${lastmod}</lastmod>\n` +
    `    <changefreq>${entry.changefreq || 'weekly'}</changefreq>\n` +
    `    <priority>${entry.priority.toFixed(1)}</priority>\n` +
    `  </url>`
  );
}

async function fetchPublishedGigPaths() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/gigs?status=eq.published&select=id,created_at&order=created_at.desc&limit=5000`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      },
    );
    if (!res.ok) {
      console.warn(`[build-sitemap] Supabase responded ${res.status}; skipping gig URLs.`);
      return [];
    }
    const rows = await res.json();
    return (rows || []).map((r) => ({
      loc: `/gigs/${r.id}`,
      changefreq: 'weekly',
      priority: 0.8,
      lastmod: r.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('[build-sitemap] failed to fetch gig paths:', err);
    return [];
  }
}

async function main() {
  const outDir = path.join(__dirname, '..', 'public');
  const sitemapPath = path.join(outDir, 'sitemap.xml');

  const gigPaths = await fetchPublishedGigPaths();
  const all = [...PUBLIC_ROUTES, ...gigPaths];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    all.map(toUrlXml).join('\n') +
    `\n</urlset>\n`;

  fs.writeFileSync(sitemapPath, xml, 'utf8');
  console.log(
    `✅ [build-sitemap] wrote ${all.length} URL(s) (${gigPaths.length} gigs) to ${path.relative(process.cwd(), sitemapPath)}`,
  );
}

main().catch((err) => {
  console.error('[build-sitemap] fatal:', err);
  process.exit(1);
});