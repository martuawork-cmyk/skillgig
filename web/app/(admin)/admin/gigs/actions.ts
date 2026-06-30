'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  adminCreateGig,
  adminDeleteGig,
  adminSetGigStatus,
  adminUpdateGig,
} from '@/lib/supabase/admin-queries';
import type { GigCategory, GigPlatform, GigStatus, SkillLevel } from '@/lib/types';

const GIG_CATEGORIES: GigCategory[] = [
  'web-dev',
  'design',
  'writing',
  'marketing',
  'data',
  'video',
];
const GIG_PLATFORMS: GigPlatform[] = ['Upwork', 'Fiverr', 'Projects.co.id', 'Sribulancer'];
const SKILL_LEVELS: SkillLevel[] = ['beginner', 'intermediate', 'advanced'];
const GIG_STATUSES: GigStatus[] = ['draft', 'published', 'expired'];

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

export async function createGigAction(formData: FormData): Promise<ActionResult> {
  const title = String(formData.get('title') ?? '').trim();
  const url = String(formData.get('url') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();

  if (!title) return { ok: false, error: 'Judul wajib diisi.' };
  if (!url) return { ok: false, error: 'URL wajib diisi.' };

  try {
    const gig = await adminCreateGig({
      title,
      platform: pickEnum(formData.get('platform'), GIG_PLATFORMS, 'Upwork'),
      category: pickEnum(formData.get('category'), GIG_CATEGORIES, 'web-dev'),
      budgetMin: toPositiveInt(formData.get('budgetMin')),
      budgetMax: toPositiveInt(formData.get('budgetMax')),
      url,
      level: pickEnum(formData.get('level'), SKILL_LEVELS, 'beginner'),
      description,
      skills: toStringArray(formData.get('skills')),
      durationWeeks: toPositiveInt(formData.get('durationWeeks'), 4),
      status: pickEnum(formData.get('status'), GIG_STATUSES, 'draft'),
    });
    revalidatePath('/admin');
    revalidatePath('/admin/gigs');
    revalidateTag('gigs');
    return { ok: true, id: gig.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Gagal membuat gig.' };
  }
}

export async function updateGigAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const title = String(formData.get('title') ?? '').trim();
  const url = String(formData.get('url') ?? '').trim();

  if (!title) return { ok: false, error: 'Judul wajib diisi.' };
  if (!url) return { ok: false, error: 'URL wajib diisi.' };

  try {
    await adminUpdateGig(id, {
      title,
      platform: pickEnum(formData.get('platform'), GIG_PLATFORMS, 'Upwork'),
      category: pickEnum(formData.get('category'), GIG_CATEGORIES, 'web-dev'),
      budgetMin: toPositiveInt(formData.get('budgetMin')),
      budgetMax: toPositiveInt(formData.get('budgetMax')),
      url,
      level: pickEnum(formData.get('level'), SKILL_LEVELS, 'beginner'),
      description: String(formData.get('description') ?? '').trim(),
      skills: toStringArray(formData.get('skills')),
      durationWeeks: toPositiveInt(formData.get('durationWeeks'), 4),
    });
    revalidatePath('/admin');
    revalidatePath('/admin/gigs');
    revalidatePath(`/admin/gigs/${id}`);
    revalidateTag('gigs');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Gagal update gig.' };
  }
}

export async function setGigStatusAction(id: string, status: GigStatus): Promise<void> {
  await adminSetGigStatus(id, status);
  revalidatePath('/admin');
  revalidatePath('/admin/gigs');
  revalidateTag('gigs');
}

export async function deleteGigAction(id: string): Promise<void> {
  await adminDeleteGig(id);
  revalidatePath('/admin');
  revalidatePath('/admin/gigs');
  revalidateTag('gigs');
}

export async function deleteGigAndRedirectAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await adminDeleteGig(id);
  revalidatePath('/admin');
  revalidatePath('/admin/gigs');
  revalidateTag('gigs');
}

// Helper for client-side wrappers that want to redirect back to /admin/gigs
// after a successful edit.
export async function backToGigs(): Promise<void> {
  redirect('/admin/gigs');
}
