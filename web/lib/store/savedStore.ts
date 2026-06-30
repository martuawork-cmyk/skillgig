'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { migrateOldKeys } from './migration';
import { subscribeSkillAlert } from '@/lib/supabase/actions';
import {
  getSavedItems,
  saveItem as sbSaveItem,
  unsaveItem as sbUnsaveItem,
  type SavedItemRow,
} from '@/lib/supabase/save-queries';

/**
 * SkillGig — global save store.
 *
 * Persists to localStorage at `skillgig.saved.v1` for instant first paint,
 * then syncs to Supabase `saved_items` for cross-device persistence.
 *
 * Sections:
 *   - savedCourses   — courses the user has saved from /learn
 *   - savedGigs      — gigs the user has saved from /gigs + /earn
 *   - skillAlerts    — skills the user has subscribed to (also writes to
 *                      Supabase `subscribers` table when toggled on)
 *
 * Hydration model:
 *   1. zustand/persist rehydrates from localStorage → instant UI.
 *   2. `hydrateFromSupabase()` is called from a one-time client effect to
 *      pull authoritative rows from `saved_items` and merge them in
 *      (Supabase wins for items already saved server-side; new local rows
 *      get pushed up via `syncPendingSaves`).
 *
 * Why both? localStorage makes the buttons feel instant even before
 * Supabase is configured (dev), while the table backs cross-device syncs
 * after login.
 */

export type SavedCourse = {
  id: string;
  title: string;
  platform: string;
  thumbnail: string;
  savedAt: number;
};

export type SavedGig = {
  id: string;
  title: string;
  platform: string;
  savedAt: number;
};

export type SkillAlert = {
  skillId: string;
  skillName: string;
  skillIcon: string;
  subscribedAt: number;
};

type State = {
  savedCourses: SavedCourse[];
  savedGigs: SavedGig[];
  skillAlerts: SkillAlert[];

  // Hydration
  _hasHydrated: boolean;
  _serverSynced: boolean;
  setHasHydrated: (v: boolean) => void;

  // Supabase sync
  hydrateFromSupabase: () => Promise<void>;
  syncPendingSaves: () => Promise<void>;

  // Course actions
  saveCourse: (c: Omit<SavedCourse, 'savedAt'>) => Promise<void>;
  unsaveCourse: (id: string) => Promise<void>;
  toggleSaveCourse: (c: Omit<SavedCourse, 'savedAt'>) => Promise<void>;
  isCourseSaved: (id: string) => boolean;

  // Gig actions
  saveGig: (g: Omit<SavedGig, 'savedAt'>) => Promise<void>;
  unsaveGig: (id: string) => Promise<void>;
  toggleSaveGig: (g: Omit<SavedGig, 'savedAt'>) => Promise<void>;
  isGigSaved: (id: string) => boolean;

  // Skill alert actions
  toggleAlert: (skill: {
    skillId: string;
    skillName: string;
    skillIcon: string;
  }) => Promise<{ subscribed: boolean; error?: string }>;
  isAlertActive: (skillId: string) => boolean;
};

