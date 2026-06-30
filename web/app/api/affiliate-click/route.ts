// POST /api/affiliate-click
//
// Click-tracking endpoint for the "Mulai Belajar" CTA on /learn.
//
// Request body : { courseId: string }
// Response 200  : { ok: true, redirectUrl: string }
// Response 4xx  : { ok: false, error: <reason>, message?: string }
//
// Flow:
//   1. Validate courseId is a UUID.
//   2. Confirm Supabase is configured (return 503 otherwise).
//   3. Resolve the redirect target:
//        - courses.affiliate_url when set
//        - fallback to courses.url
//      If neither resolves, return 404 — admin must add a link before the
//      button is usable.
//   4. Identify the visitor on a best-effort basis:
//        - user_id   from `sb.auth.getUser()` (NULL for anon traffic)
//        - session_id from the sb-<ref>-auth-token JWT cookie payload
//          (`sb.auth.getSession()`). NOT exposed to the browser anywhere
//          besides the cookie itself, so safe to persist.
//   5. INSERT into `affiliate_clicks`. Anon INSERT is allowed via the
//      policy in migration 013; service role is reserved for the admin
//      reads.
//   6. Return { ok: true, redirectUrl } so the client can hand off to
//      `window.location.replace(redirectUrl)`.
//
// The click insert is fire-and-best-effort. If it fails (transient
// Supabase hiccup, schema drift, etc.) we log a warning and still return
// the redirect — losing one analytics row should never block a paying
// user.

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/components/feedback/ErrorState';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ClickBody = {
  courseId?: unknown;
};

type OkBody = {
  ok: true;
  /** Where the client should redirect the user. */
  redirectUrl: string;
};

type ErrBody = {
  ok: false;
  error: 'invalid-id' | 'not-found' | 'network' | 'unknown';
  message?: string;
};

export async function POST(req: Request): Promise<Response> {
  // Parse body. Tolerates a missing JSON body (treated as invalid-id) so
  // the "open in new tab" fallback when JS is disabled still degrades to a
  // 400 rather than a confusing 500.
  let body: ClickBody;
  try {
    body = (await req.json()) as ClickBody;
  } catch {
    return NextResponse.json<ErrBody>(
      { ok: false, error: 'invalid-id', message: 'Body harus JSON.' },
      { status: 400 },
    );
  }

  const courseId = typeof body.courseId === 'string' ? body.courseId.trim() : '';
  if (!courseId || !UUID_RE.test(courseId)) {
    return NextResponse.json<ErrBody>(
      { ok: false, error: 'invalid-id', message: 'courseId tidak valid.' },
      { status: 400 },
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json<ErrBody>(
      {
        ok: false,
        error: 'network',
        message: 'Belum terkoneksi ke Supabase.',
      },
      { status: 503 },
    );
  }

  const sb = await createClient();

  // Resolve the course's outbound URL + identify the visitor in parallel.
  // Both are independent reads and the user-facing `redirectUrl` is what
  // matters — so we start both at once.
  const [courseRes, authRes] = await Promise.all([
    sb.from('courses').select('url, affiliate_url').eq('id', courseId).maybeSingle(),
    sb.auth.getUser(),
  ]);

  if (courseRes.error) {
    // eslint-disable-next-line no-console
    console.warn('[api/affiliate-click] course lookup failed:', courseRes.error);
    return NextResponse.json<ErrBody>(
      { ok: false, error: 'unknown', message: 'Gagal memuat kursus.' },
      { status: 500 },
    );
  }
  if (!courseRes.data) {
    return NextResponse.json<ErrBody>(
      { ok: false, error: 'not-found', message: 'Kursus tidak ditemukan.' },
      { status: 404 },
    );
  }

  type CourseLite = { url: string; affiliate_url: string | null };
  const row = courseRes.data as CourseLite;
  const redirectUrl = row.affiliate_url?.trim() || row.url || '';

  if (!redirectUrl) {
    return NextResponse.json<ErrBody>(
      {
        ok: false,
        error: 'not-found',
        message: 'Kursus belum punya tautan tujuan.',
      },
      { status: 404 },
    );
  }

  // Best-effort visitor identification. The auth user / anon session are
  // both optional — anonymous clickers just get a NULL user_id and we
  // derive session_id from the anon sid helper below.
  const userId = authRes.data?.user?.id ?? null;
  const sessionId = await readAnonSessionId();

  // Log the click. RLS in migration 013 allows anon INSERT.
  const { error: insertErr } = await sb.from('affiliate_clicks').insert({
    course_id: courseId,
    user_id: userId,
    session_id: sessionId,
  });
  if (insertErr) {
    // Don't block the redirect — losing one analytics row should never
    // cost us a paying user. Log so ops can spot systemic failures.
    // eslint-disable-next-line no-console
    console.warn('[api/affiliate-click] insert failed:', insertErr);
  }

  return NextResponse.json<OkBody>({ ok: true, redirectUrl }, { status: 200 });
}

/**
 * Pull the anon Supabase session id out of the request cookies so we have
 * a stable per-browser identifier even when no one has logged in.
 *
 * Supabase stores two cookies per app reference in the browser:
 *   - `sb-<ref>-auth-token` — chunked JWT chunk(s); we don't decode the
 *     payload (no need); we only need the cookie NAME to fingerprint the
 *     browser between requests.
 *   - older versions used `supabase.auth.token`.
 *
 * We simply concatenate the cookie names + a length hash so a long JWT
 * doesn't bloat every `affiliate_clicks` row. This is enough to dedupe
 * "same browser, same session" without leaking the JWT itself.
 */
async function readAnonSessionId(): Promise<string | null> {
  // `cookies()` is the only way to reach the request cookies from a route
  // handler in App Router. It's request-scoped.
  const cookieStore = await import('next/headers').then((m) => m.cookies());
  const all = cookieStore.getAll();
  if (all.length === 0) return null;

  // Find the Supabase auth cookie(s). Names look like
  //   sb-xyz123-auth-token.0, sb-xyz123-auth-token.1, ...
  // We only need the cookie name + a short length fingerprint so the
  // stored `session_id` does not echo the JWT itself.
  const sbCookie = all.find((c) => c.name.includes('-auth-token'));
  if (!sbCookie) return null;

  const len = sbCookie.value.length;
  // djb2-ish hash so two cookies with the same length don't collide in
  // the simple `name:len` form. Not crypto-strong — this is just a
  // browser fingerprint.
  let hash = 5381;
  for (let i = 0; i < sbCookie.name.length; i++) {
    hash = ((hash << 5) + hash + sbCookie.name.charCodeAt(i)) | 0;
  }
  return `${sbCookie.name}:${len}:${(hash >>> 0).toString(36)}`;
}
