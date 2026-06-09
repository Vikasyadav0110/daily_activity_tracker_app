// Supabase Edge Function — verifies Razorpay HMAC signature and activates subscription.
// Handles both recurring subscriptions and one-time orders (lifetime plan).
// Deploy: supabase functions deploy verify-razorpay-payment
// Required secrets: RAZORPAY_KEY_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function hmacHex(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

function planExpiresAt(plan: string): string | null {
  if (plan === 'lifetime_pro') return null;
  const d = new Date();
  if (plan.endsWith('_annual')) d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    // JWT auth
    const authHeader = req.headers.get('authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: CORS });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authErr || !user) {
      return Response.json({ error: 'Invalid token' }, { status: 401, headers: CORS });
    }

    const {
      razorpayPaymentId,
      razorpaySubscriptionId,
      razorpaySignature,
      orderId,
      userId,
      plan,
    } = await req.json() as {
      razorpayPaymentId: string;
      razorpaySubscriptionId?: string;
      razorpaySignature: string;
      orderId: string;
      userId: string;
      plan: string;
    };

    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET') ?? '';

    // Signature verification
    // Subscriptions:  sha256(paymentId + "|" + subscriptionId)
    // One-time order: sha256(orderId + "|" + paymentId)
    const isSubscription = !!razorpaySubscriptionId;
    const sigPayload = isSubscription
      ? `${razorpayPaymentId}|${razorpaySubscriptionId}`
      : `${orderId}|${razorpayPaymentId}`;

    const verified = keySecret
      ? hmacHex(keySecret, sigPayload) === razorpaySignature
      : true; // Dev mode: skip verification when secret not set

    if (!verified) {
      return Response.json({ verified: false, error: 'Signature mismatch' }, { status: 400, headers: CORS });
    }

    const expiresAt = planExpiresAt(plan);

    // Activate subscription in DB
    const { error: upsertErr } = await supabase.from('subscriptions').upsert({
      user_id: userId,
      plan,
      status: 'active',
      expires_at: expiresAt,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_subscription_id: razorpaySubscriptionId ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    if (upsertErr) {
      console.error('DB upsert failed:', upsertErr.message);
      return Response.json({ verified: false, error: 'DB write failed' }, { status: 500, headers: CORS });
    }

    // Best-effort payment audit log (non-blocking)
    supabase.from('payment_logs').insert({
      user_id: userId,
      plan,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_subscription_id: razorpaySubscriptionId ?? null,
      razorpay_order_id: orderId,
      status: 'captured',
      verified_at: new Date().toISOString(),
    }).then(({ error }) => {
      if (error) console.warn('payment_logs insert (non-critical):', error.message);
    });

    return Response.json(
      { verified: true, plan, expiresAt },
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('verify-razorpay-payment:', e);
    return Response.json({ error: String(e) }, { status: 500, headers: CORS });
  }
});
