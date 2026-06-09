import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateApiRequest, apiError, apiOk } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// GET /api/v1/activities
export async function GET(req: NextRequest) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = req.nextUrl;
  const activeOnly = searchParams.get('active') !== 'false';

  let query = supabase.from('activities').select('*').eq('user_id', auth.userId);
  if (activeOnly) query = query.eq('is_active', true);
  query = query.order('created_at', { ascending: true });

  const { data, error } = await query;
  if (error) return apiError(error.message, 500);

  return apiOk(data, { count: data.length });
}

// POST /api/v1/activities
export async function POST(req: NextRequest) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError('Invalid JSON body', 400); }

  const { name, icon, color, frequency, target_count, unit } = body as {
    name?: string;
    icon?: string;
    color?: string;
    frequency?: string;
    target_count?: number;
    unit?: string;
  };

  if (!name?.trim()) return apiError('name is required', 400, 'VALIDATION_ERROR');

  const { data, error } = await supabase.from('activities').insert({
    user_id: auth.userId,
    name: name.trim(),
    icon: icon ?? '🎯',
    color: color ?? '#1565C0',
    frequency: frequency ?? 'daily',
    target_count: target_count ?? 1,
    unit: unit ?? 'times',
    is_active: true,
  }).select().single();

  if (error) return apiError(error.message, 500);
  return apiOk(data);
}
