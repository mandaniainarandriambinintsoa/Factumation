'use client';

import { SUPPORTED_CURRENCIES, type SupportedCurrency } from '@factumation/domain';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  TrendingUp,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import type { DashboardDocument, DashboardSummary } from '@/lib/dashboard';
import { convertCurrency, getExchangeRates, type ExchangeRateTable } from '@/lib/exchange-rates';

const CURRENCIES: ReadonlyArray<{ code: SupportedCurrency; symbol: string }> = [
  { code: 'EUR', symbol: '€' },
  { code: 'USD', symbol: '$' },
  { code: 'GBP', symbol: '£' },
  { code: 'CAD', symbol: '$' },
  { code: 'CHF', symbol: 'CHF' },
  { code: 'MGA', symbol: 'Ar' },
];

type RecentDocument = DashboardDocument & {
  kind: 'invoice' | 'quote';
  documentDate: string;
};

function asCurrency(value: string): SupportedCurrency | null {
  const normalized = value.toUpperCase() as SupportedCurrency;
  return SUPPORTED_CURRENCIES.includes(normalized) ? normalized : null;
}

function totalInCurrency(
  amounts: DashboardSummary['revenueByCurrency'],
  target: SupportedCurrency,
  rates: ExchangeRateTable | null,
): number | null {
  if (!rates) return null;
  return amounts.reduce((total, item) => {
    const source = asCurrency(item.currency);
    return source ? total + convertCurrency(Number(item.amount), source, target, rates) : total;
  }, 0);
}

function formatAmount(amount: number, currency: SupportedCurrency, locale: string): string {
  const value = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: currency === 'MGA' ? 0 : 2,
  }).format(amount);
  return `${value} ${CURRENCIES.find((item) => item.code === currency)?.symbol ?? currency}`;
}

function formatDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function statusLabel(status: string): string {
  return (
    {
      draft: 'Brouillon',
      issued: 'Émis',
      sent: 'Envoyé',
      paid: 'Payé',
      accepted: 'Accepté',
      rejected: 'Refusé',
      expired: 'Expiré',
      cancelled: 'Annulé',
    }[status] ?? status
  );
}

export function DashboardOverview({
  locale,
  userId,
  firstName,
  defaultCurrency,
  summary,
  recent,
}: {
  locale: string;
  userId: string;
  firstName: string;
  defaultCurrency: SupportedCurrency;
  summary: DashboardSummary;
  recent: RecentDocument[];
}) {
  const storageKey = `factumation-dashboard-currency:${userId}`;
  const [reportingCurrency, setReportingCurrency] = useState(defaultCurrency);
  const [rates, setRates] = useState<ExchangeRateTable | null>(null);
  const [ratesError, setRatesError] = useState(false);
  const [loadingRates, setLoadingRates] = useState(true);
  const [retryNonce, setRetryNonce] = useState(0);

  const sourceCurrencies = useMemo(
    () =>
      [...summary.revenueByCurrency, ...summary.pendingByCurrency]
        .map((item) => asCurrency(item.currency))
        .filter((currency): currency is SupportedCurrency => currency !== null),
    [summary],
  );

  useEffect(() => {
    const saved = asCurrency(window.localStorage.getItem(storageKey) ?? '');
    if (saved) setReportingCurrency(saved);
  }, [storageKey]);

  useEffect(() => {
    const controller = new AbortController();
    setLoadingRates(true);
    setRatesError(false);
    void getExchangeRates([...sourceCurrencies, reportingCurrency], controller.signal)
      .then(setRates)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setRates(null);
        setRatesError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingRates(false);
      });
    return () => controller.abort();
  }, [reportingCurrency, retryNonce, sourceCurrencies]);

  const revenue = totalInCurrency(summary.revenueByCurrency, reportingCurrency, rates);
  const pending = totalInCurrency(summary.pendingByCurrency, reportingCurrency, rates);
  const pendingCount = summary.invoices.issued + summary.invoices.sent;

  function selectCurrency(currency: SupportedCurrency): void {
    setReportingCurrency(currency);
    window.localStorage.setItem(storageKey, currency);
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 lg:px-10 lg:py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">
          Bonjour{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="mt-1 text-slate-500">Voici un aperçu de votre activité.</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <QuickAction
          href={`/${locale}/invoices/new`}
          title="Nouvelle facture"
          description="Créer et envoyer une facture"
          primary
        />
        <QuickAction
          href={`/${locale}/quotes/new`}
          title="Nouveau devis"
          description="Créer et envoyer un devis"
        />
      </div>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Tous les montants sont convertis dans la devise sélectionnée.
        </p>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <span>Devise d’affichage</span>
          <span className="relative">
            <select
              value={reportingCurrency}
              onChange={(event) => selectCurrency(event.target.value as SupportedCurrency)}
              disabled={loadingRates}
              aria-label="Devise d’affichage"
              className="min-w-32 appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-9 font-semibold text-slate-900 shadow-sm outline-none transition hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-wait disabled:opacity-60"
            >
              {CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} · {currency.symbol}
                </option>
              ))}
            </select>
            {loadingRates ? (
              <Loader2 className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-blue-600" />
            ) : (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                ⌄
              </span>
            )}
          </span>
        </label>
      </div>

      {ratesError ? (
        <div
          role="alert"
          className="mb-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>
            Les taux de change sont indisponibles. Aucun total multi-devise incorrect n’est affiché.
          </span>
          <button
            type="button"
            onClick={() => setRetryNonce((value) => value + 1)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-semibold text-amber-900 hover:bg-amber-100"
          >
            <RefreshCw className="size-4" /> Réessayer
          </button>
        </div>
      ) : null}

      <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Chiffre d’affaires"
          value={revenue === null ? '—' : formatAmount(revenue, reportingCurrency, locale)}
          icon={TrendingUp}
          iconClass="bg-emerald-50 text-emerald-600"
          detail={`${summary.invoices.paid} facture(s) payée(s) · converti en ${reportingCurrency}`}
        />
        <KpiCard
          label="En attente"
          value={pending === null ? '—' : formatAmount(pending, reportingCurrency, locale)}
          icon={Clock3}
          iconClass="bg-blue-50 text-blue-600"
          detail={`${pendingCount} en attente de paiement · converti en ${reportingCurrency}`}
        />
        <KpiCard
          label="Factures"
          value={String(summary.invoices.total)}
          icon={FileText}
          iconClass="bg-blue-50 text-blue-600"
          detail={`${summary.invoices.draft} brouillon(s)`}
        />
        <KpiCard
          label="Devis"
          value={String(summary.quotes.total)}
          icon={FileCheck2}
          iconClass="bg-amber-50 text-amber-600"
          detail={`${summary.quotes.accepted} accepté(s)`}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h2 className="text-lg font-semibold text-slate-900">Documents récents</h2>
          <Link
            href={`/${locale}/invoices`}
            className="focus-ring inline-flex items-center gap-2 rounded text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Voir tout <ArrowRight className="size-4" />
          </Link>
        </div>
        {recent.length ? (
          <div className="divide-y divide-slate-100">
            {recent.map((document) => (
              <RecentDocumentRow
                key={`${document.kind}-${document.id}`}
                locale={locale}
                document={document}
              />
            ))}
          </div>
        ) : (
          <p className="px-6 py-12 text-center text-sm text-slate-500">
            Aucun document à afficher pour le moment.
          </p>
        )}
      </section>
    </main>
  );
}

