'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const STEPS = [
  { label: 'Learn',  href: '/learn',        icon: '📚' },
  { label: 'Build',  href: '/skills',       icon: '🛠️' },
  { label: 'Discover', href: '/gigs',       icon: '🔍' },
  { label: 'Apply',  href: '/applications', icon: '✉️' },
  { label: 'Earn',   href: '/earn',         icon: '💰' },
];

function activeIndex(pathname: string): number {
  if (pathname.startsWith('/learn')) return 0;
  if (pathname.startsWith('/skills')) return 1;
  if (pathname.startsWith('/gigs')) return 2;
  if (pathname.startsWith('/applications')) return 3;
  if (pathname.startsWith('/earn')) return 4;
  return -1; // landing
}

export function JourneyNav() {
  const pathname = usePathname() ?? '/';
  const idx = activeIndex(pathname);

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <ol className="flex items-center justify-between gap-2 py-3 overflow-x-auto">
          {STEPS.map((step, i) => {
            const isActive = i === idx;
            const isDone = idx >= 0 && i < idx;
            return (
              <li key={step.href} className="flex-1 min-w-0">
                <Link
                  href={step.href}
                  className={cn(
                    'group flex items-center gap-2 px-3 py-2 rounded-xl transition',
                    isActive && 'bg-gradient-to-r from-indigo-50 to-violet-50 ring-1 ring-indigo-200',
                    !isActive && 'hover:bg-slate-50',
                  )}
                >
                  <span
                    className={cn(
                      'w-8 h-8 rounded-full grid place-items-center text-sm font-bold shrink-0 transition',
                      isActive && 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-soft',
                      isDone && 'bg-emerald-500 text-white',
                      !isActive && !isDone && 'bg-slate-100 text-slate-500',
                    )}
                  >
                    {isDone ? '✓' : i + 1}
                  </span>
                  <span className="hidden sm:flex flex-col leading-tight min-w-0">
                    <span
                      className={cn(
                        'text-xs font-semibold truncate',
                        isActive ? 'text-indigo-700' : isDone ? 'text-emerald-700' : 'text-slate-600',
                      )}
                    >
                      {step.label}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate">{step.icon}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}