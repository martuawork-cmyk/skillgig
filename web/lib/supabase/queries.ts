import 'server-only';

import { createClient } from './server';
import { isSupabaseConfigured as _isConfigured } from '@/components/feedback/ErrorState';
import type {
  Course,
  CoursePlatform,
  CourseCategory,
  Gig,
  GigCategory,
  Skill,
  SkillLevel,
  User,
  GigPlatform,
  Application,
  ApplicationStatus,
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
// Type guards & casts
// ============================================================================

const COURSE_PLATFORMS: ReadonlySet<string> = new Set([
  'Udemy',
  'Coursera',
  'Dicoding',
  'YouTube',
]);
const COURSE_CATEGORIES: ReadonlySet<string> = new Set(['design', 'tech', 'marketing']);
const GIG_CATEGORIES: ReadonlySet<string> = new Set([
  'web-dev',
  'design',
  'writing',
  'marketing',
  'data',
  'video',
]);
const GIG_PLATFORMS: ReadonlySet<string> = new Set([
  'Upwork',
  'Fiverr',
  'Projects.co.id',
  'Sribulancer',
]);
const SKILL_LEVELS: ReadonlySet<string> = new Set([
  'beginner',
  'intermediate',
  'advanced',
]);

function asCoursePlatform(s: string): CoursePlatform {
  return (COURSE_PLATFORMS.has(s) ? s : 'YouTube') as CoursePlatform;
}
function asCourseCategory(s: string): CourseCategory {
  return (COURSE_CATEGORIES.has(s) ? s : 'tech') as CourseCategory;
}
function asGigCategory(s: string): GigCategory {
  return (GIG_CATEGORIES.has(s) ? s : 'web-dev') as GigCategory;
}
function asGigPlatform(s: string): GigPlatform {
  return (GIG_PLATFORMS.has(s) ? s : 'Upwork') as GigPlatform;
}
function asSkillLevel(s: string): SkillLevel {
  return (SKILL_LEVELS.has(s) ? s : 'beginner') as SkillLevel;
}

// ============================================================================
// Safe query wrapper
// ============================================================================

async function safeQuery<T>(
  ctx: string,
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn(
      `[queries:${ctx}] Supabase env vars missing — returning fallback.`,
    );
    return fallback;
  }
  try {
    return await fn();
  } catch (err) {
    console.warn(`[queries:${ctx}] failed:`, err);
    return fallback;
  }
}

// ============================================================================
// Row types (subset of Supabase generated types)
// ============================================================================

type CourseRow = {
  id: string;
  title: string;
  platform: string;
  category: string;
  price: number;
  url: string;
  thumbnail: string | null;
  rating: number;
  students: number;
  skills: string[] | null;
  level: string;
  duration_hours: number;
  enrolled: boolean;
  created_at: string;
};

type GigRow = {
  id: string;
  title: string;
  platform: string;
  category: string;
  budget_min: number;
  budget_max: number;
  url: string;
  level: string;
  description: string;
  skills: string[] | null;
  duration_weeks: number;
  applicants_count: number;
  created_at: string;
};

type SkillRow = {
  id: string;
  name: string;
  category: string;
  icon: string | null;
  progress?: number;
  recommended: boolean;
};

type UserRow = {
  id: string;
  name: string;
  initials: string;
  role: string;
  rating: number;
  completed_gigs: number;
  bio: string;
  skills: string[] | null;
  location: string;
  avatar_url: string | null;
};

// ============================================================================
// Row → domain mappers
// ============================================================================

function mapCourseRow(r: CourseRow): Course {
  return {
    id: r.id,
    title: r.title,
    titleId: r.title,
    platform: asCoursePlatform(r.platform),
    category: asCourseCategory(r.category),
    price: r.price,
    url: r.url,
    thumbnail: r.thumbnail ?? '📘',
    students: r.students,
    skillsTaught: r.skills ?? [],
    level: asSkillLevel(r.level),
    durationHours: r.duration_hours,
    enrolled: r.enrolled,
    createdAt: r.created_at,
  };
}

function mapGigRow(r: GigRow): Gig {
  return {
    id: r.id,
    title: r.title,
    titleId: r.title,
    description: '',
    descriptionId: r.description,
    category: asGigCategory(r.category),
    budgetMin: r.budget_min,
    budgetMax: r.budget_max,
    durationWeeks: r.duration_weeks,
    level: asSkillLevel(r.level),
    skillsRequired: r.skills ?? [],
    clientId: '',
    applicantsCount: r.applicants_count,
    postedAt: r.created_at,
    platform: asGigPlatform(r.platform),
    url: r.url,
  };
}

function mapSkillRow(r: SkillRow): Skill {
  return {
    id: r.id,
    name: r.name,
    category: asGigCategory(r.category),
    level: 'beginner',
    progress: r.progress ?? 0,
  };
}

function mapUserRow(r: UserRow): User {
  return {
    id: r.id,
    name: r.name,
    initials: r.initials,
    role: r.role === 'client' ? 'client' : 'freelancer',
    rating: r.rating,
    completedGigs: r.completed_gigs,
    bio: r.bio,
    skills: r.skills ?? [],
    location: r.location,
  };
}

// ============================================================================
// Public query API
// ============================================================================

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
// Applications
// ============================================================================

type ApplicationRow = {
  id: string;
  gig_id: string;
  freelancer_id: string;
  proposed_rate: number;
  proposed_duration_weeks: number;
  cover_letter: string;
  status: string;
  applied_at: string;
};

const APPLICATION_STATUSES: ReadonlySet<string> = new Set([
  'pending',
  'accepted',
  'rejected',
]);

function mapApplicationRow(r: ApplicationRow): Application {
  return {
    id: r.id,
    gigId: r.gig_id,
    freelancerId: r.freelancer_id,
    proposedRate: r.proposed_rate,
    proposedDurationWeeks: r.proposed_duration_weeks,
    coverLetter: r.cover_letter,
    status: (APPLICATION_STATUSES.has(r.status) ? r.status : 'pending') as ApplicationStatus,
    appliedAt: r.applied_at,
  };
}

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
      .eq('freelancer_id', freelancerId)
      .order('applied_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapApplicationRow);
  }, []);
}

/**
 * Fetch the applications for the currently signed-in user. Uses the
 * authenticated session via Supabase Auth. RLS restricts to own rows
 * (see migration 006_auth.sql).
 */
export async function getMyApplications(): Promise<Application[]> {
  return safeQuery('getMyApplications', async () => {
    const sb = await createClient();
    const { data: auth } = await sb.auth.getUser();
    if (!auth?.user) return [];
    const { data, error } = await sb
      .from('applications')
      .select('*')
      .eq('freelancer_id', auth.user.id)
      .order('applied_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapApplicationRow);
  }, []);
}