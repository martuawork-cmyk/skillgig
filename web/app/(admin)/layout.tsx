import Link from 'next/link';
import { requireAdmin } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/supabase/session';
import { isSupabaseConfigured } from '@/components/feedback/ErrorState';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const NAV: { href: string; label: string; icon: string }[] = [
  { href: '/admin',              label: 'Dashboard',   icon: '📊' },
  { href: '/admin/gigs',         label: 'Gigs',        icon: '🛠️' },
  { href: '/admin/courses',      label: 'Kursus',      icon: '📚' },
  { href: '/admin/subscribers',  label: 'Subscribers', icon: '✉️' },
];

/**
 * Admin route group shell.
 *
 * Every page under `(admin)` lives behind this layout. We call `requireAdmin()`
 * which:
 *   - redirects to /login when the user has no session
 *   - redirects to / when the user is signed in but lacks role='admin' in
 *     auth.users.raw_user_meta_data
 *
 * The layout renders a sidebar + main area. The site-wide Header / Footer are
 * intentionally NOT included — admin is a focused workspace and shouldn't
 * carry marketing navigation.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defensive fallback — requireAdmin already redirects, but typing this
  // async returns User makes the assertion below safe.
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-[60vh] grid place-items-center px-4">
        <div className="max-w-md text-center">
          <p className="text-3xl mb-2">🛡️</p>
          <h1 className="text-lg font-bold text-slate-900">Admin belum tersedia</h1>
          <p className="text-sm text-slate-600 mt-1">
            Isi <code className="px-1 bg-slate-100 rounded">.env.local</code> dengan
            Supabase URL + anon key + service-role key, lalu restart dev server.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-semibold text-indigo-600 hover:underline"
          >
            ← Kembali ke beranda
          </Link>
        </div>
      </div>
    );
  }

  // requireAdmin returns the public User. It uses `redirect()` internally for
  // the unauthenticated / non-admin cases, so control only reaches here for
  // verified admins.
  const user = await requireAdmin('/admin');

  // If the public.users profile hasn't been populated yet (e.g. admin was
  // granted through auth metadata but the trigger hasn't run), fall back to
  // the auth email so the sidebar still has a name to show.
  const profile = await getCurrentUser();
  const displayName = profile?.name ?? user.name ?? 'Admin';
  const initials = profile?.initials ?? user.initials ?? 'AD';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Sidebar */}
        <aside className="lg:w-64 lg:shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200">
          <div className="px-5 py-5 border-b border-slate-100">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 grid place-items-center shadow-soft">
                <span className="text-white font-extrabold text-sm">SG</span>
              </div>
              <div className="leading-tight">
                <p className="font-extrabold text-slate-900 tracking-tight text-base">
                  SkillGig<span className="text-indigo-600">.id</span>
                </p>
                <p className="text-[10px] text-slate-500 -mt-0.5 uppercase tracking-wide font-bold">
                  Admin
                </p>
              </div>
            </Link>
          </div>

          <nav className="px-3 py-4 space-y-1">
            {NAV.map((item) => (
              <AdminNavLink key={item.href} item={item} />
            ))}
          </nav>

          <div className="px-5 py-4 mt-4 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center font-bold text-xs">
                {initials.slice(0, 2).toUpperCase()}
              </div>
              <div className="leading-tight min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {displayName}
                </p>
                <p className="text-[11px] text-slate-500">Administrator</p>
              </div>
            </div>
            <form action="/api/auth/signout" method="post" className="mt-3">
              <button
                type="submit"
                className="w-full text-left text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-2 py-1.5 rounded-md transition"
              >
                Keluar
              </button>
            </form>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          <header className="bg-white border-b border-slate-200 px-5 sm:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs uppercase tracking-wide font-bold text-slate-500">
                Admin Console
              </p>
              <Link
                href="/"
                className="text-xs font-semibold text-slate-500 hover:text-indigo-600"
              >
                ← Lihat situs publik
              </Link>
            </div>
          </header>
          <div className="px-5 sm:px-8 py-6 sm:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

function AdminNavLink({ item }: { item: { href: string; label: string; icon: string } }) {
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600',
        'hover:bg-slate-50 hover:text-indigo-600 transition',
      )}
    >
      <span aria-hidden className="text-base">
        {item.icon}
      </span>
      <span>{item.label}</span>
    </Link>
  );
}
