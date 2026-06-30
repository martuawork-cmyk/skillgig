-- ============================================================================
-- SkillGig.id — Auth trigger fix + backfill (Phase 11)
-- ============================================================================
-- Run AFTER 010_applications_p2b.sql.
--
-- Why this migration exists:
--   Migration 006 created public.handle_new_auth_user() and the
--   on_auth_user_created trigger, but it depends on raw_user_meta_data
--   containing `name` + `role`. In environments where the trigger never
--   ran (older DB, trigger dropped during testing, auth.users seeded
--   directly, etc.), signups end up with a row in auth.users but no row
--   in public.users — and /profile/[id] 404s because the id is unknown.
--
--   This migration:
--     1. Re-defines public.handle_new_auth_user() with a more defensive
--        INSERT that always succeeds (id, email, role default 'client',
--        created_at; name + initials are derived from email when missing
--        so the public.users NOT NULL constraints can never break it).
--     2. Re-creates the on_auth_user_created trigger (DROP IF EXISTS +
--        CREATE — idempotent).
--     3. Backfills public.users for every auth.users row that does not
--        yet have a matching public.users row, using the same logic as
--        the trigger so the two paths can't drift.
--
-- Idempotent:
--   - CREATE OR REPLACE FUNCTION
--   - DROP TRIGGER IF EXISTS … CREATE TRIGGER
--   - INSERT … ON CONFLICT (id) DO NOTHING for the backfill
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Trigger function — re-create with the explicit (id, email, role,
--    created_at) shape the task asks for, while still satisfying the
--    public.users NOT NULL constraints on `name` and `initials` by deriving
--    sensible defaults from the email.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name     text;
  v_initials text;
  v_role     text;
BEGIN
  -- Name: prefer raw_user_meta_data.name, fall back to the local-part of the email.
  v_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    split_part(NEW.email, '@', 1)
  );

  -- Initials: first two characters of the name, uppercased.
  v_initials := UPPER(LEFT(v_name, 2));

  -- Role: default 'client' per the task spec. If a value is supplied via
  -- raw_user_meta_data and is one of the allowed values, honour it;
  -- otherwise coerce to 'client'. (Migration 002's CHECK constraint only
  -- accepts 'client' or 'freelancer'.)
  v_role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'client');
  IF v_role NOT IN ('client', 'freelancer') THEN
    v_role := 'client';
  END IF;

  INSERT INTO public.users (id, name, initials, role, bio, location, created_at)
  VALUES (
    NEW.id,
    v_name,
    v_initials,
    v_role,
    'New to SkillGig — excited to learn and earn!',
    'Indonesia',
    NEW.created_at
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. Trigger — drop + recreate so a missing or stale trigger is replaced
--    cleanly. DROP IF EXISTS keeps this re-runnable.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- ----------------------------------------------------------------------------
-- 3. Backfill — every auth.users row that does not yet have a matching
--    public.users row gets one. Mirrors the trigger logic so future
--    signups and historical signups follow the same shape.
--
--    Uses INSERT … SELECT … ON CONFLICT DO NOTHING so it is safe to re-run.
--    LEFT JOIN picks auth.users rows whose id is NOT present in public.users.
-- ----------------------------------------------------------------------------
INSERT INTO public.users (id, name, initials, role, bio, location, created_at)
SELECT
  au.id,
  COALESCE(
    NULLIF(au.raw_user_meta_data->>'name', ''),
    split_part(au.email, '@', 1)
  )                                                    AS name,
  UPPER(LEFT(
    COALESCE(
      NULLIF(au.raw_user_meta_data->>'name', ''),
      split_part(au.email, '@', 1)
    ),
    2
  ))                                                  AS initials,
  COALESCE(
    CASE
      WHEN au.raw_user_meta_data->>'role' IN ('client', 'freelancer')
        THEN au.raw_user_meta_data->>'role'
      ELSE NULL
    END,
    'client'
  )                                                    AS role,
  'New to SkillGig — excited to learn and earn!'        AS bio,
  'Indonesia'                                          AS location,
  au.created_at                                        AS created_at
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;