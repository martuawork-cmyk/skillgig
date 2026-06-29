import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function Tag({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 text-slate-700',
        className,
      )}
    >
      {children}
    </span>
  );
}