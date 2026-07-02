import 'server-only';

import { createAdminClient } from './admin';
import {
  mapCourseRow,
  mapGigRow,
  mapSkillRow,
  mapUserRow,
  mapApplicationRow,
  mapSubscriberRow,
  type CourseRow,
  type GigRow,
  type SkillRow,
  type UserRow,
  type ApplicationRow,
  type SubscriberRow,
  type Subscriber,
} from './mappers';
import type {
  Course,
  CourseCategory,
  CoursePlatform,
  Gig,
  GigCategory,
  GigPlatform,
  GigStatus,
  Skill,
  SkillLevel,
  User,
  Application,
} from '@/lib/types';
import { notifyJobApproved } from '@/lib/telegram';
import { tagsFromGig } from '@/lib/tagging';

/* =============================================================================
 * Input shapes for create/update
 *
 * These mirror the columns on gigs / courses that the admin UI edits. Keep the
 * surface narrow — never expose raw `unknown` from a server action.
 * ========================================================================== */

export type GigInput = {
  title: string;
  platform: GigPlatform;
  category: GigCategory;
  budgetMin: number;
  budgetMax: number;
  url: string;
  level: SkillLevel;
  description?: string;
  skills?: string[];
  durationWeeks?: number;
  applicantsCount?: number;
  status?: GigStatus;
};

export type CourseInput = {
  title: string;
  platform: CoursePlatform;
  category: CourseCategory;
  price: number;
  url: string;
  thumbnail?: string | null;
  rating?: number;
  students?: number;
  skills?: string[];
  level?: SkillLevel;
  durationHours?: number;
  enrolled?: boolean;
  featured?: boolean;
  /**
   * Outbound monetised URL. Optional. Stored as-is (the form validates
   * `type=url`); pass null/undefined to leave the column untouched on
   * update, or an empty string to clear it.
   */
  affiliateUrl?: string | null;
};

/* =============================================================================
 * courses
 * ========================================================================== */

export async function adminListCourses(): Promise<Course[]> {
  const sb = createAdminClient();
  // Two queries, not an embedded table→view join. Click counts are an
  // analytics add-on: a PostgREST relationship-resolution quirk against the
  // `affiliate_click_counts` view would otherwise throw here and take the
  // whole courses CRUD down with it. A plain SELECT off a view is rock
  // solid, so we read it directly (service role bypasses RLS) and merge the
  // counts onto the mapped rows in JS.
  const [coursesRes, counts] = await Promise.all([
    sb.from('courses').select('*').order('created_at', { ascending: false }),
    fetchAffiliateClickCounts(sb),
  ]);
  if (coursesRes.error) throw coursesRes.error;
  return (coursesRes.data ?? []).map((r) => {
    const course = mapCourseRow(r as unknown as CourseRow);
    return counts.has(course.id)
      ? { ...course, affiliateClicks: counts.get(course.id)! }
      : course;
  });
}

/**
 * Best-effort per-course affiliate click counts read straight off the
 * `affiliate_click_counts` view. Returns an empty Map on any error (view not
 * migrated yet, schema drift, RLS surprise) so the admin listing degrades to
 * "0 clicks everywhere" instead of throwing — analytics must never block CRUD.
 */
async function fetchAffiliateClickCounts(
  sb: ReturnType<typeof createAdminClient>,
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const { data, error } = await sb
    .from('affiliate_click_counts')
    .select('course_id, clicks');
  if (error || !data) return out;
  for (const row of data as { course_id: string; clicks: number | string }[]) {
    out.set(row.course_id, Number(row.clicks) || 0);
  }
  return out;
}

/**
 * Newest N courses by created_at — used on the dashboard "Kursus Terbaru"
 * preview. Deliberately a plain SELECT off the table (no affiliate-click
 * merge): the dashboard only needs title/platform/date for a 5-row preview,
 * and analytics must never gate a read here.
 */
export async function adminLatestCourses(limit: number): Promise<Course[]> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => mapCourseRow(r as unknown as CourseRow));
}

export async function adminCreateCourse(input: CourseInput): Promise<Course> {
  const sb = createAdminClient();
  const row = {
    title: input.title,
    platform: input.platform,
    category: input.category,
    price: input.price,
    url: input.url,
    thumbnail: input.thumbnail ?? null,
    rating: input.rating ?? 0,
    students: input.students ?? 0,
    skills: input.skills ?? [],
    level: input.level ?? 'beginner',
    duration_hours: input.durationHours ?? 0,
    enrolled: input.enrolled ?? false,
    featured: input.featured ?? false,
    affiliate_url: normaliseAffiliateUrl(input.affiliateUrl),
  };
  const { data, error } = await sb
    .from('courses')
    .insert(row)
    .select('*')
    .single();
  if (error) throw error;
  return mapCourseRow(data as unknown as CourseRow);
}

