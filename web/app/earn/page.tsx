import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatIDR } from '@/lib/utils';

const MONTHLY = [
  { month: 'Jan', value: 3_200_000 },
  { month: 'Feb', value: 4_500_000 },
  { month: 'Mar', value: 5_800_000 },
  { month: 'Apr', value: 4_200_000 },
  { month: 'Mei', value: 7_100_000 },
  { month: 'Jun', value: 8_400_000 },
];

const PAYOUTS = [
  { id: 'p1', gig: 'Landing page Tokopedia', date: '2026-06-25', amount: 12_500_000, status: 'cleared' },
  { id: 'p2', gig: 'Migrasi WP ke Next.js', date: '2026-06-18', amount: 16_000_000, status: 'pending' },
  { id: 'p3', gig: 'UI design onboarding flow', date: '2026-06-10', amount: 6_500_000,  status: 'cleared' },
  { id: 'p4', gig: 'Dashboard analytics v2', date: '2026-05-28', amount: 9_800_000,  status: 'cleared' },
  { id: 'p5', gig: 'Blog content SEO batch', date: '2026-05-20', amount: 4_200_000,  status: 'cleared' },
];

export default function EarnPage() {
  const total = MONTHLY.reduce((s, m) => s + m.value, 0);
  const max = Math.max(...MONTHLY.map((m) => m.value));
  const thisMonth = MONTHLY[MONTHLY.length - 1].value;
  const pending = PAYOUTS.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <header>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-2">
          <span>💰</span> STEP 5 OF 5
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Earnings kamu
        </h1>
        <p className="mt-2 text-slate-600 max-w-2xl">
          Semua cuan dari gig yang sudah kamu selesaikan. Tarik ke rekening kapan saja.
        </p>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="Total earnings"
          value={formatIDR(total)}
          accent="from-indigo-600 to-violet-600"
          trend="+24% YoY"
        />
        <SummaryCard
          label="Bulan ini"
          value={formatIDR(thisMonth)}
          accent="from-emerald-500 to-emerald-600"
          trend="+18% dari bulan lalu"
        />
        <SummaryCard
          label="Pending payout"
          value={formatIDR(pending)}
          accent="from-amber-500 to-amber-600"
          trend="2 transaksi dalam proses"
        />
      </div>

      {/* Monthly chart */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Pendapatan 6 bulan terakhir</h2>
          <span className="text-xs text-slate-500">Mock data</span>
        </CardHeader>
        <CardBody>
          <div className="flex items-end justify-between gap-2 h-48">
            {MONTHLY.map((m) => {
              const h = (m.value / max) * 100;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col justify-end h-full">
                    <div
                      className="w-full bg-gradient-to-t from-indigo-600 to-violet-500 rounded-t-lg transition-all hover:opacity-80 relative group"
                      style={{ height: `${h}%` }}
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition bg-slate-900 text-white text-[10px] font-semibold px-2 py-1 rounded whitespace-nowrap">
                        {formatIDR(m.value)}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-slate-500">{m.month}</p>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Recent payouts */}
      <Card>
        <CardHeader>
          <h2 className="font-bold text-slate-900">Payout terbaru</h2>
        </CardHeader>
        <CardBody className="px-0 sm:px-0 py-0">
          <ul className="divide-y divide-slate-100">
            {PAYOUTS.map((p) => (
              <li key={p.id} className="px-5 sm:px-6 py-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{p.gig}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{p.date}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge className={p.status === 'cleared' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                    {p.status === 'cleared' ? 'Cleared' : 'Pending'}
                  </Badge>
                  <p className="font-bold text-slate-900 tabular-nums w-32 text-right">
                    {formatIDR(p.amount)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
  trend,
}: {
  label: string;
  value: string;
  accent: string;
  trend: string;
}) {
  return (
    <Card>
      <CardBody>
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${accent} mb-3`} />
        <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
          {label}
        </p>
        <p className="text-2xl font-extrabold text-slate-900 mt-1">{value}</p>
        <p className="text-xs text-emerald-600 mt-2 font-semibold">{trend}</p>
      </CardBody>
    </Card>
  );
}