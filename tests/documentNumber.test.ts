import { describe, expect, it } from 'vitest';
import { createLegacyDocumentNumber } from '../utils/documentNumber';

describe('legacy document number', () => {
  const date = new Date('2026-09-21T00:00:00.000Z');

  it('keeps the current invoice format', () => {
    expect(createLegacyDocumentNumber('INV', date, () => 0.012)).toBe('INV-2026-012');
  });

  it('keeps custom company prefixes', () => {
    expect(createLegacyDocumentNumber('ACME', date, () => 0.999)).toBe('ACME-2026-999');
  });
});
