import { describe, expect, it } from 'vitest';

import { renderDocumentPdf } from './document-pdf.js';

describe('renderDocumentPdf', () => {
  it('renders a valid PDF with Unicode business data', async () => {
    const bytes = await renderDocumentPdf({
      kind: 'invoice',
      number: 'INV-2026-0001',
      draftReference: null,
      status: 'issued',
      companyName: 'Société Démo',
      companyAddress: 'Antananarivo',
      companyEmail: 'contact@example.com',
      companyPhone: null,
      clientName: 'André Client',
      clientAddress: 'Paris',
      clientEmail: 'andre@example.com',
      clientPhone: null,
      documentDate: '2026-09-21',
      secondDate: '2026-10-21',
      currency: 'EUR',
      items: [
        {
          description: 'Développement & accompagnement',
          quantity: '2',
          unitPrice: '50.00',
          total: '100.00',
        },
      ],
      subtotal: '100.00',
      taxMode: 'vat',
      taxRate: '20',
      taxAmount: '20.00',
      withholdingAmount: '0.00',
      amountDue: '120.00',
      paymentMethod: 'Virement bancaire',
      notes: 'Merci pour votre confiance.',
    });
    expect(bytes.byteLength).toBeGreaterThan(2_000);
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');
  });
});
