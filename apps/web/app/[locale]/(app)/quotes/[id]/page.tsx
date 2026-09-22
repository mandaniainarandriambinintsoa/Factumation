import { notFound } from 'next/navigation';

import { DocumentDetail } from '@/components/document-detail';
import { apiRequest, ApiRequestError } from '@/lib/api/server-api';
import type { Client, Company, Quote } from '@/lib/api/types';

export default async function QuotePage({
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
  const [clientResult, companyResult] = await Promise.allSettled([
    quote.clientId ? apiRequest<Client>(`/clients/${quote.clientId}`) : Promise.resolve(null),
    quote.companyId ? apiRequest<Company>(`/companies/${quote.companyId}`) : Promise.resolve(null),
  ]);
  return (
    <DocumentDetail
      document={quote}
      client={clientResult.status === 'fulfilled' ? clientResult.value : null}
      company={companyResult.status === 'fulfilled' ? companyResult.value : null}
      locale={locale}
      kind="quote"
    />
  );
}
