import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Called by Supabase DB webhook triggers (or other Edge Functions) when events occur.
 * Finds all active webhook subscriptions for the user+event pair and delivers the payload.
 *
 * POST body: { userId, event, payload }
 * Header: x-internal-secret: <INTERNAL_FUNCTION_SECRET>
 */

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
);

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const secret = req.headers.get('x-internal-secret');
  if (secret !== Deno.env.get('INTERNAL_FUNCTION_SECRET')) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  const body = await req.json() as { userId: string; event: string; payload: Record<string, unknown> };
  const { userId, event, payload } = body;

  // Find active webhooks subscribed to this event
  const { data: hooks } = await supabase
    .from('webhooks')
    .select('id, url, secret')
    .eq('user_id', userId)
    .eq('status', 'active')
    .contains('events', [event]);

  if (!hooks?.length) {
    return new Response(JSON.stringify({ status: 'no_hooks' }), { status: 200 });
  }

  const deliveries = await Promise.allSettled(
    hooks.map(async (hook: { id: string; url: string; secret?: string }) => {
      const eventBody = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });

      // Optionally sign the payload with the hook secret
      let signature: string | null = null;
      if (hook.secret) {
        const key = await crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(hook.secret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign'],
        );
        const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(eventBody));
        signature = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (signature) headers['X-DAT-Signature'] = `sha256=${signature}`;

      const res = await fetch(hook.url, { method: 'POST', headers, body: eventBody });

      // Log the delivery
      await supabase.from('webhook_deliveries').insert({
        webhook_id: hook.id,
        event,
        payload,
        status_code: res.status,
        success: res.ok,
      });

      return { hookId: hook.id, status: res.status, ok: res.ok };
    }),
  );

  const results = deliveries.map((d) => d.status === 'fulfilled' ? d.value : { error: String((d as PromiseRejectedResult).reason) });
  return new Response(JSON.stringify({ fired: results.length, results }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
