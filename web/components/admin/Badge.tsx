import { cn } from '@/lib/utils';

export type AdminStatus = 'draft' | 'published' | 'expired';

const STATUS: Record<AdminStatus, { label: string; cls: string; dot: string }> = {
  draft: { label: 'Draft', cls: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
  published: {
    label: 'Published',
    cls: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  expired: { label: 'Expired', cls: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' },
};

type Props = {
  status: AdminStatus;
  /** Override the default label (e.g. a localized word) without changing colors. */
  label?: string;
  className?: string;
};

/**
 * Status pill for admin records (gig/course lifecycle etc.). Colors are fixed
 * per status — draft (neutral), published (green), expired (red) — so a glance
 * is enough to tell state apart. Unrelated badges should use the generic
 * `ui/Badge`; this one is opinionated about lifecycle states.
 */
export function StatusBadge({ status, label, className }: Props) {
  const s = STATUS[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
        s.cls,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} aria-hidden />
      {label ?? s.label}
    </span>
  );
}

// Convenience alias so callers can `import { Badge }` if they prefer.
export const Badge = StatusBadge;
