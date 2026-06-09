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

const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY')!;
const MODEL = 'claude-haiku-4-5-20251001';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authHeader = req.headers.get('authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'Missing Authorization' }, 401);
  const token = authHeader.slice(7);
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // Get active activities
  const { data: activities } = await supabase
    .from('activities')
    .select('id, name, target_count, frequency')
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (!activities?.length) return json({ predictions: [] });

  // Get last 30 days of logs per activity
  const { data: logs } = await supabase
    .from('activity_logs')
    .select('activity_id, log_date, completed_count')
    .eq('user_id', user.id)
    .gte('log_date', thirtyDaysAgo)
    .order('log_date', { ascending: false });

  const logsByActivity: Record<string, Array<{ log_date: string; completed_count: number }>> = {};
  for (const log of logs ?? []) {
    logsByActivity[log.activity_id] ??= [];
    logsByActivity[log.activity_id].push({ log_date: log.log_date, completed_count: log.completed_count });
  }

  // Calculate risk score for each activity using heuristics + Claude
  const activitySummaries = activities.map((a) => {
    const actLogs = logsByActivity[a.id] ?? [];
    const completedDays = actLogs.filter((l) => l.completed_count >= a.target_count).length;
    const totalDays = 30;
    const completionRate = completedDays / totalDays;

    // Check last 7 days streak
    const last7 = actLogs.slice(0, 7);
    const recentStreak = last7.filter((l) => l.completed_count >= a.target_count).length;

    // Detect declining trend: compare last 7 vs prior 7
    const prior7 = actLogs.slice(7, 14);
    const recentRate = recentStreak / 7;
    const priorRate = prior7.filter((l) => l.completed_count >= a.target_count).length / 7;
    const declining = recentRate < priorRate - 0.2;

    return {
      id: a.id,
      name: a.name,
      completionRate: Math.round(completionRate * 100),
      recentStreak,
      declining,
      lastLogged: actLogs[0]?.log_date ?? null,
    };
  });

  // Ask Claude to generate risk scores and reasoning
  const prompt = `You are a habit analytics engine. Analyze these activity stats and return a JSON array of predictions.

Activities (last 30 days stats):
${activitySummaries.map((a) => `- ${a.name}: ${a.completionRate}% overall, ${a.recentStreak}/7 recent days, ${a.declining ? 'DECLINING trend' : 'stable trend'}, last logged: ${a.lastLogged ?? 'never'}`).join('\n')}

Today: ${today}

Return ONLY valid JSON array (no markdown, no explanation):
[
  {
    "activityId": "<id>",
    "riskScore": <0.0-1.0>,
    "reasoning": "<1 sentence why>"
  }
]

Risk score guide: 0.0=very consistent, 0.5=moderate risk, 1.0=high risk of missing today.
Activity IDs: ${activitySummaries.map((a) => `${a.name}=${a.id}`).join(', ')}`;

  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  let predictions: Array<{ activityId: string; riskScore: number; reasoning: string }> = [];
  if (claudeRes.ok) {
    const claudeData = await claudeRes.json() as { content: Array<{ text: string }> };
    const rawText = claudeData.content?.[0]?.text ?? '[]';
    try {
      predictions = JSON.parse(rawText);
    } catch {
      // Fall back to heuristic scores if Claude returns malformed JSON
      predictions = activitySummaries.map((a) => ({
        activityId: a.id,
        riskScore: a.declining ? 0.8 : a.recentStreak < 3 ? 0.6 : 0.2,
        reasoning: a.declining ? 'Completion rate declining over the past week.' : a.recentStreak < 3 ? 'Low recent completion rate.' : 'Consistent recent performance.',
      }));
    }
  }

  // Upsert predictions into DB
  if (predictions.length > 0) {
    await supabase.from('habit_predictions').upsert(
      predictions.map((p) => ({
        user_id: user.id,
        activity_id: p.activityId,
        risk_score: Math.min(1, Math.max(0, p.riskScore)),
        reasoning: p.reasoning,
        predicted_for: today,
      })),
      { onConflict: 'user_id,activity_id,predicted_for' },
    );
  }

  return json({ predictions, count: predictions.length });
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
