// Supabase Edge Function — creates a Razorpay subscription and returns a hosted payment URL.
// Deploy: supabase functions deploy create-razorpay-order
// Env vars required: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_PLAN_MONTHLY, RAZORPAY_PLAN_ANNUAL

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID') ?? '';
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const PLAN_IDS: Record<string, string> = {
  pro_monthly: Deno.env.get('RAZORPAY_PLAN_MONTHLY') ?? '',
  pro_annual: Deno.env.get('RAZORPAY_PLAN_ANNUAL') ?? '',
};

const authHeader = 'Basic ' + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { plan, userId, email } = await req.json() as {
      plan: 'pro_monthly' | 'pro_annual';
      userId: string;
      email: string;
    };

    const razorpayPlanId = PLAN_IDS[plan];
    if (!razorpayPlanId) {
      return Response.json({ error: 'Unknown plan' }, { status: 400 });
    }

    // Create Razorpay subscription
    const subscriptionRes = await fetch('https://api.razorpay.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: razorpayPlanId,
        total_count: plan === 'pro_annual' ? 1 : 12,
        quantity: 1,
        customer_notify: 1,
        notes: { user_id: userId, email, plan },
      }),
    });

    if (!subscriptionRes.ok) {
      const err = await subscriptionRes.text();
      return Response.json({ error: `Razorpay error: ${err}` }, { status: 500 });
    }

    const subscription = await subscriptionRes.json() as { id: string; short_url: string };

    // Store pending subscription in Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    await supabase.from('subscriptions').upsert({
      user_id: userId,
      plan,
      status: 'pending',
      razorpay_subscription_id: subscription.id,
    }, { onConflict: 'user_id' });

    return Response.json({
      paymentUrl: subscription.short_url,
      orderId: subscription.id,
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
});
