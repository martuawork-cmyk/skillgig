import Link from 'next/link';
import type { Metadata } from 'next';
import { Check } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Harga — Mulai Gratis, Upgrade Saat Butuh | SkillGig.id',
  description:
    'Harga sederhana untuk cari kerja remote: Gratis selamanya, atau Pro Rp 39K/bulan untuk lowongan tanpa batas, review CV AI tanpa batas, dan alert keyword. Bayar aman via Mayar.',
  path: '/pricing',
});

type Plan = {
  name: string;
  price: string;
  period: string;
  sub?: string;
  tagline: string;
  cta: { label: string; href: string };
  featured?: boolean;
  badge?: string;
  features: { label: string; soon?: boolean }[];
};

const PLANS: Plan[] = [
  {
    name: 'Gratis',
    price: 'Rp 0',
    period: '/bulan',
    tagline: 'Untuk mulai cari kerja remote.',
    cta: { label: 'Mulai Gratis', href: '/jobs' },
    features: [
      { label: '50 lowongan terbaru' },
      { label: 'Semua filter pencarian' },
      { label: 'Apply langsung ke perusahaan' },
      { label: '1× review CV AI' },
    ],
  },
  {
    name: 'Pro',
    price: 'Rp 39K',
    period: '/bulan',
    tagline: 'Untuk pencari kerja yang serius.',
    cta: { label: 'Upgrade Sekarang', href: '/tools/cv-review' },
    featured: true,
    badge: 'Populer',
    features: [
      { label: 'Semua lowongan tanpa batas' },
      { label: 'Review CV AI tanpa batas' },
      { label: 'Draft cover letter AI' },
      { label: 'Simpan lowongan favorit' },
      { label: 'Alert keyword lowongan', soon: true },
    ],
  },
  {
    name: 'Pro Tahunan',
    price: 'Rp 29K',
    period: '/bulan',
    sub: 'Dibayar Rp 349K/tahun · hemat 26%',
    tagline: 'Bayar setahun, lebih hemat.',
    cta: { label: 'Langganan Tahunan', href: '/tools/cv-review' },
    badge: 'Hemat 26%',
    features: [
      { label: 'Semua fitur Pro' },
      { label: 'Harga terkunci setahun penuh' },
    ],
  },
];

const FAQ = [
  {
    q: 'Kenapa lebih murah dari layanan lain?',
    a: 'Karena SkillGig baru mulai dan ingin bantu sebanyak mungkin pencari kerja Indonesia dulu. Harga Pro Rp 39K/bulan sudah termasuk review CV AI tanpa batas — fitur yang biasanya dijual terpisah.',
  },
  {
    q: 'Metode pembayarannya apa?',
    a: 'Pembayaran diproses aman lewat Mayar (QRIS, transfer bank, dan e-wallet). Kamu akan diarahkan ke halaman pembayaran Mayar saat upgrade.',
  },
  {
    q: 'Apa yang terjadi kalau saya pakai yang Gratis?',
    a: 'Kamu tetap bisa lihat 50 lowongan terbaru, pakai semua filter, apply langsung, dan mencoba review CV AI sekali. Upgrade kapan pun kamu butuh lebih.',
  },
];

export default function PricingPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold mb-4">
          <span aria-hidden>💸</span> Harga
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Mulai gratis. Upgrade saat butuh lebih.
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Tanpa kontrak, tanpa kejutan. Berhenti kapan saja.
        </p>
      </div>

      {/* Plans */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={
              plan.featured
                ? 'relative rounded-3xl bg-slate-900 text-white p-7 shadow-xl shadow-slate-900/20 lg:-mt-4 lg:mb-4'
                : 'relative rounded-3xl bg-white border border-slate-200 p-7 shadow-sm'
            }
          >
            {plan.badge && (
              <span
                className={
                  plan.featured
                    ? 'absolute top-6 right-6 text-[11px] font-bold px-2.5 py-1 rounded-full bg-white text-slate-900'
                    : 'absolute top-6 right-6 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700'
                }
              >
                {plan.badge}
              </span>
            )}

            <h2 className={plan.featured ? 'text-lg font-bold' : 'text-lg font-bold text-slate-900'}>
              {plan.name}
            </h2>
            <p className={plan.featured ? 'text-sm text-slate-300 mt-1' : 'text-sm text-slate-500 mt-1'}>
              {plan.tagline}
            </p>

            <div className="mt-5 flex items-end gap-1">
              <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
              <span className={plan.featured ? 'text-slate-400 mb-1' : 'text-slate-500 mb-1'}>
                {plan.period}
              </span>
            </div>
            {plan.sub && (
              <p className={plan.featured ? 'text-xs text-slate-400 mt-1' : 'text-xs text-slate-500 mt-1'}>
                {plan.sub}
              </p>
            )}

            <div className="mt-6">
              {plan.featured ? (
                <ButtonLink
                  href={plan.cta.href}
                  size="lg"
                  variant="secondary"
                  className="w-full bg-white text-slate-900 hover:bg-slate-100 border-0"
                >
                  {plan.cta.label}
                </ButtonLink>
              ) : (
                <ButtonLink href={plan.cta.href} size="lg" className="w-full">
                  {plan.cta.label}
                </ButtonLink>
              )}
            </div>

            <ul className="mt-7 space-y-3">
              {plan.features.map((f) => (
                <li key={f.label} className="flex items-start gap-2.5 text-sm">
                  <Check
                    className={
                      plan.featured
                        ? 'w-4 h-4 mt-0.5 shrink-0 text-emerald-400'
                        : 'w-4 h-4 mt-0.5 shrink-0 text-emerald-500'
                    }
                  />
                  <span className={plan.featured ? 'text-slate-200' : 'text-slate-700'}>
                    {f.label}
                    {f.soon && (
                      <span
                        className={
                          plan.featured
                            ? 'ml-1.5 text-[10px] font-semibold text-slate-400'
                            : 'ml-1.5 text-[10px] font-semibold text-slate-400'
                        }
                      >
                        (segera)
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-slate-500 mt-6">
        Pembayaran aman via Mayar (QRIS, transfer bank, e-wallet). Berhenti kapan saja.
      </p>

      {/* FAQ */}
      <div className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight text-center mb-8">
          Pertanyaan umum
        </h2>
        <div className="space-y-4">
          {FAQ.map((item) => (
            <div key={item.q} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-900">{item.q}</h3>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-14 text-center">
        <p className="text-slate-600">Belum yakin? Coba dulu yang gratis.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/jobs" size="lg">
            Lihat Lowongan
          </ButtonLink>
          <Link
            href="/tools/cv-review"
            className="inline-flex items-center px-5 py-3 text-sm font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            Coba Review CV gratis
          </Link>
        </div>
      </div>
    </div>
  );
}
