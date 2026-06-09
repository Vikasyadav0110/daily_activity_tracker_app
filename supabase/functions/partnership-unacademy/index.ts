import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Unacademy Partnership Integration
// Stub: Set UNACADEMY_API_KEY in supabase secrets before activating
// supabase secrets set UNACADEMY_API_KEY=your_key_here
const UNACADEMY_API_KEY = Deno.env.get('UNACADEMY_API_KEY');
const UNACADEMY_BASE_URL = 'https://api.unacademy.com/v1'; // placeholder — confirm with Unacademy partner portal

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

async function getCourses(category?: string) {
  if (!UNACADEMY_API_KEY) {
    return { stub: true, message: 'UNACADEMY_API_KEY not configured', courses: [] };
  }
  const url = new URL(`${UNACADEMY_BASE_URL}/courses`);
  if (category) url.searchParams.set('category', category);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${UNACADEMY_API_KEY}` },
  });
  if (!res.ok) throw new Error(`Unacademy API error: ${res.status}`);
  return res.json();
}

async function syncUserProgress(userId: string, courseId: string, progressPct: number) {
  if (!UNACADEMY_API_KEY) {
    return { stub: true, message: 'UNACADEMY_API_KEY not configured' };
  }
  const res = await fetch(`${UNACADEMY_BASE_URL}/users/${userId}/progress`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UNACADEMY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ course_id: courseId, progress_pct: progressPct }),
  });
  if (!res.ok) throw new Error(`Unacademy progress sync error: ${res.status}`);
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

    if (req.method === 'GET' && path === 'courses') {
      const category = url.searchParams.get('category') ?? undefined;
      const data = await getCourses(category);
      return Response.json({ data }, { headers: corsHeaders });
    }

    if (req.method === 'POST' && path === 'sync-progress') {
      const body = await req.json() as { course_id: string; progress_pct: number };
      const data = await syncUserProgress(user.id, body.course_id, body.progress_pct);

      // Mirror progress to DAT activity log
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        notes: `Unacademy: completed ${body.progress_pct}% of course ${body.course_id}`,
        source: 'unacademy',
        logged_at: new Date().toISOString(),
      });

      return Response.json({ data }, { headers: corsHeaders });
    }

    return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: msg }, { status: 500, headers: corsHeaders });
  }
});
