import { FilePlus2 } from 'lucide-react';

import { ApiErrorState } from '@/components/api-error-state';
import { DocumentList } from '@/components/document-list';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { apiRequest, ApiRequestError } from '@/lib/api/server-api';
import type { Invoice, Paginated } from '@/lib/api/types';

export default async function InvoicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1);
  const allowed = ['draft', 'issued', 'sent', 'paid', 'cancelled'];
  const status = query.status && allowed.includes(query.status) ? query.status : undefined;
  let result: Paginated<Invoice> | null = null;
  let error: string | undefined;
  try {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (status) params.set('status', status);
    result = await apiRequest<Paginated<Invoice>>(`/invoices?${params.toString()}`);
  } catch (cause) {
    error = cause instanceof ApiRequestError ? cause.message : undefined;
  }
  return (
    <main className="mx-auto max-w-7xl px-5 py-8 lg:px-10 lg:py-12">
      <PageHeader
        eyebrow="Gestion"
        title="Factures"
        description="Consultez et gérez toutes vos factures."
        action={{ href: `/${locale}/invoices/new`, label: 'Créer une facture', icon: FilePlus2 }}
      />
      <div className="mt-8 flex gap-2 overflow-x-auto pb-1">
        {[
          ['', 'Toutes'],
          ['draft', 'Brouillons'],
          ['issued', 'Émises'],
          ['sent', 'Envoyées'],
          ['paid', 'Payées'],
          ['cancelled', 'Annulées'],
        ].map(([value, label]) => (
          <a
            key={value}
            href={value ? `?status=${value}` : `/${locale}/invoices`}
            className={`focus-ring whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${status === (value || undefined) ? 'bg-blue-50 text-[var(--primary-900)]' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            {label}
          </a>
        ))}
      </div>
      {result ? (
        <>
          <section className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <DocumentList items={result.items} locale={locale} kind="invoices" />
          </section>
          <Pagination
            page={result.page}
            limit={result.limit}
            total={result.total}
            path={`/${locale}/invoices`}
            query={{ status }}
          />
        </>
      ) : (
        <ApiErrorState message={error} />
      )}
    </main>
  );
}
