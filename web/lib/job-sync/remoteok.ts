import 'server-only';

// =============================================================================
// RemoteOK remote-jobs auto-sync (https://remoteok.com/api).
// -----------------------------------------------------------------------------
// No API key required. The endpoint returns a JSON ARRAY whose FIRST element is
// a legal/disclaimer object ({ legal: "..." }) — it is skipped. Every remaining
// element is a remote role (USD salaries when present).
//
// RemoteOK Terms (MUST keep):
//   • A descriptive User-Agent is required — the default fetch UA is blocked
//     with 403.
//   • Link back to the RemoteOK listing (`url`) and credit RemoteOK
//     (platform = 'RemoteOK' → the "via RemoteOK" badge). `url` is never
//     rewritten.
//
// Dedup: upsert ON CONFLICT (source_id), source_id = `remoteok:<id>`, backed by
// `gigs_source_id_key` (migration 016). Mirror of lib/job-sync/remotive.ts.
// =============================================================================

import { revalidateTag } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import type { GigCategory, GigJobType } from '@/lib/types';

const REMOTEOK_ENDPOINT = 'https://remoteok.com/api';
const FETCH_TIMEOUT_MS = 20_000;
const FETCH_LIMIT = 50;
const DESCRIPTION_MAX = 300;

export type SyncResult = {
  added: number;
  updated: number;
  skipped: number;
};

/** Subset of a RemoteOK job object — only the fields we read. The first array
 *  element carries `legal` instead and is filtered out. */
type RemoteOkEntry = {
  legal?: string;
  id?: string | number;
  slug?: string;
  url?: string;
  position?: string;
  company?: string;
  company_logo?: string | null;
  logo?: string | null;
  tags?: string[] | null;
  description?: string | null;
  location?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  date?: string | null;
};

/** Map RemoteOK tags → SkillGig GigCategory (first tag that matches wins). */
function mapCategory(tags: string[] | null | undefined): GigCategory {
  const joined = (tags ?? []).join(' ').toLowerCase();
  if (/dev|engineer|software|backend|frontend|fullstack|full.stack|programming|devops/.test(joined)) return 'web-dev';
  if (/design|ux|ui/.test(joined)) return 'design';
  if (/writ|content|copywrit/.test(joined)) return 'writing';
  if (/market|seo|growth|social/.test(joined)) return 'marketing';
  if (/data|analyt|machine.learning|\bml\b|science/.test(joined)) return 'data';
  if (/video|motion/.test(joined)) return 'video';
  return 'other';
}

/** RemoteOK tags → SkillGig GigJobType. Defaults to 'Full-Time'. */
function mapJobType(tags: string[] | null | undefined): GigJobType {
  const joined = (tags ?? []).join(' ').toLowerCase();
  if (joined.includes('part')) return 'Part-Time';
  if (joined.includes('contract')) return 'Contract';
  if (joined.includes('freelance')) return 'Freelance';
  if (joined.includes('intern')) return 'Internship';
  return 'Full-Time';
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function makeDescription(html: string | null | undefined): string {
  const text = stripHtml(html ?? '');
  if (text.length <= DESCRIPTION_MAX) return text;
  return `${text.slice(0, DESCRIPTION_MAX).trimEnd()}…`;
}

type GigInsertRow = {
  title: string;
  company: string | null;
  company_logo: string | null;
  platform: 'RemoteOK';
  category: GigCategory;
  job_type: GigJobType;
  budget_min: number;
  budget_max: number;
  salary_currency: 'USD';
  location: string;
  is_remote: true;
  url: string;
  source_url: string;
  source_id: string;
  level: 'intermediate';
  description: string;
  skills: never[];
  duration_weeks: null;
  applicants_count: 0;
  status: 'published';
  created_at: string;
};

function toGigRow(job: RemoteOkEntry): GigInsertRow | null {
  const url = job.url?.trim();
  const title = job.position?.trim();
  const id = job.id ?? job.slug;
  if (!url || !title || id === undefined || id === null) return null;

  const min = job.salary_min && job.salary_min > 0 ? Math.round(job.salary_min) : 0;
  const max = job.salary_max && job.salary_max > 0 ? Math.round(job.salary_max) : 0;
  const loc = job.location?.trim();

  return {
    title,
    company: job.company?.trim() || null,
    company_logo: job.company_logo?.trim() || job.logo?.trim() || null,
    platform: 'RemoteOK',
    category: mapCategory(job.tags),
    job_type: mapJobType(job.tags),
    budget_min: min,
    budget_max: max || min,
    salary_currency: 'USD',
    location: loc && loc.length > 0 ? loc : 'Remote',
    is_remote: true,
    // ToS: link the real RemoteOK listing — never rewrite it.
    url,
    source_url: url,
    source_id: `remoteok:${id}`,
    level: 'intermediate',
    description: makeDescription(job.description),
    skills: [],
    duration_weeks: null,
    applicants_count: 0,
    status: 'published',
    created_at: job.date || new Date().toISOString(),
  };
}

async function fetchRemoteOkJobs(): Promise<RemoteOkEntry[]> {
  const res = await fetch(REMOTEOK_ENDPOINT, {
    headers: {
      Accept: 'application/json',
      // A descriptive UA is REQUIRED — the default is 403'd by RemoteOK.
      'User-Agent': 'SkillGig/1.0 (+https://skillgig.id)',
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`RemoteOK API responded ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as RemoteOkEntry[];
  if (!Array.isArray(json)) return [];
  // Drop the leading legal/disclaimer element and cap the batch.
  return json.filter((e) => !e.legal && e.id !== undefined).slice(0, FETCH_LIMIT);
}

/** Pull the latest RemoteOK remote jobs and upsert them into `gigs`. */
export async function syncRemoteOK(): Promise<SyncResult> {
  const jobs = await fetchRemoteOkJobs();

  const rows: GigInsertRow[] = [];
  let skipped = 0;
  const seen = new Set<string>();
  for (const job of jobs) {
    const row = toGigRow(job);
    if (!row) {
      skipped += 1;
      continue;
    }
    if (seen.has(row.source_id)) {
      skipped += 1;
      continue;
    }
    seen.add(row.source_id);
    rows.push(row);
  }

  if (rows.length === 0) return { added: 0, updated: 0, skipped };

  const sb = createAdminClient();
  const sourceIds = rows.map((r) => r.source_id);

  const { data: existing, error: selectErr } = await sb
    .from('gigs')
    .select('source_id')
    .in('source_id', sourceIds);
  if (selectErr) {
    // eslint-disable-next-line no-console
    console.error('[remoteok-sync] stats pre-fetch failed:', selectErr.message);
  }
  const existingSet = new Set(
    ((existing ?? []) as { source_id: string | null }[])
      .map((r) => r.source_id)
      .filter((v): v is string => Boolean(v)),
  );

  let added = 0;
  let updated = 0;
  for (const row of rows) {
    const wasUpdate = Boolean(selectErr) || existingSet.has(row.source_id);
    const { error: upsertErr } = await sb
      .from('gigs')
      .upsert(row, { onConflict: 'source_id' });
    if (upsertErr) {
      // eslint-disable-next-line no-console
      console.error(`[remoteok-sync] upsert failed for ${row.source_id}:`, upsertErr.message);
      continue;
    }
    if (wasUpdate) updated += 1;
    else added += 1;
  }

  try {
    revalidateTag('gigs');
  } catch {
    /* noop */
  }

  return { added, updated, skipped };
}
