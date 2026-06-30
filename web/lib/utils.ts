// SkillGig.id — small utilities

import type { GigCategory, SkillLevel, ApplicationStatus } from './types';
import { CATEGORIES, LEVELS } from './types';

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