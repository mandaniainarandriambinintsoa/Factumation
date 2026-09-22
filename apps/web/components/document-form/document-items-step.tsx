import type { DocumentCalculation } from '@factumation/domain';
import { Plus, Trash2 } from 'lucide-react';
import type {
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFormRegister,
} from 'react-hook-form';

import { formatMoney } from '@/lib/format';

import type { DocumentFormValues } from './document-form-schema';
import { Field, fieldClass } from './document-form-shared';

export function DocumentItemsStep({
  active,
  values,
  register,
  errors,
  append,
  remove,
  fieldIds,
  calculation,
  locale,
}: {
  active: boolean;
  values: DocumentFormValues;
  register: UseFormRegister<DocumentFormValues>;
  errors: FieldErrors<DocumentFormValues>;
  append: UseFieldArrayAppend<DocumentFormValues, 'items'>;
  remove: UseFieldArrayRemove;
  fieldIds: Array<{ id: string }>;
  calculation: DocumentCalculation | null;
  locale: string;
}) {
  return (
    <section
      aria-labelledby="items-step-title"
      className={`${active ? 'block' : 'hidden'} rounded-xl border border-slate-200 bg-white p-5 sm:block sm:p-6`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="items-step-title" className="font-semibold text-slate-900">
            Prestations
          </h2>
          <p className="mt-1 text-sm text-slate-500">Ajoutez les produits ou services facturés.</p>
        </div>
        <button
          type="button"
          onClick={() => append({ description: '', quantity: '1', unitPrice: '0' })}
          className="focus-ring inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Plus className="size-4" /> Ajouter
        </button>
      </div>
      <div className="mt-5 space-y-4">
        {fieldIds.map((field, index) => (
          <div
            key={field.id}
            className="grid gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4 sm:grid-cols-[minmax(0,1fr)_7rem_10rem_2.5rem] sm:items-start"
          >
            <Field label="Description" error={errors.items?.[index]?.description?.message}>
              <input
                {...register(`items.${index}.description`)}
                placeholder="Conseil, prestation…"
                className={fieldClass}
              />
            </Field>
            <Field label="Quantité" error={errors.items?.[index]?.quantity?.message}>
              <input
                inputMode="decimal"
                {...register(`items.${index}.quantity`)}
                className={fieldClass}
              />
            </Field>
            <Field label="Prix unitaire" error={errors.items?.[index]?.unitPrice?.message}>
              <input
                inputMode="decimal"
                {...register(`items.${index}.unitPrice`)}
                className={fieldClass}
              />
            </Field>
            <button
              type="button"
              onClick={() => remove(index)}
              disabled={fieldIds.length === 1}
              aria-label="Supprimer cette ligne"
              className="focus-ring mt-7 grid size-10 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-between border-t border-slate-100 pt-4 text-sm sm:hidden">
        <span className="font-medium text-slate-500">Total provisoire</span>
        <strong className="text-slate-900">
          {calculation ? formatMoney(calculation.amountDue, values.currency, locale) : '—'}
        </strong>
      </div>
    </section>
  );
}
