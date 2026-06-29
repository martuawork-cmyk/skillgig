import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { ErrorState } from '@/components/feedback/ErrorState';
import { getUser, isSupabaseConfigured } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

export default async function ProfilePage({
  params,
}: {
  params: { id: string };
}) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <ErrorState
          title="Belum terkoneksi ke Supabase"
          message="Halaman profile butuh data dari database."
          hint="Isi .env.local dan jalankan migration SQL."
        />
      </div>
    );
  }

  const user = await getUser(params.id);
  if (!user) notFound();

  const isFreelancer = user.role === 'freelancer';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-indigo-600"
      >
        ← Beranda
      </Link>

      {/* Hero */}
      <Card>
        <CardBody className="flex flex-col sm:flex-row items-start gap-6">
          <Avatar initials={user.initials} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {user.name}
              </h1>
              <Badge className={isFreelancer ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}>
                {isFreelancer ? 'Freelancer' : 'Client'}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {user.location} · ⭐ {user.rating} · {user.completedGigs} gigs selesai
            </p>
            <p className="text-slate-700 mt-3 leading-relaxed">{user.bio}</p>
          </div>
        </CardBody>
      </Card>

      {/* Skills (freelancers only) */}
      {isFreelancer && user.skills.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-bold text-slate-900">Skills</h2>
          </CardHeader>
          <CardBody>
            <div className="flex flex-wrap gap-2">
              {user.skills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-md bg-indigo-50 text-indigo-700"
                >
                  {s}
                </span>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {isFreelancer ? (
          <>
            <ButtonLink href="/earn">Lihat Earnings</ButtonLink>
            <ButtonLink href="/applications" variant="secondary">
              Riwayat Lamaran
            </ButtonLink>
          </>
        ) : (
          <>
            <ButtonLink href="/gigs">Lihat Gigs Aktif</ButtonLink>
            <ButtonLink href="/earn" variant="secondary">
              Post Gig Baru
            </ButtonLink>
          </>
        )}
      </div>
    </div>
  );
}