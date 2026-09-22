import { describe, expect, it } from 'vitest';

import { calculateDocument } from './document-calculation.js';

describe('calculateDocument', () => {
  it('adds VAT to the subtotal', () => {
    expect(
      calculateDocument({
        currency: 'EUR',
        items: [{ description: 'Development', quantity: '1', unitPrice: '1000.00' }],
        taxMode: 'vat',
        taxRate: '20',
      }),
    ).toMatchObject({
      subtotal: '1000.00',
      taxAmount: '200.00',
      withholdingAmount: '0.00',
      total: '1200.00',
      amountDue: '1200.00',
    });
  });

  it('deducts withholding from the amount due without changing gross total', () => {
    expect(
      calculateDocument({
        currency: 'MGA',
        items: [{ description: 'Service', quantity: '1', unitPrice: '100.00' }],
        taxMode: 'withholding',
        taxRate: '20',
      }),
    ).toMatchObject({
      subtotal: '100.00',
      taxAmount: '0.00',
      withholdingAmount: '20.00',
      total: '100.00',
      amountDue: '80.00',
    });
  });

  it('uses decimal half-up rounding instead of binary floating point', () => {
    const result = calculateDocument({
      currency: 'EUR',
      items: [{ description: 'Fraction', quantity: '1', unitPrice: '0.105' }],
      taxMode: 'none',
      taxRate: '0',
    });

    expect(result.subtotal).toBe('0.11');
  });

  it('rejects an incoherent tax mode and rate', () => {
    expect(() =>
      calculateDocument({
        currency: 'EUR',
        items: [{ description: 'Service', quantity: '1', unitPrice: '10' }],
        taxMode: 'none',
        taxRate: '20',
      }),
    ).toThrow('taxRate must be zero');
  });
});
