'use client';

import { cn } from '@/lib/utils';

type PillItem<V extends string> = { value: V; label: string };

type Props<V extends string> = {
  items: PillItem<V>[];
  active: V;
  onChange: (value: V) => void;
  className?: string;
  /** Accessible label for the group. */
  ariaLabel?: string;
};

export function FilterPills<V extends string>({
  items,
  active,
  onChange,
  className,
  ariaLabel,
}: Props<V>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn('flex flex-wrap items-center gap-2', className)}
    >
      {items.map((item) => {
        const isActive = item.value === active;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            aria-pressed={isActive}
            className={cn(
              'px-3.5 py-1.5 text-sm font-semibold rounded-full transition active:scale-[.97]',
              isActive
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-soft'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300 hover:text-indigo-700',
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}