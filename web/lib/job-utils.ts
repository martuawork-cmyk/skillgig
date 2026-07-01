// SkillGig.id — /jobs-board-specific helpers.
//
// The /jobs page surfaces full-time / contract / part-time / internship roles
// from real companies (the "loker remote" board), as distinct from /gigs which
// focuses on freelance projects. The underlying rows still live on the `gigs`
// table, so these helpers layer a jobs-board vocabulary on top of the shared
// Gig type rather than introducing a second schema.

import type { GigCategory, GigJobType, SkillLevel } from './types';
import { categoryLabel } from './utils';

/**
 * The four employment types the /jobs board surfaces. Freelance is excluded on
 * purpose — it lives on /gigs. Kept as a readonly tuple so it can be spread
 * into filter option lists and fed straight into Supabase's `.in(...)`.
 */
export const JOB_BOARD_TYPES = [
  'Full-Time',
  'Contract',
  'Part-Time',
  'Internship',
] as const satisfies readonly GigJobType[];

/**
 * Level chips for /jobs use the jobs-board vocabulary (Junior / Mid / Senior)
 * instead of the app-wide Beginner / Intermediate / Advanced labels. They map
 * onto the same SkillLevel values stored on the gig row, so filtering still
 * hits the real column.
 */
export const JOB_LEVELS: { value: SkillLevel; label: string }[] = [
  { value: 'beginner',     label: 'Junior' },
  { value: 'intermediate', label: 'Mid' },
  { value: 'advanced',     label: 'Senior' },
];

export function jobLevelLabel(l: SkillLevel): string {
  return JOB_LEVELS.find((x) => x.value === l)?.label ?? l;
}

/**
 * Category chips for /jobs — jobs-board labels (Tech / Design / …) mapped onto
 * the underlying GigCategory values. Categories with no chip here (video,
 * other — the catch-all for synced Remotive gigs) stay visible only under the
 * "Semua" filter so nothing is silently hidden.
 */
export const JOB_CATEGORIES: { value: GigCategory; label: string }[] = [
  { value: 'web-dev',   label: 'Tech' },
  { value: 'design',    label: 'Design' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'data',      label: 'Data' },
  { value: 'writing',   label: 'Writing' },
];

export function jobCategoryLabel(c: GigCategory): string {
  const mapped = JOB_CATEGORIES.find((x) => x.value === c)?.label;
  return mapped ?? categoryLabel(c);
}

/**
 * Synced Remotive listings frequently omit salary (both bounds land at 0).
 * Returns true so callers can show a "nego" placeholder instead of the
 * meaningless "USD 0–0/bln".
 */
export function isSalaryHidden(min?: number, max?: number): boolean {
  return (min ?? 0) === 0 && (max ?? 0) === 0;
}

/**
 * Human-readable location label for a job, falling back sensibly when the
 * source row left `location` empty.
 */
export function jobLocation(
  location?: string,
  isRemote?: boolean,
): string {
  const loc = (location ?? '').trim();
  if (loc) return loc;
  return isRemote === false ? 'On-site' : 'Remote';
}
