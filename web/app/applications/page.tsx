import { StatsGrid } from '@/components/ui/StatsGrid';
import { ApplicationsClient } from '@/components/application/ApplicationsClient';
import { ErrorState } from '@/components/feedback/ErrorState';
import {
  getMyApplications,
  getGigs,
  getUser,
} from '@/lib/supabase/queries';
import { requireUser, isSupabaseConfigured as _isSupabaseConfigured } from '@/lib/supabase/session';
import type { Gig, User } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ApplicationsPage() {
  if (!_isSupabaseConfigured()) {
    return (
      <PageShell>
        <ErrorState
          title="Belum terkoneksi ke Supabase"
          message="Halaman ini butuh data lamaran dari database."
          hint="Isi .env.local dan jalankan migration SQL."
        />
      </PageShell>
    );
  }

  // Require auth — redirect to /login if not signed in
  const currentUser = await requireUser('/applications');

  // Fetch all the data we need in parallel
  const [apps, gigsList] = await Promise.all([
    getMyApplications(),
    getGigs(),
  ]);

  // Build lookup maps for nested joins (gig + client)
  const gigsById: Record<string, Gig> = Object.fromEntries(
    gigsList.map((g) => [g.id, g]),
  );

  // Fetch each unique client referenced by an application
  const clientIds = Array.from(
    new Set(apps.map((a) => gigsById[a.gigId]?.clientId).filter(Boolean) as string[]),
  );
  const clients = await Promise.all(clientIds.map((id) => getUser(id)));
  const usersById: Record<string, User> = Object.fromEntries(
    clients.filter((u): u is User => u !== null).map((u) => [u.id, u]),
  );

  // Stats (computed from ALL apps, not filtered)
  const stats = {
    total:    apps.length,
    pending:  apps.filter((a) => a.status === 'pending').length,
    accepted: apps.filter((a) => a.status === 'accepted').length,
    rejected: apps.filter((a) => a.status === 'rejected').length,
  };

  return (
    <PageShell>
      <header className="px-1 -mt-2 mb-1">
        <p className="text-xs text-slate-500">
          Hai <span className="font-semibold text-slate-900">{currentUser.name}</span>, ini ringkasan lamaran kamu.
        </p>
      </header>
      {/* Stats */}
      <StatsGrid
        cols={4}
        stats={[
          { label: 'Total',    value: stats.total,    accent: 'from-indigo-500 to-violet-500', icon: '📨' },
          { label: 'Pending',  value: stats.pending,  accent: 'from-amber-500 to-amber-600',   icon: '⏳' },
          { label: 'Accepted', value: stats.accepted, accent: 'from-emerald-500 to-emerald-600', icon: '✅' },
          { label: 'Rejected', value: stats.rejected, accent: 'from-rose-500 to-rose-600',     icon: '❌' },
        ]}
      />
      <ApplicationsClient
        initialApps={apps}
        gigsById={gigsById}
        usersById={usersById}
      />
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <header>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-2">
          <span>✉️</span> STEP 4 OF 5
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Lamaran kamu
        </h1>
        <p className="mt-2 text-slate-600 max-w-2xl">
          Track semua proposal yang sudah kamu kirim. Klien biasanya merespons dalam
          2-5 hari kerja.
        </p>
      </header>
      {children}
    </div>
  );
}