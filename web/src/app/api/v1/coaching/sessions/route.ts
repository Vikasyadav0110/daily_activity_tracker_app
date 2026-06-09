import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateApiRequest, apiError, apiOk } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// GET /api/v1/coaching/sessions?limit=10&offset=0&persona_id=motivator
export async function GET(req: NextRequest) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;

  const sp = req.nextUrl.searchParams;
  const limit = Math.min(parseInt(sp.get('limit') ?? '10', 10), 50);
  const offset = parseInt(sp.get('offset') ?? '0', 10);
  const personaId = sp.get('persona_id');

  let query = supabase
    .from('coaching_sessions')
    .select('id, persona_id, title, started_at, last_message_at, message_count', { count: 'exact' })
    .eq('user_id', auth.userId)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (personaId) query = query.eq('persona_id', personaId);

  const { data, error, count } = await query;
  if (error) return apiError(error.message, 500);
  return apiOk(data, { count, limit, offset });
}
