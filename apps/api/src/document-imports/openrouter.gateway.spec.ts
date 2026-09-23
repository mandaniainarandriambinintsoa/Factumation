import { ServiceUnavailableException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Environment } from '../config/environment.js';
import { OpenRouterGateway } from './openrouter.gateway.js';

const draft = {
  kind: 'invoice',
  client: {
    name: 'Client Test',
    companyName: null,
    email: 'client@example.com',
    phone: null,
    address: null,
    fiscalRegion: 'NONE',
    siret: null,
    vatNumber: null,
    nif: null,
    stat: null,
  },
  currency: 'EUR',
  documentDate: '2026-09-22',
  secondDate: '2026-10-22',
  taxMode: 'none',
  taxRate: '0',
  paymentMethod: null,
  notes: null,
  items: [{ description: 'Conseil', quantity: '2', unitPrice: '125' }],
};

function gateway(apiKey: string | null = 'openrouter-test-key-with-enough-characters') {
  const values: Partial<Environment> = {
    OPENROUTER_API_KEY: apiKey ?? undefined,
    OPENROUTER_EXTRACTION_MODEL: 'google/gemini-2.5-flash-lite',
    OPENROUTER_TRANSCRIPTION_MODEL: 'openai/gpt-4o-mini-transcribe',
    OPENROUTER_TIMEOUT_MS: 55_000,
  };
  const config = {
    get: vi.fn((key: keyof Environment) => values[key]),
  } as unknown as ConfigService<Environment, true>;
  return new OpenRouterGateway(config);
}

afterEach(() => vi.unstubAllGlobals());

describe('OpenRouterGateway', () => {
  it('requests strict structured output with privacy routing enabled', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        Response.json({ choices: [{ message: { content: JSON.stringify(draft) } }] }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const result = await gateway().extractText('Deux prestations de conseil.', 'invoice');

    expect(result.items[0]).toEqual({ description: 'Conseil', quantity: '2', unitPrice: '125' });
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(request.body)) as Record<string, unknown>;
    expect(body).toMatchObject({
      model: 'google/gemini-2.5-flash-lite',
      temperature: 0,
      provider: { require_parameters: true, data_collection: 'deny', zdr: true },
      response_format: { type: 'json_schema' },
    });
    expect(request.headers).toMatchObject({ Authorization: expect.stringMatching(/^Bearer /) });
  });

  it('uses the dedicated OpenRouter transcription endpoint', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ text: 'Une facture de 500 euros.' }));
    vi.stubGlobal('fetch', fetchMock);
    const file = {
      buffer: Buffer.from('audio'),
      mimetype: 'audio/webm',
      size: 5,
      originalname: 'voice.webm',
    };

    await expect(gateway().transcribe(file, 'webm')).resolves.toBe('Une facture de 500 euros.');
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://openrouter.ai/api/v1/audio/transcriptions');
  });

  it('fails closed when the server key is absent', async () => {
    await expect(gateway(null).extractText('test', 'quote')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
