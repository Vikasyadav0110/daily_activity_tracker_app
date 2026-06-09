import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Speech-to-text for voice mood check-in.
 * POST multipart/form-data: { audio: File (m4a/webm/mp3), language? }
 * Returns: { transcript, detectedMoodRating, detectedEnergyLevel, notes }
 *
 * Uses OpenAI Whisper for transcription, then Claude Haiku to extract
 * mood rating (1-10), energy level (1-10), and a clean notes summary.
 * Requires env: OPENAI_API_KEY, CLAUDE_API_KEY
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
);

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;
const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY')!;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authHeader = req.headers.get('authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'Missing Authorization' }, 401);
  const token = authHeader.slice(7);
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

  const formData = await req.formData();
  const audioFile = formData.get('audio') as File | null;
  const language = (formData.get('language') as string | null) ?? 'en';

  if (!audioFile) return json({ error: 'audio file is required' }, 400);
  if (audioFile.size > 10 * 1024 * 1024) return json({ error: 'Audio file too large (max 10MB)' }, 400);

  // Step 1: Transcribe with Whisper
  const whisperForm = new FormData();
  whisperForm.append('file', audioFile, audioFile.name || 'audio.m4a');
  whisperForm.append('model', 'whisper-1');
  whisperForm.append('language', language);
  whisperForm.append('response_format', 'json');

  const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: whisperForm,
  });

  if (!whisperRes.ok) {
    return json({ error: 'Transcription failed' }, 502);
  }

  const whisperData = await whisperRes.json() as { text?: string };
  const transcript = whisperData.text?.trim() ?? '';

  if (!transcript) return json({ transcript: '', detectedMoodRating: null, detectedEnergyLevel: null, notes: '' });

  // Step 2: Extract mood data from transcript using Claude
  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `Extract mood data from this voice journal entry. Return ONLY valid JSON (no markdown):
{
  "moodRating": <1-10 or null if unclear>,
  "energyLevel": <1-10 or null if unclear>,
  "notes": "<1-2 sentence clean summary of what was said>"
}

Voice journal: "${transcript}"`,
      }],
    }),
  });

  let detectedMoodRating: number | null = null;
  let detectedEnergyLevel: number | null = null;
  let notes = transcript.slice(0, 200);

  if (claudeRes.ok) {
    const claudeData = await claudeRes.json() as { content: Array<{ text: string }> };
    try {
      const extracted = JSON.parse(claudeData.content?.[0]?.text ?? '{}');
      detectedMoodRating = typeof extracted.moodRating === 'number' ? Math.min(10, Math.max(1, extracted.moodRating)) : null;
      detectedEnergyLevel = typeof extracted.energyLevel === 'number' ? Math.min(10, Math.max(1, extracted.energyLevel)) : null;
      notes = extracted.notes ?? notes;
    } catch { /* use defaults */ }
  }

  return json({ transcript, detectedMoodRating, detectedEnergyLevel, notes });
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
