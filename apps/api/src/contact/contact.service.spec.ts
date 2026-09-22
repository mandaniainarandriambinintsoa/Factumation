import type { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Environment } from '../config/environment.js';
import { ContactService } from './contact.service.js';

const input = {
  name: 'Ada Lovelace',
  email: 'ADA@EXAMPLE.COM',
  subject: 'Facturation',
  message: 'Je souhaite obtenir davantage d’informations.',
};
const webhookSecret = 'contact-webhook-secret-with-at-least-32-characters';
function serviceWith(url?: string, secret?: string) {
  const config = {
    get: vi.fn((key: keyof Environment) =>
      key === 'CONTACT_WEBHOOK_URL' ? url : key === 'CONTACT_WEBHOOK_SECRET' ? secret : undefined,
    ),
  } as unknown as ConfigService<Environment, true>;
  return new ContactService(config);
}

afterEach(() => vi.unstubAllGlobals());
describe('ContactService', () => {
  it('forwards only validated contact fields with a bounded request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(Date, 'now').mockReturnValue(1_795_000_000_000);
    await serviceWith('https://automation.example.com/contact', webhookSecret).send(input);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://automation.example.com/contact',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      ...input,
      email: 'ada@example.com',
    });
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = String(request.body);
    const headers = request.headers as Record<string, string>;
    expect(headers['X-Factumation-Timestamp']).toBe('1795000000');
    expect(headers['X-Factumation-Signature']).toBe(
      `sha256=${createHmac('sha256', webhookSecret).update(`1795000000.${body}`).digest('hex')}`,
    );
  });
  it('does not forward honeypot submissions', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await serviceWith('https://automation.example.com/contact', webhookSecret).send({
      ...input,
      website: 'spam.example',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('returns a stable unavailable error when integration is missing', async () => {
    await expect(serviceWith().send(input)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
import { createHmac } from 'node:crypto';
