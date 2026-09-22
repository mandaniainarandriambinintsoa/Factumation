import { notFound } from 'next/navigation';

import { DocumentDetail } from '@/components/document-detail';
import { apiRequest, ApiRequestError } from '@/lib/api/server-api';
import type { Client, Company, Invoice } from '@/lib/api/types';

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  let invoice: Invoice;
  try {
    invoice = await apiRequest<Invoice>(`/invoices/${id}`);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) notFound();
    throw error;
  }
  const [clientResult, companyResult] = await Promise.allSettled([
    invoice.clientId ? apiRequest<Client>(`/clients/${invoice.clientId}`) : Promise.resolve(null),
    invoice.companyId
      ? apiRequest<Company>(`/companies/${invoice.companyId}`)
      : Promise.resolve(null),
  ]);
  return (
    <DocumentDetail
      document={invoice}
      client={clientResult.status === 'fulfilled' ? clientResult.value : null}
      company={companyResult.status === 'fulfilled' ? companyResult.value : null}
      locale={locale}
      kind="invoice"
    />
  );
}
