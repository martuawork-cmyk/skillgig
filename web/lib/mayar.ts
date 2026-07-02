import 'server-only';

// =============================================================================
// Mayar.id payment integration (Headless API v1).
// -----------------------------------------------------------------------------
// Two responsibilities:
//   1. createPaymentRequest() — POST /payment/create to mint a one-time
//      checkout link (prefilled with the buyer's name/email) for the paid
//      CV-review pack. The customer is redirected to the returned `link`.
//   2. verifyWebhook() — authenticate the incoming `payment.received` webhook
//      against our shared secret before we grant access.
//
// Docs: https://docs.mayar.id/api-reference/introduction (Bearer <API key>),
//       https://docs.mayar.id/api-reference/reqpayment/create,
//       https://docs.mayar.id/integration/webhook (payment.received payload).
//
// Env:
//   MAYAR_API_KEY        (required)  — Read & Write API key from web.mayar.id.
//   MAYAR_WEBHOOK_TOKEN  (required)  — shared secret guarding the webhook.
//   MAYAR_MODE           (optional)  — 'sandbox' → api.mayar.club, else prod.
// =============================================================================

const FETCH_TIMEOUT_MS = 20_000;

function baseUrl(): string {
  return process.env.MAYAR_MODE === 'sandbox'
    ? 'https://api.mayar.club/hl/v1'
    : 'https://api.mayar.id/hl/v1';
}

export type CreatePaymentInput = {
  name: string;
  email: string;
  mobile: string;
  amount: number;
  description: string;
  redirectUrl: string;
};

export type MayarPaymentError =
  | { kind: 'no-key' }
  | { kind: 'upstream'; message: string };

export class MayarFailure extends Error {
  constructor(public readonly detail: MayarPaymentError) {
    super(detail.kind);
    this.name = 'MayarFailure';
  }
}

/**
 * Create a single payment request and return its hosted checkout URL.
 * Throws MayarFailure('no-key') when unconfigured so the caller can 503.
 */
export async function createPaymentRequest(input: CreatePaymentInput): Promise<string> {
  const key = process.env.MAYAR_API_KEY;
  if (!key) throw new MayarFailure({ kind: 'no-key' });

  // Expire the link in 24h — long enough to complete, short enough to keep the
  // buyer's intent fresh.
  const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  let res: Response;
  try {
    res = await fetch(`${baseUrl()}/payment/create`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: input.name,
        email: input.email,
        mobile: input.mobile,
        amount: Math.round(input.amount),
        description: input.description,
        redirectUrl: input.redirectUrl,
        expiredAt,
      }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: 'no-store',
    });
  } catch (err) {
    throw new MayarFailure({
      kind: 'upstream',
      message: err instanceof Error ? err.message : 'network',
    });
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new MayarFailure({ kind: 'upstream', message: `Mayar ${res.status}: ${body.slice(0, 200)}` });
  }

  const json = (await res.json()) as { data?: { link?: string } };
  const link = json.data?.link;
  if (!link) throw new MayarFailure({ kind: 'upstream', message: 'no checkout link in response' });
  return link;
}

// ---- Webhook ---------------------------------------------------------------

/** Shape of the fields we read from a Mayar webhook (see docs/integration). */
export type MayarWebhookEvent = {
  event?: string;
  data?: {
    id?: string;
    status?: boolean;
    customerEmail?: string;
    customerName?: string;
    amount?: number;
    productId?: string;
    productName?: string;
    productType?: string;
  };
};

/**
 * Authenticate an incoming webhook against MAYAR_WEBHOOK_TOKEN. The token is
 * accepted from any of: a `?token=` query param (register the webhook URL as
 * `…/api/webhooks/mayar?token=<TOKEN>` — fully under our control), or a
 * Bearer / x-callback-token / x-webhook-token header (in case Mayar forwards
 * it). Returns false when no source matches, so the route can 401.
 */
export function verifyWebhook(req: Request): boolean {
  const expected = process.env.MAYAR_WEBHOOK_TOKEN;
  if (!expected) return false;

  const url = new URL(req.url);
  const fromQuery = url.searchParams.get('token');

  const auth = req.headers.get('authorization') ?? '';
  const fromBearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const fromHeader =
    req.headers.get('x-callback-token') ??
    req.headers.get('x-webhook-token') ??
    '';

  return [fromQuery, fromBearer, fromHeader].some(
    (t) => t && t.length === expected.length && t === expected,
  );
}
