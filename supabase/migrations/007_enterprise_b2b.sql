-- Phase 4 Sprint 5: B2B Enterprise
-- Tables: organizations, org_members, org_departments, org_invites, org_audit_logs, org_sso_configs, enterprise_contracts

-- ─────────────────────────────────────────────
-- Organizations (workspaces)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,
  domain        TEXT,                         -- verified email domain for auto-join
  owner_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  plan          TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter','growth','enterprise')),
  seats_count   INTEGER NOT NULL DEFAULT 10,
  seats_used    INTEGER NOT NULL DEFAULT 0,
  logo_url      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(slug)
);

-- ─────────────────────────────────────────────
-- Organisation members
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_members (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role              TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin','manager','member')),
  department_id     UUID,                     -- FK set after org_departments created
  status            TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('active','invited','deprovisioned')),
  invited_email     TEXT,
  invited_at        TIMESTAMPTZ,
  joined_at         TIMESTAMPTZ,
  deprovisioned_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- ─────────────────────────────────────────────
-- Departments (hierarchical)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_departments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  parent_id     UUID REFERENCES org_departments(id) ON DELETE SET NULL,
  manager_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add dept FK now that org_departments exists
ALTER TABLE org_members
  ADD CONSTRAINT org_members_department_id_fkey
  FOREIGN KEY (department_id) REFERENCES org_departments(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────
-- Invite tokens (for bulk CSV invite flow)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_invites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  department_id UUID REFERENCES org_departments(id) ON DELETE SET NULL,
  role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin','manager','member')),
  invited_by    UUID NOT NULL REFERENCES auth.users(id),
  token         TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired','revoked')),
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, email),
  UNIQUE(token)
);

-- ─────────────────────────────────────────────
-- Audit logs
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_user_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,                -- e.g. 'member.invite', 'member.deprovision', 'sso.configured', 'export.requested'
  resource_type   TEXT,                         -- 'member', 'department', 'sso_config', 'export'
  resource_id     TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  ip_address      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS org_audit_logs_org_created_idx ON org_audit_logs(org_id, created_at DESC);

-- ─────────────────────────────────────────────
-- SSO configurations (SAML 2.0 / OIDC)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_sso_configs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider          TEXT NOT NULL CHECK (provider IN ('google_workspace','microsoft_365','okta','custom_saml')),
  entity_id         TEXT,                       -- IdP Entity ID
  sso_url           TEXT,                       -- IdP SSO URL
  x509_cert         TEXT,                       -- IdP signing certificate (PEM)
  attribute_mapping JSONB NOT NULL DEFAULT '{"email":"email","name":"name","department":"department"}',
  status            TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active','inactive','error')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id)
);

-- ─────────────────────────────────────────────
-- Enterprise contracts
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enterprise_contracts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contract_start_date   DATE NOT NULL,
  contract_end_date     DATE NOT NULL,
  seats_count           INTEGER NOT NULL,
  price_per_seat        NUMERIC(10,2) NOT NULL,      -- INR per seat per month
  discount_pct          NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (discount_pct BETWEEN 0 AND 50),
  total_contract_value  NUMERIC(12,2),
  billing_contact       TEXT,
  technical_contact     TEXT,
  status                TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','renewal_pending','expired','cancelled')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- RLS Policies
-- ─────────────────────────────────────────────
ALTER TABLE organizations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_departments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_invites       ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_audit_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_sso_configs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_contracts ENABLE ROW LEVEL SECURITY;

-- Organizations: owner or admin member can read/write
CREATE POLICY "org_owner_or_admin_select" ON organizations
  FOR SELECT USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = organizations.id
        AND org_members.user_id = auth.uid()
        AND org_members.status = 'active'
    )
  );

CREATE POLICY "org_owner_insert" ON organizations
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "org_owner_update" ON organizations
  FOR UPDATE USING (owner_id = auth.uid());

-- Org members: member can see own org's members; admin can write
CREATE POLICY "org_members_select" ON org_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members m2
      WHERE m2.org_id = org_members.org_id
        AND m2.user_id = auth.uid()
        AND m2.status = 'active'
    )
    OR EXISTS (SELECT 1 FROM organizations o WHERE o.id = org_members.org_id AND o.owner_id = auth.uid())
  );

CREATE POLICY "org_members_admin_write" ON org_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM org_members m2
      WHERE m2.org_id = org_members.org_id
        AND m2.user_id = auth.uid()
        AND m2.role IN ('admin')
        AND m2.status = 'active'
    )
    OR EXISTS (SELECT 1 FROM organizations o WHERE o.id = org_members.org_id AND o.owner_id = auth.uid())
  );

-- Departments: same as members
CREATE POLICY "org_departments_member_select" ON org_departments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members m
      WHERE m.org_id = org_departments.org_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
    OR EXISTS (SELECT 1 FROM organizations o WHERE o.id = org_departments.org_id AND o.owner_id = auth.uid())
  );

CREATE POLICY "org_departments_admin_write" ON org_departments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM org_members m
      WHERE m.org_id = org_departments.org_id
        AND m.user_id = auth.uid()
        AND m.role IN ('admin','manager')
        AND m.status = 'active'
    )
    OR EXISTS (SELECT 1 FROM organizations o WHERE o.id = org_departments.org_id AND o.owner_id = auth.uid())
  );

-- Audit logs: read-only for admins, service role writes
CREATE POLICY "org_audit_logs_admin_select" ON org_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members m
      WHERE m.org_id = org_audit_logs.org_id
        AND m.user_id = auth.uid()
        AND m.role IN ('admin')
        AND m.status = 'active'
    )
    OR EXISTS (SELECT 1 FROM organizations o WHERE o.id = org_audit_logs.org_id AND o.owner_id = auth.uid())
  );

-- SSO configs: admin only
CREATE POLICY "org_sso_admin_all" ON org_sso_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM org_members m
      WHERE m.org_id = org_sso_configs.org_id
        AND m.user_id = auth.uid()
        AND m.role = 'admin'
        AND m.status = 'active'
    )
    OR EXISTS (SELECT 1 FROM organizations o WHERE o.id = org_sso_configs.org_id AND o.owner_id = auth.uid())
  );

-- Enterprise contracts: owner/admin read
CREATE POLICY "enterprise_contracts_admin_select" ON enterprise_contracts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM organizations o WHERE o.id = enterprise_contracts.org_id AND o.owner_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM org_members m
      WHERE m.org_id = enterprise_contracts.org_id
        AND m.user_id = auth.uid()
        AND m.role = 'admin'
        AND m.status = 'active'
    )
  );
