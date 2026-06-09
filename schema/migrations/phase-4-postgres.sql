-- =============================================================================
-- Phase 4 — PostgreSQL Schema (Daily Activity Tracker — Ecosystem)
-- Database: Supabase PostgreSQL
-- New tables: 6 (api_keys, api_logs, integrations, marketplace_programs,
--               program_enrollments, enterprise_contracts)
-- Prerequisites: Phase 2 + Phase 3 migrations applied
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 28. api_keys
-- Developer API key management for public REST API v1.
-- Keys are SHA-256 hashed before storage — plain text NEVER persisted.
-- Tiers: free (1,000 req/mo) | pro (50,000) | enterprise (unlimited)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_keys (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_hash              TEXT        UNIQUE NOT NULL,          -- SHA-256 of the full key
    key_prefix            TEXT        NOT NULL,                 -- First 8 chars shown in UI (e.g. "dat_live_")
    key_name              TEXT        NOT NULL,                 -- "My Zapier Integration"
    tier                  TEXT        NOT NULL DEFAULT 'free',  -- free | pro | enterprise
    requests_this_month   INTEGER     NOT NULL DEFAULT 0,       -- Rolling monthly counter (reset on billing cycle)
    rate_limit            INTEGER     NOT NULL DEFAULT 1000,    -- Max requests per month for this tier
    status                TEXT        NOT NULL DEFAULT 'active',-- active | revoked | expired
    last_used_at          TIMESTAMPTZ,
    expires_at            TIMESTAMPTZ,                          -- NULL = no expiry
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user   ON api_keys(user_id, status);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash   ON api_keys(key_hash);  -- Fast key lookup on each API call

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_keys_own_rows" ON api_keys
    USING (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- 29. api_logs
-- Request-level audit log for API usage analytics and abuse detection.
-- High-volume table — partition by month in production (Supabase pg_partman).
-- Retention: 90 days (auto-purged by scheduled job).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_logs (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id       UUID        NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    endpoint         TEXT        NOT NULL,                      -- "GET /api/v1/activities"
    method           TEXT        NOT NULL,                      -- GET | POST | PATCH | DELETE
    status_code      SMALLINT    NOT NULL,
    response_time_ms INTEGER     NOT NULL,
    ip_address       INET,                                      -- NULL if proxied/anonymous
    timestamp        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_logs_key_ts ON api_logs(api_key_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_ts     ON api_logs(timestamp DESC);

-- No RLS — api_logs are accessed by service role only (admin / analytics jobs)
-- Individual user access goes through api_keys RLS


-- ---------------------------------------------------------------------------
-- 30. integrations
-- One row per user per integration type. OAuth tokens AES-256 encrypted at rest
-- (via Supabase vault or app-layer encryption before INSERT).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS integrations (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    integration_type    TEXT        NOT NULL,
    -- zapier | google_calendar | slack | notion | ifttt
    status              TEXT        NOT NULL DEFAULT 'disconnected',
    -- connected | disconnected | error
    external_account_id TEXT,                                   -- Slack workspace ID, Calendar ID, etc.
    auth_token          TEXT,                                   -- OAuth access token (AES-256 encrypted)
    refresh_token       TEXT,                                   -- OAuth refresh token (AES-256 encrypted)
    token_expires_at    TIMESTAMPTZ,
    config              JSONB       NOT NULL DEFAULT '{}',
    -- {"calendar_id":"...","slack_channel":"#habits","notify_on_streak":true}
    last_sync_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, integration_type)
);

CREATE INDEX IF NOT EXISTS idx_integrations_user_type ON integrations(user_id, integration_type);

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "integrations_own_rows" ON integrations
    USING (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- 31. marketplace_programs
-- Creator-published habit programs for the in-app marketplace.
-- Revenue share: 70% to creator, 30% to platform.
-- activities column stores the full program template (not user instances).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS marketplace_programs (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_user_id  UUID         NOT NULL REFERENCES users(id),
    program_name     TEXT         NOT NULL,
    program_description TEXT      NOT NULL,
    category         TEXT         NOT NULL,
    -- fitness | study | wellness | spiritual | productivity
    activities       JSONB        NOT NULL DEFAULT '[]',
    -- [{"name":"Gym","duration_min":60,"frequency":"daily","icon":"💪"},...]
    duration_days    INTEGER      NOT NULL,                     -- 30, 60, 90, etc.
    price            NUMERIC(10,2) NOT NULL DEFAULT 0,          -- 0 = free program
    icon_url         TEXT,
    cover_image_url  TEXT,
    rating           NUMERIC(3,2) NOT NULL DEFAULT 0.00         CHECK (rating BETWEEN 0 AND 5),
    review_count     INTEGER      NOT NULL DEFAULT 0,
    sales_count      INTEGER      NOT NULL DEFAULT 0,
    status           TEXT         NOT NULL DEFAULT 'draft',     -- draft | published | archived
    revenue_share_pct SMALLINT    NOT NULL DEFAULT 70           CHECK (revenue_share_pct BETWEEN 0 AND 100),
    featured         BOOLEAN      NOT NULL DEFAULT FALSE,
    featured_until   TIMESTAMPTZ,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_status_cat ON marketplace_programs(status, category);
CREATE INDEX IF NOT EXISTS idx_marketplace_creator     ON marketplace_programs(creator_user_id, status);
CREATE INDEX IF NOT EXISTS idx_marketplace_featured    ON marketplace_programs(featured, featured_until) WHERE featured = TRUE;

CREATE OR REPLACE FUNCTION trg_marketplace_updated_at_fn()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_marketplace_programs_updated_at
    BEFORE UPDATE ON marketplace_programs
    FOR EACH ROW EXECUTE FUNCTION trg_marketplace_updated_at_fn();

ALTER TABLE marketplace_programs ENABLE ROW LEVEL SECURITY;
-- Anyone can read published programs
CREATE POLICY "marketplace_published_read" ON marketplace_programs FOR SELECT
    USING (status = 'published');
-- Creators can manage their own drafts and published programs
CREATE POLICY "marketplace_creator_write" ON marketplace_programs
    USING (auth.uid() = creator_user_id);


-- ---------------------------------------------------------------------------
-- 32. program_enrollments
-- Tracks user enrollment and progress in marketplace programs.
-- When enrolled: copy program.activities into the user's cloud_activities table.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS program_enrollments (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    program_id   UUID        NOT NULL REFERENCES marketplace_programs(id),
    status       TEXT        NOT NULL DEFAULT 'active',         -- active | completed | abandoned
    progress_pct SMALLINT    NOT NULL DEFAULT 0                 CHECK (progress_pct BETWEEN 0 AND 100),
    enrolled_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, program_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user       ON program_enrollments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_program    ON program_enrollments(program_id);

ALTER TABLE program_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enrollments_own_rows" ON program_enrollments
    USING (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- 33. enterprise_contracts
-- B2B contract terms, pricing, SSO configuration.
-- One contract per team_workspace. Managed by sales/admin.
-- SAML IdP metadata URL used for Okta / Google Workspace / Microsoft 365 SSO.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS enterprise_contracts (
    id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id               UUID         UNIQUE NOT NULL REFERENCES team_workspaces(id) ON DELETE CASCADE,
    contract_start_date   TEXT         NOT NULL,               -- YYYY-MM-DD
    contract_end_date     TEXT         NOT NULL,               -- YYYY-MM-DD
    seats_count           INTEGER      NOT NULL,               -- Contracted seats
    price_per_seat        NUMERIC(10,2) NOT NULL,              -- INR per seat per month
    discount_pct          SMALLINT     NOT NULL DEFAULT 0      CHECK (discount_pct BETWEEN 0 AND 30),
    total_contract_value  NUMERIC(12,2) NOT NULL,              -- Computed: seats * price * months * (1 - discount)
    billing_contact       TEXT         NOT NULL,               -- Email for invoices
    technical_contact     TEXT         NOT NULL,               -- Email for SSO/IT setup
    sso_provider          TEXT,                                -- google_workspace | microsoft_365 | okta | NULL
    saml_metadata_url     TEXT,                                -- SAML IdP metadata URL (for SSO)
    status                TEXT         NOT NULL DEFAULT 'active',
    -- active | renewal_pending | expired | terminated
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_enterprise_contracts_status ON enterprise_contracts(status, contract_end_date);

CREATE TRIGGER trg_enterprise_contracts_updated_at
    BEFORE UPDATE ON enterprise_contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Only service role and the team admin can read contract details
ALTER TABLE enterprise_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enterprise_contracts_admin_only" ON enterprise_contracts
    USING (
        EXISTS (
            SELECT 1 FROM team_workspaces tw
            WHERE tw.id = team_id AND tw.admin_user_id = auth.uid()
        )
    );


-- ---------------------------------------------------------------------------
-- Utility: API usage counter increment function
-- Called by API gateway after each successful request.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_api_usage(p_key_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE api_keys
    SET    requests_this_month = requests_this_month + 1,
           last_used_at        = now()
    WHERE  id = p_key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ---------------------------------------------------------------------------
-- Utility: Monthly API counter reset job
-- Schedule via pg_cron: SELECT cron.schedule('reset-api-counters', '0 0 1 * *', ...)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reset_monthly_api_counters()
RETURNS VOID AS $$
BEGIN
    UPDATE api_keys
    SET requests_this_month = 0
    WHERE status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
