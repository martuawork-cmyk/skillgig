-- ============================================================================
-- SkillGig.id — Applications table (Phase 5)
-- ============================================================================
-- Run AFTER 003_seed.sql. Adds the applications table that backs /applications.
--
-- For Phase 5 we keep things simple: no auth, no RLS-based row ownership.
-- All applications are public-read so the dashboard works without user context.
-- (Add proper auth + per-user RLS in a future migration.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS applications (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id                   uuid NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  freelancer_id            uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  proposed_rate            integer NOT NULL,           -- IDR
  proposed_duration_weeks  integer NOT NULL,
  cover_letter             text NOT NULL,
  status                   text NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'accepted', 'rejected')),
  applied_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_applications_freelancer ON applications(freelancer_id, applied_at DESC);
CREATE INDEX idx_applications_gig        ON applications(gig_id);
CREATE INDEX idx_applications_status     ON applications(status);

-- RLS: public read so the dashboard works without auth
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "applications_public_read" ON applications
  FOR SELECT USING (true);

-- Public write so the Lamar button on /earn can insert
CREATE POLICY "applications_public_insert" ON applications
  FOR INSERT WITH CHECK (true);