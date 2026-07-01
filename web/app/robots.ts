import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

/**
 * robots.txt for SkillGig.id, served at `/robots.txt`.
 *
 * All crawlers may crawl the public site; admin and API routes stay private.
 * Mirrors the previously hand-curated `public/robots.txt` via the native App
 * Router metadata-route convention.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Block authenticated/internal surfaces from indexing.
      disallow: ['/admin', '/api'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
