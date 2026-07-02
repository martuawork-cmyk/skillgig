import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';

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
              Platform Indonesia yang menghubungkan pembelajaran skill digital
              dengan peluang freelance. Dari belajar, membangun skill, hingga
              menghasilkan uang dari karya kamu.
            </p>
            <p className="text-xs text-slate-500 mt-4">
              © 2026 SkillGig.id · All rights reserved.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Produk</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/jobs" className="hover:text-white">Lowongan Remote</Link></li>
              <li><Link href="/roadmap" className="hover:text-white">Roadmap Skill</Link></li>
              <li><span className="text-slate-500">Learn &amp; Earn <span className="text-[10px]">(segera)</span></span></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Resources</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/about" className="hover:text-white">About</Link></li>
              <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
              <li><a href="mailto:hello@skillgig.id" className="hover:text-white">Community</a></li>
              <li><a href="mailto:hello@skillgig.id" className="hover:text-white">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 text-xs text-slate-500 flex flex-col sm:flex-row justify-between gap-2">
          <p>© 2026 SkillGig.id · All rights reserved.</p>
          <p>Made with ❤️ for Indonesian freelancers</p>
        </div>
      </div>
    </footer>
  );
}