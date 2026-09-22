import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { AuthPrincipal } from '../auth/auth-principal.js';
import type { ClientRow } from '../common/supabase/database.types.js';
import { ClientsRepository } from './clients.repository.js';
import { ClientsService } from './clients.service.js';

const principal: AuthPrincipal = {
  id: '8c5b87ec-b141-4bad-92e1-a848a6802dcf',
  role: 'authenticated',
};
const token = 'user-access-token';
const row: ClientRow = {
  id: 'a7139334-d07f-4cb7-b9b0-7c51ca81642d',
  user_id: principal.id,
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  address: null,
  phone: null,
  company_name: null,
  fiscal_region: 'EU',
  siret: null,
  vat_number: null,
  nif: null,
  stat: null,
  notes: null,
  created_at: '2026-09-21T12:00:00.000Z',
  updated_at: '2026-09-21T12:00:00.000Z',
};

function createService() {
  const repository = {
    create: vi.fn(),
    delete: vi.fn(),
    findById: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
  } as unknown as ClientsRepository;
  return { repository, service: new ClientsService(repository) };
}

describe('ClientsService', () => {
  it('derives ownership from the authenticated principal when creating', async () => {
    const { repository, service } = createService();
    vi.mocked(repository.create).mockResolvedValue(row);

    await service.create(principal, token, { name: 'Ada Lovelace', email: 'ADA@EXAMPLE.COM' });

    expect(repository.create).toHaveBeenCalledWith(
      token,
      expect.objectContaining({ user_id: principal.id, email: 'ada@example.com' }),
    );
  });

  it('always scopes reads to the principal owner id', async () => {
    const { repository, service } = createService();
    vi.mocked(repository.list).mockResolvedValue({ rows: [row], total: 1 });

    const result = await service.list(principal, token, { page: 1, limit: 20 });

    expect(repository.list).toHaveBeenCalledWith(
      expect.objectContaining({ ownerId: principal.id, accessToken: token }),
    );
    expect(result.items[0]?.email).toBe('ada@example.com');
  });

  it('returns not found when an owned row is absent', async () => {
    const { repository, service } = createService();
    vi.mocked(repository.findById).mockResolvedValue(null);

    await expect(service.findOne(principal, token, row.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects empty patches before data access', async () => {
    const { repository, service } = createService();

    await expect(service.update(principal, token, row.id, {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.update).not.toHaveBeenCalled();
  });
});
