import 'server-only';

// =============================================================================
// Adzuna Jobs API auto-sync.
// -----------------------------------------------------------------------------
// Fetches jobs from the Adzuna Jobs API and upserts them into `public.gigs`.
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

  if (rows.length === 0) {
    return { added: 0, updated: 0, skipped };
  }

  const sb = createAdminClient();
  const sourceUrls = rows.map((r) => r.source_url);

  // Cek data duplikat di database berdasarkan source_url
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

  // Lakukan Upsert Tunggal ke database Supabase
  const { error: upsertErr } = await sb
    .from('gigs')
    .upsert(rows, { onConflict: 'source_url' });
    
  if (upsertErr) throw upsertErr;

  try {
    revalidateTag('gigs');
  } catch {
    // noop - Cache akan refresh otomatis sesuai schedule jika Next.js cache gagal di-bust
  }

  return { added, updated, skipped };
}