import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_ORIGINS = [
  'https://factumation.vercel.app',
  'http://localhost:5173',
];
const DEFAULT_ORIGIN = 'https://factumation.vercel.app';
const PAPI_PAYMENT_LINKS_URL = 'https://app.papi.mg/dashboard/api/payment-links';

type Plan = 'pro' | 'business';
type Provider = 'MVOLA' | 'ARTEL_MONEY' | 'ORANGE_MONEY' | 'BRED';

const PLAN_AMOUNTS: Record<Plan, number> = {
  pro: Number(Deno.env.get('PAPI_PLAN_PRO_AMOUNT_MGA') || '50000'),
  business: Number(Deno.env.get('PAPI_PLAN_BUSINESS_AMOUNT_MGA') || '100000'),
};

function safeOrigin(req: Request): string {
  const configuredOrigin = Deno.env.get('PUBLIC_SITE_URL');
  if (configuredOrigin) return configuredOrigin.replace(/\/$/, '');

  const reqOrigin = req.headers.get('origin') ?? '';
  return ALLOWED_ORIGINS.includes(reqOrigin) ? reqOrigin : DEFAULT_ORIGIN;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const papiApiKey = Deno.env.get('PAPI_API_KEY');
    if (!papiApiKey) {
      return json({ error: 'Papi non configure' }, 500);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization')!;
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser();

    if (authError || !user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const { plan, provider, payerPhone } = await req.json() as {
      plan?: Plan;
      provider?: Provider;
      payerPhone?: string;
    };

    if (!plan || !PLAN_AMOUNTS[plan]) {
      return json({ error: 'Invalid plan' }, 400);
    }

    const amount = PLAN_AMOUNTS[plan];
    if (!Number.isFinite(amount) || amount < 300) {
      return json({ error: 'Invalid Papi amount configuration' }, 500);
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const origin = safeOrigin(req);
    const reference = `FACT-${plan.toUpperCase()}-${crypto.randomUUID()}`;
    const selectedProvider = provider || Deno.env.get('PAPI_DEFAULT_PROVIDER') || undefined;

    const paymentPayload = {
      amount,
      clientName: user.email || 'Client Factumation',
      reference,
      description: `Factumation ${plan} - 1 mois`,
      successUrl: `${origin}/fr/settings?papi=success&reference=${reference}`,
      failureUrl: `${origin}/fr/settings?papi=failed&reference=${reference}`,
      notificationUrl: `${supabaseUrl}/functions/v1/papi-webhook`,
      validDuration: Number(Deno.env.get('PAPI_VALID_DURATION_MINUTES') || '60'),
      ...(selectedProvider ? { provider: selectedProvider } : {}),
      ...(user.email ? { payerEmail: user.email } : {}),
      ...(payerPhone ? { payerPhone } : {}),
      isTestMode: Deno.env.get('PAPI_TEST_MODE') === 'true',
      ...(Deno.env.get('PAPI_TEST_MODE') === 'true' ? { testReason: 'Test integration Factumation' } : {}),
    };

    const papiResponse = await fetch(Deno.env.get('PAPI_BASE_URL') || PAPI_PAYMENT_LINKS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Token: papiApiKey,
      },
      body: JSON.stringify(paymentPayload),
    });
    const papiResult = await papiResponse.json().catch(() => null);

    if (!papiResponse.ok || !papiResult?.data?.paymentLink) {
      return json({
        error: papiResult?.error?.message || 'Impossible de creer le lien de paiement Papi',
        details: papiResult?.error || papiResult,
      }, 502);
    }

    const { error: insertError } = await adminClient
      .from('papi_payments')
      .insert({
        user_id: user.id,
        plan,
        amount,
        provider: selectedProvider || null,
        reference,
        payment_link: papiResult.data.paymentLink,
        notification_token: papiResult.data.notificationToken || null,
        status: 'PENDING',
        papi_payload: papiResult.data,
      });

    if (insertError) {
      return json({ error: insertError.message }, 500);
    }

    return json({
      url: papiResult.data.paymentLink,
      reference,
    });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
