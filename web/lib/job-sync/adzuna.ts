import 'server-only';

// =============================================================================
// Adzuna Jobs API auto-sync.
// -----------------------------------------------------------------------------
// Fetches jobs from the Adzuna Jobs API and upserts them into `public.gigs`.
//
// Dedup note (WHY source_id, NOT source_url):
//   Adzuna's `redirect_url` is a tracking link that can carry ephemeral tokens /
//   query params and is NOT guaranteed stable across syncs. `source_id`
//   (`adzuna:<id>`) IS stable — it's the upstream's own primary key. The unique
//   index `gigs_source_id_key` (migration 016) is therefore the correct conflict
//   arbiter. Upserting on `source_url` (as an earlier version did) misses the
//   real dup when Adzuna reissues the same job with a fresh redirect_url, falls
//   through to an INSERT, and collides on `gigs_source_id_key` — a raw error
//   that aborted the whole batch. We now conflict on `source_id`.
//
//   Rows are upserted one at a time inside a try/catch so that a single bad row
//   (e.g. a residual `source_url` collision, or any other per-row violation) is
//   counted as `errors` and skipped WITHOUT aborting the rest of the batch.
// =============================================================================

import { revalidateTag } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import type { GigCategory, GigJobType } from '@/lib/types';

/** Cap on how many jobs we pull per sync. */
const FETCH_LIMIT = 50;
/** Description is stored as the first N chars of the stripped HTML body. */
const DESCRIPTION_MAX = 300;

export type SyncResult = {
  added: number;
  updated: number;
  skipped: number;
  /** Rows that hit a per-row upsert error (e.g. a residual unique collision).
   *  Reported separately so the cron response can flag a degraded run without
   *  failing the whole sync. */
  errors: number;
};

/** Subset object resmi dari Adzuna API */
type AdzunaJob = {
  id: string | number;
  redirect_url: string;
  title: string;
  description: string;
  company?: {
    display_name?: string;
  } | null;
  location?: {
    display_name?: string;
    area?: string[];
  } | null;
  salary_min?: number | null;
  salary_max?: number | null;
  created?: string | null;
  category?: {
    tag?: string;
    label?: string;
  } | null;
  contract_type?: string | null; // e.g. 'full-time', 'part-time'
};

type AdzunaResponse = {
  results: AdzunaJob[];
};

/** Mapping Tag Kategori Adzuna → SkillGig GigCategory */
function mapCategory(rawTag: string | null | undefined): GigCategory {
  if (!rawTag) return 'other';
  const tag = rawTag.toLowerCase().trim();

  if (tag.includes('it-jobs') || tag.includes('developer') || tag.includes('software')) return 'web-dev';
  if (tag.includes('design') || tag.includes('creative')) return 'design';
  if (tag.includes('marketing') || tag.includes('pr-advertising')) return 'marketing';
  if (tag.includes('data') || tag.includes('science') || tag.includes('analyst')) return 'data';
  if (tag.includes('writing') || tag.includes('copywriter')) return 'writing';

  return 'other';
}

/** Mapping Tipe Kontrak Adzuna → SkillGig GigJobType */
function mapJobType(contractType: string | null | undefined): GigJobType {
  if (!contractType) return 'Full-Time';
  const type = contractType.toLowerCase().trim();

  if (type.includes('part-time') || type.includes('part_time')) return 'Part-Time';
  if (type.includes('contract')) return 'Contract';
  if (type.includes('freelance')) return 'Freelance';
  if (type.includes('internship')) return 'Internship';

  return 'Full-Time';
}

/** Bersihkan HTML Tag dan entitas string yang bocor dari deskripsi */
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

/** Potong deskripsi sesuai batas max penyimpanan */
function makeDescription(html: string | null | undefined): string {
  const text = stripHtml(html ?? '');
  if (text.length <= DESCRIPTION_MAX) return text;
  return `${text.slice(0, DESCRIPTION_MAX).trimEnd()}…`;
}

/** Struktur Row yang akan dimasukkan ke Supabase `public.gigs` */
type GigInsertRow = {
  title: string;
  company: string | null;
  company_logo: string | null;
  platform: 'Adzuna';
  category: GigCategory;
  job_type: GigJobType;
  budget_min: number;
  budget_max: number;
  salary_currency: 'USD';
  location: string;
  is_remote: boolean;
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

/** Map AdzunaJob ke schema database */
function toGigRow(job: AdzunaJob): GigInsertRow | null {
  const source_url = job.redirect_url?.trim();
  const title = job.title?.trim();
  
  // Jika tidak ada URL lamaran atau Judul, abaikan (skip)
  if (!source_url || !title) return null;

  // 1. Parsing Lokasi Regional UK
  let location = 'Remote';
  if (job.location) {
    if (job.location.display_name) {
      location = job.location.display_name.trim();
    } else if (job.location.area && job.location.area.length > 0) {
      const cleanAreas = job.location.area.filter(Boolean);
      // Mengambil 2 regional terdalam (misal: ["UK", "England", "London"] -> "England, London")
      location = cleanAreas.slice(-2).reverse().join(', ');
    }
  }

  // 2. Deteksi Pintar Status Remote berdasarkan Text
  const textToSearch = `${title} ${job.description || ''}`.toLowerCase();
  const isRemote = textToSearch.includes('remote') || 
                   textToSearch.includes('work from home') || 
                   textToSearch.includes('home-based');

  return {
    title: stripHtml(title),
    company: job.company?.display_name?.trim() || null,
    company_logo: null, // Free tier Adzuna umumnya tidak menyertakan logo image url langsung
    platform: 'Adzuna',
    category: mapCategory(job.category?.tag),
    job_type: mapJobType(job.contract_type),
    // 3. Salary Handling: Adzuna mengembalikan data number langsung, tidak perlu regex rumit
    budget_min: job.salary_min ? Math.round(job.salary_min) : 0,
    budget_max: job.salary_max ? Math.round(job.salary_max) : 0,
    salary_currency: 'USD',
    location,
    is_remote: isRemote,
    url: source_url,
    source_url,
    // 4. Integrasi Identitas Unik Adzuna
    source_id: `adzuna:${job.id}`,
    level: 'intermediate',
    description: makeDescription(job.description),
    skills: [],
    duration_weeks: null,
    applicants_count: 0,
    status: 'published',
    created_at: job.created || new Date().toISOString(),
  };
}

export async function fetchAdzunaJobs(): Promise<AdzunaJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  const country = process.env.ADZUNA_COUNTRY || 'gb';

  if (!appId || !appKey) {
    throw new Error('Missing Adzuna credentials');
  }

  const url =
    `https://api.adzuna.com/v1/api/jobs/${country}/search/1` +
    `?app_id=${appId}` +
    `&app_key=${appKey}` +
    `&results_per_page=${FETCH_LIMIT}`;

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'SkillGig/1.0',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Adzuna API error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as AdzunaResponse;
  return Array.isArray(json.results) ? json.results : [];
}

