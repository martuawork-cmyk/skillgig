import { createClient } from './client';

/**
 * SkillGig.id — Save / Unsave queries.
 *
 * Backed by the `saved_items` table (migration 008_saved_items.sql). Saves
 * are scoped to either the authenticated user (`auth.uid()`) or, for
 * anonymous visitors, a session id stored in `localStorage` under
 * `skillgig.session.v1`.
 *
 * Design choices:
 *   - When the user is signed in, we write to `saved_items` directly. RLS
 *     keeps them on their own rows.
 *   - When the user is anonymous, we go through three SECURITY DEFINER
 *     RPCs (`saved_items_session_*`) so the session_id stays server-side
 *     validated.
 *   - Upserts are idempotent: re-saving an item is a no-op (Postgres
 *     `ON CONFLICT DO NOTHING`).
 *
 * All functions return a `Result<T>` envelope so callers can render a
 * toast without wrapping each call in try/catch.
 */

export type SavedItemType = 'course' | 'gig';

export type SavedItemRow = {
  id: string;
  user_id: string | null;
  session_id: string | null;
  item_type: SavedItemType;
  item_id: string;
  created_at: string;
};

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const SESSION_KEY = 'skillgig.session.v1';

/**
 * Returns a stable per-browser session id. Generated lazily on first call
 * and persisted in localStorage so it survives page reloads.
 *
 * Falls back to a non-persistent in-memory id during SSR — server code
 * should never need a session id, but the helper is safe to call there.
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  try {
    const existing = window.localStorage.getItem(SESSION_KEY);
    if (existing && existing.length >= 8) return existing;
    const id =
      (typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36));
    window.localStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    // localStorage blocked (private mode, quota, etc.) — fall back to a
    // throwaway id so saves still work in this tab.
    return Math.random().toString(36).slice(2);
  }
}

async function getCurrentUserId(): Promise<string | null> {
  try {
    const sb = createClient();
    const { data } = await sb.auth.getUser();
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Insert (or no-op if already saved) a single item. Returns the canonical
 * row on success so callers can render `savedAt` from `created_at`.
 */
export async function saveItem(
  itemType: SavedItemType,
  itemId: string,
): Promise<Result<SavedItemRow>> {
  try {
    const sb = createClient();
    const userId = await getCurrentUserId();

    if (userId) {
      // NOTE: `ignoreDuplicates: true` + `.single()` is a footgun. When the row
      // already exists, ON CONFLICT DO NOTHING returns *zero* rows, and
      // `.single()` then throws a PGRST116 ("no rows found") error — NOT the
      // 23505 unique-violation we used to catch. That surfaced as a false
      // `{ ok: false }`, which made the optimistic-save layer roll the item
      // back out of the UI (save button flicked back to "Simpan") and flooded
      // the console with spurious errors during `syncPendingSaves`.
      // `.maybeSingle()` returns `data: null` on the duplicate path, which we
      // treat as success and resolve to the canonical row.
      const { data, error } = await sb
        .from('saved_items')
        .upsert(
          { user_id: userId, item_type: itemType, item_id: itemId },
          { onConflict: 'user_id,item_type,item_id', ignoreDuplicates: true },
        )
        .select('*')
        .maybeSingle();
      if (error) return { ok: false, error: error.message };
      if (data) return { ok: true, data: data as SavedItemRow };

      // Row already existed (ignoreDuplicates returned nothing) — fetch the
      // canonical row so callers get the real `created_at`.
      const { data: existing, error: fetchErr } = await sb
        .from('saved_items')
        .select('*')
        .eq('user_id', userId)
        .eq('item_type', itemType)
        .eq('item_id', itemId)
        .maybeSingle();
      if (fetchErr) return { ok: false, error: fetchErr.message };
      if (existing) return { ok: true, data: existing as SavedItemRow };

      // Vanishingly unlikely (row gone between upsert + fetch) — synthesize so
      // the Result<SavedItemRow> contract holds and callers stay happy.
      return {
        ok: true,
        data: {
          id: '',
          user_id: userId,
          session_id: null,
          item_type: itemType,
          item_id: itemId,
          created_at: new Date(0).toISOString(),
        },
      };
    }

    // Anonymous session path — go through RPC.
    const sessionId = getSessionId();
    const { data, error } = await sb.rpc('saved_items_session_save', {
      p_session_id: sessionId,
      p_item_type: itemType,
      p_item_id: itemId,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data as SavedItemRow };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Remove a saved item. Idempotent: deleting an unsaved item is a no-op
 * and still returns `ok: true`.
 */
export async function unsaveItem(
  itemType: SavedItemType,
  itemId: string,
): Promise<Result<true>> {
  try {
    const sb = createClient();
    const userId = await getCurrentUserId();

    if (userId) {
      const { error } = await sb
        .from('saved_items')
        .delete()
        .eq('user_id', userId)
        .eq('item_type', itemType)
        .eq('item_id', itemId);
      if (error) return { ok: false, error: error.message };
      return { ok: true, data: true };
    }

    const sessionId = getSessionId();
    const { error } = await sb.rpc('saved_items_session_unsave', {
      p_session_id: sessionId,
      p_item_type: itemType,
      p_item_id: itemId,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Fetch every saved item owned by the current visitor (user or session).
 * Returns an empty list when there are no rows or the table isn't seeded.
 */
export async function getSavedItems(): Promise<SavedItemRow[]> {
  try {
    const sb = createClient();
    const userId = await getCurrentUserId();

    if (userId) {
      const { data, error } = await sb
        .from('saved_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) {
        // eslint-disable-next-line no-console
        console.warn('[getSavedItems] user fetch failed:', error);
        return [];
      }
      return (data ?? []) as SavedItemRow[];
    }

    const sessionId = getSessionId();
    const { data, error } = await sb.rpc('saved_items_session_list', {
      p_session_id: sessionId,
    });
    if (error) {
      // eslint-disable-next-line no-console
      console.warn('[getSavedItems] session fetch failed:', error);
      return [];
    }
    return (data ?? []) as SavedItemRow[];
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[getSavedItems] caught:', err);
    return [];
  }
}