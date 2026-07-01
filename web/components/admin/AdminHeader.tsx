'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ExternalLink, LogOut } from 'lucide-react';
import { Breadcrumb } from '@/components/admin/Breadcrumb';
import type { AdminUser } from '@/components/admin/AdminSidebar';
import { cn } from '@/lib/utils';

type Props = {
  user: AdminUser;
};

/**
 * Sticky top bar of the admin workspace (64px). Left: auto breadcrumb. Right:
 * a "view site" link and a user menu dropdown with a logout action.
 * Click-outside and Escape close the dropdown.
 */
export function AdminHeader({ user }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 shadow-sm">
      <Breadcrumb />

      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-indigo-600 sm:flex"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          Lihat situs
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-slate-50"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <div className="grid h-8 w-8 place-items-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700">
              {user.initials.slice(0, 2).toUpperCase()}
            </div>
            <span className="hidden text-sm font-semibold text-slate-700 sm:block">
              {user.name}
            </span>
            <ChevronDown
              className={cn('h-4 w-4 text-slate-400 transition', open && 'rotate-180')}
              aria-hidden
            />
          </button>

          {open && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
            >
              <div className="px-3 py-2">
                <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
                <p className="truncate text-[11px] text-slate-500">
                  {user.email ?? 'Administrator'}
                </p>
              </div>
              <div className="my-1 h-px bg-slate-100" />
              <Link
                href="/"
                role="menuitem"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <ExternalLink className="h-4 w-4" aria-hidden />
                Lihat situs publik
              </Link>
              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                  Keluar
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
