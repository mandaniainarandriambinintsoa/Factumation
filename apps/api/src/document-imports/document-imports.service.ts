import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type {
  DocumentImportDraft,
  DocumentImportResponse,
  DocumentKind,
} from '@factumation/contracts';

import { OpenRouterGateway } from './openrouter.gateway.js';
import type { UploadedMedia } from './document-import.types.js';

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const AUDIO_FORMAT_BY_MIME = new Map([
  ['audio/webm', 'webm'],
  ['audio/ogg', 'ogg'],
  ['audio/mpeg', 'mp3'],
  ['audio/mp3', 'mp3'],
  ['audio/mp4', 'm4a'],
  ['audio/x-m4a', 'm4a'],
  ['audio/wav', 'wav'],
  ['audio/x-wav', 'wav'],
  ['audio/aac', 'aac'],
]);

@Injectable()
export class DocumentImportsService {
  constructor(@Inject(OpenRouterGateway) private readonly openRouter: OpenRouterGateway) {}

  async fromImage(
    file: UploadedMedia | undefined,
    expectedKind: DocumentKind,
  ): Promise<DocumentImportResponse> {
    if (!file) throw new BadRequestException('Ajoutez une photo du document.');
    if (!IMAGE_MIME_TYPES.has(file.mimetype) || !this.hasValidImageSignature(file.buffer)) {
      throw new BadRequestException('La photo doit être au format JPEG, PNG ou WebP.');
    }
    const draft = await this.openRouter.extractImage(file, expectedKind);
    return this.response('image', draft, null, expectedKind);
  }

  async fromVoice(
    file: UploadedMedia | undefined,
    expectedKind: DocumentKind,
  ): Promise<DocumentImportResponse> {
    if (!file) throw new BadRequestException('Enregistrez un message vocal.');
    const format = AUDIO_FORMAT_BY_MIME.get(file.mimetype.split(';')[0] ?? '');
    if (!format || !this.hasValidAudioSignature(file.buffer, format)) {
      throw new BadRequestException(
        'Le format de cet enregistrement audio n’est pas pris en charge.',
      );
    }
    const transcript = await this.openRouter.transcribe(file, format);
    const draft = await this.openRouter.extractText(transcript, expectedKind);
    return this.response('voice', draft, transcript, expectedKind);
  }

  private response(
    source: 'image' | 'voice',
    draft: DocumentImportDraft,
    transcript: string | null,
    expectedKind: DocumentKind,
  ): DocumentImportResponse {
    const warnings: string[] = [];
    if (draft.kind && draft.kind !== expectedKind) {
      warnings.push(
        `Le document semble être ${draft.kind === 'invoice' ? 'une facture' : 'un devis'} ; vérifiez le type choisi.`,
      );
    }
    if (!draft.client.name) warnings.push('Nom du client à compléter.');
    if (!draft.client.email) warnings.push('Adresse e-mail du client à compléter.');
    if (!draft.items.length) warnings.push('Au moins une prestation doit être ajoutée.');
    if (!draft.documentDate) warnings.push('Date du document à vérifier.');
    const populated = [
      draft.client.name,
      draft.client.email,
      draft.currency,
      draft.documentDate,
      draft.secondDate,
      draft.paymentMethod,
      ...draft.items.flatMap((item) => [item.description, item.quantity, item.unitPrice]),
    ].filter(Boolean).length;
    const confidence = Math.min(1, populated / 9);
    return { source, draft, transcript, confidence, warnings };
  }

  private hasValidImageSignature(buffer: Buffer): boolean {
    if (buffer.length < 12) return false;
    const png = buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const jpeg = buffer[0]! === 0xff && buffer[1]! === 0xd8 && buffer[2]! === 0xff;
    const webp =
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP';
    return png || jpeg || webp;
  }

  private hasValidAudioSignature(buffer: Buffer, format: string): boolean {
    if (buffer.length < 12) return false;
    if (format === 'webm')
      return buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    if (format === 'ogg') return buffer.subarray(0, 4).toString('ascii') === 'OggS';
    if (format === 'wav')
      return (
        buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
        buffer.subarray(8, 12).toString('ascii') === 'WAVE'
      );
    if (format === 'm4a') return buffer.subarray(4, 8).toString('ascii') === 'ftyp';
    if (format === 'mp3')
      return (
        buffer.subarray(0, 3).toString('ascii') === 'ID3' ||
        (buffer[0]! === 0xff && (buffer[1]! & 0xe0) === 0xe0)
      );
    if (format === 'aac') return buffer[0]! === 0xff && (buffer[1]! & 0xf6) === 0xf0;
    return false;
  }
}
