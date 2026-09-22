import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Environment } from '../config/environment.js';
import type { DocumentPrintModel } from './document-pdf.js';

@Injectable()
export class DocumentEmailGateway {
  constructor(@Inject(ConfigService) private readonly config: ConfigService<Environment, true>) {}
  async send(
    accessToken: string,
    documentId: string,
    model: DocumentPrintModel,
    pdf: Uint8Array,
  ): Promise<void> {
    const url = `${this.config.get('SUPABASE_URL', { infer: true })}/functions/v1/send-email`;
    const key = this.config.get('SUPABASE_ANON_KEY', { infer: true });
    const deliveryKey =
      `document-${model.kind}-${documentId}-${model.number ?? model.draftReference ?? 'draft'}`.slice(
        0,
        128,
      );
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          apikey: key,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          type: model.kind,
          deliveryKey,
          data: {
            companyName: model.companyName,
            companyEmail: model.companyEmail,
            companyPhone: model.companyPhone,
            clientName: model.clientName,
            clientEmail: model.clientEmail,
            documentNumber: model.number ?? model.draftReference,
            documentDate: model.documentDate,
            ...(model.kind === 'invoice'
              ? { dueDate: model.secondDate }
              : { validityDate: model.secondDate }),
            currency: model.currency,
            paymentMethod: model.paymentMethod,
            amountDue: model.amountDue,
            items: model.items.map((item) => ({
              name: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
          pdfBase64: Buffer.from(pdf).toString('base64'),
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`Email provider returned ${response.status}.`);
    } catch {
      throw new ServiceUnavailableException('Unable to send the document email.');
    }
  }
}
