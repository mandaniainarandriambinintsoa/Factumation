'use client';

import { CreditCard, LoaderCircle, Smartphone } from 'lucide-react';
import { useState } from 'react';

import { createClient } from '@/lib/supabase/client';

type Plan = 'free' | 'pro' | 'business';
type CheckoutPlan = Exclude<Plan, 'free'>;
type PendingAction = 'portal' | `stripe-${CheckoutPlan}` | `papi-${CheckoutPlan}` | null;

type FunctionResult = {
  url?: string;
  error?: string;
};

export function SubscriptionActions({
  locale,
  currentPlan,
  source,
}: {
  locale: 'fr' | 'en';
  currentPlan: Plan;
  source: string;
}) {
  const [pending, setPending] = useState<PendingAction>(null);
  const [error, setError] = useState<string | null>(null);

  async function invokeCheckout(
    functionName: 'create-checkout' | 'create-papi-checkout',
    plan: CheckoutPlan,
  ) {
    const action = `${functionName === 'create-checkout' ? 'stripe' : 'papi'}-${plan}` as const;
    setPending(action);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: invocationError } = await supabase.functions.invoke<FunctionResult>(
        functionName,
        { body: { plan, locale } },
      );
      if (invocationError) throw invocationError;
      if (!data?.url) throw new Error(data?.error ?? 'Le lien de paiement est indisponible.');
      window.location.assign(data.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Le paiement n’a pas pu être démarré.');
      setPending(null);
    }
  }

  async function openPortal() {
    setPending('portal');
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: invocationError } = await supabase.functions.invoke<FunctionResult>(
        'create-portal',
        { body: { locale } },
      );
      if (invocationError) throw invocationError;
      if (!data?.url) throw new Error(data?.error ?? 'Le portail d’abonnement est indisponible.');
      window.location.assign(data.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Le portail n’a pas pu être ouvert.');
      setPending(null);
    }
  }

  return (
    <div className="mt-5 space-y-4">
      {currentPlan === 'free' || source !== 'stripe' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {(['pro', 'business'] as const).map((plan) => (
            <div key={plan} className="rounded-xl border border-slate-200 p-4">
              <p className="font-semibold capitalize text-slate-900">
                {plan}
                {currentPlan === plan ? ' · renouveler' : ''}
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  disabled={pending !== null}
                  onClick={() => invokeCheckout('create-checkout', plan)}
                  className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary-900)] px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {pending === `stripe-${plan}` ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <CreditCard className="size-4" />
                  )}
                  Carte bancaire
                </button>
                <button
                  type="button"
                  disabled={pending !== null}
                  onClick={() => invokeCheckout('create-papi-checkout', plan)}
                  className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 px-3 py-2.5 text-sm font-semibold text-blue-800 hover:bg-blue-50 disabled:opacity-60"
                >
                  {pending === `papi-${plan}` ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Smartphone className="size-4" />
                  )}
                  Mobile Money
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <button
          type="button"
          disabled={pending !== null}
          onClick={openPortal}
          className="focus-ring inline-flex items-center gap-2 rounded-lg bg-[var(--primary-900)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending === 'portal' ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <CreditCard className="size-4" />
          )}
          Gérer l’abonnement
        </button>
      )}
      {error ? (
        <p role="alert" className="text-sm font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
