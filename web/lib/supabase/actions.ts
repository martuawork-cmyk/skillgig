'use server';

import { createClient } from './server';

/**
 * SkillGig.id — write actions (insert/update) + auth.
 *
 * P4-A perf: these are Server Actions. Running them on the server keeps
 * `@supabase/supabase-js` out of the client bundle (~80 kB saved on every page
 * that previously imported these from a client component — login, signup,
 * skills, and the header's user menu). RLS semantics are unchanged: the SSR
 * server client forwards the caller's session cookie, so `auth.uid()` resolves
 * to the same user as the old browser client did.
 *
 * Mirrors the pattern already used in ./apply-action.ts ('use server' + cookie
 * client).
 */

// `./server`'s createClient reads the env vars with a non-null assertion; guard
// here so a missing-config dev environment surfaces the same 'network' reason
// the UI expects (instead of a cryptic supabaseUrl error from the SDK).
async function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      'Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and ' +
        'NEXT_PUBLIC_SUPABASE_ANON_KEY in web/.env.local',
    );
  }
  return createClient();
}

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
    const sb = await getServerClient(); // throws a clear Error if env vars missing
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
// ============================================================================
// Auth actions
// ============================================================================

const PASSWORD_MIN = 6;

export type AuthRole = 'client' | 'freelancer';

export type AuthResult =
  | { ok: true; userId: string }
  | { ok: false; reason: 'invalid-input' | 'weak-password' | 'auth-failed' | 'network' | 'unknown'; message?: string };

type AuthFailureReason = 'invalid-input' | 'weak-password' | 'auth-failed' | 'network' | 'unknown';

function friendlyAuthMessage(msg: string): { reason: AuthFailureReason; message: string } {
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials') || m.includes('invalid credentials')) {
    return { reason: 'auth-failed', message: 'Email atau password salah.' };
  }
  if (m.includes('user already registered') || m.includes('already been registered')) {
    return { reason: 'auth-failed', message: 'Email sudah terdaftar. Coba masuk.' };
  }
  if (m.includes('password') && m.includes('at least')) {
    return { reason: 'weak-password', message: 'Password minimal 6 karakter.' };
  }
  if (m.includes('email not confirmed')) {
    return { reason: 'auth-failed', message: 'Email belum dikonfirmasi.' };
  }
  return { reason: 'unknown', message: msg };
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<AuthResult> {
  const trimmed = email.trim();
  if (!EMAIL_RE.test(trimmed)) return { ok: false, reason: 'invalid-input' };
  if (password.length < PASSWORD_MIN) return { ok: false, reason: 'weak-password' };

  try {
    const sb = await getServerClient();
    const { data, error } = await sb.auth.signInWithPassword({
      email: trimmed,
      password,
    });
    if (!error && data.user) return { ok: true, userId: data.user.id };
    if (error) {
      const f = friendlyAuthMessage(error.message);
      return { ok: false, reason: f.reason, message: f.message };
    }
    return { ok: false, reason: 'unknown', message: 'Login succeeded but no user returned.' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('env vars missing')) {
      return { ok: false, reason: 'network', message: 'Belum terkoneksi ke Supabase.' };
    }
    // eslint-disable-next-line no-console
    console.warn('[signIn] caught:', err);
    return { ok: false, reason: 'unknown', message: msg };
  }
}

export async function signUpWithPassword(
  name: string,
  email: string,
  password: string,
  role: AuthRole,
): Promise<AuthResult> {
  const trimmedEmail = email.trim();
  const trimmedName = name.trim();
  if (!trimmedName) return { ok: false, reason: 'invalid-input', message: 'Nama wajib diisi.' };
  if (!EMAIL_RE.test(trimmedEmail)) return { ok: false, reason: 'invalid-input', message: 'Email tidak valid.' };
  if (password.length < PASSWORD_MIN) return { ok: false, reason: 'weak-password', message: 'Password minimal 6 karakter.' };

  try {
    const sb = await getServerClient();
    const { data, error } = await sb.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: { name: trimmedName, role },
      },
    });
    if (!error && data.user) return { ok: true, userId: data.user.id };
    if (error) {
      const f = friendlyAuthMessage(error.message);
      return { ok: false, reason: f.reason, message: f.message };
    }
    return { ok: false, reason: 'unknown', message: 'Signup succeeded but no user returned.' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('env vars missing')) {
      return { ok: false, reason: 'network', message: 'Belum terkoneksi ke Supabase.' };
    }
    // eslint-disable-next-line no-console
    console.warn('[signUp] caught:', err);
    return { ok: false, reason: 'unknown', message: msg };
  }
}

