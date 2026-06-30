// POST /api/subscribe — newsletter opt-in (email + optional skill)
//
// Request body: { email: string, skillId?: string | null }
// Response 200: { ok: true, alreadySubscribed: boolean, emailSent: boolean }
// Response 4xx: { ok: false, error: <reason> }
//
// Flow:
//   1. Validate email shape (RFC-ish regex).
//   2. If skillId is provided, look up the skill name (public read on skills).
//      Reject unknown skillId with 400 so the client can't smuggle in junk.
//   3. INSERT into public.subscribers with (email, skill_id, skill_name).
//      - Postgres UNIQUE on (lower(email), skill_id) (migration 009) turns a
//        duplicate opt-in into a 23505 → we treat as success.
//   4. Fire-and-await the welcome email via lib/email.ts (skipped silently
//      when RESEND_API_KEY isn't set — never blocks the subscribe path).
//
// Note: we deliberately use the anon Supabase client here. The RLS policy
// `subscribers_insert_only` is permissive (`WITH CHECK (true)`), so anon
// inserts work. The service-role key is reserved for the admin layer.

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendWelcomeEmail } from '@/lib/email';
import { isSupabaseConfigured } from '@/components/feedback/ErrorState';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Postgres `uuid` shape. We validate at the edge so a typo doesn't waste a
// round-trip and gets a friendly 400 instead of a 22P02 from Postgres.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type SubscribeBody = {
  email?: unknown;
  skillId?: unknown;
};

type OkBody = {
  ok: true;
  alreadySubscribed: boolean;
  emailSent: boolean;
};

type ErrBody = {
  ok: false;
  error:
    | 'invalid-email'
    | 'invalid-skill'
    | 'network'
    | 'unknown';
  message?: string;
};

export async function POST(req: Request): Promise<Response> {
  let body: SubscribeBody;
  try {
    body = (await req.json()) as SubscribeBody;
  } catch {
    return NextResponse.json<ErrBody>(
      { ok: false, error: 'invalid-email', message: 'Body harus JSON.' },
      { status: 400 },
    );
  }

  const rawEmail  = typeof body.email  === 'string' ? body.email.trim().toLowerCase()  : '';
  const rawSkill  = typeof body.skillId === 'string' ? body.skillId.trim() : '';
  const skillId   = rawSkill || null;

  if (!rawEmail || !EMAIL_RE.test(rawEmail) || rawEmail.length > 254) {
    return NextResponse.json<ErrBody>(
      { ok: false, error: 'invalid-email', message: 'Format email tidak valid.' },
      { status: 400 },
    );
  }

  if (skillId && !UUID_RE.test(skillId)) {
    return NextResponse.json<ErrBody>(
      { ok: false, error: 'invalid-skill', message: 'Skill tidak dikenal.' },
      { status: 400 },
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json<ErrBody>(
      {
        ok: false,
        error: 'network',
        message: 'Belum terkoneksi ke Supabase. Coba lagi nanti.',
      },
      { status: 503 },
    );
  }

  const sb = await createClient();

  // Resolve skill name (if any). skills is public-readable; we limit to the
  // columns we need so the response stays small and we don't leak data.
  let skillName: string | null = null;
  if (skillId) {
    const { data, error } = await sb
      .from('skills')
      .select('id, name')
      .eq('id', skillId)
      .maybeSingle();
    if (error) {
      // eslint-disable-next-line no-console
      console.warn('[api/subscribe] skill lookup failed:', error);
      return NextResponse.json<ErrBody>(
        { ok: false, error: 'unknown', message: 'Gagal memvalidasi skill.' },
        { status: 500 },
      );
    }
    if (!data) {
      return NextResponse.json<ErrBody>(
        { ok: false, error: 'invalid-skill', message: 'Skill tidak dikenal.' },
        { status: 400 },
      );
    }
    skillName = (data as { name: string }).name;
  }

  // Insert (or no-op on duplicate). Migration 009 added a UNIQUE index on
  // (lower(email), skill_id) so a second submit collapses silently.
  let alreadySubscribed = false;
  const { error: insertErr } = await sb
    .from('subscribers')
    .insert({
      email: rawEmail,
      skill_id: skillId,
      skill_name: skillName,
    });

  if (insertErr) {
    if (insertErr.code === '23505') {
      alreadySubscribed = true;
    } else {
      // eslint-disable-next-line no-console
      console.warn('[api/subscribe] insert failed:', insertErr);
      return NextResponse.json<ErrBody>(
        { ok: false, error: 'unknown', message: 'Gagal menyimpan. Coba lagi nanti.' },
        { status: 500 },
      );
    }
  }

  // Fire welcome email. We never block success on email — if Resend is
  // misconfigured the row is still saved. Log a warning when it fails so
  // ops can spot it.
  let emailSent = false;
  const emailResult = await sendWelcomeEmail(rawEmail, skillName);
  if (emailResult.sent) {
    emailSent = true;
  } else if (!emailResult.skipped) {
    // eslint-disable-next-line no-console
    console.warn('[api/subscribe] welcome email failed:', emailResult.error);
  }

  return NextResponse.json<OkBody>(
    { ok: true, alreadySubscribed, emailSent },
    { status: 200 },
  );
}