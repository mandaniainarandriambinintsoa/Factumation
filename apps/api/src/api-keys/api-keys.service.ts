import { createHmac, randomBytes } from 'node:crypto';

import {
  Inject,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Environment } from '../config/environment.js';
import type {
  ApiCredentialResponseDto,
  CreateApiCredentialDto,
  CreatedApiCredentialResponseDto,
  RotateApiCredentialDto,
} from './dto/api-key.dto.js';
import { ApiKeysRepository } from './api-keys.repository.js';

@Injectable()
export class ApiKeysService {
  constructor(
    @Inject(ApiKeysRepository) private readonly repository: ApiKeysRepository,
    @Inject(ConfigService) private readonly config: ConfigService<Environment, true>,
  ) {}

  async list(accessToken: string): Promise<ApiCredentialResponseDto[]> {
    try {
      return (await this.repository.list(accessToken)).map((row) => ({
        clientId: row.client_id,
        clientName: row.client_name,
        allowedCompanyIds: row.allowed_company_ids,
        keyId: row.key_id,
        prefix: row.prefix,
        scopes: row.scopes,
        expiresAt: row.expires_at,
        revokedAt: row.revoked_at,
        lastUsedAt: row.last_used_at,
        createdAt: row.created_at,
      }));
    } catch {
      throw new InternalServerErrorException('Unable to load API credentials.');
    }
  }

  async create(
    accessToken: string,
    input: CreateApiCredentialDto,
  ): Promise<CreatedApiCredentialResponseDto> {
    const credential = this.newCredential();
    try {
      const result = await this.repository.create(accessToken, {
        p_name: input.name,
        p_allowed_company_ids: input.allowedCompanyIds ?? [],
        p_prefix: credential.prefix,
        p_secret_hash: credential.hash,
        p_scopes: [...new Set(input.scopes)],
        p_expires_at: input.expiresAt ?? null,
      });
      return { clientId: result.client_id, keyId: result.key_id, apiKey: credential.raw };
    } catch {
      throw new InternalServerErrorException('Unable to create the API credential.');
    }
  }

  async rotate(
    accessToken: string,
    clientId: string,
    input: RotateApiCredentialDto,
  ): Promise<CreatedApiCredentialResponseDto> {
    const credential = this.newCredential();
    try {
      const keyId = await this.repository.rotate(accessToken, {
        p_client_id: clientId,
        p_prefix: credential.prefix,
        p_secret_hash: credential.hash,
        p_scopes: [...new Set(input.scopes)],
        p_expires_at: input.expiresAt ?? null,
      });
      return { clientId, keyId, apiKey: credential.raw };
    } catch {
      throw new InternalServerErrorException('Unable to rotate the API credential.');
    }
  }

  async revoke(accessToken: string, keyId: string): Promise<void> {
    try {
      await this.repository.revoke(accessToken, keyId);
    } catch {
      throw new InternalServerErrorException('Unable to revoke the API credential.');
    }
  }

  private newCredential(): { raw: string; prefix: string; hash: string } {
    const pepper = this.config.get('API_KEY_PEPPER', { infer: true });
    if (!pepper) throw new ServiceUnavailableException('External API access is not configured.');
    const prefix = randomBytes(9).toString('base64url').slice(0, 12);
    const raw = `fak_live_${prefix}.${randomBytes(32).toString('base64url')}`;
    return { raw, prefix, hash: createHmac('sha256', pepper).update(raw).digest('hex') };
  }
}
