-- ============================================================================
-- SkillGig.id — Initial schema (Phase 2)
-- ============================================================================
-- Apply via Supabase SQL Editor:
--   https://app.supabase.com/project/<your-project>/sql/new
--
-- Replaces the Phase 1 mock data in web/lib/mock/*.ts with real tables.
-- RLS is enabled on every table; default-deny for everything except the
-- explicit policies below.
-- ============================================================================

-- Enable UUID generation (pgcrypto is enabled by default on new Supabase
-- projects, but we declare it explicitly so this migration is portable).
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 1. courses — directory of online courses across platforms
-- ============================================================================
CREATE TABLE courses (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text         NOT NULL,
  platform    text         NOT NULL,  -- Udemy, Coursera, Dicoding, YouTube, etc.
  category    text         NOT NULL,
  price       integer      NOT NULL DEFAULT 0,  -- IDR, 0 = gratis
  url         text         NOT NULL,
  thumbnail   text,                     -- optional URL or emoji shortcode
  rating      decimal(3,2) DEFAULT 0,   -- 0.00 – 5.00
  students    integer      DEFAULT 0,
  created_at  timestamptz  NOT NULL DEFAULT now()
);

-- ============================================================================
-- 2. gigs — freelance marketplace listings
-- ============================================================================
CREATE TABLE gigs (
  id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text         NOT NULL,
  platform     text         NOT NULL,  -- Upwork, Fiverr, Projects.co.id, Sribulancer, etc.
  category     text         NOT NULL,
  budget_min   integer      NOT NULL,  -- IDR
  budget_max   integer      NOT NULL,  -- IDR
  url          text         NOT NULL,
  level        text         NOT NULL,  -- Pemula | Menengah | Expert
  created_at   timestamptz  NOT NULL DEFAULT now()
);

-- ============================================================================
-- 3. skills — skill catalog (used for subscribe-by-skill notifications)
-- ============================================================================
CREATE TABLE skills (
  id         uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text  NOT NULL,
  category   text  NOT NULL,
  icon       text                 -- emoji, e.g. '⚛️'
);

-- ============================================================================
-- 4. subscribers — email opt-ins per skill ("notify me when React gigs drop")
-- ============================================================================
CREATE TABLE subscribers (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text         NOT NULL,
  skill_id    uuid         NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  created_at  timestamptz  NOT NULL DEFAULT now()
);

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX idx_courses_category  ON courses(category);
CREATE INDEX idx_gigs_category     ON gigs(category);
CREATE INDEX idx_gigs_platform     ON gigs(platform);
CREATE INDEX idx_subscribers_skill ON subscribers(skill_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
-- Default: deny everything. Each policy below explicitly opens the minimum
-- surface needed for the Phase 2 read-only browsing experience + anonymous
-- newsletter opt-ins.
-- ============================================================================

-- ----- courses: public read -----------------------------------------------
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "courses_public_read" ON courses
  FOR SELECT USING (true);

-- ----- gigs: public read --------------------------------------------------
ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gigs_public_read" ON gigs
  FOR SELECT USING (true);

-- ----- skills: public read ------------------------------------------------
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skills_public_read" ON skills
  FOR SELECT USING (true);

-- ----- subscribers: insert only, NO select (privacy) -----------------------
-- Anyone can submit their email to subscribe. Nobody — not even anon — can
-- read the table back. This blocks SELECT/UPDATE/DELETE via RLS default-deny.
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscribers_insert_only" ON subscribers
  FOR INSERT WITH CHECK (true);