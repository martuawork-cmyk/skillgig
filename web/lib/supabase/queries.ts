import 'server-only';

import { unstable_cache } from 'next/cache';

import { createClient, createPublicClient } from './server';
import { isSupabaseConfigured as _isConfigured } from '@/components/feedback/ErrorState';
import {
  mapCourseRow,
  mapGigRow,
  mapSkillRow,
  mapUserRow,
  mapApplicationRow,
  asGigCategory,
  asSkillLevel,
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

/**
 * P4-A perf: wrap a public, auth-free catalog read in Next's data cache so the
 * Supabase round-trip is skipped for up to 1h. The whole app renders
 * dynamically (the root layout reads the session cookie to render the header's
 * auth state), so route-level `revalidate` / ISR can't apply here — caching at
 * the data layer with `unstable_cache` is the correct lever for p95.
 *
 * Admin mutations bust these entries immediately via `revalidateTag(...)` in
 * the server actions (see app/(admin)/.../actions.ts). Keep this helper for
 * auth-free catalog reads ONLY — anything that depends on the signed-in user
 * must stay uncached.
 *
 * CRITICAL: the wrapped function MUST talk to Supabase via `createPublicClient()`
 * (cookie-free), never `createClient()`. `createClient()` calls `cookies()`,
 * which is a dynamic data source and throws "Accessing Dynamic data sources
 * inside a cache scope is not supported" when invoked from inside
 * `unstable_cache` — the query then silently fails and returns its fallback.
 */
function cached<Args extends unknown[], R>(
  fn: (...args: Args) => Promise<R>,
  keyParts: string[],
  tags: string[],
) {
  return unstable_cache(fn, keyParts, { revalidate: 3600, tags });
}

export const getCourses = cached(
  async (): Promise<Course[]> =>
    safeQuery('getCourses', async () => {
      const sb = createPublicClient();
      const { data, error } = await sb
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapCourseRow);
    }, []),
  ['getCourses'],
  ['courses'],
);

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

export const getGigs = cached(
  async (jobType?: string): Promise<Gig[]> =>
    safeQuery('getGigs', async () => {
      const sb = createPublicClient();
      let query = sb.from('gigs').select('*');
      // Optional "Tipe Kerja" filter — applied server-side so the shareable
      // ?job_type= URL reflects the actual result set. unstable_cache keys on
      // the fn args, so each jobType value is cached independently.
      if (jobType) query = query.eq('job_type', jobType);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapGigRow);
    }, []),
  ['getGigs'],
  ['gigs'],
);

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
  // P3-B: skills now come from the signed-in user's bag in `user_skills`
  // (joined with the public `skills` catalog). Returns [] when the visitor
  // is anonymous or the DB isn't seeded yet — the page renders an EmptyState
  // in that case.
  return safeQuery('getUserSkills', async () => {
    const sb = await createClient();
    const { data: auth } = await sb.auth.getUser();
    if (!auth?.user) return [];

    const { data, error } = await sb
      .from('user_skills')
      .select('id, level, created_at, skill:skills(id, name, category, icon, recommended)')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;

    type Row = {
      id: string;
      level: string;
      created_at: string;
      skill: SkillRow | SkillRow[] | null;
    };
    const rows = (data ?? []) as Row[];
    return rows
      .map((r) => {
        const s = Array.isArray(r.skill) ? r.skill[0] : r.skill;
        if (!s) return null;
        return {
          ...mapSkillRow(s),
          level: asSkillLevel(r.level),
          // Bag rows start at 0 — progress is filled in by the per-skill
          // aggregator on the page. Keeping it 0 here means SkillProgressBar
          // renders cleanly when the aggregate isn't supplied yet.
          progress: 0,
        } as Skill;
      })
      .filter((s): s is Skill => s !== null);
  }, []);
}

export const getRecommendedSkills = cached(
  async (): Promise<Skill[]> =>
    safeQuery('getRecommendedSkills', async () => {
      const sb = createPublicClient();
      const { data, error } = await sb
        .from('skills')
        .select('*')
        .eq('recommended', true)
        .order('name');
      if (error) throw error;
      return (data ?? []).map((r) => mapSkillRow({ ...(r as SkillRow), progress: 0 }));
    }, []),
  ['getRecommendedSkills'],
  ['skills'],
);

/**
 * Full skills catalog — backs the "Tambah Skill" grid on /skills.
 * Returns the lightweight (id, name, category, icon) shape so the grid
 * doesn't pull unused columns for every catalog row.
 */
export interface CatalogSkill {
  id: string;
  name: string;
  category: GigCategory;
  icon: string | null;
}

export const getAllSkills = cached(
  async (): Promise<CatalogSkill[]> =>
    safeQuery('getAllSkills', async () => {
      const sb = createPublicClient();
      const { data, error } = await sb
        .from('skills')
        .select('id, name, category, icon')
        .order('name');
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        category: asGigCategory(r.category),
        icon: r.icon,
      }));
    }, []),
  ['getAllSkills'],
  ['skills'],
);

/**
 * Per-skill progress aggregator used by the "Progress per Skill" section
 * on /skills.
 *
 * For each of the user's skills we count:
 *   - savedCourses:   how many saved courses teach this skill
 *   - appliedGigs:    how many gigs the user has applied to that require it
 *
 * The `progress` value is a 0-100 score derived from the two counts so the
 * existing SkillProgressBar renders without change:
 *   - 1 saved course = +30 (caps at 60)
 *   - 1 application  = +15 (caps at 40 — total caps at 100)
 *
 * Returns a Map keyed by skill_id so callers can do O(1) lookups without
 * re-walking the array per skill.
 */
export interface SkillProgressEntry {
  skillId: string;
  savedCourses: number;
  appliedGigs: number;
  progress: number;
}

