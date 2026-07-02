import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { GigCategory } from '@/lib/types';
import { getAllSkills } from '@/lib/supabase/queries';

/* Category display metadata — icon + human label + one-line "why it pays" pitch
   so each recommendation card reads as a curated suggestion, not a raw skill. */
const CATEGORY_META: Record<
  GigCategory,
  { icon: string; label: string; pitch: string; accent: string }
> = {
  'web-dev':   { icon: '💻', label: 'Web Development', pitch: 'Permintaan tertinggi & tarif project lumayan.',         accent: 'from-indigo-500 to-violet-500' },
  design:      { icon: '🎨', label: 'Design',          pitch: 'UI/UX & brand identity selalu dicari klien.',          accent: 'from-pink-500 to-rose-500' },
  'marketing': { icon: '📣', label: 'Digital Marketing',pitch: 'SEO, ads & copywriting = kebutuhan tiap bisnis.',      accent: 'from-amber-500 to-orange-500' },
  data:        { icon: '📊', label: 'Data & AI',        pitch: 'Skill premium dengan tarif tertinggi di pasar.',      accent: 'from-emerald-500 to-teal-500' },
  video:       { icon: '🎬', label: 'Video & Editting', pitch: 'Content video booming — klien butuh editor cepat.',    accent: 'from-sky-500 to-cyan-500' },
  writing:     { icon: '✍️', label: 'Writing',         pitch: 'Copywriting & teknis — entry point freelance termudah.', accent: 'from-violet-500 to-fuchsia-500' },
  other:       { icon: '🧩', label: 'Lainnya',          pitch: 'Skill niche dengan kompetisi rendah.',                accent: 'from-slate-500 to-slate-600' },
};

/**
 * "Top Rekomendasi Roadmap" — an illustration-rich strip of curated skill
 * roadmaps. Replaces the previously empty white area on /roadmap (before a
 * visitor picks a skill) and doubles as a recommendations block on the profile
 * page. Picks one representative skill per category from the live `skills`
 * table so the suggestions always reflect what's actually available.
 *
 * Server component: reads the skill catalog at request time and renders plain
 * links to /roadmap (the explorer handles the actual skill → timeline flow).
 */
export async function TopRoadmapRecommendations({ limit = 6 }: { limit?: number }) {
  const skills = await getAllSkills();

  // One representative skill per category (first hit wins), preserving the
  // CATEGORY_META order so the "top" recommendations stay stable.
  const seen = new Set<GigCategory>();
  const picks = [];
  for (const s of skills) {
    if (seen.has(s.category)) continue;
    seen.add(s.category);
    picks.push(s);
    if (picks.length >= limit) break;
  }

  if (picks.length === 0) {
    // No skills in the catalog yet — degrade to a single friendly CTA rather
    // than a blank card. Analytics/seed issues must never blank the section.
    return (
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-8 text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-white text-3xl shadow-soft">
          🗺️
        </div>
        <h3 className="text-lg font-bold text-slate-900">Jelajahi roadmap karier freelance</h3>
        <p className="mt-1 text-sm text-slate-600 max-w-md mx-auto">
          Pilih skill di Roadmap Explorer untuk lihat kursus, gig terkait, dan
          estimasi pendapatan langkah demi langkah.
        </p>
        <Link
          href="/roadmap"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-indigo-700"
        >
          Buka Roadmap Explorer
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-indigo-600">
            <span aria-hidden>⭐</span> TOP REKOMENDASI
          </div>
          <h2 className="mt-1 text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Mulai dari roadmap paling dicari
          </h2>
          <p className="mt-1 text-sm text-slate-600 max-w-xl">
            Belum tahu mulai dari mana? Ini skill dengan permintaan tertinggi di
            pasar freelance Indonesia.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {picks.map((s) => {
          const meta = CATEGORY_META[s.category] ?? CATEGORY_META.other;
          const icon = s.icon ?? meta.icon;
          return (
            <Link
              key={s.id}
              href="/roadmap"
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
            >
              <div
                aria-hidden
                className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${meta.accent} opacity-10 transition group-hover:opacity-20`}
              />
              <div
                aria-hidden
                className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${meta.accent} text-2xl shadow-sm`}
              >
                {icon}
              </div>
              <h3 className="mt-3 font-bold text-slate-900 group-hover:text-indigo-600 transition">
                {s.name}
              </h3>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                {meta.label}
              </p>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{meta.pitch}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600">
                Lihat roadmap
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
