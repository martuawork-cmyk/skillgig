import type { Metadata } from 'next';
import { CvReviewClient } from '@/components/tools/CvReviewClient';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Review CV AI Gratis — Optimasi CV untuk Kerja Remote | SkillGig.id',
  description:
    'Review CV kamu dengan AI: skor kesiapan, keramahan ATS, saran perbaikan, keyword, dan draft cover letter — dioptimalkan untuk lowongan remote global. Gratis untuk review pertama.',
  path: '/tools/cv-review',
});

export default function CvReviewPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="max-w-2xl mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold mb-4">
          <span aria-hidden>✨</span> Tools · Review CV AI
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Review CV kamu dengan AI
        </h1>
        <p className="mt-3 text-slate-600 leading-relaxed">
          Dapatkan skor kesiapan, keramahan ATS, saran perbaikan konkret, keyword
          yang kurang, plus draft cover letter — dioptimalkan untuk lowongan remote
          global. Review pertama gratis.
        </p>
      </div>
      <CvReviewClient />
    </div>
  );
}
