import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';
import { authenticateApiRequest, apiError, apiOk } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

type Ctx = { params: Promise<{ id: string }> };

// POST /api/v1/webhooks/:id/test — send a test ping to the webhook URL
export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;

  const { data: wh } = await supabase
    .from('webhooks').select('user_id, url, secret, events').eq('id', id).maybeSingle();
  if (!wh) return apiError('Webhook not found', 404);
  if (wh.user_id !== auth.userId) return apiError('Forbidden', 403);

  const payload = {
    event: 'webhook.test',
    timestamp: new Date().toISOString(),
    version: '1',
    data: { message: 'This is a test event from Daily Activity Tracker.' },
  };
  const body = JSON.stringify(payload);
  const sig = createHmac('sha256', wh.secret).update(body).digest('hex');

  const start = Date.now();
  let statusCode: number;
  let responseBody: string;
  let success = false;

  try {
    const res = await fetch(wh.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-DAT-Signature': `sha256=${sig}`,
        'X-DAT-Event': 'webhook.test',
      },
      body,
      signal: AbortSignal.timeout(10000),
    });
    statusCode = res.status;
    responseBody = (await res.text()).slice(0, 500);
    success = res.ok;
  } catch (err) {
    statusCode = 0;
    responseBody = err instanceof Error ? err.message : 'Request failed';
  }

  // Log the delivery
  await supabase.from('webhook_deliveries').insert({
    webhook_id: id,
    event_type: 'webhook.test',
    payload,
    status_code: statusCode,
    response_body: responseBody,
  });

  return apiOk({
    success,
    status_code: statusCode,
    latency_ms: Date.now() - start,
    response_body: responseBody,
    payload_sent: payload,
  });
}
