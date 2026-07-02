-- ============================================================================
-- SkillGig.id — Canonical source_id dedup key (Task C3)
-- ============================================================================
-- Adds a `source_id` column to `gigs` and `courses` so listings imported from
-- external APIs (Remotive, Jobicy, course-platform feeds, …) can dedup on the
-- source's own stable identifier instead of (or in addition to) the listing URL.
--
-- Why a dedicated source_id alongside the existing source_url (gigs, migration 015):
--   • source_url is the REAL outbound link (Remotive ToS: never rewrite it).
--     It happens to also be unique per listing, so the Remotive sync upserts on
--     it today. But a URL can be re-canonicalised by the upstream (trailing slash,
--     query params, http→https), which would silently create duplicates.
--   • source_id is the upstream's own primary key (e.g. Remotive job `id`), which
--     is stable across URL cosmetics. It is the more correct dedup key for any
--     future multi-source sync (Jobicy, etc.) where the URL may be less reliable.
--
-- Why a FULL unique index (not partial `WHERE source_id IS NOT NULL`):
--   Postgres treats NULLs as distinct in a unique index, so every legacy / mock /
--   admin-created row (source_id NULL) coexists without conflict, and non-null
--   source_id values must be unique. A full index is also a valid arbiter for an
--   `ON CONFLICT (source_id)` issued by the supabase-js client — a partial index
--   is NOT, unless the client emits a matching `WHERE source_id IS NOT NULL`,
--   which it does not.
--
-- NOTE on the task spec: the C3 brief names the tables `jobs` and `courses`.
-- SkillGig has no separate `jobs` table — the /jobs board is a view layer over
-- `gigs` (see lib/job-utils.ts). So job listings live on `gigs`; this migration
-- adds source_id there. `courses` is the real courses table.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS + CREATE UNIQUE INDEX IF NOT EXISTS.
-- Run AFTER 001_init.sql / 002_extend.sql / 015_remotive_source_url.sql.
-- ============================================================================

-- ----- gigs.source_id ------------------------------------------------------
ALTER TABLE gigs
  ADD COLUMN IF NOT EXISTS source_id text;

CREATE UNIQUE INDEX IF NOT EXISTS gigs_source_id_key
  ON gigs (source_id);

-- ----- courses.source_id --------------------------------------------------
-- Course feeds (Udemy/Coursera/Dicoding) expose their own course ids; storing
-- them here lets a future course-import sync upsert without duplicating rows
-- when a course's title or thumbnail changes.
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS source_id text;

CREATE UNIQUE INDEX IF NOT EXISTS courses_source_id_key
  ON courses (source_id);
