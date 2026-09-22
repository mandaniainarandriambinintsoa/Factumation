import type { DocumentCalculation } from '@factumation/domain';

import { formatMoney } from '@/lib/format';

import type { DocumentFormValues } from './document-form-schema';

export const fieldClass =
  'focus-ring mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400';
export const labelClass = 'text-sm font-medium text-slate-700';

export function DocumentTotals({
  calculation,
  values,
  locale,
  className = '',
}: {
  calculation: DocumentCalculation | null;
  values: DocumentFormValues;
  locale: string;
  className?: string;
}) {
  return (
    <div className={`text-sm ${className}`}>
      <div className="flex justify-between">
        <span className="text-slate-500">Sous-total</span>
        <span>
          {calculation ? formatMoney(calculation.subtotal, values.currency, locale) : '—'}
        </span>
      </div>
      {values.taxMode === 'vat' ? (
        <div className="mt-2 flex justify-between">
          <span className="text-slate-500">TVA</span>
          <span>
            {calculation ? formatMoney(calculation.taxAmount, values.currency, locale) : '—'}
          </span>
        </div>
      ) : null}
      {values.taxMode === 'withholding' ? (
        <div className="mt-2 flex justify-between">
          <span className="text-slate-500">Retenue</span>
          <span>
            {calculation
              ? `- ${formatMoney(calculation.withholdingAmount, values.currency, locale)}`
              : '—'}
          </span>
        </div>
      ) : null}
      <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900">
        <span>Net à payer</span>
        <span>
          {calculation ? formatMoney(calculation.amountDue, values.currency, locale) : '—'}
        </span>
      </div>
    </div>
  );
}

export function Field({
  label,
  error,
  wide = false,
  children,
}: {
  label: string;
  error?: string | undefined;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`${labelClass} ${wide ? 'sm:col-span-full' : ''}`}>
      {label}
      {children}
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
