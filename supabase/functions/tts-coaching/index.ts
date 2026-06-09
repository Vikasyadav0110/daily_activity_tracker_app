import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Text-to-speech for coach messages.
 * POST body: { text, personaId }
 * Returns: audio/mpeg binary stream
 *
 * Uses ElevenLabs API. Each persona maps to a specific voice ID.
 * Requires env: ELEVENLABS_API_KEY
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

const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')!;

// ElevenLabs voice IDs per coach persona
const PERSONA_VOICE_IDS: Record<string, string> = {
  motivator:    'pNInz6obpgDQGcFmaJgB', // Adam (energetic male)
  mindful:      'EXAVITQu4vr4xnSDxMaL', // Bella (calm female)
  fitness:      'VR6AewLTigWG4xSOukaG', // Arnold (strong male)
  productivity: '21m00Tcm4TlvDq8ikWAM', // Rachel (professional female)
  spiritual:    'AZnzlk1XvdvUeBnXmlld', // Domi (deep, resonant)
};

const DEFAULT_VOICE_ID = 'pNInz6obpgDQGcFmaJgB';
const MAX_CHARS = 500;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authHeader = req.headers.get('authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Missing Authorization' }), { status: 401, headers: corsHeaders });
  }
  const token = authHeader.slice(7);
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }

  const body = await req.json() as { text?: string; personaId?: string };
  const { text, personaId = 'motivator' } = body;

  if (!text?.trim()) {
    return new Response(JSON.stringify({ error: 'text is required' }), { status: 400, headers: corsHeaders });
  }

  const truncated = text.trim().slice(0, MAX_CHARS);
  const voiceId = PERSONA_VOICE_IDS[personaId] ?? DEFAULT_VOICE_ID;

  const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text: truncated,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });

  if (!ttsRes.ok) {
    const err = await ttsRes.text();
    return new Response(JSON.stringify({ error: `TTS failed: ${err}` }), { status: 502, headers: corsHeaders });
  }

  // Stream audio back to client
  return new Response(ttsRes.body, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-cache',
    },
  });
});
