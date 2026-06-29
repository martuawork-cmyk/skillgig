import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { CURRENT_USER_ID } from '@/lib/mock';
import { getUser } from '@/lib/mock';

export function Header() {
  const user = getUser(CURRENT_USER_ID);

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 border-b border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 grid place-items-center shadow-soft group-hover:scale-105 transition">
            <span className="text-white font-extrabold text-sm">SG</span>
          </div>
          <div className="leading-tight">
            <h1 className="font-extrabold text-slate-900 tracking-tight text-base">
              SkillGig<span className="text-indigo-600">.id</span>
            </h1>
            <p className="text-[10px] text-slate-500 -mt-0.5">Learn · Build · Earn</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <NavLink href="/gigs" label="Discover Gigs" />
          <NavLink href="/learn" label="Learn" />
          <NavLink href="/skills" label="My Skills" />
          <NavLink href="/earn" label="Earn" />
        </nav>

        <div className="flex items-center gap-2">
          {user && (
            <Link
              href={`/profile/${user.id}`}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition"
              title={user.name}
            >
              <Avatar initials={user.initials} size="sm" />
              <span className="hidden sm:inline text-sm font-medium text-slate-700">
                {user.name.split(' ')[0]}
              </span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
    >
      {label}
    </Link>
  );
}