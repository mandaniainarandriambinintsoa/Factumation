import { createHmac } from 'node:crypto';

import { HttpException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

import type { Environment } from '../config/environment.js';
import type { AuthPrincipal } from './auth-principal.js';

const KEY_PATTERN = /^fak_live_([a-zA-Z0-9]{12})\.([a-zA-Z0-9_-]{32,128})$/;
const resultSchema = z
  .array(
    z.object({
      key_id: z.string().uuid(),
      owner_id: z.string().uuid(),
      scopes: z.array(z.string()),
      allowed_company_ids: z.array(z.string().uuid()),
      rate_limited: z.boolean(),
    }),
  )
  .max(1);

export type ApiKeyAuthentication = {
  principal: AuthPrincipal;
  serviceRoleToken: string;
};

@Injectable()
export class ApiKeyAuthenticator {
  constructor(@Inject(ConfigService) private readonly config: ConfigService<Environment, true>) {}

  async verify(rawKey: string): Promise<ApiKeyAuthentication> {
    const match = KEY_PATTERN.exec(rawKey);
    const serviceRoleToken = this.config.get('SUPABASE_SERVICE_ROLE_KEY', { infer: true });
    const pepper = this.config.get('API_KEY_PEPPER', { infer: true });
    if (!match || !serviceRoleToken || !pepper)
      throw new UnauthorizedException('The API key is invalid.');

    const prefix = match[1]!;
    const hash = createHmac('sha256', pepper).update(rawKey).digest('hex');
    const client = createClient(
      this.config.get('SUPABASE_URL', { infer: true }),
      serviceRoleToken,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    const { data, error } = await client.rpc('authenticate_api_key', {
      p_prefix: prefix,
      p_secret_hash: hash,
    });
    if (error) throw new UnauthorizedException('The API key is invalid.');
    const parsed = resultSchema.safeParse(data);
    const record = parsed.success ? parsed.data[0] : undefined;
    if (!record) throw new UnauthorizedException('The API key is invalid.');
    if (record.rate_limited) throw new HttpException('API key rate limit exceeded.', 429);

    return {
      principal: {
        id: record.owner_id,
        role: 'integration',
        authType: 'api-key',
        apiKeyId: record.key_id,
        scopes: record.scopes,
        allowedCompanyIds: record.allowed_company_ids,
      },
      serviceRoleToken,
    };
  }
}
