import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * GDPR Article 20 — Right to data portability.
 * POST /gdpr-data-export — creates an export request, assembles user data as JSON,
 * uploads to Supabase Storage, and stores a signed download URL (48h TTL).
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

  const authHeader = req.headers.get('authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'Missing Authorization' }, 401);
  const token = authHeader.slice(7);
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

  // Rate-limit: only one pending/ready export per user at a time
  const { data: existing } = await supabase
    .from('data_export_requests')
    .select('id, status, download_url, expires_at')
    .eq('user_id', user.id)
    .in('status', ['pending', 'processing', 'ready'])
    .maybeSingle();

  if (existing?.status === 'ready' && existing.download_url) {
    return json({ status: 'ready', downloadUrl: existing.download_url, expiresAt: existing.expires_at });
  }
  if (existing?.status === 'processing') {
    return json({ status: 'processing', message: 'Export already in progress. Check back in a few minutes.' });
  }

  // Create export request
  const { data: exportReq } = await supabase
    .from('data_export_requests')
    .insert({ user_id: user.id, status: 'processing' })
    .select('id').single();

  // Collect all user data in parallel
  const [activities, logs, moods, insights, coaching, programs] = await Promise.all([
    supabase.from('activities').select('*').eq('user_id', user.id),
    supabase.from('activity_logs').select('*').eq('user_id', user.id).order('log_date'),
    supabase.from('mood_logs').select('*').eq('user_id', user.id).order('log_date'),
    supabase.from('ai_insights').select('*').eq('user_id', user.id),
    supabase.from('coaching_sessions').select('*, coaching_messages(role, content, created_at)').eq('user_id', user.id),
    supabase.from('user_programs').select('*, habit_programs(title)').eq('user_id', user.id),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    user: { id: user.id, email: user.email, createdAt: user.created_at },
    activities: activities.data ?? [],
    activityLogs: logs.data ?? [],
    moodLogs: moods.data ?? [],
    aiInsights: insights.data ?? [],
    coachingSessions: coaching.data ?? [],
    habitPrograms: programs.data ?? [],
  };

  const jsonBlob = new TextEncoder().encode(JSON.stringify(exportData, null, 2));
  const fileName = `exports/${user.id}/data-export-${Date.now()}.json`;

  // Upload to Supabase Storage
  const { error: uploadErr } = await supabase.storage
    .from('user-exports')
    .upload(fileName, jsonBlob, { contentType: 'application/json', upsert: true });

  if (uploadErr) {
    await supabase.from('data_export_requests').update({ status: 'pending' }).eq('id', exportReq!.id);
    return json({ error: 'Export storage failed' }, 500);
  }

  // Generate signed URL (48h)
  const { data: signed } = await supabase.storage
    .from('user-exports')
    .createSignedUrl(fileName, 48 * 60 * 60);

  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  await supabase.from('data_export_requests').update({
    status: 'ready',
    download_url: signed?.signedUrl,
    expires_at: expiresAt,
    completed_at: new Date().toISOString(),
  }).eq('id', exportReq!.id);

  return json({ status: 'ready', downloadUrl: signed?.signedUrl, expiresAt });
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
