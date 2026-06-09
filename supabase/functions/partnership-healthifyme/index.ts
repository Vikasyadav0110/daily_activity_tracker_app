import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// HealthifyMe Partnership Integration
// Stub: Set HEALTHIFYME_API_KEY in supabase secrets before activating
// supabase secrets set HEALTHIFYME_API_KEY=your_key_here
const HEALTHIFYME_API_KEY = Deno.env.get('HEALTHIFYME_API_KEY');
const HEALTHIFYME_BASE_URL = 'https://api.healthifyme.com/v2'; // placeholder — confirm with HealthifyMe partner portal

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

interface NutritionLog {
  date: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  water_ml: number;
}

async function getNutritionLogs(userId: string, date: string): Promise<NutritionLog> {
  if (!HEALTHIFYME_API_KEY) throw new Error('HEALTHIFYME_API_KEY not configured');
  const res = await fetch(`${HEALTHIFYME_BASE_URL}/users/${userId}/nutrition?date=${date}`, {
    headers: { 'X-API-Key': HEALTHIFYME_API_KEY },
  });
  if (!res.ok) throw new Error(`HealthifyMe API error: ${res.status}`);
  return res.json() as Promise<NutritionLog>;
}

async function syncMoodToHealthifyme(userId: string, mood: number, energy: number, date: string) {
  if (!HEALTHIFYME_API_KEY) throw new Error('HEALTHIFYME_API_KEY not configured');
  const res = await fetch(`${HEALTHIFYME_BASE_URL}/users/${userId}/wellness`, {
    method: 'POST',
    headers: { 'X-API-Key': HEALTHIFYME_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mood_score: mood, energy_score: energy, date }),
  });
  if (!res.ok) throw new Error(`HealthifyMe wellness sync error: ${res.status}`);
  return res.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get('Authorization') ?? '';
    const { data: { user }, error } = await supabase.auth.getUser(auth.replace('Bearer ', ''));
    if (error || !user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });

    const url = new URL(req.url);
    const path = url.pathname.split('/').filter(Boolean).pop();

    if (!HEALTHIFYME_API_KEY) {
      return Response.json({
        stub: true,
        message: 'HealthifyMe integration not configured. Set HEALTHIFYME_API_KEY.',
        path,
      }, { headers: corsHeaders });
    }

    // GET /nutrition?healthifyme_user_id=xxx&date=yyyy-mm-dd
    if (req.method === 'GET' && path === 'nutrition') {
      const hUserId = url.searchParams.get('healthifyme_user_id');
      const date = url.searchParams.get('date') ?? new Date().toISOString().split('T')[0];
      if (!hUserId) return Response.json({ error: 'healthifyme_user_id required' }, { status: 400, headers: corsHeaders });
      const nutrition = await getNutritionLogs(hUserId, date);

      // Mirror as DAT mood log note
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        logged_at: `${date}T00:00:00Z`,
        notes: `HealthifyMe: ${nutrition.calories} kcal, ${nutrition.protein_g}g protein, ${nutrition.water_ml}ml water`,
        source: 'healthifyme',
      });

      return Response.json({ data: nutrition }, { headers: corsHeaders });
    }

    // POST /sync-mood — push DAT mood score to HealthifyMe
    if (req.method === 'POST' && path === 'sync-mood') {
      const body = await req.json() as { healthifyme_user_id: string; mood: number; energy: number; date: string };
      const data = await syncMoodToHealthifyme(body.healthifyme_user_id, body.mood, body.energy, body.date);
      return Response.json({ data }, { headers: corsHeaders });
    }

    return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: msg }, { status: 500, headers: corsHeaders });
  }
});
