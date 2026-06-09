import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateApiRequest, apiError, apiOk } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// GET /api/v1/marketplace/my-programs
// Returns enrolled programs with progress, plus programs the user created
export async function GET(req: NextRequest) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const role = url.searchParams.get('role') ?? 'enrolled'; // 'enrolled' | 'created'

  if (role === 'created') {
    const { data, error } = await supabase
      .from('marketplace_programs')
      .select('id, program_name, category, status, price, rating, review_count, sales_count, created_at, duration_days')
      .eq('creator_user_id', auth.userId)
      .order('created_at', { ascending: false });
    if (error) return apiError(error.message, 500);

    const totalRevenue = (data ?? [])
      .filter((p) => p.status === 'published')
      .reduce((s, p) => s + ((p.price * p.sales_count * 0.7)), 0);

    return apiOk(data, { count: data?.length ?? 0, total_creator_revenue_inr: Math.round(totalRevenue) });
  }

  // enrolled
  const { data, error } = await supabase
    .from('program_enrollments')
    .select(`
      id, enrollment_date, status, progress_pct, created_at,
      marketplace_programs(id, program_name, category, duration_days, price, icon_url, cover_image_url, activities)
    `)
    .eq('user_id', auth.userId)
    .order('created_at', { ascending: false });

  if (error) return apiError(error.message, 500);
  return apiOk(data, { count: data?.length ?? 0 });
}
