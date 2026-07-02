// POST /api/cv-review/checkout — mint a Mayar checkout link for the CV pack.
// -----------------------------------------------------------------------------
// Body: { name, email, mobile }
// 200 { ok: true, link }   → client redirects the buyer to Mayar
// 400 { ok: false, error } → missing fields
// 503 { ok: false, error } → Mayar not configured / upstream down

import { NextResponse } from 'next/server';
import { createPaymentRequest, MayarFailure } from '@/lib/mayar';
import { SITE_URL } from '@/lib/seo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Price of the CV-review pack (IDR). Override via env without a redeploy.
const CV_AMOUNT = Number(process.env.MAYAR_CV_AMOUNT ?? '29000') || 29000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request): Promise<Response> {
  let body: { name?: unknown; email?: unknown; mobile?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Body tidak valid.' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const mobile = typeof body.mobile === 'string' ? body.mobile.trim() : '';

  if (!name || !EMAIL_RE.test(email) || mobile.length < 6) {
    return NextResponse.json(
      { ok: false, error: 'Lengkapi nama, email valid, dan nomor HP.' },
      { status: 400 },
    );
  }

  try {
    const link = await createPaymentRequest({
      name,
      email,
      mobile,
      amount: CV_AMOUNT,
      description: 'SkillGig — Akses penuh Review CV AI',
      redirectUrl: `${SITE_URL}/tools/cv-review?paid=1&email=${encodeURIComponent(email)}`,
    });
    return NextResponse.json({ ok: true, link });
  } catch (err) {
    if (err instanceof MayarFailure && err.detail.kind === 'no-key') {
      return NextResponse.json(
        { ok: false, error: 'Pembayaran belum aktif (konfigurasi Mayar belum diset).' },
        { status: 503 },
      );
    }
    // eslint-disable-next-line no-console
    console.error('[cv-review/checkout] failed:', err);
    return NextResponse.json(
      { ok: false, error: 'Gagal membuat link pembayaran. Coba lagi.' },
      { status: 503 },
    );
  }
}
