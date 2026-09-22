import { Building2, Mail, Plus, Search, UserRound } from 'lucide-react';
import Link from 'next/link';

import { ApiErrorState } from '@/components/api-error-state';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { apiRequest, ApiRequestError } from '@/lib/api/server-api';
import type { Client, Paginated } from '@/lib/api/types';

export default async function ClientsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1);
  const search = query.search?.trim().slice(0, 100);
  let result: Paginated<Client> | null = null;
  let error: string | undefined;
  try {
    const apiQuery = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) apiQuery.set('search', search);
    result = await apiRequest<Paginated<Client>>(`/clients?${apiQuery.toString()}`);
  } catch (cause) {
    error = cause instanceof ApiRequestError ? cause.message : undefined;
  }
  return (
    <main className="mx-auto max-w-7xl px-5 py-8 lg:px-10 lg:py-12">
      <PageHeader
        eyebrow="Répertoire"
        title="Clients"
        description="Retrouvez les coordonnées de vos clients."
        action={{ href: `/${locale}/clients/new`, label: 'Ajouter un client', icon: Plus }}
      />
      <form className="mt-8 flex max-w-xl gap-2" method="get">
        <label className="relative flex-1">
          <span className="sr-only">Rechercher un client</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            name="search"
            defaultValue={search}
            maxLength={100}
            placeholder="Nom, entreprise ou e-mail"
            className="focus-ring h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400"
          />
        </label>
        <button className="focus-ring rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Rechercher
        </button>
      </form>
      {result ? (
        <>
          <section className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {result.items.length ? (
              <div className="divide-y divide-slate-100">
                {result.items.map((client) => (
                  <Link
                    key={client.id}
                    href={`/${locale}/clients/${client.id}`}
                    className="focus-ring grid gap-3 px-5 py-4 hover:bg-slate-50 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_10rem] sm:items-center sm:px-6"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600">
                        <UserRound className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{client.name}</p>
                        <p className="truncate text-xs text-slate-500">
                          {client.companyName ?? 'Particulier'}
                        </p>
                      </div>
                    </div>
                    <p className="flex min-w-0 items-center gap-2 truncate text-sm text-slate-600">
                      <Mail className="size-4 shrink-0 text-slate-400" />
                      {client.email}
                    </p>
                    <p className="text-sm text-slate-500 sm:text-right">
                      {client.fiscalRegion === 'NONE' ? 'Non renseigné' : client.fiscalRegion}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Building2}
                title="Aucun client"
                description="Ajoutez un client pour l’utiliser dans vos factures et devis."
                action={{ href: `/${locale}/clients/new`, label: 'Ajouter un client' }}
              />
            )}
          </section>
          <Pagination
            page={result.page}
            limit={result.limit}
            total={result.total}
            path={`/${locale}/clients`}
            query={{ search }}
          />
        </>
      ) : (
        <ApiErrorState message={error} />
      )}
    </main>
  );
}
