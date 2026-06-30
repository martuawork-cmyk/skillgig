'use server';

import { revalidatePath } from 'next/cache';
import {
  adminCreateCourse,
  adminDeleteCourse,
  adminToggleCourseFeatured,
  adminUpdateCourse,
} from '@/lib/supabase/admin-queries';
import type { CourseCategory, CoursePlatform, SkillLevel } from '@/lib/types';

const COURSE_PLATFORMS: CoursePlatform[] = ['Udemy', 'Coursera', 'Dicoding', 'YouTube'];
const COURSE_CATEGORIES: CourseCategory[] = ['design', 'tech', 'marketing'];
const SKILL_LEVELS: SkillLevel[] = ['beginner', 'intermediate', 'advanced'];

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

function pickEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === 'string') {
    return v
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function toPositiveInt(v: unknown, fallback = 0): number {
  const n = typeof v === 'string' ? parseInt(v, 10) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function toDecimal(v: unknown, fallback = 0): number {
  const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) && n >= 0 && n <= 5 ? n : fallback;
}

function toCheckbox(v: unknown): boolean {
  return v === 'on' || v === 'true' || v === true;
}

export async function createCourseAction(formData: FormData): Promise<ActionResult> {
  const title = String(formData.get('title') ?? '').trim();
  const url = String(formData.get('url') ?? '').trim();
  if (!title) return { ok: false, error: 'Judul wajib diisi.' };
  if (!url) return { ok: false, error: 'URL wajib diisi.' };

  try {
    const course = await adminCreateCourse({
      title,
      platform: pickEnum(formData.get('platform'), COURSE_PLATFORMS, 'YouTube'),
      category: pickEnum(formData.get('category'), COURSE_CATEGORIES, 'tech'),
      price: toPositiveInt(formData.get('price')),
      url,
      thumbnail: String(formData.get('thumbnail') ?? '').trim() || null,
      rating: toDecimal(formData.get('rating')),
      students: toPositiveInt(formData.get('students')),
      skills: toStringArray(formData.get('skills')),
      level: pickEnum(formData.get('level'), SKILL_LEVELS, 'beginner'),
      durationHours: toPositiveInt(formData.get('durationHours')),
      featured: toCheckbox(formData.get('featured')),
    });
    revalidatePath('/admin');
    revalidatePath('/admin/courses');
    return { ok: true, id: course.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Gagal membuat kursus.' };
  }
}

export async function updateCourseAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const title = String(formData.get('title') ?? '').trim();
  const url = String(formData.get('url') ?? '').trim();
  if (!title) return { ok: false, error: 'Judul wajib diisi.' };
  if (!url) return { ok: false, error: 'URL wajib diisi.' };

  try {
    await adminUpdateCourse(id, {
      title,
      platform: pickEnum(formData.get('platform'), COURSE_PLATFORMS, 'YouTube'),
      category: pickEnum(formData.get('category'), COURSE_CATEGORIES, 'tech'),
      price: toPositiveInt(formData.get('price')),
      url,
      thumbnail: String(formData.get('thumbnail') ?? '').trim() || null,
      rating: toDecimal(formData.get('rating')),
      students: toPositiveInt(formData.get('students')),
      skills: toStringArray(formData.get('skills')),
      level: pickEnum(formData.get('level'), SKILL_LEVELS, 'beginner'),
      durationHours: toPositiveInt(formData.get('durationHours')),
      enrolled: toCheckbox(formData.get('enrolled')),
    });
    revalidatePath('/admin');
    revalidatePath('/admin/courses');
    revalidatePath(`/admin/courses/${id}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Gagal update kursus.' };
  }
}

export async function toggleCourseFeaturedAction(
  id: string,
  featured: boolean,
): Promise<void> {
  await adminToggleCourseFeatured(id, featured);
  revalidatePath('/admin');
  revalidatePath('/admin/courses');
}

export async function deleteCourseAction(id: string): Promise<void> {
  await adminDeleteCourse(id);
  revalidatePath('/admin');
  revalidatePath('/admin/courses');
}
