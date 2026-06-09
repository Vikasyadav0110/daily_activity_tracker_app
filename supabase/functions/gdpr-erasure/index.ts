import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * GDPR Article 17 / CCPA — Right to erasure.
 *
 * POST /gdpr-erasure — schedules account deletion after 30-day cooling-off period.
 * DELETE /gdpr-erasure — immediately cancels a pending erasure request.
 * POST /gdpr-erasure/execute (internal, service-role only) — performs actual deletion.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
);

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  const isExecute = url.pathname.endsWith('/execute');

  // Internal execute endpoint — called by a cron job daily
  if (isExecute && req.method === 'POST') {
    const secret = req.headers.get('x-internal-secret');
    if (secret !== Deno.env.get('INTERNAL_FUNCTION_SECRET')) return json({ error: 'Forbidden' }, 403);

    const now = new Date().toISOString();
    const { data: dueRequests } = await supabase
      .from('erasure_requests')
      .select('id, user_id')
      .eq('status', 'pending')
      .lte('scheduled_at', now);

    const results = [];
    for (const req of dueRequests ?? []) {
      await supabase.from('erasure_requests').update({ status: 'processing' }).eq('id', req.id);

      // Delete all user data in dependency order
      await supabase.from('coaching_messages').delete()
        .in('session_id', supabase.from('coaching_sessions').select('id').eq('user_id', req.user_id));
      await supabase.from('coaching_sessions').delete().eq('user_id', req.user_id);
      await supabase.from('program_progress').delete()
        .in('user_program_id', supabase.from('user_programs').select('id').eq('user_id', req.user_id));
      await supabase.from('user_programs').delete().eq('user_id', req.user_id);
      await supabase.from('activity_logs').delete().eq('user_id', req.user_id);
      await supabase.from('mood_logs').delete().eq('user_id', req.user_id);
      await supabase.from('ai_insights').delete().eq('user_id', req.user_id);
      await supabase.from('habit_predictions').delete().eq('user_id', req.user_id);
      await supabase.from('activities').delete().eq('user_id', req.user_id);
      await supabase.from('subscriptions').delete().eq('user_id', req.user_id);
      await supabase.from('api_keys').delete().eq('user_id', req.user_id);
      await supabase.from('webhooks').delete().eq('user_id', req.user_id);
      await supabase.from('consent_logs').delete().eq('user_id', req.user_id);
      await supabase.storage.from('user-exports').remove([`exports/${req.user_id}`]);

      // Delete auth user (this cascades remaining FK references)
      await supabase.auth.admin.deleteUser(req.user_id);

      await supabase.from('erasure_requests').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      }).eq('id', req.id);

      results.push({ requestId: req.id, userId: req.user_id, status: 'completed' });
    }

    return json({ processed: results.length, results });
  }

  // User-facing endpoints
  const authHeader = req.headers.get('authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'Missing Authorization' }, 401);
  const token = authHeader.slice(7);
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

  // POST — schedule erasure
  if (req.method === 'POST') {
    // Check no existing pending erasure
    const { data: existing } = await supabase
      .from('erasure_requests')
      .select('id, scheduled_at')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      return json({
        status: 'already_scheduled',
        scheduledAt: existing.scheduled_at,
        message: 'Account deletion already scheduled. You have 30 days to cancel.',
      });
    }

    const body = await req.json().catch(() => ({})) as { reason?: string };
    const scheduledAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data } = await supabase.from('erasure_requests').insert({
      user_id: user.id,
      reason: body.reason ?? null,
      status: 'pending',
      scheduled_at: scheduledAt,
    }).select('id, scheduled_at').single();

    // Revoke all API keys immediately
    await supabase.from('api_keys').update({ status: 'revoked' }).eq('user_id', user.id);

    return json({
      status: 'scheduled',
      requestId: data?.id,
      scheduledAt: data?.scheduled_at,
      message: 'Your account will be permanently deleted after 30 days. You can cancel this request before then.',
    });
  }

  // DELETE — cancel erasure
  if (req.method === 'DELETE') {
    const { data } = await supabase
      .from('erasure_requests')
      .delete()
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .select('id').maybeSingle();

    if (!data) return json({ error: 'No pending erasure request found' }, 404);

    // Re-activate API keys
    await supabase.from('api_keys').update({ status: 'active' }).eq('user_id', user.id);

    return json({ status: 'cancelled', message: 'Account deletion cancelled. Your data is safe.' });
  }

  return json({ error: 'Method Not Allowed' }, 405);
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
