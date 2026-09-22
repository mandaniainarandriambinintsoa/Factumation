import { createHmac } from 'node:crypto';

import type { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';

import type { Environment } from '../config/environment.js';
import type { ApiKeysRepository } from './api-keys.repository.js';
import { ApiKeysService } from './api-keys.service.js';

const pepper = 'a-production-grade-pepper-with-more-than-32-characters';

function service(repository: Partial<ApiKeysRepository>) {
  const config = {
    get: vi.fn((key: keyof Environment) => (key === 'API_KEY_PEPPER' ? pepper : undefined)),
  } as unknown as ConfigService<Environment, true>;
  return new ApiKeysService(repository as ApiKeysRepository, config);
}

describe('ApiKeysService', () => {
  it('returns a credential once and persists only its HMAC', async () => {
    const create = vi.fn().mockResolvedValue({ client_id: 'client-id', key_id: 'key-id' });
    const result = await service({ create }).create('user-token', {
      name: 'Accounting connector',
      scopes: ['invoices:read'],
      allowedCompanyIds: [],
    });

    expect(result.apiKey).toMatch(/^fak_live_[A-Za-z0-9_-]{12}\.[A-Za-z0-9_-]{43}$/);
    const values = create.mock.calls[0]?.[1] as { p_secret_hash: string; p_prefix: string };
    expect(values.p_secret_hash).toBe(
      createHmac('sha256', pepper).update(result.apiKey).digest('hex'),
    );
    expect(JSON.stringify(values)).not.toContain(result.apiKey);
    expect(result.apiKey).toContain(values.p_prefix);
  });

  it('keeps two overlapping credentials during rotation', async () => {
    const rotate = vi.fn().mockResolvedValue('new-key-id');
    const result = await service({ rotate }).rotate('user-token', 'client-id', {
      scopes: ['quotes:read'],
    });

    expect(result).toMatchObject({ clientId: 'client-id', keyId: 'new-key-id' });
    expect(rotate).toHaveBeenCalledOnce();
  });
});
