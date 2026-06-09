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
const MAX_CONTEXT_MESSAGES = 20;    // last 20 messages in context
const MAX_TOKENS = 512;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authHeader = req.headers.get('authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'Missing Authorization' }, 401);
  const token = authHeader.slice(7);
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

  const body = await req.json() as { sessionId?: string; personaId?: string; userMessage?: string };
  const { sessionId, personaId, userMessage } = body;

  if (!sessionId || !personaId || !userMessage?.trim()) {
    return json({ error: 'sessionId, personaId, and userMessage are required' }, 400);
  }

  // Verify session belongs to user
  const { data: session } = await supabase
    .from('coaching_sessions')
    .select('id, user_id, persona_id')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!session) return json({ error: 'Session not found' }, 404);

  // Get persona system prompt
  const { data: persona } = await supabase
    .from('coach_personas')
    .select('system_prompt, name, avatar_emoji')
    .eq('id', personaId)
    .maybeSingle();
  if (!persona) return json({ error: 'Persona not found' }, 404);

  // Load recent activity context for the coach
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [logsRes, moodRes] = await Promise.all([
    supabase
      .from('activity_logs')
      .select('log_date, completed_count, activities(name, target_count)')
      .eq('user_id', user.id)
      .gte('log_date', weekAgo)
      .order('log_date', { ascending: false })
      .limit(20),
    supabase
      .from('mood_logs')
      .select('log_date, mood_rating, energy_level, notes')
      .eq('user_id', user.id)
      .gte('log_date', weekAgo)
      .order('log_date', { ascending: false })
      .limit(7),
  ]);

  const logs = logsRes.data ?? [];
  const moods = moodRes.data ?? [];

  // Build a compact context string for the system prompt
  const activitySummary = logs.length > 0
    ? `Recent activity logs (last 7 days):\n${logs.map((l) => {
        const act = Array.isArray(l.activities) ? l.activities[0] : l.activities;
        return `- ${l.log_date}: ${act?.name ?? 'Unknown'} (${l.completed_count}/${act?.target_count ?? 1})`;
      }).join('\n')}`
    : 'No activity logs in the last 7 days.';

  const moodSummary = moods.length > 0
    ? `Recent mood (last 7 days):\n${moods.map((m) => `- ${m.log_date}: mood ${m.mood_rating}/10, energy ${m.energy_level ?? '?'}/10${m.notes ? ` (${m.notes})` : ''}`).join('\n')}`
    : 'No mood logs this week.';

  const systemPrompt = [
    persona.system_prompt,
    '',
    '## User Context (do not share raw data — use it naturally to personalise your response)',
    activitySummary,
    moodSummary,
    `Today's date: ${today}`,
    '',
    'Keep responses concise (2-4 sentences). Be warm, specific, and actionable. Never be generic.',
  ].join('\n');

  // Load prior conversation history
  const { data: priorMessages } = await supabase
    .from('coaching_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(MAX_CONTEXT_MESSAGES);

  const history = (priorMessages ?? []).reverse().map((m: { role: string; content: string }) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  // Save user message first
  const { data: userMsg } = await supabase
    .from('coaching_messages')
    .insert({ session_id: sessionId, role: 'user', content: userMessage.trim() })
    .select('id, session_id, role, content, created_at')
    .single();

  // Call Claude
  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [
        ...history,
        { role: 'user', content: userMessage.trim() },
      ],
    }),
  });

  if (!claudeRes.ok) {
    const err = await claudeRes.text();
    return json({ error: `Claude API error: ${err}` }, 502);
  }

  const claudeData = await claudeRes.json() as {
    content: Array<{ type: string; text: string }>;
    usage?: { input_tokens: number; output_tokens: number };
  };
  const replyText = claudeData.content?.[0]?.text ?? "I'm here for you. What's on your mind?";
  const tokensUsed = (claudeData.usage?.input_tokens ?? 0) + (claudeData.usage?.output_tokens ?? 0);

  // Save assistant reply
  const { data: assistantMsg } = await supabase
    .from('coaching_messages')
    .insert({ session_id: sessionId, role: 'assistant', content: replyText, tokens_used: tokensUsed })
    .select('id, session_id, role, content, created_at')
    .single();

  // Update session metadata
  await supabase.from('coaching_sessions').update({
    last_message_at: new Date().toISOString(),
    message_count: supabase.rpc('increment', { row_id: sessionId, column_name: 'message_count' }),
    title: userMsg && !session ? userMessage.trim().slice(0, 50) : undefined,
  }).eq('id', sessionId);

  return json(assistantMsg);
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
