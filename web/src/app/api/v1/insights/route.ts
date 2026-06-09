import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateApiRequest, apiError, apiOk } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// GET /api/v1/insights?limit=10&offset=0&type=weekly_summary
export async function GET(req: NextRequest) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;

  const sp = req.nextUrl.searchParams;
  const limit = Math.min(parseInt(sp.get('limit') ?? '10', 10), 50);
  const offset = parseInt(sp.get('offset') ?? '0', 10);
  const type = sp.get('type');

  let query = supabase
    .from('ai_insights')
    .select('*', { count: 'exact' })
    .eq('user_id', auth.userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (type) query = query.eq('insight_type', type);

  const { data, error, count } = await query;
  if (error) return apiError(error.message, 500);
  return apiOk(data, { count, limit, offset });
}
