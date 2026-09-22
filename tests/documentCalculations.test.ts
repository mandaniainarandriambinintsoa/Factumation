import { describe, expect, it } from 'vitest';
import {
  calculateLegacyDocumentAmounts,
  getLegacyPersistedTotal,
} from '../utils/documentCalculations';

describe('legacy document calculations', () => {
  const items = [
    { quantity: 2, unitPrice: 125 },
    { quantity: 1, unitPrice: 50 },
  ];

  it('calculates the line subtotal', () => {
    expect(calculateLegacyDocumentAmounts(items)).toEqual({
      subtotal: 300,
      deduction: 0,
      amountDue: 300,
    });
  });

  it('characterizes taxRate as a deduction in the current UI', () => {
    expect(calculateLegacyDocumentAmounts(items, 20)).toEqual({
      subtotal: 300,
      deduction: 60,
      amountDue: 240,
    });
  });

  it('characterizes the persisted legacy total as the subtotal before deduction', () => {
    expect(getLegacyPersistedTotal(items)).toBe(300);
  });
});
