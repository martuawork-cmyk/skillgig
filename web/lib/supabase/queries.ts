import 'server-only';

import { createClient } from './server';
import { isSupabaseConfigured as _isConfigured } from '@/components/feedback/ErrorState';
import {
  mapCourseRow,
  mapGigRow,
  mapSkillRow,
  mapUserRow,
  mapApplicationRow,
  asGigCategory,
  type CourseRow,
  type GigRow,
  type SkillRow,
  type UserRow,
} from './mappers';
import type {
  Course,
  Gig,
  GigCategory,
  Skill,
  User,
  Application,
  CourseCategory,
} from '@/lib/types';

// Re-export so pages have a single import surface.
export const isSupabaseConfigured = _isConfigured;

/**
 * Supabase query layer for SkillGig.
 *
 * Every query goes through `safeQuery` — if the Supabase client throws (env
 * vars missing, network error, schema mismatch), we log a warning and return
 * an empty / null fallback. This lets the build pass and the UI render an
 * <ErrorState> instead of a blank page.
 *
 * To activate real data:
 *   1. Create Supabase project
 *   2. Fill .env.local with URL + anon key
 *   3. Run 001_init.sql + 002_extend.sql + 003_seed.sql in SQL editor
 *   4. Restart dev server
 */

// ============================================================================
// Public query API
// All mappers + cast helpers + safeQuery live in ./mappers.ts / ./server.ts
// (shared with admin-queries). The public lib below calls into those.
// ==========================================================================

/**
 * Wrap a Supabase query so that missing env vars or runtime errors return
 * a caller-supplied fallback instead of throwing. Mirrors the helper that
 * lived in this file before the refactor to ./mappers.
 */
async function safeQuery<T>(
  ctx: string,
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    // eslint-disable-next-line no-console
    console.warn(`[queries:${ctx}] Supabase env vars missing — returning fallback.`);
    return fallback;
  }
  try {
    return await fn();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[queries:${ctx}] failed:`, err);
    return fallback;
  }
}

export async function getCourses(): Promise<Course[]> {
  return safeQuery('getCourses', async () => {
    const sb = await createClient();
    const { data, error } = await sb
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapCourseRow);
  }, []);
}

export async function getCourse(id: string): Promise<Course | null> {
  return safeQuery('getCourse', async () => {
    const sb = await createClient();
    const { data, error } = await sb
      .from('courses')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? mapCourseRow(data as CourseRow) : null;
  }, null);
}

export async function getGigs(): Promise<Gig[]> {
  return safeQuery('getGigs', async () => {
    const sb = await createClient();
    const { data, error } = await sb
      .from('gigs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapGigRow);
  }, []);
}

export async function getGig(id: string): Promise<Gig | null> {
  return safeQuery('getGig', async () => {
    const sb = await createClient();
    const { data, error } = await sb
      .from('gigs')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? mapGigRow(data as GigRow) : null;
  }, null);
}

export async function getUser(id: string): Promise<User | null> {
  return safeQuery('getUser', async () => {
    const sb = await createClient();
    const { data, error } = await sb
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? mapUserRow(data as UserRow) : null;
  }, null);
}

export async function getUserSkills(): Promise<Skill[]> {
  // Note: skills table doesn't carry progress yet (no per-user state). All
  // skills get a baseline progress derived from a hash so the UI has variety.
  return safeQuery('getUserSkills', async () => {
    const sb = await createClient();
    const { data, error } = await sb
      .from('skills')
      .select('*')
      .eq('recommended', false)
      .order('name');
    if (error) throw error;
    const rows = (data ?? []) as SkillRow[];
    return rows.map((r, i) => ({
      ...mapSkillRow(r),
      progress: deriveProgress(r.id, i, 20, 90),
    }));
  }, []);
}

export async function getRecommendedSkills(): Promise<Skill[]> {
  return safeQuery('getRecommendedSkills', async () => {
    const sb = await createClient();
    const { data, error } = await sb
      .from('skills')
      .select('*')
      .eq('recommended', true)
      .order('name');
    if (error) throw error;
    return (data ?? []).map((r) => mapSkillRow({ ...(r as SkillRow), progress: 0 }));
  }, []);
}

/**
 * Lightweight skill list for UI controls that just need (id, name, icon)
 * — currently the newsletter subscribe dropdown. Returns the minimum shape
 * so we don't drag `category` / `recommended` along with it.
 */
export interface NewsletterSkillOption {
  id: string;
  name: string;
  icon: string | null;
}

export async function getSkillsForNewsletter(): Promise<NewsletterSkillOption[]> {
  return safeQuery('getSkillsForNewsletter', async () => {
    const sb = await createClient();
    const { data, error } = await sb
      .from('skills')
      .select('id, name, icon')
      .order('name');
    if (error) throw error;
    return (data ?? []) as NewsletterSkillOption[];
  }, []);
}

/**
 * Deterministic progress value (0–100) derived from a string seed + index.
 * Lets the skills dashboard show varied progress bars without needing a
 * per-user table. Replace with `userskills` table when progress is persisted.
 */
function deriveProgress(seed: string, idx: number, min: number, max: number): number {
  let h = idx + 1;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const range = max - min;
  return min + Math.abs(h) % range;
}

// ============================================================================
// Applications — uses shared ApplicationRow + mapApplicationRow from ./mappers
// ============================================================================

/**
 * Fetch applications for a specific freelancer.
 * In Phase 5 (no auth), pass an explicit `freelancerId`. When auth lands,
 * we'll read this from the session instead.
 */
export async function getApplicationsByFreelancer(
  freelancerId: string,
): Promise<Application[]> {
  return safeQuery('getApplicationsByFreelancer', async () => {
    const sb = await createClient();
    const { data, error } = await sb
      .from('applications')
      .select('*')
      .or(`user_id.eq.${freelancerId},freelancer_id.eq.${freelancerId}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapApplicationRow);
  }, []);
}

