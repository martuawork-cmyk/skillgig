import 'server-only';

// =============================================================================
// Task B5 — Remotive remote-jobs auto-sync.
// -----------------------------------------------------------------------------
// Fetches https://remotive.com/api/remote-jobs (no API key) and upserts the
// listings into `public.gigs`. Designed to run from a protected cron route
// (app/api/cron/sync-jobs/route.ts) at most a few times per day.
//
// Remotive Terms of Service compliance (MUST keep):
//   • `url` / `source_url` are the REAL Remotive listing URLs — never rewritten
//     or redirected. The "Lamar" button opens gig.url verbatim.
//   • Every imported gig is stamped `platform = 'Remotive'` so the GigCard can
//     show the "via Remotive" attribution badge.
//   • Listings are never republished to Google Jobs / LinkedIn / etc.
//
// Dedup: upsert ON CONFLICT (source_url) DO UPDATE, backed by the unique index
// `gigs_source_url_key` (migration 015). `added` / `updated` counts are derived
// by pre-fetching the existing source_urls for the incoming batch — cheaper and
// more accurate than parsing the upsert response.
// =============================================================================

import { revalidateTag } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import type { GigCategory, GigJobType } from '@/lib/types';

const REMOTIVE_ENDPOINT = 'https://remotive.com/api/remote-jobs';
/** Cap on how many jobs we pull per sync. The task spec asks for 50. */
const FETCH_LIMIT = 50;
/** Hard timeout for the Remotive fetch so a stalled upstream can't hang cron. */
const FETCH_TIMEOUT_MS = 20_000;
/** Description is stored as the first N chars of the stripped HTML body. */
const DESCRIPTION_MAX = 300;

export type SyncResult = {
  added: number;
  updated: number;
  skipped: number;
};

/** Subset of the Remotive job object — only the fields we read. */
type RemotiveJob = {
  id: number;
  url: string;
  title: string;
  company_name?: string | null;
  company_logo?: string | null;
  category?: string | null;
  job_type?: string | null;
  publication_date?: string | null;
  candidate_required_location?: string | null;
  salary?: string | null;
  description?: string | null;
};

type RemotiveResponse = {
  jobs: RemotiveJob[];
};

/** Remotive category string → SkillGig GigCategory. Unmapped → 'other'. */
const CATEGORY_MAP: Record<string, GigCategory> = {
  'Software Development': 'web-dev',
  Design: 'design',
  Marketing: 'marketing',
  'Data Science': 'data',
  Copywriting: 'writing',
};

/** Remotive job_type string → SkillGig GigJobType. Unmapped → 'Full-Time'. */
const JOB_TYPE_MAP: Record<string, GigJobType> = {
  full_time: 'Full-Time',
  contract: 'Contract',
  part_time: 'Part-Time',
  freelance: 'Freelance',
  internship: 'Internship',
};

function mapCategory(raw: string | null | undefined): GigCategory {
  const key = raw?.trim();
  if (key && CATEGORY_MAP[key]) return CATEGORY_MAP[key];
  return 'other';
}

function mapJobType(raw: string | null | undefined): GigJobType {
  const key = raw?.trim();
  if (key && JOB_TYPE_MAP[key]) return JOB_TYPE_MAP[key];
  return 'Full-Time';
}

/**
 * Parse a Remotive salary string into integer USD bounds. Handles annual
 * figures ("$60,000 - $90,000") and short-form ("60k-90k"). Returns null when
 * the field is blank or contains no usable numbers — the caller then falls
 * back to 0/0 (the budget columns are NOT NULL).
 */
function parseSalary(raw: string | null | undefined): { min: number; max: number } | null {
  if (!raw || typeof raw !== 'string') return null;
  const cleaned = raw
    .replace(/\$/g, '')
    // "60k" → "60000" (only when k/K directly follows a digit and isn't itself
    // part of a longer word, so "work" / "task" are untouched).
    .replace(/(\d)\s*[kK]\b/g, '$1000')
    .replace(/,/g, '');
  const matches = cleaned.match(/\d+(?:\.\d+)?/g);
  if (!matches) return null;
  const values = matches
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0);
  if (values.length === 0) return null;
  return {
    min: Math.round(Math.min(...values)),
    max: Math.round(Math.max(...values)),
  };
}

/** Strip HTML tags + collapse whitespace, decode the common entities. */
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

/** Build the stored description: stripped body, truncated to DESCRIPTION_MAX. */
function makeDescription(html: string | null | undefined): string {
  const text = stripHtml(html ?? '');
  if (text.length <= DESCRIPTION_MAX) return text;
  return `${text.slice(0, DESCRIPTION_MAX).trimEnd()}…`;
}