export async function syncAdzuna(): Promise<SyncResult> {
  const jobs = await fetchAdzunaJobs();

  const rows: GigInsertRow[] = [];
  let skipped = 0;

  for (const job of jobs) {
    const row = toGigRow(job);
    if (row) rows.push(row);
    else skipped += 1;
  }

  // Dedup the incoming batch on the canonical key. Adzuna occasionally returns
  // the same job id more than once (or two jobs sharing an id with different
  // redirect_urls); keeping the first occurrence avoids a same-command
  // `gigs_source_id_key` collision and keeps the added/updated counts honest.
  const seenSourceIds = new Set<string>();
  const dedupedRows: GigInsertRow[] = [];
  for (const row of rows) {
    if (seenSourceIds.has(row.source_id)) {
      skipped += 1;
      continue;
    }
    seenSourceIds.add(row.source_id);
    dedupedRows.push(row);
  }

  if (dedupedRows.length === 0) {
    return { added: 0, updated: 0, skipped, errors: 0 };
  }

  const sb = createAdminClient();
  const sourceIds = dedupedRows.map((r) => r.source_id);

  // Pre-fetch which source_ids already exist so we can report adds vs updates.
  // Keyed on source_id (the stable canonical id), NOT source_url — Adzuna's
  // redirect_url is not stable across syncs.
  //
  // This is a STATS-ONLY hint: it is deliberately NOT used to decide insert-vs-
  // update. The per-row upsert below is the SOLE write authority and is atomic
  // (ON CONFLICT (source_id) DO UPDATE, arbitrated by `gigs_source_id_key`).
  // That means the check-then-write "race window" people worry about does NOT
  // exist here — even if this snapshot is stale (e.g. a concurrent run inserted
  // the same source_id a moment ago), the upsert still resolves to an UPDATE,
  // never a duplicate-key violation. A failed/stale pre-fetch can only skew the
  // reported counts, so a failure must NOT abort the sync.
  const { data: existing, error: selectErr } = await sb
    .from('gigs')
    .select('source_id')
    .in('source_id', sourceIds);

  if (selectErr) {
    // Don't abort — the upsert is authoritative for correctness; we just lose
    // add/update fidelity for this run. Count everything as "updated" so we
    // never over-report `added` (which drives the Telegram "new gigs" ping) on a
    // degraded read.
    // eslint-disable-next-line no-console
    console.error('[adzuna-sync] stats pre-fetch failed:', selectErr.message);
  }

  const existingSet = new Set(
    ((existing ?? []) as { source_id: string | null }[])
      .map((r) => r.source_id)
      .filter((v): v is string => Boolean(v)),
  );

  let added = 0;
  let updated = 0;
  let errors = 0;

  // Upsert ONE ROW AT A TIME so a single violation (most commonly a residual
  // `source_url` collision now that we arbitrate on source_id) is contained:
  // it's counted as `errors` and the loop carries on to the next row instead of
  // aborting the whole batch like a bulk upsert would. The atomic ON CONFLICT
  // (source_id) clause means a concurrent run inserting the same source_id just
  // turns this into an UPDATE — no duplicate-key error escapes.
  for (const row of dedupedRows) {
    // On a degraded pre-fetch, conservatively count as an update (see above) so
    // we never over-report `added` / trigger a spurious "new gigs" Telegram ping.
    const wasUpdate = Boolean(selectErr) || existingSet.has(row.source_id);
    const { error: upsertErr } = await sb
      .from('gigs')
      .upsert(row, { onConflict: 'source_id' });

    if (upsertErr) {
      // eslint-disable-next-line no-console
      console.error(
        `[adzuna-sync] upsert failed for ${row.source_id}:`,
        upsertErr.message,
      );
      errors += 1;
      continue;
    }

    if (wasUpdate) updated += 1;
    else added += 1;
  }

  // Only bust the cache if we actually changed something.
  if (added > 0 || updated > 0) {
    try {
      revalidateTag('gigs');
    } catch {
      // noop - Cache akan refresh otomatis sesuai schedule jika Next.js cache gagal di-bust
    }
  }

  return { added, updated, skipped, errors };
}