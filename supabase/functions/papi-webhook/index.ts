import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function addOneMonth(date: Date) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + 1);
  return next;
}

function planRank(plan: string | null | undefined) {
  if (plan === 'business') return 2;
  if (plan === 'pro') return 1;
  return 0;
}

serve(async (req: Request) => {
  if (req.method === 'GET' || req.method === 'OPTIONS') {
    return json({ ok: true });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    const paymentReference = String(
      payload.paymentReference
      || payload.merchantPaymentReference
      || payload.reference
      || '',
    );
    const notificationToken = String(payload.notificationToken || '');
    const paymentStatus = String(payload.paymentStatus || 'PENDING');

    if (!paymentReference || !notificationToken) {
      return json({ error: 'Invalid notification payload' }, 400);
    }

    const { data: payment, error: paymentError } = await adminClient
      .from('papi_payments')
      .select('*')
      .eq('reference', paymentReference)
      .single();

    if (paymentError || !payment) {
      return json({ error: 'Unknown payment reference' }, 404);
    }

    if (payment.notification_token !== notificationToken) {
      return json({ error: 'Invalid notification token' }, 403);
    }

    const normalizedStatus = paymentStatus === 'SUCCESS'
      ? 'SUCCESS'
      : paymentStatus === 'FAILED'
        ? 'FAILED'
        : 'PENDING';

    await adminClient
      .from('papi_payments')
      .update({
        status: normalizedStatus,
        provider: payload.paymentMethod || payment.provider,
        papi_payload: payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    if (normalizedStatus === 'SUCCESS') {
      const now = new Date();

      const { data: existingSubscription } = await adminClient
        .from('subscriptions')
        .select('plan, status, source, current_period_end')
        .eq('user_id', payment.user_id)
        .single();

      const hasProtectedAccess = existingSubscription?.status === 'active'
        && (
          existingSubscription.source === 'manual'
          || planRank(existingSubscription.plan) > planRank(payment.plan)
        );

      if (hasProtectedAccess) {
        return json({ received: true, subscriptionUpdated: false });
      }

      const existingPeriodEnd = existingSubscription?.current_period_end
        ? new Date(existingSubscription.current_period_end)
        : null;
      const periodStart = existingPeriodEnd && existingPeriodEnd > now
        ? existingPeriodEnd
        : now;

      await adminClient
        .from('subscriptions')
        .upsert({
          user_id: payment.user_id,
          plan: payment.plan,
          status: 'active',
          source: 'papi',
          current_period_start: periodStart.toISOString(),
          current_period_end: addOneMonth(periodStart).toISOString(),
          cancel_at_period_end: false,
          admin_notes: `Papi payment ${payment.reference}`,
          updated_at: now.toISOString(),
        }, { onConflict: 'user_id' });
    }

    return json({ received: true });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
