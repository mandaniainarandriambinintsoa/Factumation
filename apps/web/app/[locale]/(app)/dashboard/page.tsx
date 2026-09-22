import {
  ArrowUpRight,
  CircleAlert,
  Clock3,
  FileCheck2,
  FileText,
  Quote,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';

import { apiRequest } from '@/lib/api/server-api';

type Document = {
  id: string;
  number: string | null;
  draftReference: string | null;
  status: string;
  clientName: string;
  total: string;
  currency: string;
  createdAt: string;
};

type Page<T> = { items: T[]; total: number; page: number; limit: number };
type CurrencyAmount = { currency: string; amount: string; count: number };
type DashboardSummary = {
  invoices: {
    total: number;
    draft: number;
    issued: number;
    sent: number;
    paid: number;
    cancelled: number;
  };
  quotes: {
    total: number;
    draft: number;
    issued: number;
    sent: number;
    accepted: number;
    rejected: number;
    expired: number;
  };
  clients: number;
  revenueByCurrency: CurrencyAmount[];
  pendingByCurrency: CurrencyAmount[];
};

function formatAmounts(amounts: CurrencyAmount[], locale: string): string {
  if (!amounts.length) return '0';
  return amounts
    .map(({ amount, currency }) =>
      new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'fr-FR', {
        style: 'currency',
        currency,
        maximumFractionDigits: currency === 'MGA' ? 0 : 2,
      }).format(Number(amount)),
    )
    .join(' · ');
}

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [invoicesResult, quotesResult, summaryResult] = await Promise.allSettled([
    apiRequest<Page<Document>>('/invoices?limit=5'),
    apiRequest<Page<Document>>('/quotes?limit=5'),
    apiRequest<DashboardSummary>('/dashboard/summary'),
  ]);
  const invoices = invoicesResult.status === 'fulfilled' ? invoicesResult.value : null;
  const quotes = quotesResult.status === 'fulfilled' ? quotesResult.value : null;
  const summary = summaryResult.status === 'fulfilled' ? summaryResult.value : null;
  const hasError = !invoices || !quotes || !summary;
  const recent = [
    ...(invoices?.items ?? []).map((item) => ({ ...item, kind: 'Facture' as const })),
    ...(quotes?.items ?? []).map((item) => ({ ...item, kind: 'Devis' as const })),
  ]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);
  const cards = [
    {
      icon: TrendingUp,
      label: "Chiffre d'affaires",
      value: summary ? formatAmounts(summary.revenueByCurrency, locale) : '—',
      detail: summary ? `${summary.invoices.paid} facture(s) payée(s)` : 'Indisponible',
      tone: 'bg-emerald-50 text-emerald-600',
    },
    {
      icon: Clock3,
      label: 'En attente',
      value: summary ? formatAmounts(summary.pendingByCurrency, locale) : '—',
      detail: summary
        ? `${summary.invoices.issued + summary.invoices.sent} facture(s) à encaisser`
        : 'Indisponible',
      tone: 'bg-blue-50 text-blue-600',
    },
    {
      icon: FileText,
      label: 'Factures',
      value: summary?.invoices.total ?? '—',
      detail: summary ? `${summary.invoices.draft} brouillon(s)` : 'Indisponible',
      tone: 'bg-blue-50 text-[var(--primary-900)]',
    },
    {
      icon: Quote,
      label: 'Devis',
      value: summary?.quotes.total ?? '—',
      detail: summary ? `${summary.quotes.accepted} accepté(s)` : 'Indisponible',
      tone: 'bg-amber-50 text-amber-600',
    },
    {
      icon: Users,
      label: 'Clients',
      value: summary?.clients ?? '—',
      detail: 'Fiches enregistrées',
      tone: 'bg-slate-100 text-slate-600',
    },
    {
      icon: FileCheck2,
      label: 'Documents finalisés',
      value: summary ? summary.invoices.paid + summary.quotes.accepted : '—',
      detail: 'Payés ou acceptés',
      tone: 'bg-emerald-50 text-emerald-600',
    },
  ];

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 lg:px-10 lg:py-12">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-[var(--primary-600)]">Tableau de bord</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Bonjour !</h1>
          <p className="mt-1 text-slate-500">Voici un aperçu de votre activité.</p>
        </div>
        <Link
          href={`/${locale}/invoices/new`}
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary-900)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--primary-800)]"
        >
          Créer une facture
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
      {hasError && (
        <div
          role="alert"
          className="mt-8 flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
        >
          <CircleAlert className="mt-0.5 size-5 shrink-0" />
          <p>
            Une partie des indicateurs est temporairement indisponible. Réessayez dans un instant.
          </p>
        </div>
      )}
      <section className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ icon: CardIcon, label, value, detail, tone }) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className={`grid size-10 place-items-center rounded-full ${tone}`}>
                <CardIcon className="size-5" />
              </span>
              <ArrowUpRight className="size-4 text-slate-400" />
            </div>
            <p className="mt-8 break-words text-2xl font-bold text-slate-900">{value}</p>
            <p className="mt-1 text-sm font-medium text-slate-700">{label}</p>
            <p className="mt-1 text-xs text-slate-500">{detail}</p>
          </article>
        ))}
      </section>
      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <p className="font-semibold">Activité récente</p>
            <p className="text-sm text-slate-500">Factures et devis réunis</p>
          </div>
          <Clock3 className="size-5 text-slate-400" />
        </div>
        {recent.length ? (
          <div className="divide-y divide-slate-100">
            {recent.map((item) => (
              <Link
                key={`${item.kind}-${item.id}`}
                href={`/${locale}/${item.kind === 'Facture' ? 'invoices' : 'quotes'}/${item.id}`}
                className="grid grid-cols-[1fr_auto] gap-4 px-5 py-4 hover:bg-slate-50 sm:grid-cols-[7rem_1fr_8rem_7rem] sm:px-6"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {item.kind}
                </span>
                <div className="min-w-0">
                  <strong className="block truncate text-sm">
                    {item.number ?? item.draftReference ?? 'Brouillon'}
                  </strong>
                  <span className="block truncate text-xs text-slate-500">{item.clientName}</span>
                </div>
                <span className="hidden text-sm capitalize text-slate-500 sm:block">
                  {item.status}
                </span>
                <strong className="text-right text-sm">
                  {item.total} {item.currency}
                </strong>
              </Link>
            ))}
          </div>
        ) : (
          <p className="px-6 py-14 text-center text-sm text-slate-500">
            Aucun document à afficher pour le moment.
          </p>
        )}
      </section>
    </main>
  );
}
