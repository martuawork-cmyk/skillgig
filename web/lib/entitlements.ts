import 'server-only';

// =============================================================================
// Entitlements — paid-access grants keyed by buyer email (table: entitlements,
// migration 018). Written by the Mayar webhook, read by the access-check API.
// All access uses the service-role client (RLS is default-deny).
// =============================================================================

import { createAdminClient } from '@/lib/supabase/admin';

export type GrantInput = {
  email: string;
  product?: string;
  amount?: number;
  externalId?: string;
  /** ISO string; omit / undefined = lifetime access. */
  expiresAt?: string | null;
  raw?: unknown;
};

/** Normalise an email for consistent keying (matches the functional index). */
function norm(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Grant (or refresh) an entitlement. Upserts on (email, product) so a repeat
 * webhook for the same buyer is idempotent. Returns true on success.
 */
export async function grantEntitlement(input: GrantInput): Promise<boolean> {
  const email = norm(input.email);
  if (!email) return false;
  const product = input.product ?? 'cv-review';

  const sb = createAdminClient();
  const { error } = await sb.from('entitlements').upsert(
    {
      email,
      product,
      status: 'active',
      amount: input.amount ?? null,
      source: 'mayar',
      external_id: input.externalId ?? null,
      granted_at: new Date().toISOString(),
      expires_at: input.expiresAt ?? null,
      raw: input.raw ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'email,product' },
  );

  if (error) {
    // eslint-disable-next-line no-console
    console.error('[entitlements] grant failed:', error.message);
    return false;
  }
  return true;
}

/**
 * True when `email` has an active, unexpired entitlement to `product`.
 * Fail-closed: any error resolves to false (no access on a degraded read).
 */
export async function hasActiveEntitlement(
  email: string,
  product = 'cv-review',
): Promise<boolean> {
  const key = norm(email);
  if (!key) return false;

  const sb = createAdminClient();
  const { data, error } = await sb
    .from('entitlements')
    .select('status, expires_at')
    .eq('email', key)
    .eq('product', product)
    .maybeSingle();

  if (error || !data) return false;
  if (data.status !== 'active') return false;
  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) return false;
  return true;
}
