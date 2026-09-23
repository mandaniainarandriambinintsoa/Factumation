import type { DocumentCalculation } from '@factumation/domain';

import type { Client, Company } from '@/lib/api/types';
import { paymentMethodLabel } from '@/lib/document-options';
import { formatMoney } from '@/lib/format';

import type { DocumentFormValues } from './document-form-schema';
import { DocumentTotals } from './document-form-shared';

export function DocumentReviewStep({
  active,
  invoice,
  companies,
  clients,
  values,
  calculation,
  locale,
}: {
  active: boolean;
  invoice: boolean;
  companies: Company[];
  clients: Client[];
  values: DocumentFormValues;
  calculation: DocumentCalculation | null;
  locale: string;
}) {
  const company = companies.find((item) => item.id === values.companyId)?.name ?? 'Entreprise';
  const client =
    values.clientMode === 'new'
      ? values.clientName
      : (clients.find((item) => item.id === values.clientId)?.name ?? values.clientName);
  return (
    <section
      aria-labelledby="review-step-title"
      className={`${active ? 'block' : 'hidden'} rounded-xl border border-slate-200 bg-white p-5 sm:hidden`}
    >
      <h2 id="review-step-title" className="font-semibold text-slate-900">
        Vérification
      </h2>
      <p className="mt-1 text-sm text-slate-500">Relisez les informations avant de continuer.</p>
      <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <ReviewValue label="Entreprise" value={company} />
        <ReviewValue label="Client" value={client || '—'} />
        <ReviewValue
          label={invoice ? 'Date de facture' : 'Date du devis'}
          value={values.documentDate}
        />
        <ReviewValue label={invoice ? 'Échéance' : 'Validité'} value={values.secondDate} />
        <ReviewValue label="Devise" value={values.currency} />
        <ReviewValue label="Paiement" value={paymentMethodLabel(values.paymentMethod)} />
      </dl>
      <div className="mt-5 border-t border-slate-100 pt-4">
        <h3 className="text-sm font-semibold text-slate-900">Prestations</h3>
        <div className="mt-2 space-y-3">
          {values.items.map((item, index) => (
            <div
              key={`${item.description}-${index}`}
              className="flex justify-between gap-4 text-sm"
            >
              <span className="min-w-0 text-slate-600">
                <strong className="block truncate text-slate-800">{item.description}</strong>
                {item.quantity} × {formatMoney(item.unitPrice, values.currency, locale)}
              </span>
              <strong className="shrink-0">
                {calculation
                  ? formatMoney(calculation.items[index]?.total ?? '0', values.currency, locale)
                  : '—'}
              </strong>
            </div>
          ))}
        </div>
      </div>
      <DocumentTotals
        calculation={calculation}
        values={values}
        locale={locale}
        className="mt-5 border-t border-slate-100 pt-4"
      />
      {values.notes ? (
        <div className="mt-5 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          <strong className="block text-xs uppercase tracking-wide text-slate-400">Notes</strong>
          {values.notes}
        </div>
      ) : null}
    </section>
  );
}

function ReviewValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="mt-1 break-words font-medium text-slate-800">{value}</dd>
    </div>
  );
}
