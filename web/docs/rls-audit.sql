-- =============================================================================
-- SkillGig.id — RLS & Policy Audit (READ-ONLY)
-- =============================================================================
-- Run this in the Supabase SQL Editor (or psql) against the project DB.
-- Every statement is SELECT-only — it inspects state, it never mutates it.
--
-- Scope: the 10 tables + 1 view that hold all app data:
--   affiliate_clicks, applications, courses, gigs, saved_items, skills,
--   subscribers, user_skills, users   +   view affiliate_click_counts
--
-- What to look for when reading the output:
--   1. rls_enabled MUST be true on every table except possibly the view
--      (the view inherits row visibility from its base tables — see §6).
--   2. Every table needs at least one policy for the anon/authenticated roles
--      the app actually uses (catalog tables need a public SELECT; user-scoped
--      tables need an "owner" SELECT/INSERT/UPDATE).
--   3. No policy should expose another user's private rows (saved_items,
--      applications, user_skills, subscribers are per-user — check the USING
--      clause references auth.uid()).
--   4. The affiliate view should be security_invoker=true (PostgREST ≥ 12 /
--      Supabase) OR have no RLS-exempt definition, otherwise anon could bypass
--      the base-table RLS through it.
-- =============================================================================


-- =============================================================================
-- §1  RLS ENABLED? (one row per audited table)
-- =============================================================================
-- relrowsecurity = true  ⇔  ALTER TABLE ... ENABLE ROW LEVEL SECURITY ran.
-- A table here with rls_enabled = false is a CRITICAL finding: even with
-- policies written, RLS is not enforced until it is enabled.
-- =============================================================================
SELECT
  n.nspname                                 AS schema,
  c.relname                                AS table_name,
  c.relrowsecurity                         AS rls_enabled,
  c.relforcerowsecurity                    AS rls_forced,        -- bypass-safe? (forces RLS even for table OWNER)
  obj_description(c.oid, 'pg_class')       AS comment
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'                       -- ordinary tables only (views handled in §6)
  AND c.relname IN (
    'affiliate_clicks', 'applications', 'courses', 'gigs', 'saved_items',
    'skills', 'subscribers', 'user_skills', 'users'
  )
ORDER BY c.relname;


-- =============================================================================
-- §2  EVERY POLICY ON EVERY AUDITED TABLE
-- =============================================================================
-- The full picture: role, command, qualifier (USING) and with-check (WITH CHECK).
-- Read USING as "which existing rows can I see/modify" and WITH CHECK as
-- "which new/changed rows am I allowed to write".
-- =============================================================================
SELECT
  schemaname   AS schema,
  tablename    AS table_name,
  policyname   AS policy_name,
  permissive,                         -- 'PERMISSIVE' | 'RESTRICTIVE'
  roles,                              -- which auth roles the policy applies to
  cmd,                                -- SELECT | INSERT | UPDATE | DELETE | ALL
  qual,                               -- USING  expression
  with_check                          -- WITH CHECK expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'affiliate_clicks', 'applications', 'courses', 'gigs', 'saved_items',
    'skills', 'subscribers', 'user_skills', 'users'
  )
ORDER BY tablename, cmd, policyname;


