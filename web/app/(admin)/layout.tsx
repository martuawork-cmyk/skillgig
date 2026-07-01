import Link from 'next/link';
import { requireAdmin, isAdminConfigured } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/supabase/session';
import { isSupabaseConfigured } from '@/components/feedback/ErrorState';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

export const dynamic = 'force-dynamic';

// Plus Jakarta Sans is loaded in the root layout and exposed as the
// `--font-jakarta` CSS variable. The admin workspace opts in here so the
// marketing site keeps Inter while admin uses Jakarta throughout.
const JAKARTA_FONT =
  'var(--font-jakarta), ui-sans-serif, system-ui, -apple-system, sans-serif';

/**
 * Admin route group shell.
 *
 * Every page under `(admin)` lives behind this layout. We call `requireAdmin()`
 * which:
 *   - redirects to /login when the user has no session
 *   - redirects to / when the user is signed in but lacks role='admin' in
 *     auth.users.raw_user_meta_data
 *
 * The shell is a fixed 260px sidebar (logo, nav, user + logout) plus a right
 * column with a sticky 64px header (breadcrumb + user menu) and an independently
 * scrolling content area. The site-wide Header / JourneyNav / Footer are kept
 * off admin pages via `SiteChrome` in the root layout.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defensive fallback — requireAdmin already redirects, but typing this
  // async returns User makes the assertion below safe.
  // NOTE: the admin layer additionally needs SUPABASE_SERVICE_ROLE_KEY (every
  // admin query goes through createAdminClient(), which throws when it is
  // missing). isSupabaseConfigured() only checks URL + anon key, so without
  // the isAdminConfigured() term a logged-in admin would 500 on the dashboard
  // instead of seeing this setup fallback. Keep both checks.
  if (!isSupabaseConfigured() || !isAdminConfigured()) {
    return (
      <div
        className="min-h-[60vh] grid place-items-center px-4"
        style={{ fontFamily: JAKARTA_FONT }}
      >
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
  // the auth identity so the sidebar still has a name to show.
  const profile = await getCurrentUser();
  const displayName = profile?.name ?? user.name ?? 'Admin';
  const initials = profile?.initials ?? user.initials ?? 'AD';

  const adminUser = { name: displayName, initials };

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: JAKARTA_FONT }}>
      {/* Fixed left sidebar — pinned to the viewport, does not scroll. */}
      <AdminSidebar user={adminUser} />

      {/* Right column: offset by the 260px sidebar, full viewport height so the
          header stays put while only the content area scrolls. */}
      <div className="ml-[260px] flex h-screen flex-col">
        <AdminHeader user={adminUser} />
        {/* flex-1 after the 64px header == calc(100vh - 64px); scrolls on its own. */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">{children}</main>
      </div>
    </div>
  );
}
