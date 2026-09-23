import type { FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form';

import type { Client, Company, Invoice, Quote } from '@/lib/api/types';
import { normalizePaymentMethod } from '@/lib/document-options';

import type { DocumentFormValues } from './document-form-schema';
import { Field, fieldClass, labelClass } from './document-form-shared';

export function DocumentClientStep({
  active,
  initial,
  companies,
  clients,
  values,
  register,
  errors,
  setValue,
}: {
  active: boolean;
  initial?: Invoice | Quote | undefined;
  companies: Company[];
  clients: Client[];
  values: DocumentFormValues;
  register: UseFormRegister<DocumentFormValues>;
  errors: FieldErrors<DocumentFormValues>;
  setValue: UseFormSetValue<DocumentFormValues>;
}) {
  const creatingClient = values.clientMode === 'new';
  return (
    <section
      aria-labelledby="client-step-title"
      className={`${active ? 'grid' : 'hidden'} gap-5 rounded-xl border border-slate-200 bg-white p-5 sm:grid sm:grid-cols-2 sm:p-6`}
    >
      <div className="sm:col-span-2">
        <h2 id="client-step-title" className="font-semibold text-slate-900">
          Client
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Choisissez l’émetteur et le destinataire du document.
        </p>
      </div>
      <Field label="Entreprise" error={errors.companyId?.message}>
        {initial ? (
          <>
            <input type="hidden" {...register('companyId')} />
            <span className={`${fieldClass} flex items-center bg-slate-100`}>
              {companies.find((company) => company.id === initial.companyId)?.name ??
                initial.companyName}
            </span>
          </>
        ) : (
          <select
            {...register('companyId', {
              onChange: (event) => {
                const company = companies.find((entry) => entry.id === event.target.value);
                if (!company) return;
                setValue('currency', company.defaultCurrency as DocumentFormValues['currency']);
                setValue('paymentMethod', normalizePaymentMethod(company.defaultPaymentMethod));
              },
            })}
            className={fieldClass}
          >
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        )}
      </Field>
      {initial ? (
        <Field label="Client">
          <input type="hidden" {...register('clientMode')} />
          <input type="hidden" {...register('clientId')} />
          <span className={`${fieldClass} flex items-center bg-slate-100`}>
            {initial.clientName}
          </span>
        </Field>
      ) : (
        <div className="sm:col-span-2">
          <span className={labelClass}>Destinataire</span>
          <div className="mt-1.5 grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setValue('clientMode', 'existing', { shouldValidate: true })}
              className={`focus-ring rounded-md px-3 py-2 text-sm font-semibold ${creatingClient ? 'text-slate-600' : 'bg-white text-[var(--primary-900)] shadow-sm'}`}
            >
              Client existant
            </button>
            <button
              type="button"
              onClick={() => setValue('clientMode', 'new', { shouldValidate: true })}
              className={`focus-ring rounded-md px-3 py-2 text-sm font-semibold ${creatingClient ? 'bg-white text-[var(--primary-900)] shadow-sm' : 'text-slate-600'}`}
            >
              Nouveau client
            </button>
          </div>
        </div>
      )}
      {!initial && !creatingClient ? (
        <Field label="Client" error={errors.clientId?.message} wide>
          <select {...register('clientId')} className={fieldClass}>
            <option value="">Sélectionner un client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
                {client.companyName ? ` — ${client.companyName}` : ''}
              </option>
            ))}
          </select>
          {!clients.length ? (
            <span className="mt-2 block text-xs text-amber-700">
              Aucun client enregistré. Choisissez « Nouveau client ».
            </span>
          ) : null}
        </Field>
      ) : null}
      {!initial && creatingClient ? (
        <>
          <Field label="Nom *" error={errors.clientName?.message}>
            <input {...register('clientName')} className={fieldClass} autoComplete="name" />
          </Field>
          <Field label="Entreprise" error={errors.clientCompanyName?.message}>
            <input
              {...register('clientCompanyName')}
              className={fieldClass}
              autoComplete="organization"
            />
          </Field>
          <Field label="E-mail *" error={errors.clientEmail?.message}>
            <input
              type="email"
              {...register('clientEmail')}
              className={fieldClass}
              autoComplete="email"
            />
          </Field>
          <Field label="Téléphone" error={errors.clientPhone?.message}>
            <input
              type="tel"
              {...register('clientPhone')}
              className={fieldClass}
              autoComplete="tel"
            />
          </Field>
          <Field label="Adresse" error={errors.clientAddress?.message} wide>
            <textarea
              {...register('clientAddress')}
              rows={3}
              className="focus-ring mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm"
              autoComplete="street-address"
            />
          </Field>
          <Field label="Région fiscale" error={errors.clientFiscalRegion?.message} wide>
            <select {...register('clientFiscalRegion')} className={fieldClass}>
              <option value="NONE">Non renseignée</option>
              <option value="EU">France / Union européenne</option>
              <option value="MG">Madagascar</option>
            </select>
          </Field>
          {values.clientFiscalRegion === 'EU' ? (
            <>
              <Field label="SIRET" error={errors.clientSiret?.message}>
                <input inputMode="numeric" {...register('clientSiret')} className={fieldClass} />
              </Field>
              <Field label="N° TVA" error={errors.clientVatNumber?.message}>
                <input {...register('clientVatNumber')} className={fieldClass} />
              </Field>
            </>
          ) : null}
          {values.clientFiscalRegion === 'MG' ? (
            <>
              <Field label="NIF" error={errors.clientNif?.message}>
                <input {...register('clientNif')} className={fieldClass} />
              </Field>
              <Field label="STAT" error={errors.clientStat?.message}>
                <input {...register('clientStat')} className={fieldClass} />
              </Field>
            </>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
