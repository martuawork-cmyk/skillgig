-- ============================================================================
-- SkillGig.id — User-owned skills (P3-B)
-- ============================================================================
-- Run AFTER 011_auth_users_trigger_fix.sql.
--
-- Adds the per-user skill bag that backs the redesigned /skills page:
--   - "Skill Saya"        — skills the current user has claimed
--   - "Tambah Skill"      — click-to-add from the global catalog
--   - "Progress per Skill" — aggregated from saved courses + gig applications
--
-- Shape (per task spec):
--   id         — uuid PK
--   user_id    — auth.users row (and public.users row via trigger)
--   skill_id   — skills catalog row
--   level      — beginner | intermediate | advanced, the user's self-declared
--                proficiency level for this skill
--   created_at — timestamptz, default now()
--
-- Integrity + RLS:
--   - A user can hold each catalog skill at most once
--     (UNIQUE(user_id, skill_id) — duplicate adds collapse to a single row).
--   - level CHECK constraint matches the SkillLevel union in web/lib/types.ts.
--   - RLS default-deny. Authenticated users can only select / insert / delete
--     their own rows. There is no UPDATE policy — level changes are not part
--     of the P3-B scope; if we add a "level up" UI later, that's a separate
--     migration.
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_skills (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id    uuid         NOT NULL REFERENCES skills(id)    ON DELETE CASCADE,
  level       text         NOT NULL DEFAULT 'beginner'
               CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  created_at  timestamptz  NOT NULL DEFAULT now()
);

-- One bag of each skill per user. Adopting ON CONFLICT DO NOTHING on the
-- client side makes the add-skill click idempotent — re-clicking a skill
-- already in the bag is a silent no-op.
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_skills_user_skill
  ON user_skills(user_id, skill_id);

-- Supports the per-user skill listing + per-skill aggregation queries on
-- /skills (load the user's bag in O(bag_size) instead of a seq scan).
CREATE INDEX IF NOT EXISTS idx_user_skills_user
  ON user_skills(user_id, created_at DESC);

-- ============================================================================
-- RLS — default deny; only the row owner can read / insert / delete their
-- own bag. Matches the pattern in 008_saved_items + 010_applications.
-- ============================================================================
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_skills_select_own" ON user_skills;
DROP POLICY IF EXISTS "user_skills_insert_own" ON user_skills;
DROP POLICY IF EXISTS "user_skills_delete_own" ON user_skills;

CREATE POLICY "user_skills_select_own" ON user_skills
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_skills_insert_own" ON user_skills
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_skills_delete_own" ON user_skills
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- NOTES
-- ============================================================================
--   • No public read policy — user_skills is a private per-user table. The
--     /profile/[id] public profile reads `users.skills` (text[]) for a
--     display-friendly summary, not this join table.
--   • The skills catalog (`skills`) keeps its public read so the "Tambah
--     Skill" grid can list every skill before login.
-- ============================================================================