export async function signOut(): Promise<void> {
  try {
    const sb = await getServerClient();
    await sb.auth.signOut();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[signOut] caught:', err);
  }
}

// ============================================================================
// User skills (P3-B)
// ============================================================================

export type UserSkillActionResult =
  | { ok: true }
  | { ok: false; reason: 'unauthenticated' | 'network' | 'unknown'; message: string };

/**
 * Add a skill to the current user's skill bag.
 *
 * - Requires authentication; RLS on `user_skills` enforces `user_id = auth.uid()`
 *   on insert (see migration 012_user_skills.sql).
 * - Idempotent: the UNIQUE(user_id, skill_id) index collapses duplicate adds
 *   to a single row, which we surface as success so the "klik untuk tambah"
 *   flow on /skills can be tapped twice without flashing an error.
 * - Postgrest 23505 (unique_violation) is treated as success.
 */
export async function addUserSkill(
  skillId: string,
  level: 'beginner' | 'intermediate' | 'advanced' = 'beginner',
): Promise<UserSkillActionResult> {
  if (!skillId) {
    return { ok: false, reason: 'unknown', message: 'Skill id kosong.' };
  }

  try {
    const sb = await getServerClient();
    const { data: auth, error: authErr } = await sb.auth.getUser();
    if (authErr || !auth?.user) {
      return { ok: false, reason: 'unauthenticated', message: 'Silakan login dulu.' };
    }

    const { error } = await sb
      .from('user_skills')
      .insert({ user_id: auth.user.id, skill_id: skillId, level });
    if (!error) return { ok: true };
    if (error.code === '23505') return { ok: true }; // already in the bag
    // eslint-disable-next-line no-console
    console.warn('[addUserSkill] insert failed:', error);
    return { ok: false, reason: 'unknown', message: error.message };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('env vars missing')) {
      return { ok: false, reason: 'network', message: 'Belum terkoneksi ke Supabase.' };
    }
    // eslint-disable-next-line no-console
    console.warn('[addUserSkill] caught:', err);
    return { ok: false, reason: 'unknown', message: msg };
  }
}

/**
 * Remove a skill from the current user's bag. Idempotent — deleting a row
 * that no longer exists is a no-op and returns success.
 */
export async function removeUserSkill(
  skillId: string,
): Promise<UserSkillActionResult> {
  if (!skillId) {
    return { ok: false, reason: 'unknown', message: 'Skill id kosong.' };
  }

  try {
    const sb = await getServerClient();
    const { data: auth, error: authErr } = await sb.auth.getUser();
    if (authErr || !auth?.user) {
      return { ok: false, reason: 'unauthenticated', message: 'Silakan login dulu.' };
    }

    const { error } = await sb
      .from('user_skills')
      .delete()
      .eq('user_id', auth.user.id)
      .eq('skill_id', skillId);
    if (!error) return { ok: true };
    // eslint-disable-next-line no-console
    console.warn('[removeUserSkill] delete failed:', error);
    return { ok: false, reason: 'unknown', message: error.message };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('env vars missing')) {
      return { ok: false, reason: 'network', message: 'Belum terkoneksi ke Supabase.' };
    }
    // eslint-disable-next-line no-console
    console.warn('[removeUserSkill] caught:', err);
    return { ok: false, reason: 'unknown', message: msg };
  }
}

/**
 * Subscribe the current user's email to a skill alert.
 * Inserts a row into public.subscribers with email = auth.user.email
 * and skill_id = the given skill.
 *
 * Returns { error } on failure, or empty object on success.
 * Idempotent: if the (email, skill_id) pair already exists (Postgres 23505),
 * treats it as success.
 */
export async function subscribeSkillAlert(
  skillId: string,
): Promise<{ error?: string }> {
  try {
    const sb = await getServerClient();
    const { data: auth } = await sb.auth.getUser();
    if (!auth?.user?.email) {
      return { error: 'Anda harus login untuk mengaktifkan alert.' };
    }
    const { error } = await sb.from('subscribers').insert({
      email: auth.user.email,
      skill_id: skillId,
    });
    if (!error) return {};
    if (error.code === '23505') return {}; // already subscribed
    return { error: error.message };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('env vars missing')) {
      return { error: 'Belum terkoneksi ke Supabase.' };
    }
    // eslint-disable-next-line no-console
    console.warn('[subscribeSkillAlert] caught:', err);
    return { error: msg };
  }
}
