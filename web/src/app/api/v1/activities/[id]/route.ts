import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateApiRequest, apiError, apiOk } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// GET /api/v1/activities/:id
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const { data, error } = await supabase
    .from('activities').select('*').eq('id', id).eq('user_id', auth.userId).maybeSingle();
  if (error) return apiError(error.message, 500);
  if (!data) return apiError('Activity not found', 404, 'NOT_FOUND');
  return apiOk(data);
}

// PATCH /api/v1/activities/:id
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError('Invalid JSON body', 400); }

  const allowed = ['name', 'icon', 'color', 'frequency', 'target_count', 'unit', 'is_active'];
  const updates: Record<string, unknown> = {};
  for (const k of allowed) { if (body[k] !== undefined) updates[k] = body[k]; }

  if (Object.keys(updates).length === 0) return apiError('No valid fields to update', 400);

  const { data, error } = await supabase
    .from('activities').update(updates).eq('id', id).eq('user_id', auth.userId).select().maybeSingle();
  if (error) return apiError(error.message, 500);
  if (!data) return apiError('Activity not found', 404, 'NOT_FOUND');
  return apiOk(data);
}

// DELETE /api/v1/activities/:id
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const { error } = await supabase
    .from('activities').delete().eq('id', id).eq('user_id', auth.userId);
  if (error) return apiError(error.message, 500);
  return apiOk({ deleted: true, id });
}
