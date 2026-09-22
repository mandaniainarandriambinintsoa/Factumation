import { Inject, Injectable, Logger } from '@nestjs/common';

import { SupabaseClientFactory } from '../common/supabase/supabase-client.factory.js';

const BUCKET = 'document-pdfs';
const TEMPLATE_VERSION = 'v1';

@Injectable()
export class DocumentStorageGateway {
  private readonly logger = new Logger(DocumentStorageGateway.name);

  constructor(@Inject(SupabaseClientFactory) private readonly clients: SupabaseClientFactory) {}

  async getOrStore(
    accessToken: string,
    ownerId: string,
    kind: 'invoice' | 'quote',
    documentId: string,
    render: () => Promise<Uint8Array>,
  ): Promise<Uint8Array> {
    const client = this.clients.createForUser(accessToken);
    const path = `${ownerId}/${kind}s/${documentId}/${TEMPLATE_VERSION}.pdf`;
    const existing = await client.storage.from(BUCKET).download(path);
    if (existing.data) return new Uint8Array(await existing.data.arrayBuffer());

    const pdf = await render();
    const upload = await client.storage.from(BUCKET).upload(path, pdf, {
      contentType: 'application/pdf',
      cacheControl: '31536000',
      upsert: false,
    });
    if (upload.error) {
      const raced = await client.storage.from(BUCKET).download(path);
      if (raced.data) return new Uint8Array(await raced.data.arrayBuffer());
      this.logger.warn({
        message: 'PDF storage unavailable; returning the freshly rendered document.',
        kind,
        documentId,
        code: upload.error.name,
      });
    }
    return pdf;
  }
}