-- =============================================================================
-- §3  TABLES WITH RLS ENABLED BUT ZERO POLICIES (deny-by-default trap)
-- =============================================================================
-- RLS without any policy = NO access for anyone (including the app's anon role).
-- A row here means a page that reads this table will silently get [] / fall
-- back to its empty state — exactly the class of bug this audit hunts.
-- =============================================================================
SELECT c.relname AS table_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policies p
  ON p.schemaname = n.nspname AND p.tablename = c.relname
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity = true
  AND c.relname IN (
    'affiliate_clicks', 'applications', 'courses', 'gigs', 'saved_items',
    'skills', 'subscribers', 'user_skills', 'users'
  )
GROUP BY c.relname
HAVING COUNT(p.policyname) = 0
ORDER BY c.relname;
-- Expected: 0 rows. Any row = a locked-down table the app cannot read.


-- =============================================================================
-- §4  GRANTS on the audited tables (who can even attempt the operation)
-- =============================================================================
-- Policies only filter rows AFTER PostgREST lets the role reach the table.
-- If a role has no GRANT, the policy is moot. anon needs SELECT on the public
-- catalog tables (courses, gigs, skills, users); authenticated needs
-- INSERT/UPDATE/DELETE on the user-scoped tables it writes.
-- =============================================================================
SELECT
  table_name,
  grantee,
  string_agg(Privilege_type, ', ' ORDER BY Privilege_type) AS privileges
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN (
    'affiliate_clicks', 'applications', 'courses', 'gigs', 'saved_items',
    'skills', 'subscribers', 'user_skills', 'users'
  )
GROUP BY table_name, grantee
ORDER BY table_name, grantee;


-- =============================================================================
-- §5  OWNER-SCOPED TABLES — does the USING clause actually bind to auth.uid()?
-- =============================================================================
-- For saved_items / applications / user_skills / subscribers / users the only
-- safe SELECT policy is "... USING (user_id = auth.uid())" (or freelancer_id /
-- id for users). This query surfaces those policies verbatim so a missing or
-- wrong owner column is obvious. A policy missing auth.uid() on these tables
-- is a SECURITY bug (cross-user data leak), not just a data bug.
-- =============================================================================
SELECT tablename AS table_name, cmd, policyname, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('saved_items', 'applications', 'user_skills', 'subscribers', 'users')
ORDER BY tablename, cmd;
-- Manual review: confirm every row's qual / with_check references auth.uid()
-- against the correct owner column (user_id, freelancer_id, or id for users).


-- =============================================================================
-- §6  VIEW: affiliate_click_counts — security model
-- =============================================================================
-- Two things to check on the view:
--   (a) pg_class.relkind = 'v' confirms it exists.
--   (b) For Postgres ≥ 15 the view is either SECURITY DEFINER (runs as the
--       view owner, bypassing base-table RLS — riskier) or SECURITY INVOKER
--       (runs as the caller, base-table RLS applies). Supabase recommends
--       SECURITY INVOKER for views over RLS-protected tables so the caller's
--       policies still gate access.
-- pg_rewrite/ pg_views doesn't expose invoker/definer directly in all versions;
-- pg_views.definition shows the body. Combine with the policy listing for the
-- base table affiliate_clicks (§2) to reason about exposure.
-- =============================================================================
SELECT
  viewname   AS view_name,
  viewowner  AS view_owner,
  definition AS view_definition
FROM pg_views
WHERE schemaname = 'public'
  AND viewname = 'affiliate_click_counts';

-- View object metadata (relkind 'v' = ordinary view).
SELECT n.nspname AS schema, c.relname AS view_name, c.relkind
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'affiliate_click_counts';

-- Which roles can SELECT the view?
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'affiliate_click_counts';


-- =============================================================================
-- §7  MANUAL PROBE TEMPLATES (run as anon / authenticated to confirm behavior)
-- =============================================================================
-- Uncomment and run from the SQL editor while impersonating each role to
-- verify a policy behaves as intended. Expected counts are in the comment.
-- Replace <other-user-uuid> with a real id from public.users.
--
-- SET ROLE anon;
-- SELECT count(*) FROM courses;      -- expect: total seeded courses (e.g. 16)
-- SELECT count(*) FROM gigs;         -- expect: published gigs only (e.g. 22)
-- SELECT count(*) FROM skills;       -- expect: all seeded skills
-- SELECT count(*) FROM users;        -- expect: all public profiles (FOR SELECT true)
-- SELECT count(*) FROM applications; -- expect: 0 (anon is not the owner)
-- SELECT count(*) FROM saved_items;  -- expect: 0
-- SELECT count(*) FROM user_skills;  -- expect: 0
-- SELECT count(*) FROM subscribers;  -- expect: 0
-- SELECT count(*) FROM affiliate_click_counts;  -- expect: aggregate view visible
--
-- RESET ROLE;
