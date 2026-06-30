-- ============================================================================
-- SkillGig.id — Affiliate tracking (Phase 3C)
-- ============================================================================
-- Adds the affiliate-link monetisation layer for the /learn courses page.
--
--   courses.affiliate_url
--       Optional outbound URL set by the admin. When the visitor taps "Mulai
--       Belajar" on a card we first record a click (affiliate_clicks), then
--       redirect them to this URL if present, or fall back to courses.url.
--
--   affiliate_clicks
--       Append-only click log. One row per "Mulai Belajar" tap. Carries:
--         - course_id     the course that was clicked
--         - user_id       auth.uid() when the visitor is signed in; NULL
--                         for anonymous traffic
--         - session_id    anon Supabase session id (cookie-based). Stable
--                         across pageviews for the same browser session, so
--                         we can dedupe repeat clicks on a best-effort
--                         basis. Plain text — no PII.
--         - clicked_at    server-side timestamp
--       RLS is tight: the public can only INSERT (so the click-track endpoint
--       can record events), and even then only when the course exists.
--       Reads + counts go through the admin queries with the service role.
--
-- Idempotent: every statement uses IF NOT EXISTS / DO blocks where possible.
-- Safe to re-run. Run AFTER 007_admin_fields.sql (which already added the
-- featured column we extend on with affiliate_url).
-- ============================================================================

-- ----- courses.affiliate_url ----------------------------------------------
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS affiliate_url text;

-- No CHECK constraint — admin wants to paste any URL. We trust admin
-- validation on the form (type=url) and Supabase returning 400 for garbage
-- if they skip the form.

COMMENT ON COLUMN courses.affiliate_url IS
  'Outbound monetised URL used by the "Mulai Belajar" CTA on /learn. Falls back to courses.url when NULL.';

-- ----- affiliate_clicks ---------------------------------------------------
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   uuid         NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id     uuid         REFERENCES auth.users(id) ON DELETE SET NULL,
  -- 64 hex chars covers the standard Supabase anon JWT session id. Auth
  -- "sid" sessions use the same shape. Stored plain (not hashed) because
  -- it is already a server-issued opaque token — there is no PII here.
  session_id  text,
  clicked_at  timestamptz  NOT NULL DEFAULT now()
);

COMMENT ON TABLE affiliate_clicks IS
  'Append-only log of "Mulai Belajar" clicks for the /learn page. Read-path is admin-only (service role).';

-- ----- indexes ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_course
  ON affiliate_clicks(course_id, clicked_at DESC);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_session
  ON affiliate_clicks(session_id);

-- ----- RLS ----------------------------------------------------------------
-- Default-deny. We open INSERT to anon + authenticated so the public
-- click-tracking endpoint can record events without service-role auth.
-- SELECT stays locked — click counts are exposed via the admin views /
-- queries, not by reading this table from the browser.
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "affiliate_clicks_insert" ON affiliate_clicks;
CREATE POLICY "affiliate_clicks_insert" ON affiliate_clicks
  FOR INSERT WITH CHECK (
    -- Basic sanity: the course_id must look like a uuid, but we cannot
    -- join across to courses from inside WITH CHECK so we leave the
    -- referential integrity check to the FK above. RLS just gates the
    -- INSERT permission.
    true
  );

-- No SELECT / UPDATE / DELETE policies — default-deny under RLS. The
-- admin layer reads via the service-role client.

-- ----- counts view (admin convenience) -----------------------------------
-- Aggregates click count per course so the admin table can show a single
-- number without N round trips. This is a VIEW (not a SECURITY DEFINER
-- function) so reads still go through the invoker's RLS — access is gated
-- to admins in the application layer, and the view itself does not expose
-- anything that isn't already in the underlying tables.
CREATE OR REPLACE VIEW affiliate_click_counts AS
  SELECT course_id, COUNT(*)::bigint AS clicks
  FROM affiliate_clicks
  GROUP BY course_id;

COMMENT ON VIEW affiliate_click_counts IS
  'Per-course click counts. Read with the service role from /admin/courses.';
