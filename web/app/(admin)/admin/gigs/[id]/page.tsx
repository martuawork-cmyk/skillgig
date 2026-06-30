import Link from 'next/link';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { adminListGigs } from '@/lib/supabase/admin-queries';
import { EditGigForm } from './EditGigForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Edit Gig — Admin SkillGig.id',
};

type Props = { params: { id: string } };

export default async function EditGigPage({ params }: Props) {
  const gigs = await adminListGigs();
  const gig = gigs.find((g) => g.id === params.id);

  if (!gig) {
    return (
      <div className="space-y-4">
        <Link href="/admin/gigs" className="text-sm text-indigo-600 hover:underline">
          ← Kembali ke daftar gig
        </Link>
        <EmptyState
          title="Gig tidak ditemukan"
          description="Mungkin sudah dihapus atau ID-nya salah."
          icon="🔎"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <Link href="/admin/gigs" className="text-xs text-indigo-600 hover:underline">
          ← Kembali ke daftar gig
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          Edit Gig
        </h1>
        <p className="text-sm text-slate-600 mt-1 truncate">{gig.title}</p>
      </header>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-bold text-slate-900">Detail gig</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Perubahan disimpan via server action. Status gig diubah dari tabel.
          </p>
        </CardHeader>
        <CardBody>
          <EditGigForm gig={gig} />
        </CardBody>
      </Card>
    </div>
  );
}
