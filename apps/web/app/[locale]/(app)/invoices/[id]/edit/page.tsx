import { notFound, redirect } from 'next/navigation';

import { DocumentForm } from '@/components/document-form';
import { apiRequest, ApiRequestError } from '@/lib/api/server-api';
import type { Client, Company, Invoice, Paginated } from '@/lib/api/types';

export default async function EditInvoicePage({
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
  if (invoice.status !== 'draft' || invoice.calculationVersion !== 'v2')
    redirect(`/${locale}/invoices/${id}`);
  const [companies, clients] = await Promise.all([
    apiRequest<Paginated<Company>>('/companies?limit=100'),
    apiRequest<Paginated<Client>>('/clients?limit=100'),
  ]);
  return (
    <DocumentForm
      locale={locale}
      kind="invoice"
      companies={companies.items}
      clients={clients.items}
      initial={invoice}
    />
  );
}
