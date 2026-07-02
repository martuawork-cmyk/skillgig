import { syncJobsHandler } from '@/lib/job-sync/cron-handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request): Promise<Response> {
  return syncJobsHandler(req);
}

export async function POST(req: Request): Promise<Response> {
  return syncJobsHandler(req);
}