import type { LineItem } from '../types';

export interface LegacyDocumentAmounts {
  subtotal: number;
  deduction: number;
  amountDue: number;
}

/**
 * Reproduces the calculation currently shown by the legacy invoice and quote forms.
 * `taxRate` is a deduction/withholding rate in the current product, not additive VAT.
 */
export const calculateLegacyDocumentAmounts = (
  items: ReadonlyArray<Pick<LineItem, 'quantity' | 'unitPrice'>>,
  taxRate = 0,
): LegacyDocumentAmounts => {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const deduction = subtotal * (taxRate / 100);

  return {
    subtotal,
    deduction,
    amountDue: subtotal - deduction,
  };
};

/**
 * The legacy database stores the subtotal in `total`, even when a deduction is displayed.
 * Keep this explicit until historical rows are migrated to versioned amount columns.
 */
export const getLegacyPersistedTotal = (
  items: ReadonlyArray<Pick<LineItem, 'quantity' | 'unitPrice'>>,
): number => calculateLegacyDocumentAmounts(items).subtotal;
