import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-api-key, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
);

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);

    // POST /zapier-webhook/subscribe — Zapier calls this to register a webhook URL
    if (req.method === 'POST' && url.pathname.endsWith('/subscribe')) {
      const authHeader = req.headers.get('authorization') ?? '';
      if (!authHeader.startsWith('Bearer ')) {
        return json({ error: 'Missing Authorization' }, 401);
      }
      const token = authHeader.slice(7);
      const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
      if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

      const body = await req.json();
      const { hookUrl, event } = body as { hookUrl?: string; event?: string };
      if (!hookUrl || !event) return json({ error: 'hookUrl and event are required' }, 400);

      const validEvents = ['activity_logged', 'mood_logged', 'streak_achieved', 'insight_generated'];
      if (!validEvents.includes(event)) {
        return json({ error: `event must be one of: ${validEvents.join(', ')}` }, 400);
      }

      const { data, error } = await supabase.from('webhooks').insert({
        user_id: user.id,
        url: hookUrl,
        events: [event],
        source: 'zapier',
        status: 'active',
      }).select('id').single();

      if (error) return json({ error: error.message }, 500);
      return json({ id: data.id, status: 'subscribed' });
    }

    // DELETE /zapier-webhook/unsubscribe — Zapier calls this to remove a webhook
    if (req.method === 'DELETE' && url.pathname.endsWith('/unsubscribe')) {
      const hookId = url.searchParams.get('id');
      if (!hookId) return json({ error: 'id is required' }, 400);

      await supabase.from('webhooks').update({ status: 'inactive' }).eq('id', hookId);
      return json({ status: 'unsubscribed' });
    }

    // GET /zapier-webhook/poll — Zapier polling trigger (returns sample data)
    if (req.method === 'GET' && url.pathname.endsWith('/poll')) {
      const authHeader = req.headers.get('authorization') ?? '';
      if (!authHeader.startsWith('Bearer ')) return json({ error: 'Missing Authorization' }, 401);
      const token = authHeader.slice(7);
      const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
      if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

      const event = url.searchParams.get('event') ?? 'activity_logged';
      const { data: logs } = await supabase
        .from('activity_logs')
        .select('id, activity_id, log_date, completed_count, created_at, activities(name, icon)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      return json(logs ?? []);
    }

    return json({ error: 'Not Found' }, 404);
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
