'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { BookOpen, Briefcase, LayoutDashboard, LogOut, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandMark } from '@/components/brand/Logo';
import { ConfirmModal } from '@/components/admin/ConfirmModal';

export type AdminUser = {
  name: string;
  initials: string;
  email?: string;
};

type NavItem = { href: string; label: string; icon: LucideIcon };

const NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/gigs', label: 'Gigs', icon: Briefcase },
  { href: '/admin/courses', label: 'Kursus', icon: BookOpen },
  { href: '/admin/subscribers', label: 'Subscribers', icon: Mail },
];

/** Dashboard is an exact match; the rest match their section prefix. */
function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(href + '/');
}

type Props = {
  user: AdminUser;
};

/**
 * Fixed left sidebar for the admin workspace. Pinned to the viewport (does not
 * scroll with the page), 260px wide. Holds the brand mark, primary nav with
 * Lucide icons + active-state accent (indigo), and the signed-in user with a
 * logout action pinned to the bottom.
 */
export function AdminSidebar({ user }: Props) {
  const pathname = usePathname() ?? '';
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Hidden form posted to /api/auth/signout — only submitted after the user
  // confirms via the modal.
  const logoutFormRef = useRef<HTMLFormElement>(null);

  function handleConfirmLogout() {
    setConfirmOpen(false);
    logoutFormRef.current?.requestSubmit();
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-slate-200 bg-white">
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-slate-100 px-5">
        <BrandMark className="h-9 w-9 text-[#17255A]" />
        <div className="leading-tight">
          <p className="text-base font-extrabold tracking-tight text-slate-900">
            SkillGig Admin
          </p>
          <p className="-mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Console
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Menu
        </p>
        <ul className="space-y-1">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm font-medium transition',
                    active
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                      : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-indigo-600',
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" aria-hidden />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User + logout */}
      <div className="border-t border-slate-100 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
            {user.initials.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
            <p className="truncate text-[11px] text-slate-500">
              {user.email ?? 'Administrator'}
            </p>
          </div>
        </div>
        <form ref={logoutFormRef} action="/api/auth/signout" method="post" className="hidden" aria-hidden>
          {/* Submitted via requestSubmit() after the confirm modal. Kept as a
              real form so the no-JS / signout endpoint stays a plain POST. */}
          <button type="submit" tabIndex={-1} aria-hidden>
            Keluar
          </button>
        </form>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Keluar
        </button>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Keluar dari SkillGig?"
        message="Kamu yakin ingin keluar dari akun ini?"
        confirmLabel="Ya, Keluar"
        cancelLabel="Batal"
        tone="danger"
        onConfirm={handleConfirmLogout}
        onCancel={() => setConfirmOpen(false)}
      />
    </aside>
  );
}