export async function adminUpdateCourse(id: string, input: Partial<CourseInput>): Promise<Course> {
  const sb = createAdminClient();
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.platform !== undefined) patch.platform = input.platform;
  if (input.category !== undefined) patch.category = input.category;
  if (input.price !== undefined) patch.price = input.price;
  if (input.url !== undefined) patch.url = input.url;
  if (input.thumbnail !== undefined) patch.thumbnail = input.thumbnail;
  if (input.rating !== undefined) patch.rating = input.rating;
  if (input.students !== undefined) patch.students = input.students;
  if (input.skills !== undefined) patch.skills = input.skills;
  if (input.level !== undefined) patch.level = input.level;
  if (input.durationHours !== undefined) patch.duration_hours = input.durationHours;
  if (input.enrolled !== undefined) patch.enrolled = input.enrolled;
  if (input.featured !== undefined) patch.featured = input.featured;
  if (input.affiliateUrl !== undefined) {
    // Empty string → admin wants to clear the link. Anything else goes
    // through `normaliseAffiliateUrl` so the URL gets trimmed to "" if
    // it's blank, or left untouched when valid.
    patch.affiliate_url = input.affiliateUrl === '' ? null : normaliseAffiliateUrl(input.affiliateUrl);
  }
  const { data, error } = await sb
    .from('courses')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return mapCourseRow(data as unknown as CourseRow);
}

/**
 * Trim + null-coerce an optional URL field from an admin form. Returns
 * null when the value is empty/whitespace, otherwise a trimmed string.
 * Keeps the create / update paths symmetric.
 */
function normaliseAffiliateUrl(v: string | null | undefined): string | null {
  if (v == null) return null;
  const trimmed = v.trim();
  return trimmed === '' ? null : trimmed;
}

export async function adminToggleCourseFeatured(id: string, featured: boolean): Promise<void> {
  const sb = createAdminClient();
  const { error } = await sb.from('courses').update({ featured }).eq('id', id);
  if (error) throw error;
}

export async function adminDeleteCourse(id: string): Promise<void> {
  const sb = createAdminClient();
  const { error } = await sb.from('courses').delete().eq('id', id);
  if (error) throw error;
}

/* =============================================================================
 * gigs
 * ========================================================================== */

export async function adminListGigs(): Promise<Gig[]> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from('gigs')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => mapGigRow(r as GigRow));
}

export async function adminLatestGigs(limit: number): Promise<Gig[]> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from('gigs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => mapGigRow(r as GigRow));
}

export async function adminCountPublishedGigs(): Promise<number> {
  const sb = createAdminClient();
  const { count, error } = await sb
    .from('gigs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published');
  if (error) throw error;
  return count ?? 0;
}

export async function adminCreateGig(input: GigInput): Promise<Gig> {
  const sb = createAdminClient();
  const row = {
    title: input.title,
    platform: input.platform,
    category: input.category,
    budget_min: input.budgetMin,
    budget_max: input.budgetMax,
    url: input.url,
    level: input.level,
    description: input.description ?? '',
    skills: input.skills ?? [],
    duration_weeks: input.durationWeeks ?? 4,
    applicants_count: input.applicantsCount ?? 0,
    status: input.status ?? 'draft',
  };
  const { data, error } = await sb.from('gigs').insert(row).select('*').single();
  if (error) throw error;
  return mapGigRow(data as GigRow);
}

export async function adminUpdateGig(id: string, input: Partial<GigInput>): Promise<Gig> {
  const sb = createAdminClient();
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.platform !== undefined) patch.platform = input.platform;
  if (input.category !== undefined) patch.category = input.category;
  if (input.budgetMin !== undefined) patch.budget_min = input.budgetMin;
  if (input.budgetMax !== undefined) patch.budget_max = input.budgetMax;
  if (input.url !== undefined) patch.url = input.url;
  if (input.level !== undefined) patch.level = input.level;
  if (input.description !== undefined) patch.description = input.description;
  if (input.skills !== undefined) patch.skills = input.skills;
  if (input.durationWeeks !== undefined) patch.duration_weeks = input.durationWeeks;
  if (input.applicantsCount !== undefined) patch.applicants_count = input.applicantsCount;
  if (input.status !== undefined) patch.status = input.status;
  const { data, error } = await sb
    .from('gigs')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return mapGigRow(data as GigRow);
}

export async function adminSetGigStatus(id: string, status: GigStatus): Promise<void> {
  const sb = createAdminClient();
  const { error } = await sb.from('gigs').update({ status }).eq('id', id);
  if (error) throw error;
  // When a listing goes live, ping the Telegram moderation channel. Best-effort
  // and fire-and-forget: a notification failure must never roll back the status
  // update above. No-op when Telegram env vars aren't configured.
  if (status === 'published') {
    void notifyGigApproved(sb, id).catch(() => {
      /* swallow — see note above */
    });
  }
}

