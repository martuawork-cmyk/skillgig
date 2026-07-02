// GET / POST /api/cron/fetch-jobs — pull the latest Remotive remote jobs into gigs.
// -----------------------------------------------------------------------------
// This is the route the C3 brief names and the one vercel.json cron targets
// (daily at 06:00 UTC). It shares its handler with /api/cron/sync-jobs so both
// paths behave identically — auth + the Remotive sync live in
// lib/job-sync/cron-handler.ts; see that file for the full contract.
//
// Source: Remotive (https://remotive.com/api/remote-jobs, no API key). The
// handler is structured so a future Jobicy / multi-source sync can slot in
// behind the same auth gate without touching the route.
//
// Manual trigger:
//   curl -H "Authorization: Bearer $CRON_SECRET" \
//        https://skillgig.id/api/cron/fetch-jobs

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
