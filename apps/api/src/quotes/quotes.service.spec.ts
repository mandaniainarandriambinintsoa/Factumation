import { BadRequestException, ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { AuthPrincipal } from '../auth/auth-principal.js';
import type { QuoteReadRow } from '../common/supabase/database.types.js';
import { DocumentEmailGateway } from '../documents/document-email.gateway.js';
import { QuoteIdempotencyConflictError, QuotesRepository } from './quotes.repository.js';
import { QuotesService } from './quotes.service.js';

const principal: AuthPrincipal = {
  id: '8c5b87ec-b141-4bad-92e1-a848a6802dcf',
  role: 'authenticated',
};
const token = 'user-access-token';
const quoteId = '6ee5912f-ee3f-40a5-ab33-e6541c882f54';
const row: QuoteReadRow = {
  id: quoteId,
  user_id: principal.id,
  company_id: '58414737-e2d3-4b6e-9203-dff8472f5a46',
  client_id: '5c515da6-d9fa-4938-a619-a048207c7d57',
  draft_reference: 'DRQ-ABC123',
  quote_number: null,
  quote_date: '2026-09-21',
  validity_date: '2026-10-21',
  company_name: 'Analytical Engines',
  company_address: null,
  company_email: 'company@example.com',
  company_phone: null,
  logo_url: null,
  client_name: 'Ada Lovelace',
  client_address: null,
  client_email: 'ada@example.com',
  client_phone: null,
  items: [
    {
      id: 'line-1',
      description: 'Engine design',
      quantity: '2',
      unitPrice: '50.00',
      total: '100.00',
    },
  ],
  subtotal: '100.00',
  tax_mode: 'vat',
  tax_rate: '20',
  tax_amount: '20.00',
  withholding_amount: '0.00',
  total: '120.00',
  amount_due: '120.00',
  currency: 'EUR',
  payment_method: null,
  status: 'draft',
  calculation_version: 'v2',
  issued_at: null,
  notes: null,
  created_at: '2026-09-21T12:00:00.000Z',
  updated_at: '2026-09-21T12:00:00.000Z',
};
const input = {
  companyId: row.company_id!,
  clientId: row.client_id!,
  items: [{ description: 'Engine design', quantity: '2', unitPrice: '50.00' }],
  currency: 'EUR' as const,
  quoteDate: '2026-09-21',
  validityDate: '2026-10-21',
  taxMode: 'vat' as const,
  taxRate: '20',
};

function createService(withEmail = false) {
  const repository = {
    createDraft: vi.fn(),
    findById: vi.fn(),
    issue: vi.fn(),
    list: vi.fn(),
    transition: vi.fn(),
    updateDraft: vi.fn(),
    hasEmailEntitlement: vi.fn(),
    markSent: vi.fn(),
  } as unknown as QuotesRepository;
  const emails = { send: vi.fn() } as unknown as DocumentEmailGateway;
  return {
    repository,
    emails,
    service: new QuotesService(repository, withEmail ? emails : undefined),
  };
}

describe('QuotesService', () => {
  it('calculates VAT totals in the server-owned creation boundary', async () => {
    const { repository, service } = createService();
    vi.mocked(repository.createDraft).mockResolvedValue(row);

    const quote = await service.create(principal, token, 'quote:create:123', input);

    expect(repository.createDraft).toHaveBeenCalledWith(
      token,
      principal.id,
      expect.objectContaining({
        p_subtotal: '100.00',
        p_tax_amount: '20.00',
        p_total: '120.00',
        p_amount_due: '120.00',
        p_request_fingerprint: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    );
    expect(quote.total).toBe('120.00');
    expect(quote).toMatchObject({
      companyName: 'Analytical Engines',
      clientName: 'Ada Lovelace',
    });
  });

  it('rejects a validity date before the quote date', async () => {
    const { repository, service } = createService();

    await expect(
      service.create(principal, token, 'quote:create:123', {
        ...input,
        validityDate: '2026-09-20',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.createDraft).not.toHaveBeenCalled();
  });

  it('returns a conflict for an idempotency-key payload mismatch', async () => {
    const { repository, service } = createService();
    vi.mocked(repository.createDraft).mockRejectedValue(new QuoteIdempotencyConflictError());

    await expect(
      service.create(principal, token, 'quote:create:123', input),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not edit an issued quote', async () => {
    const { repository, service } = createService();
    vi.mocked(repository.findById).mockResolvedValue({
      ...row,
      quote_number: 'DEV-2026-000001',
      status: 'issued',
      issued_at: '2026-09-21T13:00:00.000Z',
    });

    await expect(
      service.update(principal, token, quoteId, { notes: 'Too late' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.updateDraft).not.toHaveBeenCalled();
  });

  it('issues through the atomic quote counter operation', async () => {
    const { repository, service } = createService();
    vi.mocked(repository.issue).mockResolvedValue({
      ...row,
      quote_number: 'DEV-2026-000001',
      status: 'issued',
      issued_at: '2026-09-21T13:00:00.000Z',
    });

    const quote = await service.issue(principal, token, quoteId);

    expect(repository.issue).toHaveBeenCalledWith(token, principal.id, quoteId);
    expect(quote.number).toBe('DEV-2026-000001');
  });

  it('accepts an issued quote through a guarded transition', async () => {
    const { repository, service } = createService();
    vi.mocked(repository.transition).mockResolvedValue({ ...row, status: 'accepted' });

    const quote = await service.transition(principal, token, quoteId, 'accepted');

    expect(repository.transition).toHaveBeenCalledWith(token, principal.id, quoteId, 'accepted');
    expect(quote.status).toBe('accepted');
  });

  it('sends an issued quote and then records its transition', async () => {
    const { repository, emails, service } = createService(true);
    const issued = {
      ...row,
      quote_number: 'DEV-2026-000001',
      status: 'issued',
      issued_at: '2026-09-21T13:00:00.000Z',
    };
    vi.mocked(repository.findById).mockResolvedValue(issued);
    vi.mocked(repository.hasEmailEntitlement).mockResolvedValue(true);
    vi.mocked(repository.markSent).mockResolvedValue({ ...issued, status: 'sent' });
    const result = await service.send(principal, token, quoteId);
    expect(emails.send).toHaveBeenCalledWith(
      token,
      quoteId,
      expect.objectContaining({ kind: 'quote', amountDue: '120.00' }),
      expect.any(Uint8Array),
    );
    expect(repository.markSent).toHaveBeenCalledWith(token, principal.id, quoteId);
    expect(result.status).toBe('sent');
  });
});
