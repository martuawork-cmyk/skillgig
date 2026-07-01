import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  icon: LucideIcon;
  value: string | number;
  label: string;
  /** Optional trend pill. `value` is display text, e.g. "+12%" or "-3%". */
  trend?: { value: string; direction: 'up' | 'down' };
  /** Tailwind gradient classes for the icon chip, e.g. "from-indigo-500 to-violet-500". */
  accent?: string;
  className?: string;
};

/**
 * Single KPI card for admin dashboards: icon chip, big value, label, and an
 * optional up/down trend pill. Pair with a `grid` wrapper to lay out a row.
 */
export function StatCard({
  icon: Icon,
  value,
  label,
  trend,
  accent = 'from-indigo-500 to-violet-500',
  className,
}: Props) {
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            'grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br text-white shadow-soft',
            accent,
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold',
              trend.direction === 'up'
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-rose-50 text-rose-600',
            )}
          >
            {trend.direction === 'up' ? (
              <TrendingUp className="h-3 w-3" aria-hidden />
            ) : (
              <TrendingDown className="h-3 w-3" aria-hidden />
            )}
            {trend.value}
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}
