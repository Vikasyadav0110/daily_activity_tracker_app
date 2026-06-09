import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { apiError, apiOk } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/v1/auth/refresh
 *
 * Exchange a refresh_token for a new access_token.
 *
 * Body: { refresh_token }
 *
 * Returns: { access_token, refresh_token, expires_in }
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError('Invalid JSON body', 400); }

  const refresh_token = body.refresh_token as string | undefined;
  if (!refresh_token) return apiError('refresh_token is required', 400, 'VALIDATION_ERROR');

  const { data, error } = await supabase.auth.refreshSession({ refresh_token });

  if (error || !data.session) {
    return apiError('Refresh token is invalid or expired', 401, 'REFRESH_EXPIRED');
  }

  return apiOk({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_in: data.session.expires_in,
  });
}
