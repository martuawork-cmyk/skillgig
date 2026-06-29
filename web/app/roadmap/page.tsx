import { RoadmapExplorer } from '@/components/roadmap/RoadmapExplorer';

export const metadata = {
  title: 'Roadmap Explorer — SkillGig.id',
  description:
    'Lihat roadmap step-by-step untuk belajar skill baru: skill, kursus, gig, dan estimasi pendapatan.',
};

export default function RoadmapPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <header className="mb-4 sm:mb-6 px-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
          <span>🗺️</span> EKSPLORASI SKILL
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Roadmap Explorer
        </h1>
        <p className="mt-1 text-sm text-slate-600 max-w-lg">
          Pilih skill, lihat path visual dari belajar sampai menghasilkan.
        </p>
      </header>

      <RoadmapExplorer />
    </div>
  );
}