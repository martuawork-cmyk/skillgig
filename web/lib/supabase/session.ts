import 'server-only';

import { redirect } from 'next/navigation';
import { createClient } from './server';
import { isSupabaseConfigured as _isConfigured } from '@/components/feedback/ErrorState';
import type { User } from '@/lib/types';

export const isSupabaseConfigured = _isConfigured;

/**
 * Server-side session helpers. Use these inside Server Components, Route
 * Handlers, and Server Actions to read the currently authenticated user.
 *
 * Flow:
 *   1. `getSession()` — read auth user from session cookie
 *   2. `getCurrentUser()` — read public.users profile (joined via id)
 *   3. `requireUser(redirectTo?)` — getCurrentUser + redirect to /login if absent
 */

export async function getSession() {
  const sb = await createClient();
  const { data, error } = await sb.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;
  const sb = await createClient();
  const { data, error } = await sb
    .from('users')
    .select('*')
    .eq('id', session.id)
    .maybeSingle();
  if (error) {
    // eslint-disable-next-line no-console
    console.warn('[getCurrentUser] users fetch failed:', error);
    return null;
  }
  return (data as User | null) ?? null;
}

/**
 * Resolve the current user or redirect to /login. Pass `next` to return the
 * user back to the requested page after sign-in.
 */
export async function requireUser(nextPath?: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    const next = nextPath ? `?next=${encodeURIComponent(nextPath)}` : '';
    redirect(`/login${next}`);
  }
  return user;
}
