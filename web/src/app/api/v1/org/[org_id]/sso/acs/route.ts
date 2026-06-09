import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// SAML 2.0 Assertion Consumer Service (ACS)
// The IdP (Google Workspace / Microsoft 365 / Okta) POSTs a base64-encoded SAMLResponse here.
// We decode the XML, extract user attributes, and create/find the Supabase user.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

type Ctx = { params: Promise<{ org_id: string }> };

function extractXmlValue(xml: string, tag: string): string | null {
  const re = new RegExp(`<[^>]*${tag}[^>]*>([^<]+)<`, 'i');
  return xml.match(re)?.[1]?.trim() ?? null;
}

function extractNameId(xml: string): string | null {
  return extractXmlValue(xml, 'NameID');
}

function extractAttribute(xml: string, name: string): string | null {
  // Match <saml:Attribute Name="name"><saml:AttributeValue>value</saml:AttributeValue>
  const re = new RegExp(`Name=["']${name}["'][^>]*>[\\s\\S]*?AttributeValue[^>]*>([^<]+)<`, 'i');
  return xml.match(re)?.[1]?.trim() ?? null;
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { org_id } = await ctx.params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.dailyactivitytracker.com';

  let samlResponse: string;
  try {
    const form = await req.formData();
    const raw = form.get('SAMLResponse') as string | null;
    if (!raw) throw new Error('Missing SAMLResponse');
    samlResponse = Buffer.from(raw, 'base64').toString('utf-8');
  } catch {
    return NextResponse.redirect(`${appUrl}/sign-in?error=saml_invalid`);
  }

  // Load SSO config for this org
  const { data: ssoConfig } = await supabase
    .from('org_sso_configs')
    .select('provider, entity_id, attribute_mapping, status')
    .eq('org_id', org_id).eq('status', 'active').maybeSingle();

  if (!ssoConfig) {
    return NextResponse.redirect(`${appUrl}/sign-in?error=sso_not_configured`);
  }

  // Extract email from SAML assertion using configured attribute mapping
  const mapping = (ssoConfig.attribute_mapping ?? {}) as Record<string, string>;
  const emailAttr = mapping.email ?? 'email';
  const nameAttr = mapping.name ?? 'name';

  const email = extractNameId(samlResponse) ?? extractAttribute(samlResponse, emailAttr);
  const displayName = extractAttribute(samlResponse, nameAttr);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.redirect(`${appUrl}/sign-in?error=saml_no_email`);
  }

  // Find or create the user
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find((u) => u.email === email);

  let userId: string;
  if (existingUser) {
    userId = existingUser.id;
  } else {
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: displayName, sso_provider: ssoConfig.provider },
    });
    if (createErr || !newUser.user) {
      return NextResponse.redirect(`${appUrl}/sign-in?error=sso_user_create_failed`);
    }
    userId = newUser.user.id;
  }

  // Ensure user is an active org member
  await supabase.from('org_members').upsert({
    org_id,
    user_id: userId,
    role: 'member',
    status: 'active',
    joined_at: new Date().toISOString(),
    invited_email: email,
  }, { onConflict: 'org_id,user_id', ignoreDuplicates: true });

  // Update seats_used
  await supabase
    .from('organizations')
    .update({ seats_used: supabase.rpc('increment_org_seats_used', { p_org_id: org_id }) })
    .eq('id', org_id);

  // Issue a magic-link style session by generating a sign-in link
  const { data: link, error: linkErr } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${appUrl}/dashboard` },
  });

  if (linkErr || !link?.properties?.action_link) {
    return NextResponse.redirect(`${appUrl}/sign-in?error=sso_session_failed`);
  }

  await supabase.from('org_audit_logs').insert({
    org_id, actor_user_id: userId,
    action: 'member.sso_login',
    resource_type: 'member',
    metadata: { provider: ssoConfig.provider, email },
  });

  return NextResponse.redirect(link.properties.action_link);
}
