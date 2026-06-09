import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduleItem {
  time: string;
  activity: string;
  duration: number;
  category: string;
  note?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { goals, available_hours, wake_time = '06:00', timezone = 'Asia/Kolkata' } =
      await req.json() as {
        goals: string[];
        available_hours: number;
        wake_time?: string;
        timezone?: string;
      };

    if (!goals?.length || !available_hours) {
      return new Response('goals and available_hours required', { status: 400 });
    }

    const defaultSchedule: ScheduleItem[] = [
      { time: '06:00', activity: 'Morning routine', duration: 30, category: 'wellness' },
      ...goals.map((goal, i) => ({
        time: `0${7 + i}:00`,
        activity: goal,
        duration: Math.floor((available_hours * 60) / goals.length),
        category: 'productivity',
      })),
      { time: '21:00', activity: 'Evening reflection', duration: 15, category: 'wellness' },
      { time: '22:00', activity: 'Sleep', duration: 480, category: 'rest' },
    ];

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({
        schedule: defaultSchedule,
        note: 'AI scheduling unavailable — showing template plan',
        ai_generated: false,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const anthropic = new Anthropic({ apiKey });
    const prompt = `Create a realistic daily schedule for an Indian student/professional.

Goals: ${goals.join(', ')}
Available hours for focused work: ${available_hours} hours
Wake time: ${wake_time} (${timezone})

Rules:
1. Respect Brahma Muhurta (4:24 AM for early risers) and avoid scheduling focus work after 9 PM
2. Include meal breaks (Indian timings: 8 AM breakfast, 1 PM lunch, 7:30 PM dinner)
3. Distribute difficult tasks in the morning when energy is high
4. Total active work cannot exceed available_hours
5. Include at least one 15-min movement/yoga block

Return JSON array of schedule items:
[{ "time": "HH:MM", "activity": "name", "duration": minutes, "category": "study|fitness|wellness|meal|rest|productivity", "note": "optional tip" }]

Return only the JSON array, no markdown.`;

    let schedule = defaultSchedule;
    let aiGenerated = false;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      const parsed = JSON.parse(content.text) as ScheduleItem[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        schedule = parsed;
        aiGenerated = true;
      }
    }

    return new Response(
      JSON.stringify({ schedule, note: 'Plan adjusted to Indian context', ai_generated: aiGenerated }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
