-- Phase 6: Global Expansion
-- Tables: regions, stripe_customers, stripe_prices, consent_logs, data_export_requests, erasure_requests

-- ─────────────────────────────────────────────
-- Supported regions
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS regions (
  code         TEXT PRIMARY KEY,          -- 'IN', 'US', 'GB', 'SG', 'AU', 'DE'
  name         TEXT NOT NULL,
  currency     TEXT NOT NULL,             -- ISO 4217: 'INR', 'USD', 'GBP', 'SGD', 'AUD', 'EUR'
  currency_symbol TEXT NOT NULL,
  stripe_key   TEXT,                      -- region-specific Stripe publishable key (nullable = use default)
  tax_label    TEXT NOT NULL DEFAULT 'Tax',
  tax_rate     NUMERIC(5,4) NOT NULL DEFAULT 0,  -- e.g. 0.18 for 18% GST
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO regions (code, name, currency, currency_symbol, tax_label, tax_rate) VALUES
  ('IN', 'India',          'INR', '₹',  'GST',  0.18),
  ('US', 'United States',  'USD', '$',  'Tax',  0.00),
  ('GB', 'United Kingdom', 'GBP', '£',  'VAT',  0.20),
  ('SG', 'Singapore',      'SGD', 'S$', 'GST',  0.09),
  ('AU', 'Australia',      'AUD', 'A$', 'GST',  0.10),
  ('DE', 'Germany',        'EUR', '€',  'MwSt', 0.19),
  ('FR', 'France',         'EUR', '€',  'TVA',  0.20),
  ('JP', 'Japan',          'JPY', '¥',  'Tax',  0.10)
ON CONFLICT (code) DO NOTHING;

-- ─────────────────────────────────────────────
-- Stripe prices per plan per region
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stripe_prices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan            TEXT NOT NULL,          -- 'pro_monthly', 'pro_annual', etc.
  region_code     TEXT NOT NULL REFERENCES regions(code),
  stripe_price_id TEXT NOT NULL,          -- e.g. price_1234abc
  amount          INTEGER NOT NULL,       -- in smallest currency unit (paise, cents)
  currency        TEXT NOT NULL,
  interval        TEXT,                   -- 'month', 'year', null for one-time
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(plan, region_code)
);

-- ─────────────────────────────────────────────
-- Stripe customers (one per user, per region)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stripe_customers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id  TEXT NOT NULL UNIQUE,
  region_code         TEXT NOT NULL REFERENCES regions(code),
  email               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, region_code)
);

ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own stripe customers" ON stripe_customers
  FOR SELECT USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- GDPR/CCPA consent logs
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consent_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id    TEXT,                     -- anonymous session ID before sign-up
  consent_type  TEXT NOT NULL,            -- 'analytics', 'marketing', 'essential'
  granted       BOOLEAN NOT NULL,
  ip_address    TEXT,
  user_agent    TEXT,
  region_code   TEXT REFERENCES regions(code),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own consents" ON consent_logs
  FOR SELECT USING (auth.uid() = user_id);
-- Service role handles inserts from API

-- ─────────────────────────────────────────────
-- Data export requests (GDPR Art. 20)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS data_export_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'processing', 'ready', 'expired'
  download_url  TEXT,                     -- signed URL, expires after 48h
  expires_at    TIMESTAMPTZ,
  requested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);

ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own export requests" ON data_export_requests
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Right-to-erasure requests (GDPR Art. 17 / CCPA)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS erasure_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason        TEXT,
  status        TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'processing', 'completed'
  scheduled_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),  -- 30-day cooling-off
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE erasure_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own erasure requests" ON erasure_requests
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- User region preferences
-- ─────────────────────────────────────────────
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS region_code TEXT REFERENCES regions(code) DEFAULT 'IN',
  ADD COLUMN IF NOT EXISTS locale      TEXT DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS timezone    TEXT DEFAULT 'Asia/Kolkata',
  ADD COLUMN IF NOT EXISTS gdpr_consent_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ccpa_opt_out_at  TIMESTAMPTZ;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_consent_logs_user    ON consent_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stripe_prices_plan   ON stripe_prices(plan, region_code);
CREATE INDEX IF NOT EXISTS idx_erasure_scheduled    ON erasure_requests(scheduled_at) WHERE status = 'pending';
