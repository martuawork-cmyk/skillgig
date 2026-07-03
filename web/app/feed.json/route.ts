// GET /feed.json — JSON Feed (jsonfeed.org 1.1) of the latest remote jobs.
// -----------------------------------------------------------------------------
// Machine-friendly companion to /rss.xml for programmatic consumers (n8n HTTP
// nodes, custom scripts, LinkedIn posting automations). Revalidated hourly.

import { getJobs, isSupabaseConfigured } from '@/lib/supabase/queries';
import { SITE_URL, SITE_NAME } from '@/lib/seo';

export const runtime = 'nodejs';
export const revalidate = 3600;

export async function GET(): Promise<Response> {
  const jobs = isSupabaseConfigured() ? (await getJobs()).slice(0, 50) : [];

  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: `${SITE_NAME} — Lowongan Kerja Remote`,
    home_page_url: `${SITE_URL}/jobs`,
    feed_url: `${SITE_URL}/feed.json`,
    description:
      'Lowongan kerja remote global terbaru untuk kandidat Indonesia — diperbarui setiap hari.',
    language: 'id',
    items: jobs.map((j) => {
      const url = `${SITE_URL}/jobs/${j.id}`;
      const name = j.titleId || j.title;
      return {
        id: url,
        url,
        title: j.company ? `${name} — ${j.company}` : name,
        content_text: (j.descriptionId || '').slice(0, 500),
        date_published: new Date(j.postedAt || Date.now()).toISOString(),
        tags: [j.category, ...(j.company ? [j.company] : [])],
      };
    }),
  };

  return Response.json(feed, {
    headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' },
  });
}
