import { Building2, FileText, Gauge, Quote, UserRound } from 'lucide-react';
import Link from 'next/link';

import { ApiErrorState } from '@/components/api-error-state';
import { ApiKeyManager } from '@/components/api-key-manager';
import { PageHeader } from '@/components/page-header';
import { SubscriptionActions } from '@/components/subscription-actions';
import { apiRequest, ApiRequestError } from '@/lib/api/server-api';
import type { Company } from '@/lib/api/types';

type Subscription = {
  plan: 'free' | 'pro' | 'business';
  status: string;
  source: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  features: {
    invoicesPerMonth: number;
    quotesPerMonth: number;
    companies: number;
    customLogo: boolean;
    emailSending: boolean;
    recurringInvoices: boolean;
  };
};
type Usage = { invoices: number; quotes: number; companies: number; periodStart: string };

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supportedLocale = locale === 'en' ? 'en' : 'fr';
  let subscription: Subscription | null = null;
  let usage: Usage | null = null;
  let company: Company | null = null;
  let error: string | undefined;
  try {
    [subscription, usage, company] = await Promise.all([
      apiRequest<Subscription>('/subscription'),
      apiRequest<Usage>('/usage'),
      apiRequest<Company | null>('/companies/default'),
    ]);
  } catch (cause) {
    error = cause instanceof ApiRequestError ? cause.message : undefined;
  }
  if (!subscription || !usage)
    return (
      <main className="mx-auto max-w-5xl px-5 py-8 lg:px-10 lg:py-12">
        <PageHeader title="Paramètres" description="Gérez votre compte et vos préférences." />
        <ApiErrorState message={error} />
      </main>
    );
  const planLabel =
    subscription.plan === 'business' ? 'Business' : subscription.plan === 'pro' ? 'Pro' : 'Gratuit';
  const usageItems = [
    {
      icon: FileText,
      label: 'Factures ce mois',
      value: usage.invoices,
      limit: subscription.features.invoicesPerMonth,
    },
    {
      icon: Quote,
      label: 'Devis ce mois',
      value: usage.quotes,
      limit: subscription.features.quotesPerMonth,
    },
    {
      icon: Building2,
      label: 'Entreprises',
      value: usage.companies,
      limit: subscription.features.companies,
    },
  ];
  return (
    <main className="mx-auto max-w-5xl px-5 py-8 lg:px-10 lg:py-12">
      <PageHeader
        eyebrow="Compte"
        title="Paramètres"
        description="Gérez votre abonnement et vos informations de facturation."
      />
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {usageItems.map(({ icon: Icon, label, value, limit }) => (
          <article key={label} className="rounded-xl border border-slate-200 bg-white p-5">
            <span className="grid size-10 place-items-center rounded-full bg-blue-50 text-blue-600">
              <Icon className="size-5" />
            </span>
            <p className="mt-5 text-2xl font-bold text-slate-900">
              {value}
              <span className="text-sm font-normal text-slate-400">
                {' '}
                / {limit === -1 ? '∞' : limit}
              </span>
            </p>
            <p className="mt-1 text-sm text-slate-500">{label}</p>
          </article>
        ))}
      </section>
      <section className="mt-5 grid gap-5 md:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <Gauge className="size-5 text-blue-600" />
              Abonnement
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {planLabel}
            </span>
          </div>
          <p className="mt-5 text-sm text-slate-500">
            Statut : <strong className="text-slate-700">{subscription.status}</strong>
          </p>
          <Link
            href={`/${supportedLocale}/pricing`}
            className="focus-ring mt-5 inline-flex rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Voir les offres
          </Link>
          <SubscriptionActions
            locale={supportedLocale}
            currentPlan={subscription.plan}
            source={subscription.source}
          />
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <Building2 className="size-5 text-blue-600" />
            Entreprise par défaut
          </div>
          <p className="mt-5 font-semibold text-slate-900">{company?.name ?? 'Non configurée'}</p>
          <p className="mt-1 text-sm text-slate-500">
            {company?.email ?? 'Ajoutez une entreprise pour créer vos documents.'}
          </p>
          <Link
            href={`/${locale}/companies`}
            className="focus-ring mt-5 inline-flex rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Gérer les entreprises
          </Link>
        </article>
      </section>
      <section className="mt-5 rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2 font-semibold text-slate-900">
          <UserRound className="size-5 text-blue-600" />
          Compte utilisateur
        </div>
        <p className="mt-3 text-sm text-slate-500">
          L’adresse e-mail et le mot de passe sont gérés de manière sécurisée par Supabase Auth.
        </p>
      </section>
      <ApiKeyManager />
    </main>
  );
}
