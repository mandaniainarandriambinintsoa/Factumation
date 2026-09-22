import { describe, expect, it, vi } from 'vitest';

import type { SupabaseClientFactory } from '../common/supabase/supabase-client.factory.js';
import { DocumentStorageGateway } from './document-storage.gateway.js';

function factoryWith(storage: {
  download: ReturnType<typeof vi.fn>;
  upload: ReturnType<typeof vi.fn>;
}): SupabaseClientFactory {
  return {
    createForUser: vi.fn(() => ({
      storage: { from: vi.fn(() => storage) },
    })),
  } as unknown as SupabaseClientFactory;
}

describe('DocumentStorageGateway', () => {
  it('returns an existing immutable PDF without rendering again', async () => {
    const bytes = new Uint8Array([37, 80, 68, 70]);
    const storage = {
      download: vi.fn().mockResolvedValue({ data: new Blob([bytes]), error: null }),
      upload: vi.fn(),
    };
    const render = vi.fn();

    const result = await new DocumentStorageGateway(factoryWith(storage)).getOrStore(
      'token',
      'owner-id',
      'invoice',
      'document-id',
      render,
    );

    expect(result).toEqual(bytes);
    expect(render).not.toHaveBeenCalled();
    expect(storage.download).toHaveBeenCalledWith('owner-id/invoices/document-id/v1.pdf');
  });

  it('renders and stores a missing PDF in the private owner path', async () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const storage = {
      download: vi.fn().mockResolvedValue({ data: null, error: { name: 'not-found' } }),
      upload: vi.fn().mockResolvedValue({ data: { path: 'stored' }, error: null }),
    };

    const result = await new DocumentStorageGateway(factoryWith(storage)).getOrStore(
      'token',
      'owner-id',
      'quote',
      'document-id',
      async () => bytes,
    );

    expect(result).toBe(bytes);
    expect(storage.upload).toHaveBeenCalledWith(
      'owner-id/quotes/document-id/v1.pdf',
      bytes,
      expect.objectContaining({ contentType: 'application/pdf', upsert: false }),
    );
  });
});
