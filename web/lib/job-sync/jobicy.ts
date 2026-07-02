import 'server-only';

// =============================================================================
// Jobicy remote-jobs auto-sync (https://jobicy.com/api/v2/remote-jobs).
// -----------------------------------------------------------------------------
// No API key required. Jobicy is a REMOTE-NATIVE board — every listing is a
// remote role open to a stated geo (often "Anywhere" / a region), which is
// exactly the relevance LokerRemote has and the old Adzuna `gb` feed lacked.
//
// Jobicy Terms (MUST keep — from the API's `friendlyNotice`):
//   • Credit Jobicy as the source (platform = 'Jobicy' → the "via Jobicy" badge).
//   • Redirect users to the Jobicy listing to apply — `url` is that page, never
//     rewritten.
//   • Data changes infrequently: fetch only a few times per day (we run once).
//
// Dedup: upsert ON CONFLICT (source_id), source_id = `jobicy:<id>` (the stable
// upstream primary key), backed by `gigs_source_id_key` (migration 016). Mirror
// of lib/job-sync/remotive.ts — see that file for the full rationale.
// =============================================================================

import { revalidateTag } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import type { GigCategory, GigJobType, SkillLevel } from '@/lib/types';

const JOBICY_ENDPOINT = 'https://jobicy.com/api/v2/remote-jobs';
const FETCH_LIMIT = 50;
const FETCH_TIMEOUT_MS = 20_000;
const DESCRIPTION_MAX = 300;

export type SyncResult = {
  added: number;
  updated: number;
  skipped: number;
};

/** Subset of the Jobicy v2 job object — only the fields we read. */
type JobicyJob = {
  id: number | string;
  url: string;
  jobTitle: string;
  companyName?: string | null;
  companyLogo?: string | null;
  jobIndustry?: string[] | string | null;
  jobType?: string[] | string | null;
  jobGeo?: string | null;
  jobLevel?: string | null;
  jobExcerpt?: string | null;
  jobDescription?: string | null;
  pubDate?: string | null;
  // Present only on some listings; parsed defensively.
  annualSalaryMin?: number | string | null;
  annualSalaryMax?: number | string | null;
  salaryCurrency?: string | null;
};

type JobicyResponse = { jobs?: JobicyJob[] };

/** First element of an array-or-scalar field, trimmed. */
function first(v: string[] | string | null | undefined): string {
  if (Array.isArray(v)) return (v[0] ?? '').trim();
  return (v ?? '').trim();
}

/** Jobicy industry → SkillGig GigCategory. Unmapped → 'other'. */
function mapCategory(raw: string): GigCategory {
  const s = raw.toLowerCase();
  if (s.includes('develop') || s.includes('software') || s.includes('engineer') || s.includes('devops') || s.includes('programming')) return 'web-dev';
  if (s.includes('design') || s.includes('ux') || s.includes('ui')) return 'design';
  if (s.includes('writ') || s.includes('copywrit') || s.includes('content')) return 'writing';
  if (s.includes('market') || s.includes('seo') || s.includes('growth')) return 'marketing';
  if (s.includes('data') || s.includes('analyt') || s.includes('science')) return 'data';
  if (s.includes('video') || s.includes('motion')) return 'video';
  return 'other';
}

/** Jobicy jobType → SkillGig GigJobType. Unmapped → 'Full-Time'. */
function mapJobType(raw: string): GigJobType {
  const s = raw.toLowerCase();
  if (s.includes('part')) return 'Part-Time';
  if (s.includes('contract')) return 'Contract';
  if (s.includes('freelance')) return 'Freelance';
  if (s.includes('intern')) return 'Internship';
  return 'Full-Time';
}

/** Jobicy jobLevel → SkillGig SkillLevel. Unmapped → 'intermediate'. */
function mapLevel(raw: string | null | undefined): SkillLevel {
  const s = (raw ?? '').toLowerCase();
  if (s.includes('junior') || s.includes('entry')) return 'beginner';
  if (s.includes('senior') || s.includes('lead') || s.includes('manage') || s.includes('principal')) return 'advanced';
  return 'intermediate';
}

/** Coerce a possibly-string number field to a non-negative integer. */
function toInt(v: number | string | null | undefined): number {
  const n = typeof v === 'string' ? Number(v.replace(/[^\d.]/g, '')) : v;
  return Number.isFinite(n as number) && (n as number) > 0 ? Math.round(n as number) : 0;
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
  platform: 'Jobicy';
  category: GigCategory;
  job_type: GigJobType;
  budget_min: number;
  budget_max: number;
  salary_currency: string;
  location: string;
  is_remote: true;
  url: string;
  source_url: string;
  source_id: string;
  level: SkillLevel;
  description: string;
  skills: never[];
  duration_weeks: null;
  applicants_count: 0;
  status: 'published';
  created_at: string;
};

function toGigRow(job: JobicyJob): GigInsertRow | null {
  const url = job.url?.trim();
  const title = job.jobTitle?.trim();
  if (!url || !title) return null;

  const min = toInt(job.annualSalaryMin);
  const max = toInt(job.annualSalaryMax);
  const currency = (job.salaryCurrency?.trim() || 'USD').toUpperCase();
  const geo = job.jobGeo?.trim();

  return {
    title,
    company: job.companyName?.trim() || null,
    company_logo: job.companyLogo?.trim() || null,
    platform: 'Jobicy',
    category: mapCategory(first(job.jobIndustry)),
    job_type: mapJobType(first(job.jobType)),
    budget_min: min,
    budget_max: max || min,
    // Salary figures are annual; currency defaults to USD when unspecified.
    salary_currency: currency,
    location: geo && geo.length > 0 ? geo : 'Remote',
    is_remote: true,
    // ToS: link the real Jobicy listing — never rewrite it.
    url,
    source_url: url,
    source_id: `jobicy:${job.id}`,
    level: mapLevel(job.jobLevel),
    description: makeDescription(job.jobDescription || job.jobExcerpt),
    skills: [],
    duration_weeks: null,
    applicants_count: 0,
    status: 'published',
    created_at: job.pubDate || new Date().toISOString(),
  };
}

async function fetchJobicyJobs(): Promise<JobicyJob[]> {
  const res = await fetch(`${JOBICY_ENDPOINT}?count=${FETCH_LIMIT}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'SkillGig/1.0 (+https://skillgig.id)',
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Jobicy API responded ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as JobicyResponse;
  return Array.isArray(json?.jobs) ? json.jobs : [];
}

/** Pull the latest Jobicy remote jobs and upsert them into `gigs`. */
export async function syncJobicy(): Promise<SyncResult> {
  const jobs = await fetchJobicyJobs();

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
    console.error('[jobicy-sync] stats pre-fetch failed:', selectErr.message);
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
      console.error(`[jobicy-sync] upsert failed for ${row.source_id}:`, upsertErr.message);
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
