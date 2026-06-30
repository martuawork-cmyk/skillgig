-- ============================================================================
-- SkillGig.id — Subscribers: add skill_name + unique (email, skill_id) (P2-A)
-- ============================================================================
-- Run AFTER 008_saved_items.sql.
--
-- The original `subscribers` table only carried a FK to `skills(id)`. For the
-- NewsletterSection UX we want the human-readable skill name at insert time
-- (so it shows up in the welcome email + admin export without an extra
-- join). We also tighten uniqueness on (email, skill_id) so the same person
-- can't double-opt-in for the same skill — that turns the duplicate path
-- into a silent success instead of a 409.
--
-- Idempotent: safe to re-run.
-- ============================================================================

-- 1. Denormalised skill name. Nullable so the existing "email-only" opt-in
--    flow (no skill chosen) keeps working without forcing a placeholder.
ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS skill_name text;

-- 2. Backfill skill_name for rows that already have a skill_id but no name.
--    We use the FK to look up the current name from skills. This is a
--    one-time backfill — no trigger keeps the column in sync with skills
--    because the row stores what the user *saw* at subscribe time, which
--    can legitimately diverge from the current skill name.
UPDATE subscribers s
   SET skill_name = sk.name
  FROM skills sk
 WHERE s.skill_id = sk.id
   AND s.skill_name IS NULL;

-- 3. Unique (email, skill_id) — only when skill_id is set. We use a partial
--    index because Postgres can't make a single UNIQUE constraint that
--    treats NULLs as equal (and we still want the email-only opt-in path
--    to allow multiple rows per email).
CREATE UNIQUE INDEX IF NOT EXISTS uq_subscribers_email_skill
  ON subscribers (lower(email), skill_id)
  WHERE skill_id IS NOT NULL;

-- 4. Email-only dedupe — same email can still subscribe once with no skill.
CREATE UNIQUE INDEX IF NOT EXISTS uq_subscribers_email_only
  ON subscribers (lower(email))
  WHERE skill_id IS NULL;

-- 5. RLS is already enabled and the INSERT policy is permissive. We re-state
--    it here idempotently in case someone nuked the policy by hand — keeps
--    the privacy posture consistent ("insert-only, no read").
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'subscribers'
      AND policyname = 'subscribers_insert_only'
  ) THEN
    ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "subscribers_insert_only" ON subscribers
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;