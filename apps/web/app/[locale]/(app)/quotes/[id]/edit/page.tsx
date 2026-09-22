import { notFound, redirect } from 'next/navigation';

import { DocumentForm } from '@/components/document-form';
import { apiRequest, ApiRequestError } from '@/lib/api/server-api';
import type { Client, Company, Paginated, Quote } from '@/lib/api/types';

export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  let quote: Quote;
  try {
    quote = await apiRequest<Quote>(`/quotes/${id}`);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) notFound();
    throw error;
  }
  if (quote.status !== 'draft' || quote.calculationVersion !== 'v2')
    redirect(`/${locale}/quotes/${id}`);
  const [companies, clients] = await Promise.all([
    apiRequest<Paginated<Company>>('/companies?limit=100'),
    apiRequest<Paginated<Client>>('/clients?limit=100'),
  ]);
  return (
    <DocumentForm
      locale={locale}
      kind="quote"
      companies={companies.items}
      clients={clients.items}
      initial={quote}
    />
  );
}
