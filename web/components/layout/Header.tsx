'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { UserMenu } from '@/components/layout/UserMenu';
import { Logo } from '@/components/brand/Logo';
import { cn } from '@/lib/utils';

// Focused nav — the wedge is the remote job board. Learn / Earn / Dashboard are
// hidden (coming soon): their routes still exist but are unlinked so the product
// reads as one sharp thing, not three half-built ones. Only routes that exist
// are linked here (no dead links). Re-add Tools/Pricing once those pages ship.
const NAV = [
  { label: 'Lowongan',      href: '/jobs'            },
  { label: 'Review CV',     href: '/tools/cv-review' },
  { label: 'Roadmap',       href: '/roadmap'         },
  { label: 'Tentang',       href: '/about'           },
];

type Props = {
  user: {
    id: string;
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
        {/* Logo — inline SVG mark + wordmark (no network request, crisp at any
            size). The wordmark is a <span>, not an <h1>: every page renders its
            own <h1> for the page title, so the logo must not introduce a second
            top-level heading (WCAG: one h1 per page). */}
        <Link
          href="/"
          aria-label="SkillGig.id — beranda"
          className="flex items-center group shrink-0"
        >
          <Logo
            size="md"
            tagline="Learn · Build · Earn"
            className="transition-opacity group-hover:opacity-90"
          />
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
          {user && (
            <Link
              href={`/profile/${user.id}`}
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
            >
              Profil Saya
            </Link>
          )}
        </nav>

        {/* Desktop CTA / User menu */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <UserMenu
              userId={user.id}
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
              userId={user.id}
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
          {user && (
            <Link
              href={`/profile/${user.id}`}
              onClick={close}
              className="block px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition"
            >
              Profil Saya
            </Link>
          )}
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