/** Row shape written to `gigs`. Column names match the SQL schema. */
type GigInsertRow = {
  title: string;
  company: string | null;
  company_logo: string | null;
  platform: 'Remotive';
  category: GigCategory;
  job_type: GigJobType;
  budget_min: number;
  budget_max: number;
  salary_currency: 'USD';
  location: string;
  is_remote: true;
  url: string;
  source_url: string;
  level: 'intermediate';
  description: string;
  skills: never[];
  duration_weeks: null;
  applicants_count: 0;
  status: 'published';
  created_at: string;
};

/**
 * Map a single Remotive job to a `gigs` insert row. Returns null when the job
 * is missing the fields we can't live without (a real listing URL + a title),
 * so the caller can count it as `skipped`.
 */
function toGigRow(job: RemotiveJob): GigInsertRow | null {
  const url = job.url?.trim();
  const title = job.title?.trim();
  // Without a URL we can neither link (ToS) nor dedup — drop it.
  if (!url || !title) return null;

  const salary = parseSalary(job.salary);
  const location = job.candidate_required_location?.trim() || 'Remote';

  return {
    title,
    company: job.company_name?.trim() || null,
    // Remotive sends a logo URL (or empty). Never coerce to an emoji.
    company_logo: job.company_logo?.trim() || null,
    platform: 'Remotive',
    category: mapCategory(job.category),
    job_type: mapJobType(job.job_type),
    budget_min: salary?.min ?? 0,
    budget_max: salary?.max ?? 0,
    salary_currency: 'USD',
    location,
    is_remote: true,
    // ToS: link the REAL Remotive URL — never redirect or rewrite it.
    url,
    source_url: url,
    // Remotive exposes no seniority; "intermediate" is a neutral default.
    level: 'intermediate',
    description: makeDescription(job.description),
    skills: [],
    // Full-Time / contract roles have no fixed project window — leave null.
    duration_weeks: null,
    applicants_count: 0,
    status: 'published',
    created_at: job.publication_date || new Date().toISOString(),
  };
}

async function fetchRemotiveJobs(): Promise<RemotiveJob[]> {
  const res = await fetch(`${REMOTIVE_ENDPOINT}?limit=${FETCH_LIMIT}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'SkillGig/1.0 (+https://skillgig.id)',
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    // Never cache — cron must always see the live feed.
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Remotive API responded ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as RemotiveResponse;
  return Array.isArray(json?.jobs) ? json.jobs : [];
}

/**
 * Pull the latest Remotive remote jobs and upsert them into `gigs`.
 *
 * @returns {added, updated, skipped} — `skipped` counts jobs dropped during
 *          mapping (missing url/title). Uses the service-role client to bypass
 *          RLS, since this runs server-side from an authenticated cron route.
 */
export async function syncRemotive(): Promise<SyncResult> {
  const jobs = await fetchRemotiveJobs();

  const rows: GigInsertRow[] = [];
  let skipped = 0;
  for (const job of jobs) {
    const row = toGigRow(job);
    if (row) rows.push(row);
    else skipped += 1;
  }

  if (rows.length === 0) {
    return { added: 0, updated: 0, skipped };
  }

  const sb = createAdminClient();
  const sourceUrls = rows.map((r) => r.source_url);

  // Pre-fetch which source_urls already exist so we can report adds vs updates.
  const { data: existing, error: selectErr } = await sb
    .from('gigs')
    .select('source_url')
    .in('source_url', sourceUrls);
  if (selectErr) throw selectErr;
  const existingSet = new Set(
    ((existing ?? []) as { source_url: string | null }[])
      .map((r) => r.source_url)
      .filter((v): v is string => Boolean(v)),
  );

  let added = 0;
  let updated = 0;
  for (const row of rows) {
    if (existingSet.has(row.source_url)) updated += 1;
    else added += 1;
  }

  // Single upsert — the unique index on source_url is the conflict arbiter
  // (ON CONFLICT (source_url) DO UPDATE). Existing rows get refreshed, new rows
  // get inserted. Idempotent across re-runs within the same day.
  const { error: upsertErr } = await sb
    .from('gigs')
    .upsert(rows, { onConflict: 'source_url' });
  if (upsertErr) throw upsertErr;

  // Bust the public listings cache so synced jobs surface on /gigs without
  // waiting for the next tag revalidation. Best-effort: a failure here must
  // not undo a successful sync.
  try {
    revalidateTag('gigs');
  } catch {
    /* noop — cache will refresh on its own schedule */
  }

  return { added, updated, skipped };
}
