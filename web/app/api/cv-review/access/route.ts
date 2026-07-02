// GET /api/cv-review/access?email=<email> — check paid access for the CV pack.
// 200 { ok: true, active: boolean }
// -----------------------------------------------------------------------------
// The client calls this after a Mayar redirect (or via "sudah bayar? cek akses")
// to unlock unlimited reviews for a paid email. Fail-closed: any doubt → false.

import { NextResponse } from 'next/server';
import { hasActiveEntitlement } from '@/lib/entitlements';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(req: Request): Promise<Response> {
  const email = new URL(req.url).searchParams.get('email')?.trim() ?? '';
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: true, active: false });
  }
  const active = await hasActiveEntitlement(email, 'cv-review');
  return NextResponse.json({ ok: true, active });
}
