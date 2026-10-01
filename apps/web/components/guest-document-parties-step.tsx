import type { FieldErrors, UseFormRegister } from 'react-hook-form';

import type { DocumentFormValues } from './document-form/document-form-schema';
import { Field, fieldClass } from './document-form/document-form-shared';

export type GuestIssuer = {
  name: string;
  address: string;
  email: string;
  phone: string;
  fiscalInfo: string;
  number: string;
};

export function GuestDocumentPartiesStep({
  active,
  issuerRegister,
  issuerErrors,
  values,
  register,
  errors,
}: {
  active: boolean;
  issuerRegister: UseFormRegister<GuestIssuer>;
  issuerErrors: FieldErrors<GuestIssuer>;
  values: DocumentFormValues;
  register: UseFormRegister<DocumentFormValues>;
  errors: FieldErrors<DocumentFormValues>;
}) {
  return (
    <section
      aria-labelledby="guest-parties-title"
      className={`${active ? 'grid' : 'hidden'} gap-5 rounded-xl border border-slate-200 bg-white p-5 sm:grid sm:grid-cols-2 sm:p-6`}
    >
      <div className="sm:col-span-2">
        <h2 id="guest-parties-title" className="font-semibold text-slate-900">
          Client
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Renseignez l’émetteur et le destinataire du document.
        </p>
      </div>

      <div className="border-t border-slate-100 pt-4 sm:col-span-2">
        <h3 className="text-sm font-semibold text-slate-900">Émetteur</h3>
        <p className="mt-1 text-xs text-slate-500">
          Ces informations sont utilisées uniquement pour ce document.
        </p>
      </div>
      <Field label="Nom de l’émetteur *" error={issuerErrors.name?.message}>
        <input {...issuerRegister('name')} className={fieldClass} autoComplete="organization" />
      </Field>
      <Field label="Numéro du document *" error={issuerErrors.number?.message}>
        <input {...issuerRegister('number')} className={fieldClass} autoComplete="off" />
      </Field>
      <Field label="E-mail de l’émetteur" error={issuerErrors.email?.message}>
        <input
          type="email"
          {...issuerRegister('email')}
          className={fieldClass}
          autoComplete="email"
        />
      </Field>
      <Field label="Téléphone de l’émetteur" error={issuerErrors.phone?.message}>
        <input type="tel" {...issuerRegister('phone')} className={fieldClass} autoComplete="tel" />
      </Field>
      <Field label="Adresse de l’émetteur" error={issuerErrors.address?.message} wide>
        <textarea
          {...issuerRegister('address')}
          rows={3}
          className="focus-ring mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900"
          autoComplete="street-address"
        />
      </Field>
      <Field
        label="Identifiants fiscaux (SIRET, TVA, NIF, STAT)"
        error={issuerErrors.fiscalInfo?.message}
        wide
      >
        <textarea
          {...issuerRegister('fiscalInfo')}
          rows={2}
          className="focus-ring mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900"
        />
      </Field>

      <div className="border-t border-slate-100 pt-4 sm:col-span-2">
        <h3 className="text-sm font-semibold text-slate-900">Destinataire</h3>
        <p className="mt-1 text-xs text-slate-500">
          Saisissez le client manuellement, sans l’enregistrer dans un compte.
        </p>
      </div>
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
        <input type="tel" {...register('clientPhone')} className={fieldClass} autoComplete="tel" />
      </Field>
      <Field label="Adresse" error={errors.clientAddress?.message} wide>
        <textarea
          {...register('clientAddress')}
          rows={3}
          className="focus-ring mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900"
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
    </section>
  );
}
