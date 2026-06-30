-- ============================================================================
-- SkillGig.id — Apply gig flow (P2-B)
-- ============================================================================
-- Run AFTER 006_auth.sql. Brings the applications table in line with the
-- end-to-end apply flow:
--   1. Column `freelancer_id` aliased as `user_id` (the freelancer is just
--      a user; the column name shouldn't imply role).
--   2. Drops the legacy `proposed_rate` / `proposed_duration_weeks` columns
--      — apply is now cover-letter-only.
--   3. Adds `reviewed` to the status enum so admins can mark an application
--      as triaged before the final accept/reject.
--   4. Tightens the status CHECK constraint to the new full set.
--   5. Adds a UNIQUE(user_id, gig_id) constraint so duplicate applies are
--      rejected at the DB layer. The ApplyForm also surfaces a friendly
--      "sudah pernah melamar" message based on the same query.
--
-- Idempotent: safe to re-run on a fresh DB or on top of existing data.
-- ============================================================================

-- 1. Add `user_id` column, backfilled from `freelancer_id`.
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE CASCADE;

UPDATE applications
  SET user_id = freelancer_id
  WHERE user_id IS NULL;

-- Not-NULL once all rows are backfilled. This step intentionally NOT uses
-- NOT NULL until the UPDATE above has populated every row — Postgres
-- would reject the ALTER if any NULL slipped through.
ALTER TABLE applications
  ALTER COLUMN user_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id, applied_at DESC);

-- 2. Drop the legacy rate / duration columns — apply is cover-letter-only now.
ALTER TABLE applications DROP COLUMN IF EXISTS proposed_rate;
ALTER TABLE applications DROP COLUMN IF EXISTS proposed_duration_weeks;

-- 3. Widen the status CHECK constraint.
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE applications
  ADD CONSTRAINT applications_status_check
  CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected'));

-- 4. UNIQUE constraint — one apply per user per gig.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'applications_user_gig_unique'
  ) THEN
    ALTER TABLE applications
      ADD CONSTRAINT applications_user_gig_unique UNIQUE (user_id, gig_id);
  END IF;
END $$;

-- 5. RLS — refresh policies to use the new user_id column.
DROP POLICY IF EXISTS "applications_select_own" ON applications;
DROP POLICY IF EXISTS "applications_insert_own" ON applications;
DROP POLICY IF EXISTS "applications_update_own" ON applications;

-- Users see only their own applications.
CREATE POLICY "applications_select_own" ON applications
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own applications only. The UNIQUE(user_id, gig_id)
-- constraint below catches duplicate applies at the DB layer.
CREATE POLICY "applications_insert_own" ON applications
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- No UPDATE policy for anon/authenticated users — only admins (service role)
-- can change status. This prevents freelancers from un-accepting themselves.

-- 6. Admin read — needed so /admin/gigs can list applicants per gig.
DROP POLICY IF EXISTS "applications_admin_select" ON applications;
CREATE POLICY "applications_admin_select" ON applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = auth.uid()
        AND (au.raw_user_meta_data->>'role') = 'admin'
    )
  );

-- 7. Application count index used by admin gig listing to check duplicate applies.
CREATE INDEX IF NOT EXISTS idx_applications_gig_user ON applications(gig_id, user_id);

-- ============================================================================
-- NOTES
-- ============================================================================
--   • The legacy `freelancer_id` column is intentionally retained as an alias
--     view into `user_id`. If you'd rather drop it outright, uncomment:
--       ALTER TABLE applications DROP COLUMN freelancer_id;
--     The mappers (web/lib/supabase/mappers.ts) read `user_id`, so dropping
--     `freelancer_id` requires updating the row type to remove the field.
-- ============================================================================
