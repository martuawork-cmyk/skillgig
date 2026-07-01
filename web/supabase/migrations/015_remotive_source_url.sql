-- ============================================================================
-- SkillGig.id — Remotive sync dedup key (Task B5)
-- ============================================================================
-- Adds `gigs.source_url` so the Remotive auto-sync (lib/job-sync/remotive.ts)
-- can upsert by the listing's canonical URL:
--
--   INSERT … ON CONFLICT (source_url) DO UPDATE
--
-- Why a FULL unique index (not a partial `WHERE source_url IS NOT NULL`):
--   Postgres treats NULLs as distinct in a unique index, so every legacy /
--   mock / admin-created row (source_url NULL) coexists without conflict, and
--   non-null source_url values (the Remotive URLs) must be unique. A full
--   index is also a valid arbiter for `ON CONFLICT (source_url)` issued by the
--   supabase-js client — a partial index is NOT, unless the client also emits
--   a matching `WHERE source_url IS NOT NULL` on the conflict target, which it
--   does not.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS + CREATE UNIQUE INDEX IF NOT EXISTS.
-- Run AFTER 001_init.sql / 002_extend.sql / seed-gigs-real.sql.
-- ============================================================================

ALTER TABLE gigs
  ADD COLUMN IF NOT EXISTS source_url text;

CREATE UNIQUE INDEX IF NOT EXISTS gigs_source_url_key
  ON gigs (source_url);
