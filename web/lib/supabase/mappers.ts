/**
 * SkillGig — Supabase row → domain type mappers + SQL→enum casts.
 *
 * Shared between queries.ts (anon client) and admin-queries.ts (service
 * role). Keep this file free of side effects — only pure functions.
 */

import type {
  Application,
  ApplicationStatus,
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
} from '@/lib/types';

/* ----- enum sets ----- */
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
const GIG_STATUSES: ReadonlySet<string> = new Set(['draft', 'published', 'expired']);
const SKILL_LEVELS: ReadonlySet<string> = new Set([
  'beginner',
  'intermediate',
  'advanced',
]);
const APPLICATION_STATUSES: ReadonlySet<string> = new Set([
  'pending',
  'reviewed',
  'accepted',
  'rejected',
]);

/* ----- cast helpers ----- */
export function asCoursePlatform(s: string): CoursePlatform {
  return (COURSE_PLATFORMS.has(s) ? s : 'YouTube') as CoursePlatform;
}
export function asCourseCategory(s: string): CourseCategory {
  return (COURSE_CATEGORIES.has(s) ? s : 'tech') as CourseCategory;
}
export function asGigCategory(s: string): GigCategory {
  return (GIG_CATEGORIES.has(s) ? s : 'web-dev') as GigCategory;
}
export function asGigPlatform(s: string): GigPlatform {
  return (GIG_PLATFORMS.has(s) ? s : 'Upwork') as GigPlatform;
}
/**
 * Cast a SQL gig.status string into the GigStatus union. Defaults to
 * 'published' — preserves the pre-migration-007 behaviour where every gig
 * was implicitly live.
 */
export function asGigStatus(s: string | null | undefined): GigStatus {
  if (s && (GIG_STATUSES as ReadonlySet<string>).has(s)) {
    return s as GigStatus;
  }
  return 'published';
}
export function asSkillLevel(s: string): SkillLevel {
  return (SKILL_LEVELS.has(s) ? s : 'beginner') as SkillLevel;
}
export function asApplicationStatus(s: string): ApplicationStatus {
  return (APPLICATION_STATUSES.has(s) ? s : 'pending') as ApplicationStatus;
}

/* ----- row types ----- */
export type CourseRow = {
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
  featured: boolean;
  affiliate_url: string | null;
};

export type GigRow = {
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
  status: string;
};

export type SkillRow = {
  id: string;
  name: string;
  category: string;
  icon: string | null;
  progress?: number;
  recommended: boolean;
};

export type UserRow = {
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

export type ApplicationRow = {
  id: string;
  gig_id: string;
  /** legacy alias kept for backwards compatibility — new code uses user_id */
  freelancer_id?: string;
  /** canonical user identifier — the person who applied. */
  user_id?: string;
  cover_letter: string;
  status: string;
  created_at?: string;
  applied_at?: string;
};

/* ----- mappers ----- */
export function mapCourseRow(r: CourseRow): Course {
  return {
    id: r.id,
    title: r.title,
    titleId: r.title,
    platform: asCoursePlatform(r.platform),
    category: asCourseCategory(r.category),
    price: r.price,
    url: r.url,
    thumbnail: r.thumbnail ?? '📘',
    rating: r.rating,
    students: r.students,
    skillsTaught: r.skills ?? [],
    level: asSkillLevel(r.level),
    durationHours: r.duration_hours,
    enrolled: r.enrolled,
    createdAt: r.created_at,
    featured: Boolean(r.featured),
    affiliateUrl: r.affiliate_url ?? null,
    // Lifetime click count is merged onto the mapped Course by the admin
    // listing query (adminListCourses). The public RSC read never needs it,
    // so the mapper itself defaults to 0.
    affiliateClicks: 0,
  };
}

export function mapGigRow(r: GigRow): Gig {
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
    status: asGigStatus(r.status),
  };
}

export function mapSkillRow(r: SkillRow): Skill {
  return {
    id: r.id,
    name: r.name,
    category: asGigCategory(r.category),
    level: 'beginner',
    progress: r.progress ?? 0,
  };
}

export function mapUserRow(r: UserRow): User {
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

export function mapApplicationRow(r: ApplicationRow): Application {
  return {
    id: r.id,
    gigId: r.gig_id,
    freelancerId: r.user_id ?? r.freelancer_id ?? '',
    proposedRate: 0,
    proposedDurationWeeks: 0,
    coverLetter: r.cover_letter,
    status: asApplicationStatus(r.status),
    appliedAt: r.created_at ?? r.applied_at ?? new Date().toISOString(),
  };
}

/* ----- subscriber (anonymous opt-in) ----- */
export type SubscriberRow = {
  id: string;
  email: string;
  skill_id: string | null;
  created_at: string;
};

export interface Subscriber {
  id: string;
  email: string;
  skillId: string | null;
  createdAt: string;
}

export function mapSubscriberRow(r: SubscriberRow): Subscriber {
  return {
    id: r.id,
    email: r.email,
    skillId: r.skill_id,
    createdAt: r.created_at,
  };
}
