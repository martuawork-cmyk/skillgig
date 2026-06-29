/**
 * One-time migration from the old per-component localStorage keys to the
 * unified Zustand store at `skillgig.saved.v1`.
 *
 * Old keys (Phase 4-5):
 *   - skillgig.saved_courses.v1
 *   - skillgig.saved_earn_gigs.v1
 *   - skillgig.saved_gigs.v1
 *
 * Each old key stored a JSON array of IDs (strings). We can't recover full
 * course/gig objects from IDs alone, so we seed minimal records with placeholders
 * that get enriched when the user revisits the listing pages (re-saving the
 * same item updates the placeholder).
 *
 * After migration, old keys are removed to free up localStorage.
 */

const OLD_KEYS = [
  'skillgig.saved_courses.v1',
  'skillgig.saved_earn_gigs.v1',
  'skillgig.saved_gigs.v1',
] as const;

type CourseRec = { id: string; title: string; platform: string; thumbnail: string; savedAt: number };
type GigRec    = { id: string; title: string; platform: string; savedAt: number };

export function migrateOldKeys(): {
  savedCourses: CourseRec[];
  savedGigs: GigRec[];
  skillAlerts: never[];
} {
  const out: {
    savedCourses: CourseRec[];
    savedGigs: GigRec[];
    skillAlerts: never[];
  } = { savedCourses: [], savedGigs: [], skillAlerts: [] };

  if (typeof window === 'undefined') return out;

  // 1. Courses
  try {
    const raw = localStorage.getItem(OLD_KEYS[0]);
    if (raw) {
      const ids: string[] = JSON.parse(raw);
      ids.forEach((id) => {
        out.savedCourses.push({
          id,
          title: id,
          platform: 'Unknown',
          thumbnail: '📘',
          savedAt: Date.now(),
        });
      });
    }
  } catch {
    /* ignore */
  }

  // 2. Earn gigs + 3. Gigs → merge into savedGigs (dedupe by id)
  const gigIds = new Set<string>();
  for (const key of [OLD_KEYS[1], OLD_KEYS[2]]) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const ids: string[] = JSON.parse(raw);
      ids.forEach((id) => gigIds.add(id));
    } catch {
      /* ignore */
    }
  }
  gigIds.forEach((id) => {
    out.savedGigs.push({
      id,
      title: id,
      platform: 'Unknown',
      savedAt: Date.now(),
    });
  });

  // Cleanup: remove old keys after migration
  try {
    OLD_KEYS.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }

  return out;
}
