// Supabase Edge Function — creates a Razorpay subscription or one-time order and returns a hosted checkout URL.
// Deploy: supabase functions deploy create-razorpay-order
// Required secrets: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET,
//   RAZORPAY_PLAN_ID_PRO_MONTHLY, RAZORPAY_PLAN_ID_PRO_ANNUAL,
//   RAZORPAY_PLAN_ID_PP_MONTHLY, RAZORPAY_PLAN_ID_PP_ANNUAL

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Amount in paise (INR × 100)
const PLAN_AMOUNT: Record<string, number> = {
  pro_monthly: 9900,
  pro_annual: 79900,
  lifetime_pro: 99900,
  premium_plus_monthly: 14900,
  premium_plus_annual: 149000,
};

// Subscription repeat counts (months of billing)
const SUBSCRIPTION_COUNT: Record<string, number> = {
  pro_monthly: 120,
  pro_annual: 10,
  premium_plus_monthly: 120,
  premium_plus_annual: 10,
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    // Verify JWT
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

    const { plan, userId, email } = await req.json() as {
      plan: string;
      userId: string;
      email: string;
    };

    const amount = PLAN_AMOUNT[plan];
    if (!amount) {
      return Response.json({ error: `Unknown plan: ${plan}` }, { status: 400, headers: CORS });
    }

    const keyId = Deno.env.get('RAZORPAY_KEY_ID') ?? '';
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET') ?? '';
    const basicAuth = 'Basic ' + btoa(`${keyId}:${keySecret}`);

    // lifetime_pro → one-time order; all others → recurring subscription
    if (plan === 'lifetime_pro') {
      const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: { Authorization: basicAuth, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: 'INR',
          receipt: `lifetime_${userId}_${Date.now()}`,
          notes: { user_id: userId, email, plan },
        }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.text();
        return Response.json({ error: `Razorpay order error: ${err}` }, { status: 502, headers: CORS });
      }

      const order = await orderRes.json() as { id: string };

      // Record pending state
      await supabase.from('subscriptions').upsert(
        { user_id: userId, plan, status: 'pending', razorpay_subscription_id: null },
        { onConflict: 'user_id' }
      );

      const paymentUrl = `https://api.razorpay.com/v1/checkout/embedded`
        + `?order_id=${order.id}`
        + `&key_id=${keyId}`
        + `&amount=${amount}`
        + `&currency=INR`
        + `&name=Daily+Activity+Tracker`
        + `&description=${encodeURIComponent('Lifetime Pro — one-time')}`
        + `&prefill[email]=${encodeURIComponent(email)}`
        + `&callback_url=${encodeURIComponent('dailytracker://payment-callback')}`
        + `&cancel_url=${encodeURIComponent('dailytracker://payment-callback?cancelled=1')}`;

      return Response.json(
        { paymentUrl, orderId: order.id, amount, currency: 'INR', plan },
        { headers: { ...CORS, 'Content-Type': 'application/json' } }
      );
    }

    // Recurring plans — create Razorpay subscription
    const envKey = `RAZORPAY_PLAN_ID_${plan.toUpperCase()}`;
    const razorpayPlanId = Deno.env.get(envKey) ?? '';

    if (!razorpayPlanId) {
      return Response.json(
        { error: `Razorpay plan ID not configured (missing ${envKey})` },
        { status: 500, headers: CORS }
      );
    }

    const subRes = await fetch('https://api.razorpay.com/v1/subscriptions', {
      method: 'POST',
      headers: { Authorization: basicAuth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan_id: razorpayPlanId,
        total_count: SUBSCRIPTION_COUNT[plan] ?? 12,
        quantity: 1,
        customer_notify: 1,
        notes: { user_id: userId, email, plan },
      }),
    });

    if (!subRes.ok) {
      const err = await subRes.text();
      return Response.json({ error: `Razorpay subscription error: ${err}` }, { status: 502, headers: CORS });
    }

    const sub = await subRes.json() as { id: string; short_url: string };

    await supabase.from('subscriptions').upsert(
      { user_id: userId, plan, status: 'pending', razorpay_subscription_id: sub.id },
      { onConflict: 'user_id' }
    );

    return Response.json(
      { paymentUrl: sub.short_url, orderId: sub.id, amount, currency: 'INR', plan },
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('create-razorpay-order:', e);
    return Response.json({ error: String(e) }, { status: 500, headers: CORS });
  }
});