function QuickAction({
  href,
  title,
  description,
  primary = false,
}: {
  href: string;
  title: string;
  description: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`focus-ring group flex items-center gap-4 rounded-2xl p-5 transition-colors ${primary ? 'bg-[var(--primary-900)] text-white hover:bg-[var(--primary-800)]' : 'border-2 border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/30'}`}
    >
      <span className={`rounded-xl p-3 ${primary ? 'bg-white/20' : 'bg-emerald-100'}`}>
        <Plus className={`size-6 ${primary ? '' : 'text-emerald-700'}`} />
      </span>
      <span className="text-left">
        <strong className={`block text-lg ${primary ? '' : 'text-slate-900'}`}>{title}</strong>
        <span className={`text-sm ${primary ? 'text-white/70' : 'text-slate-500'}`}>
          {description}
        </span>
      </span>
      <ArrowRight
        className={`ml-auto size-5 opacity-0 transition-opacity group-hover:opacity-100 ${primary ? '' : 'text-slate-400'}`}
      />
    </Link>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  iconClass,
  detail,
}: {
  label: string;
  value: string;
  icon: typeof TrendingUp;
  iconClass: string;
  detail: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span className={`rounded-lg p-2 ${iconClass}`}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="truncate text-2xl font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{detail}</p>
    </article>
  );
}

function RecentDocumentRow({ locale, document }: { locale: string; document: RecentDocument }) {
  const currency = asCurrency(document.currency) ?? 'EUR';
  const completed = document.status === 'paid' || document.status === 'accepted';
  const pending = document.status === 'sent' || document.status === 'issued';
  return (
    <Link
      href={`/${locale}/${document.kind === 'invoice' ? 'invoices' : 'quotes'}/${document.id}`}
      className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50"
    >
      <span
        className={`shrink-0 rounded-lg p-2.5 ${document.kind === 'invoice' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}
      >
        {document.kind === 'invoice' ? (
          <FileText className="size-5" />
        ) : (
          <FileCheck2 className="size-5" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <strong className="truncate text-sm text-slate-900">
            {document.number ?? document.draftReference ?? 'Brouillon'}
          </strong>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${completed ? 'bg-emerald-50 text-emerald-700' : pending ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'}`}
          >
            {completed ? <CheckCircle2 className="size-3" /> : null}
            {statusLabel(document.status)}
          </span>
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <span className="flex items-center gap-1">
            <User className="size-3.5" />
            <span className="max-w-40 truncate">{document.clientName}</span>
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="size-3.5" />
            {formatDate(document.documentDate, locale)}
          </span>
        </span>
      </span>
      <strong className="shrink-0 text-right text-sm text-slate-900">
        {formatAmount(Number(document.total), currency, locale)}
      </strong>
    </Link>
  );
}
