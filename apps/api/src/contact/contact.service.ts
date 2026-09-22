import { createHmac } from 'node:crypto';

import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Environment } from '../config/environment.js';
import type { ContactRequestDto } from './dto/contact.dto.js';

@Injectable()
export class ContactService {
  constructor(@Inject(ConfigService) private readonly config: ConfigService<Environment, true>) {}
  async send(input: ContactRequestDto): Promise<void> {
    if (input.website) return;
    const url = this.config.get('CONTACT_WEBHOOK_URL', { infer: true });
    const secret = this.config.get('CONTACT_WEBHOOK_SECRET', { infer: true });
    if (!url || !secret)
      throw new ServiceUnavailableException('Contact service is not configured.');
    const body = JSON.stringify({
      name: input.name,
      email: input.email.toLowerCase(),
      subject: input.subject,
      message: input.message,
    });
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Factumation-Timestamp': timestamp,
          'X-Factumation-Signature': `sha256=${signature}`,
        },
        body,
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) throw new Error(`Contact webhook returned ${response.status}.`);
    } catch {
      throw new ServiceUnavailableException('Unable to send the contact request.');
    }
  }
}
