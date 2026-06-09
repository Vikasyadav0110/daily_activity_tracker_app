import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateApiRequest, apiError, apiOk } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

type Ctx = { params: Promise<{ id: string }> };

// GET /api/v1/marketplace/programs/:id — public
export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;

  const { data, error } = await supabase
    .from('marketplace_programs')
    .select('id, program_name, program_desc, category, activities, duration_days, price, icon_url, cover_image_url, rating, review_count, sales_count, featured, revenue_share_pct, creator_user_id, status, created_at')
    .eq('id', id)
    .in('status', ['published', 'draft'])
    .maybeSingle();

  if (error) return apiError(error.message, 500);
  if (!data) return apiError('Program not found', 404);
  if (data.status === 'draft') {
    // Only creator can view drafts — requires auth
    const auth = await authenticateApiRequest(_req);
    if (!auth.ok) return apiError('Program not found', 404);
    if (auth.userId !== data.creator_user_id) return apiError('Program not found', 404);
  }
  return apiOk(data);
}

// PATCH /api/v1/marketplace/programs/:id — creator only
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;

  const { data: existing } = await supabase
    .from('marketplace_programs').select('creator_user_id, status').eq('id', id).maybeSingle();
  if (!existing) return apiError('Program not found', 404);
  if (existing.creator_user_id !== auth.userId) return apiError('Forbidden', 403);

  const body = await req.json() as {
    program_name?: string;
    program_desc?: string;
    activities?: unknown[];
    duration_days?: number;
    price?: number;
    icon_url?: string;
    cover_image_url?: string;
    status?: string;
  };

  const ALLOWED_STATUSES = ['draft', 'under_review', 'archived'];
  if (body.status && !ALLOWED_STATUSES.includes(body.status)) {
    return apiError(`status transition not allowed. Use under_review to submit for review.`, 400);
  }

  const updates: Record<string, unknown> = {};
  if (body.program_name !== undefined) updates.program_name = body.program_name;
  if (body.program_desc !== undefined) updates.program_desc = body.program_desc;
  if (body.activities !== undefined) updates.activities = body.activities;
  if (body.duration_days !== undefined) updates.duration_days = body.duration_days;
  if (body.price !== undefined) updates.price = body.price;
  if (body.icon_url !== undefined) updates.icon_url = body.icon_url;
  if (body.cover_image_url !== undefined) updates.cover_image_url = body.cover_image_url;
  if (body.status !== undefined) updates.status = body.status;

  const { data, error } = await supabase
    .from('marketplace_programs').update(updates).eq('id', id).select().single();
  if (error) return apiError(error.message, 500);
  return apiOk(data);
}

// DELETE /api/v1/marketplace/programs/:id — creator only, only drafts
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;

  const { data: existing } = await supabase
    .from('marketplace_programs').select('creator_user_id, status').eq('id', id).maybeSingle();
  if (!existing) return apiError('Program not found', 404);
  if (existing.creator_user_id !== auth.userId) return apiError('Forbidden', 403);
  if (existing.status === 'published') return apiError('Cannot delete a published program. Archive it first.', 409);

  await supabase.from('marketplace_programs').delete().eq('id', id);
  return apiOk({ deleted: true });
}
