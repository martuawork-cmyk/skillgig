// GET /rss.xml — RSS 2.0 feed of the latest remote jobs.
// -----------------------------------------------------------------------------
// The automation backbone: any scheduler (Make, Zapier, n8n, Buffer, IFTTT) can
// subscribe to this feed and auto-post new listings to LinkedIn / X / Telegram
// as they appear — no custom API needed. Also a standard discovery surface for
// feed readers. Revalidated hourly.

import { getJobs, isSupabaseConfigured } from '@/lib/supabase/queries';
import { SITE_URL, SITE_NAME } from '@/lib/seo';

export const runtime = 'nodejs';
export const revalidate = 3600;

/** Escape the five XML metacharacters so titles/descriptions stay well-formed. */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(): Promise<Response> {
  const jobs = isSupabaseConfigured() ? (await getJobs()).slice(0, 50) : [];

  const items = jobs
    .map((j) => {
      const link = `${SITE_URL}/jobs/${j.id}`;
      const name = j.titleId || j.title;
      const title = j.company ? `${name} — ${j.company}` : name;
      const desc = (j.descriptionId || '').slice(0, 500);
      const pubDate = new Date(j.postedAt || Date.now()).toUTCString();
      return [
        '    <item>',
        `      <title>${esc(title)}</title>`,
        `      <link>${esc(link)}</link>`,
        `      <guid isPermaLink="true">${esc(link)}</guid>`,
        `      <pubDate>${pubDate}</pubDate>`,
        `      <category>${esc(j.category)}</category>`,
        `      <description>${esc(desc)}</description>`,
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(SITE_NAME)} — Lowongan Kerja Remote</title>
    <link>${SITE_URL}/jobs</link>
    <description>Lowongan kerja remote global terbaru untuk kandidat Indonesia — diperbarui setiap hari.</description>
    <language>id</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
