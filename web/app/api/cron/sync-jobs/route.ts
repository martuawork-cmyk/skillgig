// GET / POST /api/cron/sync-jobs — pull the latest Remotive remote jobs into gigs.
// -----------------------------------------------------------------------------
// Authenticated by a shared secret: the `Authorization: Bearer <CRON_SECRET>`
// header must match the server's CRON_SECRET env var. Vercel Cron injects this
// header automatically (it reads CRON_SECRET from the project env); a manual
// trigger can hit GET with the same header, e.g.:
//
//   curl -H "Authorization: Bearer $CRON_SECRET" \
//        https://skillgig.id/api/cron/sync-jobs
//
// Returns 200 { success, added, updated, skipped, timestamp }
//         401 { success:false, error:'unauthorized' }   — bad/missing secret
//         500 { success:false, error, timestamp }        — sync threw
//
// Rate note: Remotive asks for ≤4 syncs/day. The vercel.json cron runs this
// once daily (06:00); keep manual triggers within that budget.

import { NextResponse } from 'next/server';
import { syncRemotive } from '@/lib/job-sync/remotive';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

async function runSync(): Promise<Response> {
  const timestamp = new Date().toISOString();
  try {
    const result = await syncRemotive();
    // eslint-disable-next-line no-console
    console.log('[cron/sync-jobs] Remotive sync OK:', result);
    return NextResponse.json<SyncResponse>(
      { success: true, ...result, timestamp },
      { status: 200 },
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[cron/sync-jobs] Remotive sync FAILED:', err);
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

/** Manual trigger (curl / browser test) — still requires the Bearer secret. */
export async function GET(req: Request): Promise<Response> {
  if (!isAuthorized(req)) {
    return NextResponse.json<SyncResponse>(
      { success: false, error: 'unauthorized', timestamp: new Date().toISOString() },
      { status: 401 },
    );
  }
  return runSync();
}

/** Vercel Cron invokes routes via POST. Same auth gate. */
export async function POST(req: Request): Promise<Response> {
  if (!isAuthorized(req)) {
    return NextResponse.json<SyncResponse>(
      { success: false, error: 'unauthorized', timestamp: new Date().toISOString() },
      { status: 401 },
    );
  }
  return runSync();
}
