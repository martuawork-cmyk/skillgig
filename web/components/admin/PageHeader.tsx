import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  title: string;
  description?: string;
  /** Right-aligned action slot, e.g. an "Add" button or filter controls. */
  action?: ReactNode;
  className?: string;
};

/**
 * Standard page heading for admin pages: an h1 (the page's single top-level
 * heading) with an optional supporting line and a right-aligned action slot.
 * Drop at the top of a page, above the content.
 */
export function PageHeader({ title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
          {title}
        </h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
