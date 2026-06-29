import { cn } from '@/lib/utils';

export type StatTile = {
  label: string;
  value: string | number;
  /** Tailwind gradient classes, e.g. "from-indigo-600 to-violet-600". */
  accent?: string;
  /** Optional emoji or single-char icon shown in the accent box. */
  icon?: string;
};

const DEFAULT_ACCENT = 'from-indigo-500 to-violet-500';

type Props = {
  stats: StatTile[];
  /** Number of columns at sm+. Defaults to `min(4, stats.length)`. */
  cols?: 2 | 3 | 4 | 5 | 6;
  className?: string;
};

export function StatsGrid({ stats, cols, className }: Props) {
  const gridCols =
    cols ??
    (stats.length >= 4 ? 4 : stats.length >= 3 ? 3 : 2);
  const colClass: Record<2 | 3 | 4 | 5 | 6, string> = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
    5: 'sm:grid-cols-2 lg:grid-cols-5',
    6: 'sm:grid-cols-2 lg:grid-cols-6',
  };

  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-3',
        colClass[gridCols as 2 | 3 | 4 | 5 | 6],
        className,
      )}
    >
      {stats.map((s) => (
        <StatTileCard key={s.label} {...s} />
      ))}
    </div>
  );
}

function StatTileCard({ label, value, accent, icon }: StatTile) {
  return (
    <div className="px-4 py-3 bg-white border border-slate-200 rounded-xl">
      <div
        className={cn(
          'w-8 h-8 rounded-lg mb-2 grid place-items-center text-sm',
          'bg-gradient-to-br',
          accent ?? DEFAULT_ACCENT,
        )}
        aria-hidden
      >
        {icon ? <span>{icon}</span> : null}
      </div>
      <p className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">
        {label}
      </p>
      <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5 break-words">
        {value}
      </p>
    </div>
  );
}