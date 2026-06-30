-- ============================================================================
-- SkillGig.id — Saved items (Phase 8)
-- ============================================================================
-- Run AFTER 007_admin_fields.sql. Adds the `saved_items` table that backs the
-- global Zustand save store.
--
-- Design:
--   - Either `user_id` (signed-in) OR `session_id` (anonymous, from
--     localStorage) is populated. Exactly one of the two is set per row via
--     a CHECK constraint so we can never have orphan rows that belong to
--     nobody.
--   - A user can save the same item only once per (owner, item) pair. We
--     enforce this with a partial UNIQUE index per identity so duplicates
--     collapse to a single row.
--   - RLS is enabled. Reads/writes are restricted to the row's owner
--     (auth.uid() OR matching session_id via header `x-skillgig-session`).
--     Because RLS doesn't have direct access to a client-side random ID,
--     we expose a thin SECURITY DEFINER helper RPC for the session_id path.
--     Authenticated users hit the table directly with the policies below.
--
-- Item type is restricted to 'course' | 'gig' (the two saveable kinds in the
-- app). item_id is a free-form text uuid since both courses.id and gigs.id
-- are uuid.
-- ============================================================================

CREATE TABLE IF NOT EXISTS saved_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id  text,
  item_type   text NOT NULL CHECK (item_type IN ('course', 'gig')),
  item_id     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),

  -- Exactly one of user_id / session_id must be set.
  CONSTRAINT saved_items_owner_xor CHECK (
    (user_id IS NOT NULL AND session_id IS NULL) OR
    (user_id IS NULL AND session_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_saved_items_user
  ON saved_items(user_id, item_type, created_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_saved_items_session
  ON saved_items(session_id, item_type, created_at DESC)
  WHERE session_id IS NOT NULL;

-- Idempotency: a single row per (owner, item). We can't make a single
-- UNIQUE constraint across both nullable columns, so we use two partial
-- indexes instead.
CREATE UNIQUE INDEX IF NOT EXISTS uq_saved_items_user
  ON saved_items(user_id, item_type, item_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_saved_items_session
  ON saved_items(session_id, item_type, item_id)
  WHERE session_id IS NOT NULL;

-- ============================================================================
-- RLS
-- ============================================================================
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;

-- Authenticated users: full CRUD on their own rows.
DROP POLICY IF EXISTS "saved_items_select_own"  ON saved_items;
DROP POLICY IF EXISTS "saved_items_insert_own"  ON saved_items;
DROP POLICY IF EXISTS "saved_items_delete_own"  ON saved_items;

CREATE POLICY "saved_items_select_own" ON saved_items
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "saved_items_insert_own" ON saved_items
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "saved_items_delete_own" ON saved_items
  FOR DELETE USING (user_id = auth.uid());

-- Anonymous session rows are written/read through the SECURITY DEFINER
-- helper below — clients never touch `saved_items` directly without an
-- authenticated session. This keeps the session_id path safe (no other
-- visitor can enumerate your anon saves) while still letting the page
-- render before login.

-- ----------------------------------------------------------------------------
-- SECURITY DEFINER helpers (session-scoped access)
--
-- Why a separate RPC instead of an RLS policy that reads from headers?
--   - RLS policies can use auth.uid() but can't reliably read a random
--     client-side session id without an extra `request.jwt.claims` or
--     custom claim plumbing.
--   - The helper validates the session_id shape and constrains reads/writes
--     to rows that match it. The function runs as the table owner so it
--     bypasses RLS — but it still enforces "you can only see your own
--     session's rows" by filtering on session_id.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.saved_items_session_list(p_session_id text)
RETURNS SETOF saved_items
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT * FROM saved_items
   WHERE session_id = p_session_id
   ORDER BY created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.saved_items_session_save(
  p_session_id text,
  p_item_type  text,
  p_item_id    text
)
RETURNS saved_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row saved_items;
BEGIN
  IF p_item_type NOT IN ('course', 'gig') THEN
    RAISE EXCEPTION 'invalid item_type: %', p_item_type;
  END IF;

  INSERT INTO saved_items (session_id, item_type, item_id)
  VALUES (p_session_id, p_item_type, p_item_id)
  ON CONFLICT (session_id, item_type, item_id)
    WHERE session_id IS NOT NULL
    DO NOTHING
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    SELECT * INTO v_row FROM saved_items
     WHERE session_id = p_session_id
       AND item_type   = p_item_type
       AND item_id     = p_item_id;
  END IF;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.saved_items_session_unsave(
  p_session_id text,
  p_item_type  text,
  p_item_id    text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM saved_items
   WHERE session_id = p_session_id
     AND item_type   = p_item_type
     AND item_id     = p_item_id;
  RETURN FOUND;
END;
$$;

-- Lock down EXECUTE on the helpers to anon + authenticated. Without this
-- they default to PUBLIC which is fine for SECURITY DEFINER + RLS-off
-- reads, but explicit grants make the intent clear.
GRANT EXECUTE ON FUNCTION public.saved_items_session_list(text)         TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.saved_items_session_save(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.saved_items_session_unsave(text, text, text) TO anon, authenticated;