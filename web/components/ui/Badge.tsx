import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type Tone =
  | 'indigo'
  | 'violet'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'sky'
  | 'slate'
  | 'pink'
  | 'fuchsia';

const tones: Record<Tone, string> = {
  indigo: 'bg-indigo-100 text-indigo-700',
  violet: 'bg-violet-100 text-violet-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
  sky: 'bg-sky-100 text-sky-700',
  slate: 'bg-slate-100 text-slate-700',
  pink: 'bg-pink-100 text-pink-700',
  fuchsia: 'bg-fuchsia-100 text-fuchsia-700',
};

export function Badge({
  children,
  tone = 'slate',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}