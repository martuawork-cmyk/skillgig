'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from './server';
import { applyToGigSchema } from './validation';

/**
 * Server action for the public "Lamar" button on /gigs/[id].
 *
 * - Requires a signed-in user (RLS enforces the freelancer_id == auth.uid()
 *   rule on insert — same goes for user_id after migration 010).
 * - Validates the cover letter client-side is unreliable (bypass), so we
 *   re-validate here with the same 50-character minimum.
 * - Idempotent: if the same user has already applied, returns
 *   `{ ok: false, reason: 'already-applied' }` without hitting the DB.
 * - Returns a discriminated union the form component can switch on.
 */

export type ApplyResult =
  | { ok: true; applicationId: string }
  | {
      ok: false;
      reason: 'unauthenticated' | 'invalid-input' | 'already-applied' | 'unknown';
      message: string;
    };

export async function applyToGigAction(
  gigId: string,
  coverLetter: string,
): Promise<ApplyResult> {
  const parsed = applyToGigSchema({ gigId, coverLetter });
  if (!parsed.success) {
    return {
      ok: false,
      reason: 'invalid-input',
      message: parsed.error,
    };
  }

  try {
    const sb = await createClient();
    const { data: auth, error: authErr } = await sb.auth.getUser();
    if (authErr || !auth?.user) {
      return {
        ok: false,
        reason: 'unauthenticated',
        message: 'Silakan login dulu untuk melamar.',
      };
    }
    const userId = auth.user.id;

    // Dedupe check — friendly message before the unique constraint trips.
    const { data: existing } = await sb
      .from('applications')
      .select('id')
      .or(`user_id.eq.${userId},freelancer_id.eq.${userId}`)
      .eq('gig_id', gigId)
      .limit(1)
      .maybeSingle();
    if (existing) {
      return {
        ok: false,
        reason: 'already-applied',
        message: 'Kamu sudah melamar gig ini.',
      };
    }

    // Insert — try user_id first, fall back to freelancer_id if the migration
    // hasn't been run on the target database yet. Keeps the action tolerant
    // during the rollout.
    let insert = await sb
      .from('applications')
      .insert({
        user_id: userId,
        gig_id: gigId,
        cover_letter: parsed.data.coverLetter,
        status: 'pending',
      })
      .select('id')
      .single();

    // If the migration adding user_id hasn't run, retry with the legacy column.
    if (insert.error && insert.error.code === '42703') {
      insert = await sb
        .from('applications')
        .insert({
          freelancer_id: userId,
          gig_id: gigId,
          cover_letter: parsed.data.coverLetter,
          status: 'pending',
        })
        .select('id')
        .single();
    }

    if (insert.error || !insert.data) {
      // 23505 = unique_violation (race: another tab submitted first)
      if (insert.error?.code === '23505') {
        return {
          ok: false,
          reason: 'already-applied',
          message: 'Kamu sudah melamar gig ini.',
        };
      }
      // eslint-disable-next-line no-console
      console.warn('[applyToGigAction] insert failed:', insert.error);
      return {
        ok: false,
        reason: 'unknown',
        message: insert.error?.message ?? 'Gagal mengirim lamaran.',
      };
    }

    // Refresh downstream views — the user lands on /applications after submit.
    revalidatePath('/applications');
    revalidatePath(`/gigs/${gigId}`);
    revalidatePath('/admin/gigs');

    return { ok: true, applicationId: insert.data.id };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[applyToGigAction] caught:', err);
    return {
      ok: false,
      reason: 'unknown',
      message: err instanceof Error ? err.message : 'Terjadi kesalahan.',
    };
  }
}
