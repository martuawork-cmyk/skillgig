'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { UserMenu } from '@/components/layout/UserMenu';
import { cn } from '@/lib/utils';

const NAV = [
  { label: 'Learn',   href: '/learn'   },
  { label: 'Earn',    href: '/earn'    },
  { label: 'Roadmap', href: '/roadmap' },
];

type Props = {
  user: {
    name: string;
    initials: string;
    role: 'client' | 'freelancer';
    email?: string;
  } | null;
};

export function Header({ user }: Props) {
  const [open, setOpen] = useState(false);

  // Close drawer on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 border-b border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 grid place-items-center shadow-soft group-hover:scale-105 transition">
            <span className="text-white font-extrabold text-sm">SG</span>
          </div>
          <div className="leading-tight">
            <h1 className="font-extrabold text-slate-900 tracking-tight text-base">
              SkillGig<span className="text-indigo-600">.id</span>
            </h1>
            <p className="text-[10px] text-slate-500 -mt-0.5 hidden sm:block">
              Learn · Build · Earn
            </p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA / User menu */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <UserMenu
              name={user.name}
              initials={user.initials}
              role={user.role}
              email={user.email}
            />
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
              >
                Masuk
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 rounded-lg shadow-soft active:scale-[.98] transition"
              >
                <span aria-hidden>🚀</span>
                Mulai Gratis
              </Link>
            </>
          )}
        </div>

        {/* Mobile right side */}
        <div className="md:hidden flex items-center gap-2">
          {user && (
            <UserMenu
              name={user.name}
              initials={user.initials}
              role={user.role}
              email={user.email}
            />
          )}
          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label={open ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen(!open)}
            className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition"
          >
            {open ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        id="mobile-nav"
        className={cn(
          'md:hidden overflow-hidden border-t border-slate-200 bg-white transition-all duration-200 ease-out',
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
        )}
        aria-hidden={!open}
      >
        <nav className="px-4 py-3 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className="block px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition"
            >
              {item.label}
            </Link>
          ))}
          {!user && (
            <>
              <Link
                href="/login"
                onClick={close}
                className="block px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition"
              >
                Masuk
              </Link>
              <Link
                href="/signup"
                onClick={close}
                className="mt-2 block text-center px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 rounded-lg shadow-soft active:scale-[.98] transition"
              >
                <span aria-hidden>🚀</span> Mulai Gratis
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

/* ---------- Inline icons (Lucide-style, currentColor) ---------- */

function MenuIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="3" y1="6"  x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="18" y1="6"  x2="6"  y2="18" />
      <line x1="6"  y1="6"  x2="18" y2="18" />
    </svg>
  );
}