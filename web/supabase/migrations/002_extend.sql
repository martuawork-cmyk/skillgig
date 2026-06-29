-- ============================================================================
-- SkillGig.id — Extend schema (Phase 2.5 migration)
-- ============================================================================
-- Run AFTER 001_init.sql. Adds the columns and tables needed to back the full
-- mock data shape used by the UI.
--
-- Idempotent: safe to re-run.
-- ============================================================================

-- ----- courses: add skills, level, duration_hours, enrolled ----------------
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS skills         text[]    NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS level          text      NOT NULL DEFAULT 'beginner',
  ADD COLUMN IF NOT EXISTS duration_hours integer   NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS enrolled       boolean   NOT NULL DEFAULT false;

-- ----- gigs: add description, skills, duration_weeks, applicants_count -----
ALTER TABLE gigs
  ADD COLUMN IF NOT EXISTS description      text    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS skills           text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS duration_weeks   integer NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS applicants_count integer NOT NULL DEFAULT 0;

-- ----- skills: add `recommended` flag for the dashboard -------------------
ALTER TABLE skills
  ADD COLUMN IF NOT EXISTS recommended boolean NOT NULL DEFAULT false;

-- ----- users table: profile data (clients + freelancers) -------------------
CREATE TABLE IF NOT EXISTS users (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text          NOT NULL,
  initials        text          NOT NULL,
  role            text          NOT NULL CHECK (role IN ('client', 'freelancer')),
  rating          decimal(3,2)  DEFAULT 0,
  completed_gigs  integer       DEFAULT 0,
  bio             text          NOT NULL DEFAULT '',
  skills          text[]        NOT NULL DEFAULT '{}',
  location        text          NOT NULL DEFAULT '',
  avatar_url      text,
  created_at      timestamptz   NOT NULL DEFAULT now()
);

-- RLS: users public read (same as other catalog tables)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_public_read" ON users;
CREATE POLICY "users_public_read" ON users
  FOR SELECT USING (true);

-- ============================================================================
-- NOTE: The `level` values stored in courses/gigs are lowercase English
-- ('beginner' | 'intermediate' | 'advanced') to align with the domain
-- `SkillLevel` type in web/lib/types.ts. The application layer casts at read
-- time — no SQL CHECK constraint is enforced to keep this migration portable.
-- ============================================================================