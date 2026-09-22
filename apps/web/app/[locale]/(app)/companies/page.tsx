import { Building2, CheckCircle2, Mail, Plus } from 'lucide-react';
import Link from 'next/link';

import { ApiErrorState } from '@/components/api-error-state';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { apiRequest, ApiRequestError } from '@/lib/api/server-api';
import type { Company, Paginated } from '@/lib/api/types';

export default async function CompaniesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1);
  let result: Paginated<Company> | null = null;
  let error: string | undefined;
  try {
    result = await apiRequest<Paginated<Company>>(`/companies?page=${page}&limit=20`);
  } catch (cause) {
    error = cause instanceof ApiRequestError ? cause.message : undefined;
  }
  return (
    <main className="mx-auto max-w-7xl px-5 py-8 lg:px-10 lg:py-12">
      <PageHeader
        eyebrow="Paramètres"
        title="Entreprises"
        description="Gérez les entités émettrices de vos documents."
        action={{ href: `/${locale}/companies/new`, label: 'Ajouter une entreprise', icon: Plus }}
      />
      {result ? (
        <>
          <section className="mt-8 grid gap-4 md:grid-cols-2">
            {result.items.length ? (
              result.items.map((company) => (
                <Link
                  key={company.id}
                  href={`/${locale}/companies/${company.id}`}
                  className="focus-ring rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-blue-200 hover:bg-blue-50/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid size-11 place-items-center rounded-lg bg-blue-50 text-blue-600">
                      <Building2 className="size-5" />
                    </span>
                    {company.isDefault ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        <CheckCircle2 className="size-3.5" />
                        Par défaut
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-5 font-semibold text-slate-900">{company.name}</h2>
                  <p className="mt-1 flex items-center gap-2 truncate text-sm text-slate-500">
                    <Mail className="size-4" />
                    {company.email ?? 'Aucun e-mail'}
                  </p>
                  <div className="mt-5 flex gap-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
                    <span>
                      Devise <strong className="text-slate-700">{company.defaultCurrency}</strong>
                    </span>
                    <span>
                      Factures <strong className="text-slate-700">{company.invoicePrefix}</strong>
                    </span>
                    <span>
                      Devis <strong className="text-slate-700">{company.quotePrefix}</strong>
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white">
                <EmptyState
                  icon={Building2}
                  title="Aucune entreprise"
                  description="Ajoutez l’entreprise qui émettra vos factures et devis."
                  action={{ href: `/${locale}/companies/new`, label: 'Ajouter une entreprise' }}
                />
              </div>
            )}
          </section>
          <Pagination
            page={result.page}
            limit={result.limit}
            total={result.total}
            path={`/${locale}/companies`}
          />
        </>
      ) : (
        <ApiErrorState message={error} />
      )}
    </main>
  );
}
