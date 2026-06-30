'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { signOut } from '@/lib/supabase/actions';
import { cn } from '@/lib/utils';

type Props = {
  userId: string;
  name: string;
  initials: string;
  role: 'client' | 'freelancer';
  email?: string;
};

export function UserMenu({ userId, name, initials, role, email }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function onSignOut() {
    await signOut();
    setOpen(false);
    // Hard reload to clear any client-side state
    window.location.href = '/';
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition"
      >
        <Avatar initials={initials} size="sm" />
        <span className="hidden sm:inline text-sm font-medium text-slate-700 max-w-[120px] truncate">
          {name}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400" aria-hidden>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-40"
        >
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-900 truncate">{name}</p>
            {email && <p className="text-xs text-slate-500 truncate">{email}</p>}
            <span
              className={cn(
                'inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full',
                role === 'freelancer' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700',
              )}
            >
              {role}
            </span>
          </div>

          <ul className="py-1">
            <li>
              <Link
                href={`/profile/${userId}`}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                👤 Profil Saya
              </Link>
            </li>
            <li>
              <Link
                href="/applications"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                📨 Lamaran saya
              </Link>
            </li>
            <li>
              <Link
                href="/skills"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                🛠️ Skill saya
              </Link>
            </li>
            <li>
              <Link
                href="/earn"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                💰 Earn
              </Link>
            </li>
            <li className="border-t border-slate-100 mt-1 pt-1">
              <button
                type="button"
                role="menuitem"
                onClick={onSignOut}
                className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 font-semibold"
              >
                Sign out
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}