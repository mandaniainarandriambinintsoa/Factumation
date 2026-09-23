export const DOCUMENT_CURRENCIES = [
  { code: 'EUR', label: 'EUR - €' },
  { code: 'USD', label: 'USD - $' },
  { code: 'GBP', label: 'GBP - £' },
  { code: 'CAD', label: 'CAD - $' },
  { code: 'CHF', label: 'CHF - CHF' },
  { code: 'MGA', label: 'MGA - Ar' },
] as const;

export const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Virement Bancaire' },
  { value: 'credit_card', label: 'Carte Bancaire' },
  { value: 'check', label: 'Chèque' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'cash', label: 'Espèces' },
  { value: 'mobile_money', label: 'Mobile Money' },
] as const;

const PAYMENT_ALIASES = new Map(
  PAYMENT_METHODS.flatMap(({ value, label }) => [
    [value.toLocaleLowerCase('fr'), value],
    [label.toLocaleLowerCase('fr'), value],
  ]),
);

export function normalizePaymentMethod(value: string | null | undefined): string {
  const normalized = value?.trim();
  if (!normalized) return 'bank_transfer';
  return PAYMENT_ALIASES.get(normalized.toLocaleLowerCase('fr')) ?? normalized;
}

export function paymentMethodLabel(value: string | null | undefined): string {
  const normalized = normalizePaymentMethod(value);
  return PAYMENT_METHODS.find((method) => method.value === normalized)?.label ?? normalized;
}
