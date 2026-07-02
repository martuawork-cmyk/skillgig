-- ============================================================================
-- SkillGig.id — Cleanup: remove irrelevant Adzuna UK-local job listings
-- ============================================================================
-- WHY: the Adzuna `gb` feed returned UK LOCAL roles (Teacher in Hinckley,
-- Maintenance Engineer in Kettering, …) — not the remote-global jobs this board
-- is for. The sync now runs remote-native sources only (Remotive, Jobicy,
-- RemoteOK); lib/job-sync/adzuna.ts is no longer called. This migration purges
-- the rows that source already wrote so /jobs stops showing them.
--
-- Scope: only Adzuna-sourced rows are touched — every Adzuna import is stamped
-- platform = 'Adzuna' and source_id = 'adzuna:<id>'. Rows from Remotive/Jobicy/
-- RemoteOK and any admin-curated or local Sribulancer/Projects.co.id gigs are
-- left untouched.
--
-- SAFE TO RE-RUN: a plain DELETE with a narrow predicate; a second run simply
-- matches zero rows. Reversible only by re-syncing (which we no longer do), so
-- take a snapshot first if you want the option to restore.
-- ============================================================================

DELETE FROM gigs
WHERE platform = 'Adzuna'
   OR source_id LIKE 'adzuna:%';
