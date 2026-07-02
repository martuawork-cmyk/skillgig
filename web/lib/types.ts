// SkillGig.id — shared types

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export type GigCategory =
  | 'web-dev'
  | 'design'
  | 'writing'
  | 'marketing'
  | 'data'
  | 'video'
  | 'other';

export type ApplicationStatus = 'pending' | 'reviewed' | 'accepted' | 'rejected';

export type GigStatus = 'draft' | 'published' | 'expired';

/** Employment type for real job postings (seed-gigs-real.sql `job_type`). */
export type GigJobType =
  | 'Full-Time'
  | 'Contract'
  | 'Part-Time'
  | 'Freelance'
  | 'Internship';

export interface Gig {
  id: string;
  title: string;
  titleId: string;
  description: string;
  descriptionId: string;
  category: GigCategory;
  budgetMin: number; // IDR
  budgetMax: number; // IDR
  /** Project duration in weeks. `null` for open-ended roles (e.g. Full-Time
   *  salaried postings that have no fixed project window). */
  durationWeeks: number | null;
  level: SkillLevel;
  skillsRequired: string[];
  clientId: string;
  applicantsCount: number;
  postedAt: string; // ISO
  platform: GigPlatform;
  url: string;
  /** Canonical dedup key for synced listings (equals `url` for Remotive
   *  imports). Backed by `gigs.source_url` (migration 015); powers the sync's
   *  `ON CONFLICT (source_url) DO UPDATE`. Absent on legacy/mock rows. */
  sourceUrl?: string | null;
  /** Namespaced upstream primary key (`remotive:<id>`) for synced listings —
   *  the canonical cross-provider dedup key (migration 016). Absent on
   *  legacy / mock / admin-created rows. */
  sourceId?: string | null;
  /** Lifecycle status controlled by the admin layer. Defaults to 'published'
   *  for legacy rows that pre-date migration 007. */
  status: GigStatus;
  /**
   * Real-content fields backed by seed-gigs-real.sql columns. All are optional
   * on the type because the columns were added idempotently (legacy / mock
   * rows may pre-date them); `mapGigRow` always populates them when present.
   */
  company?: string | null;
  company_logo?: string | null;
  jobType?: GigJobType | null;
  location?: string;
  isRemote?: boolean;
  /** Salary floor / ceiling. Mirror `budgetMin` / `budgetMax` — the SQL keeps
   *  a single `budget_min`/`budget_max` pair that doubles as the salary range. */
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
}

/** Pill options for the "Tipe Kerja" filter on /gigs. */
export const JOB_TYPES: { value: GigJobType; label: string }[] = [
  { value: 'Full-Time',  label: 'Full-Time' },
  { value: 'Contract',   label: 'Contract' },
  { value: 'Part-Time',  label: 'Part-Time' },
  { value: 'Freelance',  label: 'Freelance' },
  { value: 'Internship', label: 'Internship' },
];

/** Badge colour per job type (Tailwind classes). */
export const JOB_TYPE_COLORS: Record<GigJobType, string> = {
  'Full-Time':  'bg-green-100 text-green-700',
  'Contract':   'bg-blue-100 text-blue-700',
  'Part-Time':  'bg-purple-100 text-purple-700',
  'Freelance':  'bg-orange-100 text-orange-700',
  'Internship': 'bg-yellow-100 text-yellow-700',
};

export type GigPlatform =
  | 'Upwork'
  | 'Fiverr'
  | 'Projects.co.id'
  | 'Sribulancer'
  | 'Remotive'
  | 'Jobicy'
  | 'RemoteOK';

export const GIG_PLATFORMS: Record<GigPlatform, string> = {
  'Upwork':         'bg-sky-100 text-sky-700',
  'Fiverr':         'bg-emerald-100 text-emerald-700',
  'Projects.co.id': 'bg-orange-100 text-orange-700',
  'Sribulancer':    'bg-violet-100 text-violet-700',
  'Remotive':       'bg-teal-100 text-teal-700',
  'Jobicy':         'bg-indigo-100 text-indigo-700',
  'RemoteOK':       'bg-rose-100 text-rose-700',
};

export interface Course {
  id: string;
  title: string;
  titleId: string;
  platform: CoursePlatform;
  category: CourseCategory;
  price: number; // IDR, 0 = gratis
  durationHours: number;
  level: SkillLevel;
  skillsTaught: string[];
  thumbnail: string; // emoji
  students: number;
  createdAt: string; // ISO date
  enrolled: boolean; // mock "currently learning" flag
  url?: string; // optional external link
  /** 0.00 – 5.00, average rating reported by the platform. */
  rating: number;
  /** Admin-controlled flag — featured courses surface on the /learn landing. */
  featured: boolean;
  /**
   * Outbound monetised URL for the "Mulai Belajar" CTA. When null the card
   * falls back to `url`. Populated from `courses.affiliate_url`.
   */
  affiliateUrl?: string | null;
  /**
   * Lifetime click count for this course's affiliate link. Surfaced only
   * on /admin/courses at the moment — kept on the type so the admin list
   * doesn't need a second query.
   */
  affiliateClicks?: number;
}

