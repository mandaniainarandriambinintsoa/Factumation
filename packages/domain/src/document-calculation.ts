import Decimal from 'decimal.js';

export const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP', 'CAD', 'CHF', 'MGA'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];
export type TaxMode = 'none' | 'vat' | 'withholding';

export type CalculationLine = {
  description: string;
  quantity: string;
  unitPrice: string;
};

export type DocumentCalculationInput = {
  currency: SupportedCurrency;
  items: readonly CalculationLine[];
  taxMode: TaxMode;
  taxRate: string;
};

export type CalculatedLine = CalculationLine & { total: string };

export type DocumentCalculation = {
  currency: SupportedCurrency;
  items: CalculatedLine[];
  subtotal: string;
  taxAmount: string;
  withholdingAmount: string;
  total: string;
  amountDue: string;
  calculationVersion: 'v2';
};

const CURRENCY_PRECISION: Record<SupportedCurrency, number> = {
  EUR: 2,
  USD: 2,
  GBP: 2,
  CAD: 2,
  CHF: 2,
  MGA: 2,
};

export function formatCurrencyAmount(value: string | number, currency: SupportedCurrency): string {
  const parsed = new Decimal(value);
  if (!parsed.isFinite()) throw new Error('Amount must be a finite decimal.');
  return parsed
    .toDecimalPlaces(CURRENCY_PRECISION[currency], Decimal.ROUND_HALF_UP)
    .toFixed(CURRENCY_PRECISION[currency]);
}

function parseNonNegativeDecimal(value: string, field: string): Decimal {
  const parsed = new Decimal(value);
  if (!parsed.isFinite() || parsed.isNegative()) {
    throw new Error(`${field} must be a finite non-negative decimal.`);
  }
  return parsed;
}

function round(value: Decimal, precision: number): Decimal {
  return value.toDecimalPlaces(precision, Decimal.ROUND_HALF_UP);
}

export function calculateDocument(input: DocumentCalculationInput): DocumentCalculation {
  if (input.items.length === 0) throw new Error('At least one line item is required.');

  const precision = CURRENCY_PRECISION[input.currency];
  const items = input.items.map((item, index) => {
    const quantity = parseNonNegativeDecimal(item.quantity, `items.${index}.quantity`);
    if (quantity.isZero()) throw new Error(`items.${index}.quantity must be greater than zero.`);
    const unitPrice = parseNonNegativeDecimal(item.unitPrice, `items.${index}.unitPrice`);
    return {
      ...item,
      total: round(quantity.mul(unitPrice), precision).toFixed(precision),
    };
  });

  const subtotalDecimal = round(
    items.reduce((sum, item) => sum.plus(item.total), new Decimal(0)),
    precision,
  );
  const rate = parseNonNegativeDecimal(input.taxRate, 'taxRate');
  if (rate.greaterThan(100)) throw new Error('taxRate must not exceed 100.');
  if (input.taxMode === 'none' && !rate.isZero()) {
    throw new Error('taxRate must be zero when taxMode is none.');
  }

  const adjustment = round(subtotalDecimal.mul(rate).div(100), precision);
  const zero = new Decimal(0).toFixed(precision);
  const taxAmount = input.taxMode === 'vat' ? adjustment : new Decimal(0);
  const withholdingAmount = input.taxMode === 'withholding' ? adjustment : new Decimal(0);
  const total = round(subtotalDecimal.plus(taxAmount), precision);
  const amountDue = round(total.minus(withholdingAmount), precision);

  return {
    currency: input.currency,
    items,
    subtotal: subtotalDecimal.toFixed(precision),
    taxAmount: taxAmount.isZero() ? zero : taxAmount.toFixed(precision),
    withholdingAmount: withholdingAmount.isZero() ? zero : withholdingAmount.toFixed(precision),
    total: total.toFixed(precision),
    amountDue: amountDue.toFixed(precision),
    calculationVersion: 'v2',
  };
}
