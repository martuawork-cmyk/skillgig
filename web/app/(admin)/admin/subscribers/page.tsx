import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import { adminListSubscribersWithSkill } from '@/lib/supabase/admin-queries';
import { DeleteSubscriberButton } from './DeleteSubscriberButton';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Subscribers — Admin SkillGig.id',
};

export default async function AdminSubscribersPage() {
  const subscribers = await adminListSubscribersWithSkill();

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Subscribers
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Email yang opt-in untuk newsletter atau alert skill tertentu.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500">
            Total:{' '}
            <span className="font-bold text-slate-900">
              {subscribers.length.toLocaleString('id-ID')}
            </span>
          </div>
          <a
            href="/admin/subscribers/export"
            download="skillgig-subscribers.csv"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 rounded-lg shadow-soft active:scale-[.98] transition"
          >
            <span aria-hidden>⬇</span>
            Export CSV
          </a>
        </div>
      </header>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-bold text-slate-900">Semua subscribers</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Baris dengan kolom skill kosong menunjukkan opt-in newsletter umum.
          </p>
        </CardHeader>
        <CardBody className="p-0">
          {subscribers.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="Belum ada subscriber"
                description="Opt-in pertama akan muncul di sini."
                icon="✉️"
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-100">
                    <th className="px-5 py-3 font-semibold">Email</th>
                    <th className="px-5 py-3 font-semibold">Skill</th>
                    <th className="px-5 py-3 font-semibold">Kategori</th>
                    <th className="px-5 py-3 font-semibold">Tanggal daftar</th>
                    <th className="px-5 py-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                    >
                      <td className="px-5 py-3 font-medium text-slate-900 max-w-xs truncate">
                        {s.email}
                      </td>
                      <td className="px-5 py-3">
                        {s.skillName ? (
                          <Badge tone="indigo">{s.skillName}</Badge>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {s.skillCategory ? (
                          <Badge tone="violet">{s.skillCategory}</Badge>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                        {formatDate(s.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <DeleteSubscriberButton id={s.id} email={s.email} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
