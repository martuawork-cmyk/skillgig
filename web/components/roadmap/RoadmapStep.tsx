import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type StepKind = 'skills' | 'courses' | 'gigs' | 'income';

type Props = {
  index: number;          // 1-based
  totalSteps: number;
  icon: string;           // emoji
  title: string;
  kind: StepKind;
  children: ReactNode;
};

const ACCENTS: Record<StepKind, { ring: string; chip: string; label: string }> = {
  skills:  { ring: 'from-indigo-500 to-violet-500',  chip: 'bg-indigo-100 text-indigo-700',   label: 'Step 1' },
  courses: { ring: 'from-fuchsia-500 to-pink-500',   chip: 'bg-pink-100 text-pink-700',       label: 'Step 2' },
  gigs:    { ring: 'from-amber-500 to-orange-500',   chip: 'bg-amber-100 text-amber-700',     label: 'Step 3' },
  income:  { ring: 'from-emerald-500 to-teal-500',   chip: 'bg-emerald-100 text-emerald-700', label: 'Step 4' },
};

export function RoadmapStep({ index, totalSteps, icon, title, kind, children }: Props) {
  const accent = ACCENTS[kind];
  const isLast = index === totalSteps;

  return (
    <li className="relative flex gap-3 sm:gap-4">
      {/* Left rail: numbered circle + connector line */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className={cn(
            'w-10 h-10 sm:w-12 sm:h-12 rounded-full grid place-items-center text-base sm:text-lg font-extrabold text-white shadow-soft bg-gradient-to-br',
            accent.ring,
          )}
          aria-hidden
        >
          {icon}
        </div>
        {!isLast && (
          <div
            className="w-0.5 flex-1 my-1 bg-gradient-to-b from-slate-300 to-slate-200"
            aria-hidden
          />
        )}
      </div>

      {/* Body */}
      <div className="flex-1 pb-6 sm:pb-8 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className={cn('px-2 py-0.5 text-[10px] font-bold uppercase rounded-full', accent.chip)}>
            {accent.label}
          </span>
          <span className="text-[10px] text-slate-500 font-semibold">{index}/{totalSteps}</span>
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 leading-snug">
          {title}
        </h3>
        <div className="text-sm text-slate-600">{children}</div>
      </div>
    </li>
  );
}