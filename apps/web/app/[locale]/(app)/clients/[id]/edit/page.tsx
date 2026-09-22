import { notFound } from 'next/navigation';

import { ClientForm } from '@/components/client-form';
import { apiRequest, ApiRequestError } from '@/lib/api/server-api';
import type { Client } from '@/lib/api/types';

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  let client: Client;
  try {
    client = await apiRequest<Client>(`/clients/${id}`);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) notFound();
    throw error;
  }
  return <ClientForm locale={locale} initial={client} />;
}
