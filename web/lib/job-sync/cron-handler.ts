import 'server-only';

// =============================================================================
// Shared handler for the job-sync cron routes
// (app/api/cron/sync-jobs + app/api/cron/fetch-jobs).
// =============================================================================

import { NextResponse } from 'next/server';
import { syncRemotive } from '@/lib/job-sync/remotive';
import { syncAdzuna } from '@/lib/job-sync/adzuna';
import { notifyNewGigsSynced } from '@/lib/telegram';

/** True when the request carries the expected Bearer secret. */
function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ')
    ? header.slice('Bearer '.length).trim()
    : header.trim();
  return token.length === secret.length && token === secret;
}

/** Per-source stats returned in the cron response. `error` is set only when the
 *  whole source fatally threw (e.g. missing credentials, upstream 5xx). */
type SourceStats = {
  added: number;
  updated: number;
  skipped: number;
  error?: string;
};

/** Adzuna additionally reports per-row upsert errors (rows that conflicted or
 *  otherwise failed individually without aborting the rest of its batch). */
type AdzunaStats = SourceStats & { errors: number };

type SyncResponse = {
  success: boolean;
  /** Present on the 401 path instead of per-source stats. */
  error?: string;
  /** Present only after auth succeeds. */
  remotive?: SourceStats;
  adzuna?: AdzunaStats;
  /** Present when a sync was skipped because one was already running / just ran. */
  skipped?: boolean;
  reason?: string;
  timestamp: string;
};

function unauthorized(): Response {
  return NextResponse.json<SyncResponse>(
    { success: false, error: 'unauthorized', timestamp: new Date().toISOString() },
    { status: 401 },
  );
}

/** Coerce a thrown value into a short string for the `error` field. */
function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : 'unknown';
}

// ---------------------------------------------------------------------------
// Concurrent-run guard (defence against overlapping sync invocations).
// ---------------------------------------------------------------------------
// The observed duplicate-key errors came in pairs ~28s apart for the same id —
// the signature of two sync runs overlapping (e.g. Vercel Cron + an external
// monitor both hitting the route, or a cron retry). The atomic per-source
// upserts already make overlapping runs SAFE at the DB level (no 23505 escapes
// — see lib/job-sync/adzuna.ts & remotive.ts); this guard just prevents the
// redundant second run from doing the work twice (wasted upstream API quota +
// DB writes) by short-circuiting it.
//
// Scope note: this is an IN-MEMORY lock — it only dedupes runs that land on the
// SAME serverless instance. Two runs on different instances each get their own
// module state and will both proceed. That is fine: correctness does not depend
// on this lock, only on the atomic upserts. A cross-instance lock would need a
// DB row / advisory lock (a small migration) and is over-engineering at the
// current cron cadence (every 6h); revisit only if overlapping runs are seen to
// waste meaningful quota.
let syncInProgress = false;
let lastSyncFinishedAt = 0;
/** Skip a run if another finished within this window (covers retry gaps). */
const SYNC_COOLDOWN_MS = 60_000;

async function runSync(): Promise<Response> {
  const timestamp = new Date().toISOString();

  // Run each source in its OWN try/catch. A fatal failure in one source (e.g.
  // Adzuna credentials missing, or its API down) must NOT abort the other, and
  // must NOT turn the whole cron into success:false — the response reports
  // per-source stats so a degraded run is still visible.
  let remotiveOk = true;
  let remotive: SourceStats = { added: 0, updated: 0, skipped: 0 };
  try {
    remotive = await syncRemotive();
    // eslint-disable-next-line no-console
    console.log('[cron/fetch-jobs] Remotive sync OK:', remotive);
  } catch (err) {
    remotiveOk = false;
    remotive = { ...remotive, error: errMsg(err) };
    // eslint-disable-next-line no-console
    console.error('[cron/fetch-jobs] Remotive sync FAILED:', err);
  }

  let adzunaOk = true;
  let adzuna: AdzunaStats = { added: 0, updated: 0, skipped: 0, errors: 0 };
  try {
    adzuna = await syncAdzuna();
    // eslint-disable-next-line no-console
    console.log('[cron/fetch-jobs] Adzuna sync OK:', adzuna);
  } catch (err) {
    adzunaOk = false;
    adzuna = { ...adzuna, error: errMsg(err) };
    // eslint-disable-next-line no-console
    console.error('[cron/fetch-jobs] Adzuna sync FAILED:', err);
  }

  // The cron is considered successful if AT LEAST ONE source completed without
  // a fatal error. Only when BOTH sources throw do we return a 500 (so the
  // scheduler / alerting treats a total outage as a real failure). Per-row
  // Adzuna `errors` do NOT count as fatal — they're surfaced in the response.
  const success = remotiveOk || adzunaOk;

  // Ping the admin Telegram channel when the run actually surfaced new gigs —
  // best-effort and fire-and-forget, exactly like the gig-approval notification
  // (lib/supabase/admin-queries.ts): a Telegram failure must NEVER turn a
  // successful sync into a failed cron response. Only ping when at least one
  // source added something, so runs that added nothing stay quiet.
  const totalAdded = remotive.added + adzuna.added;
  if (totalAdded > 0) {
    void notifyNewGigsSynced({ remotive, adzuna }).catch(() => {
      /* swallow — see note above */
    });
  }

  return NextResponse.json<SyncResponse>(
    { success, remotive, adzuna, timestamp },
    { status: success ? 200 : 500 },
  );
}

/**
 * Shared GET/POST entry for the job-sync cron routes. Gates on the Bearer
 * secret, then runs the combined Remotive + Adzuna sync.
 */
export async function syncJobsHandler(req: Request): Promise<Response> {
  if (!isAuthorized(req)) return unauthorized();

  // Short-circuit if a sync is mid-flight, or one finished within the cooldown.
  // The check-then-set below is synchronous (no await between them), so on a
  // single instance the event loop cannot interleave two callers here: the
  // first flips `syncInProgress` before it awaits, the second sees it true.
  const now = Date.now();
  if (syncInProgress || now - lastSyncFinishedAt < SYNC_COOLDOWN_MS) {
    // eslint-disable-next-line no-console
    console.log('[cron/fetch-jobs] sync already in progress/recent — skipping');
    return NextResponse.json<SyncResponse>(
      {
        success: true,
        skipped: true,
        reason: 'sync already in progress or recently finished',
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  }

  syncInProgress = true;
  try {
    return await runSync();
  } finally {
    syncInProgress = false;
    lastSyncFinishedAt = Date.now();
  }
}