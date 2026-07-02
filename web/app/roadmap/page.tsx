import type { Metadata } from 'next';
import { RoadmapExplorer } from '@/components/roadmap/RoadmapExplorer';
import { buildRoadmapPicks } from '@/components/roadmap/categoryMeta';
import { buildMetadata } from '@/lib/seo';
import { getAllSkills } from '@/lib/supabase/queries';

export const metadata: Metadata = buildMetadata({
  title: 'Roadmap Karier Freelance Indonesia | SkillGig.id',
  description:
    'Lihat roadmap step-by-step untuk setiap skill digital: kursus rekomendasi, gig terkait, dan estimasi pendapatan di pasar freelance Indonesia.',
  path: '/roadmap',
});

export default async function RoadmapPage() {
  // Curated "top" recommendations — one representative skill per category,
  // computed server-side so the client explorer just renders them. Clicking a
  // card selects the skill and fetches its roadmap in place (no redirect).
  const picks = buildRoadmapPicks(await getAllSkills());

  return (
    <div className="space-y-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
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

        <RoadmapExplorer recommendations={picks} />
      </div>
    </div>
  );
}
