'use client';

import { LayoutGrid, List as ListIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ViewMode } from '@/lib/hooks/useViewPreference';

// =============================================================================
// Shared Grid ⇄ List toggle for the /gigs and /jobs result headers. Two
// segmented buttons; the active one takes the indigo→violet gradient. Mirrors
// the styling that originally lived inline in JobsClient so both boards match.
// =============================================================================

type Props = {
  view: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
};

export function ViewToggle({ view, onChange, className }: Props) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 self-start rounded-lg border border-slate-200 bg-white p-0.5 lg:self-auto',
        className,
      )}
      role="group"
      aria-label="Mode tampilan"
    >
      <Segment
        active={view === 'grid'}
        onClick={() => onChange('grid')}
        label="Grid"
      >
        <LayoutGrid className="h-4 w-4" aria-hidden />
        Grid
      </Segment>
      <Segment
        active={view === 'list'}
        onClick={() => onChange('list')}
        label="List"
      >
        <ListIcon className="h-4 w-4" aria-hidden />
        List
      </Segment>
    </div>
  );
}

function Segment({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={`${label} view`}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition',
        active
          ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-soft'
          : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-700',
      )}
    >
      {children}
    </button>
  );
}
