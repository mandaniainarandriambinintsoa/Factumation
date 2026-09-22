import { DocumentForm } from '@/components/document-form';
import { apiRequest } from '@/lib/api/server-api';
import type { Client, Company, Paginated } from '@/lib/api/types';

export default async function NewQuotePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
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
    />
  );
}
