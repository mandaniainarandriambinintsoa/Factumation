import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { AuthPrincipal } from '../auth/auth-principal.js';
import type { CompanyRow } from '../common/supabase/database.types.js';
import { CompaniesRepository } from './companies.repository.js';
import { CompaniesService } from './companies.service.js';

const principal: AuthPrincipal = {
  id: '8c5b87ec-b141-4bad-92e1-a848a6802dcf',
  role: 'authenticated',
};
const token = 'user-access-token';
const row: CompanyRow = {
  id: '58414737-e2d3-4b6e-9203-dff8472f5a46',
  user_id: principal.id,
  name: 'Analytical Engines',
  address: null,
  email: 'hello@example.com',
  phone: null,
  logo_url: null,
  fiscal_region: 'EU',
  siret: null,
  vat_number: null,
  nif: null,
  stat: null,
  iban: null,
  bic: null,
  default_currency: 'EUR',
  default_payment_method: 'Virement Bancaire',
  invoice_prefix: 'INV',
  quote_prefix: 'DEV',
  is_default: false,
  notes: null,
  created_at: '2026-09-21T12:00:00.000Z',
  updated_at: '2026-09-21T12:00:00.000Z',
};

function createService() {
  const repository = {
    create: vi.fn(),
    delete: vi.fn(),
    findById: vi.fn(),
    findDefault: vi.fn(),
    list: vi.fn(),
    setDefault: vi.fn(),
    update: vi.fn(),
  } as unknown as CompaniesRepository;
  return { repository, service: new CompaniesService(repository) };
}

describe('CompaniesService', () => {
  it('creates companies for the principal without accepting a default-company race', async () => {
    const { repository, service } = createService();
    vi.mocked(repository.create).mockResolvedValue(row);

    await service.create(principal, token, {
      name: 'Analytical Engines',
      email: 'HELLO@EXAMPLE.COM',
    });

    expect(repository.create).toHaveBeenCalledWith(
      token,
      expect.objectContaining({
        user_id: principal.id,
        is_default: false,
        email: 'hello@example.com',
      }),
    );
  });

  it('uses an owner-scoped default lookup', async () => {
    const { repository, service } = createService();
    vi.mocked(repository.findDefault).mockResolvedValue(row);

    const company = await service.findDefault(principal, token);

    expect(repository.findDefault).toHaveBeenCalledWith(token, principal.id);
    expect(company?.id).toBe(row.id);
  });

  it('rejects empty patches before data access', async () => {
    const { repository, service } = createService();

    await expect(service.update(principal, token, row.id, {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('sets the default through the atomic repository operation', async () => {
    const { repository, service } = createService();
    vi.mocked(repository.setDefault).mockResolvedValue({ ...row, is_default: true });

    const company = await service.setDefault(principal, token, row.id);

    expect(repository.setDefault).toHaveBeenCalledWith(token, principal.id, row.id);
    expect(company.isDefault).toBe(true);
  });
});
