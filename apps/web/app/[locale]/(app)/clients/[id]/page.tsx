import { ArrowLeft, Building2, Mail, MapPin, Phone, UserRound } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { apiRequest, ApiRequestError } from '@/lib/api/server-api';
import type { Client } from '@/lib/api/types';

export default async function ClientPage({
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
  const identifiers = [
    ['SIRET', client.siret],
    ['TVA', client.vatNumber],
    ['NIF', client.nif],
    ['STAT', client.stat],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));
  return (
    <main className="mx-auto max-w-4xl px-5 py-8 lg:px-10 lg:py-12">
      <Link
        href={`/${locale}/clients`}
        className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-medium text-slate-600 hover:text-[var(--primary-900)]"
      >
        <ArrowLeft className="size-4" />
        Retour aux clients
      </Link>
      <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-full bg-blue-50 text-blue-600">
            <UserRound className="size-7" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{client.name}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {client.companyName ?? 'Client particulier'}
            </p>
          </div>
        </div>
        <Link
          href={`/${locale}/clients/${id}/edit`}
          className="focus-ring rounded-lg bg-[var(--primary-900)] px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-[var(--primary-800)]"
        >
          Modifier
        </Link>
      </div>
      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="font-semibold text-slate-900">Coordonnées</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <p className="flex items-start gap-3 text-sm">
            <Mail className="mt-0.5 size-4 text-blue-600" />
            <span>
              <span className="block text-xs text-slate-400">E-mail</span>
              {client.email}
            </span>
          </p>
          <p className="flex items-start gap-3 text-sm">
            <Phone className="mt-0.5 size-4 text-blue-600" />
            <span>
              <span className="block text-xs text-slate-400">Téléphone</span>
              {client.phone ?? '—'}
            </span>
          </p>
          <p className="flex items-start gap-3 text-sm sm:col-span-2">
            <MapPin className="mt-0.5 size-4 text-blue-600" />
            <span>
              <span className="block text-xs text-slate-400">Adresse</span>
              {client.address ?? '—'}
            </span>
          </p>
        </div>
      </section>
      {identifiers.length ? (
        <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <Building2 className="size-4 text-blue-600" />
            Informations fiscales
          </div>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            {identifiers.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-slate-400">{label}</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
      {client.notes ? (
        <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="font-semibold text-slate-900">Notes</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{client.notes}</p>
        </section>
      ) : null}
    </main>
  );
}
