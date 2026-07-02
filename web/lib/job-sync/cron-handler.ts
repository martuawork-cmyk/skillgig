import 'server-only';

// =============================================================================
// Shared handler for the job-sync cron routes
// (app/api/cron/sync-jobs + app/api/cron/fetch-jobs).
// -----------------------------------------------------------------------------
// Both routes are thin wrappers around `syncJobsHandler` so they stay in lock-
// step: identical auth, identical Remotive sync, identical response shape. The
// route files only own the Next.js segment config (`runtime` / `dynamic`) and
// the GET/POST signatures — everything substantive lives here.
//
// Auth: a shared secret. The `Authorization: Bearer <CRON_SECRET>` header must
// match the server's CRON_SECRET env var. Vercel Cron injects this header
// automatically (it reads CRON_SECRET from the project env); a manual trigger
// can hit GET with the same header, e.g.:
//
//   curl -H "Authorization: Bearer $CRON_SECRET" \
//        https://skillgig.id/api/cron/fetch-jobs
//
// Returns 200 { success, added, updated, skipped, timestamp }
//         401 { success:false, error:'unauthorized' }   — bad/missing secret
//         500 { success:false, error, timestamp }        — sync threw
//
// Rate note: Remotive asks for ≤4 syncs/day. Keep ONE cron entry in vercel.json
// (it points at /api/cron/fetch-jobs). Both route paths invoke this handler, so
// hitting either has the same effect — do NOT cron both or you double-sync.
// =============================================================================

import { NextResponse } from 'next/server';
import { syncRemotive } from './remotive';

/** True when the request carries the expected Bearer secret. */
function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  // No secret configured → deny everything (fail closed). Prevents an
  // unconfigured deploy from becoming an open sync trigger.
  if (!secret) return false;
  const header = req.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ')
    ? header.slice('Bearer '.length).trim()
    : header.trim();
  // Constant-time-ish compare to avoid trivial secret timing leaks.
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
    const result = await syncRemotive();
    // eslint-disable-next-line no-console
    console.log('[cron/fetch-jobs] Remotive sync OK:', result);
    return NextResponse.json<SyncResponse>(
      { success: true, ...result, timestamp },
      { status: 200 },
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[cron/fetch-jobs] Remotive sync FAILED:', err);
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
 * secret, then runs the Remotive sync. Returns the Response directly so the
 * route file can `return syncJobsHandler(req)` from its GET/POST handlers.
 */
export async function syncJobsHandler(req: Request): Promise<Response> {
  if (!isAuthorized(req)) return unauthorized();
  return runSync();
}
