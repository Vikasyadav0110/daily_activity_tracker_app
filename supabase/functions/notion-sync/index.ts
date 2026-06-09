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

const NOTION_CLIENT_ID = Deno.env.get('NOTION_CLIENT_ID')!;
const NOTION_CLIENT_SECRET = Deno.env.get('NOTION_CLIENT_SECRET')!;
const REDIRECT_URI = `${Deno.env.get('SUPABASE_URL')}/functions/v1/notion-sync/callback`;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();

  // GET /notion-sync/auth — start OAuth2 flow
  if (req.method === 'GET' && path === 'auth') {
    const authHeader = req.headers.get('authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Missing Authorization' }, 401);
    const token = authHeader.slice(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return json({ error: 'Unauthorized' }, 401);

    const state = btoa(JSON.stringify({ userId: user.id, ts: Date.now() }));
    const params = new URLSearchParams({
      client_id: NOTION_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      owner: 'user',
      state,
    });
    return Response.redirect(`https://api.notion.com/v1/oauth/authorize?${params}`);
  }

  // GET /notion-sync/callback — OAuth2 callback
  if (req.method === 'GET' && path === 'callback') {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    if (!code || !state) return json({ error: 'Missing code or state' }, 400);

    let userId: string;
    try { userId = JSON.parse(atob(state)).userId; } catch { return json({ error: 'Invalid state' }, 400); }

    // Exchange code for access token
    const credentials = btoa(`${NOTION_CLIENT_ID}:${NOTION_CLIENT_SECRET}`);
    const tokenRes = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      return json({ error: `Notion token exchange failed: ${err}` }, 502);
    }

    const tokenData = await tokenRes.json() as {
      access_token: string;
      workspace_name: string;
      workspace_id: string;
      bot_id: string;
    };

    // Create or update the integration row
    const { error: dbErr } = await supabase.from('integrations').upsert({
      user_id: userId,
      type: 'notion',
      status: 'active',
      access_token: tokenData.access_token,
      channel: tokenData.workspace_name,
      metadata: {
        workspace_id: tokenData.workspace_id,
        bot_id: tokenData.bot_id,
      },
    }, { onConflict: 'user_id,type' });

    if (dbErr) return json({ error: dbErr.message }, 500);

    const appUrl = Deno.env.get('APP_URL') ?? 'https://app.dailyactivitytracker.com';
    return Response.redirect(`${appUrl}/dashboard/integrations?connected=notion`);
  }

  // POST /notion-sync/sync — push an activity log entry to Notion
  if (req.method === 'POST' && path === 'sync') {
    const authHeader = req.headers.get('authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Missing Authorization' }, 401);
    const token = authHeader.slice(7);
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

    const { data: integration } = await supabase
      .from('integrations').select('access_token, metadata')
      .eq('user_id', user.id).eq('type', 'notion').eq('status', 'active').maybeSingle();
    if (!integration?.access_token) {
      return json({ error: 'Notion not connected. Call /auth first.' }, 400);
    }

    const body = await req.json() as {
      database_id?: string;
      activity_name: string;
      date: string;
      status: string;
      duration_minutes?: number;
      notes?: string;
    };

    if (!body.activity_name || !body.date || !body.status) {
      return json({ error: 'activity_name, date, and status are required' }, 400);
    }

    // Build the Notion page properties
    const properties: Record<string, unknown> = {
      'Name': { title: [{ text: { content: body.activity_name } }] },
      'Date': { date: { start: body.date } },
      'Status': { select: { name: body.status === 'completed' ? 'Completed' : body.status === 'skipped' ? 'Skipped' : 'Partial' } },
    };
    if (body.duration_minutes !== undefined) {
      properties['Duration (min)'] = { number: body.duration_minutes };
    }
    if (body.notes) {
      properties['Notes'] = { rich_text: [{ text: { content: body.notes } }] };
    }

    const pagePayload: Record<string, unknown> = { properties };

    // If user provided a database_id in the body, use it; otherwise create a standalone page
    if (body.database_id) {
      pagePayload['parent'] = { database_id: body.database_id };
    } else {
      // Fallback: create a standalone page in the workspace root
      pagePayload['parent'] = { type: 'workspace', workspace: true };
      // For workspace-root pages only title property is valid
      pagePayload['properties'] = { 'title': [{ text: { content: `${body.activity_name} — ${body.date}` } }] };
    }

    const notionRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.access_token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify(pagePayload),
    });

    if (!notionRes.ok) {
      const err = await notionRes.json();
      return json({ error: 'Notion page creation failed', detail: err }, 502);
    }

    const page = await notionRes.json() as { id: string; url: string };
    return json({ status: 'synced', page_id: page.id, page_url: page.url });
  }

  // POST /notion-sync/setup-database — create a tracker database in the connected workspace
  if (req.method === 'POST' && path === 'setup-database') {
    const authHeader = req.headers.get('authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Missing Authorization' }, 401);
    const token = authHeader.slice(7);
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

    const { data: integration } = await supabase
      .from('integrations').select('access_token, metadata')
      .eq('user_id', user.id).eq('type', 'notion').eq('status', 'active').maybeSingle();
    if (!integration?.access_token) return json({ error: 'Notion not connected' }, 400);

    // Search for a page the user can write to (use the first search result as parent)
    const searchRes = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.access_token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({ filter: { value: 'page', property: 'object' }, page_size: 1 }),
    });

    let parentPageId: string | null = null;
    if (searchRes.ok) {
      const results = await searchRes.json() as { results: Array<{ id: string }> };
      parentPageId = results.results[0]?.id ?? null;
    }

    if (!parentPageId) return json({ error: 'No accessible page found. Share at least one page with the integration.' }, 400);

    const dbRes = await fetch('https://api.notion.com/v1/databases', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.access_token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { type: 'page_id', page_id: parentPageId },
        title: [{ type: 'text', text: { content: 'Daily Activity Tracker' } }],
        properties: {
          'Name':             { title: {} },
          'Date':             { date: {} },
          'Status':           { select: { options: [
            { name: 'Completed', color: 'green' },
            { name: 'Partial', color: 'yellow' },
            { name: 'Skipped', color: 'red' },
          ]}},
          'Duration (min)':   { number: { format: 'number' } },
          'Notes':            { rich_text: {} },
        },
      }),
    });

    if (!dbRes.ok) {
      const err = await dbRes.json();
      return json({ error: 'Notion database creation failed', detail: err }, 502);
    }

    const db = await dbRes.json() as { id: string; url: string };

    // Persist the database_id in the integration metadata
    await supabase.from('integrations')
      .update({ metadata: { ...(integration.metadata ?? {}), database_id: db.id } })
      .eq('user_id', user.id).eq('type', 'notion');

    return json({ status: 'created', database_id: db.id, database_url: db.url });
  }

  // DELETE /notion-sync/disconnect
  if (req.method === 'DELETE' && path === 'disconnect') {
    const authHeader = req.headers.get('authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Missing Authorization' }, 401);
    const token = authHeader.slice(7);
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

    await supabase.from('integrations')
      .update({ status: 'inactive', access_token: null })
      .eq('user_id', user.id).eq('type', 'notion');
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
