import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateApiRequest, apiError, apiOk } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

type Ctx = { params: Promise<{ id: string }> };

// POST /api/v1/marketplace/programs/:id/enroll
// For free programs: enroll immediately.
// For paid programs: expects { razorpay_payment_id, razorpay_order_id, razorpay_signature } in body.
// On enroll: create activity_log stubs for each day based on program activities template.
export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;

  const { data: program } = await supabase
    .from('marketplace_programs')
    .select('id, program_name, price, activities, duration_days, status, sales_count')
    .eq('id', id)
    .maybeSingle();

  if (!program) return apiError('Program not found', 404);
  if (program.status !== 'published') return apiError('Program is not available for enrollment', 400);

  // Check for existing enrollment
  const { data: existing } = await supabase
    .from('program_enrollments')
    .select('id, status').eq('user_id', auth.userId).eq('program_id', id).maybeSingle();

  if (existing && existing.status === 'active') {
    return apiError('Already enrolled in this program', 409);
  }

  const body = await req.json().catch(() => ({})) as {
    razorpay_payment_id?: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  };

  // Paid program: verify payment signature
  if (program.price > 0) {
    if (!body.razorpay_payment_id || !body.razorpay_order_id || !body.razorpay_signature) {
      return apiError('Payment verification required. Provide razorpay_payment_id, razorpay_order_id, razorpay_signature.', 402);
    }
    // Signature verification: HMAC-SHA256 of order_id|payment_id with key_secret
    const { createHmac } = await import('crypto');
    const keySecret = process.env.RAZORPAY_KEY_SECRET!;
    const expectedSig = createHmac('sha256', keySecret)
      .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
      .digest('hex');
    if (expectedSig !== body.razorpay_signature) {
      return apiError('Payment signature invalid', 402);
    }
  }

  // Create or reactivate enrollment
  const today = new Date().toISOString().slice(0, 10);
  const { data: enrollment, error: enrollErr } = await supabase
    .from('program_enrollments')
    .upsert({
      user_id: auth.userId,
      program_id: id,
      enrollment_date: today,
      status: 'active',
      progress_pct: 0,
    }, { onConflict: 'user_id,program_id' })
    .select()
    .single();

  if (enrollErr) return apiError(enrollErr.message, 500);

  // Auto-create activities from the program template
  type ActivityTemplate = { name: string; emoji?: string; category?: string; goal_per_day?: number };
  const templates: ActivityTemplate[] = Array.isArray(program.activities) ? program.activities as ActivityTemplate[] : [];
  const createdActivities: string[] = [];

  for (const tpl of templates) {
    if (!tpl.name) continue;
    const { data: act } = await supabase
      .from('activities')
      .insert({
        user_id: auth.userId,
        name: tpl.name,
        emoji: tpl.emoji ?? '✅',
        category: tpl.category ?? 'wellness',
        goal_per_day: tpl.goal_per_day ?? 1,
        is_active: true,
        source: 'marketplace',
        program_id: id,
      })
      .select('id')
      .single();
    if (act) createdActivities.push(act.id);
  }

  // Increment sales count
  await supabase
    .from('marketplace_programs')
    .update({ sales_count: (program.sales_count ?? 0) + 1 })
    .eq('id', id);

  return apiOk({
    enrollment_id: enrollment.id,
    program_id: id,
    enrollment_date: today,
    activities_created: createdActivities.length,
    activity_ids: createdActivities,
  }, undefined, 201);
}

// DELETE /api/v1/marketplace/programs/:id/enroll — abandon enrollment
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;

  const { error } = await supabase
    .from('program_enrollments')
    .update({ status: 'abandoned' })
    .eq('user_id', auth.userId)
    .eq('program_id', id);

  if (error) return apiError(error.message, 500);
  return apiOk({ abandoned: true });
}
