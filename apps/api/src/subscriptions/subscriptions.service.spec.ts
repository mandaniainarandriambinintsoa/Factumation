import { describe, expect, it, vi } from 'vitest';

import type { AuthPrincipal } from '../auth/auth-principal.js';
import type { SubscriptionRow } from '../common/supabase/database.types.js';
import { SubscriptionsRepository } from './subscriptions.repository.js';
import { SubscriptionsService } from './subscriptions.service.js';

const principal: AuthPrincipal = {
  id: '8c5b87ec-b141-4bad-92e1-a848a6802dcf',
  role: 'authenticated',
};
const token = 'access-token';
const activePro: SubscriptionRow = {
  id: '88414737-e2d3-4b6e-9203-dff8472f5a46',
  user_id: principal.id,
  plan: 'pro',
  status: 'active',
  source: 'stripe',
  current_period_start: '2026-09-01T00:00:00.000Z',
  current_period_end: '2026-10-01T00:00:00.000Z',
  manual_expires_at: null,
  cancel_at_period_end: false,
  created_at: '2026-09-01T00:00:00.000Z',
  updated_at: '2026-09-01T00:00:00.000Z',
};

function createService() {
  const repository = {
    findForOwner: vi.fn(),
    usage: vi.fn(),
  } as unknown as SubscriptionsRepository;
  return { repository, service: new SubscriptionsService(repository) };
}

describe('SubscriptionsService', () => {
  it('returns the safe active plan without payment identifiers', async () => {
    const { repository, service } = createService();
    vi.mocked(repository.findForOwner).mockResolvedValue(activePro);
    const result = await service.get(principal, token);
    expect(repository.findForOwner).toHaveBeenCalledWith(token, principal.id);
    expect(result).toMatchObject({
      plan: 'pro',
      status: 'active',
      features: { invoicesPerMonth: -1, companies: 3 },
    });
    expect(result).not.toHaveProperty('id');
  });

  it('falls back to the free plan for missing or inactive subscriptions', async () => {
    const { repository, service } = createService();
    vi.mocked(repository.findForOwner).mockResolvedValue({
      ...activePro,
      plan: 'business',
      status: 'canceled',
    });
    await expect(service.get(principal, token)).resolves.toMatchObject({
      plan: 'free',
      status: 'canceled',
    });
  });

  it('loads owner-scoped monthly usage', async () => {
    const { repository, service } = createService();
    vi.mocked(repository.usage).mockResolvedValue({ invoices: 2, quotes: 1, companies: 1 });
    const result = await service.usage(principal, token);
    expect(repository.usage).toHaveBeenCalledWith(
      token,
      principal.id,
      expect.stringMatching(/T00:00:00\.000Z$/),
    );
    expect(result).toMatchObject({ invoices: 2, quotes: 1, companies: 1 });
  });
});
