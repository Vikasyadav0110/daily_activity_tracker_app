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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response('Unauthorized', { status: 401 });
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) return new Response('Unauthorized', { status: 401 });

    // Get days since last activity log
    const { data: lastLog } = await supabase
      .from('cloud_activity_logs')
      .select('log_date')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('log_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    const today = new Date().toISOString().split('T')[0];
    let daysSinceLastLog = 0;
    if (lastLog?.log_date) {
      const diff = new Date(today).getTime() - new Date(lastLog.log_date).getTime();
      daysSinceLastLog = Math.floor(diff / (1000 * 60 * 60 * 24));
    } else {
      daysSinceLastLog = 7; // No logs at all
    }

    if (daysSinceLastLog < 2) {
      return new Response(JSON.stringify({ message: null, reason: 'active' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine message type
    let messageType: 'miss_streak' | 'plan_recalibration' | 'encouragement' = 'encouragement';
    let triggeredReason = `${daysSinceLastLog} days inactive`;

    if (daysSinceLastLog >= 3) messageType = 'miss_streak';
    if (daysSinceLastLog >= 7) messageType = 'plan_recalibration';

    // Default message
    const defaultMessages: Record<typeof messageType, string> = {
      miss_streak: `You missed ${daysSinceLastLog} days! Don't break the chain — even 5 minutes counts. Ek kadam aur! (One more step!)`,
      plan_recalibration: `It's been ${daysSinceLastLog} days. Let's restart with a smaller goal — sometimes less is more. Naya din, nayi shuruaat! (New day, new start!)`,
      encouragement: `Ready to pick up where you left off? Your streak is waiting. Himmat rakho! (Stay courageous!)`,
    };

    let messageText = defaultMessages[messageType];

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (apiKey) {
      try {
        const anthropic = new Anthropic({ apiKey });
        const prompt = `You are a warm, encouraging coach for an Indian productivity app user who has been inactive for ${daysSinceLastLog} days.

Write a short re-engagement message (max 30 words) that:
1. Acknowledges the gap without guilt
2. Gives one micro-action they can do right now
3. Ends with a motivating Hindi phrase (Romanized)

Message type: ${messageType}
Return just the message text, no JSON.`;

        const message = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 100,
          messages: [{ role: 'user', content: prompt }],
        });
        const content = message.content[0];
        if (content.type === 'text' && content.text.length > 10) {
          messageText = content.text.trim();
        }
      } catch {
        // Use default
      }
    }

    // Store in Supabase
    const id = crypto.randomUUID();
    await supabase.from('ai_coach_messages').insert({
      id,
      user_id: user.id,
      message_type: messageType,
      message_text: messageText,
      triggered_reason: triggeredReason,
    });

    return new Response(
      JSON.stringify({ id, message_type: messageType, message_text: messageText, triggered_reason: triggeredReason }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
