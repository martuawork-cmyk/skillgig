import 'server-only';

import { redirect } from 'next/navigation';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { requireUser } from './session';
import { isSupabaseConfigured } from '@/components/feedback/ErrorState';
import type { User } from '@/lib/types';

let _admin: SupabaseClient | null = null;

/**
 * Supabase admin client — uses the service role key to bypass RLS.
 *
 * ⚠️  SERVER-ONLY. Never import this from a client component or expose
 * the resulting client to the browser. The service role key has full
 * access to every table in the project.
 *
 * Get the key from: Supabase dashboard → Settings → API → "service_role".
 * Stored in .env.local as `SUPABASE_SERVICE_ROLE_KEY` (never committed).
 */
export function createAdminClient(): SupabaseClient {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY missing. Set it in .env.local (get from Supabase Settings → API → service_role).',
    );
  }
  _admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _admin;
}

export function isAdminConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/**
 * Resolve the current user OR the raw auth.user, then verify they hold the
 * `admin` role.
 *
 * Approach — **Option A** (the recommendation in the P1-A spec):
 *   • `public.users.role` has a CHECK constraint of `'client' | 'freelancer'`,
 *     so we cannot reuse that column for admin. Instead we read
 *     `auth.users.raw_user_meta_data->>'role'` via the server client's
 *     `auth.getUser()`. Admin role is granted at sign-up by writing the meta
 *     key, e.g. via the Supabase dashboard → Authentication → Users → "User
 *     metadata" UI, or a one-off SQL UPDATE on auth.users.raw_user_meta_data.
 *
 * Behaviour:
 *   • Supabase not configured → redirect to `/` (the public landing can render
 *     a friendly ErrorState, while admin pages would 500 otherwise).
 *   • No signed-in user → redirect to `/login?next=<current-path>`.
 *   • Signed in but role !== 'admin' → redirect to `/` (home). We deliberately
 *     don't leak whether the admin path exists.
 *
 * Returns the signed-in User. Throws via Next's `redirect()` on failure.
 */
export async function requireAdmin(nextPath?: string): Promise<User> {
  if (!isSupabaseConfigured()) {
    redirect('/');
  }
  // requireUser() handles the unauthenticated case (redirect to /login with ?next).
  const user = await requireUser(nextPath);

  // Check the admin role via auth metadata. We re-read the auth user through
  // a fresh client so we get the latest metadata; cookies are refreshed by
  // middleware on every request.
  const { createClient: createServerClient } = await import('./server');
  const sb = await createServerClient();
  const { data, error } = await sb.auth.getUser();
  const metaRole = (data?.user?.user_metadata as { role?: string } | undefined)?.role;
  if (error || !data?.user || metaRole !== 'admin') {
    redirect('/');
  }
  return user;
}

