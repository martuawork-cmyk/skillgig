// POST /api/webhooks/mayar — Mayar payment webhook.
// -----------------------------------------------------------------------------
// Mayar POSTs `payment.received` here after a customer completes payment. We
// authenticate against MAYAR_WEBHOOK_TOKEN, then grant the buyer's email an
// entitlement to the CV-review pack.
//
// Register the URL in Mayar (Integration → Webhook) WITH the token query param:
//   https://skillgig.id/api/webhooks/mayar?token=<MAYAR_WEBHOOK_TOKEN>
//
// Always returns 200 for authenticated-but-ignored events so Mayar doesn't
// retry-storm; 401 only when the token check fails.

import { NextResponse } from 'next/server';
import { verifyWebhook, type MayarWebhookEvent } from '@/lib/mayar';
import { grantEntitlement } from '@/lib/entitlements';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Optional: only honour payments for THIS product id (set once you know the
// CV-review product id from Mayar). When unset, any completed payment grants
// access — fine for a single-product MVP.
const CV_PRODUCT_ID = process.env.MAYAR_CV_PRODUCT_ID;

export async function POST(req: Request): Promise<Response> {
  if (!verifyWebhook(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  let payload: MayarWebhookEvent;
  try {
    payload = (await req.json()) as MayarWebhookEvent;
  } catch {
    return NextResponse.json({ ok: false, error: 'bad-json' }, { status: 400 });
  }

  // Only completed payments grant access.
  if (payload.event !== 'payment.received') {
    return NextResponse.json({ ok: true, ignored: 'event' });
  }

  const data = payload.data ?? {};
  const email = data.customerEmail?.trim();
  if (!email) {
    return NextResponse.json({ ok: true, ignored: 'no-email' });
  }

  // If a specific product is configured, ignore payments for anything else.
  if (CV_PRODUCT_ID && data.productId && data.productId !== CV_PRODUCT_ID) {
    return NextResponse.json({ ok: true, ignored: 'other-product' });
  }

  const granted = await grantEntitlement({
    email,
    product: 'cv-review',
    amount: typeof data.amount === 'number' ? data.amount : undefined,
    externalId: data.id,
    raw: payload,
  });

  if (!granted) {
    // Signal a soft failure so Mayar retries (grant is idempotent on retry).
    return NextResponse.json({ ok: false, error: 'grant-failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
