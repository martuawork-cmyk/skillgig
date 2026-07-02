import type { GigCategory } from '@/lib/types';
import type { CatalogSkill } from '@/lib/supabase/queries';

/**
 * Category display metadata for the /roadmap recommendation cards — icon +
 * human label + one-line "why it pays" pitch + the tailwind gradient accent.
 * Shared by the server (page picks the representative skill per category) and
 * the client card renderer so they never drift apart.
 */
export const ROADMAP_CATEGORY_META: Record<
  GigCategory,
  { icon: string; label: string; pitch: string; accent: string }
> = {
  'web-dev':   { icon: '💻', label: 'Web Development',  pitch: 'Permintaan tertinggi & tarif project lumayan.',          accent: 'from-indigo-500 to-violet-500' },
  design:      { icon: '🎨', label: 'Design',           pitch: 'UI/UX & brand identity selalu dicari klien.',           accent: 'from-pink-500 to-rose-500' },
  'marketing': { icon: '📣', label: 'Digital Marketing', pitch: 'SEO, ads & copywriting = kebutuhan tiap bisnis.',       accent: 'from-amber-500 to-orange-500' },
  data:        { icon: '📊', label: 'Data & AI',        pitch: 'Skill premium dengan tarif tertinggi di pasar.',       accent: 'from-emerald-500 to-teal-500' },
  video:       { icon: '🎬', label: 'Video & Editting', pitch: 'Content video booming — klien butuh editor cepat.',     accent: 'from-sky-500 to-cyan-500' },
  writing:     { icon: '✍️', label: 'Writing',          pitch: 'Copywriting & teknis — entry point freelance termudah.', accent: 'from-violet-500 to-fuchsia-500' },
  other:       { icon: '🧩', label: 'Lainnya',          pitch: 'Skill niche dengan kompetisi rendah.',                 accent: 'from-slate-500 to-slate-600' },
};

/**
 * One clickable recommendation: a real skill from the catalog, enriched with
 * its category's display metadata. `icon` is resolved to a non-empty string
 * (falls back to the category icon) so the card always has something to show.
 */
export type RoadmapPick = {
  id: string;
  name: string;
  category: GigCategory;
  icon: string;
  label: string;
  pitch: string;
  accent: string;
};

/**
 * Pick one representative skill per category (first hit wins), preserving the
 * ROADMAP_CATEGORY_META key order so the "top" recommendations stay stable.
 * Runs server-side in the /roadmap page; the result is handed to the client
 * RoadmapExplorer as plain props.
 */
export function buildRoadmapPicks(
  skills: CatalogSkill[],
  limit = 6,
): RoadmapPick[] {
  const seen = new Set<GigCategory>();
  const picks: RoadmapPick[] = [];
  for (const s of skills) {
    if (seen.has(s.category)) continue;
    seen.add(s.category);
    const meta = ROADMAP_CATEGORY_META[s.category] ?? ROADMAP_CATEGORY_META.other;
    picks.push({
      id: s.id,
      name: s.name,
      category: s.category,
      icon: s.icon ?? meta.icon,
      label: meta.label,
      pitch: meta.pitch,
      accent: meta.accent,
    });
    if (picks.length >= limit) break;
  }
  return picks;
}
