'use server';

import { revalidatePath } from 'next/cache';
import { adminUpdateApplicationStatus } from '@/lib/supabase/admin-queries';
import type { ApplicationStatus } from '@/lib/types';

const ALLOWED: ReadonlyArray<ApplicationStatus> = [
  'pending',
  'reviewed',
  'accepted',
  'rejected',
];

export type UpdateStatusResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Server action used by the status dropdown in /admin/gigs. Validates the
 * status against the enum client-side can't be trusted, then writes through
 * the admin (service-role) client.
 */
export async function updateApplicationStatusAction(
  applicationId: string,
  status: ApplicationStatus,
): Promise<UpdateStatusResult> {
  if (!ALLOWED.includes(status)) {
    return { ok: false, error: `Status tidak dikenal: ${status}` };
  }
  try {
    await adminUpdateApplicationStatus(applicationId, status);
    revalidatePath('/admin/gigs');
    revalidatePath('/admin');
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Gagal update status.',
    };
  }
}
