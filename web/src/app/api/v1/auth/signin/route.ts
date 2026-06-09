import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { apiError, apiOk } from '@/lib/api-auth';

// Use anon key for password-based sign-in (signInWithPassword requires it)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/v1/auth/signin
 *
 * Exchange email + password for JWT tokens.
 *
 * Body: { email, password }
 *
 * Returns: { user: { id, email }, access_token, refresh_token, expires_in }
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError('Invalid JSON body', 400); }

  const email = (body.email as string | undefined)?.trim().toLowerCase();
  const password = body.password as string | undefined;

  if (!email) return apiError('email is required', 400, 'VALIDATION_ERROR');
  if (!password) return apiError('password is required', 400, 'VALIDATION_ERROR');

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    if (error?.message?.toLowerCase().includes('invalid')) {
      return apiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }
    return apiError(error?.message ?? 'Authentication failed', 401, 'AUTH_FAILED');
  }

  return apiOk({
    user: {
      id: data.user.id,
      email: data.user.email,
      name: (data.user.user_metadata?.name as string) ?? '',
    },
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_in: data.session.expires_in,
  });
}