/**
 * Approve a gig — the canonical "Publish" moderation action. Moves a draft /
 * expired listing to `published` so it appears on the public boards, and fires
 * the Telegram approval notification via `adminSetGigStatus`. Thin named
 * wrapper so the moderation intent ("Approve") reads explicitly at the call
 * site instead of a bare status string.
 */
export async function adminApproveGig(id: string): Promise<void> {
  await adminSetGigStatus(id, 'published');
}

/**
 * Fetch the just-updated gig and push a Telegram approval notification for it.
 * Internal to adminSetGigStatus — not exported. Reuses the caller's admin
 * client to avoid a second service-role instantiation.
 */
async function notifyGigApproved(
  sb: ReturnType<typeof createAdminClient>,
  id: string,
): Promise<void> {
  const { data, error } = await sb
    .from('gigs')
    .select(
      'id, title, company, company_logo, platform, category, job_type, budget_min, budget_max, salary_currency, location, is_remote, url, level, description, skills, duration_weeks, applicants_count, created_at, status, source_url, source_id',
    )
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return;
  const gig = mapGigRow(data as GigRow);
  await notifyJobApproved({
    id: gig.id,
    title: gig.title,
    company: gig.company,
    url: gig.url,
    category: gig.category,
    location: gig.location,
    jobType: gig.jobType,
    salaryMin: gig.salaryMin,
    salaryMax: gig.salaryMax,
    salaryCurrency: gig.salaryCurrency,
    tags: tagsFromGig(gig),
  });
}

export async function adminDeleteGig(id: string): Promise<void> {
  const sb = createAdminClient();
  const { error } = await sb.from('gigs').delete().eq('id', id);
  if (error) throw error;
}

/* =============================================================================
 * skills
 * ========================================================================== */
export async function adminListSkills(): Promise<Skill[]> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from('skills')
    .select('*')
    .order('name');
  if (error) throw error;
  return (data ?? []).map((r) => mapSkillRow(r as SkillRow));
}

export async function adminDeleteSkill(id: string): Promise<void> {
  const sb = createAdminClient();
  const { error } = await sb.from('skills').delete().eq('id', id);
  if (error) throw error;
}

/* ----- users ----- */
export async function adminListUsers(): Promise<User[]> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from('users')
    .select('*')
    .order('name');
  if (error) throw error;
  return (data ?? []).map((r) => mapUserRow(r as UserRow));
}

export async function adminDeleteUser(id: string): Promise<void> {
  const sb = createAdminClient();
  const { error } = await sb.from('users').delete().eq('id', id);
  if (error) throw error;
}

/* ----- applications ----- */
export async function adminListApplications(): Promise<Application[]> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => mapApplicationRow(r as ApplicationRow));
}

/**
 * Applicants for a single gig — joined to the user profile so the admin UI
 * can show name/initials without a second round-trip.
 */
export type ApplicantWithUser = Application & {
  userName: string;
  userInitials: string;
};

export async function adminListApplicantsForGig(gigId: string): Promise<ApplicantWithUser[]> {
  const sb = createAdminClient();
  // Try the post-migration FK first; fall back to the legacy freelancer_id FK
  // for databases that haven't run migration 010 yet.
  const selects = [
    'id, gig_id, user_id, freelancer_id, cover_letter, status, created_at, applied_at, users:users!applications_user_id_fkey ( name, initials )',
    'id, gig_id, user_id, freelancer_id, cover_letter, status, created_at, applied_at, users:users!applications_freelancer_id_fkey ( name, initials )',
    'id, gig_id, user_id, freelancer_id, cover_letter, status, created_at, applied_at, users ( name, initials )',
  ];
  let lastErr: unknown = null;
  for (const select of selects) {
    const { data, error } = await sb
      .from('applications')
      .select(select)
      .eq('gig_id', gigId)
      .order('created_at', { ascending: false });
    if (!error) {
      type Row = ApplicationRow & {
        users: { name: string; initials: string } | null;
      };
      return ((data ?? []) as unknown as Row[]).map((r) => {
        const app = mapApplicationRow(r);
        return {
          ...app,
          userName: r.users?.name ?? '—',
          userInitials: r.users?.initials ?? '??',
        };
      });
    }
    lastErr = error;
  }
  throw lastErr ?? new Error('adminListApplicantsForGig: all join attempts failed');
}

/**
 * Applicants grouped by gig — used on /admin/gigs to render the expandable
 * "Pelamar" section in each table row.
 */
