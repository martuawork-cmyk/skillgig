'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { migrateOldKeys } from './migration';
import { subscribeSkillAlert } from '@/lib/supabase/actions';

/**
 * SkillGig — global save store.
 *
 * Persists to localStorage at `skillgig.saved.v1`. One-time migration from
 * the 3 old per-component keys runs automatically on first hydration.
 *
 * Sections:
 *   - savedCourses   — courses the user has saved from /learn
 *   - savedGigs      — gigs the user has saved from /gigs + /earn
 *   - skillAlerts    — skills the user has subscribed to (also writes to
 *                      Supabase `subscribers` table when toggled on)
 *
 * Use `useSavedStore` from any client component to read or mutate.
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
  setHasHydrated: (v: boolean) => void;

  // Course actions
  saveCourse: (c: Omit<SavedCourse, 'savedAt'>) => void;
  unsaveCourse: (id: string) => void;
  toggleSaveCourse: (c: Omit<SavedCourse, 'savedAt'>) => void;
  isCourseSaved: (id: string) => boolean;

  // Gig actions
  saveGig: (g: Omit<SavedGig, 'savedAt'>) => void;
  unsaveGig: (id: string) => void;
  toggleSaveGig: (g: Omit<SavedGig, 'savedAt'>) => void;
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
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      // ---- Courses ----
      saveCourse: (c) =>
        set((s) =>
          s.savedCourses.some((x) => x.id === c.id)
            ? s
            : { savedCourses: [...s.savedCourses, { ...c, savedAt: Date.now() }] },
        ),
      unsaveCourse: (id) =>
        set((s) => ({ savedCourses: s.savedCourses.filter((x) => x.id !== id) })),
      toggleSaveCourse: (c) => {
        if (get().isCourseSaved(c.id)) get().unsaveCourse(c.id);
        else get().saveCourse(c);
      },
      isCourseSaved: (id) => get().savedCourses.some((x) => x.id === id),

      // ---- Gigs ----
      saveGig: (g) =>
        set((s) =>
          s.savedGigs.some((x) => x.id === g.id)
            ? s
            : { savedGigs: [...s.savedGigs, { ...g, savedAt: Date.now() }] },
        ),
      unsaveGig: (id) =>
        set((s) => ({ savedGigs: s.savedGigs.filter((x) => x.id !== id) })),
      toggleSaveGig: (g) => {
        if (get().isGigSaved(g.id)) get().unsaveGig(g.id);
        else get().saveGig(g);
      },
      isGigSaved: (id) => get().savedGigs.some((x) => x.id === id),

      // ---- Skill alerts (writes to Supabase) ----
      toggleAlert: async (skill) => {
        const active = get().isAlertActive(skill.skillId);
        if (active) {
          // Unsubscribe locally (no Supabase delete yet — Phase later)
          set((s) => ({
            skillAlerts: s.skillAlerts.filter((x) => x.skillId !== skill.skillId),
          }));
          return { subscribed: false };
        }
        // Subscribe: insert to Supabase subscribers
        const res = await subscribeSkillAlert(skill.skillId);
        if (res.error) {
          return { subscribed: false, error: res.error };
        }
        set((s) => ({
          skillAlerts: [
            ...s.skillAlerts,
            { ...skill, subscribedAt: Date.now() },
          ],
        }));
        return { subscribed: true };
      },
      isAlertActive: (skillId) => get().skillAlerts.some((x) => x.skillId === skillId),
    }),
    {
      name: 'skillgig.saved.v1',
      version: 2,
      partialize: (state) => ({
        savedCourses: state.savedCourses,
        savedGigs: state.savedGigs,
        skillAlerts: state.skillAlerts,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      // One-time migration from old keys. After this runs, the store is
      // populated and we can immediately write it under the new key.
      migrate: (persisted: unknown, fromVersion: number) => {
        if (fromVersion < 2) {
          // Merge with any data already at the new key, prefer new
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
