import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
);

const SLACK_CLIENT_ID = Deno.env.get('SLACK_CLIENT_ID')!;
const SLACK_CLIENT_SECRET = Deno.env.get('SLACK_CLIENT_SECRET')!;
const REDIRECT_URI = `${Deno.env.get('SUPABASE_URL')}/functions/v1/slack-notify/callback`;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();

  // GET /slack-notify/auth — start Slack OAuth2 flow
  if (req.method === 'GET' && path === 'auth') {
    const authHeader = req.headers.get('authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Missing Authorization' }, 401);
    const token = authHeader.slice(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return json({ error: 'Unauthorized' }, 401);

    const state = btoa(JSON.stringify({ userId: user.id, ts: Date.now() }));
    const params = new URLSearchParams({
      client_id: SLACK_CLIENT_ID,
      scope: 'incoming-webhook,chat:write',
      redirect_uri: REDIRECT_URI,
      state,
    });
    return Response.redirect(`https://slack.com/oauth/v2/authorize?${params}`);
  }

  // GET /slack-notify/callback — OAuth2 callback
  if (req.method === 'GET' && path === 'callback') {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    if (!code || !state) return json({ error: 'Missing code or state' }, 400);

    let userId: string;
    try { userId = JSON.parse(atob(state)).userId; } catch { return json({ error: 'Invalid state' }, 400); }

    const tokenRes = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: SLACK_CLIENT_ID,
        client_secret: SLACK_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
      }),
    });
    const data = await tokenRes.json() as {
      ok: boolean;
      incoming_webhook?: { url: string; channel: string };
      access_token?: string;
      error?: string;
    };

    if (!data.ok) return json({ error: data.error }, 400);

    await supabase.from('integrations').upsert({
      user_id: userId,
      type: 'slack',
      access_token: data.access_token,
      webhook_url: data.incoming_webhook?.url,
      channel: data.incoming_webhook?.channel,
      status: 'active',
    }, { onConflict: 'user_id,type' });

    const appUrl = Deno.env.get('WEB_APP_URL') ?? 'https://your-domain.com';
    return Response.redirect(`${appUrl}/dashboard/settings?integration=slack&status=connected`);
  }

  // POST /slack-notify/send — send a message to the user's Slack channel
  if (req.method === 'POST' && path === 'send') {
    const authHeader = req.headers.get('authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Missing Authorization' }, 401);
    const token = authHeader.slice(7);
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

    const { data: integration } = await supabase
      .from('integrations').select('webhook_url')
      .eq('user_id', user.id).eq('type', 'slack').eq('status', 'active').maybeSingle();
    if (!integration?.webhook_url) {
      return json({ error: 'Slack not connected. Call /auth first.' }, 400);
    }

    const body = await req.json() as { text?: string; blocks?: unknown[] };
    if (!body.text && !body.blocks) return json({ error: 'text or blocks required' }, 400);

    const slackRes = await fetch(integration.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: body.text, blocks: body.blocks }),
    });

    if (!slackRes.ok) return json({ error: 'Slack delivery failed' }, 502);
    return json({ status: 'sent' });
  }

  // POST /slack-notify/broadcast — internal trigger to notify user on events (called by DB triggers or other functions)
  if (req.method === 'POST' && path === 'broadcast') {
    // Only callable with service role secret
    const secret = req.headers.get('x-internal-secret');
    if (secret !== Deno.env.get('INTERNAL_FUNCTION_SECRET')) {
      return json({ error: 'Forbidden' }, 403);
    }

    const body = await req.json() as { userId: string; event: string; payload: Record<string, unknown> };
    const { userId, event, payload } = body;

    const { data: integration } = await supabase
      .from('integrations').select('webhook_url')
      .eq('user_id', userId).eq('type', 'slack').eq('status', 'active').maybeSingle();
    if (!integration?.webhook_url) return json({ status: 'no_integration' });

    const messages: Record<string, string> = {
      activity_logged: `✅ *${payload.activityName}* logged for ${payload.date}`,
      streak_achieved: `🔥 *${payload.streak}-day streak* achieved! Keep it up!`,
      insight_generated: `💡 New AI insight: ${payload.summary}`,
      mood_logged: `😊 Mood logged: *${payload.rating}/10* — ${payload.date}`,
    };

    const text = messages[event] ?? `📊 Daily Activity Tracker: ${event}`;
    await fetch(integration.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    return json({ status: 'sent' });
  }

  // DELETE /slack-notify/disconnect
  if (req.method === 'DELETE' && path === 'disconnect') {
    const authHeader = req.headers.get('authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Missing Authorization' }, 401);
    const token = authHeader.slice(7);
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

    await supabase.from('integrations')
      .update({ status: 'inactive' })
      .eq('user_id', user.id).eq('type', 'slack');
    return json({ status: 'disconnected' });
  }

  return json({ error: 'Not Found' }, 404);
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
