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
// ============================================================================
// Auth actions
// ============================================================================

const PASSWORD_MIN = 6;

export type AuthRole = 'client' | 'freelancer';

export type AuthResult =
  | { ok: true }
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
    const sb = createClient();
    const { error } = await sb.auth.signInWithPassword({
      email: trimmed,
      password,
    });
    if (!error) return { ok: true };
    const f = friendlyAuthMessage(error.message);
    return { ok: false, reason: f.reason, message: f.message };
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
    const sb = createClient();
    const { error } = await sb.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: { name: trimmedName, role },
      },
    });
    if (!error) return { ok: true };
    const f = friendlyAuthMessage(error.message);
    return { ok: false, reason: f.reason, message: f.message };
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
    const sb = createClient();
    await sb.auth.signOut();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[signOut] caught:', err);
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
    const sb = createClient();
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
