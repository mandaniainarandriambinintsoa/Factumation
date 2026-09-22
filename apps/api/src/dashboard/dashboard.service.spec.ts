import { ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { DashboardRepository } from './dashboard.repository.js';
import { DashboardService } from './dashboard.service.js';

const summary = {
  invoices: { total: 8, draft: 0, issued: 0, sent: 0, paid: 8, cancelled: 0 },
  quotes: { total: 0, draft: 0, issued: 0, sent: 0, accepted: 0, rejected: 0, expired: 0 },
  clients: 4,
  revenueByCurrency: [{ currency: 'EUR', amount: '2340.00', count: 4 }],
  pendingByCurrency: [],
};

describe('DashboardService', () => {
  it('returns the owner-scoped dashboard summary', async () => {
    const repository = { getSummary: vi.fn().mockResolvedValue(summary) };
    const service = new DashboardService(repository as unknown as DashboardRepository);

    await expect(
      service.getSummary({ id: 'owner', role: 'authenticated' }, 'token'),
    ).resolves.toEqual(summary);
    expect(repository.getSummary).toHaveBeenCalledWith('token');
  });

  it('rejects integration credentials', async () => {
    const repository = { getSummary: vi.fn() };
    const service = new DashboardService(repository as unknown as DashboardRepository);

    await expect(
      service.getSummary({ id: 'owner', role: 'integration', authType: 'api-key' }, 'token'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('does not expose persistence errors', async () => {
    const repository = { getSummary: vi.fn().mockRejectedValue(new Error('database detail')) };
    const service = new DashboardService(repository as unknown as DashboardRepository);

    await expect(
      service.getSummary({ id: 'owner', role: 'authenticated' }, 'token'),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
