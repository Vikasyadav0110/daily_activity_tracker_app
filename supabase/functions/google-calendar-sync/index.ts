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

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
const REDIRECT_URI = `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-calendar-sync/callback`;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();

  // GET /google-calendar-sync/auth — start OAuth2 flow
  if (req.method === 'GET' && path === 'auth') {
    const authHeader = req.headers.get('authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Missing Authorization' }, 401);
    const token = authHeader.slice(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return json({ error: 'Unauthorized' }, 401);

    const state = btoa(JSON.stringify({ userId: user.id, ts: Date.now() }));
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar.events',
      access_type: 'offline',
      prompt: 'consent',
      state,
    });
    return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  }

  // GET /google-calendar-sync/callback — OAuth2 callback
  if (req.method === 'GET' && path === 'callback') {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    if (!code || !state) return json({ error: 'Missing code or state' }, 400);

    let userId: string;
    try { userId = JSON.parse(atob(state)).userId; } catch { return json({ error: 'Invalid state' }, 400); }

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });
    const tokens = await tokenRes.json() as { access_token?: string; refresh_token?: string; error?: string };
    if (tokens.error) return json({ error: tokens.error }, 400);

    // Store tokens encrypted in integrations table
    await supabase.from('integrations').upsert({
      user_id: userId,
      type: 'google_calendar',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      status: 'active',
    }, { onConflict: 'user_id,type' });

    // Redirect back to web app settings
    const appUrl = Deno.env.get('WEB_APP_URL') ?? 'https://your-domain.com';
    return Response.redirect(`${appUrl}/dashboard/settings?integration=google_calendar&status=connected`);
  }

  // POST /google-calendar-sync/sync — create calendar event for a scheduled task
  if (req.method === 'POST' && path === 'sync') {
    const authHeader = req.headers.get('authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Missing Authorization' }, 401);
    const token = authHeader.slice(7);
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

    const { data: integration } = await supabase
      .from('integrations').select('access_token, refresh_token')
      .eq('user_id', user.id).eq('type', 'google_calendar').eq('status', 'active').maybeSingle();
    if (!integration) return json({ error: 'Google Calendar not connected. Call /auth first.' }, 400);

    const body = await req.json() as { title?: string; date?: string; time?: string; duration?: number };
    const { title, date, time = '09:00', duration = 30 } = body;
    if (!title || !date) return json({ error: 'title and date are required' }, 400);

    const startDt = new Date(`${date}T${time}:00`);
    const endDt = new Date(startDt.getTime() + duration * 60000);

    const eventRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${integration.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: title,
        start: { dateTime: startDt.toISOString() },
        end: { dateTime: endDt.toISOString() },
        source: { title: 'Daily Activity Tracker', url: 'https://your-domain.com' },
      }),
    });

    if (eventRes.status === 401) {
      // Token expired — refresh it
      const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: integration.refresh_token,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
        }),
      });
      const refreshed = await refreshRes.json() as { access_token?: string };
      if (!refreshed.access_token) return json({ error: 'Failed to refresh Google token' }, 400);

      await supabase.from('integrations')
        .update({ access_token: refreshed.access_token })
        .eq('user_id', user.id).eq('type', 'google_calendar');

      return json({ error: 'Token refreshed. Please retry the sync.' }, 202);
    }

    const event = await eventRes.json();
    return json({ eventId: event.id, htmlLink: event.htmlLink, status: 'created' });
  }

  // DELETE /google-calendar-sync/disconnect
  if (req.method === 'DELETE' && path === 'disconnect') {
    const authHeader = req.headers.get('authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Missing Authorization' }, 401);
    const token = authHeader.slice(7);
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

    await supabase.from('integrations')
      .update({ status: 'inactive' })
      .eq('user_id', user.id).eq('type', 'google_calendar');
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
