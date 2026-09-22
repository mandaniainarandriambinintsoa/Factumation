import { ArrowUpRight, CircleAlert, Clock3, FileText, Quote, Users } from 'lucide-react';
import Link from 'next/link';

import { apiRequest } from '@/lib/api/server-api';

type Document = {
  id: string;
  number: string | null;
  draftReference: string | null;
  status: string;
  total: string;
  currency: string;
  createdAt: string;
};
type Page<T> = { items: T[]; total: number; page: number; limit: number };

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [invoicesResult, quotesResult, clientsResult] = await Promise.allSettled([
    apiRequest<Page<Document>>('/invoices?limit=5'),
    apiRequest<Page<Document>>('/quotes?limit=5'),
    apiRequest<Page<{ id: string }>>('/clients?limit=1'),
  ]);
  const invoices = invoicesResult.status === 'fulfilled' ? invoicesResult.value : null;
  const quotes = quotesResult.status === 'fulfilled' ? quotesResult.value : null;
  const clients = clientsResult.status === 'fulfilled' ? clientsResult.value : null;
  const hasError = !invoices || !quotes || !clients;
  const recent = [
    ...(invoices?.items ?? []).map((item) => ({ ...item, kind: 'Facture' })),
    ...(quotes?.items ?? []).map((item) => ({ ...item, kind: 'Devis' })),
  ]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

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
            L’API métier n’est pas joignable pour le moment. Les données ne sont pas remplacées par
            de faux résultats ; réessayez après le démarrage de NestJS.
          </p>
        </div>
      )}
      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          [FileText, 'Factures', invoices?.total ?? '—'],
          [Quote, 'Devis', quotes?.total ?? '—'],
          [Users, 'Clients', clients?.total ?? '—'],
        ].map(([Icon, label, value]) => {
          const CardIcon = Icon as typeof FileText;
          return (
            <article
              key={String(label)}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-full bg-blue-50 text-blue-600">
                  <CardIcon className="size-5" />
                </span>
                <ArrowUpRight className="size-4 text-slate-400" />
              </div>
              <p className="mt-8 text-3xl font-bold text-slate-900">{String(value)}</p>
              <p className="mt-1 text-sm text-slate-500">{String(label)}</p>
            </article>
          );
        })}
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
              <div
                key={`${item.kind}-${item.id}`}
                className="grid grid-cols-[1fr_auto] gap-4 px-5 py-4 sm:grid-cols-[7rem_1fr_7rem_7rem] sm:px-6"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {item.kind}
                </span>
                <strong className="truncate text-sm">
                  {item.number ?? item.draftReference ?? 'Brouillon'}
                </strong>
                <span className="hidden text-sm capitalize text-slate-500 sm:block">
                  {item.status}
                </span>
                <strong className="text-right text-sm">
                  {item.total} {item.currency}
                </strong>
              </div>
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
