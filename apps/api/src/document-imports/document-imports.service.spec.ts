import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { UploadedMedia } from './document-import.types.js';
import { DocumentImportsService } from './document-imports.service.js';
import type { OpenRouterGateway } from './openrouter.gateway.js';

const draft = {
  kind: 'invoice' as const,
  client: {
    name: 'Client Test',
    companyName: null,
    email: 'client@example.com',
    phone: null,
    address: null,
    fiscalRegion: 'NONE' as const,
    siret: null,
    vatNumber: null,
    nif: null,
    stat: null,
  },
  currency: 'EUR' as const,
  documentDate: '2026-09-22',
  secondDate: '2026-10-22',
  taxMode: 'none' as const,
  taxRate: '0',
  paymentMethod: 'Virement',
  notes: null,
  items: [{ description: 'Conseil', quantity: '2', unitPrice: '125' }],
};

function media(mimetype: string, buffer: Buffer): UploadedMedia {
  return { mimetype, buffer, size: buffer.length, originalname: 'capture' };
}

describe('DocumentImportsService', () => {
  it('validates an image signature before forwarding the media', async () => {
    const gateway = {
      extractImage: vi.fn().mockResolvedValue(draft),
    } as unknown as OpenRouterGateway;
    const service = new DocumentImportsService(gateway);
    const png = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.alloc(4),
    ]);

    const result = await service.fromImage(media('image/png', png), 'invoice');

    expect(gateway.extractImage).toHaveBeenCalledOnce();
    expect(result).toMatchObject({ source: 'image', draft, transcript: null, warnings: [] });
  });

  it('rejects a spoofed image MIME type', async () => {
    const gateway = { extractImage: vi.fn() } as unknown as OpenRouterGateway;
    const service = new DocumentImportsService(gateway);

    await expect(
      service.fromImage(media('image/png', Buffer.from('not-an-image')), 'invoice'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(gateway.extractImage).not.toHaveBeenCalled();
  });

  it('transcribes a browser WebM recording before extracting fields', async () => {
    const gateway = {
      transcribe: vi.fn().mockResolvedValue('Deux heures de conseil à 125 euros.'),
      extractText: vi.fn().mockResolvedValue(draft),
    } as unknown as OpenRouterGateway;
    const service = new DocumentImportsService(gateway);
    const webm = Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.alloc(8)]);

    const result = await service.fromVoice(media('audio/webm;codecs=opus', webm), 'invoice');

    expect(gateway.transcribe).toHaveBeenCalledWith(expect.any(Object), 'webm');
    expect(gateway.extractText).toHaveBeenCalledWith(
      'Deux heures de conseil à 125 euros.',
      'invoice',
    );
    expect(result.transcript).toBe('Deux heures de conseil à 125 euros.');
  });
});