/**
 * Fetch the applications for the currently signed-in user. Uses the
 * authenticated session via Supabase Auth. RLS restricts to own rows
 * (see migration 006_auth.sql + 010_applications_p2b.sql).
 */
export async function getMyApplications(): Promise<Application[]> {
  return safeQuery('getMyApplications', async () => {
    const sb = await createClient();
    const { data: auth } = await sb.auth.getUser();
    if (!auth?.user) return [];
    const { data, error } = await sb
      .from('applications')
      .select('*')
      .or(`user_id.eq.${auth.user.id},freelancer_id.eq.${auth.user.id}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapApplicationRow);
  }, []);
}

/**
 * Has the current user already applied to this gig? Returns true when at
 * least one row exists. Used by ApplyForm to pre-empt the duplicate submit
 * path with a friendlier message than the unique-constraint error.
 */
export async function hasAppliedToGig(gigId: string): Promise<boolean> {
  return safeQuery('hasAppliedToGig', async () => {
    const sb = await createClient();
    const { data: auth } = await sb.auth.getUser();
    if (!auth?.user) return false;
    const { data, error } = await sb
      .from('applications')
      .select('id')
      .or(`user_id.eq.${auth.user.id},freelancer_id.eq.${auth.user.id}`)
      .eq('gig_id', gigId)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return Boolean(data);
  }, false);
}

// ============================================================================
// Roadmap (P2-C) — autocomplete + skill-scoped courses / gigs / budget
// ============================================================================

/**
 * Lightweight search hit for the autocomplete dropdown. Returns just what the
 * picker needs to render — keep it narrow so the dropdown payload stays
 * small even as the skills catalog grows.
 */
export interface RoadmapSkillHit {
  id: string;
  name: string;
  category: GigCategory;
  icon: string | null;
}

/**
 * Autocomplete query for the roadmap search input.
 *
 *   SELECT id, name, category, icon
 *   FROM skills
 *   WHERE name ILIKE '%<term>%'
 *   ORDER BY name
 *   LIMIT 5
 *
 * Empty / whitespace terms return [] — the dropdown is closed in that case,
 * so we don't need to do work. Returns at most 5 hits so the UI stays tight.
 */
export async function searchSkills(term: string): Promise<RoadmapSkillHit[]> {
  const q = term.trim();
  if (!q) return [];
  return safeQuery('searchSkills', async () => {
    const sb = await createClient();
    const { data, error } = await sb
      .from('skills')
      .select('id, name, category, icon')
      .ilike('name', `%${q}%`)
      .order('name')
      .limit(5);
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      category: asGigCategory(r.category),
      icon: r.icon,
    }));
  }, []);
}

/**
 * Top 3 published courses for a skill's category, ranked by student count.
 *
 *   SELECT * FROM courses
 *   WHERE category = <category>
 *   ORDER BY students DESC
 *   LIMIT 3
 *
 * Courses use the narrower CourseCategory enum ('design' | 'tech' | 'marketing')
 * so we map the GigCategory we got from `skills.category` into the matching
 * CourseCategory. Some GigCategories (writing, data, video, web-dev) have no
 * CourseCategory analogue — in that case we fall back to the closest match
 * via `mapGigToCourseCategory` so the query still returns useful rows.
 */
export async function getCoursesByCategory(
  category: GigCategory,
): Promise<Course[]> {
  const courseCategory = mapGigToCourseCategory(category);
  return safeQuery('getCoursesByCategory', async () => {
    const sb = await createClient();
    const { data, error } = await sb
      .from('courses')
      .select('*')
      .eq('category', courseCategory)
      .order('students', { ascending: false })
      .limit(3);
    if (error) throw error;
    return (data ?? []).map(mapCourseRow);
  }, []);
}

/**
 * Top 3 published gigs for a skill's category, ranked by max budget.
 *
 *   SELECT * FROM gigs
 *   WHERE category = <category> AND status = 'published'
 *   ORDER BY budget_max DESC
 *   LIMIT 3
 *
 * `status = 'published'` keeps draft / expired gigs off the roadmap — those
 * are admin-only artifacts (see migration 007).
 */
export async function getPublishedGigsByCategory(
  category: GigCategory,
): Promise<Gig[]> {
  return safeQuery('getPublishedGigsByCategory', async () => {
    const sb = await createClient();
    const { data, error } = await sb
      .from('gigs')
      .select('*')
      .eq('category', category)
      .eq('status', 'published')
      .order('budget_max', { ascending: false })
      .limit(3);
    if (error) throw error;
    return (data ?? []).map(mapGigRow);
  }, []);
}

/**
 * Average budget (IDR) across the published gigs in a category. Computed in
 * SQL so we don't pull every gig row across the wire just to reduce locally.
 *
 *   SELECT AVG(budget_min), AVG(budget_max)
 *   FROM gigs
 *   WHERE category = <category> AND status = 'published'
 *
 * Returns nulls when there are no rows — the UI can show "—" instead of a
 * bogus "Rp 0" estimate.
 */
export interface CategoryBudgetEstimate {
  avgBudgetMin: number | null;
  avgBudgetMax: number | null;
  sampleSize: number;
}

export async function getCategoryBudgetEstimate(
  category: GigCategory,
): Promise<CategoryBudgetEstimate> {
  return safeQuery(
    'getCategoryBudgetEstimate',
    async () => {
      const sb = await createClient();
      const { data, error } = await sb
        .from('gigs')
        .select('budget_min, budget_max')
        .eq('category', category)
        .eq('status', 'published');
      if (error) throw error;
      const rows = (data ?? []) as { budget_min: number | null; budget_max: number | null }[];
      const mins = rows
        .map((r) => r.budget_min)
        .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
      const maxs = rows
        .map((r) => r.budget_max)
        .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
      const avg = (xs: number[]) =>
        xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : null;
      return {
        avgBudgetMin: avg(mins),
        avgBudgetMax: avg(maxs),
        sampleSize: rows.length,
      };
    },
    { avgBudgetMin: null, avgBudgetMax: null, sampleSize: 0 },
  );
}

/**
 * Look up a single skill by id — used by the roadmap API route to confirm
 * the user picked a real skill before we fan out to courses / gigs.
 */
export async function getSkill(id: string): Promise<RoadmapSkillHit | null> {
  return safeQuery('getSkill', async () => {
    const sb = await createClient();
    const { data, error } = await sb
      .from('skills')
      .select('id, name, category, icon')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      id: data.id,
      name: data.name,
      category: asGigCategory(data.category),
      icon: data.icon,
    };
  }, null);
}

/**
 * Best-effort GigCategory → CourseCategory mapping. The two enums don't share
 * the same vocabulary (CourseCategory is narrower), so for skills whose
 * GigCategory has no direct CourseCategory equivalent we fall back to the
 * closest neighbour. `null` would force the courses query to fetch nothing,
 * which makes the roadmap look broken — better to show *something*.
 */
function mapGigToCourseCategory(c: GigCategory): CourseCategory {
  switch (c) {
    case 'design':    return 'design';
    case 'marketing': return 'marketing';
    case 'web-dev':   return 'tech';
    case 'data':      return 'tech';
    case 'video':     return 'design';
    case 'writing':   return 'marketing';
  }
}

// ============================================================================
// Homepage stats — real counts + average budget for the hero stat strip.
// Falls back to zeros when Supabase is not configured / unreachable so the
// landing page still renders.
// ============================================================================

export interface HomepageStats {
  totalGigs: number;
  totalUsers: number;
  /** Average `budget_max` across all gigs. null when there are no rows. */
  avgBudgetMax: number | null;
}

export async function getHomepageStats(): Promise<HomepageStats> {
  return safeQuery('getHomepageStats', async () => {
    const sb = await createClient();
    const [gigs, users, budget] = await Promise.all([
      sb.from('gigs').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      sb.from('users').select('*', { count: 'exact', head: true }),
      sb.from('gigs').select('budget_max'),
    ]);
    if (gigs.error) throw gigs.error;
    if (users.error) throw users.error;
    if (budget.error) throw budget.error;
    const rows = (budget.data ?? []) as { budget_max: number | null }[];
    const valid = rows
      .map((r) => r.budget_max)
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    const avgBudgetMax = valid.length
      ? valid.reduce((sum, v) => sum + v, 0) / valid.length
      : null;
    return {
      totalGigs: gigs.count ?? 0,
      totalUsers: users.count ?? 0,
      avgBudgetMax,
    };
  }, { totalGigs: 0, totalUsers: 0, avgBudgetMax: null });
}