export async function adminListApplicantsGrouped(): Promise<Record<string, ApplicantWithUser[]>> {
  const sb = createAdminClient();
  const selects = [
    'id, gig_id, user_id, freelancer_id, cover_letter, status, created_at, applied_at, users:users!applications_user_id_fkey ( name, initials )',
    'id, gig_id, user_id, freelancer_id, cover_letter, status, created_at, applied_at, users:users!applications_freelancer_id_fkey ( name, initials )',
    'id, gig_id, user_id, freelancer_id, cover_letter, status, created_at, applied_at, users ( name, initials )',
  ];
  let lastErr: unknown = null;
  for (const select of selects) {
    const { data, error } = await sb
      .from('applications')
      .select(select)
      .order('created_at', { ascending: false });
    if (!error) {
      type Row = ApplicationRow & {
        users: { name: string; initials: string } | null;
      };
      const out: Record<string, ApplicantWithUser[]> = {};
      for (const row of (data ?? []) as unknown as Row[]) {
        const app = mapApplicationRow(row);
        const entry: ApplicantWithUser = {
          ...app,
          userName: row.users?.name ?? '—',
          userInitials: row.users?.initials ?? '??',
        };
        (out[app.gigId] ??= []).push(entry);
      }
      return out;
    }
    lastErr = error;
  }
  throw lastErr ?? new Error('adminListApplicantsGrouped: all join attempts failed');
}

export async function adminUpdateApplicationStatus(
  id: string,
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected',
): Promise<void> {
  const sb = createAdminClient();
  const { error } = await sb.from('applications').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function adminDeleteApplication(id: string): Promise<void> {
  const sb = createAdminClient();
  const { error } = await sb.from('applications').delete().eq('id', id);
  if (error) throw error;
}

/* ----- subscribers ----- */
export async function adminListSubscribers(): Promise<Subscriber[]> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from('subscribers')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => mapSubscriberRow(r as SubscriberRow));
}

/**
 * Subscribers joined to their skill name (NULL when the opt-in was the bare
 * newsletter form without a specific skill). Returned in subscription order.
 */
export type SubscriberWithSkill = Subscriber & {
  /** Skill display name; null for newsletter-only opt-ins. */
  skillName: string | null;
  skillCategory: string | null;
};

export async function adminListSubscribersWithSkill(): Promise<SubscriberWithSkill[]> {
  const sb = createAdminClient();
  // Supabase infers the FK subscribers.skill_id -> skills.id from the schema,
  // so we can join via the embedded select syntax.
  const { data, error } = await sb
    .from('subscribers')
    .select('id, email, skill_id, created_at, skills(name, category)')
    .order('created_at', { ascending: false });
  if (error) throw error;

  type Row = {
    id: string;
    email: string;
    skill_id: string | null;
    created_at: string;
    skills: { name: string; category: string } | null;
  };

  return ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    email: r.email,
    skillId: r.skill_id,
    createdAt: r.created_at,
    skillName: r.skills?.name ?? null,
    skillCategory: r.skills?.category ?? null,
  }));
}

/**
 * Newest N subscribers joined to their skill name — drives the dashboard
 * "Subscriber Terbaru" preview (Email | Skill | Tanggal).
 */
export async function adminLatestSubscribers(limit: number): Promise<SubscriberWithSkill[]> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from('subscribers')
    .select('id, email, skill_id, created_at, skills(name, category)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;

  type Row = {
    id: string;
    email: string;
    skill_id: string | null;
    created_at: string;
    skills: { name: string; category: string } | null;
  };

  return ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    email: r.email,
    skillId: r.skill_id,
    createdAt: r.created_at,
    skillName: r.skills?.name ?? null,
    skillCategory: r.skills?.category ?? null,
  }));
}

export async function adminDeleteSubscriber(id: string): Promise<void> {
  const sb = createAdminClient();
  const { error } = await sb.from('subscribers').delete().eq('id', id);
  if (error) throw error;
}

/* ----- counts (for dashboard home) ----- */
export async function adminCounts(): Promise<{
  courses: number;
  gigs: number;
  skills: number;
  users: number;
  applications: number;
  subscribers: number;
}> {
  const sb = createAdminClient();
  const [c, g, s, u, a, sub] = await Promise.all([
    sb.from('courses').select('*', { count: 'exact', head: true }),
    sb.from('gigs').select('*', { count: 'exact', head: true }),
    sb.from('skills').select('*', { count: 'exact', head: true }),
    sb.from('users').select('*', { count: 'exact', head: true }),
    sb.from('applications').select('*', { count: 'exact', head: true }),
    sb.from('subscribers').select('*', { count: 'exact', head: true }),
  ]);
  return {
    courses: c.count ?? 0,
    gigs: g.count ?? 0,
    skills: s.count ?? 0,
    users: u.count ?? 0,
    applications: a.count ?? 0,
    subscribers: sub.count ?? 0,
  };
}
