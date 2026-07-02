// GET / POST /api/cron/sync-jobs — pull the latest Remotive remote jobs into gigs.
// -----------------------------------------------------------------------------
// Thin wrapper around the shared job-sync handler (lib/job-sync/cron-handler.ts).
// Kept as the canonical cron path for backwards compatibility — vercel.json now
// targets /api/cron/fetch-jobs (same handler, different name), but this route
// still works for any existing curl/monitoring hitting the old URL.
//
// Auth + behaviour live in the shared handler; see that file for the contract.

import { syncJobsHandler } from '@/lib/job-sync/cron-handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Manual trigger (curl / browser test) — still requires the Bearer secret. */
export async function GET(req: Request): Promise<Response> {
  return syncJobsHandler(req);
}

/** Vercel Cron invokes routes via POST. Same auth gate. */
export async function POST(req: Request): Promise<Response> {
  return syncJobsHandler(req);
}
