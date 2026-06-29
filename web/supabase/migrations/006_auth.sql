-- ============================================================================
-- SkillGig.id — Auth integration (Phase 6)
-- ============================================================================
-- Run AFTER 005_applications.sql. Enables real Supabase Auth:
--   1. Auto-create public.users row when auth.users row is created
--   2. Tighten applications RLS to per-user
--
-- Email + password signup is the supported flow. The trigger pulls name + role
-- from raw_user_meta_data, which is set by signUpWithPassword() in
-- lib/supabase/actions.ts.
-- ============================================================================

-- 1. Auto-create public.users row when auth.users row is created.
--    Reads name + role from raw_user_meta_data (passed at signUp time).
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
  v_role text;
BEGIN
  v_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), split_part(NEW.email, '@', 1));
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'freelancer');
  IF v_role NOT IN ('client', 'freelancer') THEN
    v_role := 'freelancer';
  END IF;

  INSERT INTO public.users (id, name, initials, role, bio, location)
  VALUES (
    NEW.id,
    v_name,
    UPPER(LEFT(v_name, 2)),
    v_role,
    'New to SkillGig — excited to learn and earn!',
    'Indonesia'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- 2. Tighten applications RLS to per-user.
DROP POLICY IF EXISTS "applications_public_read"  ON applications;
DROP POLICY IF EXISTS "applications_public_insert" ON applications;
DROP POLICY IF EXISTS "applications_select_own"   ON applications;
DROP POLICY IF EXISTS "applications_insert_own"   ON applications;
DROP POLICY IF EXISTS "applications_update_own"   ON applications;

CREATE POLICY "applications_select_own" ON applications
  FOR SELECT USING (freelancer_id = auth.uid());

CREATE POLICY "applications_insert_own" ON applications
  FOR INSERT WITH CHECK (freelancer_id = auth.uid());

CREATE POLICY "applications_update_own" ON applications
  FOR UPDATE USING (freelancer_id = auth.uid());

-- 3. Users table: keep public read (anyone can view freelancer profiles).
--    Existing "users_public_read" policy already covers this.

-- 4. (Optional, future) Add FK from public.users.id -> auth.users.id so that
--    deleting an auth user cascades to the public profile. Skipped for Phase 6
--    to keep this migration idempotent and avoid re-creating constraints on
--    seeded rows.