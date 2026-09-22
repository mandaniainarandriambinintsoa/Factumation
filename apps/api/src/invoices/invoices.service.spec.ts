import { BadRequestException, ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { AuthPrincipal } from '../auth/auth-principal.js';
import type { InvoiceReadRow } from '../common/supabase/database.types.js';
import { DocumentEmailGateway } from '../documents/document-email.gateway.js';
import {
  IdempotencyConflictError,
  InvoiceQuotaExceededError,
  InvoicesRepository,
} from './invoices.repository.js';
import { InvoicesService } from './invoices.service.js';

const principal: AuthPrincipal = {
  id: '8c5b87ec-b141-4bad-92e1-a848a6802dcf',
  role: 'authenticated',
};
const token = 'user-access-token';
const invoiceId = 'e021062f-7e4a-4f1a-8f79-2d13417a7267';
const row: InvoiceReadRow = {
  id: invoiceId,
  user_id: principal.id,
  company_id: '58414737-e2d3-4b6e-9203-dff8472f5a46',
  client_id: '5c515da6-d9fa-4938-a619-a048207c7d57',
  draft_reference: 'DRF-ABC123',
  invoice_number: null,
  invoice_date: '2026-09-21',
  due_date: '2026-10-21',
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
  tax_mode: 'withholding',
  tax_rate: '20',
  tax_amount: '0.00',
  withholding_amount: '20.00',
  total: '100.00',
  amount_due: '80.00',
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
  invoiceDate: '2026-09-21',
  dueDate: '2026-10-21',
  taxMode: 'withholding' as const,
  taxRate: '20',
};

function createService(withEmail = false) {
  const repository = {
    createDraft: vi.fn(),
    findById: vi.fn(),
    issue: vi.fn(),
    list: vi.fn(),
    updateDraft: vi.fn(),
    hasEmailEntitlement: vi.fn(),
    markSent: vi.fn(),
    markPaid: vi.fn(),
  } as unknown as InvoicesRepository;
  const emails = { send: vi.fn() } as unknown as DocumentEmailGateway;
  return {
    repository,
    emails,
    service: new InvoicesService(repository, withEmail ? emails : undefined),
  };
}

describe('InvoicesService', () => {
  it('calculates authoritative totals and scopes draft creation to the principal', async () => {
    const { repository, service } = createService();
    vi.mocked(repository.createDraft).mockResolvedValue(row);

    const invoice = await service.create(principal, token, 'invoice:create:123', input);

    expect(repository.createDraft).toHaveBeenCalledWith(
      token,
      principal.id,
      expect.objectContaining({
        p_subtotal: '100.00',
        p_tax_amount: '0.00',
        p_withholding_amount: '20.00',
        p_total: '100.00',
        p_amount_due: '80.00',
        p_idempotency_key: 'invoice:create:123',
        p_request_fingerprint: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    );
    expect(invoice.amountDue).toBe('80.00');
    expect(invoice).toMatchObject({
      companyName: 'Analytical Engines',
      clientName: 'Ada Lovelace',
    });
  });

  it('rejects missing or unsafe idempotency keys before data access', async () => {
    const { repository, service } = createService();

    await expect(service.create(principal, token, undefined, input)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.create(principal, token, 'bad key!', input)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.createDraft).not.toHaveBeenCalled();
  });

  it('requires exactly one existing or inline client', async () => {
    const { repository, service } = createService();
    const { clientId, ...inputWithoutClient } = input;
    void clientId;

    await expect(
      service.create(principal, token, 'invoice:create:123', inputWithoutClient),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.create(principal, token, 'invoice:create:123', {
        ...input,
        client: { name: 'Ada', email: 'ada@example.com' },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.createDraft).not.toHaveBeenCalled();
  });

  it('normalizes an inline client inside the atomic draft request', async () => {
    const { repository, service } = createService();
    vi.mocked(repository.createDraft).mockResolvedValue(row);
    const { clientId, ...inputWithoutClient } = input;
    void clientId;

    await service.create(principal, token, 'invoice:create:123', {
      ...inputWithoutClient,
      client: { name: 'Ada', email: 'ADA@EXAMPLE.COM' },
    });

    expect(repository.createDraft).toHaveBeenCalledWith(
      token,
      principal.id,
      expect.objectContaining({
        p_client_id: null,
        p_client: expect.objectContaining({ name: 'Ada', email: 'ada@example.com' }),
      }),
    );
  });

  it('returns a conflict when an idempotency key is reused for another payload', async () => {
    const { repository, service } = createService();
    vi.mocked(repository.createDraft).mockRejectedValue(new IdempotencyConflictError());

    await expect(
      service.create(principal, token, 'invoice:create:123', input),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns a forbidden response when the atomic monthly quota is exhausted', async () => {
    const { repository, service } = createService();
    vi.mocked(repository.createDraft).mockRejectedValue(new InvoiceQuotaExceededError());

    await expect(
      service.create(principal, token, 'invoice:create:123', input),
    ).rejects.toMatchObject({
      status: 403,
    });
  });

  it('does not edit issued invoices', async () => {
    const { repository, service } = createService();
    vi.mocked(repository.findById).mockResolvedValue({
      ...row,
      invoice_number: 'INV-2026-000001',
      status: 'issued',
      issued_at: '2026-09-21T13:00:00.000Z',
    });

    await expect(
      service.update(principal, token, invoiceId, { notes: 'Too late' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.updateDraft).not.toHaveBeenCalled();
  });

  it('preserves line identifiers when editing fields other than items', async () => {
    const { repository, service } = createService();
    vi.mocked(repository.findById).mockResolvedValue(row);
    vi.mocked(repository.updateDraft).mockResolvedValue({ ...row, notes: 'Updated' });

    await service.update(principal, token, invoiceId, { notes: 'Updated' });

    expect(repository.updateDraft).toHaveBeenCalledWith(
      token,
      principal.id,
      invoiceId,
      expect.objectContaining({
        items: [expect.objectContaining({ id: 'line-1' })],
        notes: 'Updated',
      }),
    );
  });

  it('issues through the atomic repository operation', async () => {
    const { repository, service } = createService();
    vi.mocked(repository.issue).mockResolvedValue({
      ...row,
      invoice_number: 'INV-2026-000001',
      status: 'issued',
      issued_at: '2026-09-21T13:00:00.000Z',
    });

    const invoice = await service.issue(principal, token, invoiceId);

    expect(repository.issue).toHaveBeenCalledWith(token, principal.id, invoiceId);
    expect(invoice.number).toBe('INV-2026-000001');
  });

  it('maps untouched legacy rows without requiring v2 backfill columns', async () => {
    const { repository, service } = createService();
    vi.mocked(repository.findById).mockResolvedValue({
      ...row,
      company_id: null,
      client_id: null,
      draft_reference: null,
      invoice_number: 'INV-LEGACY',
      items: [{ id: 'legacy-line', name: 'Legacy work', quantity: 1, unitPrice: 100 }],
      subtotal: null,
      tax_mode: null,
      tax_amount: null,
      withholding_amount: null,
      amount_due: null,
      calculation_version: null,
    });

    const invoice = await service.findOne(principal, token, invoiceId);

    expect(invoice).toMatchObject({
      calculationVersion: 'legacy-v1',
      subtotal: '100.00',
      withholdingAmount: '20.00',
      amountDue: '80.00',
    });
  });

  it('sends an issued invoice before atomically marking it sent', async () => {
    const { repository, emails, service } = createService(true);
    const issued = {
      ...row,
      invoice_number: 'INV-2026-000001',
      status: 'issued',
      issued_at: '2026-09-21T13:00:00.000Z',
    };
    vi.mocked(repository.findById).mockResolvedValue(issued);
    vi.mocked(repository.hasEmailEntitlement).mockResolvedValue(true);
    vi.mocked(repository.markSent).mockResolvedValue({ ...issued, status: 'sent' });
    const result = await service.send(principal, token, invoiceId);
    expect(emails.send).toHaveBeenCalledWith(
      token,
      invoiceId,
      expect.objectContaining({ kind: 'invoice', amountDue: '80.00' }),
      expect.any(Uint8Array),
    );
    expect(repository.markSent).toHaveBeenCalledWith(token, principal.id, invoiceId);
    expect(result.status).toBe('sent');
  });

  it('marks an issued invoice paid through the atomic transition', async () => {
    const { repository, service } = createService();
    vi.mocked(repository.markPaid).mockResolvedValue({ ...row, status: 'paid' });
    await expect(service.markPaid(principal, token, invoiceId)).resolves.toMatchObject({
      status: 'paid',
    });
  });
});
