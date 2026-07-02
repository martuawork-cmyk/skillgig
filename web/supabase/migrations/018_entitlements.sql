-- ============================================================================
-- SkillGig.id — Entitlements (paid access), backing the AI CV Review paywall
-- ============================================================================
-- One row per (email, product) granting paid access. Written ONLY by the
-- service role from the Mayar webhook (app/api/webhooks/mayar) after a
-- `payment.received` event, and read by the access-check endpoint
-- (app/api/cv-review/access). The browser never touches this table directly.
--
-- Access model (MVP): a one-time Mayar payment grants the buyer's email an
-- entitlement to `cv-review`. `expires_at` NULL = no expiry (lifetime unlock);
-- set it if you later sell time-boxed access. `raw` keeps the full webhook
-- payload for audit / dispute handling.
--
-- Idempotent + safe to re-run. Run AFTER 001_init.sql.
-- ============================================================================

CREATE TABLE IF NOT EXISTS entitlements (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text         NOT NULL,
  product     text         NOT NULL DEFAULT 'cv-review',
  status      text         NOT NULL DEFAULT 'active',   -- 'active' | 'revoked'
  amount      integer,                                   -- paid amount (IDR)
  source      text         NOT NULL DEFAULT 'mayar',
  external_id text,                                       -- Mayar transaction id
  granted_at  timestamptz  NOT NULL DEFAULT now(),
  expires_at  timestamptz,                                -- NULL = lifetime
  raw         jsonb,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now()
);

COMMENT ON TABLE entitlements IS
  'Paid access grants (e.g. cv-review) keyed by buyer email. Written by the Mayar webhook via the service role; default-deny under RLS.';

-- One current entitlement per (email, product). Emails are stored/compared
-- case-insensitively via a functional unique index so "A@x.com" == "a@x.com".
CREATE UNIQUE INDEX IF NOT EXISTS entitlements_email_product_key
  ON entitlements (lower(email), product);

CREATE INDEX IF NOT EXISTS idx_entitlements_email
  ON entitlements (lower(email));

-- ----- RLS ----------------------------------------------------------------
-- Default-deny. No policies: every read/write goes through the service-role
-- client (webhook + access-check API). The browser must not read paid-access
-- rows (they carry buyer emails + payment metadata).
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
