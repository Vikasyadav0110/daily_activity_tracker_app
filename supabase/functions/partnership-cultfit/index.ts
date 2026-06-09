import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Cult.fit Partnership Integration
// Stub: Set CULTFIT_CLIENT_ID and CULTFIT_CLIENT_SECRET in supabase secrets before activating
// supabase secrets set CULTFIT_CLIENT_ID=your_id CULTFIT_CLIENT_SECRET=your_secret
const CULTFIT_CLIENT_ID = Deno.env.get('CULTFIT_CLIENT_ID');
const CULTFIT_CLIENT_SECRET = Deno.env.get('CULTFIT_CLIENT_SECRET');
const CULTFIT_BASE_URL = 'https://api.cult.fit/partner/v1'; // placeholder — confirm with Cult.fit partner docs

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

async function getPartnerToken(): Promise<string> {
  if (!CULTFIT_CLIENT_ID || !CULTFIT_CLIENT_SECRET) {
    throw new Error('CULTFIT_CLIENT_ID / CULTFIT_CLIENT_SECRET not configured');
  }
  const res = await fetch(`${CULTFIT_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: CULTFIT_CLIENT_ID,
      client_secret: CULTFIT_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });
  if (!res.ok) throw new Error(`Cult.fit token error: ${res.status}`);
  const json = await res.json() as { access_token: string };
  return json.access_token;
}

async function importWorkouts(userId: string, startDate: string, endDate: string) {
  const token = await getPartnerToken();
  const url = new URL(`${CULTFIT_BASE_URL}/users/${userId}/workouts`);
  url.searchParams.set('from', startDate);
  url.searchParams.set('to', endDate);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Cult.fit workouts error: ${res.status}`);
  return res.json() as Promise<{ workouts: Array<{ id: string; name: string; duration_minutes: number; calories: number; date: string }> }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get('Authorization') ?? '';
    const { data: { user }, error } = await supabase.auth.getUser(auth.replace('Bearer ', ''));
    if (error || !user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });

    const url = new URL(req.url);
    const path = url.pathname.split('/').filter(Boolean).pop();

    if (!CULTFIT_CLIENT_ID || !CULTFIT_CLIENT_SECRET) {
      return Response.json({
        stub: true,
        message: 'Cult.fit integration not configured. Set CULTFIT_CLIENT_ID and CULTFIT_CLIENT_SECRET.',
        path,
      }, { headers: corsHeaders });
    }

    if (req.method === 'POST' && path === 'import-workouts') {
      const body = await req.json() as { cultfit_user_id: string; from: string; to: string };
      const { workouts } = await importWorkouts(body.cultfit_user_id, body.from, body.to);

      // Upsert each workout as a DAT activity log
      for (const w of workouts) {
        await supabase.from('activity_logs').upsert({
          user_id: user.id,
          logged_at: w.date,
          duration_minutes: w.duration_minutes,
          notes: `Cult.fit: ${w.name} (${w.calories} cal)`,
          source: 'cultfit',
          external_id: w.id,
        }, { onConflict: 'user_id,external_id' });
      }

      return Response.json({ data: { imported: workouts.length } }, { headers: corsHeaders });
    }

    return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: msg }, { status: 500, headers: corsHeaders });
  }
});
