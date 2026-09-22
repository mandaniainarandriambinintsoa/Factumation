import { SUPPORTED_CURRENCIES, type SupportedCurrency } from '@factumation/domain';

import { DashboardOverview } from '@/components/dashboard-overview';
import { apiRequest } from '@/lib/api/server-api';
import type { Company, Paginated } from '@/lib/api/types';
import type { DashboardDocument, DashboardSummary } from '@/lib/dashboard';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createClient();
  const [{ data: claimsData }, invoicesResult, quotesResult, summaryResult, companyResult] =
    await Promise.all([
      supabase.auth.getClaims(),
      apiRequest<Paginated<DashboardDocument>>('/invoices?limit=5'),
      apiRequest<Paginated<DashboardDocument>>('/quotes?limit=5'),
      apiRequest<DashboardSummary>('/dashboard/summary'),
      apiRequest<Company | null>('/companies/default'),
    ]);

  const claims = claimsData?.claims;
  const email = typeof claims?.email === 'string' ? claims.email : '';
  const metadata = claims?.user_metadata;
  const metadataName =
    metadata &&
    typeof metadata === 'object' &&
    'full_name' in metadata &&
    typeof metadata.full_name === 'string'
      ? metadata.full_name
      : '';
  const firstName = (metadataName || email.split('@')[0] || '').trim().split(/\s+/)[0] ?? '';
  const configuredCurrency = companyResult?.defaultCurrency?.toUpperCase() as SupportedCurrency;
  const defaultCurrency = SUPPORTED_CURRENCIES.includes(configuredCurrency)
    ? configuredCurrency
    : 'EUR';
  const recent = [
    ...invoicesResult.items.map((item) => ({
      ...item,
      kind: 'invoice' as const,
      documentDate: item.invoiceDate ?? item.createdAt,
    })),
    ...quotesResult.items.map((item) => ({
      ...item,
      kind: 'quote' as const,
      documentDate: item.quoteDate ?? item.createdAt,
    })),
  ]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 6);

  return (
    <DashboardOverview
      locale={locale}
      userId={typeof claims?.sub === 'string' ? claims.sub : 'current-user'}
      firstName={firstName}
      defaultCurrency={defaultCurrency}
      summary={summaryResult}
      recent={recent}
    />
  );
}
