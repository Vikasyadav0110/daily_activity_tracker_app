import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export type AuthResult =
  | { ok: true; userId: string; tier: 'free' | 'pro' | 'enterprise'; keyId: string }
  | { ok: false; response: NextResponse };

/** Authenticate an API request via Bearer token (JWT or API key) */
export async function authenticateApiRequest(req: NextRequest): Promise<AuthResult> {
  const auth = req.headers.get('authorization') ?? '';

  if (!auth.startsWith('Bearer ')) {
    return { ok: false, response: apiError('Missing Authorization: Bearer <token>', 401) };
  }

  const token = auth.slice(7);

  // DAT API keys start with "dat_"
  if (token.startsWith('dat_')) {
    const keyHash = createHash('sha256').update(token).digest('hex');
    const { data: key } = await supabase
      .from('api_keys')
      .select('id, user_id, tier, status, requests_this_month, rate_limit')
      .eq('key_hash', keyHash)
      .maybeSingle();

    if (!key || key.status !== 'active') {
      return { ok: false, response: apiError('Invalid or revoked API key', 401) };
    }

    if (key.requests_this_month >= key.rate_limit) {
      return { ok: false, response: apiError('Rate limit exceeded. Upgrade at app.dailyactivitytracker.com/dashboard/api-keys', 429) };
    }

    // Increment usage counter (fire-and-forget)
    supabase.from('api_keys')
      .update({ requests_this_month: key.requests_this_month + 1, last_used_at: new Date().toISOString() })
      .eq('id', key.id).then(() => {});

    // Log the request (fire-and-forget)
    supabase.from('api_logs').insert({
      api_key_id: key.id,
      user_id: key.user_id,
      endpoint: req.nextUrl.pathname,
      method: req.method,
      status_code: 200, // updated via middleware or ignored for now
      ip_address: req.headers.get('x-forwarded-for') ?? null,
    }).then(() => {});

    return { ok: true, userId: key.user_id, tier: key.tier, keyId: key.id };
  }

  // Otherwise treat as Supabase JWT
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { ok: false, response: apiError('Invalid JWT', 401) };
  }

  return { ok: true, userId: user.id, tier: 'pro', keyId: 'jwt' };
}

export function apiError(message: string, status: number, code?: string) {
  return NextResponse.json({ error: { message, code: code ?? String(status) } }, { status });
}

export function apiOk<T>(data: T, meta?: Record<string, unknown>, status = 200) {
  return NextResponse.json({ data, ...(meta ? { meta } : {}) }, { status });
}
