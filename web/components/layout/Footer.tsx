import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { CATEGORIES } from '@/lib/types';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="mb-3">
              <Logo tone="light" size="sm" />
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Papan lowongan kerja remote global yang dikurasi untuk kandidat
              Indonesia. Cari, filter, dan lamar — plus review CV AI untuk
              memperbesar peluangmu diterima.
            </p>
            <p className="text-xs text-slate-500 mt-4">
              © 2026 SkillGig.id · All rights reserved.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Produk</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/jobs" className="hover:text-white">Lowongan Remote</Link></li>
              <li><Link href="/tools/cv-review" className="hover:text-white">Review CV AI</Link></li>
              <li><Link href="/pricing" className="hover:text-white">Harga</Link></li>
              <li><Link href="/roadmap" className="hover:text-white">Roadmap Skill</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Resources</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/about" className="hover:text-white">Tentang</Link></li>
              <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
              <li><a href="mailto:hello@skillgig.id" className="hover:text-white">Kontak</a></li>
            </ul>
          </div>
        </div>

        {/* Category links — internal linking for the /remote-jobs SEO pages so
            they're crawlable from every page, not just the sitemap. */}
        <div className="border-t border-slate-800 mt-8 pt-6">
          <h4 className="font-semibold text-white text-sm mb-3">Lowongan remote per kategori</h4>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-400">
            {CATEGORIES.map((c) => (
              <Link
                key={c.value}
                href={`/remote-jobs/${c.value}`}
                className="hover:text-white"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 text-xs text-slate-500 flex flex-col sm:flex-row justify-between gap-2">
          <p>© 2026 SkillGig.id · All rights reserved.</p>
          <p>Dibuat untuk pekerja remote Indonesia ❤️</p>
        </div>
      </div>
    </footer>
  );
}