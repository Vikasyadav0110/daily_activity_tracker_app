import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response('Unauthorized', { status: 401 });
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) return new Response('Unauthorized', { status: 401 });

    const { week_start } = await req.json() as { week_start: string };
    if (!week_start) return new Response('week_start required', { status: 400 });

    // 24h cache check — avoid duplicate Claude calls
    const { data: cached } = await supabase
      .from('ai_insights')
      .select('id, insight_title, insight_text, xp_reward')
      .eq('user_id', user.id)
      .eq('insight_week_start', week_start)
      .eq('insight_type', 'weekly_review')
      .maybeSingle();

    if (cached) {
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch last week's activity logs
    const weekEnd = new Date(week_start);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    const { data: logs } = await supabase
      .from('cloud_activity_logs')
      .select('log_date, status, duration_minutes, cloud_activities(name, category)')
      .eq('user_id', user.id)
      .gte('log_date', week_start)
      .lt('log_date', weekEndStr);

    const { data: streaks } = await supabase
      .from('cloud_activities')
      .select('name, category')
      .eq('user_id', user.id)
      .eq('is_archived', false);

    const totalActivities = streaks?.length ?? 0;
    const completedLogs = (logs ?? []).filter(l => l.status === 'completed');
    const completionRate = totalActivities > 0
      ? Math.round((completedLogs.length / (totalActivities * 7)) * 100)
      : 0;

    // Build prompt context
    const activitySummary = completedLogs
      .reduce((acc: Record<string, number>, log) => {
        const name = (log.cloud_activities as { name: string } | null)?.name ?? 'Unknown';
        acc[name] = (acc[name] ?? 0) + 1;
        return acc;
      }, {});

    const summaryLines = Object.entries(activitySummary)
      .map(([name, count]) => `- ${name}: completed ${count}/7 days`)
      .join('\n');

    const prompt = `You are an encouraging personal coach for an Indian productivity app user. Analyse their week and write a short, warm, personalized weekly review.

Week: ${week_start} to ${weekEndStr}
Overall completion: ${completionRate}%
Activity breakdown:
${summaryLines || '- No activities logged this week'}

Write a 2-3 sentence insight that:
1. Acknowledges what they did well (be specific with activity names)
2. Identifies one pattern or trend
3. Gives one actionable suggestion for next week

Keep it warm, motivating, and under 80 words. Use simple English. End with a motivational Hindi phrase (Romanized, with translation in brackets).
Return JSON: { "title": "short title (under 8 words)", "text": "the insight paragraph" }`;

    let insightTitle = 'Your Weekly Review';
    let insightText = completionRate >= 70
      ? `Great week! You completed ${completionRate}% of your activities. Keep the momentum going next week.`
      : `You completed ${completionRate}% of your activities this week. Every small step counts — pick one activity to focus on next week. Karte raho! (Keep going!)`;

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (apiKey) {
      try {
        const anthropic = new Anthropic({ apiKey });
        const message = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 256,
          messages: [{ role: 'user', content: prompt }],
        });
        const content = message.content[0];
        if (content.type === 'text') {
          const parsed = JSON.parse(content.text) as { title?: string; text?: string };
          insightTitle = parsed.title ?? insightTitle;
          insightText = parsed.text ?? insightText;
        }
      } catch {
        // Fall through to hardcoded fallback — non-fatal
      }
    }

    // Store insight
    const { data: inserted } = await supabase
      .from('ai_insights')
      .insert({
        user_id: user.id,
        insight_week_start: week_start,
        insight_type: 'weekly_review',
        insight_title: insightTitle,
        insight_text: insightText,
        insight_data: { completion_rate: completionRate, activity_summary: activitySummary },
        xp_reward: 50,
      })
      .select('id, insight_title, insight_text, xp_reward')
      .single();

    return new Response(JSON.stringify(inserted), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('generate-weekly-review error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
