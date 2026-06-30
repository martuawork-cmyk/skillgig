// GET /api/roadmap/[skillId]
//
// Loads the real roadmap payload for a skill chosen from the autocomplete:
//   - skill metadata (name, category, icon)
//   - top 3 courses in the same category, ordered by students DESC
//   - top 3 published gigs in the same category, ordered by budget_max DESC
//   - average budget_min / budget_max estimate across those gigs
//
// Response 200: { ok: true, skill, courses, gigs, estimate }
// Response 404 : { ok: false, error: 'not-found' }       unknown skillId
// Response 400 : { ok: false, error: 'invalid-id'  }     bad UUID
// Response 503 : { ok: false, error: 'network'     }     Supabase offline
//
// We fan out the three "enrichment" queries in parallel so the API stays
// fast even when the categories are cold. Each child query already falls
// back to [] / null inside `safeQuery`, so a transient hiccup degrades to
// "no data" rather than 500.

import { NextResponse } from 'next/server';
import {
  getSkill,
  getCoursesByCategory,
  getPublishedGigsByCategory,
  getCategoryBudgetEstimate,
} from '@/lib/supabase/queries';
import { isSupabaseConfigured } from '@/components/feedback/ErrorState';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type OkBody = {
  ok: true;
  skill: NonNullable<Awaited<ReturnType<typeof getSkill>>>;
  courses: Awaited<ReturnType<typeof getCoursesByCategory>>;
  gigs: Awaited<ReturnType<typeof getPublishedGigsByCategory>>;
  estimate: Awaited<ReturnType<typeof getCategoryBudgetEstimate>>;
};

type ErrBody = {
  ok: false;
  error: 'invalid-id' | 'not-found' | 'network';
  message?: string;
};

export async function GET(
  _req: Request,
  { params }: { params: { skillId: string } },
): Promise<Response> {
  const { skillId } = params;

  if (!UUID_RE.test(skillId)) {
    return NextResponse.json<ErrBody>(
      { ok: false, error: 'invalid-id', message: 'Format skillId tidak valid.' },
      { status: 400 },
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json<ErrBody>(
      { ok: false, error: 'network', message: 'Belum terkoneksi ke Supabase.' },
      { status: 503 },
    );
  }

  const skill = await getSkill(skillId);
  if (!skill) {
    return NextResponse.json<ErrBody>(
      { ok: false, error: 'not-found', message: 'Skill tidak ditemukan.' },
      { status: 404 },
    );
  }

  // Fire the three independent reads in parallel. If any of them throws
  // (unreachable Supabase, schema drift), `safeQuery` swallows it and the
  // matching field degrades to [] / null — the UI renders the empty state.
  const [courses, gigs, estimate] = await Promise.all([
    getCoursesByCategory(skill.category),
    getPublishedGigsByCategory(skill.category),
    getCategoryBudgetEstimate(skill.category),
  ]);

  return NextResponse.json<OkBody>({ ok: true, skill, courses, gigs, estimate });
}