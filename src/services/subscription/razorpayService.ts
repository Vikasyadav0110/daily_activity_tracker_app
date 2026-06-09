import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@services/supabase/client';
import { saveLocalSubscription, type Plan } from './subscriptionService';

export type PaymentResult =
  | { success: true; paymentId: string; subscriptionId: string; plan: Plan }
  | { success: false; cancelled: boolean; error?: string };

/**
 * Full Razorpay payment flow:
 * 1. Call Supabase Edge Function to create a Razorpay subscription / payment link
 * 2. Open the hosted checkout in WebBrowser
 * 3. On return, call verify Edge Function to confirm payment
 * 4. Save subscription to local cache
 */
export async function purchasePlan(
  plan: Plan,
  userId: string,
  userEmail: string
): Promise<PaymentResult> {
  if (plan === 'free') return { success: false, cancelled: false, error: 'Invalid plan' };

  try {
    // Step 1: Create order via Edge Function
    const { data: orderData, error: orderError } = await supabase.functions.invoke(
      'create-razorpay-order',
      { body: { plan, userId, email: userEmail } }
    );

    if (orderError || !orderData?.paymentUrl) {
      return { success: false, cancelled: false, error: orderError?.message ?? 'Order creation failed' };
    }

    const { paymentUrl, orderId } = orderData as { paymentUrl: string; orderId: string };

    // Step 2: Open Razorpay hosted page
    const result = await WebBrowser.openAuthSessionAsync(
      paymentUrl,
      'dailytracker://payment-callback'
    );

    if (result.type === 'cancel' || result.type === 'dismiss') {
      return { success: false, cancelled: true };
    }

    // Extract payment details from redirect URL
    const url = (result as { type: 'success'; url: string }).url;
    const params = new URLSearchParams(url.split('?')[1] ?? '');
    const razorpayPaymentId = params.get('razorpay_payment_id') ?? '';
    const razorpaySubscriptionId = params.get('razorpay_subscription_id') ?? '';
    const razorpaySignature = params.get('razorpay_signature') ?? '';

    if (!razorpayPaymentId) {
      return { success: false, cancelled: false, error: 'No payment ID received' };
    }

    // Step 3: Verify payment via Edge Function
    const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
      'verify-razorpay-payment',
      {
        body: {
          razorpayPaymentId,
          razorpaySubscriptionId,
          razorpaySignature,
          orderId,
          userId,
          plan,
        },
      }
    );

    if (verifyError || !verifyData?.verified) {
      return { success: false, cancelled: false, error: 'Payment verification failed' };
    }

    // Step 4: Save locally
    const expiresAt = verifyData.expiresAt as string;
    await saveLocalSubscription(plan, 'active', expiresAt, razorpayPaymentId, razorpaySubscriptionId);

    return { success: true, paymentId: razorpayPaymentId, subscriptionId: razorpaySubscriptionId, plan };
  } catch (e) {
    return { success: false, cancelled: false, error: String(e) };
  }
}

export async function restorePurchase(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('subscriptions')
    .select('plan, status, expires_at, razorpay_payment_id, razorpay_subscription_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (!data) return false;

  await saveLocalSubscription(
    data.plan as Plan,
    'active',
    data.expires_at as string | null,
    data.razorpay_payment_id as string ?? '',
    data.razorpay_subscription_id as string | undefined
  );
  return true;
}
