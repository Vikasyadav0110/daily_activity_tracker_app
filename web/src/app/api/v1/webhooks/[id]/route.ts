import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateApiRequest, apiError, apiOk } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/v1/webhooks/:id — update events list or status
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;

  const { data: wh } = await supabase
    .from('webhooks').select('user_id').eq('id', id).maybeSingle();
  if (!wh) return apiError('Webhook not found', 404);
  if (wh.user_id !== auth.userId) return apiError('Forbidden', 403);

  const body = await req.json() as { events?: string[]; status?: string; url?: string };
  const updates: Record<string, unknown> = {};
  if (body.url) {
    try { new URL(body.url); } catch { return apiError('Invalid URL', 400); }
    updates.url = body.url;
  }
  if (body.events) updates.events = body.events;
  if (body.status && ['active', 'paused'].includes(body.status)) {
    updates.status = body.status;
    if (body.status === 'active') updates.failure_count = 0;
  }

  const { data, error } = await supabase.from('webhooks').update(updates).eq('id', id).select().single();
  if (error) return apiError(error.message, 500);
  return apiOk(data);
}

// DELETE /api/v1/webhooks/:id
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;

  const { data: wh } = await supabase.from('webhooks').select('user_id').eq('id', id).maybeSingle();
  if (!wh) return apiError('Webhook not found', 404);
  if (wh.user_id !== auth.userId) return apiError('Forbidden', 403);

  await supabase.from('webhooks').delete().eq('id', id);
  return apiOk({ deleted: true });
}
