import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateApiRequest, apiError, apiOk } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// GET /api/v1/activities/:id/logs?from=YYYY-MM-DD&to=YYYY-MM-DD&limit=30&offset=0
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  // Verify activity belongs to this user
  const { data: activity } = await supabase
    .from('activities').select('id').eq('id', id).eq('user_id', auth.userId).maybeSingle();
  if (!activity) return apiError('Activity not found', 404, 'NOT_FOUND');

  const sp = req.nextUrl.searchParams;
  const from = sp.get('from');
  const to = sp.get('to');
  const limit = Math.min(parseInt(sp.get('limit') ?? '30', 10), 100);
  const offset = parseInt(sp.get('offset') ?? '0', 10);

  let query = supabase
    .from('activity_logs')
    .select('*', { count: 'exact' })
    .eq('activity_id', id)
    .eq('user_id', auth.userId)
    .order('log_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (from) query = query.gte('log_date', from);
  if (to) query = query.lte('log_date', to);

  const { data, error, count } = await query;
  if (error) return apiError(error.message, 500);
  return apiOk(data, { count, limit, offset });
}

// POST /api/v1/activities/:id/logs
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  // Verify activity belongs to this user
  const { data: activity } = await supabase
    .from('activities').select('id, target_count').eq('id', id).eq('user_id', auth.userId).maybeSingle();
  if (!activity) return apiError('Activity not found', 404, 'NOT_FOUND');

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError('Invalid JSON body', 400); }

  const log_date = (body.log_date as string | undefined) ?? new Date().toISOString().slice(0, 10);
  const completed_count = (body.completed_count as number | undefined) ?? 1;
  const notes = (body.notes as string | undefined) ?? null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(log_date)) {
    return apiError('log_date must be YYYY-MM-DD', 400, 'VALIDATION_ERROR');
  }

  const { data, error } = await supabase
    .from('activity_logs')
    .upsert({
      activity_id: id,
      user_id: auth.userId,
      log_date,
      completed_count,
      notes,
    }, { onConflict: 'activity_id,log_date' })
    .select().single();

  if (error) return apiError(error.message, 500);
  return apiOk(data);
}
