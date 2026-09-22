import { ArrowLeft, Building2, CalendarDays, UserRound } from 'lucide-react';
import Link from 'next/link';

import type { Client, Company, Invoice, Quote } from '@/lib/api/types';
import { formatDate, formatMoney } from '@/lib/format';
import { StatusBadge } from './status-badge';
import { DocumentActions } from './document-actions';

export function DocumentDetail({
  document,
  client,
  company,
  locale,
  kind,
}: {
  document: Invoice | Quote;
  client: Client | null;
  company: Company | null;
  locale: string;
  kind: 'invoice' | 'quote';
}) {
  const invoice = kind === 'invoice';
  const basePath = invoice ? 'invoices' : 'quotes';
  const documentDate = 'invoiceDate' in document ? document.invoiceDate : document.quoteDate;
  const secondDate = 'dueDate' in document ? document.dueDate : document.validityDate;
  return (
    <main className="mx-auto max-w-5xl px-5 py-8 lg:px-10 lg:py-12">
      <Link
        href={`/${locale}/${basePath}`}
        className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-medium text-slate-600 hover:text-[var(--primary-900)]"
      >
        <ArrowLeft className="size-4" /> Retour aux {invoice ? 'factures' : 'devis'}
      </Link>
      <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {document.number ?? document.draftReference ?? 'Brouillon'}
            </h1>
            <StatusBadge status={document.status} />
          </div>
          <p className="mt-2 text-sm text-slate-500">
            {invoice ? 'Facture' : 'Devis'} · créé le {formatDate(document.createdAt, locale)}
          </p>
        </div>
        <div className="flex flex-wrap items-start justify-end gap-2">
          {document.status === 'draft' && document.calculationVersion === 'v2' ? (
            <Link
              href={`/${locale}/${basePath}/${document.id}/edit`}
              className="focus-ring rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Modifier
            </Link>
          ) : null}
          <DocumentActions
            kind={kind}
            id={document.id}
            status={document.status}
            calculationVersion={document.calculationVersion}
          />
        </div>
      </div>
      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Building2 className="size-4 text-blue-600" />
            Émetteur
          </div>
          <p className="mt-4 font-semibold text-slate-900">
            {company?.name ?? 'Entreprise non disponible'}
          </p>
          <p className="mt-1 text-sm text-slate-500">{company?.email ?? company?.address ?? '—'}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <UserRound className="size-4 text-blue-600" />
            Client
          </div>
          <p className="mt-4 font-semibold text-slate-900">
            {client?.name ?? 'Client non disponible'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {client?.email ?? client?.companyName ?? '—'}
          </p>
        </article>
      </section>
      <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="grid grid-cols-2 gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4 text-sm sm:grid-cols-4 sm:px-6">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-slate-400" />
            <span>
              <span className="block text-xs text-slate-500">Date</span>
              {formatDate(documentDate, locale)}
            </span>
          </div>
          <div>
            <span className="block text-xs text-slate-500">
              {invoice ? 'Échéance' : 'Validité'}
            </span>
            {formatDate(secondDate, locale)}
          </div>
          <div>
            <span className="block text-xs text-slate-500">Devise</span>
            {document.currency}
          </div>
          <div>
            <span className="block text-xs text-slate-500">Paiement</span>
            {document.paymentMethod ?? '—'}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-6 py-3 font-semibold">Description</th>
                <th className="px-6 py-3 text-right font-semibold">Quantité</th>
                <th className="px-6 py-3 text-right font-semibold">Prix unitaire</th>
                <th className="px-6 py-3 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {document.items.map((item, index) => (
                <tr key={item.id ?? `${item.description}-${index}`}>
                  <td className="px-6 py-4 font-medium text-slate-900">{item.description}</td>
                  <td className="px-6 py-4 text-right text-slate-600">{item.quantity}</td>
                  <td className="px-6 py-4 text-right text-slate-600">
                    {formatMoney(item.unitPrice, document.currency, locale)}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-slate-900">
                    {formatMoney(item.total, document.currency, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ml-auto max-w-sm space-y-2 border-t border-slate-100 px-6 py-5 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Sous-total</span>
            <span>{formatMoney(document.subtotal, document.currency, locale)}</span>
          </div>
          {document.taxMode === 'vat' ? (
            <div className="flex justify-between">
              <span className="text-slate-500">TVA ({document.taxRate} %)</span>
              <span>{formatMoney(document.taxAmount, document.currency, locale)}</span>
            </div>
          ) : null}
          {document.taxMode === 'withholding' ? (
            <div className="flex justify-between">
              <span className="text-slate-500">Retenue ({document.taxRate} %)</span>
              <span>- {formatMoney(document.withholdingAmount, document.currency, locale)}</span>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900">
            <span>Total</span>
            <span>{formatMoney(document.amountDue, document.currency, locale)}</span>
          </div>
        </div>
      </section>
      {document.notes ? (
        <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Notes</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{document.notes}</p>
        </section>
      ) : null}
    </main>
  );
}
