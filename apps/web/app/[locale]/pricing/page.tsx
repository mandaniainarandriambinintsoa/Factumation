import { Building2, Check, Crown, Zap } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PublicShell } from '@/components/public-shell';

export const metadata: Metadata = {
  title: 'Tarifs',
  description: 'Des offres simples pour gérer vos factures et devis.',
};
const plansFr = [
  {
    name: 'Gratuit',
    price: '0 €',
    icon: Zap,
    features: ['2 factures par mois', '2 devis par mois', '1 entreprise', 'Export PDF'],
    popular: false,
  },
  {
    name: 'Pro',
    price: '9,99 €',
    icon: Crown,
    features: [
      'Factures illimitées',
      'Devis illimités',
      '3 entreprises',
      'Logo personnalisé',
      'Envoi par e-mail',
    ],
    popular: true,
  },
  {
    name: 'Business',
    price: '19,99 €',
    icon: Building2,
    features: ['Tout le plan Pro', '10 entreprises', 'Factures récurrentes', 'Priorité support'],
    popular: false,
  },
];
const plansEn = [
  {
    name: 'Free',
    price: '€0',
    icon: Zap,
    features: ['2 invoices per month', '2 quotes per month', '1 business', 'PDF export'],
    popular: false,
  },
  {
    name: 'Pro',
    price: '€9.99',
    icon: Crown,
    features: [
      'Unlimited invoices',
      'Unlimited quotes',
      '3 businesses',
      'Custom logo',
      'Email delivery',
    ],
    popular: true,
  },
  {
    name: 'Business',
    price: '€19.99',
    icon: Building2,
    features: ['Everything in Pro', '10 businesses', 'Recurring invoices', 'Priority support'],
    popular: false,
  },
];
export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== 'fr' && locale !== 'en') notFound();
  const copy =
    locale === 'fr'
      ? {
          eyebrow: 'Tarifs',
          title: 'Une offre adaptée à votre activité',
          intro: 'Commencez gratuitement, puis évoluez lorsque votre activité en a besoin.',
          popular: 'Populaire',
          period: ' / mois',
          action: 'Commencer',
          plans: plansFr,
        }
      : {
          eyebrow: 'Pricing',
          title: 'A plan that fits your business',
          intro: 'Start for free, then upgrade when your business needs it.',
          popular: 'Popular',
          period: ' / month',
          action: 'Get started',
          plans: plansEn,
        };
  return (
    <PublicShell locale={locale} active="pricing">
      <main className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
        <div className="text-center">
          <p className="text-sm font-semibold text-blue-600">{copy.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">{copy.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">{copy.intro}</p>
        </div>
        <section className="mt-12 grid gap-6 md:grid-cols-3">
          {copy.plans.map((plan) => (
            <article
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border-2 bg-white p-7 ${plan.popular ? 'border-blue-500 shadow-lg shadow-blue-100' : 'border-slate-200'}`}
            >
              {plan.popular ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-xs font-semibold text-white">
                  {copy.popular}
                </span>
              ) : null}
              <span className="grid size-11 place-items-center rounded-lg bg-blue-50 text-blue-600">
                <plan.icon className="size-5" />
              </span>
              <h2 className="mt-5 text-xl font-bold text-slate-900">{plan.name}</h2>
              <p className="mt-3 text-3xl font-bold text-slate-900">
                {plan.price}
                <span className="text-sm font-normal text-slate-500">{copy.period}</span>
              </p>
              <ul className="my-7 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm text-slate-600">
                    <Check className="size-4 shrink-0 text-emerald-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={`/${locale}/login?mode=register`}
                className={`focus-ring rounded-lg px-4 py-3 text-center text-sm font-semibold ${plan.popular ? 'bg-[var(--primary-900)] text-white' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                {copy.action}
              </Link>
            </article>
          ))}
        </section>
      </main>
    </PublicShell>
  );
}
