'use client';

import { ArrowRight } from 'lucide-react';
import type { RoadmapPick } from './categoryMeta';
import type { SkillHit } from './SkillAutocomplete';

type Props = {
  picks: RoadmapPick[];
  /** Fired with a full SkillHit so the explorer can setSelected + fetch. */
  onPick: (hit: SkillHit) => void;
};

/**
 * "Top Rekomendasi Roadmap" — curated, clickable skill cards rendered inside
 * the RoadmapExplorer. Unlike the old server `<Link href="/roadmap">` cards
 * (which did nothing once you were already on /roadmap), clicking a card here
 * calls `onPick` directly so the explorer selects the skill and fetches its
 * roadmap in place — no redirect, no re-typing.
 */
export function RoadmapPicks({ picks, onPick }: Props) {
  if (picks.length === 0) return null;

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
            Belum tahu mulai dari mana? Klik salah satu skill untuk langsung
            melihat kursus, gig, dan estimasi pendapatannya.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {picks.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() =>
              onPick({ id: p.id, name: p.name, category: p.category, icon: p.icon })
            }
            className="group relative overflow-hidden text-left rounded-2xl border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
          >
            <div
              aria-hidden
              className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${p.accent} opacity-10 transition group-hover:opacity-20`}
            />
            <div
              aria-hidden
              className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${p.accent} text-2xl shadow-sm`}
            >
              {p.icon}
            </div>
            <h3 className="mt-3 font-bold text-slate-900 group-hover:text-indigo-600 transition">
              {p.name}
            </h3>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
              {p.label}
            </p>
            <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{p.pitch}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600">
              Lihat roadmap
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
