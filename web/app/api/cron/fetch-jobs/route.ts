import 'server-only';

// =============================================================================
// Shared handler for the job-sync cron routes
// (app/api/cron/sync-jobs + app/api/cron/fetch-jobs).
// -----------------------------------------------------------------------------
// Both routes are thin wrappers around `syncJobsHandler` so they stay in lock-
// step: identical auth, identical multi-source sync, identical response shape.
// =============================================================================

import { NextResponse } from 'next/server';
import { syncRemotive } from './remotive';
import { syncAdzuna } from './adzuna'; // 1. Import fungsi penarik Adzuna

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

type SyncResponse = {
  success: boolean;
  added?: number;
  updated?: number;
  skipped?: number;
  error?: string;
  timestamp: string;
};

function unauthorized(): Response {
  return NextResponse.json<SyncResponse>(
    { success: false, error: 'unauthorized', timestamp: new Date().toISOString() },
    { status: 401 },
  );
}

async function runSync(): Promise<Response> {
  const timestamp = new Date().toISOString();
  try {
    // 2. Jalankan Sync Remotive
    const remotiveResult = await syncRemotive();
    // eslint-disable-next-line no-console
    console.log('[cron/fetch-jobs] Remotive sync OK:', remotiveResult);

    // 3. Jalankan Sync Adzuna
    const adzunaResult = await syncAdzuna();
    // eslint-disable-next-line no-console
    console.log('[cron/fetch-jobs] Adzuna sync OK:', adzunaResult);

    // 4. Gabungkan hasil statistik dari kedua platform
    const combinedResult = {
      added: remotiveResult.added + adzunaResult.added,
      updated: remotiveResult.updated + adzunaResult.updated,
      skipped: remotiveResult.skipped + adzunaResult.skipped,
    };

    return NextResponse.json<SyncResponse>(
      { success: true, ...combinedResult, timestamp },
      { status: 200 },
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[cron/fetch-jobs] Job sync FAILED:', err);
    return NextResponse.json<SyncResponse>(
      {
        success: false,
        error: err instanceof Error ? err.message : 'unknown',
        timestamp,
      },
      { status: 500 },
    );
  }
}

/**
 * Shared GET/POST entry for the job-sync cron routes. Gates on the Bearer
 * secret, then runs the combined Remotive + Adzuna sync.
 */
export async function syncJobsHandler(req: Request): Promise<Response> {
  if (!isAuthorized(req)) return unauthorized();
  return runSync();
}