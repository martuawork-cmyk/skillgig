import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'xl';

const base =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none';

const variants: Record<Variant, string> = {
  primary:
    'text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-soft',
  secondary:
    'text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-soft',
  ghost:
    'text-slate-600 bg-transparent hover:bg-slate-100',
  danger:
    'text-white bg-rose-600 hover:bg-rose-700 shadow-soft',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-sm',
  // Hero CTA size — large enough to read as the primary call-to-action.
  // Kept as a named variant (not a one-off className) because `cn()` doesn't
  // dedupe Tailwind classes, so a `px-*`/`py-*`/`text-*` className on top of
  // another size would silently collide depending on stylesheet order.
  xl: 'px-8 py-4 text-lg',
};

type ButtonProps = ComponentProps<'button'> & {
  variant?: Variant;
  size?: Size;
  children?: ReactNode;
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      {children}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
  children?: ReactNode;
};

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      {children}
    </Link>
  );
}