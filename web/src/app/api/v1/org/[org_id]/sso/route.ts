import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateApiRequest, apiError, apiOk } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

type Ctx = { params: Promise<{ org_id: string }> };

const SUPPORTED_PROVIDERS = ['google_workspace', 'microsoft_365', 'okta', 'custom_saml'] as const;

async function requireOrgAdmin(userId: string, orgId: string) {
  const { data: o } = await supabase.from('organizations').select('id, owner_id').eq('id', orgId).maybeSingle();
  if (!o) return null;
  if (o.owner_id === userId) return o;
  const { data: m } = await supabase
    .from('org_members').select('role').eq('org_id', orgId).eq('user_id', userId).eq('status', 'active').maybeSingle();
  return m?.role === 'admin' ? o : null;
}

// GET /api/v1/org/:org_id/sso — get SSO config
// With ?format=metadata returns SAML SP metadata XML
export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;
  const { org_id } = await ctx.params;

  if (!await requireOrgAdmin(auth.userId, org_id)) return apiError('Forbidden', 403);

  const format = new URL(req.url).searchParams.get('format');

  const { data, error } = await supabase
    .from('org_sso_configs')
    .select('id, provider, entity_id, sso_url, attribute_mapping, status, created_at, updated_at')
    .eq('org_id', org_id)
    .maybeSingle();

  if (error) return apiError(error.message, 500);
  if (!data) return apiError('No SSO configuration found', 404);

  if (format === 'metadata') {
    // Generate SAML SP metadata XML
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.dailyactivitytracker.com';
    const acsUrl = `${appUrl}/api/v1/org/${org_id}/sso/acs`;
    const spEntityId = `${appUrl}/org/${org_id}/saml`;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor
  xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
  xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
  entityID="${spEntityId}">
  <SPSSODescriptor
    AuthnRequestsSigned="false"
    WantAssertionsSigned="true"
    protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
    <AssertionConsumerService
      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
      Location="${acsUrl}"
      index="1"
      isDefault="true" />
  </SPSSODescriptor>
</EntityDescriptor>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="sp-metadata-${org_id}.xml"`,
      },
    });
  }

  return apiOk(data);
}

// POST /api/v1/org/:org_id/sso — create or update SSO config
export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;
  const { org_id } = await ctx.params;

  if (!await requireOrgAdmin(auth.userId, org_id)) return apiError('Forbidden', 403);

  const body = await req.json() as {
    provider?: string;
    entity_id?: string;
    sso_url?: string;
    x509_cert?: string;
    attribute_mapping?: Record<string, string>;
  };

  if (!body.provider) return apiError('provider is required', 400);
  if (!SUPPORTED_PROVIDERS.includes(body.provider as typeof SUPPORTED_PROVIDERS[number])) {
    return apiError(`provider must be one of: ${SUPPORTED_PROVIDERS.join(', ')}`, 400);
  }
  if (!body.sso_url) return apiError('sso_url is required', 400);
  if (!body.entity_id) return apiError('entity_id is required', 400);

  const { data, error } = await supabase
    .from('org_sso_configs')
    .upsert({
      org_id,
      provider: body.provider,
      entity_id: body.entity_id,
      sso_url: body.sso_url,
      x509_cert: body.x509_cert ?? null,
      attribute_mapping: body.attribute_mapping ?? { email: 'email', name: 'name', department: 'department' },
      status: 'inactive',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'org_id' })
    .select('id, provider, entity_id, sso_url, attribute_mapping, status')
    .single();

  if (error) return apiError(error.message, 500);

  await supabase.from('org_audit_logs').insert({
    org_id, actor_user_id: auth.userId,
    action: 'sso.configured', resource_type: 'sso_config', resource_id: data.id,
    metadata: { provider: body.provider },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.dailyactivitytracker.com';
  return apiOk({
    ...data,
    sp_metadata_url: `${appUrl}/api/v1/org/${org_id}/sso?format=metadata`,
    acs_url: `${appUrl}/api/v1/org/${org_id}/sso/acs`,
    sp_entity_id: `${appUrl}/org/${org_id}/saml`,
  }, undefined, 201);
}

// PATCH /api/v1/org/:org_id/sso — activate / deactivate
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;
  const { org_id } = await ctx.params;

  if (!await requireOrgAdmin(auth.userId, org_id)) return apiError('Forbidden', 403);

  const body = await req.json() as { status?: 'active' | 'inactive' };
  if (!body.status || !['active', 'inactive'].includes(body.status)) {
    return apiError('status must be "active" or "inactive"', 400);
  }

  const { data, error } = await supabase
    .from('org_sso_configs')
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq('org_id', org_id)
    .select('id, status')
    .single();

  if (error) return apiError(error.message, 500);

  await supabase.from('org_audit_logs').insert({
    org_id, actor_user_id: auth.userId,
    action: `sso.${body.status === 'active' ? 'enabled' : 'disabled'}`,
    resource_type: 'sso_config', resource_id: data.id, metadata: {},
  });

  return apiOk(data);
}

// DELETE /api/v1/org/:org_id/sso
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;
  const { org_id } = await ctx.params;

  if (!await requireOrgAdmin(auth.userId, org_id)) return apiError('Forbidden', 403);

  await supabase.from('org_sso_configs').delete().eq('org_id', org_id);

  await supabase.from('org_audit_logs').insert({
    org_id, actor_user_id: auth.userId,
    action: 'sso.deleted', resource_type: 'sso_config', metadata: {},
  });

  return apiOk({ deleted: true });
}
