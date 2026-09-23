import type { TaxMode } from '@factumation/domain';
import type { FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form';

import { DOCUMENT_CURRENCIES, PAYMENT_METHODS } from '@/lib/document-options';

import type { DocumentFormValues } from './document-form-schema';
import { Field, fieldClass } from './document-form-shared';

export function DocumentBillingStep({
  active,
  invoice,
  values,
  register,
  errors,
  setValue,
}: {
  active: boolean;
  invoice: boolean;
  values: DocumentFormValues;
  register: UseFormRegister<DocumentFormValues>;
  errors: FieldErrors<DocumentFormValues>;
  setValue: UseFormSetValue<DocumentFormValues>;
}) {
  return (
    <section
      aria-labelledby="billing-step-title"
      className={`${active ? 'grid' : 'hidden'} gap-5 rounded-xl border border-slate-200 bg-white p-5 sm:grid sm:grid-cols-3 sm:p-6`}
    >
      <div className="sm:col-span-3">
        <h2 id="billing-step-title" className="font-semibold text-slate-900">
          Facturation
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Définissez les dates, la devise et les conditions.
        </p>
      </div>
      <Field
        label={invoice ? 'Date de facture' : 'Date du devis'}
        error={errors.documentDate?.message}
      >
        <input type="date" {...register('documentDate')} className={fieldClass} />
      </Field>
      <Field
        label={invoice ? 'Date d’échéance' : 'Valable jusqu’au'}
        error={errors.secondDate?.message}
      >
        <input type="date" {...register('secondDate')} className={fieldClass} />
      </Field>
      <Field label="Devise" error={errors.currency?.message}>
        <select {...register('currency')} className={fieldClass}>
          {DOCUMENT_CURRENCIES.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Taxe" error={errors.taxMode?.message}>
        <select
          {...register('taxMode')}
          onChange={(event) => {
            const mode = event.target.value as TaxMode;
            setValue('taxMode', mode);
            if (mode === 'none') setValue('taxRate', '0');
          }}
          className={fieldClass}
        >
          <option value="none">Aucune</option>
          <option value="vat">TVA</option>
          <option value="withholding">Retenue à la source</option>
        </select>
      </Field>
      <Field label="Taux (%)" error={errors.taxRate?.message}>
        <input
          inputMode="decimal"
          disabled={values.taxMode === 'none'}
          {...register('taxRate')}
          className={`${fieldClass} disabled:bg-slate-100`}
        />
      </Field>
      <Field label="Mode de paiement" error={errors.paymentMethod?.message}>
        <select {...register('paymentMethod')} className={fieldClass}>
          {PAYMENT_METHODS.map((method) => (
            <option key={method.value} value={method.value}>
              {method.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Notes" error={errors.notes?.message} wide>
        <textarea
          {...register('notes')}
          rows={4}
          className="focus-ring mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900"
        />
      </Field>
    </section>
  );
}
