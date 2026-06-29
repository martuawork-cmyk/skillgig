-- ============================================================================
-- SkillGig.id — Make subscribers.skill_id nullable (Phase 4)
-- ============================================================================
-- Run AFTER 001_init.sql. The original schema declared skill_id NOT NULL,
-- which is too restrictive for the newsletter opt-in form on /learn where the
-- user only provides an email (no specific skill).
--
-- The FK constraint to skills(id) is preserved — when set, it still references
-- a valid skills row.
--
-- Idempotent: safe to re-run.
-- ============================================================================

ALTER TABLE subscribers
  ALTER COLUMN skill_id DROP NOT NULL;