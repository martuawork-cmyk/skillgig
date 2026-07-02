'use client';

import { useCallback, useEffect, useState } from 'react';

// =============================================================================
// SkillGig.id — shared List ⇄ Grid view preference.
// -----------------------------------------------------------------------------
// The /gigs and /jobs boards both expose a Grid (default) | List toggle. The
// choice is a personal preference that should carry across pages and reloads,
// so it is persisted to a single shared localStorage key rather than per-page
// state — flipping to "List" on /jobs sticks when the user jumps to /gigs.
//
// Hydration-safe: the initial render is always 'grid' (matches the server),
// and the stored value is only applied after mount. Reading localStorage
// during render would otherwise mismatch the server's SSR output and trigger a
// hydration warning. The `hydrated` flag lets callers gate anything that
// depends on the resolved value.
// =============================================================================

export type ViewMode = 'grid' | 'list';

/** Shared across /gigs and /jobs so the preference is site-wide. */
const STORAGE_KEY = 'skillgig:view-mode';

function readStoredMode(): ViewMode {
  if (typeof window === 'undefined') return 'grid';
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === 'list' ? 'list' : 'grid';
  } catch {
    // Private mode / disabled storage — fall back to the grid default silently.
    return 'grid';
  }
}

/**
 * View-mode state backed by localStorage. Returns the current mode, a setter
 * that also persists, and a `hydrated` flag (false until the stored value has
 * been read on the client).
 */
export function useViewPreference() {
  const [view, setView] = useState<ViewMode>('grid');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setView(readStoredMode());
    setHydrated(true);
  }, []);

  const change = useCallback((mode: ViewMode) => {
    setView(mode);
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Storage write failed (quota / private mode) — the in-memory state still
      // updates, so the toggle keeps working for the rest of the session.
    }
  }, []);

  return { view, setView: change, hydrated } as const;
}

/** Max items rendered per mode — grid stays compact, list shows a bit more. */
export const GRID_LIMIT = 12;
export const LIST_LIMIT = 15;

/** Slice a list to the per-mode cap. */
export function limitForView<T>(items: T[], view: ViewMode): T[] {
  return items.slice(0, view === 'list' ? LIST_LIMIT : GRID_LIMIT);
}
