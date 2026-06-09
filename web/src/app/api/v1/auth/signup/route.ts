import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { apiError, apiOk } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

/**
 * POST /api/v1/auth/signup
 *
 * Create a new user account.
 *
 * Body: { email, password, name? }
 *
 * Returns: { user: { id, email }, access_token, refresh_token }
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError('Invalid JSON body', 400); }

  const email = (body.email as string | undefined)?.trim().toLowerCase();
  const password = body.password as string | undefined;
  const name = (body.name as string | undefined)?.trim();

  if (!email) return apiError('email is required', 400, 'VALIDATION_ERROR');
  if (!password || password.length < 8)
    return apiError('password must be at least 8 characters', 400, 'VALIDATION_ERROR');

  // Sign up via Supabase Auth
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip email verification for API sign-ups
    user_metadata: { name: name ?? '' },
  });

  if (error) {
    if (error.message.toLowerCase().includes('already registered') || error.status === 422) {
      return apiError('Email already in use', 409, 'EMAIL_TAKEN');
    }
    return apiError(error.message, 500);
  }

  // Generate a session for the new user
  const { data: session, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
  if (signInErr || !session.session) {
    // User created but session failed — return minimal response
    return apiOk({ user: { id: data.user.id, email: data.user.email } }, { note: 'Account created. Please sign in.' });
  }

  return apiOk(
    {
      user: { id: data.user.id, email: data.user.email, name: name ?? '' },
      access_token: session.session.access_token,
      refresh_token: session.session.refresh_token,
      expires_in: session.session.expires_in,
    },
    undefined
  );
}
