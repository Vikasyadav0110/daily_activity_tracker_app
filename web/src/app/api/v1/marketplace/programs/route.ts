import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateApiRequest, apiError, apiOk } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const CATEGORIES = ['fitness', 'study', 'wellness', 'spiritual', 'productivity', 'nutrition'] as const;

// GET /api/v1/marketplace/programs
// Query: category, featured, sort (rating|sales|price_asc|price_desc|newest), limit, offset, q (search)
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const category = url.searchParams.get('category');
  const featured = url.searchParams.get('featured');
  const sort = url.searchParams.get('sort') ?? 'rating';
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20'), 100);
  const offset = parseInt(url.searchParams.get('offset') ?? '0');
  const q = url.searchParams.get('q');

  let query = supabase
    .from('marketplace_programs')
    .select(
      'id, program_name, program_desc, category, duration_days, price, icon_url, cover_image_url, rating, review_count, sales_count, featured, revenue_share_pct, creator_user_id, created_at',
      { count: 'exact' }
    )
    .eq('status', 'published')
    .range(offset, offset + limit - 1);

  if (category && CATEGORIES.includes(category as typeof CATEGORIES[number])) {
    query = query.eq('category', category);
  }
  if (featured === 'true') query = query.eq('featured', true);
  if (q) query = query.ilike('program_name', `%${q}%`);

  switch (sort) {
    case 'sales':      query = query.order('sales_count', { ascending: false }); break;
    case 'price_asc':  query = query.order('price', { ascending: true }); break;
    case 'price_desc': query = query.order('price', { ascending: false }); break;
    case 'newest':     query = query.order('created_at', { ascending: false }); break;
    default:           query = query.order('rating', { ascending: false }); break;
  }

  const { data, error, count } = await query;
  if (error) return apiError(error.message, 500);
  return apiOk(data, { count: count ?? 0, limit, offset });
}

// POST /api/v1/marketplace/programs — create a new program (becomes draft)
export async function POST(req: NextRequest) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;

  const body = await req.json() as {
    program_name?: string;
    program_desc?: string;
    category?: string;
    activities?: unknown[];
    duration_days?: number;
    price?: number;
    icon_url?: string;
    cover_image_url?: string;
  };

  if (!body.program_name?.trim()) return apiError('program_name is required', 400);
  if (!body.category || !CATEGORIES.includes(body.category as typeof CATEGORIES[number])) {
    return apiError(`category must be one of: ${CATEGORIES.join(', ')}`, 400);
  }
  if (body.price !== undefined && (body.price < 0 || body.price > 99999)) {
    return apiError('price must be between 0 and 99999 INR', 400);
  }

  const { data, error } = await supabase
    .from('marketplace_programs')
    .insert({
      creator_user_id: auth.userId,
      program_name: body.program_name.trim(),
      program_desc: body.program_desc ?? null,
      category: body.category,
      activities: body.activities ?? [],
      duration_days: body.duration_days ?? 30,
      price: body.price ?? 0,
      icon_url: body.icon_url ?? null,
      cover_image_url: body.cover_image_url ?? null,
      status: 'draft',
    })
    .select()
    .single();

  if (error) return apiError(error.message, 500);
  return apiOk(data, undefined, 201);
}
