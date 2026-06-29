import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tag } from '@/components/ui/Tag';
import { Avatar } from '@/components/ui/Avatar';
import { ApplyForm } from '@/components/gig/ApplyForm';
import { gigs, getGig, getUser } from '@/lib/mock';
import {
  formatIDR,
  timeAgo,
  categoryColor,
  categoryLabel,
  levelColor,
  levelLabel,
} from '@/lib/utils';

export function generateStaticParams() {
  return gigs.map((g) => ({ id: g.id }));
}

export default function GigDetailPage({ params }: { params: { id: string } }) {
  const gig = getGig(params.id);
  if (!gig) notFound();

  const client = getUser(gig.clientId);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <Link
        href="/gigs"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-indigo-600 mb-4"
      >
        ← Kembali ke Discover Gig
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardBody className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={categoryColor(gig.category)}>
                  {categoryLabel(gig.category)}
                </Badge>
                <Badge className={levelColor(gig.level)}>
                  {levelLabel(gig.level)}
                </Badge>
                <span className="text-xs text-slate-500 ml-auto">
                  Posted {timeAgo(gig.postedAt)}
                </span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {gig.titleId}
                </h1>
                <p className="text-sm text-slate-500 mt-1 italic">
                  EN: {gig.title}
                </p>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="Budget" value={`${formatIDR(gig.budgetMin)} – ${formatIDR(gig.budgetMax)}`} />
                <Stat label="Durasi" value={`${gig.durationWeeks} minggu`} />
                <Stat label="Level" value={levelLabel(gig.level)} />
                <Stat label="Pelamar" value={`${gig.applicantsCount}`} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-bold text-slate-900">Deskripsi Project</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              <p className="text-slate-700 leading-relaxed">{gig.descriptionId}</p>
              <p className="text-sm text-slate-500 italic border-l-2 border-slate-200 pl-3">
                EN: {gig.description}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-bold text-slate-900">Skill yang dibutuhkan</h2>
            </CardHeader>
            <CardBody>
              <div className="flex flex-wrap gap-2">
                {gig.skillsRequired.map((s) => (
                  <Tag key={s} className="bg-indigo-50 text-indigo-700">
                    {s}
                  </Tag>
                ))}
              </div>
            </CardBody>
          </Card>

          {client && (
            <Card>
              <CardHeader>
                <h2 className="font-bold text-slate-900">Tentang Klien</h2>
              </CardHeader>
              <CardBody className="flex items-start gap-4">
                <Avatar initials={client.initials} size="lg" />
                <div className="flex-1">
                  <Link
                    href={`/profile/${client.id}`}
                    className="font-bold text-slate-900 hover:text-indigo-600"
                  >
                    {client.name}
                  </Link>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {client.location} · {client.completedGigs} gigs selesai · ⭐ {client.rating}
                  </p>
                  <p className="text-sm text-slate-600 mt-2">{client.bio}</p>
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar — Apply */}
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-32">
            <ApplyForm gigId={gig.id} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-100">
      <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
        {label}
      </p>
      <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">{value}</p>
    </div>
  );
}