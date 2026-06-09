-- Phase 4: Ecosystem Tables
-- Run after 003_phase3_tables.sql

-- ── API Key Management ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS api_keys (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash            TEXT NOT NULL UNIQUE,       -- SHA-256 of the raw key (never stored plain)
  key_prefix          TEXT NOT NULL,              -- first 8 chars shown in UI e.g. "dat_sk_a"
  key_name            TEXT NOT NULL DEFAULT 'My API Key',
  tier                TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
  requests_this_month INT  NOT NULL DEFAULT 0,
  rate_limit          INT  NOT NULL DEFAULT 1000, -- requests/month
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  last_used_at        TIMESTAMPTZ,
  expires_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_keys_owner" ON api_keys
  FOR ALL USING (auth.uid() = user_id);

-- ── API Usage Logs ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS api_logs (
  id                BIGSERIAL PRIMARY KEY,
  api_key_id        UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  endpoint          TEXT NOT NULL,
  method            TEXT NOT NULL,
  status_code       INT  NOT NULL,
  response_time_ms  INT,
  ip_address        TEXT,
  user_agent        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_logs_owner" ON api_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Index for rate-limit queries (count requests in current month per key)
CREATE INDEX IF NOT EXISTS idx_api_logs_key_month
  ON api_logs (api_key_id, created_at DESC);

-- ── Third-Party Integrations ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS integrations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_type    TEXT NOT NULL CHECK (
    integration_type IN ('zapier', 'google_calendar', 'slack', 'notion', 'ifttt', 'telegram')
  ),
  status              TEXT NOT NULL DEFAULT 'connected' CHECK (
    status IN ('connected', 'disconnected', 'error', 'pending_auth')
  ),
  external_account_id TEXT,
  auth_token          TEXT,                        -- encrypted at rest via Supabase Vault
  refresh_token       TEXT,
  token_expires_at    TIMESTAMPTZ,
  config              JSONB,
  last_sync_at        TIMESTAMPTZ,
  error_message       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, integration_type)
);

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "integrations_owner" ON integrations
  FOR ALL USING (auth.uid() = user_id);

-- ── Marketplace Programs ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS marketplace_programs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_name      TEXT NOT NULL,
  program_desc      TEXT,
  category          TEXT NOT NULL CHECK (
    category IN ('fitness', 'study', 'wellness', 'spiritual', 'productivity', 'nutrition')
  ),
  activities        JSONB NOT NULL DEFAULT '[]',  -- array of activity templates
  duration_days     INT  NOT NULL DEFAULT 30,
  price             NUMERIC(10, 2) NOT NULL DEFAULT 0, -- INR
  icon_url          TEXT,
  cover_image_url   TEXT,
  rating            REAL NOT NULL DEFAULT 0,
  review_count      INT  NOT NULL DEFAULT 0,
  sales_count       INT  NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'published', 'archived', 'under_review')
  ),
  revenue_share_pct INT  NOT NULL DEFAULT 70,     -- % to creator
  featured          BOOLEAN NOT NULL DEFAULT FALSE,
  featured_until    TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE marketplace_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "programs_public_read" ON marketplace_programs
  FOR SELECT USING (status = 'published');
CREATE POLICY "programs_creator_all" ON marketplace_programs
  FOR ALL USING (auth.uid() = creator_user_id);

-- ── Program Enrollments ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS program_enrollments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id      UUID NOT NULL REFERENCES marketplace_programs(id) ON DELETE CASCADE,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'completed', 'abandoned', 'paused')
  ),
  progress_pct    INT  NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, program_id)
);

ALTER TABLE program_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enrollments_owner" ON program_enrollments
  FOR ALL USING (auth.uid() = user_id);

-- ── Enterprise Contracts ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS enterprise_contracts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id               UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  contract_start_date   DATE NOT NULL,
  contract_end_date     DATE NOT NULL,
  seats_count           INT  NOT NULL DEFAULT 10,
  price_per_seat        NUMERIC(10, 2) NOT NULL DEFAULT 199,  -- INR/seat/month
  discount_pct          INT  NOT NULL DEFAULT 0 CHECK (discount_pct BETWEEN 0 AND 50),
  total_contract_value  NUMERIC(12, 2),
  billing_contact       TEXT,
  technical_contact     TEXT,
  sso_provider          TEXT CHECK (
    sso_provider IN ('google_workspace', 'microsoft_365', 'okta', 'none') OR sso_provider IS NULL
  ),
  saml_metadata_url     TEXT,
  status                TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'renewal_pending', 'expired', 'cancelled')
  ),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE enterprise_contracts ENABLE ROW LEVEL SECURITY;
-- Only admins of the team can view/manage contracts (enforced at app layer via team_members role check)
CREATE POLICY "enterprise_contracts_team" ON enterprise_contracts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = enterprise_contracts.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.role IN ('admin', 'owner')
    )
  );

-- ── Payment Logs (audit trail for Razorpay events) ────────────────────────────

CREATE TABLE IF NOT EXISTS payment_logs (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  plan                      TEXT NOT NULL,
  razorpay_payment_id       TEXT,
  razorpay_subscription_id  TEXT,
  razorpay_order_id         TEXT,
  amount                    INT,             -- paise
  currency                  TEXT DEFAULT 'INR',
  status                    TEXT NOT NULL,   -- captured, failed, refunded
  verified_at               TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_logs_owner" ON payment_logs
  FOR SELECT USING (auth.uid() = user_id);

-- ── Webhooks (outbound event delivery) ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS webhooks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  secret      TEXT NOT NULL,               -- HMAC signing secret
  events      TEXT[] NOT NULL DEFAULT '{}', -- ['activity.logged', 'streak.broken', ...]
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'failed')),
  last_fired_at   TIMESTAMPTZ,
  failure_count   INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhooks_owner" ON webhooks
  FOR ALL USING (auth.uid() = user_id);

-- ── Webhook Delivery Logs ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id            BIGSERIAL PRIMARY KEY,
  webhook_id    UUID REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type    TEXT NOT NULL,
  payload       JSONB NOT NULL,
  status_code   INT,
  response_body TEXT,
  delivered_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhook_deliveries_owner" ON webhook_deliveries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM webhooks WHERE webhooks.id = webhook_deliveries.webhook_id AND webhooks.user_id = auth.uid())
  );
