import React, { useState } from 'react';
import { Check, X, Loader2, Crown, Zap, Building2, Smartphone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useI18n } from '../contexts/I18nContext';
import { PLANS } from '../lib/plans';
import { createPapiCheckoutSession } from '../services/subscriptionService';
import AuthModal from './AuthModal';
import { Button } from './ui/button';

const Pricing: React.FC = () => {
  const { user } = useAuth();
  const { plan: currentPlan, subscription } = useSubscription();
  const { t } = useI18n();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [authModal, setAuthModal] = useState(false);

  const handlePapiUpgrade = async (planId: 'pro' | 'business') => {
    if (!user) {
      setAuthModal(true);
      return;
    }

    setLoadingPlan(`papi-${planId}`);
    const result = await createPapiCheckoutSession(planId);

    if ('url' in result) {
      window.location.href = result.url;
    } else {
      alert(result.error);
    }
    setLoadingPlan(null);
  };

  const plans = [
    {
      ...PLANS.free,
      icon: Zap,
      color: 'slate',
      popular: false,
    },
    {
      ...PLANS.pro,
      icon: Crown,
      color: 'primary',
      popular: true,
    },
    {
      ...PLANS.business,
      icon: Building2,
      color: 'slate',
      popular: false,
    },
  ];

  const featureRows = [
    {
      label: t('pricing.invoicesPerMonth'),
      values: ['2', t('pricing.unlimited'), t('pricing.unlimited')],
    },
    {
      label: t('pricing.quotesPerMonth'),
      values: ['2', t('pricing.unlimited'), t('pricing.unlimited')],
    },
    {
      label: t('pricing.companies'),
      values: ['1', '3', '10'],
    },
    {
      label: t('pricing.customLogo'),
      values: [false, true, true],
    },
    {
      label: t('pricing.emailSending'),
      values: [false, true, true],
    },
    {
      label: t('pricing.noWatermark'),
      values: [true, true, true],
    },
    {
      label: t('pricing.recurringInvoices'),
      values: [false, false, true],
    },
  ];

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            {t('pricing.title')}
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {t('pricing.subtitle')}
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => {
            const isCurrent = currentPlan.id === plan.id && subscription?.status === 'active';
            const Icon = plan.icon;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 p-8 flex flex-col ${
                  plan.popular
                    ? 'border-primary-500 shadow-lg shadow-primary-100'
                    : 'border-slate-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-semibold px-4 py-1 rounded-full">
                    {t('pricing.popular')}
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${
                    plan.popular ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Icon size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {t(`pricing.${plan.id}Name`)}
                  </h3>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-slate-900">
                    {plan.price === 0 ? t('pricing.free') : `${plan.price}€`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-slate-500 ml-1">/{t('pricing.month')}</span>
                  )}
                </div>

                <ul className="space-y-3 mb-8 flex-grow">
                  {featureRows.map((row, i) => {
                    const val = row.values[plans.indexOf(plan)];
                    const hasFeature = val !== false;
                    return (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        {hasFeature ? (
                          <Check size={16} className="text-green-500 shrink-0" />
                        ) : (
                          <X size={16} className="text-slate-300 shrink-0" />
                        )}
                        <span className={hasFeature ? 'text-slate-700' : 'text-slate-400'}>
                          {typeof val === 'string' ? `${val} ${row.label.toLowerCase()}` : row.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {plan.id === 'free' ? (
                  <div className="w-full py-3 text-center rounded-lg font-medium bg-slate-100 text-slate-500">
                    {isCurrent ? t('pricing.currentPlan') : t('pricing.freePlan')}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {isCurrent && (
                      <Button
                        disabled
                        className="w-full h-12 bg-slate-500 hover:bg-slate-500"
                      >
                        {t('pricing.currentPlan')}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handlePapiUpgrade(plan.id as 'pro' | 'business')}
                      disabled={isCurrent || loadingPlan !== null}
                      className="w-full h-11 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                    >
                      {loadingPlan === `papi-${plan.id}` ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <>
                          <Smartphone size={18} />
                          Mobile Money / Papi
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <AuthModal
        isOpen={authModal}
        onClose={() => setAuthModal(false)}
        initialMode="register"
      />
    </div>
  );
};

export default Pricing;
