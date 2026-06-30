'use client';

import { useEffect } from 'react';
import { useSavedStore } from '@/lib/store/savedStore';

/**
 * Mount-once side effect: after the Zustand persist middleware has
 * rehydrated from localStorage, pull authoritative saves from Supabase
 * and merge them in.
 *
 * Place this high in the tree (e.g. inside the root layout) so any
 * listing page that shows saved indicators reflects cross-device state
 * after a brief settle. The store guards against duplicate work with
 * `_serverSynced`.
 */
export function SavedHydrator() {
  const hydrate = useSavedStore((s) => s.hydrateFromSupabase);
  const syncPending = useSavedStore((s) => s.syncPendingSaves);
  const hydrated = useSavedStore((s) => s._hasHydrated);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    (async () => {
      await hydrate();
      if (cancelled) return;
      await syncPending();
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, hydrate, syncPending]);

  return null;
}