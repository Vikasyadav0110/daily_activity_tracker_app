import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateApiRequest, apiError, apiOk } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// DELETE /api/v1/api-keys/:id — revoke an API key
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const { data, error } = await supabase
    .from('api_keys')
    .update({ status: 'revoked' })
    .eq('id', id)
    .eq('user_id', auth.userId)
    .select('id')
    .maybeSingle();

  if (error) return apiError(error.message, 500);
  if (!data) return apiError('API key not found', 404, 'NOT_FOUND');

  return apiOk({ revoked: true, id });
}
