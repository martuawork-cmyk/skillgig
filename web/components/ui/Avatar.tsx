import { cn } from '@/lib/utils';

const sizes = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-20 h-20 text-2xl',
};

export function Avatar({
  initials,
  size = 'md',
  className,
}: {
  initials: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold grid place-items-center shrink-0',
        sizes[size],
        className,
      )}
      aria-label={initials}
    >
      {initials.slice(0, 2).toUpperCase()}
    </div>
  );
}