export const useSavedStore = create<State>()(
  persist(
    (set, get) => ({
      savedCourses: [],
      savedGigs: [],
      skillAlerts: [],
      _hasHydrated: false,
      _serverSynced: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      // ---- Supabase sync ----
      hydrateFromSupabase: async () => {
        // Guarded so dev re-renders don't refetch on every render.
        if (get()._serverSynced) return;
        if (typeof window === 'undefined') return;
        try {
          const rows = await getSavedItems();
          if (!Array.isArray(rows)) return;

          const remoteCourses: SavedCourse[] = rows
            .filter((r) => r.item_type === 'course')
            .map((r) => ({
              id: r.item_id,
              title: r.item_id,            // overwritten by /learn reload
              platform: 'Unknown',
              thumbnail: '📘',
              savedAt: Date.parse(r.created_at) || Date.now(),
            }));
          const remoteGigs: SavedGig[] = rows
            .filter((r) => r.item_type === 'gig')
            .map((r) => ({
              id: r.item_id,
              title: r.item_id,            // overwritten by /earn reload
              platform: 'Unknown',
              savedAt: Date.parse(r.created_at) || Date.now(),
            }));

          set((s) => {
            // Merge: dedupe by id; prefer the local record when both exist
            // so the user-visible title/platform/thumbnail stays rich.
            const mergedCourses = mergeSaved(s.savedCourses, remoteCourses);
            const mergedGigs = mergeSaved(s.savedGigs, remoteGigs);
            return {
              savedCourses: mergedCourses,
              savedGigs: mergedGigs,
              _serverSynced: true,
            };
          });
        } catch {
          set({ _serverSynced: true });
        }
      },

      syncPendingSaves: async () => {
        // Push any locally-saved items the server doesn't know about. This
        // happens once after hydration, mostly so the first session after
        // a fresh migration of the table picks up saves made previously.
        const state = get();
        if (!state._hasHydrated) return;
        const tasks: Promise<unknown>[] = [];
        for (const c of state.savedCourses) {
          tasks.push(sbSaveItem('course', c.id));
        }
        for (const g of state.savedGigs) {
          tasks.push(sbSaveItem('gig', g.id));
        }
        await Promise.allSettled(tasks);
      },

      // ---- Courses ----
      saveCourse: async (c) => {
        if (get().isCourseSaved(c.id)) return;
        // Optimistic local update first so the UI is instant.
        set((s) => ({
          savedCourses: [...s.savedCourses, { ...c, savedAt: Date.now() }],
        }));
        const res = await sbSaveItem('course', c.id);
        if (!res.ok) {
          // Roll back on failure so the optimistic state doesn't lie.
          set((s) => ({ savedCourses: s.savedCourses.filter((x) => x.id !== c.id) }));
        }
      },
      unsaveCourse: async (id) => {
        const prev = get().savedCourses;
        set((s) => ({ savedCourses: s.savedCourses.filter((x) => x.id !== id) }));
        const res = await sbUnsaveItem('course', id);
        if (!res.ok) {
          // Roll back so the user can retry.
          set({ savedCourses: prev });
        }
      },
      toggleSaveCourse: async (c) => {
        if (get().isCourseSaved(c.id)) await get().unsaveCourse(c.id);
        else await get().saveCourse(c);
      },
      isCourseSaved: (id) => get().savedCourses.some((x) => x.id === id),

      // ---- Gigs ----
      saveGig: async (g) => {
        if (get().isGigSaved(g.id)) return;
        set((s) => ({
          savedGigs: [...s.savedGigs, { ...g, savedAt: Date.now() }],
        }));
        const res = await sbSaveItem('gig', g.id);
        if (!res.ok) {
          set((s) => ({ savedGigs: s.savedGigs.filter((x) => x.id !== g.id) }));
        }
      },
      unsaveGig: async (id) => {
        const prev = get().savedGigs;
        set((s) => ({ savedGigs: s.savedGigs.filter((x) => x.id !== id) }));
        const res = await sbUnsaveItem('gig', id);
        if (!res.ok) {
          set({ savedGigs: prev });
        }
      },
      toggleSaveGig: async (g) => {
        if (get().isGigSaved(g.id)) await get().unsaveGig(g.id);
        else await get().saveGig(g);
      },
      isGigSaved: (id) => get().savedGigs.some((x) => x.id === id),

      // ---- Skill alerts (writes to Supabase) ----
      toggleAlert: async (skill) => {
        const active = get().isAlertActive(skill.skillId);
        if (active) {
          set((s) => ({
            skillAlerts: s.skillAlerts.filter((x) => x.skillId !== skill.skillId),
          }));
          return { subscribed: false };
        }
        const res = await subscribeSkillAlert(skill.skillId);
        if (res.error) {
          return { subscribed: false, error: res.error };
        }
        set((s) => ({
          skillAlerts: [...s.skillAlerts, { ...skill, subscribedAt: Date.now() }],
        }));
        return { subscribed: true };
      },
      isAlertActive: (skillId) => get().skillAlerts.some((x) => x.skillId === skillId),
    }),
    {
      name: 'skillgig.saved.v1',
      version: 3,
      partialize: (state) => ({
        savedCourses: state.savedCourses,
        savedGigs: state.savedGigs,
        skillAlerts: state.skillAlerts,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      migrate: (persisted: unknown, fromVersion: number) => {
        if (fromVersion < 3) {
          const fromOld = migrateOldKeys();
          const p = (persisted as Partial<Pick<State, 'savedCourses' | 'savedGigs' | 'skillAlerts'>>) ?? {};
          return {
            savedCourses: dedupeById([
              ...((p.savedCourses as SavedCourse[] | undefined) ?? []),
              ...fromOld.savedCourses,
            ]),
            savedGigs: dedupeById([
              ...((p.savedGigs as SavedGig[] | undefined) ?? []),
              ...fromOld.savedGigs,
            ]),
            skillAlerts:
              (p.skillAlerts as SkillAlert[] | undefined) ?? fromOld.skillAlerts,
          };
        }
        return persisted as State;
      },
    },
  ),
);

/* ----- helpers ----- */

function dedupeById<T extends { id: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of arr) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      out.push(item);
    }
  }
  return out;
}

/**
 * Merge two save lists, preferring the local copy when both exist (local
 * has the rich title / thumbnail / platform). Remote-only rows fill in
 * with placeholder values that get overwritten the next time the user
 * visits the listing page.
 */
function mergeSaved<T extends { id: string; savedAt: number }>(
  local: T[],
  remote: T[],
): T[] {
  const out: T[] = [...local];
  const localIds = new Set(local.map((x) => x.id));
  for (const r of remote) {
    if (!localIds.has(r.id)) out.push(r);
  }
  return out;
}

/**
 * Convenience selector: derive a Set of saved item ids for quick lookup
 * (used by listings that render many cards).
 */
export function selectSavedItemIds(state: State): Set<string> {
  return new Set([
    ...state.savedCourses.map((c) => c.id),
    ...state.savedGigs.map((g) => g.id),
  ]);
}

// Re-export for callers that want raw server rows.
export type { SavedItemRow };