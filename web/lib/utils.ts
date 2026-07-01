// SkillGig.id — small utilities

import type { GigCategory, GigJobType, SkillLevel, ApplicationStatus } from './types';
import { CATEGORIES, LEVELS, JOB_TYPE_COLORS } from './types';

export function cn(...classes: Array<string | false | undefined | null>): string {
  return classes.filter(Boolean).join(' ');
}

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a salary / budget range with the right currency prefix.
 *   USD → "USD 500 – 1.000"        (dot thousands separator, single prefix)
 *   IDR → "Rp 5.000.000 – Rp 15.000.000"  (formatIDR on each bound)
 * Any other / missing currency falls back to IDR formatting.
 */
export function formatBudget(min: number, max: number, currency: string): string {
  const dash = ' – ';
  if (currency === 'USD') {
    const fmt = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
    return `USD ${fmt.format(min)}${dash}${fmt.format(max)}`;
  }
  return `${formatIDR(min)}${dash}${formatIDR(max)}`;
}

/**
 * Compact *monthly* salary range for the GigCard — tighter than `formatBudget`
 * (used on the gig detail page, which has room for the full figures).
 *   USD → "USD 500–1.000/bln"
 *   IDR → "Rp 5jt–15jt/bln"
 *
 * IDR values ≥ 1 juta collapse to "Njt"; anything smaller keeps its full IDR
 * form so Rp 500.000 doesn't render as the meaningless "Rp 0jt". Unknown
 * currencies fall back to the IDR branch.
 */
export function formatSalaryRange(min: number, max: number, currency: string): string {
  const dash = '–';
  if (currency === 'USD') {
    const fmt = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
    return `USD ${fmt.format(min)}${dash}${fmt.format(max)}/bln`;
  }
  const toJt = (n: number) =>
    n >= 1_000_000 ? `${Math.round(n / 1_000_000)}jt` : formatIDR(n);
  return `Rp ${toJt(min)}${dash}${toJt(max)}/bln`;
}

/** Tailwind badge classes for a given job type. */
export function jobTypeColor(t: GigJobType): string {
  return JOB_TYPE_COLORS[t] ?? 'bg-slate-100 text-slate-700';
}

/**
 * Compact IDR price for the CourseCard — "Rp 179rb" under 1 juta, "Rp 1,5jt"
 * at/above 1 juta (one decimal, Indonesian comma). The caller renders a free
 * course (0) as a separate GRATIS badge, so this assumes a non-zero amount.
 */
export function formatCoursePrice(amount: number): string {
  if (amount >= 1_000_000) {
    const jt = amount / 1_000_000;
    const str = Number.isInteger(jt) ? String(jt) : jt.toFixed(1).replace('.', ',');
    return `Rp ${str}jt`;
  }
  return `Rp ${Math.round(amount / 1000)}rb`;
}

export function formatCompact(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function timeAgo(iso: string): string {
  const now = Date.now();
  const ts = new Date(iso).getTime();
  const diff = Math.floor((now - ts) / 1000);
  if (diff < 60) return `${diff}s lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h lalu`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d lalu`;
  return formatDate(iso);
}

export function categoryLabel(c: GigCategory): string {
  return CATEGORIES.find((x) => x.value === c)?.label ?? c;
}

export function categoryColor(c: GigCategory): string {
  return CATEGORIES.find((x) => x.value === c)?.color ?? 'bg-slate-100 text-slate-700';
}

export function levelLabel(l: SkillLevel): string {
  return LEVELS.find((x) => x.value === l)?.label ?? l;
}

export function levelColor(l: SkillLevel): string {
  return LEVELS.find((x) => x.value === l)?.color ?? 'bg-slate-100 text-slate-700';
}

export function statusColor(s: ApplicationStatus): string {
  switch (s) {
    case 'pending':  return 'bg-amber-100 text-amber-700';
    case 'reviewed': return 'bg-sky-100 text-sky-700';
    case 'accepted': return 'bg-emerald-100 text-emerald-700';
    case 'rejected': return 'bg-rose-100 text-rose-700';
  }
}

export function statusLabel(s: ApplicationStatus): string {
  switch (s) {
    case 'pending':  return 'Pending';
    case 'reviewed': return 'Reviewed';
    case 'accepted': return 'Accepted';
    case 'rejected': return 'Rejected';
  }
}