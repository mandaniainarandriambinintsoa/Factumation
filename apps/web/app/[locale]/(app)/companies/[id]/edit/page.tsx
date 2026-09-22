import { notFound } from 'next/navigation';

import { CompanyForm } from '@/components/company-form';
import { apiRequest, ApiRequestError } from '@/lib/api/server-api';
import type { Company } from '@/lib/api/types';

export default async function EditCompanyPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  let company: Company;
  try {
    company = await apiRequest<Company>(`/companies/${id}`);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) notFound();
    throw error;
  }
  return <CompanyForm locale={locale} initial={company} />;
}
