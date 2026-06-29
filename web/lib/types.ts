// SkillGig.id — shared types

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export type GigCategory =
  | 'web-dev'
  | 'design'
  | 'writing'
  | 'marketing'
  | 'data'
  | 'video';

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export interface Gig {
  id: string;
  title: string;
  titleId: string;
  description: string;
  descriptionId: string;
  category: GigCategory;
  budgetMin: number; // IDR
  budgetMax: number; // IDR
  durationWeeks: number;
  level: SkillLevel;
  skillsRequired: string[];
  clientId: string;
  applicantsCount: number;
  postedAt: string; // ISO
}

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
}

export type CoursePlatform = 'Udemy' | 'Coursera' | 'Dicoding' | 'YouTube';

export type CourseCategory = 'design' | 'tech' | 'marketing';

export const COURSE_PLATFORMS: Record<CoursePlatform, string> = {
  Udemy:    'bg-purple-100 text-purple-700',
  Coursera: 'bg-blue-100 text-blue-700',
  Dicoding: 'bg-red-100 text-red-700',
  YouTube:  'bg-rose-100 text-rose-700',
};

export const COURSE_CATEGORIES: { value: CourseCategory | 'all'; label: string }[] = [
  { value: 'all',       label: 'Semua' },
  { value: 'design',    label: 'Design' },
  { value: 'tech',      label: 'Tech' },
  { value: 'marketing', label: 'Marketing' },
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
];

export const LEVELS: { value: SkillLevel; label: string; color: string }[] = [
  { value: 'beginner',     label: 'Beginner',     color: 'bg-slate-100 text-slate-700' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-violet-100 text-violet-700' },
  { value: 'advanced',     label: 'Advanced',     color: 'bg-fuchsia-100 text-fuchsia-700' },
];