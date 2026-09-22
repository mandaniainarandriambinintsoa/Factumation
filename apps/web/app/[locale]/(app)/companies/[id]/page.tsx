import { ArrowLeft, Building2, CheckCircle2, CreditCard, Mail, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { apiRequest, ApiRequestError } from '@/lib/api/server-api';
import type { Company } from '@/lib/api/types';

export default async function CompanyPage({
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
  const fiscal = [
    ['SIRET', company.siret],
    ['TVA', company.vatNumber],
    ['NIF', company.nif],
    ['STAT', company.stat],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));
  return (
    <main className="mx-auto max-w-4xl px-5 py-8 lg:px-10 lg:py-12">
      <Link
        href={`/${locale}/companies`}
        className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-medium text-slate-600 hover:text-[var(--primary-900)]"
      >
        <ArrowLeft className="size-4" />
        Retour aux entreprises
      </Link>
      <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-xl bg-blue-50 text-blue-600">
            <Building2 className="size-7" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{company.name}</h1>
              {company.isDefault ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  <CheckCircle2 className="size-3.5" />
                  Par défaut
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {company.fiscalRegion === 'NONE'
                ? 'Région fiscale non renseignée'
                : `Région ${company.fiscalRegion}`}
            </p>
          </div>
        </div>
        <Link
          href={`/${locale}/companies/${id}/edit`}
          className="focus-ring rounded-lg bg-[var(--primary-900)] px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-[var(--primary-800)]"
        >
          Modifier
        </Link>
      </div>
      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Coordonnées</h2>
          <div className="mt-5 space-y-4 text-sm">
            <p className="flex gap-3">
              <Mail className="size-4 text-blue-600" />
              {company.email ?? '—'}
            </p>
            <p className="flex gap-3">
              <Phone className="size-4 text-blue-600" />
              {company.phone ?? '—'}
            </p>
            <p className="flex gap-3">
              <MapPin className="size-4 shrink-0 text-blue-600" />
              {company.address ?? '—'}
            </p>
          </div>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <CreditCard className="size-4 text-blue-600" />
            Facturation
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs text-slate-400">Devise</dt>
              <dd className="mt-1 font-medium">{company.defaultCurrency}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Paiement</dt>
              <dd className="mt-1 font-medium">{company.defaultPaymentMethod || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Préfixe facture</dt>
              <dd className="mt-1 font-medium">{company.invoicePrefix}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Préfixe devis</dt>
              <dd className="mt-1 font-medium">{company.quotePrefix}</dd>
            </div>
          </dl>
        </article>
      </section>
      {fiscal.length || company.iban || company.bic ? (
        <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Informations légales et bancaires</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            {fiscal.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-slate-400">{label}</dt>
                <dd className="mt-1 text-sm font-medium">{value}</dd>
              </div>
            ))}
            {company.iban ? (
              <div>
                <dt className="text-xs text-slate-400">IBAN</dt>
                <dd className="mt-1 break-all text-sm font-medium">{company.iban}</dd>
              </div>
            ) : null}
            {company.bic ? (
              <div>
                <dt className="text-xs text-slate-400">BIC</dt>
                <dd className="mt-1 text-sm font-medium">{company.bic}</dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}
    </main>
  );
}
