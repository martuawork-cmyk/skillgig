// GET /api/skills/search?term=<text>
//
// Autocomplete for the Roadmap explorer search box.
//
// Response 200: { ok: true, hits: RoadmapSkillHit[] }
// Response 503 : { ok: false, error: 'network' }      Supabase not configured
// Response 400 : { ok: false, error: 'invalid-term' } term too short
//
// `term` must be at least 1 non-whitespace character. We deliberately don't
// enforce an upper bound — Supabase ILIKE handles it gracefully and the
// query has LIMIT 5 baked in, so even pathological inputs stay bounded.
//
// `safeQuery` already returns [] when env vars are missing, so we still
// respond with a 200 + empty hits there. That keeps the dropdown UX calm
// ("no matches") instead of showing a banner every time the page loads.

import { NextResponse } from 'next/server';
import { searchSkills } from '@/lib/supabase/queries';
import { isSupabaseConfigured } from '@/components/feedback/ErrorState';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_TERM_LEN = 80;

type OkBody = {
  ok: true;
  hits: Awaited<ReturnType<typeof searchSkills>>;
};

type ErrBody = {
  ok: false;
  error: 'invalid-term' | 'network';
  message?: string;
};

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const term = (url.searchParams.get('term') ?? '').slice(0, MAX_TERM_LEN);

  if (term.trim().length === 0) {
    return NextResponse.json<ErrBody>(
      { ok: false, error: 'invalid-term', message: 'Term tidak boleh kosong.' },
      { status: 400 },
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json<ErrBody>(
      { ok: false, error: 'network', message: 'Belum terkoneksi ke Supabase.' },
      { status: 503 },
    );
  }

  const hits = await searchSkills(term);
  return NextResponse.json<OkBody>({ ok: true, hits });
}