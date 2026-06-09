import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14?target=deno';

/**
 * Creates a Stripe Checkout session for the correct region/currency.
 * POST body: { plan, regionCode }
 * Returns: { checkoutUrl }
 *
 * Env vars: STRIPE_SECRET_KEY, WEB_APP_URL
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

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const WEB_APP_URL = Deno.env.get('WEB_APP_URL') ?? 'https://your-domain.com';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authHeader = req.headers.get('authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'Missing Authorization' }, 401);
  const token = authHeader.slice(7);
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

  const body = await req.json() as { plan?: string; regionCode?: string };
  const { plan, regionCode = 'IN' } = body;

  if (!plan) return json({ error: 'plan is required' }, 400);

  // Lookup Stripe price for this plan + region
  const { data: priceRow } = await supabase
    .from('stripe_prices')
    .select('stripe_price_id, amount, currency, interval')
    .eq('plan', plan)
    .eq('region_code', regionCode)
    .eq('is_active', true)
    .maybeSingle();

  if (!priceRow) return json({ error: `No Stripe price found for plan=${plan} region=${regionCode}` }, 400);

  // Get or create Stripe customer for this user
  const { data: existing } = await supabase
    .from('stripe_customers')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .eq('region_code', regionCode)
    .maybeSingle();

  let stripeCustomerId: string;

  if (existing) {
    stripeCustomerId = existing.stripe_customer_id;
  } else {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id, region_code: regionCode },
    });
    stripeCustomerId = customer.id;
    await supabase.from('stripe_customers').insert({
      user_id: user.id,
      stripe_customer_id: stripeCustomerId,
      region_code: regionCode,
      email: user.email,
    });
  }

  // Build Stripe Checkout session
  const isSubscription = !!priceRow.interval;
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: isSubscription ? 'subscription' : 'payment',
    line_items: [{ price: priceRow.stripe_price_id, quantity: 1 }],
    success_url: `${WEB_APP_URL}/dashboard/settings?payment=success&plan=${plan}`,
    cancel_url: `${WEB_APP_URL}/upgrade?cancelled=true`,
    allow_promotion_codes: true,
    metadata: { user_id: user.id, plan, region_code: regionCode },
    ...(isSubscription && {
      subscription_data: { metadata: { user_id: user.id, plan } },
    }),
  });

  return json({ checkoutUrl: session.url, sessionId: session.id });
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
