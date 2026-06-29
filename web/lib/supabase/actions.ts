import { createClient } from './client';

/**
 * SkillGig.id — write actions (insert/update).
 *
 * These run on the **browser** via the anon Supabase client. RLS policies
 * control what an unauthenticated user can do — see `001_init.sql`.
 *
 * For server-side writes (with admin/service role), a separate file would be
 * needed. None are required in Phase 4.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SubscribeResult =
  | { ok: true }
  | { ok: false; reason: 'invalid-email' | 'network' | 'unknown' };

/**
 * Insert a row into `public.subscribers` with `email` only (skill_id = NULL).
 *
 * Behaviour:
 *   - Returns `{ ok: true }` on success.
 *   - Returns `{ ok: false, reason: 'invalid-email' }` if the email fails
 *     a basic shape check.
 *   - Treats Postgres unique-violation (code `23505`) as success — so if a
 *     UNIQUE(email) constraint is added later, duplicate opt-ins are silent.
 *   - Returns `{ ok: false, reason: 'network' }` if the browser client
 *     throws because env vars are missing.
 *   - Any other error → `{ ok: false, reason: 'unknown' }`.
 */
export async function subscribeEmail(email: string): Promise<SubscribeResult> {
  const trimmed = email.trim();
  if (!EMAIL_RE.test(trimmed)) {
    return { ok: false, reason: 'invalid-email' };
  }

  try {
    const sb = createClient(); // throws a clear Error if env vars missing
    const { error } = await sb
      .from('subscribers')
      .insert({ email: trimmed });
    if (!error) return { ok: true };
    // 23505 = unique_violation — treat as success (idempotent opt-in)
    if (error.code === '23505') return { ok: true };
    // eslint-disable-next-line no-console
    console.warn('[subscribeEmail] unexpected error:', error);
    return { ok: false, reason: 'unknown' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('env vars missing')) {
      return { ok: false, reason: 'network' };
    }
    // eslint-disable-next-line no-console
    console.warn('[subscribeEmail] caught:', err);
    return { ok: false, reason: 'unknown' };
  }
}