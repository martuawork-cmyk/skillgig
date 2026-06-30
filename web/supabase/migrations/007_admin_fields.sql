-- ============================================================================
-- SkillGig.id — Admin layer fields (Phase 7)
-- ============================================================================
-- Run AFTER 006_auth.sql. Adds the columns the admin dashboard needs but
-- didn't exist in the original public schema:
--
--   gigs.status        — lifecycle of a gig listing (draft → published → expired)
--   courses.featured   — toggle for "popular / featured" surfacing on /learn
--
-- No RLS changes — the admin layer uses the service-role client (bypasses
-- RLS). Public read policy on these tables already covers the listings.
--
-- Idempotent: uses ADD COLUMN IF NOT EXISTS and DO blocks for the CHECK
-- constraint. Safe to re-run.
-- ============================================================================

-- ----- gigs.status ---------------------------------------------------------
ALTER TABLE gigs
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';

-- CHECK constraint: add only if missing. We use a DO block because
-- ADD CONSTRAINT does not support IF NOT EXISTS.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'gigs_status_check'
  ) THEN
    ALTER TABLE gigs
      ADD CONSTRAINT gigs_status_check
      CHECK (status IN ('draft', 'published', 'expired'));
  END IF;
END
$$;

-- Backfill existing rows to 'published' so seeded gigs keep showing up
-- publicly until admin toggles them. The default above is 'draft' for new
-- rows; pre-007 rows should preserve their previous behaviour.
UPDATE gigs SET status = 'published' WHERE status = 'draft';

CREATE INDEX IF NOT EXISTS idx_gigs_status ON gigs(status);

-- ----- courses.featured ----------------------------------------------------
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_courses_featured ON courses(featured) WHERE featured = true;