export type CoursePlatform = 'Udemy' | 'Coursera' | 'Dicoding' | 'YouTube';

export type CourseCategory = 'design' | 'tech' | 'marketing' | 'data' | 'video' | 'writing';

export const COURSE_PLATFORMS: Record<CoursePlatform, string> = {
  Udemy:    'bg-purple-100 text-purple-700',
  Coursera: 'bg-blue-100 text-blue-700',
  Dicoding: 'bg-red-100 text-red-700',
  YouTube:  'bg-rose-100 text-rose-700',
};

/**
 * Emoji glyph per course platform — surfaced on the CourseCard next to the
 * platform name. Keyed by string (not the `CoursePlatform` union) so platforms
 * the DB may carry that aren't in the narrower union — edX, LinkedIn Learning,
 * BuildWithAngga, Codepolitan — still resolve to a sensible icon instead of
 * being silently dropped. Unknown platforms fall back to 📚.
 */
export const COURSE_PLATFORM_ICONS: Record<string, string> = {
  Coursera: '🎓',
  Udemy: '🟣',
  edX: '⚡',
  Dicoding: '🇮🇩',
  'LinkedIn Learning': '💼',
  BuildWithAngga: '🏗️',
  Codepolitan: '💻',
  YouTube: '▶️',
};

/** Resolve a platform name to its emoji, defaulting to 📚 when unknown. */
export function coursePlatformIcon(platform: string): string {
  return COURSE_PLATFORM_ICONS[platform] ?? '📚';
}

export const COURSE_CATEGORIES: { value: CourseCategory | 'all'; label: string }[] = [
  { value: 'all',       label: 'Semua' },
  { value: 'design',    label: 'Design' },
  { value: 'tech',      label: 'Tech' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'data',      label: 'Data' },
  { value: 'video',     label: 'Video' },
  { value: 'writing',   label: 'Writing' },
];

export interface Skill {
  id: string;
  name: string;
  category: GigCategory;
  level: SkillLevel;
  progress: number; // 0-100
}

export interface User {
  id: string;
  name: string;
  initials: string;
  role: 'client' | 'freelancer';
  rating: number;
  completedGigs: number;
  bio: string;
  skills: string[];
  location: string;
}

export interface Application {
  id: string;
  gigId: string;
  freelancerId: string;
  proposedRate: number;
  proposedDurationWeeks: number;
  coverLetter: string;
  status: ApplicationStatus;
  appliedAt: string; // ISO
}

// Constants
export const CATEGORIES: { value: GigCategory; label: string; color: string }[] = [
  { value: 'web-dev',  label: 'Web Dev',   color: 'bg-indigo-100 text-indigo-700' },
  { value: 'design',   label: 'Design',    color: 'bg-pink-100 text-pink-700' },
  { value: 'writing',  label: 'Writing',   color: 'bg-amber-100 text-amber-700' },
  { value: 'marketing',label: 'Marketing', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'data',     label: 'Data',      color: 'bg-sky-100 text-sky-700' },
  { value: 'video',    label: 'Video',     color: 'bg-rose-100 text-rose-700' },
  { value: 'other',    label: 'Other',     color: 'bg-slate-100 text-slate-700' },
];

// Roadmap — exploratory data for /roadmap page (Step 3 of journey)
export interface RoadmapCourseRef {
  title: string;
  platform: CoursePlatform;
  url: string;
}

export interface RoadmapGigRef {
  title: string;
  budgetMin: number;
  budgetMax: number;
  platform: string;
}

export interface RoadmapIncomeTier {
  level: 'Pemula' | 'Menengah' | 'Expert';
  min: number;
  max: number;
}

export interface Roadmap {
  skill: string;
  category: GigCategory;
  difficulty: SkillLevel;
  durationWeeks: number;
  /** IDR per month at full expert level. */
  estimatedIncome: { min: number; max: number };
  skills: string[];
  courses: RoadmapCourseRef[];
  gigs: RoadmapGigRef[];
  incomeTiers: RoadmapIncomeTier[];
}

export const LEVELS: { value: SkillLevel; label: string; color: string }[] = [
  { value: 'beginner',     label: 'Beginner',     color: 'bg-slate-100 text-slate-700' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-violet-100 text-violet-700' },
  { value: 'advanced',     label: 'Advanced',     color: 'bg-fuchsia-100 text-fuchsia-700' },
];