export async function getSkillProgressForUser(
  skillIds: string[],
): Promise<Map<string, SkillProgressEntry>> {
  const out = new Map<string, SkillProgressEntry>();
  if (skillIds.length === 0) return out;

  return safeQuery('getSkillProgressForUser', async () => {
    const sb = await createClient();
    const { data: auth } = await sb.auth.getUser();
    if (!auth?.user) return out;
    const userId = auth.user.id;

    // Fetch saved courses + applications once; do the matching in JS.
    // The lists are bounded by the user's activity so this stays cheap.
    const [coursesRes, appsRes] = await Promise.all([
      sb
        .from('saved_items')
        .select('item_type, item_id')
        .eq('user_id', userId)
        .eq('item_type', 'course'),
      sb
        .from('applications')
        .select('gig_id, gigs(skills)')
        .or(`user_id.eq.${userId},freelancer_id.eq.${userId}`),
    ]);
    if (coursesRes.error) throw coursesRes.error;
    if (appsRes.error) throw appsRes.error;

    const skillSet = new Set(skillIds);
    const courseIds = (coursesRes.data ?? [])
      .map((r) => r.item_id)
      .filter(Boolean);

    // Look up the skills[] array for each saved course so we can match by name
    // (skills.id is a uuid; courses.skills stores names).
    let courseNameById = new Map<string, string[]>();
    if (courseIds.length > 0) {
      const { data: courseRows, error: coursesErr } = await sb
        .from('courses')
        .select('id, skills')
        .in('id', courseIds);
      if (coursesErr) throw coursesErr;
      courseNameById = new Map(
        (courseRows ?? []).map((c: { id: string; skills: string[] | null }) => [
          c.id,
          c.skills ?? [],
        ]),
      );
    }

    // Resolve skill name -> id once for the catalog rows we care about.
    let nameToId = new Map<string, string>();
    if (skillIds.length > 0) {
      const { data: skillRows, error: skillsErr } = await sb
        .from('skills')
        .select('id, name')
        .in('id', skillIds);
      if (skillsErr) throw skillsErr;
      nameToId = new Map(
        (skillRows ?? []).map((s: { id: string; name: string }) => [s.name, s.id]),
      );
    }

    const tally = (skillId: string): SkillProgressEntry => {
      const existing = out.get(skillId);
      if (existing) return existing;
      const fresh: SkillProgressEntry = {
        skillId,
        savedCourses: 0,
        appliedGigs: 0,
        progress: 0,
      };
      out.set(skillId, fresh);
      return fresh;
    };

    // Saved courses: match by course.skills[] (name) → skillId via the
    // nameToId resolver. Names are case-sensitive on purpose — the catalog
    // and the seeded courses use the same casing.
    Array.from(courseNameById.entries()).forEach(([, names]) => {
      names.forEach((n) => {
        const id = nameToId.get(n);
        if (id && skillSet.has(id)) {
          const e = tally(id);
          e.savedCourses += 1;
        }
      });
    });

    // Gig applications: gigs.skills[] holds skill names; same matcher.
    type AppRow = {
      gig_id: string;
      gigs: { skills: string[] | null } | { skills: string[] | null }[] | null;
    };
    const appRows = (appsRes.data ?? []) as AppRow[];
    for (const row of appRows) {
      const gig = Array.isArray(row.gigs) ? row.gigs[0] : row.gigs;
      const names = gig?.skills ?? [];
      for (const n of names) {
        const id = nameToId.get(n);
        if (id && skillSet.has(id)) {
          const e = tally(id);
          e.appliedGigs += 1;
        }
      }
    }

    // Convert raw counts to a 0–100 progress score. Caps:
    //   courses:  +30 each, max +60  (2 saved courses saturates this axis)
    //   applies:  +15 each, max +40  (~3 applications saturates this axis)
    Array.from(out.values()).forEach((e) => {
      e.progress = Math.min(
        100,
        Math.min(60, e.savedCourses * 30) + Math.min(40, e.appliedGigs * 15),
      );
    });
    return out;
  }, out);
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

export const getSkillsForNewsletter = cached(
  async (): Promise<NewsletterSkillOption[]> =>
    safeQuery('getSkillsForNewsletter', async () => {
      const sb = createPublicClient();
      const { data, error } = await sb
        .from('skills')
        .select('id, name, icon')
        .order('name');
      if (error) throw error;
      return (data ?? []) as NewsletterSkillOption[];
    }, []),
  ['getSkillsForNewsletter'],
  ['skills'],
);

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
export const getCoursesByCategory = cached(
  async (category: GigCategory): Promise<Course[]> => {
    const courseCategory = mapGigToCourseCategory(category);
    return safeQuery('getCoursesByCategory', async () => {
      const sb = createPublicClient();
      const { data, error } = await sb
        .from('courses')
        .select('*')
        .eq('category', courseCategory)
        .order('students', { ascending: false })
        .limit(3);
      if (error) throw error;
      return (data ?? []).map(mapCourseRow);
    }, []);
  },
  ['getCoursesByCategory'],
  ['courses'],
);

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
export const getPublishedGigsByCategory = cached(
  async (category: GigCategory): Promise<Gig[]> =>
    safeQuery('getPublishedGigsByCategory', async () => {
      const sb = createPublicClient();
      const { data, error } = await sb
        .from('gigs')
        .select('*')
        .eq('category', category)
        .eq('status', 'published')
        .order('budget_max', { ascending: false })
        .limit(3);
      if (error) throw error;
      return (data ?? []).map(mapGigRow);
    }, []),
  ['getPublishedGigsByCategory'],
  ['gigs'],
);

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
    const sb = createPublicClient();
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