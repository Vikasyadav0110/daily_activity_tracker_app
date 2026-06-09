// Supabase Edge Function — verifies Razorpay payment signature and activates subscription.
// Deploy: supabase functions deploy verify-razorpay-payment

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';

const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

function verifySignature(
  paymentId: string,
  subscriptionId: string,
  signature: string
): boolean {
  const message = `${paymentId}|${subscriptionId}`;
  const expected = createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(message)
    .digest('hex');
  return expected === signature;
}

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
    const {
      razorpayPaymentId,
      razorpaySubscriptionId,
      razorpaySignature,
      orderId,
      userId,
      plan,
    } = await req.json() as {
      razorpayPaymentId: string;
      razorpaySubscriptionId: string;
      razorpaySignature: string;
      orderId: string;
      userId: string;
      plan: string;
    };

    // Verify HMAC signature
    const valid = verifySignature(razorpayPaymentId, razorpaySubscriptionId, razorpaySignature);
    if (!valid) {
      return Response.json({ verified: false, error: 'Invalid signature' }, { status: 400 });
    }

    // Calculate expiry
    const now = new Date();
    const expiresAt = new Date(now);
    if (plan === 'pro_annual') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    await supabase.from('subscriptions').upsert({
      user_id: userId,
      plan,
      status: 'active',
      expires_at: expiresAt.toISOString(),
      razorpay_subscription_id: razorpaySubscriptionId,
      razorpay_payment_id: razorpayPaymentId,
    }, { onConflict: 'user_id' });

    return Response.json({
      verified: true,
      expiresAt: expiresAt.toISOString(),
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (e) {
    return Response.json({ verified: false, error: String(e) }, { status: 500 });
  }
});
